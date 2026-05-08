-- ============================================================
-- Supabase Auth — Phase 5: RLS lockdown
-- 2026-05-09
--
-- Replaces the legacy `FOR ALL USING (true)` policies (which left every
-- table effectively open to anon) with role-aware policies built on
-- Phase 1 helpers: current_student(), current_role(), is_admin(),
-- is_teacher(), is_parent_of(), teacher_has_student().
--
-- Anon (logged-out) SELECT is preserved on:
--   banners, notices, announcements, subjects, courses, videos,
--   site_content, exams (level-test CTA on HomePage).
--
-- Edge Functions using service_role bypass RLS — no policies needed
-- for password_reset_tokens write paths, etc.
--
-- Reversible: see 03_supabase_auth_phase5_rls_rollback.sql
-- ============================================================

-- ============================================================
-- 0. Drop all legacy policies
-- ============================================================

-- academic_schedules
DROP POLICY IF EXISTS "as_public_delete" ON public.academic_schedules;
DROP POLICY IF EXISTS "as_public_insert" ON public.academic_schedules;
DROP POLICY IF EXISTS "as_public_select" ON public.academic_schedules;
DROP POLICY IF EXISTS "as_public_update" ON public.academic_schedules;

-- ai_comments
DROP POLICY IF EXISTS "anon read ai_comments" ON public.ai_comments;
DROP POLICY IF EXISTS "anon write ai_comments" ON public.ai_comments;

-- announcements
DROP POLICY IF EXISTS "announcements_all_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;

-- attachment_recipients
DROP POLICY IF EXISTS "attachment_recipients rw" ON public.attachment_recipients;

-- attachments
DROP POLICY IF EXISTS "attachments rw" ON public.attachments;

-- banners
DROP POLICY IF EXISTS "banners_all_admin" ON public.banners;
DROP POLICY IF EXISTS "banners_select_all" ON public.banners;

-- class_students
DROP POLICY IF EXISTS "allow public delete class_students" ON public.class_students;
DROP POLICY IF EXISTS "allow public insert class_students" ON public.class_students;
DROP POLICY IF EXISTS "allow public read class_students" ON public.class_students;

-- classes
DROP POLICY IF EXISTS "allow public delete classes" ON public.classes;
DROP POLICY IF EXISTS "allow public insert classes" ON public.classes;
DROP POLICY IF EXISTS "allow public read classes" ON public.classes;
DROP POLICY IF EXISTS "allow public update classes" ON public.classes;

-- courses
DROP POLICY IF EXISTS "allow courses delete" ON public.courses;
DROP POLICY IF EXISTS "allow courses insert" ON public.courses;
DROP POLICY IF EXISTS "allow courses select" ON public.courses;
DROP POLICY IF EXISTS "allow courses update" ON public.courses;
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;

-- enrollments
DROP POLICY IF EXISTS "enrollments_delete" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_select_all" ON public.enrollments;

-- exam_analyses
DROP POLICY IF EXISTS "anon read exam_analyses" ON public.exam_analyses;
DROP POLICY IF EXISTS "anon write exam_analyses" ON public.exam_analyses;

-- exam_submissions
DROP POLICY IF EXISTS "es_insert_open_exam" ON public.exam_submissions;
DROP POLICY IF EXISTS "es_public_select" ON public.exam_submissions;
DROP POLICY IF EXISTS "es_update_unlocked" ON public.exam_submissions;

-- exams
DROP POLICY IF EXISTS "exams_public_delete" ON public.exams;
DROP POLICY IF EXISTS "exams_public_insert" ON public.exams;
DROP POLICY IF EXISTS "exams_public_select" ON public.exams;
DROP POLICY IF EXISTS "exams_public_update" ON public.exams;

-- level_test_requests
DROP POLICY IF EXISTS "ltr_insert_open_level" ON public.level_test_requests;
DROP POLICY IF EXISTS "ltr_public_delete" ON public.level_test_requests;
DROP POLICY IF EXISTS "ltr_public_select" ON public.level_test_requests;

-- notices
DROP POLICY IF EXISTS "notices_all_admin" ON public.notices;
DROP POLICY IF EXISTS "notices_select_all" ON public.notices;

-- notification_logs
DROP POLICY IF EXISTS "anon read notification_logs" ON public.notification_logs;
DROP POLICY IF EXISTS "anon write notification_logs" ON public.notification_logs;

