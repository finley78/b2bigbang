-- Phase 6 (2/2) 파괴적 cleanup
-- Supabase Auth 이전 완료 후 사용되지 않는 객체들 제거.
--
-- 1) password_reset_tokens 테이블: 옛 토큰 기반 비밀번호 재설정 흐름.
--    Supabase Auth의 resetPasswordForEmail로 대체됨.
-- 2) students.password_hash 컬럼: 옛 SHA-256 해시 저장.
--    auth.users.encrypted_password로 대체됨.
--
-- 비가역. 실행 전 백업 권장.

DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;

ALTER TABLE public.students DROP COLUMN IF EXISTS password_hash;
