-- ─────────────────────────────────────────────────────────────────
-- 영상별 첨부파일 지원: attachments 테이블에 video_id 컬럼 추가
-- 실행 위치: Supabase 콘솔 → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1) attachments 테이블에 video_id 컬럼 추가 (영상이 삭제되면 첨부도 자동 삭제)
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE;

-- 2) 영상별 조회를 빠르게 하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_attachments_video_id
  ON public.attachments(video_id);

-- 3) 기존에 scope 컬럼에 CHECK 제약이 있다면 'video' 값을 허용하도록 갱신
--    (제약이 없으면 이 블록은 그냥 통과됨)
DO $$
BEGIN
  -- 기존 CHECK 제약이 있으면 삭제
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.attachments'::regclass
      AND contype = 'c'
      AND conname LIKE '%scope%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.attachments DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'public.attachments'::regclass
        AND contype = 'c'
        AND conname LIKE '%scope%'
      LIMIT 1
    );
  END IF;
END $$;

-- 4) 새 CHECK 제약: scope는 class | student | video 중 하나
ALTER TABLE public.attachments
  ADD CONSTRAINT attachments_scope_check
  CHECK (scope IN ('class', 'student', 'video'));

-- 확인용: 컬럼 잘 추가됐는지
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'attachments';
