-- ============================================================
-- Phase 5 RLS lockdown — ROLLBACK
-- 2026-05-09
--
-- Drops all Phase-5 tightened policies and recreates the original
-- permissive `FOR ALL USING (true)` (or equivalent split) policies
-- so the app continues to work exactly as before Phase 5.
--
-- Apply only if Phase 5 broke production.
-- ============================================================

-- ============================================================
-- 0. Drop new Phase-5 policies
-- ============================================================
DROP POLICY IF EXISTS banners_public_select ON public.banners;
DROP POLICY IF EXISTS banners_admin_write ON public.banners;
DROP POLICY IF EXISTS notices_public_select ON public.notices;
DROP POLICY IF EXISTS notices_admin_write ON public.notices;
DROP POLICY IF EXISTS announcements_public_select ON public.announcements;
DROP POLICY IF EXISTS announcements_admin_write ON public.announcements;
DROP POLICY IF EXISTS subjects_public_select ON public.subjects;
DROP POLICY IF EXISTS subjects_admin_write ON public.subjects;
DROP POLICY IF EXISTS site_content_public_select ON public.site_content;
DROP POLICY IF EXISTS site_content_admin_write ON public.site_content;
DROP POLICY IF EXISTS courses_public_select ON public.courses;
DROP POLICY IF EXISTS courses_admin_teacher_write ON public.courses;
DROP POLICY IF EXISTS videos_public_select ON public.videos;
DROP POLICY IF EXISTS videos_admin_teacher_write ON public.videos;
DROP POLICY IF EXISTS students_self_read ON public.students;
DROP POLICY IF EXISTS students_self_update ON public.students;
DROP POLICY IF EXISTS students_self_insert ON public.students;
DROP POLICY IF EXISTS students_admin_delete ON public.students;
DROP POLICY IF EXISTS teachers_authenticated_read ON public.teachers;
DROP POLICY IF EXISTS teachers_admin_write ON public.teachers;
DROP POLICY IF EXISTS teachers_self_update ON public.teachers;
DROP POLICY IF EXISTS teacher_students_read ON public.teacher_students;
DROP POLICY IF EXISTS teacher_students_admin_write ON public.teacher_students;
DROP POLICY IF EXISTS classes_read ON public.classes;
DROP POLICY IF EXISTS classes_admin_teacher_write ON public.classes;
DROP POLICY IF EXISTS class_students_read ON public.class_students;
DROP POLICY IF EXISTS class_students_admin_teacher_write ON public.class_students;
DROP POLICY IF EXISTS enrollments_read ON public.enrollments;
DROP POLICY IF EXISTS enrollments_admin_teacher_write ON public.enrollments;
DROP POLICY IF EXISTS exams_public_select ON public.exams;
DROP POLICY IF EXISTS exams_admin_teacher_write ON public.exams;
DROP POLICY IF EXISTS exam_submissions_read ON public.exam_submissions;
DROP POLICY IF EXISTS exam_submissions_student_insert ON public.exam_submissions;
DROP POLICY IF EXISTS exam_submissions_update ON public.exam_submissions;
DROP POLICY IF EXISTS exam_submissions_admin_delete ON public.exam_submissions;
DROP POLICY IF EXISTS level_test_requests_read ON public.level_test_requests;
DROP POLICY IF EXISTS level_test_requests_student_insert ON public.level_test_requests;
DROP POLICY IF EXISTS level_test_requests_delete ON public.level_test_requests;
DROP POLICY IF EXISTS video_views_read ON public.video_views;
DROP POLICY IF EXISTS video_views_self_insert ON public.video_views;
DROP POLICY IF EXISTS video_views_self_update ON public.video_views;
DROP POLICY IF EXISTS video_views_admin_delete ON public.video_views;
DROP POLICY IF EXISTS video_progress_read ON public.video_progress;
DROP POLICY IF EXISTS video_progress_self_insert ON public.video_progress;
DROP POLICY IF EXISTS video_progress_self_update ON public.video_progress;
DROP POLICY IF EXISTS video_progress_admin_delete ON public.video_progress;
DROP POLICY IF EXISTS test_scores_read ON public.test_scores;
DROP POLICY IF EXISTS test_scores_admin_teacher_write ON public.test_scores;
DROP POLICY IF EXISTS teacher_notes_read ON public.teacher_notes;
DROP POLICY IF EXISTS teacher_notes_admin_teacher_write ON public.teacher_notes;
DROP POLICY IF EXISTS attendance_read ON public.attendance;
DROP POLICY IF EXISTS attendance_admin_teacher_write ON public.attendance;
DROP POLICY IF EXISTS exam_analyses_read ON public.exam_analyses;
DROP POLICY IF EXISTS exam_analyses_admin_teacher_write ON public.exam_analyses;
DROP POLICY IF EXISTS ai_comments_read ON public.ai_comments;
DROP POLICY IF EXISTS ai_comments_admin_teacher_write ON public.ai_comments;
DROP POLICY IF EXISTS notification_logs_admin_teacher_read ON public.notification_logs;
DROP POLICY IF EXISTS notification_logs_admin_teacher_write ON public.notification_logs;
DROP POLICY IF EXISTS password_reset_tokens_deny_all ON public.password_reset_tokens;
DROP POLICY IF EXISTS attachments_read ON public.attachments;
DROP POLICY IF EXISTS attachments_admin_teacher_write ON public.attachments;
DROP POLICY IF EXISTS attachment_recipients_read ON public.attachment_recipients;
DROP POLICY IF EXISTS attachment_recipients_admin_teacher_write ON public.attachment_recipients;
DROP POLICY IF EXISTS academic_schedules_authenticated_read ON public.academic_schedules;
DROP POLICY IF EXISTS academic_schedules_admin_teacher_write ON public.academic_schedules;
DROP POLICY IF EXISTS schedule_change_requests_read ON public.schedule_change_requests;
DROP POLICY IF EXISTS schedule_change_requests_write ON public.schedule_change_requests;
DROP POLICY IF EXISTS vocab_lists_read ON public.vocab_lists;
DROP POLICY IF EXISTS vocab_lists_admin_teacher_write ON public.vocab_lists;
DROP POLICY IF EXISTS vocab_words_read ON public.vocab_words;
DROP POLICY IF EXISTS vocab_words_admin_teacher_write ON public.vocab_words;
DROP POLICY IF EXISTS vocab_tests_read ON public.vocab_tests;
DROP POLICY IF EXISTS vocab_tests_admin_teacher_write ON public.vocab_tests;
DROP POLICY IF EXISTS vocab_test_assignments_read ON public.vocab_test_assignments;
DROP POLICY IF EXISTS vocab_test_assignments_admin_teacher_write ON public.vocab_test_assignments;
DROP POLICY IF EXISTS vocab_test_attempts_read ON public.vocab_test_attempts;
DROP POLICY IF EXISTS vocab_test_attempts_self_insert ON public.vocab_test_attempts;
DROP POLICY IF EXISTS vocab_test_attempts_self_update ON public.vocab_test_attempts;
DROP POLICY IF EXISTS vocab_test_attempts_admin_delete ON public.vocab_test_attempts;

