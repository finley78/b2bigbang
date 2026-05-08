-- baseline schema snapshot (2026-05-09)
-- recreates all public tables, constraints, indexes, and RLS policies as of this date
-- generated from live Supabase project ldsjysjavwssadheeiog
-- 34 tables, captured columns/PKs/FKs/uniques/indexes/checks/policies

-- ============================================================
-- extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- academic_schedules
CREATE TABLE IF NOT EXISTS public.academic_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  school text,
  category text NOT NULL DEFAULT 'other'::text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  created_by uuid,
  creator_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ai_comments
CREATE TABLE IF NOT EXISTS public.ai_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  test_score_id uuid,
  comment text,
  generated_by uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text,
  created_at timestamptz DEFAULT now(),
  image text,
  cta text,
  link_to text,
  PRIMARY KEY (id)
);

-- attachment_recipients
CREATE TABLE IF NOT EXISTS public.attachment_recipients (
  attachment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (attachment_id, student_id)
);

-- attachments
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uploaded_by uuid,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text,
  file_size bigint,
  mime_type text,
  scope text NOT NULL,
  class_id uuid,
  created_at timestamptz DEFAULT now(),
  video_id uuid,
  PRIMARY KEY (id)
);

-- attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  teacher_id uuid,
  date date NOT NULL,
  status text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bg text DEFAULT '#006241'::text,
  subtitle text,
  title text NOT NULL,
  label text,
  badge text,
  active boolean DEFAULT true,
  cta text DEFAULT '자세히 보기'::text,
  image text,
  youtube text,
  sort_order integer DEFAULT 0,
  video_url text,
  link_to text,
  description text,
  PRIMARY KEY (id)
);

-- class_students
CREATE TABLE IF NOT EXISTS public.class_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  grade text,
  teacher_id uuid,
  created_at timestamptz DEFAULT now(),
  class_name text,
  vocab_test_preset jsonb,
  PRIMARY KEY (id)
);

-- courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id uuid,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  level text,
  grade text,
  class_id uuid,
  PRIMARY KEY (id)
);

-- enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  course_id uuid,
  enrolled_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  PRIMARY KEY (id)
);

-- exam_analyses
CREATE TABLE IF NOT EXISTS public.exam_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_name text,
  subject text,
  test_date date,
  class_id uuid,
  pdf_url text,
  question_stats jsonb,
  weak_topics jsonb,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- exam_submissions
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  student_id uuid NOT NULL,
  student_name text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  text_answer text,
  score integer,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  locked boolean NOT NULL DEFAULT false,
  text_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  objective_score integer,
  objective_total integer,
  text_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  graded_at timestamptz,
  graded_by uuid,
  audio_path text,
  PRIMARY KEY (id)
);

-- exams
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  teacher_id uuid,
  teacher_name text,
  title text NOT NULL,
  subject text,
  test_date date,
  description text,
  image_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  allow_text_answer boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'open'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  choices_per_question integer NOT NULL DEFAULT 5,
  time_limit_minutes integer NOT NULL DEFAULT 0,
  text_question_count integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'class'::text,
  target_grade text,
  school_level text,
  min_score integer,
  max_score integer,
  target_semester text,
  answer_key jsonb NOT NULL DEFAULT '{}'::jsonb,
  objective_total integer,
  allow_audio_answer boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

-- level_test_requests
CREATE TABLE IF NOT EXISTS public.level_test_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  student_id uuid NOT NULL,
  student_name text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  school_level text,
  grade text,
  score integer,
  semester text,
  subject text,
  PRIMARY KEY (id)
);

-- notices
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text DEFAULT '공지'::text,
  text text NOT NULL,
  date text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  parent_phone text,
  message_content text,
  test_score_id uuid,
  sent_by uuid,
  sent_at timestamptz,
  status text DEFAULT 'pending'::text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- schedule_change_requests
CREATE TABLE IF NOT EXISTS public.schedule_change_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid,
  teacher_name text NOT NULL,
  target_date date NOT NULL,
  reason text NOT NULL,
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- site_content
CREATE TABLE IF NOT EXISTS public.site_content (
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key)
);

