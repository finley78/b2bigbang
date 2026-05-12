-- 단어 시험 커트라인(합격) 점수
-- 학생 정답률(percentage)이 pass_score 이상이면 '합격', 미만이면 '불합격'으로 표시.
-- 0 = 커트라인 없음(기본). 응시 횟수 제한(attempts_allowed)은 별개로 동작 — 여기선 표시·권유만.
ALTER TABLE public.vocab_tests ADD COLUMN IF NOT EXISTS pass_score int4 NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_pass_score_chk CHECK (pass_score >= 0 AND pass_score <= 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.vocab_tests.pass_score IS '커트라인(합격) 점수 %. percentage >= pass_score 이면 합격. 0 = 커트라인 없음.';

NOTIFY pgrst, 'reload schema';