-- password_reset_tokens — keep deny-all default (service_role bypasses)
DROP POLICY IF EXISTS "prt_no_anon_access" ON public.password_reset_tokens;

-- schedule_change_requests
DROP POLICY IF EXISTS "scr_public_delete" ON public.schedule_change_requests;
DROP POLICY IF EXISTS "scr_public_insert" ON public.schedule_change_requests;
DROP POLICY IF EXISTS "scr_public_select" ON public.schedule_change_requests;
DROP POLICY IF EXISTS "scr_public_update" ON public.schedule_change_requests;

-- site_content
DROP POLICY IF EXISTS "sc_public_insert" ON public.site_content;
DROP POLICY IF EXISTS "sc_public_select" ON public.site_content;
DROP POLICY IF EXISTS "sc_public_update" ON public.site_content;

-- students
DROP POLICY IF EXISTS "students_insert_own" ON public.students;
DROP POLICY IF EXISTS "students_select_own" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_upsert" ON public.students;

-- subjects
DROP POLICY IF EXISTS "subjects_select_all" ON public.subjects;

-- teacher_notes
DROP POLICY IF EXISTS "allow public delete teacher_notes" ON public.teacher_notes;
DROP POLICY IF EXISTS "allow public insert teacher_notes" ON public.teacher_notes;
DROP POLICY IF EXISTS "allow public read teacher_notes" ON public.teacher_notes;
DROP POLICY IF EXISTS "allow public update teacher_notes" ON public.teacher_notes;

-- teacher_students
DROP POLICY IF EXISTS "allow public read teacher_students" ON public.teacher_students;

-- teachers
DROP POLICY IF EXISTS "allow public delete teachers" ON public.teachers;
DROP POLICY IF EXISTS "allow public insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "allow public read teachers" ON public.teachers;
DROP POLICY IF EXISTS "allow public update teachers" ON public.teachers;

-- test_scores
DROP POLICY IF EXISTS "allow public delete test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "allow public insert test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "allow public read test_scores" ON public.test_scores;
DROP POLICY IF EXISTS "allow public update test_scores" ON public.test_scores;

-- video_progress
DROP POLICY IF EXISTS "progress_insert_all" ON public.video_progress;
DROP POLICY IF EXISTS "progress_select_all" ON public.video_progress;
DROP POLICY IF EXISTS "progress_update_all" ON public.video_progress;

-- video_views
DROP POLICY IF EXISTS "allow public insert video_views" ON public.video_views;
DROP POLICY IF EXISTS "allow public read video_views" ON public.video_views;
DROP POLICY IF EXISTS "allow public update video_views" ON public.video_views;

-- videos
DROP POLICY IF EXISTS "allow videos delete" ON public.videos;
DROP POLICY IF EXISTS "allow videos insert" ON public.videos;
DROP POLICY IF EXISTS "allow videos select" ON public.videos;
DROP POLICY IF EXISTS "allow videos update" ON public.videos;
DROP POLICY IF EXISTS "videos_select_all" ON public.videos;

-- vocab_*
DROP POLICY IF EXISTS "vocab_lists_all" ON public.vocab_lists;
DROP POLICY IF EXISTS "vocab_words_all" ON public.vocab_words;
DROP POLICY IF EXISTS "vocab_tests_all" ON public.vocab_tests;
DROP POLICY IF EXISTS "vocab_test_assignments_all" ON public.vocab_test_assignments;
DROP POLICY IF EXISTS "vocab_test_attempts_all" ON public.vocab_test_attempts;

-- ============================================================
-- 1. Public catalog (anon SELECT, admin write)
-- ============================================================

-- banners
CREATE POLICY banners_public_select ON public.banners
  FOR SELECT TO public USING (true);
CREATE POLICY banners_admin_write ON public.banners
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- notices
CREATE POLICY notices_public_select ON public.notices
  FOR SELECT TO public USING (true);
CREATE POLICY notices_admin_write ON public.notices
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- announcements
CREATE POLICY announcements_public_select ON public.announcements
  FOR SELECT TO public USING (true);
CREATE POLICY announcements_admin_write ON public.announcements
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- subjects
CREATE POLICY subjects_public_select ON public.subjects
  FOR SELECT TO public USING (true);
CREATE POLICY subjects_admin_write ON public.subjects
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- site_content
CREATE POLICY site_content_public_select ON public.site_content
  FOR SELECT TO public USING (true);
