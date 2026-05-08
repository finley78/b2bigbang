-- Phase 5 보강 — 학생-학부모 자동 연결 SECURITY DEFINER 헬퍼
--
-- RLS 잠금 후, 회원가입 직후 본인이 입력한 가족 전화번호로 매칭 + parent_id 갱신을
-- 클라이언트가 직접 못 함 (다른 사용자 행을 SELECT/UPDATE 불가).
-- 이 함수는 SECURITY DEFINER로 RLS를 우회하되, 호출자 검증(my_id = current_student())으로
-- 다른 사용자 행 조작은 차단.

CREATE OR REPLACE FUNCTION public.link_family_by_phone(
  my_id uuid,
  target_phone text,
  my_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched uuid;
  norm_phone text;
BEGIN
  IF my_id IS NULL OR my_id <> public.current_student() THEN
    RETURN NULL;
  END IF;

  norm_phone := regexp_replace(COALESCE(target_phone, ''), '\D', '', 'g');
  IF norm_phone = '' OR length(norm_phone) < 9 THEN
    RETURN NULL;
  END IF;

  IF my_role = 'student' THEN
    SELECT id INTO matched
      FROM public.students
     WHERE role = 'parent'
       AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = norm_phone
     LIMIT 1;
    IF matched IS NOT NULL THEN
      UPDATE public.students SET parent_id = matched WHERE id = my_id;
    END IF;

  ELSIF my_role = 'parent' THEN
    SELECT id INTO matched
      FROM public.students
     WHERE role = 'student'
       AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = norm_phone
     LIMIT 1;
    IF matched IS NOT NULL THEN
      UPDATE public.students
         SET parent_id = my_id,
             parent_phone = (SELECT phone FROM public.students WHERE id = my_id)
       WHERE id = matched;
    END IF;
  END IF;

  RETURN matched;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_family_by_phone(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.link_family_by_phone(uuid, text, text) FROM anon, public;