-- students
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text,
  name text NOT NULL,
  phone text,
  login_provider text DEFAULT 'google'::text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  grade text,
  subjects text[] DEFAULT '{}'::text[],
  address text,
  role text DEFAULT 'student'::text,
  privacy_agreed boolean DEFAULT false,
  agreed_at timestamptz,
  is_approved boolean DEFAULT false,
  password_hash text,
  parent_id uuid,
  parent_phone text,
  teacher_grades text[],
  school text,
  withdrawn_at timestamptz,
  PRIMARY KEY (id)
);

-- subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  sort_order integer DEFAULT 0,
  PRIMARY KEY (id)
);

-- teacher_notes
CREATE TABLE IF NOT EXISTS public.teacher_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  teacher_id uuid,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  class_id uuid,
  note_date date DEFAULT CURRENT_DATE,
  note_type text DEFAULT '특이사항'::text,
  PRIMARY KEY (id)
);

-- teacher_students
CREATE TABLE IF NOT EXISTS public.teacher_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid,
  student_id uuid,
  subject text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  approval_status text DEFAULT 'approved'::text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- test_scores
CREATE TABLE IF NOT EXISTS public.test_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  teacher_id uuid,
  test_type text NOT NULL,
  subject text,
  score numeric,
  total numeric DEFAULT 100,
  test_date date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  test_name text,
  test_range text,
  PRIMARY KEY (id)
);

-- video_progress
CREATE TABLE IF NOT EXISTS public.video_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  video_id uuid,
  progress_seconds integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  last_watched_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- video_views
CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  video_id uuid NOT NULL,
  course_id uuid,
  progress_pct integer DEFAULT 0,
  watched_sec integer DEFAULT 0,
  view_count integer DEFAULT 0,
  last_watched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- videos
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  title text NOT NULL,
  youtube_id text NOT NULL,
  duration_minutes integer,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  category text,
  expires_at timestamptz,
  PRIMARY KEY (id)
);

-- vocab_lists
CREATE TABLE IF NOT EXISTS public.vocab_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid,
  creator_name text,
  subject text,
  grade text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  unit_size integer DEFAULT 20,
  PRIMARY KEY (id)
);

-- vocab_test_assignments
CREATE TABLE IF NOT EXISTS public.vocab_test_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL,
  class_id uuid,
  student_id uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- vocab_test_attempts
CREATE TABLE IF NOT EXISTS public.vocab_test_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL,
  student_id uuid NOT NULL,
  student_name text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb DEFAULT '{}'::jsonb,
  score integer,
  total integer,
  percentage numeric,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_taken_seconds integer,
  attempt_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  unit_index integer,
  PRIMARY KEY (id)
);

-- vocab_tests
CREATE TABLE IF NOT EXISTS public.vocab_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  title text NOT NULL,
  teacher_id uuid,
  teacher_name text,
  multiple_choice_count integer DEFAULT 0,
  spelling_count integer DEFAULT 0,
  writing_count integer DEFAULT 0,
  listening_count integer DEFAULT 0,
  choices_per_question integer DEFAULT 4,
  question_direction text DEFAULT 'mixed'::text,
  spelling_blank_ratio numeric DEFAULT 0.5,
  seconds_per_question integer DEFAULT 30,
  attempts_allowed integer DEFAULT 1,
  status text DEFAULT 'draft'::text,
  due_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  unit_index integer,
  show_answer_seconds integer DEFAULT 2,
  PRIMARY KEY (id)
);

-- vocab_words
CREATE TABLE IF NOT EXISTS public.vocab_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL,
  word text NOT NULL,
  meaning text NOT NULL,
  part_of_speech text,
  example text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  image_url text,
  PRIMARY KEY (id)
);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_course_id_key;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_course_id_key UNIQUE (student_id, course_id);

ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_exam_id_student_id_key;
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_exam_id_student_id_key UNIQUE (exam_id, student_id);

ALTER TABLE public.level_test_requests DROP CONSTRAINT IF EXISTS level_test_requests_exam_id_student_id_key;
ALTER TABLE public.level_test_requests ADD CONSTRAINT level_test_requests_exam_id_student_id_key UNIQUE (exam_id, student_id);

ALTER TABLE public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_token_key;
ALTER TABLE public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE public.students ADD CONSTRAINT students_email_key UNIQUE (email);

