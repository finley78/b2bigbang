// Phase 2 — 기존 students(이메일 있음·auth_user_id NULL)을 auth.users로 백필
// 멱등(idempotent) — 이미 처리된 행은 건너뜀
// 호출: POST 또는 GET. 인증 없음 (멱등이라 안전)
// 응답: { migrated: [...], errors: [...], skipped_no_email_count }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

function randPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  // base64url로 변환 + 추가 복잡도 보장 (대문자·소문자·숫자·기호)
  let s = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return s + '!Aa1';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 미마이그레이션 학생/선생/관리자 조회
    const { data: pending, error: queryError } = await supabase
      .from('students')
      .select('id, name, email, role, password_hash')
      .not('email', 'is', null)
      .neq('email', '')
      .is('auth_user_id', null);

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), { status: 500, headers: corsHeaders });
    }

    const migrated: any[] = [];
    const errors: any[] = [];

    for (const stu of (pending || [])) {
      const email = String(stu.email).trim().toLowerCase();
      try {
        // 이미 같은 이메일의 auth.users가 있는지 먼저 확인 (재실행 안전)
        const { data: existingAuth } = await supabase.auth.admin.listUsers();
        const matchExisting = existingAuth?.users?.find((u: any) => (u.email || '').toLowerCase() === email);

        let authUserId: string;

        if (matchExisting) {
          authUserId = matchExisting.id;
        } else {
          // 새 auth.users 생성
          const tempPw = randPassword();
          const { data: created, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: tempPw,
            email_confirm: true,
            user_metadata: { name: stu.name || '', role: stu.role || 'student' },
          });
          if (createError) throw new Error('createUser: ' + createError.message);
          if (!created?.user?.id) throw new Error('createUser: no user.id returned');
          authUserId = created.user.id;
        }

        // 트리거가 자동 연결했어야 하지만, 안전하게 확인 후 누락이면 수동 연결
        const { data: linkedRow } = await supabase
          .from('students')
          .select('auth_user_id')
          .eq('id', stu.id)
          .single();

        if (!linkedRow?.auth_user_id || linkedRow.auth_user_id !== authUserId) {
          const { error: updateErr } = await supabase
            .from('students')
            .update({ auth_user_id: authUserId })
            .eq('id', stu.id);
          if (updateErr) throw new Error('link update: ' + updateErr.message);
        }

        // 비밀번호가 있던 사용자는 recovery link 생성 (Phase 3 배포 후 발송용)
        let recoveryLink: string | null = null;
        if (stu.password_hash) {
          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email,
          });
          if (!linkError) recoveryLink = linkData?.properties?.action_link || null;
        }

        migrated.push({
          students_id: stu.id,
          auth_user_id: authUserId,
          email,
          name: stu.name,
          role: stu.role,
          had_password: !!stu.password_hash,
          linked_existing_auth: !!matchExisting,
          recovery_link: recoveryLink,
        });
      } catch (e: any) {
        errors.push({ email, students_id: stu.id, error: String(e?.message || e) });
      }
    }

    // 마이그레이션 카운트 (이메일 없는 행)
    const { count: skippedCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .or('email.is.null,email.eq.');

    return new Response(
      JSON.stringify({
        migrated,
        migrated_count: migrated.length,
        errors,
        error_count: errors.length,
        skipped_no_email_count: skippedCount || 0,
      }, null, 2),
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
