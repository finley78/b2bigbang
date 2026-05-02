-- ─────────────────────────────────────────────────────────────────
-- 공지사항(announcements) 카드/상세 페이지에 CTA 버튼 추가
-- 실행 위치: Supabase 콘솔 → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- CTA 버튼에 보여줄 텍스트 (예: '신청하기', '상담받기')
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS cta text;

-- 클릭 시 이동할 내부 페이지 키 (예: 'contact') 또는 외부 URL
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS link_to text;

-- 확인용
-- SELECT id, title, cta, link_to FROM public.announcements;