-- ============================================================
-- 1. Recreate original permissive policies
-- ============================================================

-- academic_schedules
CREATE POLICY "as_public_delete" ON public.academic_schedules FOR DELETE TO public USING (true);
CREATE POLICY "as_public_insert" ON public.academic_schedules FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "as_public_select" ON public.academic_schedules FOR SELECT TO public USING (true);
CREATE POLICY "as_public_update" ON public.academic_schedules FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ai_comments
CREATE POLICY "anon read ai_comments" ON public.ai_comments FOR SELECT TO public USING (true);
CREATE POLICY "anon write ai_comments" ON public.ai_comments FOR ALL TO public USING (true) WITH CHECK (true);

-- announcements
CREATE POLICY "announcements_select_all" ON public.announcements FOR SELECT TO public USING (true);
CREATE POLICY "announcements_all_admin" ON public.announcements FOR ALL TO public USING (true);

-- attachment_recipients
CREATE POLICY "attachment_recipients rw" ON public.attachment_recipients FOR ALL TO public USING (true) WITH CHECK (true);

-- attachments
CREATE POLICY "attachments rw" ON public.attachments FOR ALL TO public USING (true) WITH CHECK (true);

-- banners
CREATE POLICY "banners_select_all" ON public.banners FOR SELECT TO public USING (true);
CREATE POLICY "banners_all_admin" ON public.banners FOR ALL TO public USING (true);

