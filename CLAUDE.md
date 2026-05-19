# B2빅뱅학원 웹앱

학원 통합 웹앱 (학생/선생님/관리자/학부모 포털 + 홈페이지 + PWA). React 단일 파일 컴포넌트 구조, esbuild로 .jsx → .js 빌드, GitHub Pages로 배포.

> **Claude에게**: 이 파일은 작업을 이어갈 때 자동으로 로드됩니다. 하단 "현재 진행" 섹션을 보고 어디까지 했는지 파악하세요. 작업 끝낼 때마다 "현재 진행"을 업데이트하고 커밋·푸시하세요.

---

## 파일 구조

소스(.jsx)와 빌드 산출물(.js)이 같은 폴더에 공존. 항상 .jsx만 수정하고 빌드:

```
HomePage.jsx / .js          # 메인 홈
TopNav.jsx / .js            # 상단바
Pages.jsx / .js             # 일반 페이지(소개·문의·프로그램 등)
StudentPortal.jsx / .js     # 학생 포털 + 로그인 모달
TeacherPortal.jsx / .js     # 선생님 포털
AdminPanel.jsx / .js        # 관리자 패널
Utils.jsx / .js             # 공유 유틸
index.html                  # 진입점, 스크립트 로드 + PWA 설치 배너
service-worker.js           # SW (network-first for app code)
manifest.json               # PWA manifest
build.js                    # esbuild 컴파일 스크립트
migrations/                 # Supabase SQL 마이그레이션
.github/workflows/build.yml # .jsx 푸시 시 자동 빌드 + 커밋
```

배포: `main`에 푸시 → GitHub Pages 자동 빌드 (1~3분).

---

## 작업 흐름 (반드시 이대로)

### .jsx 파일 수정 후
```bash
node build.js
```
→ 모든 .jsx → .js 컴파일됨 (`OK Built 7 files in ...`).

### 캐시 버전 올리기 (배포 시 필수)
`index.html` 하단의 모든 `?v=20260507z` 같은 버전 태그를 한 글자 다음으로 (`a` → `b` → ... → `z`로 끝나면 다음 날짜로). Edit 툴의 `replace_all: true`로 일괄 교체.

### 커밋 메시지 형식
```
한 줄 요약, ?v=20260508a

- 변경 내용 1
- 변경 내용 2

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### git identity (config 건드리지 말고 inline으로)
```bash
git -c user.email=kimdoyoung868@gmail.com -c user.name=Finley commit ...
```

### 한글 인코딩 주의
PowerShell의 `Set-Content -Encoding utf8`은 한글 깨뜨림. 텍스트 변경은 **반드시 Edit 툴**만 사용. cmd에서 `(Get-Content) -replace ... | Set-Content` 같은 패턴 금지.

### Bash vs PowerShell
Windows + 한글 경로(`C:\Users\사용자\...`)이라 Bash 툴은 한글 경로 깨짐 (`사용자` → `사용자`). 파일 시스템 작업은 PowerShell, git은 Bash 둘 다 됨.

---

## DB (Supabase)

프로젝트 ID: `ldsjysjavwssadheeiog` (B2BIGBANG, ap-northeast-2)

### students 테이블 — 자주 헷갈리는 부분
- 학생/학부모/선생님/관리자 모두 한 테이블에 `role` 컬럼으로 구분 (student / parent / teacher / pending_* / admin?)
- **컬럼명 주의**:
  - `privacy_agreed` (NOT `agree_privacy` ← 옛 코드의 오타)
  - `agreed_at` (시각)
  - `withdrawn_at` (퇴원 시각, NULL이면 활성)
- `email`은 nullable (2026-05-06 마이그레이션으로 변경됨 — 기존엔 NOT NULL이었음)
- `email`에 UNIQUE 제약은 있음 (NULL은 여러 개 OK)
- 활성 학생만 보려면 `is_active=true AND role='student'`

### Excel 가져오기 헤더 매핑
import는 `pickField()`로 다양한 헤더 변형 인식:
- 이름: 이름 / 학생이름 / 학생 이름
- 학생전화: 학생전화 / 학생 전화 / 학생 연락처 / 전화번호 / 연락처
- 학부모전화: 학부모전화 / 학부모 전화 / 학부모 연락처 / 보호자전화 / 휴대전화1 / 휴대전화
- 주소: 주소 / 자택주소 / 거주지 / 집주소
- 최초 등원일: 최초 등원일 / 최초등원일 / 최초등록일 / 등원일 / 등록일
- 퇴원일: 퇴원일

### 학교 / 학교급 데이터 (AdminPanel.jsx 상단)
- 초등: 은지초·검암초·간재울초
- 중등: 검암중·간재울중·백석중·서곶중·마전중
- 고등: 대인고·서인천고·백석고
- + `+ 직접 입력`으로 사용자 입력 학교 허용 (그 외 지역 학교 등록 시)

### 과목
`SUBJECTS = ['국어','영어','수학','과학']` (AdminPanel.jsx:4)

---

## UI 컨벤션

- **PC vs PWA(모바일)** 분기 다수. 사용자가 "PWA는 그대로 두자" 자주 말함 — PC만 손대기.
- **컬러**: 메가스터디 톤 — 빨강 `#E60012`, 검정 `#1A1A1A`. PWA에선 특히 빨강 강조.
- **그림자**: 빨간 글로우 (`rgba(230,0,18,...)`)는 사용자가 싫어함 → 중성 `rgba(0,0,0,...)`로.
- **폰트**: Manrope 일관 사용.
- **모서리**: 카드 12~16px, 버튼 8~10px.
- **이모지 절대 금지**: 사용자가 명시적으로 요청하지 않는 한 UI/코드 어디에도 이모지 추가 금지 (2026-05-08 정책). 새 기능 만들 때도 이모지 없이.

---

## 단어 학습 세트 — 어법 문제 작성 정책

- **어법 단계(grammar 시트)는 그 유닛 단어 범위에 묶지 말 것.** 예문(sentence)을 가지고 **어떤 어법 포인트든 자유롭게 다양하게** 출제. 시제·수일치·관계대명사·분사구문·도치·가정법 등 문장에서 자연스럽게 뽑아낼 수 있는 어법 항목이면 유닛 단어와 무관해도 OK.
- **이유**: 어법은 단어 시험이 아니라 문법 학습. 단어 범위에 묶이면 출제할 어법 포인트가 너무 빈약해짐. 사용자가 명시적으로 정한 방향 (2026-05-16).
- **적용**: 어법 시트 엑셀 양식 안내·예시·도움말을 쓸 때 "그 유닛 단어로 만들어야 한다"는 식의 제한 문구를 넣지 말 것. 추후 어법 문제를 AI로 자동 생성하는 기능을 만든다면, 프롬프트에 "유닛 단어 범위 안에서"가 아니라 **"예문을 활용해 다양한 어법 포인트로"** 를 명시.

---

## Supabase MCP로 직접 DB 접근

스키마 확인:
```
mcp__claude_ai_Supabase__list_tables({ project_id, schemas:['public'], verbose:true })
```
SQL 실행:
```
mcp__claude_ai_Supabase__execute_sql({ project_id:'ldsjysjavwssadheeiog', query:'...' })
```
DDL은 `apply_migration` 사용.

---

## 현재 진행 (2026-05-19 기준, 최신 ?v=20260519v182-todo-merge-and-inline-class-assign)

### ★ 학생 PWA 시험+숙제 = "할 일" 통합 + 학생 카드 반 배정 인라인 (v182, 2026-05-19) ★
사용자가 "UI나 기능을 합할 수 있는 거 없나? 너무 분산돼서 직관적이지 못해" — 분산된 UI 묶기.

**A. 학생 PWA: "테스트" + "숙제" → "할 일"** (StudentPortal.jsx)
- 강의실 홈 4카드(영상강의·테스트·숙제·단어장) → 3카드(영상강의·**할 일**·단어장).
- 'test' studentMode를 통합 "할 일" 화면으로 재구성. 'homework' studentMode도 같은 블록으로 redirect.
- 화면 상단에 **필터 칩 3개** [전체 N · 시험 N · 숙제 N] — 색상 다르게(검정/빨강/파랑) 클릭 시 종류별 필터링.
- 카드 정렬: **안 푼 것 먼저, 그 안에서 최신 발행순**. 각 카드 좌상단에 종류 뱃지(시험=빨강/숙제=파랑) + 상태 뱃지(미응시·응시중·완료·시간 종료 등).
- state: `todoFilter` 추가. setStudentMode('test') 시 setTodoFilter('all').
- 빈 상태 안내문: "할 일이 없어요" 한 줄로 통일.

**B. 관리자: 학생 카드 펼침에 반 배정 인라인** (AdminPanel.jsx)
- 학생 카드 펼침 영역 진단 줄(받은 단어장·소속 반·수강 강좌) 바로 아래에 **빨강 박스 한 줄** 추가:
  - 라벨: "반 배정"
  - 현재 소속 반들이 칩으로 표시 (선생님 이름 + 반 이름 형식, `B2Utils.classLabel` 사용). 각 칩 우측에 × 버튼(`removeStudentFromClass` 호출).
  - 우측에 **"+ 반 추가"** 드롭다운 — 학생이 아직 안 든 반들 목록. 선택 즉시 `addStudentToClass` 호출.
- 이제 "클래스 관리" 탭 안 들어가도 학생 카드만 펼치면 반 배정 한 곳에서 끝.

**C. 시험·숙제·레벨테스트 발행 폼 통합** — 이미 v76 + v66 + v68에서 대부분 완료된 상태. AdminPanel '시험 관리' 탭(`leveltest` id, line 2291)이 `kind` 드롭다운(level/weekly/monthly/homework) 한 폼으로 통합돼 있음. TeacherPortal '테스트' 탭도 동일. 추가 작업 없음.

### ★ 수강 과목·영상 강의 권한 분리 + 카드 진단 + 단어장 공개 전환 + 클래스 중복 경고 (v181, 2026-05-19) ★
v180 한 시간 뒤. 사용자가 "수강생 처리하는 거를 쉽게 만들면 어떻까?" — 모델 자체를 정리. 핵심: **"영어 수강생이다"는 선언과 "이 영상 강의를 볼 수 있다"는 권한이 같은 컬럼에 묶여 있던 문제**를 분리.

**모델 정리**:
- **`students.subjects`** = "수강 과목 선언" (학원에서 이 과목을 듣는다). 단어장·시험·약점분석 메뉴 노출 조건. 관리자 학생 카드에서 토글 가능.
- **`enrollments`** = "이 영상 강의 시청 권한". 선생님이 본인 강의를 임의 학생에게 줄 수 있음.
- **`courses.class_id`** = "이 강의는 이 클래스 멤버 자동 시청". byClass 로직 그대로.
- **관리자** = 모든 강의 + 모든 과목 (전지전능).

**핵심 1줄 수정** — StudentPortal.jsx 1928~1937 `studentSubjects` useMemo:
- 전: `courses.filter(c => enrolledIds.includes(c.id)).map(c => c.subject)` (영상 강의 등록한 과목만 = "강좌 등록 1개 이상 있어야 수강생" 정의)
- 후: `adminMode || isTeacherMode ? 모든 과목 : (user.subjects || [])` (선언 기반)
- 영향: 단어장 메뉴 노출은 이제 `students.subjects` 만 봄. 강좌 enrollment 없어도 영어 체크돼 있으면 단어장 보임. 영상 강의 페이지(`enrolledIds` 사용)는 그대로.

**부수 작업**:
- **B (학생 카드 진단 한 줄)** — AdminPanel 학생 카드 펼침 영역에 파란 박스 한 줄: '받은 단어장 N · 소속 반 N · 수강 강좌 N'. SQL 안 봐도 학생 상태 즉시 파악. state `vocabReceivedByStudent` 추가, 로드 시 vocab_assignment_students 전체 fetch → student_id로 그룹 카운트.
- **C (단어장 공개 전환 버튼)** — VocabManager 단어장 상세 헤더의 '준비중' 경고 배너에 우측 빨강 **"공개로 전환"** 버튼 추가. 확인창 → `vocab_lists.status='published'` UPDATE → load(). 단어장 목록으로 안 돌아가도 됨 (클릭 4→1).
- **D (클래스 중복 경고)** — AdminPanel `createTeacherClass`에 INSERT 전 사전 체크. 같은 선생님·학년·과목 반이 이미 있으면 기존 반 목록 보여주며 confirm. 막지는 않음 — 의도된 분반 가능.
- **+ 학생 직접 추가 모달 옵션 라벨 수정** — '자동 강좌 등록' → '체크한 과목의 첫 영상 강의 시청 권한도 같이 부여 (선택 — 안 해도 단어장·시험은 됨)'. 기본값 false로 (이제 우회 아님).

### ★ UX 단순화 3종 (v180, 2026-05-19) ★
사용자가 이상협 샘플 학생 추가 → 단어 보내기까지 테스트하다 단계마다 막힌 지점들을 한 번에 정리. (1) 학생 추가 통합 폼, (2) 일괄 발행에 개별 학생 허용, (3) 클래스 동명이인 표시.

- **(1) 수강생 관리 "+ 학생 직접 추가" 버튼** (AdminPanel.jsx) — 엑셀 import만 있던 자리에 빨강 버튼 추가. 모달 한 화면에서:
  - 이름·학생전화·학부모전화
  - 초중고 + 학년 (계단식 select — 초중고 선택해야 학년 옵션 열림)
  - 학교 (초중고에 매칭되는 학교만)
  - 수강 과목 체크박스 4개 (국어/영어/수학/과학)
  - 반 배정 드롭다운 (선택 — 학생 학년과 매칭되는 반만)
  - **"선택한 수강 과목 강좌에 자동 등록" 체크박스** (기본 ON) — 영어 체크하면 첫 active 영어 강좌에 enrollments INSERT까지. 학생 만든 즉시 단어장 메뉴 보임.
  - 함수: `openQuickAddStudent / closeQuickAddStudent / toggleQuickAddSubject / submitQuickAddStudent`. state: `quickAddOpen / quickAddDraft / quickAddSaving`.
  - students INSERT + class_students INSERT(선택 시) + enrollments INSERT(자동등록 시) 한 트랜잭션. auth.users는 만들지 않음 — 학생/학부모가 나중에 같은 email로 회원가입하면 handle_new_user 트리거가 자동 link.