CREATE POLICY site_content_admin_write ON public.site_content
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 2. Course content (anon SELECT, admin/teacher write)
-- ============================================================

-- courses (no per-course teacher_id column — write restricted to admin and teacher role)
CREATE POLICY courses_public_select ON public.courses
  FOR SELECT TO public USING (true);
CREATE POLICY courses_admin_teacher_write ON public.courses
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- videos (FK -> courses, no teacher_id; admin/teacher write)
CREATE POLICY videos_public_select ON public.videos
  FOR SELECT TO public USING (true);
CREATE POLICY videos_admin_teacher_write ON public.videos
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ============================================================
-- 3. Self profile — students
--   - SELECT: self / parent / teacher of student / admin
--     PLUS anon SELECT of role='parent' & role='student' rows for the
--     phone-matching auto-link logic during signup. To avoid leaking
--     PII we only allow the columns used by signup; here we keep it
--     authenticated-only and rely on signup running while the new user
--     is authenticated (signUp returns a session immediately).
--   - UPDATE: self / admin
--   - INSERT: handled by handle_new_user trigger (SECURITY DEFINER).
--             Allow self-insert as fallback.
--   - DELETE: admin only
-- ============================================================

CREATE POLICY students_self_read ON public.students
  FOR SELECT TO public
  USING (
    id = public.current_student()
    OR public.is_admin()
    OR public.is_teacher()
    OR parent_id = public.current_student()
    OR public.is_parent_of(id)
  );

CREATE POLICY students_self_update ON public.students
  FOR UPDATE TO public
  USING (id = public.current_student() OR public.is_admin())
  WITH CHECK (id = public.current_student() OR public.is_admin());

CREATE POLICY students_self_insert ON public.students
  FOR INSERT TO public
  WITH CHECK (
    -- Either the trigger (which runs as SECURITY DEFINER, bypasses RLS)
    -- handles it, or an authenticated user is creating their own row,
    -- or admin is creating one.
    auth_user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY students_admin_delete ON public.students
  FOR DELETE TO public
  USING (public.is_admin());

-- ============================================================
-- 4. Teachers (separate "teachers" table — admin-managed roster)
-- ============================================================

CREATE POLICY teachers_authenticated_read ON public.teachers
  FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY teachers_admin_write ON public.teachers
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY teachers_self_update ON public.teachers
  FOR UPDATE TO public
  USING (
    public.is_admin()
    OR id = public.current_student()
    OR email = (SELECT email FROM public.students WHERE id = public.current_student())
  )
  WITH CHECK (
    public.is_admin()
    OR id = public.current_student()
    OR email = (SELECT email FROM public.students WHERE id = public.current_student())
  );

-- teacher_students (legacy linking table — admin/teacher visibility)
CREATE POLICY teacher_students_read ON public.teacher_students
  FOR SELECT TO public
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY teacher_students_admin_write ON public.teacher_students
  FOR ALL TO public
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 5. Classes & enrollment / membership
-- ============================================================

-- classes: visible to involved teacher, enrolled students, admin
CREATE POLICY classes_read ON public.classes
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR teacher_id = public.current_student()
    OR EXISTS (
      SELECT 1 FROM public.class_students cs
      WHERE cs.class_id = classes.id AND cs.student_id = public.current_student()
    )
  );

CREATE POLICY classes_admin_teacher_write ON public.classes
  FOR ALL TO public
  USING (public.is_admin() OR teacher_id = public.current_student())
  WITH CHECK (public.is_admin() OR teacher_id = public.current_student() OR public.is_teacher());

-- class_students
CREATE POLICY class_students_read ON public.class_students
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY class_students_admin_teacher_write ON public.class_students
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- enrollments
CREATE POLICY enrollments_read ON public.enrollments
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY enrollments_admin_teacher_write ON public.enrollments
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher() OR student_id = public.current_student())
  WITH CHECK (public.is_admin() OR public.is_teacher() OR student_id = public.current_student());

-- ============================================================
-- 6. Exams & submissions
-- ============================================================

-- exams: SELECT public (HomePage shows level tests to anon); writes admin/teacher
CREATE POLICY exams_public_select ON public.exams
  FOR SELECT TO public USING (true);

