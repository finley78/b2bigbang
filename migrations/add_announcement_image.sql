-- ─────────────────────────────────────────────────────────────────
-- 공지사항(announcements)에 카드 배경 이미지 컬럼 추가
-- 실행 위치: Supabase 콘솔 → SQL Editor
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image text;

-- 확인용
-- SELECT id, title, image, date FROM public.announcements ORDER BY created_at DESC;
