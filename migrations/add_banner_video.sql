-- ─────────────────────────────────────────────────────────────────
-- 배너에 직접 업로드한 동영상(MP4 등) 지원
-- 실행 위치: Supabase 콘솔 → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- banners 테이블에 video_url 컬럼 추가 (Supabase Storage public URL을 저장)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS video_url text;

-- (선택) 기존 youtube 컬럼은 그대로 둠 — 유튜브는 그것대로 쓸 수 있게
-- (선택) 파일 자체는 attachments 버킷의 'banners/<banner_id>/...' 경로에 업로드됨

-- 확인용
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='banners';
