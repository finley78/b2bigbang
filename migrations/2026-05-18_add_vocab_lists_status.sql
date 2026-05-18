-- 단어장 '준비중/공개' 상태 컬럼
-- draft: 만들어 두기만 한 상태. 시험·연습 발행 불가, 목록에 '준비중' 회색 뱃지.
-- published: 공개. 학원 전체 또는 특정 반에서 사용 가능.

ALTER TABLE public.vocab_lists ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.vocab_lists DROP CONSTRAINT IF EXISTS vocab_lists_status_check;
ALTER TABLE public.vocab_lists ADD CONSTRAINT vocab_lists_status_check CHECK (status IN ('draft','published'));
