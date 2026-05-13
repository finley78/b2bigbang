-- exams.material_type 추가
-- kind=material 자료실 자료 분류:
--   'exam'            — 시험·문제집 (기본, NULL도 이걸로 취급)
--   'vocab_list'      — 단어장 원본 (단어+뜻 엑셀)
--   'vocab_study_set' — 5단계 학습 세트 (단어시험 6시트 엑셀)
--   'other'           — 기타
-- 시험 발행 폼의 '자료실에서 불러오기' picker는 'exam'만 보여서, 단어장용 자료를 시험에
-- 잘못 끼우는 사고를 방지한다 (단어장 자료는 단어장 메뉴에서만 다룬다).

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS material_type text;

COMMENT ON COLUMN public.exams.material_type IS
'kind=material 자료실 자료 분류: exam(시험·문제집, 기본) / vocab_list(단어장 원본) / vocab_study_set(5단계 학습 세트) / other(기타). NULL이면 시험·문제집으로 취급.';
