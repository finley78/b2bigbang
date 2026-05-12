-- 자료실 도서관화: exams 에 material_id 추가
-- kind='material' 인 exams 행 = 자료실 "분석 자료" (시험지+답안지 + Claude 문항 분석). class_id NULL.
-- 시험/숙제를 그 자료에서 만들면 exams.material_id 에 자료 id 를 넣고 image_paths/answer_paths 를 공유 참조한다.
-- → material_id 가 있으면 시험 삭제 시 storage 파일은 지우지 않는다(자료가 계속 쓰므로).
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS material_id uuid;
COMMENT ON COLUMN public.exams.material_id IS 'kind=material 자료(자료실 도서관)에서 만들어진 시험/숙제면 그 자료의 id. NULL이면 직접 만든 것.';
