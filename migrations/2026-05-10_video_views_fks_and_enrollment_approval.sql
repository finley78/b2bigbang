-- 2026-05-10 적용 완료 (Supabase에 이미 반영됨 — 이 파일은 기록용)
-- 1) video_views FK 추가 — 관리자/선생님 학습 현황의 PostgREST 임베드 조회(videos(...), courses(...), students(...))가 동작하도록
-- 2) enrollments.status 추가 — 학생 자가 수강신청 시 'pending'으로 생성, 관리자 승인 시 'approved' + is_active=true

-- ── video_views: 고아 행 1건 정리 후 FK 3개 추가 ──
DELETE FROM public.video_views vv
WHERE NOT EXISTS (SELECT 1 FROM public.videos v WHERE v.id = vv.video_id);

ALTER TABLE public.video_views
  ADD CONSTRAINT video_views_video_id_fkey
  FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

ALTER TABLE public.video_views
  ADD CONSTRAINT video_views_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE public.video_views
  ADD CONSTRAINT video_views_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- ── enrollments: 수강신청 승인 흐름 ──
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

UPDATE public.enrollments SET status = 'approved' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS enrollments_status_idx ON public.enrollments (status);

-- (student_id, course_id) 중복 수강행 방지 — UNIQUE 제약은 enrollments_student_id_course_id_key 로 이미 존재함 (추가 작업 불필요)

-- RLS 강화: 학생은 자기 행을 status='pending' & is_active=false 로만 생성/수정 가능 (UI 우회 자가 승인 차단). 관리자/선생님은 제약 없음.
DROP POLICY IF EXISTS enrollments_admin_teacher_write ON public.enrollments;
CREATE POLICY enrollments_staff_all ON public.enrollments FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());
CREATE POLICY enrollments_student_delete ON public.enrollments FOR DELETE TO public
  USING (student_id = public.current_student());
CREATE POLICY enrollments_student_insert ON public.enrollments FOR INSERT TO public
  WITH CHECK (student_id = public.current_student() AND status = 'pending' AND is_active = false);
CREATE POLICY enrollments_student_update ON public.enrollments FOR UPDATE TO public
  USING (student_id = public.current_student())
  WITH CHECK (student_id = public.current_student() AND status = 'pending' AND is_active = false);