-- class_students
CREATE POLICY "allow public delete class_students" ON public.class_students FOR DELETE TO public USING (true);
CREATE POLICY "allow public insert class_students" ON public.class_students FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read class_students" ON public.class_students FOR SELECT TO public USING (true);

-- classes
CREATE POLICY "allow public delete classes" ON public.classes FOR DELETE TO public USING (true);
CREATE POLICY "allow public insert classes" ON public.classes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read classes" ON public.classes FOR SELECT TO public USING (true);
CREATE POLICY "allow public update classes" ON public.classes FOR UPDATE TO public USING (true) WITH CHECK (true);

-- courses
CREATE POLICY "allow courses delete" ON public.courses FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "allow courses insert" ON public.courses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow courses select" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow courses update" ON public.courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "courses_select_all" ON public.courses FOR SELECT TO public USING (true);

-- enrollments
CREATE POLICY "enrollments_delete" ON public.enrollments FOR DELETE TO public USING (true);
CREATE POLICY "enrollments_insert" ON public.enrollments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "enrollments_select_all" ON public.enrollments FOR SELECT TO public USING (true);

-- exam_analyses
CREATE POLICY "anon read exam_analyses" ON public.exam_analyses FOR SELECT TO public USING (true);
CREATE POLICY "anon write exam_analyses" ON public.exam_analyses FOR ALL TO public USING (true) WITH CHECK (true);

-- exam_submissions
CREATE POLICY "es_insert_open_exam" ON public.exam_submissions FOR INSERT TO public WITH CHECK (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_submissions.exam_id AND exams.status = 'open')
);
CREATE POLICY "es_public_select" ON public.exam_submissions FOR SELECT TO public USING (true);
CREATE POLICY "es_update_unlocked" ON public.exam_submissions FOR UPDATE TO public USING (locked = false) WITH CHECK (true);

-- exams
CREATE POLICY "exams_public_delete" ON public.exams FOR DELETE TO public USING (true);
CREATE POLICY "exams_public_insert" ON public.exams FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "exams_public_select" ON public.exams FOR SELECT TO public USING (true);
CREATE POLICY "exams_public_update" ON public.exams FOR UPDATE TO public USING (true) WITH CHECK (true);

-- level_test_requests
CREATE POLICY "ltr_insert_open_level" ON public.level_test_requests FOR INSERT TO public WITH CHECK (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = level_test_requests.exam_id AND exams.kind = 'level' AND exams.status = 'open')
);
CREATE POLICY "ltr_public_delete" ON public.level_test_requests FOR DELETE TO public USING (true);
CREATE POLICY "ltr_public_select" ON public.level_test_requests FOR SELECT TO public USING (true);

-- notices
CREATE POLICY "notices_select_all" ON public.notices FOR SELECT TO public USING (true);
CREATE POLICY "notices_all_admin" ON public.notices FOR ALL TO public USING (true);

-- notification_logs
CREATE POLICY "anon read notification_logs" ON public.notification_logs FOR SELECT TO public USING (true);
CREATE POLICY "anon write notification_logs" ON public.notification_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- password_reset_tokens
CREATE POLICY "prt_no_anon_access" ON public.password_reset_tokens FOR ALL TO public USING (false) WITH CHECK (false);