- **(2) 일괄 발행에 개별 학생 지정 허용** (VocabManager.jsx VocabAssignmentModal) — 사용자가 "+ 보내기"와 "+ 선택 발행" 버튼 2개 차이를 외울 필요 없게.
  - 기존 line 2378의 `if (individualIds.length > 0) { alert('일괄 발행은 개별 학생 지정을 지원하지 않습니다...'); return; }` 가드 제거.
  - 기존 line 2531의 `!isBulk &&` 가드 제거 — bulk 모드에서도 개별 학생 직접 지정 섹션 노출.
  - 안내문 교체: "일괄 발행은 반·학년만..." → "일괄 발행: N명 개별 학생이 N개 유닛 전체에 동일하게 등록됩니다" (체크 시에만 표시).
  - 저장 로직: `vocab_assignments.insert(allRows).select('id')`로 ID 받아서, 각 assignment마다 `vocab_assignment_students` rows를 individualIds × insertedIds 카티전 곱으로 생성.

- **(3) 클래스 동명이인 표시** — 같은 학년 같은 과목 클래스 여러 개 허용. 모든 클래스 표시에 "선생님 이름 + 클래스명" 형식 사용.
  - **`B2Utils.classLabel(cls, teacherById?)`** 헬퍼 (Utils.jsx line 114~) — `cls.teachers.name`(Supabase JOIN) 우선, 없으면 `teacherById[cls.teacher_id]` lookup, 최종적으로 `teacherName + ' ' + clsName` 반환.
  - **VocabManager 클래스 쿼리** (load + VocabAssignmentModal) — `select('id, name')` → `select('id, name, class_name, grade, subject, teacher_id, teachers(name)')`로 확장.
  - **`assignmentTargetLabel`** + 모든 class 드롭다운 → `window.B2Utils.classLabel(c)` 사용.
  - AdminPanel "+ 학생 직접 추가" 모달의 반 드롭다운도 동일 형식: `"샘플 김도영 고1 영어"`.
  - 클래스 생성 제한은 안 거는 게 의도 — 사용자가 "같은 학년 같은 과목이 있을수 있어"라고 명시.

### ★ 유닛 체크박스 = 발행+취소 마스터 (v179, 2026-05-19) ★
- 증상: 단어장 시험 탭에서 유닛 하나 체크해도 '× 선택 취소' 버튼이 회색으로 남아 있어 작동 안 하는 것처럼 보임.
- 원인: 유닛 체크박스(`selectedUnitIndexes`)는 '+ 선택 발행'만 보고, '× 선택 취소'는 유닛 안의 보낸 발행 카드 체크박스(`selectedAssignmentIds`)만 봤음. 사용자가 유닛만 체크하면 발행 카드 선택은 비어 있어서 취소 버튼이 안 열림.
- 수정: `toggleUnitSelected(idx, unit.assignments)` — 유닛 체크 시 그 유닛의 모든 보낸 발행도 같이 자동 체크. 해제 시 같이 해제. 발행 카드 체크박스(개별)는 그대로 동작 — 일부만 골라 취소하는 흐름도 유지.
- UI 라벨: 유닛 체크박스 title 도 '이 유닛 선택 — 발행/취소 모두에 사용'으로.

### ★ 수강생 카드에 초중고 선택 추가 (v178, 2026-05-19) ★
- 사용자 요청: 관리자 수강생 관리에서 학생 카드를 펼치면 학년·학교만 있고 초중고 선택이 없어서, 학년 드롭다운에 12개(초1~고3)가 다 섞여 나오고 학교도 11개 다 섞여 나옴.
- AdminPanel.jsx 학생 카드 펼침 영역(3272행대) 상단에 **초중고 select 추가** — 학년·학교 앞쪽에 위치. 선택지: 초등/중등/고등.
- **state `expandedLevel`** (line 65 옆) — 펼칠 때 `levelFromGrade(st.grade)`로 자동 채움(이미 학년 있으면 그게 가리키는 초중고). 접으면 ''로 리셋.
- 초중고가 정해져야 학년·학교 드롭다운 활성화 — 그 전엔 회색·"먼저 초중고" 안내, 활성화되면 `SCHOOL_LEVELS[lv].grades`/`.schools`만 옵션으로(섞이지 않음).
- 초중고 바꿨을 때 기존 학년/학교가 새 초중고에 안 맞으면 자동으로 비움(DB students 행 grade/school NULL update + UI 갱신).
- 동작은 카드 펼침 단위 — 한 번에 한 학생만 펼치므로(single `expandedStudent`) 단일 state로 충분.

