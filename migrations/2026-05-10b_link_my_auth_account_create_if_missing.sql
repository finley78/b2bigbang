-- 2026-05-10 적용 완료 (Supabase에 이미 반영됨 — 기록용)
-- 문제: 관리자가 선생님을 삭제(students 행만 delete)하면 auth.users 행은 남음(고아).
--       그 이메일로 다시 회원가입하면 Supabase가 새 auth.users 행을 만들지 않아 on_auth_user_created 트리거가 안 돌고 → students 행이 생성 안 됨 → 승인 대기 목록에 안 보임.
-- 수정: link_my_auth_account() (로그인 시 syncSession 에서 호출)에서, students 행이 없고 회원가입 폼 메타데이터(name+role)가 있으면 students 행을 새로 생성하도록 확장.
--       (전체 본문은 Supabase의 함수 정의 참고 — 여기서는 변경 의도만 기록)

-- 참고: 같은 일을 또 막으려면 선생님 "삭제" 시 auth.users 행도 같이 삭제하는 admin 엣지 함수가 더 깔끔하지만, 현재는 link_my_auth_account 보완으로 대응.
