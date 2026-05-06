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

## 현재 진행 (2026-05-06)

### 최근 완료
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
- **학부모 자녀 결과 보기**: 학부모 로그인 후 parent_id 매칭된 자녀 목록 → 선택 시 자녀의 숙제/시험 결과 read-only로 보기 + 녹음도 들을 수 있게. 현재 학부모는 student와 동일 화면이라 자기 user.id로는 자녀 데이터를 못 봄
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
