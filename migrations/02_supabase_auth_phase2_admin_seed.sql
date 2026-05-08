-- Supabase Auth migration — Phase 2 (admin role seed)
-- 2026-05-09
--
-- Phase 2 actions performed:
-- 1. Edge Function migrate-existing-users called once → 7 students/teachers
--    backfilled to auth.users + students.auth_user_id linked.
-- 2. b2bigbang100@gmail.com (김도영) promoted from teacher → admin.
--
-- This file records step #2 idempotently. Re-run safe.

UPDATE public.students
   SET role = 'admin'
 WHERE email = 'b2bigbang100@gmail.com'
   AND role <> 'admin';