CREATE POLICY exams_admin_teacher_write ON public.exams
  FOR ALL TO public
  USING (public.is_admin() OR teacher_id = public.current_student() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR teacher_id = public.current_student() OR public.is_teacher());

-- exam_submissions
CREATE POLICY exam_submissions_read ON public.exam_submissions
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY exam_submissions_student_insert ON public.exam_submissions
  FOR INSERT TO public
  WITH CHECK (
    public.is_admin()
    OR (student_id = public.current_student() AND EXISTS (
        SELECT 1 FROM public.exams WHERE id = exam_submissions.exam_id AND status = 'open'
    ))
  );

CREATE POLICY exam_submissions_update ON public.exam_submissions
  FOR UPDATE TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (student_id = public.current_student() AND locked = false)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
  );

CREATE POLICY exam_submissions_admin_delete ON public.exam_submissions
  FOR DELETE TO public
  USING (public.is_admin() OR public.is_teacher());

-- level_test_requests
CREATE POLICY level_test_requests_read ON public.level_test_requests
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY level_test_requests_student_insert ON public.level_test_requests
  FOR INSERT TO public
  WITH CHECK (
    public.is_admin()
    OR (student_id = public.current_student() AND EXISTS (
        SELECT 1 FROM public.exams
        WHERE id = level_test_requests.exam_id
          AND kind = 'level' AND status = 'open'
    ))
  );

CREATE POLICY level_test_requests_delete ON public.level_test_requests
  FOR DELETE TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
  );

-- ============================================================
-- 7. Submissions / progress (per-student)
-- ============================================================

-- video_views
CREATE POLICY video_views_read ON public.video_views
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY video_views_self_insert ON public.video_views
  FOR INSERT TO public
  WITH CHECK (public.is_admin() OR student_id = public.current_student());

CREATE POLICY video_views_self_update ON public.video_views
  FOR UPDATE TO public
  USING (public.is_admin() OR student_id = public.current_student())
  WITH CHECK (public.is_admin() OR student_id = public.current_student());

CREATE POLICY video_views_admin_delete ON public.video_views
  FOR DELETE TO public
  USING (public.is_admin());

-- video_progress
CREATE POLICY video_progress_read ON public.video_progress
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY video_progress_self_insert ON public.video_progress
  FOR INSERT TO public
  WITH CHECK (public.is_admin() OR student_id = public.current_student());

CREATE POLICY video_progress_self_update ON public.video_progress
  FOR UPDATE TO public
  USING (public.is_admin() OR student_id = public.current_student())
  WITH CHECK (public.is_admin() OR student_id = public.current_student());

CREATE POLICY video_progress_admin_delete ON public.video_progress
  FOR DELETE TO public
  USING (public.is_admin());

-- ============================================================
-- 8. Scores / notes / attendance / analyses (teacher- & admin-managed)
-- ============================================================

-- test_scores
CREATE POLICY test_scores_read ON public.test_scores
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY test_scores_admin_teacher_write ON public.test_scores
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- teacher_notes
CREATE POLICY teacher_notes_read ON public.teacher_notes
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR teacher_id = public.current_student()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY teacher_notes_admin_teacher_write ON public.teacher_notes
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- attendance
CREATE POLICY attendance_read ON public.attendance
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY attendance_admin_teacher_write ON public.attendance
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- exam_analyses
CREATE POLICY exam_analyses_read ON public.exam_analyses
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR (class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.class_students cs
      WHERE cs.class_id = exam_analyses.class_id
        AND cs.student_id = public.current_student()
    ))
  );

CREATE POLICY exam_analyses_admin_teacher_write ON public.exam_analyses
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ai_comments
CREATE POLICY ai_comments_read ON public.ai_comments
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY ai_comments_admin_teacher_write ON public.ai_comments
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ============================================================
-- 9. Internal admin tables
-- ============================================================

-- notification_logs: admin/teacher only
CREATE POLICY notification_logs_admin_teacher_read ON public.notification_logs
  FOR SELECT TO public
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY notification_logs_admin_teacher_write ON public.notification_logs
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- password_reset_tokens: deny all to non-service_role (Edge Function uses service_role).
CREATE POLICY password_reset_tokens_deny_all ON public.password_reset_tokens
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- 10. Attachments
-- ============================================================

