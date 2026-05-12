-- 앱 테스트 결과를 성적(test_scores)으로 자동 연결
-- 학생이 앱에서 테스트(exams: homework/weekly/monthly/level/class)를 응시·채점되면
-- test_scores 에 한 행(exam_id, student_id 유니크)을 upsert 한다. 종이 시험 직접 입력은 exam_id=NULL.
ALTER TABLE public.test_scores ADD COLUMN IF NOT EXISTS exam_id uuid;
COMMENT ON COLUMN public.test_scores.exam_id IS '앱 테스트(exams)에서 자동 생성된 성적이면 그 exam의 id. 종이 시험 등 직접 입력은 NULL.';
-- 비부분 유니크 인덱스: exam_id=NULL 행들은 NULL끼리 안 부딪힘(Postgres 기본) → 종이 시험 직접 입력 다중 행 OK. PostgREST upsert(onConflict)와 호환되려면 partial이 아니어야 함.
CREATE UNIQUE INDEX IF NOT EXISTS test_scores_exam_student_uniq ON public.test_scores (exam_id, student_id);
