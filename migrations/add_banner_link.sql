-- ─────────────────────────────────────────────────────────────────
-- 배너 CTA 클릭 시 이동할 페이지 / 외부 링크 / 상세 설명 컬럼 추가
-- 실행 위치: Supabase 콘솔 → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1) 이동할 내부 페이지 키 (예: 'contact', 'service', 'signup'...) 또는 외부 URL
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS link_to text;

-- 2) 상세 페이지에 보여줄 설명 (선택)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS description text;

-- 기존 배너의 기본값을 'contact'(문의)로 채워두고 싶으면 (선택):
-- UPDATE public.banners SET link_to = 'contact' WHERE link_to IS NULL;

-- 확인용
-- SELECT id, title, link_to, description FROM public.banners ORDER BY sort_order;