ALTER TABLE public.teacher_students DROP CONSTRAINT IF EXISTS teacher_students_teacher_id_student_id_subject_key;
ALTER TABLE public.teacher_students ADD CONSTRAINT teacher_students_teacher_id_student_id_subject_key UNIQUE (teacher_id, student_id, subject);

ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_email_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);

ALTER TABLE public.video_progress DROP CONSTRAINT IF EXISTS video_progress_student_id_video_id_key;
ALTER TABLE public.video_progress ADD CONSTRAINT video_progress_student_id_video_id_key UNIQUE (student_id, video_id);

ALTER TABLE public.video_views DROP CONSTRAINT IF EXISTS video_views_student_id_video_id_key;
ALTER TABLE public.video_views ADD CONSTRAINT video_views_student_id_video_id_key UNIQUE (student_id, video_id);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================
ALTER TABLE public.academic_schedules DROP CONSTRAINT IF EXISTS academic_schedules_created_by_fkey;
ALTER TABLE public.academic_schedules ADD CONSTRAINT academic_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.students(id) ON DELETE SET NULL;

ALTER TABLE public.attachment_recipients DROP CONSTRAINT IF EXISTS attachment_recipients_attachment_id_fkey;
ALTER TABLE public.attachment_recipients ADD CONSTRAINT attachment_recipients_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.attachments(id) ON DELETE CASCADE;

ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_video_id_fkey;
ALTER TABLE public.attachments ADD CONSTRAINT attachments_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_subject_id_fkey;
ALTER TABLE public.courses ADD CONSTRAINT courses_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_student_id_fkey;
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_exam_id_fkey;
ALTER TABLE public.exam_submissions ADD CONSTRAINT exam_submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_teacher_id_fkey;
ALTER TABLE public.exams ADD CONSTRAINT exams_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.students(id) ON DELETE SET NULL;

ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_class_id_fkey;
ALTER TABLE public.exams ADD CONSTRAINT exams_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.level_test_requests DROP CONSTRAINT IF EXISTS level_test_requests_exam_id_fkey;
ALTER TABLE public.level_test_requests ADD CONSTRAINT level_test_requests_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.level_test_requests DROP CONSTRAINT IF EXISTS level_test_requests_student_id_fkey;
ALTER TABLE public.level_test_requests ADD CONSTRAINT level_test_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_student_id_fkey;
ALTER TABLE public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.schedule_change_requests DROP CONSTRAINT IF EXISTS schedule_change_requests_teacher_id_fkey;
ALTER TABLE public.schedule_change_requests ADD CONSTRAINT schedule_change_requests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.students(id) ON DELETE SET NULL;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_parent_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.students(id);

ALTER TABLE public.teacher_notes DROP CONSTRAINT IF EXISTS teacher_notes_student_id_fkey;
ALTER TABLE public.teacher_notes ADD CONSTRAINT teacher_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);

ALTER TABLE public.teacher_notes DROP CONSTRAINT IF EXISTS teacher_notes_teacher_id_fkey;
ALTER TABLE public.teacher_notes ADD CONSTRAINT teacher_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.teacher_students DROP CONSTRAINT IF EXISTS teacher_students_student_id_fkey;
ALTER TABLE public.teacher_students ADD CONSTRAINT teacher_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_students DROP CONSTRAINT IF EXISTS teacher_students_teacher_id_fkey;
ALTER TABLE public.teacher_students ADD CONSTRAINT teacher_students_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.test_scores DROP CONSTRAINT IF EXISTS test_scores_student_id_fkey;
ALTER TABLE public.test_scores ADD CONSTRAINT test_scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);

ALTER TABLE public.test_scores DROP CONSTRAINT IF EXISTS test_scores_teacher_id_fkey;
ALTER TABLE public.test_scores ADD CONSTRAINT test_scores_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.video_progress DROP CONSTRAINT IF EXISTS video_progress_video_id_fkey;
ALTER TABLE public.video_progress ADD CONSTRAINT video_progress_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;

ALTER TABLE public.video_progress DROP CONSTRAINT IF EXISTS video_progress_student_id_fkey;
ALTER TABLE public.video_progress ADD CONSTRAINT video_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_course_id_fkey;
ALTER TABLE public.videos ADD CONSTRAINT videos_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_lists DROP CONSTRAINT IF EXISTS vocab_lists_created_by_fkey;
ALTER TABLE public.vocab_lists ADD CONSTRAINT vocab_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.students(id) ON DELETE SET NULL;