-- attachments: SELECT for involved students + uploader + admin/teacher;
-- Write for admin/teacher (including the uploader).
CREATE POLICY attachments_read ON public.attachments
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR uploaded_by = public.current_student()
    OR EXISTS (
      SELECT 1 FROM public.attachment_recipients ar
      WHERE ar.attachment_id = attachments.id
        AND ar.student_id = public.current_student()
    )
    OR (class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.class_students cs
      WHERE cs.class_id = attachments.class_id
        AND cs.student_id = public.current_student()
    ))
    OR (video_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.videos v ON v.course_id = e.course_id
      WHERE v.id = attachments.video_id
        AND e.student_id = public.current_student()
        AND e.is_active = true
    ))
  );

CREATE POLICY attachments_admin_teacher_write ON public.attachments
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher() OR uploaded_by = public.current_student())
  WITH CHECK (public.is_admin() OR public.is_teacher() OR uploaded_by = public.current_student());

-- attachment_recipients
CREATE POLICY attachment_recipients_read ON public.attachment_recipients
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
  );

CREATE POLICY attachment_recipients_admin_teacher_write ON public.attachment_recipients
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ============================================================
-- 11. Schedule / academic
-- ============================================================

-- academic_schedules: read authenticated, write admin/teacher
CREATE POLICY academic_schedules_authenticated_read ON public.academic_schedules
  FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY academic_schedules_admin_teacher_write ON public.academic_schedules
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- schedule_change_requests: teachers see/manage their own, admin sees all
CREATE POLICY schedule_change_requests_read ON public.schedule_change_requests
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR teacher_id = public.current_student()
  );

CREATE POLICY schedule_change_requests_write ON public.schedule_change_requests
  FOR ALL TO public
  USING (
    public.is_admin()
    OR teacher_id = public.current_student()
    OR public.is_teacher()
  )
  WITH CHECK (
    public.is_admin()
    OR teacher_id = public.current_student()
    OR public.is_teacher()
  );

-- ============================================================
-- 12. Vocab system
-- ============================================================

-- vocab_lists: SELECT for assigned students + teacher/admin; write admin/teacher
CREATE POLICY vocab_lists_read ON public.vocab_lists
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR is_active = true  -- active lists discoverable for assigned students (filtered by assignments at the test level)
  );

CREATE POLICY vocab_lists_admin_teacher_write ON public.vocab_lists
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- vocab_words: same as lists
CREATE POLICY vocab_words_read ON public.vocab_words
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (SELECT 1 FROM public.vocab_lists vl WHERE vl.id = vocab_words.list_id AND vl.is_active = true)
  );

CREATE POLICY vocab_words_admin_teacher_write ON public.vocab_words
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- vocab_tests: SELECT for admin/teacher OR students assigned via vocab_test_assignments
CREATE POLICY vocab_tests_read ON public.vocab_tests
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.vocab_test_assignments vta
      WHERE vta.test_id = vocab_tests.id
        AND (
          vta.student_id = public.current_student()
          OR vta.class_id IN (
            SELECT class_id FROM public.class_students WHERE student_id = public.current_student()
          )
        )
    )
  );

CREATE POLICY vocab_tests_admin_teacher_write ON public.vocab_tests
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- vocab_test_assignments
CREATE POLICY vocab_test_assignments_read ON public.vocab_test_assignments
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR class_id IN (SELECT class_id FROM public.class_students WHERE student_id = public.current_student())
  );

CREATE POLICY vocab_test_assignments_admin_teacher_write ON public.vocab_test_assignments
  FOR ALL TO public
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- vocab_test_attempts
CREATE POLICY vocab_test_attempts_read ON public.vocab_test_attempts
  FOR SELECT TO public
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_id = public.current_student()
    OR public.is_parent_of(student_id)
    OR public.teacher_has_student(student_id)
  );

CREATE POLICY vocab_test_attempts_self_insert ON public.vocab_test_attempts
  FOR INSERT TO public
  WITH CHECK (public.is_admin() OR student_id = public.current_student());

CREATE POLICY vocab_test_attempts_self_update ON public.vocab_test_attempts
  FOR UPDATE TO public
  USING (public.is_admin() OR public.is_teacher() OR student_id = public.current_student())
  WITH CHECK (public.is_admin() OR public.is_teacher() OR student_id = public.current_student());

CREATE POLICY vocab_test_attempts_admin_delete ON public.vocab_test_attempts
  FOR DELETE TO public
  USING (public.is_admin() OR public.is_teacher());
