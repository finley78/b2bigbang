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
- 중등: 검암중·간재울중·백석중·서곶중
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

## 현재 진행 (2026-05-10)

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
- **STUDY 4모드 학습** (Flash Card 외에 객관식/스펠링/쓰기/듣기 자유 연습) — QuizRunner 재사용으로 만들 수 있음
- **Easy/Hard 난이도 분리** (보카트레인 9단계 식) — 미정, 일단 spelling_blank_ratio로만 구분
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
