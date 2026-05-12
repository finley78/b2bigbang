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
- **이모지 절대 금지**: 사용자가 명시적으로 요청하지 않는 한 UI/코드 어디에도 이모지 추가 금지 (2026-05-08 정책). 새 기능 만들 때도 이모지 없이.

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

## 현재 진행 (2026-05-12 기준, 최신 ?v=20260512v69-material-list-compact)

### ★★ 큰 작업: "자료실 = 분석 자료 도서관" 화 (2026-05-12 시작) ★★
**사용자 의도**: 선생님 페이지에서 Claude 첨부파일 분석 기능을 **숙제·시험 발행 폼에서 빼서 → 자료실로** 옮긴다. 앞으로 선생님이 자료실에서 시험지를 분석해 저장해두면, 자료실을 **도서관처럼** — 시험·숙제를 만들 때 거기서 자료를 불러와서 출제. (집/학원 PC 전환 시 git pull 먼저!)
- **DB**: `exams.material_id uuid` 추가 (migration `2026-05-12_add_exams_material_id.sql`). **자료(material) = `exams` 행 중 `kind='material'`, `class_id=NULL`** — 일반 exam 컬럼 그대로(image_paths/answer_paths/analysis/answer_key/question_count/text_question_count/choices_per_question/analyze_model/analyze_student_model/analyze_page_range/selected_questions) 다 씀. 그래서 `analyze-exam` Edge Function은 **수정 없이** material에도 그대로 동작(exam_id 받아 처리). `kind='material'`은 학생/관리자 쪽 exam 쿼리에 안 잡힘(다 `.in('kind',['class','weekly','monthly','homework'])` 또는 `.eq('kind','level')`).
- **v67 (TeacherPortal) + v68 (AdminPanel) — 같은 패턴 양쪽 적용 완료**:
  - 자료실 탭(`teacherView==='files'` / AdminPanel `tab==='files'`)을 2섹션으로: ① **"시험·숙제용 분석 자료"**(새 도서관) ② "학생에게 보낼 자료"(기존 attachments 그대로). 도서관: `materials` state(=`exams` where kind='material', 전 선생님·관리자 공유), 검색·과목·학교급 필터, 카드(분석 완료/전 뱃지·문항 수·올린 사람), [분석 보기][수정][재분석/Claude 분석][삭제]. `+ 새 자료 분석` → `materialFormOpen` 모달: 제목·과목·학교급·학년·설명/출처 + 시험지 파일 + 답안지·해설 파일 + 분석 범위(페이지·쓸 문항 번호)·정밀 체크박스 2개(`precise`=문항분석 Opus, `precise_student`=학생분석 Opus) → `[저장하고 Claude 문항 분석]`(submitMaterial(true)) / `[분석 없이 저장만]`(submitMaterial(false)). 함수(TeacherPortal/AdminPanel 둘 다): `loadMaterials/openMaterialForm/openMaterialFormForEdit/closeMaterialForm/submitMaterial/reanalyzeMaterial/deleteMaterial/loadMaterialIntoExam/unlinkMaterialFromExam`. material 파일 storage 경로 `materials/<teacher_id|user.id|admin>/...` (attachments 버킷, public). `deleteMaterial`: 그 자료로 만든 시험 있으면 DB 행만, 없으면 storage 파일도.
  - **시험·숙제 발행 폼에서 분석 관련 UI 제거**: 답안지·해설 파일칸·분석 범위 카드(페이지·정밀 체크박스)·`[저장 및 문항 분석]` 버튼 → 사라짐. 대신 상단에 **`[자료실에서 불러오기]` 버튼** → `materialPickerOpen` 모달(분석된 material만 목록, 과목·검색 필터) → 고르면 `loadMaterialIntoExam`: image_paths→existing_paths, answer_paths→answer_existing_paths, analysis·answer_key·question_count·text_question_count·choices_per_question·subject·analyze_model·analyze_student_model·`material_id` 채움(class/제목/날짜·학교급·학년은 사용자가). 불러왔으면 draft.material_id 세팅 + 초록 배너 + `[연결 해제]`(material_id·existing_paths·answer_existing_paths 비움). 발행 버튼은 `submitExam(false)`/`adminSubmitLevelTest(false)` (분석 호출 없음). row에 `analysis`·`material_id` 추가. **`deleteExam`/`adminDeleteLevelTest`: `material_id` 있으면 storage 파일 안 지움**(자료가 공유). 시험지 직접 올리기 input은 `!material_id`일 때만 노출. 객관식 정답 입력 그리드는 `answer_key` 키 기준(키 개수==question_count면 실제 번호, 아니면 1..N).
  - 모바일 뒤로가기 핸들러(TeacherPortal/AdminPanel 둘 다)에 `materialFormOpen`/`materialPickerOpen` 추가. 탭 진입 로드에 `loadMaterials()` 추가(files·tests/homework/leveltest 탭).
  - **v69**: 자료실 도서관 목록을 **큰 카드 → 한 줄 컴팩트 행**으로(수백~수천 개 대비). 한 행: [분석완료/전 뱃지]·과목·학교급/학년·제목·문항수·올린사람·날짜 + 작은 버튼 `[원본][분석][수정][재분석][삭제]`. **원본/분석 분리**: `[원본]` 누르면 시험지·답안지 파일 링크(`materialFilesOpenId` 토글), `[분석]` 누르면 `renderExamAnalysis`(`materialAnalysisOpenId` 토글) — 둘 중 하나만 펼침. 필터에 "분석 상태(완료만/전만)" 추가(`materialFilters.status`). 옛 분석 시험은 `exams`에서 kind='material' 행으로 복제하고 원본의 `material_id` 연결(2026-05-12 DB do-block, "샘플 숙제 고3" → material `911e48e2-...`). (목록 가상화/페이지네이션은 미구현 — 현재 검색·필터로 좁힘. 수천 개 되면 추가 고려.)
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

### ★ 다음에 이어서 할 일 (후보 — 사용자가 우선순위 결정) ★
1. **단순화 리팩토링** — 했다가 전부 revert함. 다시 하려면 `git revert e66c527`(통째로) 또는 개별 cherry-pick. 또는 처음부터 다시. 남은 후보(render-block 수술 필요해 더 위험): ① 회원정보 탭을 수강생 관리에 흡수(학부모 정보가 회원정보에만 있어 단순 제거 불가), ② 선생님 관리 안의 per-teacher '담당 반 관리' 제거(클래스 관리 탭이 일원화), ③ 성적분석 탭에서 '학생별 분석' 모드 제거(학생 상세로 흡수), 선생님 상세 통합, TeacherPortal 시험/숙제 탭 1개로 병합.
2. **단어시험 후속**: STUDY 4모드 자유 학습(Flash Card 외 객관식/스펠링/쓰기/듣기), Easy/Hard 난이도 분리.
3. **TeacherPortal 시험 카드 종류 뱃지**(주간/월말/반시험 kind) — AdminPanel엔 있는데 TeacherPortal엔 없음.
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