-- schedule_change_requests
CREATE POLICY "scr_public_delete" ON public.schedule_change_requests FOR DELETE TO public USING (true);
CREATE POLICY "scr_public_insert" ON public.schedule_change_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "scr_public_select" ON public.schedule_change_requests FOR SELECT TO public USING (true);
CREATE POLICY "scr_public_update" ON public.schedule_change_requests FOR UPDATE TO public USING (true) WITH CHECK (true);

-- site_content
CREATE POLICY "sc_public_insert" ON public.site_content FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "sc_public_select" ON public.site_content FOR SELECT TO public USING (true);
CREATE POLICY "sc_public_update" ON public.site_content FOR UPDATE TO public USING (true) WITH CHECK (true);

-- students
CREATE POLICY "students_insert_own" ON public.students FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "students_select_own" ON public.students FOR SELECT TO public USING (true);
CREATE POLICY "students_update" ON public.students FOR UPDATE TO public USING (true);
CREATE POLICY "students_upsert" ON public.students FOR INSERT TO public WITH CHECK (true);

-- subjects
CREATE POLICY "subjects_select_all" ON public.subjects FOR SELECT TO public USING (true);

-- teacher_notes
CREATE POLICY "allow public delete teacher_notes" ON public.teacher_notes FOR DELETE TO public USING (true);
CREATE POLICY "allow public insert teacher_notes" ON public.teacher_notes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read teacher_notes" ON public.teacher_notes FOR SELECT TO public USING (true);
CREATE POLICY "allow public update teacher_notes" ON public.teacher_notes FOR UPDATE TO public USING (true) WITH CHECK (true);

-- teacher_students
CREATE POLICY "allow public read teacher_students" ON public.teacher_students FOR SELECT TO public USING (true);

-- teachers
CREATE POLICY "allow public delete teachers" ON public.teachers FOR DELETE TO public USING (true);
CREATE POLICY "allow public insert teachers" ON public.teachers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read teachers" ON public.teachers FOR SELECT TO public USING (true);
CREATE POLICY "allow public update teachers" ON public.teachers FOR UPDATE TO public USING (true) WITH CHECK (true);

-- test_scores
CREATE POLICY "allow public delete test_scores" ON public.test_scores FOR DELETE TO public USING (true);
CREATE POLICY "allow public insert test_scores" ON public.test_scores FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read test_scores" ON public.test_scores FOR SELECT TO public USING (true);
CREATE POLICY "allow public update test_scores" ON public.test_scores FOR UPDATE TO public USING (true) WITH CHECK (true);

-- video_progress
CREATE POLICY "progress_insert_all" ON public.video_progress FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "progress_select_all" ON public.video_progress FOR SELECT TO public USING (true);
CREATE POLICY "progress_update_all" ON public.video_progress FOR UPDATE TO public USING (true);

-- video_views
CREATE POLICY "allow public insert video_views" ON public.video_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "allow public read video_views" ON public.video_views FOR SELECT TO public USING (true);
CREATE POLICY "allow public update video_views" ON public.video_views FOR UPDATE TO public USING (true) WITH CHECK (true);

-- videos
CREATE POLICY "allow videos delete" ON public.videos FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "allow videos insert" ON public.videos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow videos select" ON public.videos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow videos update" ON public.videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "videos_select_all" ON public.videos FOR SELECT TO public USING (true);

-- vocab_*
CREATE POLICY "vocab_lists_all" ON public.vocab_lists FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "vocab_words_all" ON public.vocab_words FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "vocab_tests_all" ON public.vocab_tests FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "vocab_test_assignments_all" ON public.vocab_test_assignments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "vocab_test_attempts_all" ON public.vocab_test_attempts FOR ALL TO public USING (true) WITH CHECK (true);