ALTER TABLE public.vocab_test_assignments DROP CONSTRAINT IF EXISTS vocab_test_assignments_test_id_fkey;
ALTER TABLE public.vocab_test_assignments ADD CONSTRAINT vocab_test_assignments_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.vocab_tests(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_test_assignments DROP CONSTRAINT IF EXISTS vocab_test_assignments_class_id_fkey;
ALTER TABLE public.vocab_test_assignments ADD CONSTRAINT vocab_test_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_test_assignments DROP CONSTRAINT IF EXISTS vocab_test_assignments_student_id_fkey;
ALTER TABLE public.vocab_test_assignments ADD CONSTRAINT vocab_test_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_test_attempts DROP CONSTRAINT IF EXISTS vocab_test_attempts_test_id_fkey;
ALTER TABLE public.vocab_test_attempts ADD CONSTRAINT vocab_test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.vocab_tests(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_test_attempts DROP CONSTRAINT IF EXISTS vocab_test_attempts_student_id_fkey;
ALTER TABLE public.vocab_test_attempts ADD CONSTRAINT vocab_test_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_list_id_fkey;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.vocab_lists(id) ON DELETE CASCADE;

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_teacher_id_fkey;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.students(id) ON DELETE SET NULL;

ALTER TABLE public.vocab_words DROP CONSTRAINT IF EXISTS vocab_words_list_id_fkey;
ALTER TABLE public.vocab_words ADD CONSTRAINT vocab_words_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.vocab_lists(id) ON DELETE CASCADE;

-- ============================================================
-- CHECK CONSTRAINTS (named/non-NOT-NULL only)
-- ============================================================
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_scope_check;
ALTER TABLE public.attachments ADD CONSTRAINT attachments_scope_check CHECK (scope = ANY (ARRAY['class'::text, 'student'::text, 'video'::text]));

ALTER TABLE public.vocab_lists DROP CONSTRAINT IF EXISTS vocab_lists_unit_size_check;
ALTER TABLE public.vocab_lists ADD CONSTRAINT vocab_lists_unit_size_check CHECK ((unit_size >= 1) AND (unit_size <= 200));

ALTER TABLE public.vocab_test_assignments DROP CONSTRAINT IF EXISTS vocab_test_assignments_check;
ALTER TABLE public.vocab_test_assignments ADD CONSTRAINT vocab_test_assignments_check CHECK ((class_id IS NOT NULL) OR (student_id IS NOT NULL));

ALTER TABLE public.vocab_test_attempts DROP CONSTRAINT IF EXISTS vocab_test_attempts_attempt_number_check;
ALTER TABLE public.vocab_test_attempts ADD CONSTRAINT vocab_test_attempts_attempt_number_check CHECK (attempt_number >= 1);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_seconds_per_question_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_seconds_per_question_check CHECK (seconds_per_question >= 0);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_multiple_choice_count_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_multiple_choice_count_check CHECK (multiple_choice_count >= 0);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_show_answer_seconds_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_show_answer_seconds_check CHECK ((show_answer_seconds >= 0) AND (show_answer_seconds <= 10));

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_status_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_status_check CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text]));

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_question_direction_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_question_direction_check CHECK (question_direction = ANY (ARRAY['word_to_meaning'::text, 'meaning_to_word'::text, 'mixed'::text]));

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_listening_count_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_listening_count_check CHECK (listening_count >= 0);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_writing_count_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_writing_count_check CHECK (writing_count >= 0);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_spelling_count_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_spelling_count_check CHECK (spelling_count >= 0);

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_spelling_blank_ratio_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_spelling_blank_ratio_check CHECK ((spelling_blank_ratio >= (0)::numeric) AND (spelling_blank_ratio <= (1)::numeric));

ALTER TABLE public.vocab_tests DROP CONSTRAINT IF EXISTS vocab_tests_choices_per_question_check;
ALTER TABLE public.vocab_tests ADD CONSTRAINT vocab_tests_choices_per_question_check CHECK ((choices_per_question >= 2) AND (choices_per_question <= 6));

