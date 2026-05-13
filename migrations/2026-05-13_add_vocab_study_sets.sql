-- 단어장 유닛별 5단계 학습 세트 저장 테이블
-- 1단계: 단어 객관식 (50문항 정도) — 단어 보고 한국어 뜻 5지선다
-- 2단계: 예문 해석 객관식 (8문항 정도) — 영어 예문 → 한국어 해석 5지선다
-- 2.5단계: 빈칸 객관식 (8문항 정도) — 빈칸에 들어갈 영어 단어 5지선다
-- 3단계: 영작 빈칸 (8문항 정도) — 한국어 보고 영문 빈칸 채우기
-- 어법: 객관식 (7문항 정도) — [대괄호] 부분의 문법 설명 5지선다
--
-- 한 단어장의 한 유닛마다 학습 세트 1개. 업로드는 6시트 엑셀로.
-- 각 stage*는 jsonb 배열로 문항 객체 저장 (구조는 업로드 파서가 결정).

CREATE TABLE IF NOT EXISTS public.vocab_study_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.vocab_lists(id) ON DELETE CASCADE,
  unit_index integer NOT NULL,
  title text,                       -- 메타.세트명 (예: "1~50번")
  description text,                 -- 메타.설명
  stage1 jsonb DEFAULT '[]'::jsonb, -- 단어 객관식
  stage2 jsonb DEFAULT '[]'::jsonb, -- 예문 해석 객관식
  stage25 jsonb DEFAULT '[]'::jsonb,-- 빈칸 객관식
  stage3 jsonb DEFAULT '[]'::jsonb, -- 영작 빈칸
  grammar jsonb DEFAULT '[]'::jsonb,-- 어법 객관식
  source_file_name text,            -- 업로드한 원본 파일명 (자료실 보관용 메타)
  created_by uuid,                  -- 올린 선생님/관리자 (FK 없음 — students.id 또는 NULL)
  creator_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(list_id, unit_index)
);

CREATE INDEX IF NOT EXISTS idx_vocab_study_sets_list ON public.vocab_study_sets(list_id);

-- RLS: 단어시험 도구는 학원 내부용이라 일단 인증된 모든 사용자 읽기·쓰기 허용
-- (다른 vocab_* 테이블과 같은 정책)
ALTER TABLE public.vocab_study_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocab_study_sets_select_all"
  ON public.vocab_study_sets FOR SELECT
  USING (true);

CREATE POLICY "vocab_study_sets_insert_auth"
  ON public.vocab_study_sets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "vocab_study_sets_update_auth"
  ON public.vocab_study_sets FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "vocab_study_sets_delete_auth"
  ON public.vocab_study_sets FOR DELETE
  USING (auth.uid() IS NOT NULL);