### ★ 단어장 '준비중/공개' 상태 추가 (v177, 2026-05-18) ★
- 사용자 요청: 단어장을 만들어두기만 하고 아직 발행 안 하는 잠금 상태 필요. 클래스 드롭다운엔 '학원 전체 공유'와 '특정 반'만 있어서 표현 길이 없었음.
- DB: `vocab_lists.status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published'))` 추가 (`migrations/2026-05-18_add_vocab_lists_status.sql`). 기존 행은 DEFAULT로 모두 'published' 채워짐.
- VocabManager.jsx 단어장 편집 모달: '상태' 드롭다운(공개/준비중)을 클래스 행 위에 단독 행으로 추가. draft 기본값 처리 + save() row에 status 포함. 클래스는 별도 행으로 분리.
- 단어장 목록 카드(`loadLists`): select에 status/class_id/school_level 추가. status='draft'이면 카드 배경 회색(#f3f4f6), 단어 수 빨강 뱃지 자리에 회색 '준비중' 뱃지.
- 단어장 상세(VocabListDetail): status='draft'이면 상단에 주황 안내 배너 + 헤더 타이틀 옆 '준비중' 회색 칩. 발행 버튼 3개(+ 선택 발행 / + 전체 발행 / 유닛별 + 보내기) 모두 disabled + 클릭 시 alert. 유닛 카드 버튼 라벨은 '잠금'으로 바뀜.
- 학생 화면엔 영향 없음(발행되지 않은 단어장은 원래 학생에게 안 보임).

### ★ 단어 학습 세트 5단계 → 4단계 축소 (v159, 2026-05-16) ★
- 2.5단계 빈칸 객관식을 제거 — 학습 흐름은 `1단계 단어 → 2단계 해석 → 3단계 영작 → 어법` 4단계로 단순화.
- VocabPlayer/VocabManager에서 `stage25` 분기 모두 제거. 엑셀 업로드 안내 `6시트 → 5시트` (2_5단계_빈칸 시트 빠짐). practice/test 기본 토글에서 `'25'` 키 제거. Utils.jsx 자료실 라벨, TeacherPortal·AdminPanel 안내 문구도 '4단계 학습 세트'.
- 호환: DB `vocab_study_sets.stage25` 컬럼은 그대로 둠(데이터 손실 방지). 기존 발행된 assignment에 `stages` 안에 `'25'`가 들어 있으면 UI에서 조용히 필터링.

### ★ DB·Edge Function 보안 무결성 작업 (v147~v148, 2026-05-15 새벽) ★
**배경**: Supabase 보안/성능 어드바이저 점수가 보안 15 WARN / 성능 237 INFO·WARN까지 쌓여 있어서 한 번에 정리.

- **v147 (완벽 모드, 보안 15→3 WARN / 성능 237→218)**
  - **RLS 헬퍼 4개를 `private` 스키마로 이전** — `current_role`·`current_student` (SECURITY DEFINER, RLS 재귀 차단용), `is_parent_of`·`teacher_has_student` (SECURITY INVOKER, private의 SD 헬퍼 호출). REST API에서 호출 못 함(OID 참조라 RLS는 정상).
  - **`pg_net`을 public → `extensions` 스키마로 이전** (DROP CASCADE + CREATE + cron job 재등록). 이전 cron 호출이 깨지지 않게 재예약 완료.
  - **attachments 버킷 UPDATE/DELETE를 `owner=auth.uid() OR admin OR teacher`로 제한** (전엔 누구나 덮어쓰기 가능했음).
  - **모든 `auth.uid()` 호출 19개 정책을 `(select auth.uid())`로 감쌈** — Postgres가 행마다 재호출하지 않고 statement 단위로 캐시.
  - **FK 17개에 인덱스 추가** (조인 성능).
  - DB 정리: class_students 중복 1건, classes '중2 영어 A반' 중복 1건 제거. students.phone='010' 34건 → NULL.
  - **Edge Function 회복력**: `analyze-exam`/`analyze-student` 둘 다 429/529/5xx 지수 백오프(1s, 2s) 최대 3회 자동 재시도. Opus 실패 시 Sonnet으로 자동 폴백(응답에 `fallback_to_sonnet: true`). 최종 실패 시 `analyze_status='failed'` + `analyze_error` 기록 → cron 2차 시간으로 재예약 가능.
  - 코드 중복 정리: `MATERIAL_DRAFT_INIT` → `B2Utils.materialDraftInit()` (Admin+Teacher 공용).
  - **남은 3 WARN은 의도된 것**:
    1. `link_family_by_phone` SECURITY DEFINER public (앱 RPC, 내부 검증 있음)
    2. `link_my_auth_account` SECURITY DEFINER public (앱 RPC, my_id=current_student 매칭)
    3. `auth_leaked_password_protection` 비활성 (HIBP 연동, 사용자 설정 항목 — 학원 환경에선 미활성 유지)

- **v148 (Edge Function 인증 + Error Boundary + cron health + RLS 분할, 성능 multiple_permissive 185→20)**
  - **Edge Function 권한 검증 (`checkAuth`)** — `analyze-exam` v11 / `analyze-student` v8 둘 다 동일 패턴.
    - `x-edge-internal-secret` 헤더 = `public.internal_config.edge_internal_secret`(64자, RLS deny-all)와 일치 → cron 신뢰 채널.
    - 사용자 JWT는 `role==='authenticated'` + `auth_user_id`로 `students.role` 조회 → `[admin/teacher/administrator/관리자/선생님/강사]`만 통과.
    - service_role 토큰은 그대로 통과(서버 코드용).
    - anon JWT 자체 호출은 403 — 외부 attacker가 학원 API 키로 Opus 토큰 무한 트리거 못 함.
  - **React Error Boundary** (`index.html:1211~1234`) — `class ErrorBoundary extends React.Component`로 App 감쌈. 한 컴포넌트가 throw해도 전체 흰화면 안 되고 "화면을 그리는 중 문제가 발생했어요 / 다시 시도하기" UI(브랜드 빨강 `#E60012`). 에러는 `public.client_errors`에 자동 INSERT(메시지·stack·component_stack·url·user_agent·created_at). 길이 제한 RLS(메시지 2000자/stack·component_stack 10000자/url 2000자/UA 500자)로 스팸 방지. SELECT는 admin/teacher만, DELETE는 admin만.
  - **`public.cron_health` 뷰** — `cron.job_run_details`를 최근 30분으로 묶어 `recent_failures/recent_successes/last_success/last_run/health(healthy|unhealthy|unknown)`. 마지막 성공 10분 이상 전이면 unhealthy. 현재 `process-scheduled-analyses` 30/30 성공·healthy.
  - **RLS 'ALL' 정책 분할** — 33개 테이블의 `FOR ALL` 정책을 `INSERT`/`UPDATE`/`DELETE` 3개 정책으로 분리. SELECT는 별도 `_read` 정책만 평가 → `multiple_permissive_policies` 185→20. 남은 20개 WARN은 `enrollments`(staff_all vs student_*) + `teachers`(admin_write vs self_update)의 의도된 staff↔student 중복(각각 다른 행에 적용되므로 OR 평가 자체가 의도).
  - 남은 `FOR ALL` 정책은 `public.internal_config.internal_config_deny_all` 하나뿐(시크릿 테이블이라 모두 막는 게 맞음).

### ★ 차량 운행/탑승 시스템 대대적 확장 (v125~v146, 2026-05-15 새벽) ★
v109(BusTracking 신설) + v116(차량 위치 관리) 이후, 정류장·탑승·신청·승인까지 운영 흐름 전체 구축.
- **v126**: 차량 정류장 + 학생 탑승 선택 — `bus_stops` 테이블, 학생이 정류장 선택해서 탑승 신청.
- **v127**: 차량 이용 신청·승인 흐름 — 학생 신청 → 관리자/선생님 승인/거절. 차량 수정 버튼 스크롤 버그 수정.
- **v128**: 다중 정차시간 + 다음 운행만 표시 + 좌석 기본 12석.
- **v129**: PC 정류장 폼 — 이름 옆에 시간 칸 6개 인라인 입력 한 줄로.
- **v131**: 정류장 추가는 이름만, 시간은 목록에서 선택 후 입력.
- **v133**: 정류장 행 안에 시간 입력칸 인라인(수정 버튼 없이 그 자리에서 추가).
- **v135**: 정류장 시간 칩·입력칸 디자인 정리(둥근 사각형 + 실선 테두리).
- **v136**: 관리자 차량 위치 탭에 '오늘 탑승 명단' 섹션.
- **v137**: 학생별 수업 시간(5개 고정) + 시간대별 정원 12명 제한.
- **v138**: 차량 만석 안내 메시지 명확화(다른 시간 선택 불가, 차량 자체 제공 불가).
- **v139**: 학생 PWA에 본인 수업 시간 + 그 수업의 정류장 픽업 시간 표시.
- **v140**: 반 시간·요일 + 학생 차량 시간 자동 매칭.
- **v141**: 반 시간을 요일별로 따로 입력 가능(월수 16:30, 금 15:00 같은 패턴).
- **v142**: 차량 시간을 오늘 요일+수업 시간으로 자동 계산.
- **v143~v145**: 중복 코드 정리 (academicCategory/formatBytes/attachmentPublicUrl → `B2Utils`), 미사용 DB 컬럼 제거. 회귀 점검에서 발견된 `dbStudents` 차량 필드 누락 + race 버그 수정.
- **v146**: 차량 이용 승인/거절 후 학생 카드 즉시 갱신 + `uses_bus` 끄면 신청 상태 리셋.
- **v125**: '기사 모드' → '차량 운행 모드'로 라벨 변경.

### ★ Claude 분석 예약 시스템 (v130, v132, 2026-05-15 새벽) ★
- **v130**: 즉시 분석 / 예약 분석 선택 가능. 1차 + 2차 백업 예약. cron `process-scheduled-analyses`가 1분마다 실행(현재 healthy, 30분간 30/30 성공).
- **v132**: 학생 답안 분석 예약 + 정류장 시간 누적 리스트 단순화.

### ★ 그 외 작업 (v120~v124, 2026-05-15 새벽) ★
- **v120 (PKCE 버그픽스)**: 비밀번호 재설정 링크가 자동 로그인되어 버리던 PKCE flow 버그 수정 — 이게 5/14 메모리(`project_b2bigbang_resend_smtp`)에서 막혔던 "메일에 링크 없음/링크 동작 이상" 문제의 진짜 원인이었음. Resend SMTP 자체는 정상이었고 클라이언트의 토큰 처리 흐름이 문제.
- **v121**: 관리자 학사일정에 달력 UI 추가(선생님 페이지와 동일).
- **v122**: 관리자 강의일정 변경에도 달력 UI 추가.
- **v123**: 단어장 1000행 한도 우회 + 페이지당 200개 UI 페이지네이션.
- **v124**: 단어시험: 모든 유닛에 한 번에 일괄 발행 + 마감일 간격 자동 계산.
- **v134**: 관리자 탭 재배치(시험관리·단어장을 수강생 그룹으로 이동).

---

> **v118 (2026-05-14)**: service-worker가 외부 도메인(카카오 SDK·React CDN·Supabase JS CDN·SheetJS CDN·Google Fonts 등) 요청을 가로채면 opaque 응답이 되어 CORB로 차단되던 문제 수정. fetch 핸들러 앞쪽에 `if (!sameOriginEarly) return;` 추가해 외부 요청은 브라우저 기본 처리에 맡김. 카카오 지도 SDK 로드 실패 해결의 핵심.
> **v117 (2026-05-14)**: BusTracking 운행 상태 자동 복원 + Wake Lock. 페이지 마운트 시 `vehicle_locations`에 `is_driving=true & driver_user_id=본인 & updated_at < 2분`이면 `driving` 자동 복원 — 기사가 새로고침하거나 통화 후 돌아와도 운행 시작 다시 안 눌러도 됨. Wake Lock API로 운행 중 화면 자동 꺼짐 방지(`visibilitychange` 시 재취득).
> **v116 (2026-05-14)**: 파일 업로드 multiple 지원 (단어 추가·5단계 세트·학생 명단) + 관리자 차량 위치 관리 탭 신설.
>   - **단어 추가 모달(VocabImportModal)**: 엑셀 여러 개 한 번에 선택 → 합쳐서 한 단어장에 추가. `parseOneExcel`/`handleExcels`로 분리.
>   - **새 모달 `VocabStudySetMultiUploadModal`** (단어장 상세 상단 `+ 여러 유닛 한꺼번에` 버튼): 파일명에서 `UNIT/Day/단원/유닛/u + 숫자` 정규식 패턴 자동 추출 → 각 유닛에 자동 매핑. 추출 실패한 행은 빨강으로 표시되고 사용자가 직접 유닛 번호 입력 가능. 한 번에 일괄 저장 — 각 파일별로 자료실 자동 등록 + 단어 자동 추가 포함. 같은 유닛 중복·덮어쓰기 가드.
>   - **AdminPanel '차량 위치' 탭** (`학원 관리` 그룹 신설): 카카오 JavaScript 키 입력+저장(`site_content.kakao_map_key`), 차량 등록/수정/삭제·활성토글(`vehicles`). 한 행 컴팩트 UI. 카카오 콘솔 가이드 안내문 포함.
>   - **AdminPanel 학생 명단 import**: 엑셀 여러 파일 선택 가능, 파일별로 미리보기·확인 후 순차 import.
>   - **회원가입 ROLE_OPTIONS** 라벨: `선생님` → `선생님 · 학원 직원`. 기사·행정직원도 여기서 가입한다는 안내문 추가.

### ★ 차량 실시간 위치 시스템 (v109 + v116~v118로 완성) ★
- DB: `vehicles`(id, name, driver_name, driver_phone, route, is_active, ...) + `vehicle_locations`(vehicle_id PK, lat, lng, heading, speed, accuracy, is_driving, driver_user_id, updated_at). Realtime 구독으로 학생/학부모 화면이 자동 갱신.
- `BusTracking.jsx` (`page === 'bus'`, TopNav '차량 위치' 메뉴): 카카오 지도 + 차량 마커. 관리자/선생님(`isAdmin || user.role==='teacher'`)에게만 `운행 시작` 버튼 노출. 운행 중이면 `navigator.geolocation.watchPosition`으로 25초 간격 GPS 송신(배터리·DB 절약). 자동 복원 + Wake Lock 적용.
- **카카오 콘솔 설정 (한 번 끝남)**: ① 좌측 `앱 > 플랫폼 키` > Default JS Key 카드 클릭 → **JavaScript SDK 도메인**에 `https://b2bigbang.com`, `https://finley78.github.io` 등록. ② `제품 설정 > 카카오맵` 활성화. ③ 관리자 '차량 위치' 탭에서 JavaScript 키(`7fbf65e2eb787a84dd40a2602628528c`) 입력 + 저장. 도메인 미등록 시 SDK 로드 응답이 의심스러워져 브라우저가 CORB로 차단 → "지도 로드 실패: 카카오 지도 SDK 로드 실패" 에러. 이게 v117까지 막혔던 진짜 원인.
- **운영 흐름**: 학원용 폰 한 대를 차량에 거치 → 그 폰으로 우리 앱 로그인 → `차량 위치` → `운행 시작` → 위치 권한 허용. 시동 켜면 그대로 운행 시작 자동 복원. 학생/학부모는 본인 기기에서 메뉴 누르면 실시간 차량 위치 확인.
- **남은 옵션 (선택)**: 아이킹 DTG API 연동(두리텍 측 답 받으면) 또는 OBD/시거잭 GPS 트래커 연동 — 그러면 폰 거치 안 해도 됨. 현재는 폰 거치 방식.

> v115: 5단계 학습 세트 업로드 시 원본 xlsx를 자료실에도 자동 보관.
> v114: 단어장 만들기/편집에 과목·초중고·학년·클래스 드롭다운 추가.
> v113: 빈 유닛 placeholder 제거 — 채워진 유닛만 표시.
> v112: 개별 학생 직접 지정 — 학생 리스트 항상 보임 + 체크박스.
> v111: 유닛 카드에서 연습 먼저, 시험 아래 순서로 정렬.
> v110: 옛 vocab_tests UI 제거 — 새 vocab_assignments 통합 흐름만.
> v109: 학원 차량 실시간 위치 페이지 (BusTracking) 신설 — 위 ★ 블록 참고.
> v108: 연습/시험 단계 체크 상태를 모드별로 분리.
> v107: 학생 페이지에 받은 연습/시험 섹션 + 응시 기록 (Phase B).
> v106: 연습/시험 보내기 통합 팝업 (vocab_assignments) — Phase A.
> v105: 자료실 자료 종류 단순화 — 단어장 원본/5단계 학습 세트 옵션 제거, 시험·문제집/기타 2종만. 단어장 자료는 단어장 메뉴에서 다룬다는 안내문 추가. 기존 vocab_list/vocab_study_set 행은 카드에 그대로 보임(라벨만 유지). 시험 발행 picker는 이미 material_type='exam' 필터로 영향 없음. (UX 간소화 #4)
> v104 (Phase 1.5): AdminPanel 레벨테스트/주간/월말/숙제 폼에도 TeacherPortal와 같은 분석 통합 흐름 적용. 답안지 입력 + 분석 범위 카드 + 정밀(Opus) 체크박스 2개 + '저장 + Claude 문항 분석' 버튼. 분석 성공하면 자료실(kind='material', material_type='exam') row 자동 추가 + material_id 연결. 이제 관리자도 자료실 안 거치고 시험 폼 한 곳에서 끝나는 흐름.
> v103 (★ Phase 2 — 5단계 학생 응시 화면): `StudySet5Player` 추가 — vocab_study_sets 행을 1→2→2.5→3→어법 순서로 풀기. 단계별 진행률, 보기 셔플(seeded 안 흔들림), 정답/오답 피드백, 단계 끝나면 단계 점수 + 다음 단계로, 모두 끝나면 종합 결과. 영작(3단계)은 텍스트 빈칸 입력(`Stage3Question`) — 영문 sentence를 `___`로 split해 input 박스. 이전/모름/다음 버튼 다 있음. 점수 저장 안 함(자유 학습). 학생 STUDY 모드 picker에 `5단계 학습 세트` 메인 옵션으로 (highlight bg). 자료 없으면 안내 메시지.
> v102: 단어시험 응시화면에 이전/건너뛰기/다음 + 자동 발음 (영어 단어 보이는 문제만). maxIdx 추적으로 이전 문제 review 모드 = 자동 진행 안 함. (다른 변경 동반.)
> v101: 시험·숙제 발행 폼에서 직접 분석 + 자료실 자동 수집 (TeacherPortal Phase 1).
> v100: 단어장 상세 상단에 '+ 5단계 학습 세트 업로드' 한 클릭.
> v99: 5단계 학습 세트 [+ 업로드]에서 단어도 자동 추출 + 다음 빈 유닛 placeholder. (1) `VocabStudySetUploadModal`이 props로 `unitSize`/`existingWords` 받고, `save()`가 study_set upsert 후 그 유닛의 sort_order 범위에 단어가 없으면 stage1에서 `word`+`correct` 뽑아 vocab_words에도 INSERT(sort_order = (unitIndex-1)*unitSize + i). (2) `unitsArray`가 항상 `max(maxWordUnit, maxStudyUnit) + 1` 유닛까지 표시 → 마지막에 빈 유닛 placeholder가 있어서 [+ 5단계 세트 업로드] 시작점이 됨. 빈 유닛 헤더 '단어 없음 — 5단계 세트 업로드해서 시작', '시험 N개' 표시는 단어 있을 때만, '+ 시험 추가' 카드도 단어 있을 때만. '유닛 N개' 헤더는 `maxWordUnit` 사용(placeholder 제외). 사용자의 워드마스터 201~250번 파일이 정확한 형식이었지만 단어 추가에 잘못 올려서 발생한 혼동 해결 — 이제 [+ 업로드]로 5단계 + 단어 한번에.
> v98: 단어장 import 파서 개선 — 헤더 자동 감지 + 컬럼 위치 자동 결정. (1) VocabImportModal `handleExcel`: 첫 행에서 '단어/word/영단/어휘', '뜻/의미/한국어/meaning', '예문/문장/example', '번호/순번/no.' 키워드 스캔 → hasHeader면 startIdx=1, wordCol/meaningCol/exampleCol 자동 매핑. 단어/뜻 헤더 없고 첫 컬럼이 '번호'면 한 칸 밀어서 (wordCol=1, meaningCol=2) 추정. (2) 모달 안내 텍스트도 "단어/뜻 2열, 번호/단어/뜻 3열 모두 OK"로 갱신. **사고 복구**: 사용자가 '워드마스터 수능 2000' 워드 학습 세트 4개 xlsx(50단어 유닛 × 4 = 200단어, 1단계_단어 시트에 번호/단어/정답)를 자료실 + 단어 추가 양쪽에 올렸는데 파서가 3열을 2열로 잘못 읽음 → 51개 깨진 행 들어가고 의미 통째 누락. 자료실 파일을 storage에서 직접 다운로드해 Node로 reparse → vocab_words 200개 + vocab_study_sets 4개(Unit 1~4) 정확히 재구성 후 INSERT (중복 빈 list 1개 같이 정리). TeacherPortal 출제 폼에 답안지 입력+분석 범위 UI 부분 복원도 같이 포함(WIP — 본격 refactor는 나중에).
> v97: 자료실(material) 자료 종류 표시. DB: `exams.material_type text` 추가(`migrations/2026-05-13_add_exams_material_type.sql` 적용 — 'exam'/'vocab_list'/'vocab_study_set'/'other', NULL=exam). Utils.jsx에 `materialTypeLabel(t)`·`materialTypeBadgeStyle(t)` 헬퍼 추가(파랑=exam·보라=vocab_list·청록=vocab_study_set·회색=other). 양쪽(TeacherPortal+AdminPanel) material 업로드 폼에 '자료 종류' 드롭다운 추가(MATERIAL_DRAFT_INIT·openMaterialFormForEdit·submitMaterial row 모두 material_type 반영). 자료실 카드 행 첫 뱃지로 종류 표시. 시험·숙제 발행 폼의 **'자료실에서 불러오기' picker는 `material_type==='exam'`만 필터** — 단어장 원본/5단계 학습 세트는 picker에 안 보임(단어장 메뉴에서만 다뤄야 함, 시험 발행에 잘못 끼우는 사고 방지).
> v96: 자료실(material) 업로드 폼의 file `accept`에 `.xlsx,.xls,.csv` 추가 — 엑셀 자료(예: 단어장 원본·5단계 학습 세트)도 자료실 도서관에 보관 가능. 라벨도 '이미지 또는 PDF'→'이미지·PDF·엑셀'. TeacherPortal+AdminPanel material form 양쪽 동일. 엑셀 파일은 Claude 분석 안 됨(이미지/PDF 전용 Edge Function) → 사용자는 '분석 없이 저장만' 버튼으로 보관용으로만 올림. (예외 가드 추가 안 함 — 사용자가 분석 누르면 Edge Function 에러로 안 들어가고 끝, 무해.)
> v95 (★ 새 기능 Phase 1 — 5단계 학습 세트 자리): 단어장 유닛별로 워드마스터 스타일 5단계 학습 세트(1단계 단어 5지선다 / 2단계 예문 해석 / 2.5단계 빈칸 / 3단계 영작 / 어법)를 엑셀 6시트로 업로드해 보관하는 데이터 자리 + 업로드 UI. DB: `vocab_study_sets` 테이블 추가 (`migrations/2026-05-13_add_vocab_study_sets.sql`) — list_id + unit_index UNIQUE, stage1/stage2/stage25/stage3/grammar 각각 jsonb, title·description·source_file_name 메타. RLS는 SELECT 전체, 인증된 사용자 INSERT/UPDATE/DELETE. VocabManager.jsx에 `VocabStudySetUploadModal`(`window.XLSX`로 6시트 파싱 — 시트명 부분 일치, 헤더 자동 스킵, 미리보기 카운트 + upsert `onConflict:'list_id,unit_index'`) + `VocabStudySetViewModal`(첫 문항 샘플 미리보기). 유닛 그리드 헤더 아래에 '5단계 세트 있음/없음' 행 추가 — 없으면 `[+ 업로드]`, 있으면 `[보기][교체]`. **Phase 2(다음)**: VocabPlayer에 5단계 풀기 흐름 + 채점(객관식은 인덱스 비교, 영작은 정답 배열 정확 일치, 1단계는 정답/오답 텍스트 비교). 학생 진입점은 미정 — '학습' 메뉴 새로 만들지 단어시험에 모드 추가할지 다음 결정.
> v94 (버그픽스): PC에서 메인 페이지 켤 때 옛 'feature' 배너 문구('첫 달 수강료 50% 할인' 등 `INITIAL_STATE.content`/`FeatureBand` 하드코딩 기본값)가 잠깐 보였다가 DB에서 받은 최신 문구로 바뀌는 깜빡임 수정. → (1) `feature` 콘텐츠를 받으면 `localStorage['b2_feature']`에 캐시 → 다음 로드 때 state 초기화 시 즉시 복원(`b2_db_cache` 패턴과 동일). (2) `featureLoaded` state(캐시 있으면 처음부터 true, 없으면 DB fetch 끝나면 true) → `index.html`이 `HomePage`에 전달 → `FeatureBand`가 `!featureLoaded`면 `return null`(아직 못 받았으면 배너 자체를 안 그림). 첫 방문(캐시 없음)엔 배너가 ~100ms 늦게 뜨지만 옛 문구 안 보임, 이후 방문은 캐시로 즉시·정확. (옛 하드코딩 기본값들은 그대로 둠 — DB row에 없는 필드 fallback용, featureLoaded 게이트로 깜빡임은 안 생김.) ⚠️ `event_button`(floating 버튼)도 비슷한 하드코딩 기본값 있지만 거기는 사용자 불만 없어 안 건드림.
> v90~v93 (다른 PC 세션, 단어시험): v90 단어 시험 '편집' 버튼→'학생에게 내기'로 명확화+문제 형식 설명. v91 단어 STUDY 자유연습 4모드 구현 + 시험 개별학생 픽커 필터·3열 그리드. v92 STUDY 자유연습 결과 화면에 '틀린 N개만 다시 풀기'. v93 단어 시험에 커트라인(합격) 점수 추가. (상세는 해당 커밋 메시지 참고 — 이 줄은 catch-up용.)
> v89: (1) 학사일정 **수정** 가능 — `openAcademicEditForm(item)`(`academicDraft.id` 세팅), `submitAcademicSchedule`가 `d.id` 있으면 update 아니면 insert. 폼 제목/버튼도 수정/등록 분기. 날짜 팝업·목록 항목에 [수정][삭제] 버튼. (2) **마전중** 학교 추가 — `TP_NEARBY_SCHOOLS`(TeacherPortal), `SCHOOLS`·`SCHOOL_LEVELS['중등'].schools`(AdminPanel)에 '마전중' 추가.
> v88 (버그픽스): 학사일정 달력이 하루 밀려 표시되던 버그 — `acByDate` 만들 때 `dt.toISOString().slice(0,10)`(UTC 변환)을 써서 KST에서 하루 빠르게 찍혔음(7/21 시작 일정이 7/20 칸에). → 로컬 날짜 컴포넌트(`dt.getFullYear()/getMonth()+1/getDate()`)로 계산하는 `_localDS()` 사용. `todayStr`(오늘 강조)도 동일 수정. (날짜 팝업의 `dayItems`는 문자열 비교라 원래 정상이었음 → 그래서 달력 셀과 팝업이 안 맞았던 것.) ⚠️ 다른 곳의 `new Date().toISOString().slice(0,10)`(날짜 기본값들)도 KST 새벽엔 하루 밀릴 수 있음 — 추후 정리 대상.
> v87: 학사일정 표시에서 제목이 분류 라벨('방학'/'시험기간')과 같으면 중복 안 보이게(`a.title !== academicCategoryLabel(a.category)`일 때만 제목 표시) — 날짜 팝업·목록·달력 셀 뱃지 모두. 항목 한 줄로 압축(분류뱃지 · 학교 · (제목) · 날짜범위). 달력 셀 뱃지는 학교명 우선, 없으면 제목/분류.
> v86: (1) **한국 공휴일 달력 표시** — `B2Utils.holidayName(dateStr)` (Utils.jsx): 고정 공휴일(`_KR_FIXED_HOLIDAYS` MM-DD 키 — 어느 해든)+ 음력/대체공휴일/선거(`_KR_VAR_HOLIDAYS` YYYY-MM-DD 키 — 2025·2026·2027 하드코딩, **매년 연초 갱신 필요**). 학원 일정 달력 셀에 공휴일이면 날짜 빨강·연빨강 배경·공휴일명 빨강 뱃지. 날짜별 팝업에도 "공휴일 — 이름" 표시. (2) **학원 일정 검색** — 모드 토글 아래 검색칸(`scheduleSearch`). 'change' 모드: 달력 아래 신청 목록 details(검색=teacher_name·reason·target_date, 검색어 있으면 펼침). 'academic' 모드: 기존 목록 details가 검색어 있으면 `academicList` 전체에서, 없으면 `academicInMonth`에서 필터(검색=title·school·description·분류·날짜).
> v85: 학사일정(TeacherPortal 학원 일정 탭, `scrMode==='academic'`) — 달력에서 날짜 클릭 시 추가폼이 아니라 **그 날 일정 보기 팝업**(`academicDayOpen` state, 그 날짜를 포함하는 academic_schedules 표시 + 삭제 버튼 + "+ 이 날 학사일정 추가" 버튼). 하단의 "이 달 학사일정 N건" 긴 목록은 `<details>`로 접음(기본 닫힘) + 안내문. 삭제 버튼은 created_by가 null이라 작성자 체크 빼고 항상 노출.
> v84: 학사일정 추가 FK 에러 수정 — `academic_schedules.created_by` 는 students(id) 참조인데 `teacherInfo.id`는 teachers 테이블 id라 FK 위반. → `created_by: null`로 (작성자는 `creator_name`으로 표시). ⚠️ 비슷하게 `exams.teacher_id`도 students(id) 가정인데 `user.id`를 넣음 — exams는 FK가 없어서 안 터지지만, 향후 FK 추가 시 주의.
> v83: (1) 성적 보기 학생 목록 행을 "점수 요약"(N회·최근·평균) → 그냥 이름·학년·반 + "성적 보기 ›" 로 (학생 누르면 그 학생 성적 보이게). 필터 위에 "필터 (선택)" 라벨 + "필터 초기화" 버튼, 목록 위 "학생 N명 — 누르면 성적 보임" 안내. 학생 반 이름 중복 제거. (2) 학사일정 추가 폼: 제목 입력칸을 분류='기타'일 때만 표시·필수. 방학/시험기간이면 제목 자동 = '방학'/'시험기간', 별도 안내문 표시. `submitAcademicSchedule`도 cat==='other'일 때만 제목 필수.

### ★ 진행 중: 성적 탭 재설계 (2026-05-12) — 시행착오 예상, 롤백 기준점 = git 태그 `rollback-before-scores-redesign` (= `?v=20260512v80-test-results-to-scores`) ★
**사용자 의도**: 선생님 페이지 "성적" 탭에 들어가면 → 종류 선택(숙제 / 주간테스트 / 월말테스트 / 레벨테스트) → 하나 고르면 → 필터(초중고 / 학년 / 과목 / 클래스) → 그 조건에 맞는 학생 목록 → 학생 골라서 성적 보기. (test_scores 의 `test_type`이 종류 — 앱 테스트는 '숙제'/'주간평가'/'월말평가'/'레벨테스트'/'시험', `B2Utils.syncExamScore`가 넣음. 학생 속성(학교급/학년/반)은 students/analysisClassStudents/analysisAllStudents 에서.) 잘못되면 `git reset --hard rollback-before-scores-redesign` 으로 복구.
- **v81 (1차)**: 성적 탭에 서브모드 `browse`('성적 보기') 추가 + **기본값으로 설정**. browse 흐름: `scoreBrowseKind` → 종류 버튼 → `scoreBrowseFilters`{level,grade,subject,classId} 드롭다운 + 조건의 학생 목록(이름·학년·반·횟수·최근/평균 점수, 한 줄) → 학생 누르면 `scoreBrowseStudent` → 그 학생의 그 종류 성적 목록. `scoreAnalysis`(test_scores) 필터, level은 `B2Utils.levelFromGrade(grade)`, class는 `analysisClassStudents`.
- **v82**: "종이 시험 성적 입력" 탭 → **"내신 성적 입력"**으로 개명·정리 (OMR 테스트는 자동 채점되니 여기는 학교 중간/기말/모의고사 등 앱 밖 시험만). testType 옵션을 학교 시험들(1학기 중간고사/기말고사/2학기.../모의고사/수행평가/기타 시험)로, 기본 '1학기 중간고사'. "성적 분석"의 시험명 필터는 `scoreAnalysis`의 실제 `test_name`들로 동적 생성. "성적 보기" picker에 **5번째 버튼 "내신"** 추가 — `scoreBrowseKind === '__naesin__'`면 `matchKind(r) = (r.exam_id == null)` (직접 입력한 점수 전부)로 필터. 매핑: 숙제→'숙제', 주간테스트→'주간평가', 월말테스트→'월말평가', 레벨테스트→'레벨테스트', 내신→exam_id NULL. **시행착오 예상 잔여**: 과목 필터 의미, 'register' 탭 라벨 모바일 줄바꿈, test_type='시험'(반 시험)은 picker에 없음.

> v79: TeacherPortal 테스트 탭의 발행된 테스트 목록을 큰 카드 → 한 줄 컴팩트 행(자료실 도서관 목록과 같은 스타일)으로. 한 행: 종류뱃지·상태뱃지·분석뱃지·과목·제목·제출N/N + 작은 버튼[수정][마감/재오픈][삭제], 아래 작은 회색 줄에 시험일·문항수·녹음·제한시간·이미지·설명. 제출자 보기는 그대로 `<details>`(접힘).
> v80: **앱 테스트 결과 → 성적(test_scores) 자동 연결**. DB: `test_scores.exam_id uuid` + 유니크 인덱스 `(exam_id, student_id)` (migration `2026-05-12_add_test_scores_exam_id.sql`; 종이 시험 직접 입력은 exam_id=NULL, NULL끼리 안 부딪힘). `B2Utils.syncExamScore(examId, submissionId)` — 객관식(answer_key vs answers 정규화 비교) + 서술형(text_scores 1/0, 다 채워졌을 때만) → 백분율로 환산해 `test_scores` upsert(`onConflict:'exam_id,student_id'`). 채점 가능한 문항 0개(녹음만)/서술형 미채점이면 안 씀. `teacher_id`는 NULL(test_scores.teacher_id=teachers(id), exams.teacher_id=students(id)라 id 공간 다름). `B2Utils.removeExamScores(examId)` — 시험 삭제 시 정리. 호출: StudentPortal `submitExamAnswer`(객관식 끝나면) / GradingForm onSave(TeacherPortal·AdminPanel) / `runStudentAnalysis`(AI 채점 후) / `deleteExam`·`adminDeleteLevelTest`(removeExamScores). 기존 객관식 채점 제출 2건은 SQL로 백필 완료. → 이제 "성적" 탭 성적 분석·학부모 리포트·수강생 카드 시험성적에 앱 테스트 점수가 들어감.
> v77~v78: TeacherPortal "테스트" 탭 진입 시 **종류 버튼 4개가 맨 위**(반 선택보다 먼저). 반 선택 전: 종류 버튼 클릭 → `pendingTestKind` 세팅(하이라이트) → "반 선택" 카드 안내문 갱신 → 반 클릭 → `selectClass` 후 `openExamForm(pendingTestKind)`. 반 선택 후: 종류 버튼 클릭 → 바로 `openExamForm(kind)`. 아래엔 그 반의 발행된 테스트 목록(`다른 반` 버튼). `examFormOpen`/`materialPickerOpen` 모달은 `selectedClass` 있을 때 블록 안에 렌더.
> v75: `renderExamAnalysis`(TeacherPortal/AdminPanel) 헤더를 "Claude 문항 분석 — 총 N문항 · 영어 · 5페이지 (날짜)" + summary 단락 → 그냥 "분석 내용" 한 줄로. 사용자 요청.
> v76: **TeacherPortal "시험"+"숙제" 탭 → "테스트" 탭 하나로 병합**. `TABS`에서 'homework' 제거, 'tests' 라벨 '시험'→'테스트', `TAB_GROUPS`의 'class' 그룹 tabs에서 'homework' 제거. `loadOnTabClick`·반선택카드·발행블록 모두 `teacherView === "tests"`만. `examList` 분할(`isHwTab`/`filteredExamList`) 제거 — 전부 한 목록. 발행 폼 종류 드롭다운 = **숙제 / 주간테스트 / 월말테스트 / 레벨테스트** (편집 중 옛 `kind='class'`면 '반 시험 (일반)' 옵션도). 헬퍼 `examKindLabel(k)`/`examKindBadgeStyle(k)` 추가, 시험 카드에 종류 뱃지. `openExamForm` 기본 'weekly'. `loadClassExams`·`submitExam` kindVal에 'level' 포함. **`kind='level'`(반 배포 레벨테스트)**: TeacherPortal 발행 폼은 다른 종류와 동일(점수범위 필드 없음), `class_id` 세팅 → 그 반 학생이 바로 응시(신청 절차 없음). StudentPortal: 반 시험 쿼리 `.in('kind',['class','weekly','monthly','homework','level'])`에 'level' 추가, `levelTests` 쿼리는 `.is('class_id', null)` 추가(신청용 = 관리자 발행 무반 레벨테스트만), `kind === 'level'` 신청-필요 가드 3곳에 `&& !exam.class_id`, `closeExam`의 `wasLevelTest`에 `&& !activeExam.class_id`. AdminPanel은 변경 없음(시험 관리에 teacher발 class-level test도 보임 — 정상).

### ★★ 큰 작업: "자료실 = 분석 자료 도서관" 화 (2026-05-12 시작) ★★
**사용자 의도**: 선생님 페이지에서 Claude 첨부파일 분석 기능을 **숙제·시험 발행 폼에서 빼서 → 자료실로** 옮긴다. 앞으로 선생님이 자료실에서 시험지를 분석해 저장해두면, 자료실을 **도서관처럼** — 시험·숙제를 만들 때 거기서 자료를 불러와서 출제. (집/학원 PC 전환 시 git pull 먼저!)
- **DB**: `exams.material_id uuid` 추가 (migration `2026-05-12_add_exams_material_id.sql`). **자료(material) = `exams` 행 중 `kind='material'`, `class_id=NULL`** — 일반 exam 컬럼 그대로(image_paths/answer_paths/analysis/answer_key/question_count/text_question_count/choices_per_question/analyze_model/analyze_student_model/analyze_page_range/selected_questions) 다 씀. 그래서 `analyze-exam` Edge Function은 **수정 없이** material에도 그대로 동작(exam_id 받아 처리). `kind='material'`은 학생/관리자 쪽 exam 쿼리에 안 잡힘(다 `.in('kind',['class','weekly','monthly','homework'])` 또는 `.eq('kind','level')`).
- **v67 (TeacherPortal) + v68 (AdminPanel) — 같은 패턴 양쪽 적용 완료**:
  - 자료실 탭(`teacherView==='files'` / AdminPanel `tab==='files'`)을 2섹션으로: ① **"시험·숙제용 분석 자료"**(새 도서관) ② "학생에게 보낼 자료"(기존 attachments 그대로). 도서관: `materials` state(=`exams` where kind='material', 전 선생님·관리자 공유), 검색·과목·학교급 필터, 카드(분석 완료/전 뱃지·문항 수·올린 사람), [분석 보기][수정][재분석/Claude 분석][삭제]. `+ 새 자료 분석` → `materialFormOpen` 모달: 제목·과목·학교급·학년·설명/출처 + 시험지 파일 + 답안지·해설 파일 + 분석 범위(페이지·쓸 문항 번호)·정밀 체크박스 2개(`precise`=문항분석 Opus, `precise_student`=학생분석 Opus) → `[저장하고 Claude 문항 분석]`(submitMaterial(true)) / `[분석 없이 저장만]`(submitMaterial(false)). 함수(TeacherPortal/AdminPanel 둘 다): `loadMaterials/openMaterialForm/openMaterialFormForEdit/closeMaterialForm/submitMaterial/reanalyzeMaterial/deleteMaterial/loadMaterialIntoExam/unlinkMaterialFromExam`. material 파일 storage 경로 `materials/<teacher_id|user.id|admin>/...` (attachments 버킷, public). `deleteMaterial`: 그 자료로 만든 시험 있으면 DB 행만, 없으면 storage 파일도.
  - **시험·숙제 발행 폼에서 분석 관련 UI 제거**: 답안지·해설 파일칸·분석 범위 카드(페이지·정밀 체크박스)·`[저장 및 문항 분석]` 버튼 → 사라짐. 대신 상단에 **`[자료실에서 불러오기]` 버튼** → `materialPickerOpen` 모달(분석된 material만 목록, 필터=과목·초중고·학년·검색 — 자료실 도서관 필터와 같은 `materialFilters` state 공유, default 옵션은 "과목"/"초중고"/"학년" — "전체" 안 씀) → 고르면 `loadMaterialIntoExam`: image_paths→existing_paths, answer_paths→answer_existing_paths, analysis·answer_key·question_count·text_question_count·choices_per_question·subject·analyze_model·analyze_student_model·`material_id` 채움(class/제목/날짜·학교급·학년은 사용자가). 불러왔으면 draft.material_id 세팅 + 초록 배너 + `[연결 해제]`(material_id·existing_paths·answer_existing_paths **+ analysis·answer_key·question_count·text_question_count·choices_per_question·analyze_page_range·selected_questions_text·precise(_student) 전부 초기화** — v74에서, 연결 해제 후에도 분석 내용·정답 남던 버그 수정). 발행 버튼은 `submitExam(false)`/`adminSubmitLevelTest(false)` (분석 호출 없음). row에 `analysis`·`material_id` 추가. **`deleteExam`/`adminDeleteLevelTest`: `material_id` 있으면 storage 파일 안 지움**(자료가 공유). 시험지 직접 올리기 input은 `!material_id`일 때만 노출. 객관식 정답 입력 그리드는 `answer_key` 키 기준(키 개수==question_count면 실제 번호, 아니면 1..N).
  - 모바일 뒤로가기 핸들러(TeacherPortal/AdminPanel 둘 다)에 `materialFormOpen`/`materialPickerOpen` 추가. 탭 진입 로드에 `loadMaterials()` 추가(files·tests/homework/leveltest 탭).
  - **v69~v70**: 자료실 도서관 목록을 **큰 카드 → 한 줄 컴팩트 행**으로(수백~수천 개 대비). 한 행: [분석완료/전 뱃지]·과목·초중고·학년·제목·문항수·올린사람·날짜 + 작은 버튼 `[원본][분석][수정][재분석][삭제]`. **행 펼치기(v71)**: 한 행에 버튼 `[자세히/접기][수정][분석/재분석][삭제]`. `[자세히]`(`materialAnalysisOpenId` 토글) 누르면 그 자료의 "원본 파일"(시험지·답안지 링크) + "분석 결과"(`renderExamAnalysis`, 없으면 안내문)를 한 번에 펼침. (v69의 행별 `[원본][분석]` 두 버튼은 상단 필터 `[원본][분석본]` 버튼과 헷갈려서 `[자세히]` 하나로 합침.)
  - **v72 (자료실 = 도서관만)**: 자료실 탭에서 옛 "학생에게 나눠줄 자료"(attachments 첨부파일 공유) 섹션을 **UI에서 제거** — 자료실 = "원본 자료 / 분석본" 도서관 하나만. (사용자: "배포는 다른 곳에서 하는 거고, 자료실은 원본 자료와 분석본 자료만 있는 도서관이다.") attachments 관련 state/함수(`attachments/attachDraft/uploadAttachment/deleteAttachment`)는 코드에 남아 있지만 안 쓰임 — StudentPortal의 학생용 attachments 표시는 그대로(기존 데이터). 자료실 헤더 "원본 자료 업로드", 모달 "원본 자료 업로드/수정", 버튼 "업로드하고 바로 분석" / "업로드만 (분석은 나중에)". **필터 행(v70)**: `[원본]`(전체)/`[분석본]`(분석된 것만) 토글 버튼 + 과목 + 초중고 + 학년 select + 검색. `materialFilters = {search, subject, level, grade, view}`. 초중고 선택 시 그 학년 옵션만(`gradeOptsForLevel`). 라벨: '학교급'→'초중고', '전체 과목'→'과목'. 자료 폼의 학년도 free text → select(초중고에 종속). 자료실 두 번째 섹션 제목 '학생에게 보낼 자료'→'학생에게 나눠줄 자료'+설명 보강(기존 attachments 기능, 시험·숙제용 분석 자료와 별개임). 옛 분석 시험은 `exams`에서 kind='material' 행으로 복제하고 원본의 `material_id` 연결(2026-05-12 DB do-block, "샘플 숙제 고3" → material `911e48e2-...`). (목록 가상화/페이지네이션은 미구현 — 현재 검색·필터로 좁힘.)
- **남은 것 (선택)**: ① StudentPortal이 material 공유 시험지 파일(`materials/...` 경로) 잘 보여주는지 실제 확인(attachments 버킷 public이라 됨). ② material 수정 시 옛 storage 파일은 안 지움(고아 누적) — 필요하면 정리. ③ `runExamAnalysis`/`analyzingExamId`/`analysisOpenId` 등 양쪽 죽은 코드 정리(현재 무해). ④ 시험별 문항 부분집합(`selected_questions`를 test에) — v67/68에선 material이 전체를 들고 test가 통째로 상속, test별 부분 선택은 미구현. ⑤ loadMaterialIntoExam이 school_level/target_grade는 안 채움(material '초등/중등/고등' ↔ exam '초/중/고' 매핑 필요) — 사용자가 폼에서 직접 선택.

### ★ 자동 문항 분석 시스템 (v41~v66 — 위 도서관화의 기반) ★
**목표**: 선생님 시험지 파일 업로드 → 답안지·해설 업로드 → Claude가 문항 수·정답·개념 분석 → 학생 응시 → 학생별 약점 분석표.
- **Phase A 완료** (v41~v44): `exams.answer_paths jsonb`(답안지 이미지/PDF), `exams.analysis jsonb`(분석 결과) 컬럼 추가. 발행 폼에 답안지 업로드(이미지+PDF 허용). Edge Function `analyze-exam`(verify_jwt=false): exam_id 받아 storage에서 시험지·답안지 다운로드 → Claude API(`claude-sonnet-4-6`, tool_use `report_exam_analysis`)로 문항 분석 → `exams.analysis` 저장. AdminPanel '시험 관리' + TeacherPortal 시험 카드에 '문항 분석'/'분석 보기' 버튼 + `renderExamAnalysis` 결과 표시(문항별 번호/페이지/유형/정답/단원/난이도/출제의도).
  - **필요 설정**: Supabase Edge Function Secrets 에 `ANTHROPIC_API_KEY` 추가해야 작동함 (없으면 함수가 에러 메시지 반환).
  - 비용: sonnet 기준 시험지+해설지 1세트 약 300~800원 (해설 분량에 비례).
- **v45~v46**: 시험 발행/수정 폼에 "현재 등록된 파일" 박스(시험지/답안지 개수 + 각각 "모두 삭제" 버튼 — `removeExamFilesAdmin`/`removeExamFilesTeacher`: storage.remove + DB 컬럼 빈 배열) + **썸네일 그리드**(`renderFileThumbs`: 이미지=58×76 썸네일, PDF/기타=확장자 박스, 클릭 시 새 탭 public URL). 폼 안 **답안지 파일 선택 바로 아래에** "저장하고 Claude 문항 분석 →" 버튼(`adminSubmitLevelTest(true)`/`submitExam(true)`: 저장 후 insert면 새 id 받아 바로 `analyze-exam` 호출, 끝나면 시험 카드에 분석 결과 펼침). 새 파일 선택 시 "새 시험지 N장 선택됨 (저장 시 교체)" 초록 안내.
- **Phase B-1 완료** (v47): `exams.analyze_page_range text`(분석할 페이지 "3-5" 등), `exams.selected_questions jsonb`(학생에게 낼 문항 번호 배열) 마이그레이션. `B2Utils.parseNumberRange("3-5,8")` → `[3,4,5,8]`. 발행 폼(AdminPanel/TeacherPortal)에 답안지 칸 아래·분석버튼 위에 "분석할 페이지"/"학생에게 낼 문항 번호" 입력칸 추가. Edge Function `analyze-exam` v3: `pdf-lib`로 시험지가 PDF·여러장이면 지정 페이지만 추출해 Claude에 전송(답안지는 항상 전체), `selected_questions`/`page_range`를 분석 지시문에 반영, `analysis`에 `requested_pages`·`requested_questions` 기록.
- **v48**: 문항 분석 UI를 **시험 발행/수정 폼(팝업) 안으로만** 모음 — 시험 카드 목록의 '문항 분석'/'분석 보기' 버튼 제거(카드엔 '수정·분석' 한 버튼, 분석된 시험은 '수정·분석(분석됨)'). 폼 안 버튼을 `[저장]`(빨강, submit(false)) / `[문항 분석]`(틸, submit(true)=저장+분석) **두 개로 분리**, 폼 하단은 `[닫기]`만. 폼 안에 이미 분석된 결과 있으면 `renderExamAnalysis(draft.analysis)` 표시(수정 폼 열면 결과 보임). 등록 파일 표시는 **썸네일 이미지 → 텍스트 목록**(`renderFileList`: "시험지 N (.jpg) `파일명` [열기]")으로 변경.
- **Phase B 남은 것**: 분석 결과로 시험 `answer_key`·`question_count`·`text_question_count` 자동 채움. `selected_questions`를 학생 응시 화면·자동 채점에 반영(그 번호만 OMR에 노출). 분석 결과 표시 시 selected 문항 강조.
- **Phase C 예정**: 학생 응답 + 문항 분석 → 학생별 약점 단원·개선 방향 분석표(`ai_comments` 또는 별 테이블) → 선생님 화면.

> **★ 이 블록이 최신입니다. 아래 옛날 섹션들(2026-05-08~09 등)은 참고용 — 일부는 롤백되어 현재 코드에 없음. ★**

### 어디까지 했나 (2026-05-09 ~ 2026-05-11 세션)
- 2026-05-09~10에 관리자/선생님 페이지·수강신청 승인 흐름·숙제시험 발행 폼 등 대규모 작업 → 그 중 "앱 단순화 리팩토링"(관리자/선생님 탭 통폐합 4단계)은 **사용자 요청으로 전부 revert함** (커밋 `e66c527`). 다시 살리려면 `git revert e66c527`. **롤백 기준점 = `380afef`(?v=20260510v16-exam-form)**.
- DB 마이그레이션(video_views FK 3개, enrollments.status+RLS, link_my_auth_account 확장, **courses.teacher_id 컬럼 추가**)은 코드 revert와 무관하게 그대로 적용됨. `migrations/2026-05-10*.sql` 참고.
- v49~v52: 등록 파일을 라벨 칩(`시험지 1페이지 (.jpg) [열기]`)으로, 새 시험 발행 시 객관식/서술형 기본 0. 시험지 칸도 PDF 허용 — StudentPortal 응시 화면 시험지 뷰어가 `.pdf`면 `<iframe>` + "새 탭에서 열기". 발행 폼 [저장]/[문항 분석] 두 버튼 → **[저장 및 문항 분석] 하나로 합침**(submit(true)). 이미 분석된 시험이면 confirm으로 "재분석 vs 저장만" 선택(취소 시 `doAnalyze=false`로 저장만). 버튼 크기 padding 12→10, fontSize 14→13. **`exams.analyze_model text`** 추가 — 발행 폼에 "고3 전용 (정밀 분석 — 비용 약 5배)" 체크박스(`draft.precise` → `analyze_model: 'opus'|'sonnet'`), Edge Function v4가 `analyze_model==='opus'`면 `claude-opus-4-7`, 아니면 `claude-sonnet-4-6` 사용. 시험 카드(목록)에 **"분석 완료" 초록 뱃지**(`exam.analysis` 있으면) — 다른 선생님 중복 분석 방지. v53: AdminPanel 시험 관리 탭에 **"분석 완료만 보기 (자료실)"** 토글 필터(`adminTestAnalyzedOnly`). v54: '고3 전용' 체크박스 라벨 간결화(비용 문구 제거). v55: **"저장 및 문항 분석" 시 폼을 닫지 않음** — 분석 끝나면 `setAdminLtDraft`/`setExamDraft`로 `analysis`·`id` 갱신해 폼 안에 결과 표시(`doAnalyze`일 때만 close 생략). **2022 3월 고3 영어 모의고사 분석 성공 확인** (`exams` id `a5b38ca1-...`): 21~40번 20문항 모두 분석, 토큰 입력 47759/출력 3556 ≈ Sonnet 약 250~300원. 그 시험의 옛 `question_count`(5)/`text_question_count`(1)/`allow_audio_answer`(true)는 0/false로 정리(수정 폼 체크박스 안 켜지게).
- **Phase B 핵심 완료 (v56)**: Edge Function `analyze-exam` v5가 분석 후 → `analysis.questions`에서 mc/text 문항을 추려 `exams` 행에 자동 반영: `question_count`=mc 개수, `text_question_count`=text 개수, `objective_total`=mc 개수, `allow_text_answer`=text>0, `choices_per_question`=mc choices_count 최대값, `answer_key`={실제문항번호: 정답}(`"확인 필요"`는 제외). `selected_questions`가 있으면 그 번호 문항만 사용. StudentPortal 응시 화면 OMR이 `answer_key` 키 개수가 `question_count`와 같으면 그 실제 번호(21~40 등)로 표시(아니면 1~qc fallback). AdminPanel 시험 카드 응시자 자동 채점 + GradingForm 자동 채점이 `Object.keys(answer_key)` 기준. AdminPanel 발행 폼 객관식 정답 입력칸도 answer_key 키 기준(라벨 "문항 분석하면 자동으로 채워집니다"). → 선생님은 시험지+답안지 올리고 "저장 및 문항 분석" 한 번이면 학생 OMR·자동 채점까지 완성.
- **Phase C 완료 (v57)**: `exam_submissions.ai_analysis jsonb` 컬럼. Edge Function `analyze-student`(verify_jwt=false): submission_id 받아 → exam.analysis(문항 정보)와 학생 답안(answers/text_answers)을 텍스트로 묶어 Claude(`claude-sonnet-4-6`, tool_use `report_student_analysis`)에 보냄 → score/total/percentage/wrong_questions/by_topic/weak_topics/strengths/mistake_pattern/summary/recommendation 받아 `ai_analysis`에 저장. 시험지 이미지는 안 보내서 학생 1명당 토큰 적음(텍스트만). AdminPanel 시험 카드 응시자 목록에 ('AI 약점 분석'/'재분석' 버튼 — `t.analysis` 있을 때만) + `renderStudentAnalysis` 결과 표시. → 전체 자동 문항 분석 시스템 완성: 선생님 시험지+답안 업로드 → '저장 및 문항 분석' → 학생 응시 → 'AI 약점 분석'.
- **v58**: `exams.hide_paper_for_students boolean DEFAULT false` 컬럼 + 발행 폼(AdminPanel/TeacherPortal)에 "종이 시험지로 진행 — 학생 화면엔 OMR만" 체크박스(`draft.hide_paper`). StudentPortal 응시 화면이 `hide_paper_for_students`면 시험지 뷰어를 숨기고 노란 안내박스 + OMR. v59: 학생 응시 모바일 OMR 시트에 `sheetMode='full'`(전체화면) 추가 — 헤더에 '전체'/'축소' 버튼. full이면 `position:fixed; inset:0; height:100dvh`로 OMR이 화면 전체 차지(폰 가로로 돌리면 가로 전체화면, OMR이 `repeat(auto-fit,minmax(220px,1fr))`라 여러 열로 펼쳐짐). 기존 `small`(35vh)/`large`(75vh)/`closed`는 그대로.
- **v60**: 복수 정답 객관식 지원 — Edge Function `analyze-exam` v6의 분석 스키마에 `pick_count`(고르는 답 개수, 기본 1) 추가, 지시문에 "'두 개 고르시오' 등은 pick_count를 그 수로, answer는 콤마 연결('2,4')". `answer_key` 값에 콤마가 있으면 그 문항은 복수 정답(정렬 저장). StudentPortal OMR: 그 문항은 헤더에 '(N개)' 표시 + N개까지 토글 선택(초과 시 가장 오래된 것 빠짐), `examAnswers[num]`을 콤마 정렬 string으로. 자동 채점(AdminPanel 응시자/GradingForm, TeacherPortal 제출자)이 양쪽 콤마 split→sort→join 정규화 비교. **TeacherPortal 시험 카드 '제출자 보기'에 자동 채점 점수(정답/오답 표시) + 'AI 약점 분석' 버튼·결과 추가** — 시험 출제한 담당 선생님도 자기 시험 결과·약점 분석을 볼 수 있게(피드백용). 관리자는 '시험 관리' 탭에서 모든 시험.
- **v61**: AI 약점 재분석 시 confirm('이미 분석됨, 다시? 약 50원'). v62: `B2Utils.buildStudentReportHtml(a, studentName, examTitle, opts)` + `printStudentReport(...)` — 약점 분석 결과를 인쇄/PDF용 HTML 리포트(헤더에 학원명·학생·시험·날짜, SVG 도넛 차트로 정답률, 단원별 막대그래프 표, 약점/강점 칩, 실수 패턴·종합평·추천 학습 박스, "인쇄/PDF로 저장" 버튼)로 새 창에 띄움. AdminPanel 응시자·TeacherPortal 제출자 목록에 `s.ai_analysis` 있으면 '리포트 인쇄·PDF' 버튼. 브라우저 인쇄 대화상자 → "PDF로 저장" 선택 가능.
- **v63 (중요 버그픽스)**: `analyze-student` Edge Function v2 — **객관식 점수·정답수·단원별 통계는 더 이상 Claude가 계산하지 않고 서버가 `answer_key`와 학생 답을 정규화 비교해 직접 계산**(자동 채점과 항상 일치). Claude는 글쓰기만. 이전엔 Claude가 텍스트로 채점하다 점수가 어긋나는 버그(자동 2/20인데 AI 7/20)가 있었음 — 근본 수정. `renderStudentAnalysis`·리포트에 `text_feedback` 표시 추가.
- **analyze-student v3 (서술형 자동 채점)**: 서술형 문항도 채점에 포함 — Claude가 `analysis.questions[].answer`(답안지 모범답안) 대비 학생 답안을 문항별로 `text_results: [{number, correct(bool), reason}]`로 판정(표현 달라도 핵심 맞으면 true). 서버가 `score = mc 맞은 수 + 서술형 맞은 수`, `total = mc 채점가능 + 서술형 수`로 합산, `percentage` 재계산, `by_topic`에 서술형도 포함, `wrong_questions`에 틀린 서술형 번호도. `ai_analysis`에 `mc_score/mc_total/text_score/text_total/text_results`도 기록. `exam_submissions.text_scores`를 1/0으로 업데이트(GradingForm에 미리 채워져 선생님이 확인·수정). `text_feedback`에 Claude 종합평 + 문항별 판단 근거 합침. 문제집 서술형은 정답이 명확하므로 객관식만큼 정확. (자동 채점(즉시·무료)은 여전히 객관식만, answer_key 기준.)
- **v64~v66 (2026-05-12 AI 분석 고도화)**: v64 — `analyze-exam` 툴에 문항별 `choice_explanations:[{choice,role,why}]`(선지별 해설·함정 종류) 추가, `analyze-student`가 학생 틀린 객관식을 그 해설에 매칭(`wrong_details`) + 함정형/이해부족형 등 자동 진단(`diagnosis`). v65 — choice role enum을 영어 독해 전용 → 전 과목 공용(정답/매력적인 오답/흔한 오개념/부분만 맞음/범위·정도 오류/반대·모순/무관·엉뚱/계산·적용 실수/기타 오답)으로, BASE_INSTRUCTION에 어법·문법·수학·과학 도메인 지침 추가, 진단을 3분류(함정형/개념부족형/실수형)+혼합형. v66 — `exams.analyze_student_model text` 추가, 학생 답안 분석 모델을 시험별 선택(발행 폼 '학생 답안 분석도 정밀하게' 체크박스 → 'opus'면 Opus). `supabase/functions/analyze-{exam,student}/index.ts` = 버전관리 사본(실배포는 Supabase Studio).
- **남은 것(선택)**: TeacherPortal 발행 폼에도 answer_key 입력칸 노출(현재 AdminPanel만). 학생/학부모 화면에 약점 분석/리포트 노출 여부. (API 비용: 시험 문항 분석 1회 Sonnet ≈ 270원, 학생 약점 분석 1명 ≈ 47원. Claude.ai Max 구독과 별개로 console API 선불 충전·차감. 한 시험 = 분석 1번 + 응시 학생 수만큼 약점 분석, 응시·자동채점은 API 안 씀 무료.)
- 2026-05-10~11 추가 작업 (전부 push·배포 완료, ?v 순서 v25→v63):
  - 단어장: 시험 탭 유닛을 그리드로 + "유닛 전체 시험 만들기" 버튼(`VocabManager` `createTestsForAllUnits`). 단어 시험 '학년으로 배포' 추가, 유닛에 시험 있으면 '시험 추가' 카드 숨김.
  - 선생님 페이지 버튼 크기 표준화(`buttonStyle`/`lightButtonStyle`에 fontSize·fontFamily·반응형, `smallButtonStyle` 계열 신설). 선생님 홈 메뉴 카드 11개를 같은 너비 그리드로.
  - 학사일정: 분류 '시험'→'시험기간'(TeacherPortal/AdminPanel `academicCategoryLabel`), 학교 칸 자유입력→드롭다운(`TP_NEARBY_SCHOOLS`).
  - 관리자 '학원 일정': 빨강 배지가 탭 한 번 열면 사라지게(`scrSeenAt` localStorage `b2_admin_scr_seen`), 선생님 필터 드롭다운 = `dbTeachers`→`dbTeacherProfiles`.
  - **`courses.teacher_id` 컬럼 추가** — 코드 전반이 전제인데 DB에 없어 강좌 개설 시 "Could not find the teacher_id column" 에러. plain uuid(FK 없음). index.html 강좌 매핑에도 `teacher_id` 추가.
  - 관리자 '전체 강좌/영상 관리' 선생님 필터 동작 수정(매핑에 teacher_id 없었음 + ID 공간 불일치 — courses/classes.teacher_id는 teachers.id 참조).
  - '강의 추가' 탭: 초중고+학년+과목 모두 필수였던 걸 **과목만 필수**, 나머지 선택. 자동 수강 배정 캐스케이드(클래스→그 반 / 학년→그 학년+과목 / 둘 다 없음→그 과목 학생 전체).
  - 선생님 강좌 **수정·삭제** 가능하게('내 강좌' 목록에 [수정][삭제], 수정=이름·설명·과목 인라인 패널, 삭제=`is_active=false` + enrollments 비활성화). `loadTeacherCourses`에 `.eq("is_active", true)` 추가.
  - 강좌 '개별 학생' 배포: 반 먼저 골라야 했던 걸 → `renderStudentPicker`(이름 검색 + 학년 필터 + (선택)반 필터, '보이는 N명 모두 추가/빼기', 학년·반 상호 배타). 배포 대상 라디오에서 '학년' 옵션 제거(개설 폼·배포 설정 양쪽).
  - '성적 등록' → **'종이 시험 성적 입력'**으로 개명 + 주황 안내박스(앱 단어시험·객관식 시험은 자동 채점되니 여기 입력 불필요, 결과는 '성적 분석'). 학생 목록을 그리드+컴팩트하게(178px 칸, 점수 입력 시 자동 체크).
  - **수강생 카드 펼치면 시험 성적·출결 표시 + 오늘 출결 토글** (v40-attendance). AdminPanel에 `adminAttendance` state + 전체 로드 + `toggleAttendance(student_id, status)` 함수. 펼친 카드 오른쪽 컬럼: 최근 시험 성적 5건(`adminAnalysis`/`test_scores` 필터, 80/60 색상), 출결 이번 달 통계 4박스(present/late/absent/excused) + 오늘 출결 토글 4버튼(같은 status 재클릭 시 해제). `attendance`에 UNIQUE(student_id, date) 마이그레이션 적용. TeacherPortal `📅` 이모지 제거.
  - **자동 문항 분석을 위한 답안지·해설 업로드 필드 추가** (v41-answer-upload). `exams.answer_paths jsonb DEFAULT '[]'` 마이그레이션. AdminPanel/TeacherPortal 시험 발행·수정 폼에 시험지 이미지 입력 직하에 답안지 입력 추가 (image_paths와 동일 패턴: state/UI/submit/edit/delete 모두). Storage 경로: `exams/<class_id|level>/answers/...`. 다음 단계는 Claude Vision으로 시험지+답안지 분석 → `exam_analyses.question_stats` 저장. **PC 푸터(SiteFooter) 개선** — 학원명/대표자/사업자번호/주소/전화/이메일/운영시간이 PC에서 한 줄로 펼쳐져 너무 띄엄띄엄 보이던 것을 어두운 카드 박스로 묶고 flex-wrap·columnGap 28px·rowGap 8px로 좁게 정렬. 모바일/PWA는 1열 stack 그대로.
- 상세 작업 로그·커밋 해시 순서·가챠는 메모리 `project_b2bigbang_2026-05_admin_work.md`에도 있음 (이 파일과 메모리 둘 다 봐도 됨).

### ★ 단어 시험 — 2026-05-13 작업 (v90~v93) ★
- **v90** (`?v=20260513v90-vocab-give-test-label`): VocabManager 시험 카드의 '편집' 버튼이 배포·출제 입구인데 이름이 불명확 → **'준비중' 시험은 빨강 `[학생에게 내기]` 한 버튼**(누르면 배포대상·문제형식 설정창), **'진행중/마감'은 `[결과][수정]`** 두 버튼. 준비중 카드 본문 클릭 시 결과창 대신 설정창. 설정 모달 제목 → "시험 설정 — 배포 대상·문제 형식·상태", '모드별 문제 수' 섹션에 객관식(=단어 보고 뜻 고르기/반대, 출제 방향으로 선택)·스펠링(빈칸)·뜻 보고 쓰기·듣고 쓰기 설명 추가. '유닛 전체 시험 만들기' 안내 문구도 새 버튼명 반영.
- **v91** (`?v=20260513v91-vocab-study-modes-and-picker`): ① **STUDY(자유 학습) 4모드 구현** — Flash Card 외 객관식/스펠링 채우기/뜻 보고 쓰기/듣고 쓰기가 "곧 만나요" 플레이스홀더였던 걸 실제 동작하게. `VocabPlayer.jsx`에 `StudyQuizPlayer` 추가 — TEST 의 문제 엔진(`buildOne`/`QuestionCard`/`MCQuestion` 등)을 그대로 재사용, **시간 제한·점수 저장 없음**(student-paced: 답→즉시 정답 확인→'다음 문제'). setup 화면에서 객관식=출제 방향(단어→뜻/뜻→단어/섞어서), 스펠링=난이도(Easy 30%/보통 50%/Hard 전체) 선택. 결과 화면에 정답률·틀린 단어 목록·'다시 풀기'. 듣기 모드는 문제 진입 시 발음 자동. `StudyPlayer`가 flashcard 외 모드를 `StudyQuizPlayer`로 라우팅. ② **VocabTestEditModal '개별 학생' 픽커 개편** — 이름 검색만 있던 걸 **초중고(초/중/고/전체) 버튼 + 학년 드롭다운(초중고 선택 시 그 학교급 학년만) + 이름 검색** 3중 필터로. 학교급은 `grade` 문자열에서 파생(`gradeLvl`: '중'→중,'고'→고,나머지→초). '필터 초기화', '보이는 N명 선택/해제' 버튼. 학생 목록을 **세로 1열 → 3열 반응형 그리드**(`repeat(auto-fill,minmax(165px,1fr))`, maxHeight 220px 스크롤), 각 칸 [체크][이름][학년] 컴팩트.
- **v92** (`?v=20260513v92-vocab-study-retry-wrong`): STUDY 자유연습 결과 화면에 **'틀린 N개만 다시 풀기'** 버튼 추가. `buildSet`→`buildSetFrom(srcWords)` 일반화(`begin()`=유닛 전체, `retryWrong()`=틀린 단어만), 객관식 보기는 여전히 유닛 전체에서 뽑음. 버튼 3개: [틀린 N개만 다시](틀린 게 있을 때만) / [전체 다시 풀기] / [모드 선택으로].
- **v93** (`?v=20260513v93-vocab-pass-score`): **시험 커트라인(합격) 점수** — `vocab_tests.pass_score int4 NOT NULL DEFAULT 0`(0=없음, check 0~100) 마이그레이션(`migrations/2026-05-13_add_vocab_tests_pass_score.sql`, MCP로 적용 완료). 시험 설정 모달에 '커트라인(합격) 점수' 입력칸(예상 시험 시간 아래). `save()` payload + `vocab_test_preset`에 `pass_score` 포함. StudentPortal 응시 결과(`QuizRunner` done)·`AttemptDetail`·`ReportCard` 목록·`TestMenu` 카드(테두리 색+칩+'내 최고 N점·커트라인')·`Ranking` 행에 percentage>=pass_score면 '합격'(초록)/아니면 '불합격'(빨강) 칩 + 미달이면 "다시 응시해서 통과해 보세요"(재응시 가능 시)/"재응시 횟수 끝남" 안내. 선생님 `VocabTestResultsModal`에 합격 N명/불합격 N명·합격률 요약 + 학생별 행 칩. TeacherPortal 학생 상세 단어시험 목록에도 칩. ※ 응시 횟수 제한(`attempts_allowed`)은 별개 — 커트라인은 표시·권유만, 강제 재응시는 안 함.
- **남은 것 (단어 시험)**: STUDY 문제 수 선택 옵션(현재 유닛 단어 전체 고정), Easy/Hard 를 빈칸비율 외 다른 모드에도, STUDY 연습 기록 저장 여부, QuizRunner 결과 화면에서 직접 '다시 응시' 버튼(현재는 목록으로 가서 다시).

### ★ 다음에 이어서 할 일 (후보 — 사용자가 우선순위 결정) ★
1. **단순화 리팩토링** — 했다가 전부 revert함. 다시 하려면 `git revert e66c527`(통째로) 또는 개별 cherry-pick. 또는 처음부터 다시. 남은 후보(render-block 수술 필요해 더 위험): ① 회원정보 탭을 수강생 관리에 흡수(학부모 정보가 회원정보에만 있어 단순 제거 불가), ② 선생님 관리 안의 per-teacher '담당 반 관리' 제거(클래스 관리 탭이 일원화), ③ 성적분석 탭에서 '학생별 분석' 모드 제거(학생 상세로 흡수), 선생님 상세 통합, TeacherPortal 시험/숙제 탭 1개로 병합.
2. **TeacherPortal 시험 카드 종류 뱃지**(주간/월말/반시험 kind) — AdminPanel엔 있는데 TeacherPortal엔 없음.
4. **출결 시스템 확장** — AdminPanel 수강생 카드는 오늘 출결 토글·이번 달 통계까지 완료(v40). 다음 단계: 선생님 페이지에서도 출결 입력, 출결 캘린더/월별 상세 보기, 학부모/학생 화면에 출결 표시.
5. **시험지 분석표** — 자동 채점 결과 기반 문항별 정답률·약점 등. AdminPanel '성적 분석'의 '시험지 분석'(준비 중) 자리. 사용자가 양식 줄 예정.
6. **Naver OAuth 검수 요청**(현재 '개발 중' — 학생 일반 사용 가능하려면).

### 오늘(2026-05-09) 한 일 정리 (PWA 세션·로그인 보안)
- **PWA 5분 자동 로그아웃이 실제로는 안 되던 버그 수정** (?v=20260509l-pwa-session)
  - 진짜 원인: `B2Utils.clearAuthStorage()`가 `b2_user`/`b2_is_admin`/`b2_admin_authed`/`b2_hidden_at`만 지우고 **Supabase의 `sb-<ref>-auth-token` 키들은 그대로 두어서**, 페이지 reload 시 `onAuthStateChange`가 자동 SIGNED_IN으로 다시 로그인 처리됨
  - 수정: `clearAuthStorage()`가 localStorage의 모든 `sb-` prefix 키를 함께 제거. `index.html`의 `checkSessionExpiryOnLoad`도 동일 처리. visibilitychange 핸들러는 5분 초과 시 `clearAuthStorage` → `signOut` → `window.location.reload()`로 클라이언트 상태까지 끊음
- **자동입력 직후 자동 로그인 방지** (LoginModal)
  - emailMode 진입 시각을 `emailModeOpenedAtRef`에 기록, `handleEmailLogin` 호출 시 800ms 이내면 무시 → Chrome 비밀번호 매니저가 자동완성 직후 시뮬레이션하는 Enter/submit 트리거 차단
- **아이디 저장 체크박스 추가** (LoginModal emailMode)
  - 비밀번호 input 아래 체크박스, accent color는 PWA 빨강 / PC 그린
  - 체크 후 로그인 성공 시 `b2_remembered_email`에 lowercase 저장, 모달 mount 시 자동 채움
  - 체크 해제 시 즉시 삭제 (onChange에서)

### 최근 작업 (2026-05-08~09, 인증 마이그레이션·무결성 감사·UI 통일)
- **Supabase Auth 전면 이전 (Phase 1~7)**:
  - Phase 1 (a39cab6): 스키마+헬퍼 함수 비파괴적 추가
  - Phase 2 (04d8a7e): 기존 7명 auth.users 백필 + 관리자 지정
  - Phase 3 (bafb4df): 이메일/비번 로그인을 Supabase Auth로 교체
  - Phase 4 (90c12fe): OAuth 콜백을 syncSession에서 단일 처리
  - Phase 5 (8b2a428): RLS 정책 일괄 플립 + 학생-학부모 자동 연결 헬퍼
  - Phase 6 (4249449/fb75b7a): 레거시 인증 코드·객체 cleanup (코드만 → 파괴적)
  - Phase 7 (f2b8a54/c9f81e3/a544661/6b13192): 무결성 감사 후속, 트리거 role 화이트리스트, email 대소문자 일관성, 학생 카드 학년 동그라미·전화번호 표시 통일, 학부모 자녀 상세 헤더 통일
  - migrations baseline (3b2fc0b): 라이브 Supabase 스키마 통째 캡처
- **회원 정보·학습 현황·시험 관리 카드 반응형 그리드 통일** (7075c83)
- **성적 분석 필터 개선** (062420d): 반 선택 없이도 다른 필터로 결과 나오도록

### 오늘(2026-05-08) 한 일 정리
- **수강생 관리 대대적 개선** (?v=20260510l~x)
  - 학생 카드 콤팩트화 (padding/margin/font 축소, 전화번호 1줄 인라인)
  - 이름 첫글자 동그라미 제거, '[학년] 이름 [과목]' 한 줄 인라인
  - 이름 아래 흐린 학교/학년/전화 줄 제거
  - 반응형 그리드: `repeat(auto-fill, minmax(280px, 1fr))` — 큰 화면에서 4열까지
  - 펼친 카드 한 줄 통째로 차지 (`gridColumn: '1/-1'`) + `order: -1`로 목록 맨 위에 표시
  - 펼치면 자동 스크롤 (`#student-grid-top` ID 앵커, scrollIntoView)
  - 펼친 카드 안 좌우 2열 그리드: 좌=학년/학교/과목/선생님/강좌, 우=특이사항(adminRecords)/시험성적(준비중)/출결(준비중)
  - **담당 선생님 추가/해제 토글** (변경 X, 추가 O — 한 학생이 여러 선생님 동시 수강 가능). picker 메시지 업데이트, '+ 추가/해제' UI
  - 학생 카드의 담당 선생님 칸도 모든 배정 표시
  - 이름 검색 입력란 추가 (`studentNameSearch` state, 필터 row에 input)
  - 정렬 옵션 추가: 학년 낮은순/높은순, 과목순 (국·영·수·과)
  - 저장 토스트 (우하단 초록 '✓ 저장됨' 1.8초): `saveToast` state + `showSaved()` helper, 학년/학교/과목/강좌 변경 시 표시
- **선생님 담당 클래스 버그**: 다른 반 클릭 시 `selectedStudent`/`studentDetail` 초기화 추가
- **관리자/선생님 홈 PC 버튼 크기**: 수강생 카드 높이와 동일하게 (52px·12px 모서리·카드 그림자)
- **'+ 강좌 추가'** → '+ 개별 강좌 추가'로 이름 변경 + 수강 과목 버튼 옆으로 이동
- **이모지 전부 제거** (?v=20260510x): AdminPanel/HomePage/StudentPortal/TeacherPortal/VocabManager/VocabPlayer/Utils 전 파일. 순위 메달은 'N위' 텍스트로. **앞으로도 이모지 절대 금지** (CLAUDE.md UI 컨벤션 + 메모리 영구 저장)

### 단어시험 시스템 (보카트레인 B안) — 2026-05-08~10
**개요**: 단어장 만들기 → 시험 만들기 → 학생 응시 → 결과/순위. 학원 전체 공유 컨셉.

**합의된 설계 (변경 시 사용자 확인 필수)**:
- B안 = Flash Card + 4모드(객관식/스펠링/쓰기/듣기), Bingo 생략
- 한 시험 = 한 유닛 (단어장의 N단어를 unit_size로 나눠 자동 분할)
- 응시 결과 즉시 공개 (점수+정답)
- 단어장 학원 전체 공유 (관리자/선생님 모두 read+write)
- 발음: 브라우저 SpeechSynthesis API 무료, 학생 화면 자동 재생 / 선생님 관리 화면은 수동 버튼
- 사진 X (텍스트만), 예문 컬럼은 있으나 학습/시험에서는 미사용
- 연습은 기록 안 함 / 시험은 기록·순위
- 품사: 한글 표시 (영어 약어 자동 변환), 자동 채우기 가능 (Free Dictionary API)

**DB 스키마 (5개 테이블)**:
- `vocab_lists` (id, name, subject, grade, unit_size DEFAULT 20, vocab_test_preset 없음)
- `vocab_words` (list_id, word, meaning, part_of_speech, example, image_url, sort_order)
- `vocab_tests` (list_id, unit_index, multiple_choice_count, spelling_count, writing_count, listening_count, choices_per_question, question_direction, spelling_blank_ratio, seconds_per_question, show_answer_seconds, attempts_allowed, status, due_at)
- `vocab_test_assignments` (test_id, class_id, student_id) — 반/학생 다중
- `vocab_test_attempts` (test_id, student_id, questions jsonb, answers jsonb, score, total, percentage, attempt_number)
- + `classes.vocab_test_preset jsonb` (선생님이 미리 저장한 시험 형식)

모두 RLS는 모든 작업 허용 (학원 자체 인증, 권한은 클라이언트).

**파일 구조**:
- `VocabManager.jsx/.js` — 선생님·관리자 단어장+시험 관리 (양쪽에 같은 컴포넌트 마운트)
- `VocabPlayer.jsx/.js` — 학생 STUDY/TEST/REPORT/RANKING 4섹션
- AdminPanel: '학원 관리' 그룹에 '단어장' 탭, TeacherPortal: '수업 관리' 그룹에 '단어장' 탭
- StudentPortal: 강의실 홈에 '단어 시험' 카드 (studentMode='vocab')

**기능별 위치**:
- 단어 추가 (엑셀/붙여넣기/직접): VocabManager > VocabImportModal
  - 붙여넣기는 단어 박스 / 뜻 박스 좌우 분리 (같은 줄 번호끼리 매칭)
- 시험 만들기: VocabManager > VocabTestEditModal
  - "시험 설정" 탭 상단의 클래스 카드 그리드 = 클릭 시 그 반의 vocab_test_preset 불러오기 + 저장 시 그 반에 저장
  - "배포 대상" 탭에서 반/학생 다중 선택
- 시험 응시 결과: VocabManager > VocabTestResultsModal (시험 카드 클릭 또는 📊 결과 버튼)
- 학생 응시: VocabPlayer > QuizRunner (자동 진행, 모드별 UI 분기)
- 학생 STUDY Flash Card: VocabPlayer > FlashCardPlayer (4초/카드, 발음 자동, 정지/이전/다음)

**학생 상세 통합 뷰 (선생님)** — 2026-05-10:
- TeacherPortal 담당 클래스 → 클래스 → 학생 카드 클릭
- 5개 영역 한 화면: 수강 강좌 / 시험 점수 / 단어시험 / 특이사항 / 출결
- 메모 등록 인라인 폼 (특이사항 탭은 메뉴에서 삭제됨)
- 학생 카드 디자인: 동그라미 안 학년, 이름 옆 수강 과목 칩, 모바일 1열
- 기본 정보: 학생 연락처 + 학부모 연락처 (둘 다 tel: 링크)

**iOS PWA 안내 배너** (2026-05-09):
- iOS Safari는 beforeinstallprompt 미지원 → 직접 배너 표시 + 가이드 모달 (3단계 안내)
- index.html에 `#pwa-ios-guide` 모달

**B2Utils 헬퍼 (2026-05-08~10 추가)**:
- `useIsMobile()` (resize + display-mode 변화 모두 감지)
- `levelFromGrade(g)` — 정규식 통일
- `scoreGradeBucket/scoreDistBucket/scoreColor`
- `clearAuthStorage()` — 로그아웃·탈퇴 통합
- `callEdgeFn(name, body)` — Edge Function 호출 헤더 통합
- `buildUserFromStudentRow(row)` — 이메일·OAuth 로그인 user 객체 조립 통합
- `loadSiteContent/saveSiteContent`
- `EXAM_DATE` 상수
- `localizePartOfSpeech` (영어 품사 → 한글)
- `isMobileViewport` — 정적 호출용

**빌드 자동화**:
- `build.js`의 `BUILD_VERSION` 한 곳만 갱신 → index.html `?v=...` 7곳 + service-worker `CACHE_VERSION` 자동 동기화
- 마지막 버전: `20260510a` (다음에 b, c, ... z 후 다음 날짜)

### 다음 할 일 (단어시험 후속)
- ~~STUDY 4모드 학습~~ **완료 (v91, `StudyQuizPlayer`)** — Flash Card 외 객관식/스펠링/쓰기/듣기 자유 연습. TEST 문제 엔진 재사용, 시간·점수 저장 없음, student-paced. 위 v91 항목 참고.
- **Easy/Hard 난이도 분리** (보카트레인 9단계 식) — 현재 spelling_blank_ratio(30/50/100%)로만 구분. 객관식은 보기 수·헷갈리는 보기 우선 등, 쓰기/듣기는 부분점수 등 확장 여지.
- **STUDY 연습 옵션** — 문제 수 선택(현재 유닛 단어 전체 고정), 틀린 것만 다시 풀기(오답 큐), 연습 기록 저장 여부.
- **Bingo 모드** — 보류 (B안에서 생략됨)
- **사용자 직접 작업 (학원에서)**: Google Cloud Console OAuth 동의 화면 앱 이름 "서비스" → "B2빅뱅학원" 변경
- **세부 정리 옵션**: 성적 탭의 개별 학생 점수 표시는 학생 상세에 통합되었으니 성적 탭은 등록·반별 분석만 좁혀도 됨

### 운영 컨텍스트 (중요)
- **학생은 PWA 우선** — 학생 화면 설계는 PWA(설치형 모바일 앱) 기준
  - 한 화면=한 문제, 자동 진행, autocapitalize=off, started_at 기반 타이머, visibilitychange 감지
- **선생님·관리자**: PC 비율 높지만 PWA에서도 동작해야 함
- **학원 자체 인증** (Supabase Auth 외) — RLS는 모두 허용, 권한은 클라이언트에서 체크
- **관리자는 무한 권한**, 선생님도 단어시험·단어장은 동일 권한 (학원 전체 공유)

### 최근 완료 (2026-05-08~10)
- **단어시험 시스템 전체** (위 큰 섹션 참고) — 5개 테이블, 보카트레인 B안, STUDY/TEST/REPORT/RANKING
- **시험 카드 그리드** — 선생님이 시험 한눈에 보기 좋게, 상태별 테두리 색
- **클래스별 시험 형식 preset** (`classes.vocab_test_preset` jsonb) — 버튼 카드로 불러오기/저장
- **선생님 학생 상세 통합 뷰** — 5개 영역 한 화면 + 메모 등록 인라인
- **품사 자동 채우기** — Free Dictionary API, 5개씩 병렬 조회, 한글 자동 변환
- **iOS PWA 설치 가이드** — 자동 배너 + 3단계 안내 모달
- **햄버거 메뉴 자동 닫기** — page/user 변경 시 무조건 setMenuOpen(false)
- **관리자 페이지 로그아웃 수정** — `onLogout: null` → `handleLogout` (단순 prop 누락 버그)
- **로그인 비밀번호 눈 아이콘** — '현재 상태 표시' 패턴(가려진 상태=대각선 있는 눈, 한국 앱 표준)
- **PWA 세션 5분 그레이스** — sessionStorage → localStorage, hidden 시각 기반 자동 로그아웃
- **B2Utils 정리 작업** (1·2 라운드) — useIsMobile/levelFromGrade/scoreColor/clearAuthStorage/callEdgeFn/buildUserFromStudentRow/loadSiteContent/EXAM_DATE 통합

### 이전 작업 (참고용)
- **개인정보처리방침/이용약관 페이지**: Naver OAuth 검수 통과를 위해 `Pages.jsx`에 `PrivacyPolicyPage` + `TermsPage` 컴포넌트 추가. 표준 학원 템플릿 기반(처리 목적/항목/보유기간/위탁/안전성 조치 등 12조 + 약관 10조). `index.html`에 `page === 'privacy'/'terms'` 라우트 + `?page=privacy|terms` URL 파라미터 진입(외부 검수 직링용). `HomePage.jsx`의 `SiteFooter`에 두 페이지 링크 추가(`setPage` prop 추가, `site_content` 미설정 시에도 푸터 표시되도록). 보호책임자 정보·시행일 등은 사용자가 검토 후 수정 필요. Naver 검수 신청 시 URL: `https://b2bigbang.com/?page=privacy`
- **Naver OAuth 로그인 (커스텀 구현)**: Supabase가 네이버 미지원이라 직접 구현. Edge Function `naver-oauth-exchange`(code→token→user info, NAVER_CLIENT_ID/SECRET 시크릿). `StudentPortal.jsx` LoginModal에 네이버 버튼(#03C75A)·`handleProvider('naver')`가 state 생성 후 `nid.naver.com/oauth2.0/authorize`로 리다이렉트. Callback URL = `https://b2bigbang.com/auth/naver-callback` → `404.html`(=index.html 복사본, build.js에서 자동 sync)으로 SPA fallback 받아 앱 부팅 → `?code=&state=naver_*` 감지 → Edge Function 호출 → `matchByEmail()` 공통 로직으로 students 매칭. 기존 `processOAuth`도 같은 `matchByEmail`을 사용하도록 리팩토링. Naver는 Supabase 세션 없음 → b2_user/sessionStorage만 사용. 개발 중 상태 = 등록 멤버만 로그인 가능, 학생 일반 사용은 검수 통과 후
- **Kakao OAuth 로그인**: Kakao Developers 앱 등록(`B2빅뱅학원`, 비즈 앱 전환 완료). REST API 키 + Client Secret + OpenID Connect ON, Redirect URI = Supabase 콜백, 동의항목 닉네임/이메일 필수. Supabase Auth Provider Kakao 활성화. `StudentPortal.jsx` LoginModal에 카카오 버튼 추가(#FEE500, 카카오 말풍선 SVG, `handleProvider('kakao')`). App OAuth 콜백 핸들러는 provider 무관하게 동일 로직(이메일 매칭) — Google과 동일 흐름
- **Google OAuth 로그인 (1차)**: `StudentPortal.jsx` LoginModal의 mock `handleProvider` → 실제 `supabase.auth.signInWithOAuth({ provider:'google' })` 호출로 교체. 로그인 모달 UI에 Google 버튼 노출. `index.html` App에 OAuth 콜백 처리 useEffect 추가 — `supabase.auth.getSession()`으로 세션 확인 후 `students.email` 매칭. 매칭 성공이면 `b2_user`/세션 저장 후 portal/teacher로, 실패면 회원가입 페이지로 이메일/이름 prefill 후 이동. `handleLogout`에 `supabase.auth.signOut()` 추가. Supabase Auth Provider 설정: Google Client ID `661603675180-1b85jfo7p5h9hfvdv6jk1vjmbava0fie.apps.googleusercontent.com`. 등록 정보는 메모리 `reference_b2bigbang_oauth.md` 참고
- 비밀번호 찾기 기능 (Brevo 이메일 발송): Edge Function `send-password-reset` + `verify-password-reset` 배포. `password_reset_tokens` 테이블(1회용·1시간 유효, RLS 모두 차단). 로그인 모달에 forgotMode + `ResetPasswordPage` 컴포넌트(URL `?reset=<token>`로 진입). 회원가입에 이메일·비밀번호 추가. Supabase Edge Function Secrets: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`
- 비밀번호 SHA-256 해시 처리 도입: `B2Utils.hashPassword/verifyPassword/migrateIfPlain` 헬퍼. DB의 password_hash가 평문이면 다음 로그인 시 자동 마이그레이션('sha256:' prefix로 식별). 로그인·비밀번호 변경 모두 적용. 기존 사용자 무중단 전환
- 학부모 자녀 학습 현황 view: `user.role==='parent'`일 때 자녀 목록 → 자녀 선택 → 시험·숙제·영상 시청 read-only 탭. parent_id 매칭으로 자녀 조회. 자녀의 녹음 답안도 `<audio>`로 재생 가능
- 숙제 페이지 빈 상태 개선: 숙제 0건일 때 `HomeworkPracticeArea` 노출 — 녹음 연습(5분), OMR 답안지(10문항 5지선다), 서술형 답안지. localStorage에 임시 저장(학원 시스템과 무관)
- 숙제 녹음 답안 기능: `exams.allow_audio_answer` + `exam_submissions.audio_path` 컬럼 추가. 발행 폼에 "녹음 제출 받기" 토글(homework 종류일 때만), 학생 응시 화면에 `StudentAudioRecorder` 컴포넌트(큰 버튼 + 5분 카운트다운, 다시녹음/제출/삭제 후 다시), 채점 화면에 `<audio>` 재생. Storage 추상화는 `B2Utils.uploadAudioBlob/audioPublicUrl/deleteAudio` 3개 helper로 (시놀로지 이전 시 helper 내부만 교체)
- 강의실에 '숙제' 카드 추가: `exams.kind='homework'`로 시험 인프라 재활용. 발행 = AdminPanel(전체) + TeacherPortal(반 단위). 학생 강의실 홈에 영상강의/테스트/숙제 3카드 (테스트=파랑, 숙제=오렌지)
- 시험 결과 페이지(`ExamResultPage`): 어두운 빨강 그라데이션 → 레벨테스트 톤 파랑(`#1d4ed8→#1e3a8a`)으로 변경
- 시험 종류 확장 (`exams.kind`): `level` 외 `weekly`(주간), `monthly`(월말) 추가. 분석표는 추후 구현
  - AdminPanel "레벨테스트" 탭 → "시험 관리"로 일반화. 발행 폼에 종류 드롭다운, 목록에 종류 뱃지+필터
  - TeacherPortal 반 시험 발행 폼에 종류 드롭다운(반 시험/주간/월말)
  - StudentPortal: 반 단위 + 관리자 전체 발행(`class_id IS NULL`) 모두 응시 가능 목록에 포함
  - DB 변경 없음 (kind는 text + CHECK 제약 없음)
- 수강생 관리 퇴원 처리 + 퇴원생 탭: 활성/퇴원 토글, 개별/일괄 퇴원·재원, 퇴원생 엑셀 내보내기 (`퇴원생_YYYYMMDD.xlsx`)
- 수강생 관리 정렬 드롭다운: 등록일 최신/오래된순, 이름 가나다/역순 (기본 = 등록일 최신순)
- 수강생 엑셀 가져오기/내보내기/템플릿 (이름만 필수, 6필드 단순화)
- 일괄 배정 패널: 학생 선택 → 학교급/학년/학교/과목/담당 선생님(반) 한 번에 적용
- DB 마이그레이션: `students.email` nullable
- 코드 오타 수정: `agree_privacy` → `privacy_agreed` (import + signup 둘 다)
- PWA 설치 배너 빨간 테두리 제거
- 이벤트 floating 버튼: 한 번 누르면 영구 숨김
- PC 강의실 홈 카드 큰 스타일로 통일

### 다음에 할 일 (후보)
- **Naver 검수요청**: 현재 "개발 중" 상태 → 학원 학생 일반 사용 가능하려면 네이버 콘솔에서 검수요청 (개인정보처리방침 페이지 URL 등 필요, 며칠~일주일 소요)
- **음성 90일 자동 정리 Cron**: 채점 완료 + 90일 경과한 audio_path 일괄 삭제 (Edge Function + cron). 현재 무료 1GB 한도 보존용
- 시험지 분석표 구현 (사용자가 양식 줄 예정) — 자동 채점 결과 기반 문항별 정답률·학생별 약점·점수 분포 등. AdminPanel "성적 분석" 탭 안 "📋 시험지 분석" 자리(현재 "준비 중")가 들어갈 곳
- 시험 카드 종류 뱃지: TeacherPortal 시험 카드에도 kind 뱃지 추가 (현재는 AdminPanel만)
- 학생들 첫 로그인 비밀번호 정책 정리 (현재 신규 import는 password_hash NULL → 학생이 회원가입 따로 해야 함)
- 학부모-학생 자동 연결 로직 점검 (전화번호 매칭)

### 알려진 미해결
- 없음 (현재 알려진 이슈 모두 해결됨)

### 사용자 작업 패턴
- 학원 PC와 집 PC 사이를 오감 → 시작할 때 `git fetch origin && git status` 먼저 확인할 것
- 작업 끝날 때 이 "현재 진행" 섹션 업데이트하고 커밋·푸시

---

## 자주 쓰는 명령

```bash
# 프로젝트로 이동
cd C:\Users\사용자\b2bigbang

# 최신 받기 (집/학원 전환 시 매번)
git fetch origin
git status
git pull --ff-only origin main

# 빌드
node build.js

# 라이브 사이트
https://github.com/finley78/b2bigbang   (코드)
# (CNAME에 도메인 있음)
```
