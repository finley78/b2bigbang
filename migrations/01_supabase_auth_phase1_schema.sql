-- Supabase Auth migration — Phase 1 (non-destructive prep)
-- 2026-05-09
--
-- Adds:
--   - students.auth_user_id column (FK to auth.users)
--   - SECURITY DEFINER helper functions for RLS:
--       current_student(), current_role(), is_admin(), is_parent_of(uuid), teacher_has_student(uuid)
--   - handle_new_user() trigger on auth.users → auto-create students row on signup
--
-- Safe to apply: app continues to use localStorage auth. No behavior change.
-- Reversible: see 01_supabase_auth_phase1_rollback.sql

-- ============================================================
-- 1. Schema change
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);

-- ============================================================
-- 2. RLS helper functions
-- All STABLE + SECURITY DEFINER so RLS policies can call them without
-- recursive policy evaluation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_student()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.students WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(public.current_role() = 'admin', false)
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(public.current_role() = 'teacher', false)
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = target_student_id
      AND parent_id = public.current_student()
  )
$$;

CREATE OR REPLACE FUNCTION public.teacher_has_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    JOIN public.classes c ON c.id = cs.class_id
    WHERE cs.student_id = target_student_id
      AND c.teacher_id = public.current_student()
  )
$$;

-- ============================================================
-- 3. Auth signup trigger
-- When a new auth.users row is created (signup or admin invite),
-- automatically create a matching public.students row, OR
-- link the new auth.users.id to an existing students row by email.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Try to link to an existing students row by email (pre-migration legacy users)
  SELECT id INTO existing_id
    FROM public.students
   WHERE email = NEW.email
     AND auth_user_id IS NULL
   LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.students
       SET auth_user_id = NEW.id
     WHERE id = existing_id;
  ELSE
    -- Create a new students row keyed by metadata
    INSERT INTO public.students (
      auth_user_id,
      email,
      name,
      role,
      login_provider,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), '신규 사용자'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'student'),
      COALESCE(NULLIF(NEW.raw_app_meta_data->>'provider', ''), 'email'),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. Grant execute on helper functions to authenticated users
-- (anon explicitly excluded — these are only meaningful when logged in)
-- ============================================================

GRANT EXECUTE ON FUNCTION public.current_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_has_student(uuid) TO authenticated;
