// 일회용 마이그레이션 함수 — Phase 2에서 1회 수행 완료.
// 외부 재호출 차단용 stub. 추후 Studio에서 완전 삭제 예정.
//
// (원래 구현: 기존 students 테이블에서 이메일 있고 auth_user_id NULL인 행을
//  Supabase Auth admin API로 일괄 백필. 1회만 필요한 작업이므로 이후 호출 불가.
//  히스토리 원본은 git log로 확인.)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error: 'one-shot completed',
      message: '이 함수는 1회 실행용이었으며 더 이상 호출할 수 없습니다.',
    }),
    { status: 410, headers: corsHeaders }
  );
});