-- ============================================================
-- INDEXES (non-PK, non-UNIQUE-constraint-backed)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_as_end_date ON public.academic_schedules USING btree (end_date);
CREATE INDEX IF NOT EXISTS idx_as_start_date ON public.academic_schedules USING btree (start_date);
CREATE INDEX IF NOT EXISTS idx_ai_comments_student ON public.ai_comments USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_ai_comments_score ON public.ai_comments USING btree (test_score_id);
CREATE INDEX IF NOT EXISTS idx_attachment_recipients_student ON public.attachment_recipients USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_attachments_class ON public.attachments USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_attachments_video_id ON public.attachments USING btree (video_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploader ON public.attachments USING btree (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_exam_analyses_class ON public.exam_analyses USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_es_exam ON public.exam_submissions USING btree (exam_id);
CREATE INDEX IF NOT EXISTS idx_es_student ON public.exam_submissions USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON public.exams USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON public.exams USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_ltr_exam ON public.level_test_requests USING btree (exam_id);
CREATE INDEX IF NOT EXISTS idx_ltr_student ON public.level_test_requests USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_student ON public.notification_logs USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_prt_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_prt_student ON public.password_reset_tokens USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_scr_teacher_id ON public.schedule_change_requests USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_scr_target_date ON public.schedule_change_requests USING btree (target_date);
CREATE INDEX IF NOT EXISTS idx_students_withdrawn_at ON public.students USING btree (withdrawn_at) WHERE (withdrawn_at IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_videos_expires_at ON public.videos USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_vocab_test_assignments_student_id ON public.vocab_test_assignments USING btree (student_id) WHERE (student_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_vocab_test_assignments_class_id ON public.vocab_test_assignments USING btree (class_id) WHERE (class_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_vocab_test_assignments_test_id ON public.vocab_test_assignments USING btree (test_id);
CREATE INDEX IF NOT EXISTS idx_vocab_test_attempts_test_id ON public.vocab_test_attempts USING btree (test_id);
CREATE INDEX IF NOT EXISTS idx_vocab_test_attempts_student_id ON public.vocab_test_attempts USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_vocab_test_attempts_test_student ON public.vocab_test_attempts USING btree (test_id, student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vocab_attempts_unique_attempt ON public.vocab_test_attempts USING btree (test_id, student_id, attempt_number);
CREATE INDEX IF NOT EXISTS idx_vocab_tests_list_id ON public.vocab_tests USING btree (list_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tests_teacher_id ON public.vocab_tests USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_list_id ON public.vocab_words USING btree (list_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.academic_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachment_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_test_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- academic_schedules
DROP POLICY IF EXISTS as_public_delete ON public.academic_schedules CASCADE;
CREATE POLICY as_public_delete ON public.academic_schedules FOR DELETE USING (true);
DROP POLICY IF EXISTS as_public_insert ON public.academic_schedules CASCADE;
CREATE POLICY as_public_insert ON public.academic_schedules FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS as_public_select ON public.academic_schedules CASCADE;
CREATE POLICY as_public_select ON public.academic_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS as_public_update ON public.academic_schedules CASCADE;
CREATE POLICY as_public_update ON public.academic_schedules FOR UPDATE USING (true) WITH CHECK (true);

-- ai_comments
DROP POLICY IF EXISTS "anon read ai_comments" ON public.ai_comments CASCADE;
CREATE POLICY "anon read ai_comments" ON public.ai_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon write ai_comments" ON public.ai_comments CASCADE;
CREATE POLICY "anon write ai_comments" ON public.ai_comments FOR ALL USING (true) WITH CHECK (true);

-- announcements
DROP POLICY IF EXISTS announcements_all_admin ON public.announcements CASCADE;
CREATE POLICY announcements_all_admin ON public.announcements FOR ALL USING (true);
DROP POLICY IF EXISTS announcements_select_all ON public.announcements CASCADE;
CREATE POLICY announcements_select_all ON public.announcements FOR SELECT USING (true);

-- attachment_recipients
DROP POLICY IF EXISTS "attachment_recipients rw" ON public.attachment_recipients CASCADE;
CREATE POLICY "attachment_recipients rw" ON public.attachment_recipients FOR ALL USING (true) WITH CHECK (true);

-- attachments
DROP POLICY IF EXISTS "attachments rw" ON public.attachments CASCADE;
CREATE POLICY "attachments rw" ON public.attachments FOR ALL USING (true) WITH CHECK (true);

-- banners
DROP POLICY IF EXISTS banners_all_admin ON public.banners CASCADE;
CREATE POLICY banners_all_admin ON public.banners FOR ALL USING (true);
DROP POLICY IF EXISTS banners_select_all ON public.banners CASCADE;
CREATE POLICY banners_select_all ON public.banners FOR SELECT USING (true);

-- class_students
DROP POLICY IF EXISTS "allow public delete class_students" ON public.class_students CASCADE;
CREATE POLICY "allow public delete class_students" ON public.class_students FOR DELETE USING (true);
DROP POLICY IF EXISTS "allow public insert class_students" ON public.class_students CASCADE;
CREATE POLICY "allow public insert class_students" ON public.class_students FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read class_students" ON public.class_students CASCADE;
CREATE POLICY "allow public read class_students" ON public.class_students FOR SELECT USING (true);

-- classes
DROP POLICY IF EXISTS "allow public delete classes" ON public.classes CASCADE;
CREATE POLICY "allow public delete classes" ON public.classes FOR DELETE USING (true);
DROP POLICY IF EXISTS "allow public insert classes" ON public.classes CASCADE;
CREATE POLICY "allow public insert classes" ON public.classes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read classes" ON public.classes CASCADE;
CREATE POLICY "allow public read classes" ON public.classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow public update classes" ON public.classes CASCADE;
CREATE POLICY "allow public update classes" ON public.classes FOR UPDATE USING (true) WITH CHECK (true);

-- courses
DROP POLICY IF EXISTS "allow courses delete" ON public.courses CASCADE;
CREATE POLICY "allow courses delete" ON public.courses FOR DELETE TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow courses insert" ON public.courses CASCADE;
CREATE POLICY "allow courses insert" ON public.courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow courses select" ON public.courses CASCADE;
CREATE POLICY "allow courses select" ON public.courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow courses update" ON public.courses CASCADE;
CREATE POLICY "allow courses update" ON public.courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS courses_select_all ON public.courses CASCADE;
CREATE POLICY courses_select_all ON public.courses FOR SELECT USING (true);

-- enrollments
DROP POLICY IF EXISTS enrollments_delete ON public.enrollments CASCADE;
CREATE POLICY enrollments_delete ON public.enrollments FOR DELETE USING (true);
DROP POLICY IF EXISTS enrollments_insert ON public.enrollments CASCADE;
CREATE POLICY enrollments_insert ON public.enrollments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS enrollments_select_all ON public.enrollments CASCADE;
CREATE POLICY enrollments_select_all ON public.enrollments FOR SELECT USING (true);

-- exam_analyses
DROP POLICY IF EXISTS "anon read exam_analyses" ON public.exam_analyses CASCADE;
CREATE POLICY "anon read exam_analyses" ON public.exam_analyses FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon write exam_analyses" ON public.exam_analyses CASCADE;
CREATE POLICY "anon write exam_analyses" ON public.exam_analyses FOR ALL USING (true) WITH CHECK (true);

-- exam_submissions
DROP POLICY IF EXISTS es_insert_open_exam ON public.exam_submissions CASCADE;
CREATE POLICY es_insert_open_exam ON public.exam_submissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_submissions.exam_id AND exams.status = 'open'::text));
DROP POLICY IF EXISTS es_public_select ON public.exam_submissions CASCADE;
CREATE POLICY es_public_select ON public.exam_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS es_update_unlocked ON public.exam_submissions CASCADE;
CREATE POLICY es_update_unlocked ON public.exam_submissions FOR UPDATE USING (locked = false) WITH CHECK (true);

-- exams
DROP POLICY IF EXISTS exams_public_delete ON public.exams CASCADE;
CREATE POLICY exams_public_delete ON public.exams FOR DELETE USING (true);
DROP POLICY IF EXISTS exams_public_insert ON public.exams CASCADE;
CREATE POLICY exams_public_insert ON public.exams FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS exams_public_select ON public.exams CASCADE;
CREATE POLICY exams_public_select ON public.exams FOR SELECT USING (true);
DROP POLICY IF EXISTS exams_public_update ON public.exams CASCADE;
CREATE POLICY exams_public_update ON public.exams FOR UPDATE USING (true) WITH CHECK (true);

-- level_test_requests
DROP POLICY IF EXISTS ltr_insert_open_level ON public.level_test_requests CASCADE;
CREATE POLICY ltr_insert_open_level ON public.level_test_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM exams WHERE exams.id = level_test_requests.exam_id AND exams.kind = 'level'::text AND exams.status = 'open'::text));
DROP POLICY IF EXISTS ltr_public_delete ON public.level_test_requests CASCADE;
CREATE POLICY ltr_public_delete ON public.level_test_requests FOR DELETE USING (true);
DROP POLICY IF EXISTS ltr_public_select ON public.level_test_requests CASCADE;
CREATE POLICY ltr_public_select ON public.level_test_requests FOR SELECT USING (true);

-- notices
DROP POLICY IF EXISTS notices_all_admin ON public.notices CASCADE;
CREATE POLICY notices_all_admin ON public.notices FOR ALL USING (true);
DROP POLICY IF EXISTS notices_select_all ON public.notices CASCADE;
CREATE POLICY notices_select_all ON public.notices FOR SELECT USING (true);

-- notification_logs
DROP POLICY IF EXISTS "anon read notification_logs" ON public.notification_logs CASCADE;
CREATE POLICY "anon read notification_logs" ON public.notification_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon write notification_logs" ON public.notification_logs CASCADE;
CREATE POLICY "anon write notification_logs" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);

-- password_reset_tokens
DROP POLICY IF EXISTS prt_no_anon_access ON public.password_reset_tokens CASCADE;
CREATE POLICY prt_no_anon_access ON public.password_reset_tokens FOR ALL USING (false) WITH CHECK (false);

-- schedule_change_requests
DROP POLICY IF EXISTS scr_public_delete ON public.schedule_change_requests CASCADE;
CREATE POLICY scr_public_delete ON public.schedule_change_requests FOR DELETE USING (true);
DROP POLICY IF EXISTS scr_public_insert ON public.schedule_change_requests CASCADE;
CREATE POLICY scr_public_insert ON public.schedule_change_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS scr_public_select ON public.schedule_change_requests CASCADE;
CREATE POLICY scr_public_select ON public.schedule_change_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS scr_public_update ON public.schedule_change_requests CASCADE;
CREATE POLICY scr_public_update ON public.schedule_change_requests FOR UPDATE USING (true) WITH CHECK (true);

-- site_content
DROP POLICY IF EXISTS sc_public_insert ON public.site_content CASCADE;
CREATE POLICY sc_public_insert ON public.site_content FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS sc_public_select ON public.site_content CASCADE;
CREATE POLICY sc_public_select ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS sc_public_update ON public.site_content CASCADE;
CREATE POLICY sc_public_update ON public.site_content FOR UPDATE USING (true) WITH CHECK (true);

-- students
DROP POLICY IF EXISTS students_insert_own ON public.students CASCADE;
CREATE POLICY students_insert_own ON public.students FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS students_select_own ON public.students CASCADE;
CREATE POLICY students_select_own ON public.students FOR SELECT USING (true);
DROP POLICY IF EXISTS students_update ON public.students CASCADE;
CREATE POLICY students_update ON public.students FOR UPDATE USING (true);
DROP POLICY IF EXISTS students_upsert ON public.students CASCADE;
CREATE POLICY students_upsert ON public.students FOR INSERT WITH CHECK (true);

-- subjects
DROP POLICY IF EXISTS subjects_select_all ON public.subjects CASCADE;
CREATE POLICY subjects_select_all ON public.subjects FOR SELECT USING (true);

-- teacher_notes
DROP POLICY IF EXISTS "allow public delete teacher_notes" ON public.teacher_notes CASCADE;
CREATE POLICY "allow public delete teacher_notes" ON public.teacher_notes FOR DELETE USING (true);
DROP POLICY IF EXISTS "allow public insert teacher_notes" ON public.teacher_notes CASCADE;
CREATE POLICY "allow public insert teacher_notes" ON public.teacher_notes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read teacher_notes" ON public.teacher_notes CASCADE;
CREATE POLICY "allow public read teacher_notes" ON public.teacher_notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow public update teacher_notes" ON public.teacher_notes CASCADE;
CREATE POLICY "allow public update teacher_notes" ON public.teacher_notes FOR UPDATE USING (true) WITH CHECK (true);

-- teacher_students
DROP POLICY IF EXISTS "allow public read teacher_students" ON public.teacher_students CASCADE;
CREATE POLICY "allow public read teacher_students" ON public.teacher_students FOR SELECT USING (true);

-- teachers
DROP POLICY IF EXISTS "allow public delete teachers" ON public.teachers CASCADE;
CREATE POLICY "allow public delete teachers" ON public.teachers FOR DELETE USING (true);
DROP POLICY IF EXISTS "allow public insert teachers" ON public.teachers CASCADE;
CREATE POLICY "allow public insert teachers" ON public.teachers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read teachers" ON public.teachers CASCADE;
CREATE POLICY "allow public read teachers" ON public.teachers FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow public update teachers" ON public.teachers CASCADE;
CREATE POLICY "allow public update teachers" ON public.teachers FOR UPDATE USING (true) WITH CHECK (true);

-- test_scores
DROP POLICY IF EXISTS "allow public delete test_scores" ON public.test_scores CASCADE;
CREATE POLICY "allow public delete test_scores" ON public.test_scores FOR DELETE USING (true);
DROP POLICY IF EXISTS "allow public insert test_scores" ON public.test_scores CASCADE;
CREATE POLICY "allow public insert test_scores" ON public.test_scores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read test_scores" ON public.test_scores CASCADE;
CREATE POLICY "allow public read test_scores" ON public.test_scores FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow public update test_scores" ON public.test_scores CASCADE;
CREATE POLICY "allow public update test_scores" ON public.test_scores FOR UPDATE USING (true) WITH CHECK (true);

-- video_progress
DROP POLICY IF EXISTS progress_insert_all ON public.video_progress CASCADE;
CREATE POLICY progress_insert_all ON public.video_progress FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS progress_select_all ON public.video_progress CASCADE;
CREATE POLICY progress_select_all ON public.video_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS progress_update_all ON public.video_progress CASCADE;
CREATE POLICY progress_update_all ON public.video_progress FOR UPDATE USING (true);

-- video_views
DROP POLICY IF EXISTS "allow public insert video_views" ON public.video_views CASCADE;
CREATE POLICY "allow public insert video_views" ON public.video_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "allow public read video_views" ON public.video_views CASCADE;
CREATE POLICY "allow public read video_views" ON public.video_views FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow public update video_views" ON public.video_views CASCADE;
CREATE POLICY "allow public update video_views" ON public.video_views FOR UPDATE USING (true) WITH CHECK (true);

-- videos
DROP POLICY IF EXISTS "allow videos delete" ON public.videos CASCADE;
CREATE POLICY "allow videos delete" ON public.videos FOR DELETE TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow videos insert" ON public.videos CASCADE;
CREATE POLICY "allow videos insert" ON public.videos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allow videos select" ON public.videos CASCADE;
CREATE POLICY "allow videos select" ON public.videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allow videos update" ON public.videos CASCADE;
CREATE POLICY "allow videos update" ON public.videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS videos_select_all ON public.videos CASCADE;
CREATE POLICY videos_select_all ON public.videos FOR SELECT USING (true);

-- vocab_lists
DROP POLICY IF EXISTS vocab_lists_all ON public.vocab_lists CASCADE;
CREATE POLICY vocab_lists_all ON public.vocab_lists FOR ALL USING (true) WITH CHECK (true);

-- vocab_test_assignments
DROP POLICY IF EXISTS vocab_test_assignments_all ON public.vocab_test_assignments CASCADE;
CREATE POLICY vocab_test_assignments_all ON public.vocab_test_assignments FOR ALL USING (true) WITH CHECK (true);

-- vocab_test_attempts
DROP POLICY IF EXISTS vocab_test_attempts_all ON public.vocab_test_attempts CASCADE;
CREATE POLICY vocab_test_attempts_all ON public.vocab_test_attempts FOR ALL USING (true) WITH CHECK (true);

-- vocab_tests
DROP POLICY IF EXISTS vocab_tests_all ON public.vocab_tests CASCADE;
CREATE POLICY vocab_tests_all ON public.vocab_tests FOR ALL USING (true) WITH CHECK (true);

-- vocab_words
DROP POLICY IF EXISTS vocab_words_all ON public.vocab_words CASCADE;
CREATE POLICY vocab_words_all ON public.vocab_words FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- end of baseline
-- ============================================================
