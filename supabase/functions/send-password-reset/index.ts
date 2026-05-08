// DEPRECATED — Supabase Auth 이전(2026-05-09) 후 사용 중지.
// 앱은 이제 sb.auth.resetPasswordForEmail()을 직접 호출함.
// 이 함수는 잘못된 클라이언트 캐시 대응을 위해 410 Gone으로 응답.
// 추후 Supabase Studio에서 완전 삭제 예정.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error: 'deprecated',
      message: '이 엔드포인트는 더 이상 사용되지 않습니다. Supabase Auth의 resetPasswordForEmail을 이용해 주세요.',
    }),
    { status: 410, headers: corsHeaders }
  );
});
