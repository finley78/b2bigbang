-- Rollback for 01_supabase_auth_phase1_schema.sql
-- Apply only if Phase 1 needs to be reverted before subsequent phases run.
-- Once Phase 2 (data backfill) runs, this rollback will fail or destroy auth_user_id links.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.teacher_has_student(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_parent_of(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.current_role() CASCADE;
DROP FUNCTION IF EXISTS public.current_student() CASCADE;

DROP INDEX IF EXISTS public.idx_students_auth_user_id;
ALTER TABLE public.students DROP COLUMN IF EXISTS auth_user_id;
