-- 2026-05-10c — courses.teacher_id 컬럼 추가
--
-- 문제: 선생님 페이지 "강좌 개설"에서 "강좌 개설 실패: Could not find the 'teacher_id'
--       column of 'courses' in the schema cache" 에러. TeacherPortal/AdminPanel 코드 전반이
--       courses.teacher_id 를 읽고 쓰는데(내 강좌 필터링, createCourse insert, 관리자 강좌 목록
--       담당 선생님 표시·필터 등) 정작 DB courses 테이블에 그 컬럼이 없었음.
--
-- 결정: FK는 일부러 안 검. teacherInfo.id 가 teachers.id 일 때도, teachers 프로필 행이 없으면
--       students.id 로 폴백될 때도 있어 FK(teachers.id) 를 걸면 위반 위험. 코드는
--       String(course.teacher_id) === String(teacher.id) 비교만 하므로 정합성 제약 불필요.
--
-- 적용: 2026-05-10 Supabase MCP apply_migration 으로 실행 완료. 이후 NOTIFY pgrst 로 스키마 캐시 리로드.

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS teacher_id uuid;
CREATE INDEX IF NOT EXISTS courses_teacher_id_idx ON public.courses (teacher_id);
COMMENT ON COLUMN public.courses.teacher_id IS '강좌를 만든 선생님 (보통 teachers.id, 프로필 없으면 students.id). FK 없음.';

NOTIFY pgrst, 'reload schema';
