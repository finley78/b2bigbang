-- Phase 7 — 무결성 감사 후속 수정 (2026-05-09)
--
-- 1) handle_new_user 트리거 확장 — signup metadata로 모든 프로필 필드를 받아서
--    이메일 확인 옵션 ON일 때도 RLS 막힘 없이 가입 완성.
-- 2) link_my_auth_account() — 레거시 OAuth 사용자 retroactive auth_user_id 링크용
--    SECURITY DEFINER RPC. RLS 우회하지만 호출자는 본인 auth.uid()에 매칭되는 행만 처리.

-- ============================================================
-- 1. handle_new_user 트리거 확장
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  m jsonb;
  raw_role text;
  safe_role text;
  new_email text;
BEGIN
  m := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  raw_role := NULLIF(m->>'role', '');
  -- role 화이트리스트: signup metadata로 admin 권한 escalation 차단.
  -- admin은 별도 SQL UPDATE로만 부여 가능.
  safe_role := CASE
    WHEN raw_role IN ('student', 'parent', 'teacher', 'pending_teacher') THEN raw_role
    ELSE 'student'
  END;
  new_email := LOWER(COALESCE(NEW.email, ''));

  -- 기존 students 행과 email 일치(대소문자 무시) + auth_user_id NULL이면 link.
  -- link_my_auth_account RPC와 동일하게 LOWER() 비교 → 일관성 보장.
  SELECT id INTO existing_id
    FROM public.students
   WHERE LOWER(email) = new_email
     AND auth_user_id IS NULL
   LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.students
       SET auth_user_id = NEW.id
     WHERE id = existing_id;
  ELSE
    INSERT INTO public.students (
      auth_user_id,
      email,
      name,
      role,
      login_provider,
      phone,
      address,
      school,
      grade,
      parent_phone,
      privacy_agreed,
      agreed_at,
      is_active,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(m->>'name', ''), '신규 사용자'),
      safe_role,
      COALESCE(NULLIF(NEW.raw_app_meta_data->>'provider', ''), 'email'),
      NULLIF(m->>'phone', ''),
      NULLIF(m->>'address', ''),
      NULLIF(m->>'school', ''),
      NULLIF(m->>'grade', ''),
      NULLIF(m->>'parent_phone', ''),
      COALESCE((m->>'privacy_agreed')::boolean, false),
      CASE WHEN m->>'agreed_at' IS NOT NULL AND m->>'agreed_at' <> '' THEN (m->>'agreed_at')::timestamptz ELSE now() END,
      safe_role <> 'pending_teacher',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. link_my_auth_account RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_my_auth_account()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_id uuid;
  current_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  IF current_email IS NULL OR current_email = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO matched_id
    FROM public.students
   WHERE LOWER(email) = LOWER(current_email)
     AND auth_user_id IS NULL
   LIMIT 1;

  IF matched_id IS NOT NULL THEN
    UPDATE public.students
       SET auth_user_id = auth.uid()
     WHERE id = matched_id;
  END IF;

  RETURN matched_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_my_auth_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.link_my_auth_account() FROM anon, public;
