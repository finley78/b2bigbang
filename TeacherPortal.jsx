// 학원 주변 학교 목록 (학사일정 학교 선택용)
const TP_NEARBY_SCHOOLS = ['은지초','검암초','간재울초','검암중','간재울중','백석중','서곶중','대인고','서인천고','백석고'];

function TeacherPortal({ user, onLogout, isAdmin, adminAuthed }) {
  const [teacherInfo, setTeacherInfo] = React.useState(null);
  const [classes, setClasses] = React.useState([]);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [students, setStudents] = React.useState([]);
  const [selectedStudent, setSelectedStudent] = React.useState(null); // 클래스 학생 클릭 시 상세
  const [studentDetail, setStudentDetail] = React.useState(null); // { courses, exams, vocab, notes, attendance }
  const [studentDetailLoading, setStudentDetailLoading] = React.useState(false);
  const [newNoteContent, setNewNoteContent] = React.useState('');
  const [newNoteType, setNewNoteType] = React.useState('특이사항');
  const [savingNote, setSavingNote] = React.useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [debug, setDebug] = React.useState("");
  const [teacherCourses, setTeacherCourses] = React.useState([]);
  const [selectedCourseId, setSelectedCourseId] = React.useState("");
  const [selectedCourseAssignment, setSelectedCourseAssignment] = React.useState("");
  const [courseVideoTitle, setCourseVideoTitle] = React.useState("");
  const [courseVideoLink, setCourseVideoLink] = React.useState("");
  const [lectureLevel, setLectureLevel] = React.useState("");
  const [lectureGrade, setLectureGrade] = React.useState("");
  const [lectureSubject, setLectureSubject] = React.useState("");
  const [lectureClassId, setLectureClassId] = React.useState("");
  const [lectureCourseName, setLectureCourseName] = React.useState("");
  const [savingOnline, setSavingOnline] = React.useState(false);
  const [teacherView, setTeacherView] = React.useState("dashboard");
  const teacherIsMobile = window.B2Utils.useIsMobile();
  // 학습 현황 (담당 학생들의 영상 시청 진도)
  const [studyViews, setStudyViews] = React.useState(null);          // null=미로딩, []=조회 완료
  const [studyViewsLoading, setStudyViewsLoading] = React.useState(false);
  const [studyViewsExpandedId, setStudyViewsExpandedId] = React.useState(null);
  // 업무일지
  const [teacherNotes, setTeacherNotes] = React.useState([]);
  const [noteDraft, setNoteDraft] = React.useState({ date: new Date().toISOString().slice(0,10), content: '' });
  const [noteTargetMode, setNoteTargetMode] = React.useState('all'); // 'all' | 'student'
  const [noteClassId, setNoteClassId] = React.useState('');
  const [noteStudents, setNoteStudents] = React.useState([]);
  const [noteStudentId, setNoteStudentId] = React.useState('');
  // 성적 현황/통계
  const [scoreHistory, setScoreHistory] = React.useState([]);
  const [statsClassId, setStatsClassId] = React.useState('');
  const [statsStudentId, setStatsStudentId] = React.useState('');
  const [loadingStats, setLoadingStats] = React.useState(false);
  // 성적 분석 (선생님 공유)
  const [scoreAnalysis, setScoreAnalysis] = React.useState([]);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [analysisClassId, setAnalysisClassId] = React.useState('');
  const [analysisSubject, setAnalysisSubject] = React.useState('전체');
  const [analysisTestName, setAnalysisTestName] = React.useState('전체');
  const [analysisSearch, setAnalysisSearch] = React.useState('');
  const [analysisClassStudents, setAnalysisClassStudents] = React.useState({}); // { class_id: [student_id, ...] }
  const [analysisAllStudents, setAnalysisAllStudents] = React.useState({}); // { id: {name, grade, school} }
  const [analysisStudentId, setAnalysisStudentId] = React.useState(''); // 개인 추이용
  const [reportStudentId, setReportStudentId] = React.useState(''); // 학부모 리포트 모달
  const [kakaoTarget, setKakaoTarget] = React.useState(null); // { mode:'single'|'bulk', studentIds:[] }
  const [notificationLogs, setNotificationLogs] = React.useState([]);
  const [aiComments, setAiComments] = React.useState({}); // { student_id+test_score_id: comment }

  // 강좌 개설
  const [courseDraft, setCourseDraft] = React.useState({ title:'', description:'', subject:'', scope:'unassigned', class_id:'', level:'', grade:'', grades:[], student_ids:[], picker_class_id:'' });
  const [creatingCourse, setCreatingCourse] = React.useState(false);
  // 사후 배포 편집
  const [distributeCourseId, setDistributeCourseId] = React.useState('');
  const [distributeDraft, setDistributeDraft] = React.useState({ scope:'unassigned', class_id:'', level:'', grade:'', grades:[], student_ids:[], picker_class_id:'' });
  const [distributing, setDistributing] = React.useState(false);
  // 강좌 정보 수정 (이름·설명·과목)
  const [editingCourseId, setEditingCourseId] = React.useState('');
  const [editCourseDraft, setEditCourseDraft] = React.useState({ title:'', description:'', subject:'' });
  const [savingCourseEdit, setSavingCourseEdit] = React.useState(false);
  const [distEnrollments, setDistEnrollments] = React.useState([]); // 현재 강좌의 enrollments
  const [allStudents, setAllStudents] = React.useState([]);
  const STU_FILTER_INIT = { search:'', classId:'', grade:'' };
  const [courseStuFilters, setCourseStuFilters] = React.useState(STU_FILTER_INIT);
  const [distStuFilters, setDistStuFilters] = React.useState(STU_FILTER_INIT);
  const [classStudentMap, setClassStudentMap] = React.useState({}); // { class_id: [students...] }

  // 영상 노출 기간 (강의 추가 폼)
  const [videoExpireDays, setVideoExpireDays] = React.useState(''); // '', '30', '45', '60'

  // 자료실
  const [attachments, setAttachments] = React.useState([]);
  const [attachLoading, setAttachLoading] = React.useState(false);
  const [attachUploading, setAttachUploading] = React.useState(false);
  const [attachDraft, setAttachDraft] = React.useState({ title:'', description:'', scope:'class', class_id:'', student_ids:[], course_id:'', video_id:'', file:null });

  // 자료실 — 분석 자료 도서관 (시험·숙제 만들기용; kind='material' exams)
  const MATERIAL_DRAFT_INIT = { title:'', subject:'', school_level:'', target_grade:'', target_semester:'', description:'', files:[], answer_files:[], existing_paths:[], answer_existing_paths:[], analyze_page_range:'', selected_questions_text:'', precise:false, precise_student:false, analysis:null };
  const [materials, setMaterials] = React.useState([]);
  const [materialLoading, setMaterialLoading] = React.useState(false);
  const [materialUploading, setMaterialUploading] = React.useState(false);
  const [materialDraft, setMaterialDraft] = React.useState(MATERIAL_DRAFT_INIT);
  const [materialEditId, setMaterialEditId] = React.useState(null);
  const [analyzingMaterialId, setAnalyzingMaterialId] = React.useState(null);
  const [materialAnalysisOpenId, setMaterialAnalysisOpenId] = React.useState(null);
  const [materialFilters, setMaterialFilters] = React.useState({ search:'', subject:'', level:'', grade:'', view:'all' });
  function gradeOptsForLevel(lvl) {
    if (lvl === '초등') return ['1학년','2학년','3학년','4학년','5학년','6학년'];
    if (lvl === '중등') return ['중1','중2','중3'];
    if (lvl === '고등') return ['고1','고2','고3'];
    return ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
  }
  const [materialFormOpen, setMaterialFormOpen] = React.useState(false);
  // 시험·숙제 발행 폼에서 자료 불러오기
  const [materialPickerOpen, setMaterialPickerOpen] = React.useState(false);

  // 마이페이지
  const [profileDraft, setProfileDraft] = React.useState(null);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [pwDraft, setPwDraft] = React.useState({ current:'', next:'', confirm:'' });

  // 성적 탭 서브 모드
  const [scoreSubMode, setScoreSubMode] = React.useState('browse'); // 'browse' | 'register' | 'analysis'
  // 성적 보기: 종류 → 필터 → 학생 → 점수
  const [scoreBrowseKind, setScoreBrowseKind] = React.useState(null); // null | '숙제' | '주간평가' | '월말평가' | '레벨테스트'
  const [scoreBrowseFilters, setScoreBrowseFilters] = React.useState({ level:'', grade:'', subject:'', classId:'' });
  const [scoreBrowseStudent, setScoreBrowseStudent] = React.useState(null); // student_id | null

  // 시험지 발행
  const [examList, setExamList] = React.useState([]);
  const [examLoading, setExamLoading] = React.useState(false);
  const [examFormOpen, setExamFormOpen] = React.useState(false);

  // ── 모바일 뒤로가기: 선생님 portal 단계별 복귀 (PWA 종료 방지) ──
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    function onPop(e) {
      if (materialPickerOpen) {
        e.stopImmediatePropagation();
        setMaterialPickerOpen(false);
        try { window.history.pushState({ page:'teacher', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      if (materialFormOpen) {
        e.stopImmediatePropagation();
        setMaterialFormOpen(false); setMaterialEditId(null);
        try { window.history.pushState({ page:'teacher', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      if (examFormOpen) {
        e.stopImmediatePropagation();
        setExamFormOpen(false);
        try { window.history.pushState({ page:'teacher', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      if (selectedClass) {
        e.stopImmediatePropagation();
        setSelectedClass(null);
        setSelectedClassId("");
        try { window.history.pushState({ page:'teacher', b2Inner:true }, ''); } catch (err) {}
        return;
      }
    }
    window.addEventListener('popstate', onPop, true);
    return () => window.removeEventListener('popstate', onPop, true);
  }, [selectedClass, examFormOpen, materialFormOpen, materialPickerOpen]);

  // 깊은 화면 진입 시 history에 한 단계 push
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedClass && !examFormOpen && !materialFormOpen && !materialPickerOpen) return;
    const st = window.history.state || {};
    if (!st.b2Inner) {
      try { window.history.pushState({ page:'teacher', b2Inner:true }, ''); } catch (err) {}
    }
  }, [selectedClass, examFormOpen, materialFormOpen, materialPickerOpen]);
  const [examDraft, setExamDraft] = React.useState({ title:'', subject:'', test_date:'', description:'', files:[], existing_paths:[], question_count:'10', choices_per_question:'5', text_question_count:'0', time_limit_minutes:'0', answer_key:{} });
  const [pendingTestKind, setPendingTestKind] = React.useState(null); // 테스트 탭에서 종류 먼저 고른 뒤 반 선택
  const [editingExamId, setEditingExamId] = React.useState(null); // null=새 발행, id=기존 시험/숙제 수정
  const [examUploading, setExamUploading] = React.useState(false);
  const [analyzingExamId, setAnalyzingExamId] = React.useState(null);
  const [analysisOpenId, setAnalysisOpenId] = React.useState(null);
  const [analyzingStudentId, setAnalyzingStudentId] = React.useState(null);
  const [examSubmissionsByExam, setExamSubmissionsByExam] = React.useState({}); // { exam_id: [submissions] }

  // 학원 일정 (강의일정 변경 + 학사일정)
  const _today = new Date();
  const [scrMode, setScrMode] = React.useState('change'); // 'change' | 'academic'
  const [scrMonth, setScrMonth] = React.useState({ y: _today.getFullYear(), m: _today.getMonth() }); // m: 0~11
  const [scrRequests, setScrRequests] = React.useState([]);
  const [scrLoading, setScrLoading] = React.useState(false);
  const [scheduleSearch, setScheduleSearch] = React.useState(''); // 학원 일정 검색어 (강의일정 변경 + 학사일정)
  const [scrSelectedDate, setScrSelectedDate] = React.useState(null); // 'YYYY-MM-DD'
  const [scrFormOpen, setScrFormOpen] = React.useState(false);
  const [scrDraft, setScrDraft] = React.useState({ reason: '', file: null });
  const [scrSubmitting, setScrSubmitting] = React.useState(false);
  // 학사일정
  const [academicList, setAcademicList] = React.useState([]);
  const [academicLoading, setAcademicLoading] = React.useState(false);
  const [academicFormOpen, setAcademicFormOpen] = React.useState(false);
  const [academicDayOpen, setAcademicDayOpen] = React.useState(null); // 'YYYY-MM-DD' — 달력에서 그 날 일정 보기 팝업
  const [academicDraft, setAcademicDraft] = React.useState({ title:'', school:'', category:'vacation', start_date:'', end_date:'', description:'' });
  const [academicSubmitting, setAcademicSubmitting] = React.useState(false);

  const [testInfo, setTestInfo] = React.useState({
    testType: "1학기 중간고사",
    testName: "",
    subject: "",
    testRange: "",
    testDate: new Date().toISOString().slice(0, 10),
  });

  const [scores, setScores] = React.useState({});

  const sb = window.supabase;

  React.useEffect(() => {
    loadTeacherAndClasses();
  }, []);

  React.useEffect(() => {
    const assignments = getTeacherAssignments();
    if (!selectedCourseAssignment && assignments.length > 0) {
      setSelectedCourseAssignment(assignments[0]);
    }
  }, [teacherInfo]);

  function clean(value) {
    return String(value || "").trim().toLowerCase();
  }

  function splitList(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
    return String(value || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function getTeacherSubjects() {
    const sources = [teacherInfo?.subjects, teacherInfo?.subject, user?.subjects, user?.subject];
    const result = [];
    sources.forEach((src) => splitList(src).forEach((item) => { if (item && !result.includes(item)) result.push(item); }));
    return result;
  }

  function getPrimarySubject() {
    return getTeacherSubjects()[0] || "영어";
  }

  function getTeacherAssignments() {
    const raw = splitList(teacherInfo?.grade || user?.grade);
    const paired = raw.filter((item) => /^(초등|중등|고등)\s+/.test(item));
    if (paired.length > 0) return paired;
    return raw;
  }

  function courseTitleForAssignment(assignment) {
    const subject = getPrimarySubject();
    const teacherName = teacherInfo?.name || user?.name || "선생님";
    return `${assignment} ${subject} 온라인 강의 - ${teacherName}`;
  }

  function classLabel(cls) {
    if (!cls) return "";
    return [cls.name, cls.subject, cls.grade].filter(Boolean).join(" / ");
  }

  function assignmentFromClass(cls) {
    if (!cls) return "";
    const gradeText = String(cls.grade || "").trim();
    if (/^(초등|중등|고등)\s+/.test(gradeText)) return gradeText;

    const schoolLevel = String(cls.school_level || cls.level || cls.schoolType || cls.school_type || "").trim();
    if (schoolLevel && gradeText) return `${schoolLevel} ${gradeText}`;

    const assignments = getTeacherAssignments();
    if (assignments.length === 1) return assignments[0];

    const className = String(cls.name || "").trim();
    const matched = assignments.find((assignment) => className.includes(assignment) || assignment.includes(className));
    return matched || gradeText || assignments[0] || "";
  }

  function goTeacherHome() {
    setTeacherView("home");
  }

  function openScorePage() {
    if (!selectedClass) {
      alert("담당 클래스를 먼저 선택해 주세요.");
      return;
    }
    setTeacherView("score");
  }

  function openLecturePage() {
    if (!selectedClass) {
      alert("담당 클래스를 먼저 선택해 주세요.");
      return;
    }
    const assignment = assignmentFromClass(selectedClass);
    if (assignment) setSelectedCourseAssignment(assignment);
    setTeacherView("lecture");
  }

  function isMyOnlineCourse(course, teacher) {
    if (isAdmin || adminAuthed || user?.role === "admin") return true;
    const title = clean(course.title || course.name);
    const teacherName = clean(teacher?.name || user?.name);
    const teacherEmail = clean(teacher?.email || user?.email);
    if (String(course.teacher_id || "") && String(course.teacher_id) === String(teacher?.id)) return true;
    if (teacherName && title.indexOf(teacherName) >= 0) return true;
    if (teacherEmail && clean(course.teacher_email) === teacherEmail) return true;
    return false;
  }

  function selectedCourse() {
    return teacherCourses.find((course) => String(course.id) === String(selectedCourseId));
  }

  function mapCourseForTeacher(course) {
    return {
      id: course.id,
      title: course.title || course.name || "이름 없는 강좌",
      description: course.description || "",
      subject: course.subjects?.name || course.subject || "",
      teacher: course.teacher || "",
      level: course.level || "",
      grade: course.grade || "",
      class_id: course.class_id || null,
      lectures: (course.videos || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((video) => ({
        id: video.id,
        title: video.title || "",
        category: video.category || "",
        youtubeId: video.youtube_id || "",
        videoUrl: B2Utils.lectureVideoUrl(video),
        expires_at: video.expires_at || null,
      })),
    };
  }

  async function loadTeacherAndClasses() {
    setLoading(true);
    setDebug("1. 선생님 정보 조회 시작");

    const { data: allTeachers, error: teacherError } = await sb
      .from("teachers")
      .select("*");

    if (teacherError) {
      setDebug("teachers 조회 오류: " + teacherError.message);
      setLoading(false);
      return;
    }

    const teacher = (allTeachers || []).find(
      (t) => clean(t.email) === clean(user.email)
    );

    if (!teacher) {
      setDebug(
        "teachers에서 선생님을 못 찾음 / 로그인 이메일: " +
          user.email +
          " / teachers 수: " +
          (allTeachers || []).length
      );
      setLoading(false);
      return;
    }

    const { data: teacherAccount } = await sb
      .from("students")
      .select("*")
      .eq("email", user.email)
      .single();

    const mergedTeacher = {
      ...(teacher || {}),
      ...(teacherAccount || {}),
      id: teacher.id || teacherAccount?.id,
      name: teacherAccount?.name || teacher?.name || user?.name || "선생님",
      email: teacherAccount?.email || teacher?.email || user?.email || "",
      subjects: teacherAccount?.subjects || teacher?.subjects || user?.subjects || [],
      subject: teacherAccount?.subject || teacher?.subject || user?.subject || "",
      school: teacherAccount?.school || teacher?.school || user?.school || "",
      grade: teacherAccount?.grade || teacher?.grade || user?.grade || "",
    };
    setTeacherInfo(mergedTeacher);
    setDebug("2. 선생님 찾음: " + mergedTeacher.id);

    const { data: classList, error: classError } = await sb
      .from("classes")
      .select("*")
      .eq("teacher_id", teacher.id)
      .not("grade", "is", null)
      .order("name", { ascending: true });

    if (classError) {
      setDebug("classes 조회 오류: " + classError.message);
      setLoading(false);
      return;
    }

    setClasses(classList || []);
    await loadTeacherCourses(mergedTeacher, classList || []);
    setDebug("3. 담당 반 수: " + (classList || []).length);
    setLoading(false);
  }

  async function loadTeacherCourses(teacher, classList) {
    const { data: courseList, error: courseError } = await sb
      .from("courses")
      .select("*, subjects(name,color), videos(*)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (courseError) {
      setDebug("courses 조회 오류: " + courseError.message);
      setTeacherCourses([]);
      return;
    }
    const filtered = (courseList || []).filter((course) => {
      // 1. teacher_id 직접 매칭
      if (teacher?.id && String(course.teacher_id) === String(teacher.id)) return true;
      // 2. classes 테이블에서 이름+과목으로 매칭
      if (classList && classList.some(cls =>
        clean(cls.name) === clean(course.title || course.name) &&
        (!cls.subject || clean(cls.subject) === clean(course.subjects?.name || course.subject || ""))
      )) return true;
      // 3. 레거시: 이름/이메일 매칭
      return isMyOnlineCourse(course, teacher);
    });

    const mapped = filtered.map(mapCourseForTeacher);
    setTeacherCourses(mapped);
    if (!selectedCourseId && mapped.length > 0) setSelectedCourseId(String(mapped[0].id));
  }

  // 강좌명을 직접 입력받아 find-or-create 후 영상 추가
  async function addVideoToCourse() {
    const courseName = String(lectureCourseName || "").trim();
    const title = String(courseVideoTitle || "").trim();
    const link = String(courseVideoLink || "").trim();

    // 과목만 필수. 초중고/학년/클래스는 선택(범위를 좁히고 싶을 때만).
    //  - 클래스를 골랐으면 그 반 학생에게 배정 (과목 비어 있으면 클래스 과목으로 보충)
    //  - 학년을 골랐으면 그 학년 + 과목 학생, 둘 다 안 골랐으면 그 과목 학생 전체
    const useClass = !!lectureClassId;
    let effectiveSubject = lectureSubject;
    if (!effectiveSubject && useClass) {
      const cls = (availableClassCards || []).find(c => String(c.id) === String(lectureClassId));
      effectiveSubject = (cls && cls.subject) || "";
    }
    if (!effectiveSubject) { alert("과목을 선택해 주세요."); return; }
    if (!courseName) { alert("강좌명을 입력해 주세요."); return; }
    if (!title) { alert("강의 제목을 입력해 주세요."); return; }
    if (!link) { alert("YouTube 링크 또는 영상 URL을 입력해 주세요."); return; }

    setSavingOnline(true);
    try {
      // 1) 강좌 찾기 또는 새로 생성
      // 칩 필터와 동일한 규칙: 강좌의 해당 필드가 비어 있으면 와일드카드로 취급
      // (칩에서 클릭한 강좌는 그대로 재사용되도록)
      let course = teacherCourses.find(c => {
        if (clean(c.title) !== clean(courseName)) return false;
        if (effectiveSubject && c.subject && clean(c.subject) !== clean(effectiveSubject)) return false;
        if (useClass) {
          if (String(c.class_id || "") === String(lectureClassId)) return true;
          if (c.class_id) return false;
          return true; // 클래스 미지정 공통 강좌 재사용 허용
        }
        if (c.class_id) return false;
        if (lectureLevel && c.level && c.level !== lectureLevel) return false;
        if (lectureGrade && c.grade && String(c.grade).split(',').map(function(s){ return s.trim(); }).indexOf(lectureGrade) < 0) return false;
        return true;
      });
      let courseId;
      if (course) {
        courseId = course.id;
      } else {
        // subject_id 조회 (과목이 정해진 경우만)
        let subjectId = null;
        if (effectiveSubject) {
          const { data: subjRows } = await sb.from("subjects").select("id, name").eq("name", effectiveSubject).limit(1);
          subjectId = subjRows && subjRows.length > 0 ? subjRows[0].id : null;
        }
        const newCoursePayload = {
          title: courseName,
          subject_id: subjectId,
          is_active: true,
          level: useClass ? null : (lectureLevel || null),
          grade: useClass ? null : (lectureGrade || null),
          class_id: useClass ? lectureClassId : null,
          teacher_id: teacherInfo?.id || null,
        };
        const { data: created, error: courseError } = await sb
          .from("courses")
          .insert(newCoursePayload)
          .select("*, subjects(name,color), videos(*)")
          .single();
        if (courseError) throw courseError;
        courseId = created.id;
        const newCourseMapped = mapCourseForTeacher(created);
        setTeacherCourses(prev => [...prev, newCourseMapped]);
      }

      // 2) 영상 insert
      const target = teacherCourses.find(c => String(c.id) === String(courseId));
      const nextOrder = ((target?.lectures || []).length) + 1;
      const days = Number(videoExpireDays);
      const expiresAt = days > 0 ? new Date(Date.now() + days*24*60*60*1000).toISOString() : null;
      const { data: video, error: videoError } = await sb
        .from("videos")
        .insert({ course_id: courseId, title, youtube_id: B2Utils.extractYoutubeId(link), sort_order: nextOrder, expires_at: expiresAt })
        .select()
        .single();
      if (videoError) throw videoError;

      const lecture = { id: video.id, title: video.title, category: video.category || "", youtubeId: video.youtube_id || "", videoUrl: B2Utils.lectureVideoUrl(video) };
      setTeacherCourses(prev => prev.map(c =>
        String(c.id) === String(courseId) ? { ...c, lectures: [...(c.lectures || []), lecture] } : c
      ));
      setCourseVideoTitle("");
      setCourseVideoLink("");
      alert("강의가 등록되었습니다.");

      // 3) 자동 수강 배정
      try {
        let studentIds = [];
        if (useClass) {
          // 특정 클래스 전용 → 그 반 학생만
          const { data: classLinks } = await sb.from("class_students").select("student_id").eq("class_id", lectureClassId);
          studentIds = (classLinks || []).map(l => l.student_id);
        } else {
          // 학년을 골랐으면 그 학년 + 과목 학생, 안 골랐으면 그 과목 학생 전체
          let q = sb.from("students").select("id, subjects").eq("role", "student").eq("is_active", true);
          if (lectureGrade) q = q.eq("grade", lectureGrade);
          const { data: stuRows } = await q;
          studentIds = (stuRows || [])
            .filter(s => Array.isArray(s.subjects) ? s.subjects.includes(effectiveSubject) : true)
            .map(s => s.id);
        }
        if (studentIds.length > 0) {
          const { data: existing } = await sb.from("enrollments").select("student_id").eq("course_id", courseId).in("student_id", studentIds);
          const alreadySet = new Set((existing || []).map(e => e.student_id));
          const toAdd = studentIds.filter(sid => !alreadySet.has(sid));
          if (toAdd.length > 0) {
            await sb.from("enrollments").insert(toAdd.map(sid => ({ student_id: sid, course_id: courseId, is_active: true })));
          }
        }
      } catch(autoErr) {
        console.log("자동 수강 배정 중 오류(무시):", autoErr);
      }
    } catch (error) {
      alert("강의 등록 실패: " + (error?.message || JSON.stringify(error)));
    }
    setSavingOnline(false);
  }

  async function addLectureToCourse(courseId) {
    if (!courseId) {
      alert("강좌를 선택해 주세요.");
      return;
    }
    const target = teacherCourses.find((course) => String(course.id) === String(courseId));
    const nextOrder = ((target?.lectures || []).length) + 1;
    const title = nextOrder + "강: 새 강의";
    const { data, error } = await sb
      .from("videos")
      .insert({ course_id: courseId, title, youtube_id: "", sort_order: nextOrder })
      .select()
      .single();

    if (error) {
      alert("강의 추가 실패: " + error.message);
      return;
    }

    setTeacherCourses((prev) => prev.map((course) =>
      String(course.id) === String(courseId)
        ? { ...course, lectures: [...(course.lectures || []), { id: data.id, title: data.title, youtubeId: data.youtube_id || "", videoUrl: B2Utils.lectureVideoUrl(data) }] }
        : course
    ));
  }

  async function updateLecture(courseId, lectureId, field, value, saveToDB) {
    setTeacherCourses((prev) => prev.map((course) => {
      if (String(course.id) !== String(courseId)) return course;
      return {
        ...course,
        lectures: (course.lectures || []).map((lecture) => {
          if (String(lecture.id) !== String(lectureId)) return lecture;
          const next = { ...lecture, [field]: value };
          if (field === "youtubeId") next.videoUrl = B2Utils.lectureVideoUrl({ youtube_id: value });
          return next;
        }),
      };
    }));

    if (!saveToDB) return;
    const payload = field === "title" ? { title: value } : { youtube_id: B2Utils.extractYoutubeId(value) };
    const { error } = await sb.from("videos").update(payload).eq("id", lectureId);
    if (error) alert("강의 저장 실패: " + error.message);
  }

  async function deleteLecture(courseId, lectureId) {
    if (!confirm("이 강의를 삭제할까요?")) return;
    const { error } = await sb.from("videos").delete().eq("id", lectureId);
    if (error) {
      alert("강의 삭제 실패: " + error.message);
      return;
    }
    setTeacherCourses((prev) => prev.map((course) =>
      String(course.id) === String(courseId)
        ? { ...course, lectures: (course.lectures || []).filter((lecture) => String(lecture.id) !== String(lectureId)) }
        : course
    ));
  }

  // 학생 상세에서 메모 추가
  async function addStudentNote() {
    if (!selectedStudent || !newNoteContent.trim()) return;
    if (!teacherInfo) { alert('선생님 정보를 먼저 불러와야 합니다.'); return; }
    setSavingNote(true);
    try {
      var sb = window.supabase;
      var today = new Date().toISOString().slice(0, 10);
      var { error } = await sb.from('teacher_notes').insert({
        student_id: selectedStudent.id,
        teacher_id: teacherInfo.id,
        content: newNoteContent.trim(),
        note_type: newNoteType,
        note_date: today,
        class_id: selectedClass ? selectedClass.id : null,
      });
      if (error) throw error;
      setNewNoteContent('');
      // 학생 상세 다시 로드 (메모 새로고침)
      await loadStudentDetail(selectedStudent);
    } catch (e) { alert('메모 등록 실패: ' + (e.message || e)); }
    setSavingNote(false);
  }

  // 학생 클릭 시 상세 정보 통합 로드 (수강 강좌·시험·단어시험·특이사항·출결)
  async function loadStudentDetail(student) {
    setSelectedStudent(student);
    setStudentDetail(null);
    setStudentDetailLoading(true);
    try {
      var sb = window.supabase;
      var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      var results = await Promise.all([
        // 수강 강좌
        sb.from('enrollments').select('course_id, courses(id, title, subjects(name))').eq('student_id', student.id).eq('is_active', true),
        // 시험 점수 (test_scores)
        sb.from('test_scores').select('*').eq('student_id', student.id).order('test_date', { ascending: false }),
        // 단어시험 응시 결과
        sb.from('vocab_test_attempts').select('*, vocab_tests(title, unit_index)').eq('student_id', student.id).order('submitted_at', { ascending: false }),
        // 특이사항 (메모)
        sb.from('teacher_notes').select('*').eq('student_id', student.id).order('note_date', { ascending: false }),
        // 출결 (최근 30일)
        sb.from('attendance').select('status').eq('student_id', student.id).gte('date', thirtyDaysAgo),
      ]);
      var courses = ((results[0] && results[0].data) || []).map(function(r){ return { id: r.course_id, title: (r.courses && r.courses.title) || '강좌', subject_name: r.courses && r.courses.subjects && r.courses.subjects.name }; });
      var attendanceRows = (results[4] && results[4].data) || [];
      var att = { present: 0, late: 0, absent: 0, excused: 0, total: attendanceRows.length };
      attendanceRows.forEach(function(a){ if (att[a.status] != null) att[a.status]++; });
      setStudentDetail({
        courses: courses,
        scores: (results[1] && results[1].data) || [],
        vocabAttempts: (results[2] && results[2].data) || [],
        notes: (results[3] && results[3].data) || [],
        attendance: att,
      });
    } catch (e) {
      console.error('학생 상세 로드 실패:', e);
      setStudentDetail({ courses: [], scores: [], vocabAttempts: [], notes: [], attendance: { present: 0, late: 0, absent: 0, excused: 0, total: 0 } });
    }
    setStudentDetailLoading(false);
  }

  async function selectClass(cls) {
    if (!cls) {
      setSelectedClass(null);
      setSelectedClassId("");
      setStudents([]);
      setSelectedStudentIds([]);
      setSelectedStudent(null);
      setStudentDetail(null);
      setScores({});
      setExamList([]);
      setExamSubmissionsByExam({});
      return;
    }

    setSelectedClass(cls);
    setSelectedClassId(String(cls.id));
    const matchedAssignment = assignmentFromClass(cls);
    if (matchedAssignment) setSelectedCourseAssignment(matchedAssignment);
    setStudents([]);
    setSelectedStudentIds([]);
    setSelectedStudent(null);
    setStudentDetail(null);
    loadClassExams(cls.id);
    setScores({});
    setDebug("4. 반 학생 조회 시작: " + cls.name);

    // 가상 클래스(관리자 학년 배정)인 경우 → 학년으로 학생 조회
    if (cls.isVirtual) {
      const gradeValue = cls.grade || "";
      // "고등 1학년" → "고1", "중등 2학년" → "중2" 변환 시도 후 students 테이블 검색
      const gradeMap = {
        "초등 1학년": "1학년", "초등 2학년": "2학년", "초등 3학년": "3학년",
        "초등 4학년": "4학년", "초등 5학년": "5학년", "초등 6학년": "6학년",
        "중등 1학년": "중1", "중등 2학년": "중2", "중등 3학년": "중3",
        "고등 1학년": "고1", "고등 2학년": "고2", "고등 3학년": "고3",
      };
      const mappedGrade = gradeMap[gradeValue] || gradeValue;
      const { data: studentList, error: studentError } = await sb
        .from("students")
        .select("*")
        .eq("grade", mappedGrade)
        .eq("is_active", true)
        .eq("role", "student")
        .order("name", { ascending: true });
      if (studentError) { setDebug("학년별 학생 조회 오류: " + studentError.message); return; }
      const loaded = studentList || [];
      setStudents(loaded);
      setSelectedStudentIds(loaded.map(s => s.id));
      setTestInfo(prev => ({ ...prev, subject: cls.subject || prev.subject }));
      setDebug("5. 학년(" + mappedGrade + ") 학생 수: " + loaded.length);
      return;
    }

    const { data: links, error: linkError } = await sb
      .from("class_students")
      .select("*")
      .eq("class_id", cls.id);

    if (linkError) {
      setDebug("class_students 조회 오류: " + linkError.message);
      return;
    }

    if (!links || links.length === 0) {
      setDebug("선택한 반에 등록된 학생이 없습니다.");
      return;
    }

    const studentIds = links.map((x) => x.student_id);

    const { data: studentList, error: studentError } = await sb
      .from("students")
      .select("*")
      .in("id", studentIds)
      .order("name", { ascending: true });

    if (studentError) {
      setDebug("students 조회 오류: " + studentError.message);
      return;
    }

    const loadedStudents = studentList || [];
    setStudents(loadedStudents);
    setSelectedStudentIds(loadedStudents.map((student) => student.id));
    setTestInfo((prev) => ({
      ...prev,
      subject: cls.subject || prev.subject,
    }));
    setDebug("5. 선택한 반 학생 수: " + loadedStudents.length);
  }

  function handleClassSelect(value) {
    const cls = classes.find((item) => String(item.id) === String(value));
    selectClass(cls || null);
  }

  function updateScore(studentId, value) {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  }

  function toggleStudent(studentId) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function selectAllStudents() {
    setSelectedStudentIds(students.map((student) => student.id));
  }

  function clearAllStudents() {
    setSelectedStudentIds([]);
  }

  // test_scores에 class_id 없을 때 처리
  async function saveAllScores() {
    if (!teacherInfo) { alert("선생님 정보를 먼저 불러와야 합니다."); return; }
    if (!testInfo.subject.trim()) { alert("과목을 선택해 주세요."); return; }
    if (selectedStudentIds.length === 0) { alert("성적을 저장할 학생을 선택해 주세요."); return; }

    const selectedIdSet = new Set(selectedStudentIds);
    const rows = students
      .filter(s => selectedIdSet.has(s.id))
      .filter(s => String(scores[s.id] || "").trim() !== "")
      .map(s => ({
        student_id: s.id,
        teacher_id: teacherInfo.id,
        test_type: testInfo.testType,
        test_name: testInfo.testType,
        subject: testInfo.subject.trim(),
        test_range: testInfo.testRange.trim() || null,
        test_date: testInfo.testDate,
        score: Number(scores[s.id]),
        created_at: new Date().toISOString(),
      }));

    if (rows.length === 0) { alert("선택된 학생 중 입력된 점수가 없습니다."); return; }
    const { error } = await sb.from("test_scores").insert(rows);
    if (error) { alert("성적 저장 실패: " + error.message); return; }
    alert("성적이 저장되었습니다.");
    setScores({});
    loadScoreAnalysis();
  }

  async function loadNotes() {
    if (!teacherInfo) return;
    const { data, error } = await sb
      .from("teacher_notes")
      .select("*, students(name)")
      .eq("teacher_id", teacherInfo.id)
      .order("note_date", { ascending: false });
    if (error) { console.error("loadNotes error:", error); setTeacherNotes([]); return; }
    setTeacherNotes(data || []);
  }

  async function loadNoteClassStudents(classId) {
    setNoteStudents([]);
    setNoteStudentId('');
    if (!classId) return;
    const cls = (availableClassCards || []).find(c => String(c.id) === String(classId));
    if (!cls) return;
    if (cls.isVirtual) {
      const gradeMap = {
        "초등 1학년": "1학년", "초등 2학년": "2학년", "초등 3학년": "3학년",
        "초등 4학년": "4학년", "초등 5학년": "5학년", "초등 6학년": "6학년",
        "중등 1학년": "중1", "중등 2학년": "중2", "중등 3학년": "중3",
        "고등 1학년": "고1", "고등 2학년": "고2", "고등 3학년": "고3",
      };
      const mappedGrade = gradeMap[cls.grade || ''] || (cls.grade || '');
      const { data } = await sb.from("students").select("id, name, grade")
        .eq("grade", mappedGrade).eq("is_active", true).eq("role", "student")
        .order("name", { ascending: true });
      setNoteStudents(data || []);
      return;
    }
    const { data: links } = await sb.from("class_students").select("student_id").eq("class_id", cls.id);
    const ids = (links || []).map(x => x.student_id);
    if (ids.length === 0) { setNoteStudents([]); return; }
    const { data } = await sb.from("students").select("id, name, grade")
      .in("id", ids).order("name", { ascending: true });
    setNoteStudents(data || []);
  }

  async function saveNote() {
    if (!teacherInfo) { alert("선생님 정보를 먼저 불러와야 합니다."); return; }
    if (!String(noteDraft.content || "").trim()) { alert("내용을 입력해 주세요."); return; }
    if (noteTargetMode === 'student' && !noteStudentId) { alert("학생을 선택해 주세요."); return; }
    setSavingNote(true);
    const { error } = await sb.from("teacher_notes").insert({
      teacher_id: teacherInfo.id,
      student_id: noteTargetMode === 'student' ? noteStudentId : null,
      note_type: '특이사항',
      note_date: noteDraft.date,
      content: noteDraft.content.trim(),
    });
    setSavingNote(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    setNoteDraft({ date: new Date().toISOString().slice(0,10), content: '' });
    setNoteStudentId('');
    await loadNotes();
  }

  async function deleteNote(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await sb.from("teacher_notes").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); return; }
    await loadNotes();
  }

  // ── 성적 분석 헬퍼는 B2Utils로 통합 ──
  var gradeBucketOf = window.B2Utils.scoreGradeBucket;
  var distributionBucketOf = window.B2Utils.scoreDistBucket;
  var colorForScore = window.B2Utils.scoreColor;
  // 학생별 시간순 정렬된 점수 배열 반환 (오래된→최신)
  function studentScoresSorted(allScores, studentId, subject, testName) {
    return (allScores || [])
      .filter(function(s){
        if (String(s.student_id) !== String(studentId)) return false;
        if (subject && subject !== '전체' && s.subject !== subject) return false;
        if (testName && testName !== '전체' && s.test_name !== testName) return false;
        return true;
      })
      .sort(function(a,b){ return String(a.test_date||'').localeCompare(String(b.test_date||'')); });
  }
  // 템플릿 기반 코멘트 생성기 (AI 자리, 운영 시 백엔드 통한 Claude API로 교체)
  // 클래스 ID로 학생 목록 로드 (전역 state에 영향 없이 캐시)
  async function loadClassStudentsCached(classId) {
    if (!classId) return [];
    if (classStudentMap[classId]) return classStudentMap[classId];
    var { data: links } = await sb.from('class_students').select('student_id').eq('class_id', classId);
    var ids = (links || []).map(function(x){ return x.student_id; });
    if (ids.length === 0) {
      setClassStudentMap(function(prev){ return Object.assign({}, prev, (function(o){ o[classId] = []; return o; })({})); });
      return [];
    }
    var { data: stu } = await sb.from('students').select('id, name, grade, school').in('id', ids).eq('is_active', true).order('name');
    var loaded = stu || [];
    setClassStudentMap(function(prev){ var n = Object.assign({}, prev); n[classId] = loaded; return n; });
    return loaded;
  }

  // 전체 학생 목록 로드 (개별 학생 배포 검색용)
  async function ensureAllStudentsLoaded() {
    if (allStudents.length > 0) return;
    var { data: stuList } = await sb.from('students').select('id, name, grade, school').eq('role', 'student').eq('is_active', true).order('name');
    setAllStudents(stuList || []);
  }

  // 개별 학생 선택 — 이름 검색 + 학년 필터 + (선택)반 필터로 전체 학생 중에서 체크.
  // opts: { selectedIds, onChange(newIds), filters:{search,classId,grade}, onFiltersChange(newFilters) }
  function renderStudentPicker(opts) {
    var f = opts.filters || STU_FILTER_INIT;
    var setF = function(patch){ opts.onFiltersChange(Object.assign({}, f, patch)); };
    var q = String(f.search || '').trim().toLowerCase();
    var classFilterId = f.classId || '';
    var gradeFilter = f.grade || '';
    var pool = (allStudents || []).slice();
    if (classFilterId) {
      var inClass = new Set(((classStudentMap || {})[classFilterId] || []).map(function(s){ return String(s.id); }));
      pool = pool.filter(function(s){ return inClass.has(String(s.id)); });
    }
    if (gradeFilter) pool = pool.filter(function(s){ return String(s.grade || '') === gradeFilter; });
    if (q) pool = pool.filter(function(s){
      return String(s.name||'').toLowerCase().indexOf(q) >= 0 || String(s.grade||'').toLowerCase().indexOf(q) >= 0 || String(s.school||'').toLowerCase().indexOf(q) >= 0;
    });
    pool.sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||'')); });
    var visibleIds = pool.map(function(s){ return s.id; });
    var sel = (opts.selectedIds || []);
    var selSet = new Set(sel.map(String));
    var notLoaded = (allStudents || []).length === 0;
    // 학년 옵션 (실제 학생에 있는 학년만, 정해진 순서대로)
    var GRADE_ORDER = ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
    var presentGrades = {};
    (allStudents || []).forEach(function(s){ if (s.grade) presentGrades[s.grade] = true; });
    var gradeOptions = GRADE_ORDER.filter(function(g){ return presentGrades[g]; }).concat(Object.keys(presentGrades).filter(function(g){ return GRADE_ORDER.indexOf(g) < 0; }));
    var anyFilterActive = !!(q || classFilterId || gradeFilter);
    // 반 드롭다운: 학년 필터가 걸려 있으면 그 학년을 포함하는 반(또는 학년 미지정 반)만
    var classOptions = (availableClassCards || []).filter(function(cls){
      if (!gradeFilter) return true;
      if (!cls.grade) return true;
      return String(cls.grade).split(',').map(function(s){ return s.trim(); }).indexOf(gradeFilter) >= 0;
    });
    return (
      <div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
          <input style={{ ...inputStyle, flex:'2 1 150px' }} placeholder="학생 이름 검색" value={f.search || ''} onChange={e => setF({ search: e.target.value })} />
          <select style={{ ...inputStyle, flex:'1 1 110px' }} value={gradeFilter} onChange={e => setF({ grade: e.target.value, classId: '' })}>
            <option value="">학년 전체</option>
            {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select style={{ ...inputStyle, flex:'1 1 120px' }} value={classFilterId} onChange={e => { var cid = e.target.value; setF({ classId: cid, grade: '' }); if (cid) loadClassStudentsCached(cid); }}>
            <option value="">반 전체</option>
            {classOptions.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
          {anyFilterActive && <button type="button" style={smallLightButtonStyle} onClick={() => opts.onFiltersChange(Object.assign({}, STU_FILTER_INIT))}>필터 초기화</button>}
        </div>
        <div style={{ display:'flex', gap:'6px', marginBottom:'8px', flexWrap:'wrap' }}>
          <button type="button" style={smallLightButtonStyle} onClick={() => opts.onChange(Array.from(new Set(sel.concat(visibleIds))))}>보이는 {pool.length}명 모두 추가</button>
          <button type="button" style={smallLightButtonStyle} onClick={() => { var vis = new Set(visibleIds.map(String)); opts.onChange(sel.filter(function(id){ return !vis.has(String(id)); })); }}>보이는 학생 모두 빼기</button>
          {sel.length > 0 && <button type="button" style={smallLightButtonStyle} onClick={() => opts.onChange([])}>전체 선택 해제</button>}
        </div>
        <div style={{ maxHeight:'240px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px', background:'#fff' }}>
          {notLoaded ? <div style={{ fontSize:'12px', color:'#9ca3af', padding:'10px', fontFamily:'Manrope, sans-serif' }}>학생 목록 불러오는 중...</div>
            : pool.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af', padding:'10px', fontFamily:'Manrope, sans-serif' }}>{classFilterId ? '이 반에 학생이 없거나 아직 불러오는 중입니다.' : '조건에 맞는 학생이 없습니다.'}</div>
            : pool.map(s => {
                var checked = selSet.has(String(s.id));
                return (
                  <label key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 6px', cursor:'pointer', fontSize:'13px', fontFamily:'Manrope, sans-serif', borderRadius:'6px', background: checked ? '#fef2f2' : 'transparent' }}>
                    <input type="checkbox" checked={checked} onChange={e => {
                      var next = e.target.checked ? sel.concat([s.id]) : sel.filter(function(id){ return String(id) !== String(s.id); });
                      opts.onChange(next);
                    }} />
                    <span style={{ fontWeight:'600', color:'#1A1A1A' }}>{s.name}</span>
                    <span style={{ fontSize:'11px', color:'#9ca3af' }}>{[s.grade, s.school].filter(Boolean).join(' · ')}</span>
                  </label>
                );
              })
          }
        </div>
        <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'6px', fontFamily:'Manrope, sans-serif' }}>총 <strong>{sel.length}명</strong> 선택됨</div>
      </div>
    );
  }

  // ── 학습 현황: 내가 개설한 강좌를 수강하는 학생들의 영상 시청 진도 ──
  async function loadStudyViews() {
    setStudyViewsLoading(true);
    try {
      var courseIds = (teacherCourses || []).map(function(c){ return c.id; }).filter(Boolean);
      if (courseIds.length === 0) { setStudyViews([]); setStudyViewsLoading(false); return; }
      var { data, error } = await sb.from('video_views')
        .select('*, videos(title), courses(title, subjects(name)), students(id, name, grade, school)')
        .in('course_id', courseIds)
        .order('last_watched_at', { ascending: false });
      if (error) { setDebug('학습 현황 조회 오류: ' + error.message); setStudyViews([]); }
      else { setStudyViews(data || []); }
    } catch (e) {
      setDebug('학습 현황 오류: ' + (e && e.message ? e.message : '알 수 없는 오류'));
      setStudyViews([]);
    }
    setStudyViewsLoading(false);
  }

  // ── 강좌 개설 ──
  async function createCourse() {
    var d = courseDraft;
    if (!teacherInfo) { alert('선생님 정보를 불러올 수 없습니다.'); return; }
    if (!d.title.trim()) { alert('강좌명을 입력해 주세요.'); return; }
    if (!d.subject) { alert('과목을 선택해 주세요.'); return; }
    if (d.scope === 'class' && !d.class_id) { alert('클래스를 선택해 주세요.'); return; }
    if (d.scope === 'level' && (!d.level || !(d.grades||[]).length)) { alert('초중고와 학년(하나 이상)을 선택해 주세요.'); return; }
    if (d.scope === 'students' && d.student_ids.length === 0) { alert('1명 이상의 학생을 선택해 주세요.'); return; }
    setCreatingCourse(true);
    try {
      var subjectId = null;
      if (d.subject) {
        var sj = await sb.from('subjects').select('id').eq('name', d.subject).limit(1);
        subjectId = (sj.data && sj.data[0]) ? sj.data[0].id : null;
      }
      var payload = {
        title: d.title.trim(),
        description: (d.description||'').trim() || null,
        subject_id: subjectId,
        is_active: true,
        level: d.scope === 'level' ? d.level : null,
        grade: d.scope === 'level' ? (d.grades||[]).join(',') : null,
        class_id: d.scope === 'class' ? d.class_id : null,
        teacher_id: teacherInfo?.id || null,
      };
      var { data: created, error } = await sb.from('courses').insert(payload).select('*, subjects(name,color), videos(*)').single();
      if (error) throw error;
      // 학생 단위 배포 시 enrollments에 등록
      if (d.scope === 'students' && d.student_ids.length > 0) {
        var rows = d.student_ids.map(function(sid){ return { student_id: sid, course_id: created.id, is_active: true }; });
        var er = await sb.from('enrollments').insert(rows);
        if (er.error) console.error('enrollments insert:', er.error.message);
      }
      var mapped = mapCourseForTeacher(created);
      setTeacherCourses(function(prev){ return [...prev, mapped]; });
      setCourseDraft({ title:'', description:'', subject:'', scope:'unassigned', class_id:'', level:'', grade:'', grades:[], student_ids:[], picker_class_id:'' });
      setCourseStuFilters(STU_FILTER_INIT);
      var msg = d.scope === 'unassigned'
        ? '강좌가 개설되었습니다. 배포 대상은 아래 "내 강좌" 목록에서 언제든 설정할 수 있습니다.'
        : '강좌가 개설되었습니다. "강의 추가" 탭에서 영상을 등록하세요.';
      alert(msg);
      if (d.scope !== 'unassigned') {
        setTeacherView('lecture');
        setLectureCourseName(mapped.title);
        if (d.scope === 'class') setLectureClassId(d.class_id);
        if (d.scope === 'level') { setLectureLevel(d.level); setLectureGrade((d.grades||[])[0] || ''); }
        setLectureSubject(d.subject);
      }
    } catch (e) {
      alert('강좌 개설 실패: ' + (e.message || e));
    } finally {
      setCreatingCourse(false);
    }
  }

  // ── 사후 배포 편집 ──
  async function openDistributeEditor(course) {
    setDistributeCourseId(course.id);
    // 현재 scope 추정
    var scope = 'unassigned';
    if (course.class_id) scope = 'class';
    else if (course.level && course.grade) scope = 'level';
    // enrollments 조회 (학생 모드인지 판별)
    var { data: enrolls } = await sb.from('enrollments').select('student_id').eq('course_id', course.id).eq('is_active', true);
    var studentIds = (enrolls || []).map(function(e){ return e.student_id; });
    if (scope === 'unassigned' && studentIds.length > 0) scope = 'students';
    setDistEnrollments(studentIds);
    setDistributeDraft({
      scope: scope,
      class_id: course.class_id || '',
      level: course.level || '',
      grade: course.grade || '',
      grades: String(course.grade || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean),
      student_ids: studentIds,
      picker_class_id: '',
    });
    setDistStuFilters(STU_FILTER_INIT);
    // 학생 목록 (담당 선생님 학생들 우선)
    if (allStudents.length === 0) {
      var { data: stuList } = await sb.from('students').select('id, name, grade, school').eq('role', 'student').eq('is_active', true).order('name');
      setAllStudents(stuList || []);
    }
  }

  async function saveDistribution() {
    var d = distributeDraft;
    if (!distributeCourseId) return;
    if (d.scope === 'class' && !d.class_id) { alert('클래스를 선택해 주세요.'); return; }
    if (d.scope === 'level' && (!d.level || !(d.grades||[]).length)) { alert('초중고와 학년(하나 이상)을 선택해 주세요.'); return; }
    if (d.scope === 'students' && d.student_ids.length === 0) { alert('1명 이상의 학생을 선택해 주세요.'); return; }
    setDistributing(true);
    try {
      var updates = {
        class_id: d.scope === 'class' ? d.class_id : null,
        level:    d.scope === 'level' ? d.level : null,
        grade:    d.scope === 'level' ? (d.grades||[]).join(',') : null,
      };
      var { error } = await sb.from('courses').update(updates).eq('id', distributeCourseId);
      if (error) throw error;
      // 학생 모드: enrollments diff
      if (d.scope === 'students') {
        var prev = new Set(distEnrollments.map(String));
        var next = new Set(d.student_ids.map(String));
        var toAdd = d.student_ids.filter(function(sid){ return !prev.has(String(sid)); });
        var toRemove = distEnrollments.filter(function(sid){ return !next.has(String(sid)); });
        if (toAdd.length > 0) {
          var rows = toAdd.map(function(sid){ return { student_id: sid, course_id: distributeCourseId, is_active: true }; });
          await sb.from('enrollments').insert(rows);
        }
        if (toRemove.length > 0) {
          await sb.from('enrollments').update({ is_active:false }).eq('course_id', distributeCourseId).in('student_id', toRemove);
        }
      } else {
        // 학생 모드가 아닐 땐 기존 enrollments 비활성화 (중복 노출 방지)
        if (distEnrollments.length > 0) {
          await sb.from('enrollments').update({ is_active:false }).eq('course_id', distributeCourseId);
        }
      }
      // 로컬 state 업데이트
      setTeacherCourses(function(prev){ return prev.map(function(c){
        if (String(c.id) !== String(distributeCourseId)) return c;
        return Object.assign({}, c, { class_id: updates.class_id, level: updates.level || '', grade: updates.grade || '' });
      }); });
      alert('배포 설정이 저장되었습니다.');
      setDistributeCourseId('');
    } catch (e) {
      alert('저장 실패: ' + (e.message || e));
    } finally {
      setDistributing(false);
    }
  }
  function openCourseEditor(course) {
    setDistributeCourseId('');
    setEditingCourseId(course.id);
    setEditCourseDraft({ title: course.title || '', description: course.description || '', subject: course.subject || '' });
  }
  async function saveCourseEdit() {
    if (!editingCourseId) return;
    var d = editCourseDraft;
    if (!String(d.title || '').trim()) { alert('강좌명을 입력해 주세요.'); return; }
    setSavingCourseEdit(true);
    try {
      var subjectId = null;
      if (d.subject) {
        var sj = await sb.from('subjects').select('id').eq('name', d.subject).limit(1);
        subjectId = (sj.data && sj.data[0]) ? sj.data[0].id : null;
      }
      var updates = { title: String(d.title).trim(), description: (d.description || '').trim() || null, subject_id: subjectId };
      var { error } = await sb.from('courses').update(updates).eq('id', editingCourseId);
      if (error) throw error;
      setTeacherCourses(function(prev){ return prev.map(function(c){
        if (String(c.id) !== String(editingCourseId)) return c;
        return Object.assign({}, c, { title: updates.title, description: updates.description || '', subject: d.subject || '' });
      }); });
      alert('강좌 정보가 저장되었습니다.');
      setEditingCourseId('');
    } catch (e) {
      alert('저장 실패: ' + (e.message || e));
    } finally {
      setSavingCourseEdit(false);
    }
  }
  async function deleteTeacherCourse(course) {
    if (!confirm('"' + (course.title || '강좌') + '" 강좌를 삭제할까요?\n\n· 이 강좌의 강의(영상)와 수강 학생들의 강좌 목록에서도 사라집니다.\n· 학생들의 시청 기록 등은 데이터베이스에 보관됩니다.')) return;
    try {
      var { error } = await sb.from('courses').update({ is_active: false }).eq('id', course.id);
      if (error) throw error;
      try { await sb.from('enrollments').update({ is_active: false }).eq('course_id', course.id); } catch (e) {}
      setTeacherCourses(function(prev){ return prev.filter(function(c){ return String(c.id) !== String(course.id); }); });
      if (String(distributeCourseId) === String(course.id)) setDistributeCourseId('');
      if (String(editingCourseId) === String(course.id)) setEditingCourseId('');
      alert('강좌가 삭제되었습니다.');
    } catch (e) {
      alert('삭제 실패: ' + (e.message || e));
    }
  }
  function describeCourseScope(c) {
    if (c.class_id) {
      var cls = (availableClassCards || []).find(function(x){ return String(x.id) === String(c.class_id); });
      return '클래스: ' + (cls ? cls.name : '-');
    }
    if (c.level && c.grade) return '학년: ' + c.level + ' ' + c.grade;
    if (c.level) return '학년: ' + c.level;
    return '미배포 (또는 개별 학생)';
  }

  // ── 자료실 ──
  async function loadAttachments() {
    if (!teacherInfo) return;
    setAttachLoading(true);
    var { data } = await sb.from('attachments').select('*').eq('uploaded_by', teacherInfo.id).order('created_at', { ascending:false });
    setAttachments(data || []);
    setAttachLoading(false);
  }
  function attachmentPublicUrl(path) {
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  }
  function formatBytes(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    if (v < 1024*1024) return (v/1024).toFixed(1) + ' KB';
    return (v/1024/1024).toFixed(1) + ' MB';
  }
  async function uploadAttachment() {
    var d = attachDraft;
    if (!teacherInfo) { alert('선생님 정보가 없습니다.'); return; }
    if (!d.file) { alert('파일을 선택해 주세요.'); return; }
    if (!d.title.trim()) { alert('제목을 입력해 주세요.'); return; }
    if (d.scope === 'class' && !d.class_id) { alert('클래스를 선택해 주세요.'); return; }
    if (d.scope === 'student' && d.student_ids.length === 0) { alert('1명 이상의 학생을 선택해 주세요.'); return; }
    if (d.scope === 'video' && !d.video_id) { alert('강의 영상을 선택해 주세요.'); return; }
    setAttachUploading(true);
    try {
      var ext = d.file.name.split('.').pop() || 'bin';
      var pathPrefix = d.scope === 'class' ? 'class/' + d.class_id
        : d.scope === 'video' ? 'video/' + d.video_id
        : 'student/' + (teacherInfo.id || 'tx');
      var path = pathPrefix + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
      var up = await sb.storage.from('attachments').upload(path, d.file, { cacheControl:'3600', upsert:false });
      if (up.error) throw up.error;
      var insertRow = {
        uploaded_by: teacherInfo.id,
        title: d.title.trim(),
        description: d.description.trim(),
        file_path: path,
        file_name: d.file.name,
        file_size: d.file.size,
        mime_type: d.file.type || null,
        scope: d.scope,
        class_id: d.scope === 'class' ? d.class_id : null,
        video_id: d.scope === 'video' ? d.video_id : null,
      };
      var { data: created, error } = await sb.from('attachments').insert(insertRow).select().single();
      if (error) throw error;
      if (d.scope === 'student' && d.student_ids.length > 0) {
        var rows = d.student_ids.map(function(sid){ return { attachment_id: created.id, student_id: sid }; });
        await sb.from('attachment_recipients').insert(rows);
      }
      alert('업로드 완료');
      setAttachDraft({ title:'', description:'', scope:'class', class_id:'', student_ids:[], course_id:'', video_id:'', file:null });
      await loadAttachments();
    } catch (e) {
      alert('업로드 실패: ' + (e.message || e));
    } finally {
      setAttachUploading(false);
    }
  }
  async function deleteAttachment(att) {
    if (!confirm('이 자료를 삭제하시겠습니까?')) return;
    try {
      await sb.storage.from('attachments').remove([att.file_path]);
      await sb.from('attachments').delete().eq('id', att.id);
      await loadAttachments();
    } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
  }

  // ── 자료실: 분석 자료 도서관 (시험·숙제 만들기용) ──
  async function loadMaterials() {
    setMaterialLoading(true);
    try {
      var { data } = await sb.from('exams').select('*').eq('kind', 'material').order('created_at', { ascending:false });
      setMaterials(data || []);
    } catch (e) { setMaterials([]); }
    finally { setMaterialLoading(false); }
  }
  function openMaterialForm() {
    setMaterialEditId(null);
    var subs = (teacherInfo && Array.isArray(teacherInfo.subjects)) ? teacherInfo.subjects.filter(Boolean) : [];
    setMaterialDraft(Object.assign({}, MATERIAL_DRAFT_INIT, { subject: subs.length === 1 ? subs[0] : '' }));
    setMaterialFormOpen(true);
  }
  function openMaterialFormForEdit(m) {
    setMaterialEditId(m.id);
    setMaterialDraft({
      title: m.title || '', subject: m.subject || '', school_level: m.school_level || '', target_grade: m.target_grade || '', target_semester: m.target_semester || '',
      description: m.description || '',
      files: [], answer_files: [],
      existing_paths: Array.isArray(m.image_paths) ? m.image_paths : [],
      answer_existing_paths: Array.isArray(m.answer_paths) ? m.answer_paths : [],
      analyze_page_range: m.analyze_page_range || '',
      selected_questions_text: Array.isArray(m.selected_questions) ? m.selected_questions.join(',') : '',
      precise: m.analyze_model === 'opus',
      precise_student: m.analyze_student_model === 'opus',
      analysis: m.analysis || null,
    });
    setMaterialFormOpen(true);
  }
  function closeMaterialForm() { setMaterialFormOpen(false); setMaterialEditId(null); }
  async function submitMaterial(thenAnalyze) {
    if (!teacherInfo) { alert('선생님 정보가 없습니다.'); return; }
    var d = materialDraft;
    if (!d.title.trim()) { alert('자료 제목을 입력해 주세요.'); return; }
    var hasNewFiles = (d.files && d.files.length) || (d.answer_files && d.answer_files.length);
    var hasExisting = ((d.existing_paths||[]).length) || ((d.answer_existing_paths||[]).length);
    if (!hasNewFiles && !hasExisting) { alert('시험지 또는 답안지·해설 파일을 1개 이상 올려주세요.'); return; }
    var doAnalyze = thenAnalyze === true;
    if (doAnalyze && materialEditId && d.analysis) {
      doAnalyze = confirm('이미 문항 분석이 된 자료입니다.\n[확인] = 저장하고 다시 분석 (Claude 요금 다시 발생)\n[취소] = 저장만');
    }
    setMaterialUploading(true);
    try {
      var prefix = 'materials/' + (teacherInfo.id || 'tx');
      var paths = (d.existing_paths && d.existing_paths.length) ? d.existing_paths.slice() : [];
      if (d.files && d.files.length > 0) {
        paths = [];
        for (var i = 0; i < d.files.length; i++) {
          var f = d.files[i]; var ext = (f.name.split('.').pop() || 'png').toLowerCase();
          var p = prefix + '/' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
          var up = await sb.storage.from('attachments').upload(p, f, { cacheControl:'3600', upsert:false });
          if (up.error) throw up.error; paths.push(p);
        }
      }
      var ansPaths = (d.answer_existing_paths && d.answer_existing_paths.length) ? d.answer_existing_paths.slice() : [];
      if (d.answer_files && d.answer_files.length > 0) {
        ansPaths = [];
        for (var ai = 0; ai < d.answer_files.length; ai++) {
          var af = d.answer_files[ai]; var aext = (af.name.split('.').pop() || 'png').toLowerCase();
          var ap = prefix + '/answers/' + Date.now() + '_' + ai + '_' + Math.random().toString(36).slice(2,8) + '.' + aext;
          var aup = await sb.storage.from('attachments').upload(ap, af, { cacheControl:'3600', upsert:false });
          if (aup.error) throw aup.error; ansPaths.push(ap);
        }
      }
      var row = {
        title: d.title.trim(),
        subject: (d.subject||'').trim() || null,
        school_level: (d.school_level||'').trim() || null,
        target_grade: (d.target_grade||'').trim() || null,
        target_semester: (d.target_semester||'').trim() || null,
        description: (d.description||'').trim() || null,
        image_paths: paths,
        answer_paths: ansPaths,
        analyze_page_range: (d.analyze_page_range || '').trim() || null,
        selected_questions: window.B2Utils.parseNumberRange(d.selected_questions_text),
        analyze_model: d.precise ? 'opus' : 'sonnet',
        analyze_student_model: d.precise_student ? 'opus' : 'sonnet',
      };
      var savedId = null;
      if (materialEditId) {
        var u = await sb.from('exams').update(row).eq('id', materialEditId);
        if (u.error) throw u.error; savedId = materialEditId;
        if (!doAnalyze) alert('자료가 수정되었습니다.');
      } else {
        var insertRow = Object.assign({
          kind: 'material', class_id: null,
          teacher_id: (user && user.id) || null,
          teacher_name: teacherInfo.name || user?.name || '선생님',
          status: 'open', question_count: 0, text_question_count: 0, allow_text_answer: false, answer_key: {},
        }, row);
        var ins = await sb.from('exams').insert(insertRow).select('id').single();
        if (ins.error) throw ins.error; savedId = ins.data && ins.data.id;
        if (!doAnalyze) alert('자료가 저장되었습니다.');
      }
      await loadMaterials();
      if (!doAnalyze) { closeMaterialForm(); }
      if (doAnalyze && savedId) {
        setMaterialEditId(savedId);
        setMaterialDraft(function(p){ return Object.assign({}, p, { existing_paths: row.image_paths, answer_existing_paths: row.answer_paths, files:[], answer_files:[] }); });
        setAnalyzingMaterialId(savedId);
        try {
          var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: savedId });
          if (!r.ok || (r.data && r.data.error)) { alert('저장은 됐지만 문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); }
          else {
            await loadMaterials();
            setMaterialAnalysisOpenId(savedId);
            var us = (r.data && r.data.usage) || {};
            setMaterialDraft(function(p){ return Object.assign({}, p, { analysis: (r.data && r.data.analysis) || p.analysis }); });
            alert('문항 분석 완료!' + (us.input_tokens ? '\n(입력 ' + us.input_tokens + ' / 출력 ' + (us.output_tokens||0) + ' 토큰)' : ''));
          }
        } catch (ee) { alert('저장은 됐지만 문항 분석 실패: ' + (ee.message || ee)); }
        finally { setAnalyzingMaterialId(null); }
      }
    } catch (e) {
      alert((materialEditId ? '수정' : '저장') + ' 실패: ' + (e.message || e));
    } finally {
      setMaterialUploading(false);
    }
  }
  async function reanalyzeMaterial(m) {
    var hasFiles = (Array.isArray(m.image_paths) && m.image_paths.length) || (Array.isArray(m.answer_paths) && m.answer_paths.length);
    if (!hasFiles) { alert('이 자료에 시험지/답안지 파일이 없습니다. "수정"에서 파일을 올린 뒤 분석해 주세요.'); return; }
    if (m.analysis && !confirm('이미 분석된 자료입니다. 다시 분석할까요?\n(Claude API 요금이 다시 발생합니다)')) return;
    setAnalyzingMaterialId(m.id);
    try {
      var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: m.id });
      if (!r.ok || (r.data && r.data.error)) { alert('문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
      await loadMaterials();
      setMaterialAnalysisOpenId(m.id);
      var u = (r.data && r.data.usage) || {};
      alert('문항 분석 완료!' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
    } catch (e) { alert('문항 분석 실패: ' + (e.message || e)); }
    finally { setAnalyzingMaterialId(null); }
  }
  async function deleteMaterial(m) {
    var dependents = [];
    try { var { data: dep } = await sb.from('exams').select('id').eq('material_id', m.id); dependents = dep || []; } catch (e) {}
    var n = dependents.length;
    var msg = n > 0
      ? '이 자료로 만든 시험·숙제가 ' + n + '개 있습니다.\n자료 기록만 지우고, 그 시험·숙제들과 시험지 파일은 그대로 둡니다. 계속할까요?'
      : '이 자료를 삭제하시겠습니까?';
    if (!confirm(msg)) return;
    try {
      if (n === 0) {
        var allPaths = (Array.isArray(m.image_paths)?m.image_paths:[]).concat(Array.isArray(m.answer_paths)?m.answer_paths:[]);
        if (allPaths.length) { try { await sb.storage.from('attachments').remove(allPaths); } catch(e){} }
      }
      await sb.from('exams').delete().eq('id', m.id);
      await loadMaterials();
    } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
  }
  // 시험·숙제 발행 폼에 자료 불러오기
  function loadMaterialIntoExam(m) {
    setExamDraft(function(p){
      return Object.assign({}, p, {
        subject: m.subject || p.subject || '',
        files: [], answer_files: [],
        existing_paths: Array.isArray(m.image_paths) ? m.image_paths.slice() : [],
        answer_existing_paths: Array.isArray(m.answer_paths) ? m.answer_paths.slice() : [],
        analysis: m.analysis || null,
        answer_key: (m.answer_key && typeof m.answer_key === 'object') ? Object.assign({}, m.answer_key) : {},
        question_count: String(m.question_count || 0),
        choices_per_question: String(m.choices_per_question || 5),
        text_question_count: String(m.text_question_count || 0),
        analyze_page_range: m.analyze_page_range || '',
        selected_questions_text: Array.isArray(m.selected_questions) ? m.selected_questions.join(',') : '',
        precise_student: m.analyze_student_model === 'opus',
        material_id: m.id,
        material_title: m.title || '',
      });
    });
    setMaterialPickerOpen(false);
  }
  function unlinkMaterialFromExam() {
    setExamDraft(function(p){ return Object.assign({}, p, { material_id: null, material_title: '', existing_paths: [], answer_existing_paths: [], analysis: null, answer_key: {}, question_count: '0', text_question_count: '0', choices_per_question: '5', analyze_page_range: '', selected_questions_text: '', precise_student: false }); });
  }

  // ── 시험지 발행 ──
  async function loadClassExams(classId) {
    if (!classId) { setExamList([]); setExamSubmissionsByExam({}); return; }
    setExamLoading(true);
    try {
      var { data: exams } = await sb.from('exams').select('*').in('kind', ['class','weekly','monthly','homework','level']).eq('class_id', classId).order('created_at', { ascending: false });
      setExamList(exams || []);
      if (exams && exams.length > 0) {
        var ids = exams.map(function(e){ return e.id; });
        var { data: subs } = await sb.from('exam_submissions').select('*').in('exam_id', ids);
        var grouped = {};
        (subs || []).forEach(function(s){ (grouped[s.exam_id] = grouped[s.exam_id] || []).push(s); });
        setExamSubmissionsByExam(grouped);
      } else {
        setExamSubmissionsByExam({});
      }
    } catch (e) {
      console.error('시험 로드 실패:', e);
      setExamList([]); setExamSubmissionsByExam({});
    } finally {
      setExamLoading(false);
    }
  }
  function examPublicUrl(path) {
    if (!path) return '';
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    return data?.publicUrl || '';
  }
  function renderFileList(paths, label, unitWord) {
    if (!paths || paths.length === 0) return null;
    var w = unitWord || '페이지';
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'6px' }}>
        {paths.map((p, i) => {
          var url = examPublicUrl(p);
          var ext = (String(p).split('.').pop() || '').toLowerCase();
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'11px', fontFamily:'Manrope, sans-serif', background:'#fff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'4px 9px', color:'#1d4ed8', fontWeight:'700', textDecoration:'none' }}>
              {label} {i+1}{w}{ext ? ' (.' + ext + ')' : ''}
              <span style={{ color:'#0f766e', textDecoration:'underline' }}>열기</span>
            </a>
          );
        })}
      </div>
    );
  }
  function openExamForm(presetKind) {
    var k = ['homework','weekly','monthly','level'].indexOf(presetKind) >= 0 ? presetKind : 'weekly';
    var subs = (teacherInfo && Array.isArray(teacherInfo.subjects)) ? teacherInfo.subjects.filter(Boolean) : [];
    if (!materials.length) loadMaterials();
    setEditingExamId(null);
    setExamDraft({ kind:k, title:'', subject: subs.length === 1 ? subs[0] : '', test_date: new Date().toISOString().slice(0,10), description:'', files:[], existing_paths:[], answer_files:[], answer_existing_paths:[], question_count:'0', choices_per_question:'5', text_question_count:'0', time_limit_minutes:'0', answer_key:{}, allow_audio_answer:false, analyze_page_range:'', selected_questions_text:'', precise:false, precise_student:false, hide_paper:false, material_id:null, material_title:'', analysis:null });
    setExamFormOpen(true);
  }
  function openExamFormForEdit(exam) {
    if (!materials.length) loadMaterials();
    setEditingExamId(exam.id);
    setExamDraft({
      kind: exam.kind === 'homework' ? 'homework' : (exam.kind || 'class'),
      title: exam.title || '',
      subject: exam.subject || '',
      test_date: exam.test_date || '',
      description: exam.description || '',
      files: [],
      existing_paths: Array.isArray(exam.image_paths) ? exam.image_paths : [],
      answer_files: [],
      answer_existing_paths: Array.isArray(exam.answer_paths) ? exam.answer_paths : [],
      question_count: String(exam.question_count || 0),
      choices_per_question: String(exam.choices_per_question || 5),
      text_question_count: String(exam.text_question_count || (exam.allow_text_answer ? 1 : 0)),
      time_limit_minutes: String(exam.time_limit_minutes || 0),
      answer_key: exam.answer_key || {},
      allow_audio_answer: !!exam.allow_audio_answer,
      analyze_page_range: exam.analyze_page_range || '',
      selected_questions_text: Array.isArray(exam.selected_questions) ? exam.selected_questions.join(',') : '',
      analysis: exam.analysis || null,
      precise: exam.analyze_model === 'opus',
      precise_student: exam.analyze_student_model === 'opus',
      hide_paper: !!exam.hide_paper_for_students,
      material_id: exam.material_id || null,
      material_title: exam.material_id ? (((materials || []).find(function(m){ return String(m.id) === String(exam.material_id); }) || {}).title || '') : '',
    });
    setExamFormOpen(true);
  }
  function closeExamForm() {
    setExamFormOpen(false);
    setEditingExamId(null);
  }
  async function removeExamFilesTeacher(which) {
    if (!editingExamId) { alert('아직 발행 전이라 삭제할 파일이 없습니다. (파일 선택을 비워두면 됩니다)'); return; }
    var key = which === 'answer' ? 'answer_existing_paths' : 'existing_paths';
    var col = which === 'answer' ? 'answer_paths' : 'image_paths';
    var label = which === 'answer' ? '답안지·해설' : '시험지';
    var paths = (examDraft[key] || []).slice();
    if (paths.length === 0) { alert('삭제할 ' + label + ' 파일이 없습니다.'); return; }
    if (!confirm('등록된 ' + label + ' 파일 ' + paths.length + '개를 모두 삭제할까요?')) return;
    try { await sb.storage.from('attachments').remove(paths); } catch (e) {}
    var upd = {}; upd[col] = [];
    var { error } = await sb.from('exams').update(upd).eq('id', editingExamId);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    setExamDraft(function(p){ var o = Object.assign({}, p); o[key] = []; return o; });
    await loadClassExams(selectedClass && selectedClass.id);
    alert(label + ' 파일을 삭제했습니다.');
  }
  async function submitExam(thenAnalyze) {
    if (!teacherInfo) { alert('선생님 정보가 없습니다.'); return; }
    if (!selectedClass) { alert('반을 먼저 선택해 주세요.'); return; }
    var d = examDraft;
    var doAnalyze = thenAnalyze === true;
    if (doAnalyze && editingExamId && d.analysis) {
      doAnalyze = confirm('이미 문항 분석이 된 시험입니다.\n[확인] = 저장하고 다시 분석 (Claude 요금 다시 발생)\n[취소] = 저장만');
    }
    if (!d.title.trim()) { alert('시험 제목을 입력해 주세요.'); return; }
    var qc = parseInt(d.question_count, 10);
    if (isNaN(qc) || qc < 0) qc = 0;
    var cpq = parseInt(d.choices_per_question, 10);
    if (isNaN(cpq) || cpq < 2) cpq = 5;
    if (cpq > 9) cpq = 9;
    var tqc = parseInt(d.text_question_count, 10);
    if (isNaN(tqc) || tqc < 0) tqc = 0;
    var isHw2 = d.kind === 'homework';
    if (qc === 0 && tqc === 0 && !(isHw2 && d.allow_audio_answer)) {
      alert(isHw2 ? '객관식 / 서술형 / 녹음 중 최소 한 가지 답안 종류를 선택해 주세요.' : '객관식 또는 서술형 문제 수 중 하나는 1 이상이어야 합니다.');
      return;
    }
    var tlm = parseInt(d.time_limit_minutes, 10);
    if (isNaN(tlm) || tlm < 0) tlm = 0;
    setExamUploading(true);
    try {
      var paths = (d.existing_paths && d.existing_paths.length) ? d.existing_paths.slice() : [];
      if (d.files && d.files.length > 0) {
        // 새 이미지를 올리면 기존 이미지를 대체
        paths = [];
        for (var i = 0; i < d.files.length; i++) {
          var f = d.files[i];
          var ext = (f.name.split('.').pop() || 'png').toLowerCase();
          var path = 'exams/' + selectedClass.id + '/' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
          var up = await sb.storage.from('attachments').upload(path, f, { cacheControl:'3600', upsert:false });
          if (up.error) throw up.error;
          paths.push(path);
        }
      }
      // 답안지(해설) 업로드 — 시험지와 동일 패턴
      var ansExisting = (d.answer_existing_paths && d.answer_existing_paths.length) ? d.answer_existing_paths.slice() : [];
      var answerPaths = ansExisting.slice();
      if (d.answer_files && d.answer_files.length > 0) {
        if (editingExamId && ansExisting.length > 0) {
          try { await sb.storage.from('attachments').remove(ansExisting); } catch(e) {}
        }
        answerPaths = [];
        for (var ai = 0; ai < d.answer_files.length; ai++) {
          var af = d.answer_files[ai];
          var aext = (af.name.split('.').pop() || 'png').toLowerCase();
          var apath = 'exams/' + selectedClass.id + '/answers/' + Date.now() + '_' + ai + '_' + Math.random().toString(36).slice(2,8) + '.' + aext;
          var aup = await sb.storage.from('attachments').upload(apath, af, { cacheControl:'3600', upsert:false });
          if (aup.error) throw aup.error;
          answerPaths.push(apath);
        }
      }
      var kindVal = ['homework','weekly','monthly','level','class'].indexOf(d.kind) >= 0 ? d.kind : 'weekly';
      var row = {
        title: d.title.trim(),
        subject: (d.subject||'').trim() || null,
        test_date: d.test_date || null,
        description: (d.description||'').trim() || null,
        image_paths: paths,
        answer_paths: answerPaths,
        analysis: d.analysis || null,
        analyze_page_range: (d.analyze_page_range || '').trim() || null,
        selected_questions: window.B2Utils.parseNumberRange(d.selected_questions_text),
        analyze_model: d.precise ? 'opus' : 'sonnet',
        analyze_student_model: d.precise_student ? 'opus' : 'sonnet',
        hide_paper_for_students: !!d.hide_paper,
        question_count: qc,
        choices_per_question: cpq,
        text_question_count: tqc,
        allow_text_answer: tqc > 0,
        time_limit_minutes: tlm,
        answer_key: d.answer_key || {},
        objective_total: qc,
        allow_audio_answer: !!d.allow_audio_answer && kindVal === 'homework',
        material_id: d.material_id || null,
      };
      var savedId = null;
      if (editingExamId) {
        var u = await sb.from('exams').update(row).eq('id', editingExamId);
        if (u.error) throw u.error;
        savedId = editingExamId;
        if (!doAnalyze) alert('수정되었습니다.');
      } else {
        var insertRow = Object.assign({
          kind: kindVal,
          class_id: selectedClass.id,
          teacher_id: (user && user.id) || null, // exams.teacher_id 는 students(id) 참조
          teacher_name: teacherInfo.name || user?.name || '선생님',
          status: 'open',
        }, row);
        var ins = await sb.from('exams').insert(insertRow).select('id').single();
        if (ins.error) throw ins.error;
        savedId = ins.data && ins.data.id;
        if (!doAnalyze) alert(examKindLabel(kindVal) + '이(가) 발행되었습니다.');
      }
      if (!doAnalyze) closeExamForm();
      await loadClassExams(selectedClass.id);
      if (doAnalyze && savedId) {
        setEditingExamId(savedId);
        setAnalyzingExamId(savedId);
        try {
          var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: savedId });
          if (!r.ok || (r.data && r.data.error)) { alert('저장은 됐지만 문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); }
          else {
            await loadClassExams(selectedClass.id);
            setAnalysisOpenId(savedId);
            var us = (r.data && r.data.usage) || {};
            setExamDraft(function(p){ return Object.assign({}, p, { analysis: (r.data && r.data.analysis) || p.analysis }); });
            alert('문항 분석 완료!' + (us.input_tokens ? '\n(입력 ' + us.input_tokens + ' / 출력 ' + (us.output_tokens||0) + ' 토큰)' : ''));
          }
        } catch (ee) { alert('저장은 됐지만 문항 분석 실패: ' + (ee.message || ee)); }
        finally { setAnalyzingExamId(null); }
      }
    } catch (e) {
      alert((editingExamId ? '수정' : '발행') + ' 실패: ' + (e.message || e));
    } finally {
      setExamUploading(false);
    }
  }
  async function runExamAnalysis(exam) {
    var hasFiles = (Array.isArray(exam.image_paths) && exam.image_paths.length > 0) || (Array.isArray(exam.answer_paths) && exam.answer_paths.length > 0);
    if (!hasFiles) { alert('먼저 시험지 또는 답안지 파일을 업로드한 뒤(시험 수정에서) 분석해 주세요.'); return; }
    if (exam.analysis && !confirm('이미 분석된 시험입니다. 다시 분석할까요?\n(Claude API 요금이 다시 발생합니다)')) return;
    setAnalyzingExamId(exam.id);
    try {
      var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: exam.id });
      if (!r.ok || (r.data && r.data.error)) { alert('문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
      await loadClassExams(selectedClass && selectedClass.id);
      setAnalysisOpenId(exam.id);
      var u = (r.data && r.data.usage) || {};
      alert('문항 분석이 완료되었습니다.' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' 토큰 / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
    } catch (e) { alert('문항 분석 실패: ' + (e.message || e)); }
    finally { setAnalyzingExamId(null); }
  }
  async function runStudentAnalysis(submissionId, hasExisting) {
    if (!submissionId) return;
    if (hasExisting && !confirm('이 학생은 이미 AI 약점 분석이 되어 있습니다.\n다시 분석하면 Claude 요금이 다시 발생합니다 (약 50원).\n다시 분석할까요?')) return;
    setAnalyzingStudentId(submissionId);
    try {
      var r = await window.B2Utils.callEdgeFn('analyze-student', { submission_id: submissionId });
      if (!r.ok || (r.data && r.data.error)) { alert('학생 약점 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
      try { var sr = await sb.from('exam_submissions').select('exam_id').eq('id', submissionId).single(); if (sr && sr.data && sr.data.exam_id) await window.B2Utils.syncExamScore(sr.data.exam_id, submissionId); } catch (e2) {}
      await loadClassExams(selectedClass && selectedClass.id);
      var u = (r.data && r.data.usage) || {};
      alert('학생 약점 분석 완료!' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
    } catch (e) { alert('학생 약점 분석 실패: ' + (e.message || e)); }
    finally { setAnalyzingStudentId(null); }
  }
  function _roleColorTP(r) {
    var x = String(r || '').split(',')[0].trim();
    if (x === '정답') return '#15803d';
    if (x === '매력적인 오답' || x === '부분만 맞음' || x === '범위·정도 오류') return '#c87000';
    if (x === '계산·적용 실수') return '#7c3aed';
    if (x === '흔한 오개념' || x === '반대·모순' || x === '무관·엉뚱') return '#c82014';
    // 옛 형식 폴백
    if (x === '매력적인 함정' || x === '지엽적' || x === '포괄적') return '#c87000';
    if (x === '본문 무관' || x === '반대 내용') return '#c82014';
    return '#6b7280';
  }
  function renderStudentAnalysis(a) {
    if (!a) return null;
    var dx = a.diagnosis;
    var dxC = !dx ? null : (
      dx.pattern === 'trap' ? { bg:'#fff7ed', bd:'#fed7aa', fg:'#9a3412' } :
      (dx.pattern === 'concept' || dx.pattern === 'comprehension') ? { bg:'#fef2f2', bd:'#fecaca', fg:'#991b1b' } :
      dx.pattern === 'careless' ? { bg:'#f5f3ff', bd:'#ddd6fe', fg:'#6d28d9' } :
      { bg:'#f3f4f6', bd:'#e5e7eb', fg:'#374151' }
    );
    var wd = Array.isArray(a.wrong_details) ? a.wrong_details : [];
    return (
      <div style={{ marginTop:'6px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px', fontSize:'11px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' }}>
        <div style={{ fontWeight:'800', color:'#15803d', marginBottom:'4px' }}>AI 약점 분석{a.score != null ? ' — ' + a.score + '/' + (a.total != null ? a.total : '?') + (a.percentage != null ? ' (' + a.percentage + '%)' : '') : ''}</div>
        {a.summary && <div style={{ color:'#374151', marginBottom:'4px', whiteSpace:'pre-line' }}>{a.summary}</div>}
        {dx && (
          <div style={{ background:dxC.bg, border:'1px solid '+dxC.bd, borderRadius:'6px', padding:'6px 8px', marginBottom:'4px' }}>
            <span style={{ fontWeight:'800', color:dxC.fg }}>진단: {dx.label}</span>{dx.text ? <span style={{ color:dxC.fg }}> {dx.text}</span> : null}
          </div>
        )}
        {Array.isArray(a.weak_topics) && a.weak_topics.length > 0 && <div style={{ color:'#c82014', marginBottom:'2px', fontWeight:'700' }}>약점: {a.weak_topics.join(', ')}</div>}
        {Array.isArray(a.strengths) && a.strengths.length > 0 && <div style={{ color:'#15803d', marginBottom:'2px' }}>강점: {a.strengths.join(', ')}</div>}
        {a.mistake_pattern && <div style={{ color:'#c87000', marginBottom:'2px' }}>실수 패턴: {a.mistake_pattern}</div>}
        {wd.length > 0 ? (
          <div style={{ marginTop:'4px' }}>
            <div style={{ fontWeight:'700', color:'#374151', marginBottom:'2px' }}>틀린 문항 해설</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              {wd.map(function(w, i){ return (
                <div key={i} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'5px', padding:'4px 7px' }}>
                  <span style={{ fontWeight:'800', color:'#111827' }}>{w.number}번</span>
                  {(w.topic || w.subtopic) && <span style={{ color:'#6b7280' }}> · {[w.topic, w.subtopic].filter(Boolean).join(' / ')}</span>}
                  <span style={{ color:'#15803d', fontWeight:'700' }}> · 정답 {w.correct_answer || '-'}</span>
                  <span style={{ color:'#c82014', fontWeight:'700' }}> · 학생답 {w.student_answer}</span>
                  {w.role && <span style={{ color:_roleColorTP(w.role), fontWeight:'700' }}> [{w.role}]</span>}
                  {w.why ? <div style={{ color:'#374151', marginTop:'1px' }}>{w.why}</div> : (w.intent ? <div style={{ color:'#6b7280', marginTop:'1px' }}>{w.intent}</div> : null)}
                  {w.correct_why && <div style={{ color:'#166534', marginTop:'1px' }}>정답 해설: {w.correct_why}</div>}
                </div>
              ); })}
            </div>
          </div>
        ) : (Array.isArray(a.wrong_questions) && a.wrong_questions.length > 0 && <div style={{ color:'#6b7280', marginBottom:'2px' }}>틀린 문항: {a.wrong_questions.join(', ')}번</div>)}
        {Array.isArray(a.by_topic) && a.by_topic.length > 0 && <div style={{ color:'#374151', marginBottom:'2px', marginTop:'2px' }}>단원별: {a.by_topic.map(function(t){ return t.topic + ' ' + t.correct + '/' + t.total; }).join(' · ')}</div>}
        {a.text_feedback && <div style={{ color:'#7c3aed', marginTop:'4px', whiteSpace:'pre-line' }}>서술형 평가: {a.text_feedback}</div>}
        {a.recommendation && <div style={{ color:'#1d4ed8', marginTop:'4px', whiteSpace:'pre-line', fontWeight:'600' }}>추천 학습: {a.recommendation}</div>}
      </div>
    );
  }
  function renderExamAnalysis(a) {
    if (!a) return null;
    var qs = Array.isArray(a.questions) ? a.questions : [];
    var diffColor = function(d){ return d==='상' ? '#c82014' : (d==='중' ? '#c87000' : '#16a34a'); };
    return (
      <div style={{ marginTop:'10px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px' }}>
        <div style={{ fontSize:'12px', fontWeight:'800', color:'#111827', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>분석 내용</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'400px', overflowY:'auto' }}>
          {qs.map((q, i) => (
            <div key={i} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'7px 10px', fontSize:'11px', fontFamily:'Manrope, sans-serif' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'2px' }}>
                <span style={{ fontWeight:'800', color:'#111827' }}>{q.number != null ? q.number : (i+1)}번</span>
                <span style={{ fontSize:'10px', fontWeight:'700', background: q.type==='mc' ? '#dbeafe' : '#fef3c7', color: q.type==='mc' ? '#1d4ed8' : '#92400e', borderRadius:'3px', padding:'1px 5px' }}>{q.type==='mc' ? ('객관식' + (q.choices_count ? (' ' + q.choices_count + '지') : '')) : '서술형'}</span>
                {q.difficulty && <span style={{ fontSize:'10px', fontWeight:'700', color: diffColor(q.difficulty) }}>난이도 {q.difficulty}</span>}
                {q.page != null && <span style={{ fontSize:'10px', color:'#9ca3af' }}>{q.page}p</span>}
                <span style={{ fontWeight:'700', color:'#E60012' }}>정답: {q.answer || '-'}</span>
              </div>
              {(q.topic || q.subtopic) && <div style={{ color:'#374151', marginBottom:'1px' }}>{[q.topic, q.subtopic].filter(Boolean).join(' · ')}</div>}
              {q.intent && <div style={{ color:'#6b7280' }}>{q.intent}</div>}
              {Array.isArray(q.choice_explanations) && q.choice_explanations.length > 0 && (
                <div style={{ marginTop:'3px', paddingTop:'3px', borderTop:'1px dashed #e5e7eb', display:'flex', flexDirection:'column', gap:'1px' }}>
                  {q.choice_explanations.map(function(c, j){ return (
                    <div key={j}><span style={{ fontWeight:'800', color:_roleColorTP(c.role) }}>{c.choice}번 [{c.role}]</span> <span style={{ color:'#4b5563' }}>{c.why}</span></div>
                  ); })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  async function toggleExamStatus(exam) {
    var nextStatus = exam.status === 'open' ? 'closed' : 'open';
    if (!confirm(nextStatus === 'closed' ? '응시를 마감하시겠습니까?' : '다시 응시 가능 상태로 변경하시겠습니까?')) return;
    try {
      await sb.from('exams').update({ status: nextStatus }).eq('id', exam.id);
      await loadClassExams(selectedClass?.id);
    } catch (e) { alert('변경 실패: ' + (e.message || e)); }
  }
  async function deleteExam(exam) {
    if (!confirm('이 시험지를 삭제하시겠습니까? 학생 답안도 함께 삭제됩니다.')) return;
    try {
      // 자료실 자료에서 만든 시험이면 시험지 파일은 자료가 계속 쓰므로 지우지 않음
      if (!exam.material_id) {
        var paths = Array.isArray(exam.image_paths) ? exam.image_paths : [];
        var ansPaths = Array.isArray(exam.answer_paths) ? exam.answer_paths : [];
        var allPaths = paths.concat(ansPaths);
        if (allPaths.length > 0) { try { await sb.storage.from('attachments').remove(allPaths); } catch(e) {} }
      }
      try { await window.B2Utils.removeExamScores(exam.id); } catch (e2) {}
      await sb.from('exams').delete().eq('id', exam.id);
      await loadClassExams(selectedClass?.id);
    } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
  }

  // ── 일정 변경 신청 ──
  async function loadScheduleRequests() {
    setScrLoading(true);
    try {
      var { data } = await sb.from('schedule_change_requests').select('*').order('target_date', { ascending: true });
      setScrRequests(data || []);
    } catch (e) {
      console.error('일정 신청 로드 실패:', e);
      setScrRequests([]);
    } finally {
      setScrLoading(false);
    }
  }
  function scrPublicUrl(path) {
    if (!path) return '';
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    return data?.publicUrl || '';
  }
  function openScrForm(dateStr) {
    setScrSelectedDate(dateStr);
    setScrDraft({ reason: '', file: null });
    setScrFormOpen(true);
  }
  function closeScrForm() {
    setScrFormOpen(false);
    setScrSelectedDate(null);
    setScrDraft({ reason: '', file: null });
  }
  async function submitScheduleRequest() {
    if (!teacherInfo) { alert('선생님 정보가 없습니다.'); return; }
    if (!scrSelectedDate) { alert('날짜가 선택되지 않았습니다.'); return; }
    if (!scrDraft.reason.trim()) { alert('변경 사유를 입력해 주세요.'); return; }
    setScrSubmitting(true);
    try {
      var filePath = null, fileName = null, fileSize = null, mimeType = null;
      if (scrDraft.file) {
        var ext = scrDraft.file.name.split('.').pop() || 'bin';
        filePath = 'schedule/' + (teacherInfo.id || 'tx') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        var up = await sb.storage.from('attachments').upload(filePath, scrDraft.file, { cacheControl:'3600', upsert:false });
        if (up.error) throw up.error;
        fileName = scrDraft.file.name;
        fileSize = scrDraft.file.size;
        mimeType = scrDraft.file.type || null;
      }
      var insertRow = {
        teacher_id: (user && user.id) || null, // schedule_change_requests.teacher_id 는 students(id) 참조
        teacher_name: teacherInfo.name || user?.name || '선생님',
        target_date: scrSelectedDate,
        reason: scrDraft.reason.trim(),
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
      };
      var { error } = await sb.from('schedule_change_requests').insert(insertRow);
      if (error) throw error;
      alert('신청이 제출되었습니다.');
      closeScrForm();
      await loadScheduleRequests();
    } catch (e) {
      alert('제출 실패: ' + (e.message || e));
    } finally {
      setScrSubmitting(false);
    }
  }
  async function deleteScheduleRequest(req) {
    if (!confirm('이 신청을 취소하시겠습니까?')) return;
    try {
      if (req.file_path) {
        try { await sb.storage.from('attachments').remove([req.file_path]); } catch(e) {}
      }
      await sb.from('schedule_change_requests').delete().eq('id', req.id);
      await loadScheduleRequests();
    } catch (e) { alert('취소 실패: ' + (e.message || e)); }
  }
  function scrFormatBytes(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    if (v < 1024*1024) return (v/1024).toFixed(1) + ' KB';
    return (v/1024/1024).toFixed(1) + ' MB';
  }

  // 학사일정
  async function loadAcademicSchedules() {
    setAcademicLoading(true);
    try {
      var { data } = await sb.from('academic_schedules').select('*').order('start_date', { ascending: true });
      setAcademicList(data || []);
    } catch (e) {
      console.error('학사일정 로드 실패:', e);
      setAcademicList([]);
    } finally {
      setAcademicLoading(false);
    }
  }
  function openAcademicForm(prefilledDate) {
    setAcademicDraft({ title:'', school:'', category:'vacation', start_date: prefilledDate || '', end_date: prefilledDate || '', description:'' });
    setAcademicFormOpen(true);
  }
  function closeAcademicForm() {
    setAcademicFormOpen(false);
    setAcademicDraft({ title:'', school:'', category:'vacation', start_date:'', end_date:'', description:'' });
  }
  async function submitAcademicSchedule() {
    var d = academicDraft;
    var cat = d.category || 'other';
    if (cat === 'other' && !d.title.trim()) { alert('제목을 입력해 주세요.'); return; }
    var titleVal = (cat === 'other') ? d.title.trim() : (d.title.trim() || academicCategoryLabel(cat));
    if (!d.start_date) { alert('시작일을 입력해 주세요.'); return; }
    if (!d.end_date) { alert('종료일을 입력해 주세요.'); return; }
    if (d.end_date < d.start_date) { alert('종료일이 시작일보다 빠를 수 없습니다.'); return; }
    setAcademicSubmitting(true);
    try {
      var { error } = await sb.from('academic_schedules').insert({
        title: titleVal,
        school: d.school.trim() || null,
        category: cat,
        start_date: d.start_date,
        end_date: d.end_date,
        description: d.description.trim() || null,
        // created_by 는 students(id) 참조 — teacherInfo.id(teachers 테이블)와 id 공간이 달라 넣지 않음. 작성자는 creator_name 으로.
        created_by: null,
        creator_name: teacherInfo?.name || user?.name || '선생님',
      });
      if (error) throw error;
      alert('학사일정이 등록되었습니다.');
      closeAcademicForm();
      await loadAcademicSchedules();
    } catch (e) {
      alert('등록 실패: ' + (e.message || e));
    } finally {
      setAcademicSubmitting(false);
    }
  }
  async function deleteAcademicSchedule(item) {
    if (!confirm('이 학사일정을 삭제하시겠습니까?')) return;
    try {
      await sb.from('academic_schedules').delete().eq('id', item.id);
      await loadAcademicSchedules();
    } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
  }
  function academicCategoryLabel(c) {
    if (c === 'vacation') return '방학';
    if (c === 'exam') return '시험기간';
    return '기타';
  }
  function academicCategoryColor(c) {
    if (c === 'vacation') return '#1d4ed8'; // 파랑
    if (c === 'exam') return '#c87000';     // 주황
    return '#6b7280';                       // 회색
  }

  // ── 마이페이지 ──
  async function loadMyProfile() {
    if (!user) return;
    var { data } = await sb.from('students').select('*').eq('email', user.email).maybeSingle();
    var t = teacherInfo || {};
    setProfileDraft({
      name: (data && data.name) || t.name || user.name || '',
      phone: (data && data.phone) || t.phone || '',
      email: (data && data.email) || t.email || user.email || '',
      school: (data && data.school) || t.school || '',
      grade: (data && data.grade) || t.grade || '',
      address: (data && data.address) || t.address || '',
      _row_id: data ? data.id : null,
    });
  }
  async function saveMyProfile() {
    if (!profileDraft || !user) return;
    setSavingProfile(true);
    var updates = {
      name: (profileDraft.name||'').trim(),
      phone: (profileDraft.phone||'').trim(),
      school: (profileDraft.school||'').trim(),
      grade: (profileDraft.grade||'').trim(),
      address: (profileDraft.address||'').trim(),
    };
    if (profileDraft._row_id) {
      var { error } = await sb.from('students').update(updates).eq('id', profileDraft._row_id);
      if (error) { setSavingProfile(false); alert('저장 실패: ' + error.message); return; }
    }
    if (teacherInfo && teacherInfo.id) {
      var t = await sb.from('teachers').update({ name: updates.name, phone: updates.phone }).eq('id', teacherInfo.id);
      // 일부 컬럼이 없을 수 있어 에러는 silent
    }
    setSavingProfile(false);
    alert('정보가 저장되었습니다.');
  }
  async function withdrawMyAccount() {
    if (!profileDraft) { alert('계정 정보를 불러올 수 없습니다.'); return; }
    var displayName = profileDraft.name || (user && user.name) || '';
    var name = prompt('정말 탈퇴하시겠습니까?\n탈퇴를 진행하시려면 본인 이름 "' + displayName + '"을(를) 입력해 주세요.\n탈퇴 후에는 로그인할 수 없으며 담당 강좌·기록 등은 비활성화 처리됩니다.');
    if (name == null) return;
    if (String(name).trim() !== String(displayName).trim()) { alert('이름이 일치하지 않습니다. 탈퇴가 취소되었습니다.'); return; }
    if (profileDraft._row_id) {
      var { error } = await sb.from('students').update({ is_active:false, withdrawn_at: new Date().toISOString() }).eq('id', profileDraft._row_id);
      if (error) { alert('탈퇴 처리 실패: ' + error.message); return; }
    }
    // teachers 테이블에도 마킹 시도 (컬럼 없으면 silent)
    if (teacherInfo && teacherInfo.id) {
      try { await sb.from('teachers').update({ is_active:false }).eq('id', teacherInfo.id); } catch(e) {}
    }
    alert('탈퇴가 완료되었습니다.');
    window.B2Utils.clearAuthStorage();
    window.location.href = '/';
  }
  async function changeMyPassword() {
    if (!profileDraft || !profileDraft._row_id) { alert('계정 정보를 찾을 수 없습니다.'); return; }
    if (!pwDraft.current || !pwDraft.next) { alert('현재/새 비밀번호를 모두 입력해 주세요.'); return; }
    if (pwDraft.next !== pwDraft.confirm) { alert('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    if (pwDraft.next.length < 6) { alert('새 비밀번호는 6자 이상이어야 합니다.'); return; }
    var emailForAuth = profileDraft.email || user?.email;
    if (!emailForAuth) { alert('이메일 정보를 찾을 수 없습니다.'); return; }
    // 현재 비밀번호 검증 — 같은 이메일로 재로그인 시도
    var verify = await sb.auth.signInWithPassword({ email: emailForAuth, password: pwDraft.current });
    if (verify.error) { alert('현재 비밀번호가 맞지 않습니다.'); return; }
    var upd = await sb.auth.updateUser({ password: pwDraft.next });
    if (upd.error) { alert('변경 실패: ' + upd.error.message); return; }
    alert('비밀번호가 변경되었습니다.');
    setPwDraft({ current:'', next:'', confirm:'' });
  }

  async function loadNotificationLogs() {
    var { data } = await sb.from('notification_logs').select('*').order('created_at', { ascending:false }).limit(200);
    setNotificationLogs(data || []);
  }

  async function sendKakaoNotifications(items) {
    // items: [{ student_id, parent_phone, message_content, test_score_id }]
    if (!items || items.length === 0) return;
    var rows = items.map(function(it){
      return {
        student_id: it.student_id || null,
        parent_phone: it.parent_phone || null,
        message_content: it.message_content || '',
        test_score_id: it.test_score_id || null,
        sent_by: teacherInfo?.id || null,
        sent_at: null,
        status: 'pending',
      };
    });
    var { error } = await sb.from('notification_logs').insert(rows);
    if (error) { alert('발송 이력 저장 실패: ' + error.message); return; }
    alert('알림톡 연동 준비 중입니다.\n발송 이력은 저장되었습니다 (상태: 미발송).');
    await loadNotificationLogs();
  }

  async function loadScoreAnalysis() {
    setAnalysisLoading(true);
    const { data, error } = await sb
      .from("test_scores")
      .select("*, students!test_scores_student_id_fkey(name, grade), teachers!test_scores_teacher_id_fkey(name)")
      .order("test_date", { ascending: false });
    if (error) { console.error("loadScoreAnalysis error:", error.message || error); setScoreAnalysis([]); setAnalysisLoading(false); return; }
    setScoreAnalysis(data || []);
    const { data: links } = await sb.from("class_students").select("class_id, student_id");
    if (links) {
      const grouped = {};
      links.forEach(function(row){
        if (!grouped[row.class_id]) grouped[row.class_id] = [];
        grouped[row.class_id].push(row.student_id);
      });
      setAnalysisClassStudents(grouped);
    }
    const { data: stdList } = await sb.from("students").select("id, name, grade").eq("role", "student");
    if (stdList) {
      const m = {};
      stdList.forEach(function(s){ m[s.id] = s; });
      setAnalysisAllStudents(m);
    }
    setAnalysisLoading(false);
    await loadNotificationLogs();
  }

  async function loadScoreHistory() {
    if (!teacherInfo) return;
    setLoadingStats(true);
    const { data, error } = await sb
      .from("test_scores")
      .select("*, students(name)")
      .eq("teacher_id", teacherInfo.id)
      .order("test_date", { ascending: false });
    setLoadingStats(false);
    if (error) { console.error("loadScoreHistory error:", error); setScoreHistory([]); return; }
    setScoreHistory(data || []);
  }

  const selectedCount = selectedStudentIds.length;
  const teacherAssignments = getTeacherAssignments();
  const availableClassCards = classes || [];

  const cardStyle = {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  };

  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  };

  // ── 버튼 크기 표준 (화면 크기에 따라 반응형) ──────────────
  // 기본(주요 동작) 버튼 / 보조(밝은) 버튼 — 페이지 어디서나 같은 크기
  const buttonStyle = {
    border: "1px solid transparent",
    borderRadius: "10px",
    padding: teacherIsMobile ? "9px 14px" : "10px 18px",
    fontSize: teacherIsMobile ? "13px" : "14px",
    fontWeight: "700",
    fontFamily: "Manrope, sans-serif",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    cursor: "pointer",
    background: "#E60012",
    color: "white",
  };

  const lightButtonStyle = {
    ...buttonStyle,
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  };

  // 목록 행 안의 작은 동작 버튼(수정/삭제/마감 등) — 색만 바꿔 쓰고 크기는 통일
  const smallButtonStyle = {
    border: "1px solid transparent",
    borderRadius: "8px",
    padding: teacherIsMobile ? "5px 10px" : "6px 11px",
    fontSize: "12px",
    fontWeight: "700",
    fontFamily: "Manrope, sans-serif",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    cursor: "pointer",
    background: "#fff",
    color: "#374151",
  };
  const smallLightButtonStyle = { ...smallButtonStyle, background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" };
  const smallDangerButtonStyle = { ...smallButtonStyle, background: "#fff", color: "#c82014", border: "1px solid #c82014" };
  const smallPrimaryButtonStyle = { ...smallButtonStyle, background: "#fff", color: "#E60012", border: "1px solid #E60012" };

  // 시험 종류 라벨
  function examKindLabel(k) {
    return k === 'homework' ? '숙제' : k === 'weekly' ? '주간테스트' : k === 'monthly' ? '월말테스트' : k === 'level' ? '레벨테스트' : '반 시험';
  }
  function examKindBadgeStyle(k) {
    var c = k === 'homework' ? { bg:'#fef3c7', fg:'#92400e' } : k === 'weekly' ? { bg:'#dbeafe', fg:'#1d4ed8' } : k === 'monthly' ? { bg:'#ede9fe', fg:'#6d28d9' } : k === 'level' ? { bg:'#dcfce7', fg:'#15803d' } : { bg:'#e5e7eb', fg:'#374151' };
    return { fontSize:'11px', fontWeight:'800', background:c.bg, color:c.fg, borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' };
  }

  // 4탭 구조 렌더링
  const TABS = [
    { id: "classes",  label: "담당 클래스" },
    { id: "course",   label: "강좌 개설" },
    { id: "lecture",  label: "강의 추가" },
    { id: "tests",    label: "테스트" },
    { id: "vocab",    label: "단어장" },
    { id: "scores",   label: "성적" },
    { id: "studyviews", label: "학습 현황" },
    { id: "files",    label: "자료실" },
    { id: "schedule", label: "학원 일정" },
    { id: "mypage",   label: "마이페이지" },
  ];

  const TAB_GROUPS = [
    { id: 'class',   label: '수업 관리', color:'#1d4ed8', tabs:['classes','tests','vocab','scores','studyviews','course','lecture'] },
    { id: 'academy', label: '학원',      color:'#c87000', tabs:['schedule','files'] },
    { id: 'me',      label: '내 정보',   color:'#1A1A1A', tabs:['mypage'] },
  ];

  function loadOnTabClick(id) {
    if (id === "notes") loadNotes();
    if (id === "scores") loadScoreAnalysis();
    if (id === "files") loadMaterials();
    if (id === "schedule") { loadScheduleRequests(); loadAcademicSchedules(); }
    if (id === "mypage") loadMyProfile();
    if (id === "studyviews") loadStudyViews();
    if (id === "tests" && selectedClass?.id) loadClassExams(selectedClass.id);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* 헤더 */}
      <div style={{ background: "#1A1A1A", padding: "20px 40px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "#fff", fontFamily: "Manrope, sans-serif" }}>선생님 페이지</h1>
        <p style={{ marginTop: "4px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "Manrope, sans-serif" }}>{teacherInfo?.name || user?.name} 선생님</p>
      </div>

      {/* 페이지 진입 시 상단 브레드크럼 */}
      {teacherView !== "dashboard" && (
        <div style={{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={() => setTeacherView('dashboard')} style={{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif' }}>← 선생님 홈</button>
          <span style={{ fontSize:'13px', color:'#9ca3af' }}>·</span>
          <span style={{ fontSize:'14px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' }}>{(TABS.find(t => t.id === teacherView) || {}).label || ''}</span>
        </div>
      )}

      <div style={{ padding: "24px 16px", maxWidth: "1100px", margin: "0 auto" }}>
      {loading ? <div style={{ color: "#6b7280" }}>불러오는 중...</div> : (<>

      {/* 대시보드 (홈) - 그룹별 카드 그리드 */}
      {teacherView === "dashboard" && (
        <div>
          {TAB_GROUPS.map(g => (
            <div key={g.id} style={{ marginBottom: '28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                <div style={{ width:'4px', height:'18px', background: g.color, borderRadius:'2px' }} />
                <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#1A1A1A', margin:0, fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em' }}>{g.label}</h2>
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{g.tabs.length}개</span>
              </div>
              <div style={teacherIsMobile ? { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px' } : { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'10px' }}>
                {g.tabs.map(tid => {
                  const t = TABS.find(x => x.id === tid);
                  if (!t) return null;
                  const pcStyle = { padding:'16px 18px', fontSize:'15px', display:'flex', alignItems:'center', textAlign:'left', minHeight:'52px' };
                  const mobileStyle = { padding:'14px', fontSize:'14px', display:'block', textAlign:'center' };
                  return (
                    <button key={tid} onClick={() => { setTeacherView(tid); loadOnTabClick(tid); }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'; }}
                      style={Object.assign({
                        background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px',
                        cursor:'pointer', fontFamily:'Manrope, sans-serif',
                        fontWeight:'700', color:'#111827',
                        letterSpacing:'-0.01em', transition:'border-color 0.15s, box-shadow 0.15s',
                        boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'
                      }, teacherIsMobile ? mobileStyle : pcStyle)}>
                      {t.label}
                      {(function(){
                        // 카드 숫자 배지 — 담당 클래스 수 / 내가 만든 강좌 수 (대시보드에서 한눈에)
                        var cnt = tid === 'classes' ? (classes || []).length : tid === 'course' ? (teacherCourses || []).length : 0;
                        return cnt > 0 ? <span style={{ marginLeft:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'18px', height:'18px', padding:'0 5px', borderRadius:'999px', background:'#1A1A1A', color:'#fff', fontSize:'11px', fontWeight:'800', verticalAlign:'middle' }}>{String(cnt)}</span> : null;
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 탭1: 담당 클래스 ── */}
      {teacherView === "classes" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "10px" }}>담당 클래스</h2>
          <p style={{ marginTop: 0, marginBottom: "18px", color: "#6b7280", fontSize: "14px" }}>
            클래스를 선택하면 해당 학생들의 성적 등록이 가능합니다.
          </p>
          {availableClassCards.length === 0 ? (
            <div style={{ color: "#6b7280" }}>담당 클래스가 없습니다. 관리자에게 배정을 요청해 주세요.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              {availableClassCards.map(cls => {
                const active = String(selectedClass?.id||"") === String(cls.id);
                return (
                  <button key={cls.id} onClick={() => selectClass(cls)} style={{ textAlign: "left", border: active ? "2px solid #E60012" : "1px solid #e5e7eb", background: active ? "#f0fdf4" : "white", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                    <strong style={{ display: "block", fontSize: "15px", color: "#111827", fontFamily: "Manrope, sans-serif" }}>{cls.name}</strong>
                  </button>
                );
              })}
            </div>
          )}

          {/* 선택된 클래스의 학생 목록 — 카드 클릭 시 상세 */}
          {selectedClass && students.length > 0 && !selectedStudent && (
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "6px", color: "#1A1A1A", fontFamily: "Manrope, sans-serif" }}>
                {selectedClass.name} · {students.length}명
              </h3>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px", fontFamily: "Manrope, sans-serif" }}>학생을 클릭하면 수강 강좌, 시험 결과, 단어시험, 특이사항을 한 번에 볼 수 있어요.</p>
              <div style={{ display: "grid", gridTemplateColumns: teacherIsMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                {students.map(s => {
                  var subjArr = Array.isArray(s.subjects) ? s.subjects.filter(Boolean) : [];
                  var grade = s.grade || '';
                  return (
                    <button key={s.id} onClick={() => loadStudentDetail(s)} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "14px", transition: "all 0.15s", fontFamily: "Manrope, sans-serif", minHeight: "72px" }} onMouseEnter={(e)=>{ e.currentTarget.style.borderColor='#E60012'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'; }} onMouseLeave={(e)=>{ e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#FFEBED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: grade.length > 2 ? "12px" : "14px", fontWeight: "800", color: "#E60012", flexShrink: 0, lineHeight: "1" }}>{grade || "—"}</div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "16px", fontWeight: "800", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                        {subjArr.length > 0 && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {subjArr.map((sub, i) => (
                              <span key={i} style={{ fontSize: "11px", fontWeight: "700", background: "#f3f4f6", color: "#1A1A1A", borderRadius: "4px", padding: "2px 6px" }}>{sub}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ color: "#d1d5db", fontSize: "20px", flexShrink: 0 }}>›</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {selectedClass && students.length === 0 && (
            <div style={{ color: "#6b7280", fontSize: "14px", marginTop: "12px" }}>이 클래스에 등록된 학생이 없습니다.</div>
          )}

          {/* 학생 상세 — 수강·시험·단어시험·특이사항 통합 뷰 */}
          {selectedStudent && (
            <div>
              <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }} style={{ background: "none", border: "none", color: "#E60012", cursor: "pointer", fontSize: "13px", fontWeight: "800", fontFamily: "Manrope, sans-serif", padding: 0, marginBottom: "14px" }}>← {selectedClass.name} 학생 목록</button>

              {/* 학생 기본 정보 카드 */}
              <div style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #3a0007 100%)", borderRadius: "14px", padding: "20px", color: "#fff", marginBottom: "14px", fontFamily: "Manrope, sans-serif" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: selectedStudent.grade ? "16px" : "22px", fontWeight: "800" }}>{selectedStudent.grade || selectedStudent.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "20px", fontWeight: "800" }}>{selectedStudent.name}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: "0.04em" }}>학생 연락처</div>
                    {selectedStudent.phone
                      ? <a href={"tel:" + selectedStudent.phone} style={{ fontSize: "13px", marginTop: "2px", color: "#fff", fontWeight: "700", textDecoration: "none", display: "block" }}>{B2Utils.formatPhone(selectedStudent.phone)}</a>
                      : <div style={{ fontSize: "12px", marginTop: "2px", color: "rgba(255,255,255,0.5)" }}>—</div>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: "700", letterSpacing: "0.04em" }}>학부모 연락처</div>
                    {selectedStudent.parent_phone
                      ? <a href={"tel:" + selectedStudent.parent_phone} style={{ fontSize: "13px", marginTop: "2px", color: "#fff", fontWeight: "700", textDecoration: "none", display: "block" }}>{B2Utils.formatPhone(selectedStudent.parent_phone)}</a>
                      : <div style={{ fontSize: "12px", marginTop: "2px", color: "rgba(255,255,255,0.5)" }}>—</div>
                    }
                  </div>
                </div>
              </div>

              {studentDetailLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>불러오는 중...</div>
              ) : studentDetail ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* 수강 강좌 */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>수강 강좌 ({studentDetail.courses.length})</div>
                    {studentDetail.courses.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>수강 중인 강좌가 없습니다.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {studentDetail.courses.map(c => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", fontFamily: "Manrope, sans-serif" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A1A1A" }}>{c.title}</span>
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>{c.subject_name || ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 시험 점수 */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>시험 점수 (최근 {Math.min(10, studentDetail.scores.length)}건 / 총 {studentDetail.scores.length}건)</div>
                    {studentDetail.scores.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>등록된 시험 점수가 없습니다.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {studentDetail.scores.slice(0, 10).map(s => {
                          var pct = s.total ? Math.round((Number(s.score) / Number(s.total)) * 100) : Number(s.score);
                          var color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#c87000' : '#c82014';
                          return (
                            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", fontFamily: "Manrope, sans-serif" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.test_name || s.test_type || "시험"}</div>
                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{[s.subject, s.test_date].filter(Boolean).join(" · ")}</div>
                              </div>
                              <div style={{ fontSize: "16px", fontWeight: "800", color: color, marginLeft: "8px", flexShrink: 0 }}>{s.score}{s.total ? `/${s.total}` : ""}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 단어시험 결과 */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>단어시험 (최근 {Math.min(10, studentDetail.vocabAttempts.length)}건 / 총 {studentDetail.vocabAttempts.length}건)</div>
                    {studentDetail.vocabAttempts.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>응시한 단어시험이 없습니다.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {studentDetail.vocabAttempts.slice(0, 10).map(a => {
                          var pct = Math.round(a.percentage || 0);
                          var color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#c87000' : '#c82014';
                          var t = a.vocab_tests || {};
                          return (
                            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", fontFamily: "Manrope, sans-serif" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title || "시험"}</div>
                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{a.score}/{a.total} · {a.attempt_number}회차 · {String(a.submitted_at || "").slice(0,10)}</div>
                              </div>
                              <div style={{ fontSize: "16px", fontWeight: "800", color: color, marginLeft: "8px", flexShrink: 0 }}>{pct}점</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 특이사항 + 메모 등록 */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>특이사항 ({studentDetail.notes.length})</div>
                    {/* 메모 등록 */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <select value={newNoteType} onChange={e => setNewNoteType(e.target.value)} style={{ padding: "8px 10px", border: "1px solid #d6dbde", borderRadius: "6px", fontSize: "12px", fontFamily: "Manrope, sans-serif", flexShrink: 0 }}>
                        <option value="특이사항">특이사항</option>
                        <option value="상담">상담</option>
                        <option value="수업">수업</option>
                        <option value="기타">기타</option>
                      </select>
                      <input type="text" value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="새 메모 입력 (Enter로 등록)" onKeyDown={(e) => { if (e.key === 'Enter' && !savingNote && newNoteContent.trim()) addStudentNote(); }} style={{ flex: 1, padding: "8px 10px", border: "1px solid #d6dbde", borderRadius: "6px", fontSize: "13px", fontFamily: "Manrope, sans-serif", minWidth: "120px" }} />
                      <button onClick={addStudentNote} disabled={savingNote || !newNoteContent.trim()} style={{ ...smallButtonStyle, background: (savingNote || !newNoteContent.trim()) ? "#9ca3af" : "#E60012", color: "#fff", cursor: (savingNote || !newNoteContent.trim()) ? "not-allowed" : "pointer", flexShrink: 0 }}>{savingNote ? '저장 중...' : '+ 추가'}</button>
                    </div>
                    {studentDetail.notes.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>등록된 특이사항이 없습니다.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {studentDetail.notes.slice(0, 10).map(n => (
                          <div key={n.id} style={{ padding: "10px", background: "#fffbeb", borderLeft: "3px solid #f59e0b", borderRadius: "6px", fontFamily: "Manrope, sans-serif" }}>
                            <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", marginBottom: "4px" }}>{n.note_type || '특이사항'} · {n.note_date}</div>
                            <div style={{ fontSize: "13px", color: "#1A1A1A", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{n.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 출결 통계 */}
                  <div style={cardStyle}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#1A1A1A", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>출결 (최근 30일)</div>
                    {studentDetail.attendance.total === 0 ? (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>최근 출결 기록이 없습니다.</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                        {[['present','출석','#16a34a'], ['late','지각','#c87000'], ['absent','결석','#c82014'], ['excused','사유','#6b7280']].map(([k, label, color]) => (
                          <div key={k} style={{ padding: "8px", background: "#f8fafc", borderRadius: "6px" }}>
                            <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700" }}>{label}</div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: color, marginTop: "2px" }}>{studentDetail.attendance[k] || 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ── 테스트 탭: 종류 버튼 (항상 맨 위) ── */}
      {teacherView === "tests" && (
        <div style={{ ...cardStyle, marginBottom: "16px" }}>
          <h2 style={{ marginTop:0, marginBottom:'4px' }}>테스트</h2>
          <p style={{ marginTop:0, marginBottom:'12px', color:'#6b7280', fontSize:'14px' }}>{selectedClass ? (selectedClass.name + ' — 만들 테스트 종류를 골라주세요.') : '만들 테스트 종류를 먼저 골라주세요. 종류를 고르면 어느 반에 발행할지 정합니다.'}</p>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {[['homework','숙제'],['weekly','주간테스트'],['monthly','월말테스트'],['level','레벨테스트']].map(([k,l]) => {
              const c = examKindBadgeStyle(k);
              const active = !selectedClass && pendingTestKind === k;
              return <button key={k} onClick={() => { if (selectedClass) openExamForm(k); else setPendingTestKind(active ? null : k); }} style={{ flex:'1 1 130px', minWidth:'120px', background: active ? c.color : '#fff', color: active ? '#fff' : c.color, border:'1.5px solid '+c.color, borderRadius:'10px', padding:'13px 14px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>+ {l}</button>;
            })}
          </div>
        </div>
      )}

      {/* ── 반 선택 카드 (테스트 탭에서 반 미선택 시) ── */}
      {teacherView === "tests" && !selectedClass && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0 }}>반 선택</h2>
          <p style={{ marginTop: 0, marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>{pendingTestKind ? (examKindLabel(pendingTestKind) + '를 발행할 반을 골라주세요.') : '발행된 테스트를 보거나 새 테스트를 발행할 반을 골라주세요. (위에서 종류를 먼저 골라도 됩니다.)'}</p>
          {availableClassCards.length === 0 ? (
            <div style={{ color: "#6b7280" }}>담당 클래스가 없습니다. 관리자에게 배정을 요청해 주세요.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
              {availableClassCards.map(cls => (
                <button key={cls.id} onClick={() => { selectClass(cls); setTimeout(() => loadClassExams(cls.id), 0); if (pendingTestKind) { var pk = pendingTestKind; setPendingTestKind(null); setTimeout(() => openExamForm(pk), 10); } }} style={{ textAlign:'left', border:'1px solid #e5e7eb', background:'white', borderRadius:'12px', padding:'16px', cursor:'pointer' }}>
                  <strong style={{ display:'block', fontSize:'15px', color:'#111827', fontFamily:'Manrope, sans-serif' }}>{cls.name}</strong>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 발행된 테스트 목록 (테스트 탭, 반 선택 시) ── */}
      {teacherView === "tests" && selectedClass && (() => {
        return (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'8px' }}>
            <h2 style={{ margin:0 }}>{selectedClass.name} — 발행된 테스트</h2>
            <button onClick={() => { setSelectedClass(null); setSelectedClassId(""); setPendingTestKind(null); }} style={smallLightButtonStyle}>다른 반</button>
          </div>

          {examLoading ? (
            <div style={{ color:'#9ca3af', fontSize:'13px' }}>불러오는 중...</div>
          ) : examList.length === 0 ? (
            <div style={{ color:'#9ca3af', fontSize:'13px' }}>아직 발행된 테스트가 없습니다.</div>
          ) : (
            <div style={{ borderTop:'1px solid #eef2f7' }}>
              {examList.map(ex => {
                const subs = examSubmissionsByExam[ex.id] || [];
                const totalStudents = students.length;
                const submittedCount = subs.length;
                const imgs = Array.isArray(ex.image_paths) ? ex.image_paths : [];
                const ebS = { fontSize:'11px', fontWeight:'700', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap', border:'1px solid' };
                return (
                  <div key={ex.id} style={{ borderBottom:'1px solid #eef2f7', padding:'8px 2px', fontFamily:'Manrope, sans-serif' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <span style={examKindBadgeStyle(ex.kind || 'class')}>{examKindLabel(ex.kind || 'class')}</span>
                      <span style={{ fontSize:'10px', fontWeight:'800', background: ex.status==='open' ? '#dcfce7' : '#e5e7eb', color: ex.status==='open' ? '#15803d' : '#6b7280', borderRadius:'4px', padding:'1px 6px' }}>{ex.status==='open' ? '응시가능' : '마감'}</span>
                      {ex.analysis && <span style={{ fontSize:'10px', fontWeight:'800', background:'#dbeafe', color:'#1d4ed8', borderRadius:'4px', padding:'1px 6px' }}>분석</span>}
                      {ex.subject && <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151' }}>{ex.subject}</span>}
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827', flex:1, minWidth:'110px' }}>{ex.title}</span>
                      <span style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' }}>제출 <strong style={{ color: submittedCount>0 ? '#E60012' : '#9ca3af' }}>{submittedCount}</strong>/{totalStudents}</span>
                      <span style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                        <button onClick={() => openExamFormForEdit(ex)} style={{ ...ebS, color:'#E60012', borderColor:'#E60012', background:'#fff' }}>수정</button>
                        <button onClick={() => toggleExamStatus(ex)} style={{ ...ebS, color:'#374151', borderColor:'#d1d5db', background:'#fff' }}>{ex.status==='open' ? '마감' : '재오픈'}</button>
                        <button onClick={() => deleteExam(ex)} style={{ ...ebS, color:'#c82014', borderColor:'#f3c5c0', background:'#fff' }}>삭제</button>
                      </span>
                    </div>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'2px' }}>
                      {ex.test_date ? '시험일 ' + ex.test_date + ' · ' : ''}객관식 {ex.question_count}문항{(ex.text_question_count || 0) > 0 ? ' · 서술형 ' + ex.text_question_count : (ex.allow_text_answer ? ' · 서술형 1' : '')}{ex.allow_audio_answer ? ' · 녹음' : ''}{ex.time_limit_minutes > 0 ? ' · 제한 ' + ex.time_limit_minutes + '분' : ''}{imgs.length ? ' · 이미지 ' + imgs.length + '장' : ''}{ex.description ? ' · ' + String(ex.description).replace(/\n/g, ' ') : ''}
                    </div>
                    {subs.length > 0 && (
                      <details style={{ marginTop:'6px' }}>
                        <summary style={{ cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' }}>제출자 보기 ({subs.length}명)</summary>
                        <div style={{ marginTop:'8px', display:'flex', flexDirection:'column', gap:'6px' }}>
                          {subs.map(s => (
                            <div key={s.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'8px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif' }}>
                              <div style={{ fontWeight:'700', color:'#111827' }}>{s.student_name || '-'} · {String(s.submitted_at||'').slice(0,16).replace('T',' ')}</div>
                              {ex.question_count > 0 && s.answers && Object.keys(s.answers).length > 0 && (() => {
                                var ak = (ex.answer_key && typeof ex.answer_key === 'object') ? ex.answer_key : {};
                                var akKeys = Object.keys(ak);
                                var hasKey = akKeys.length > 0;
                                var norm = function(v){ return String(v == null ? '' : v).split(',').map(function(x){ return x.trim(); }).filter(Boolean).sort().join(','); };
                                var correct = 0;
                                if (hasKey) akKeys.forEach(function(k){ var na = norm(s.answers[k]); if (na && na === norm(ak[k])) correct++; });
                                return (
                                  <div style={{ marginTop:'4px', color:'#374151', fontSize:'11px' }}>
                                    객관식: {Object.keys(s.answers).sort((a,b)=>Number(a)-Number(b)).map(k => {
                                      var my = s.answers[k];
                                      if (!hasKey || ak[k] == null) return k + '. ' + my;
                                      var ok = norm(my) === norm(ak[k]);
                                      return k + '. ' + my + (ok ? ' (정답)' : ' (오답·정답' + ak[k] + ')');
                                    }).join(' / ')}
                                    {hasKey && <span style={{ marginLeft:'8px', fontWeight:'800', color:'#E60012' }}>자동채점: {correct}/{akKeys.length}</span>}
                                  </div>
                                );
                              })()}
                              {(() => {
                                var ta = s.text_answers && typeof s.text_answers === 'object' ? s.text_answers : null;
                                var hasMulti = ta && Object.keys(ta).length > 0;
                                if (hasMulti) {
                                  return Object.keys(ta).sort((a,b)=>Number(a)-Number(b)).map(function(k){
                                    return <div key={k} style={{ marginTop:'4px', color:'#374151', fontSize:'11px', whiteSpace:'pre-line' }}>서술형 {k}. {ta[k]}</div>;
                                  });
                                }
                                if (s.text_answer) {
                                  return <div style={{ marginTop:'4px', color:'#374151', fontSize:'11px', whiteSpace:'pre-line' }}>서술형: {s.text_answer}</div>;
                                }
                                return null;
                              })()}
                              {/* AI 약점 분석 (시험 문항 분석이 된 경우만) */}
                              {ex.analysis && (
                                <div style={{ marginTop:'8px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                  <button onClick={() => runStudentAnalysis(s.id, !!s.ai_analysis)} disabled={analyzingStudentId === s.id} style={{ background: analyzingStudentId === s.id ? '#9ca3af' : '#15803d', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:'700', cursor: analyzingStudentId === s.id ? 'wait' : 'pointer', fontFamily:'Manrope, sans-serif' }}>{analyzingStudentId === s.id ? 'AI 분석 중... (수십 초)' : (s.ai_analysis ? 'AI 약점 재분석' : 'AI 약점 분석')}</button>
                                  {s.ai_analysis && <button onClick={() => window.B2Utils.printStudentReport(s.ai_analysis, s.student_name, ex.title)} style={{ background:'#fff', color:'#15803d', border:'1px solid #15803d', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>리포트 인쇄·PDF</button>}
                                </div>
                              )}
                              {s.ai_analysis && renderStudentAnalysis(s.ai_analysis)}
                              {/* 채점 폼 */}
                              {window.GradingForm && React.createElement(window.GradingForm, { exam: ex, submission: s, onSave: async (sid, payload) => {
                                payload.graded_at = new Date().toISOString();
                                try { await sb.from('exam_submissions').update(payload).eq('id', sid); try { await window.B2Utils.syncExamScore(ex.id, sid); } catch (e2) {} alert('채점이 저장되었습니다.'); await loadClassExams(selectedClass?.id); } catch (e) { alert('저장 실패: ' + (e.message || e)); }
                              } })}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 시험지 발행 모달 */}
          {examFormOpen && (
            <div onClick={closeExamForm} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
              <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <h3 style={{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 }}>{editingExamId ? (examKindLabel(examDraft.kind) + ' 수정') : ('새 ' + examKindLabel(examDraft.kind) + ' 발행')} — {selectedClass?.name}</h3>
                  <button onClick={closeExamForm} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>테스트 종류 *</label>
                <select value={examDraft.kind || 'weekly'} onChange={e => setExamDraft({ ...examDraft, kind: e.target.value })} style={{ ...inputStyle, marginBottom: examDraft.kind === 'level' ? '6px' : '14px', cursor:'pointer' }}>
                  {examDraft.kind === 'class' && <option value="class">반 시험 (일반)</option>}
                  <option value="homework">숙제</option>
                  <option value="weekly">주간테스트</option>
                  <option value="monthly">월말테스트</option>
                  <option value="level">레벨테스트</option>
                </select>
                {examDraft.kind === 'level' && <div style={{ fontSize:'11px', color:'#0f766e', background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:'8px', padding:'8px 10px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>이 레벨테스트는 <strong>이 반 학생들이 바로 응시</strong>합니다 (신청 절차 없음). 신입생 배치용 레벨테스트는 관리자가 따로 발행합니다.</div>}

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>제목 *</label>
                <input value={examDraft.title} onChange={e => setExamDraft({ ...examDraft, title: e.target.value })} placeholder="예: 1학기 중간고사 영어" style={{ ...inputStyle, marginBottom:'14px' }} />

                <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                  <div style={{ flex:1 }}>
                    {(function(){
                      var subs = (teacherInfo && Array.isArray(teacherInfo.subjects)) ? teacherInfo.subjects.filter(Boolean) : [];
                      var opts = subs.length ? subs : ["국어","영어","수학","과학","사회"];
                      return (<>
                        <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>과목{subs.length ? ' (담당 과목)' : ' (선택)'}</label>
                        <select value={examDraft.subject} onChange={e => setExamDraft({ ...examDraft, subject: e.target.value })} style={inputStyle}>
                          <option value="">{subs.length ? '과목 선택' : '과목 선택 (선택사항)'}</option>
                          {opts.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </>);
                    })()}
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>시험일자 (선택)</label>
                    <input type="date" value={examDraft.test_date} onChange={e => setExamDraft({ ...examDraft, test_date: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>안내사항 (선택)</label>
                <textarea value={examDraft.description} onChange={e => setExamDraft({ ...examDraft, description: e.target.value })} rows={2} placeholder="예: 시험 시간 50분, 객관식 + 서술형" style={{ ...inputStyle, resize:'vertical', marginBottom:'14px' }} />

                {/* 자료실에서 불러오기 */}
                {examDraft.material_id ? (
                  <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', fontFamily:'Manrope, sans-serif' }}>
                    <div style={{ fontSize:'12px', color:'#065f46' }}>{examDraft.material_title ? <>자료실 자료 <strong>{examDraft.material_title}</strong> 에서 불러옴 — 시험지·정답이 자동으로 채워졌습니다.</> : '자료실 자료에서 만든 시험입니다 — 시험지·정답은 그 자료를 따릅니다.'}</div>
                    <button onClick={unlinkMaterialFromExam} style={{ background:'#fff', color:'#065f46', border:'1px solid #065f46', borderRadius:'6px', padding:'3px 9px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>연결 해제</button>
                  </div>
                ) : (
                  <button onClick={() => { if (!materials.length) loadMaterials(); setMaterialPickerOpen(true); }} style={{ width:'100%', background:'#fff', color:'#0f766e', border:'1px dashed #0f766e', borderRadius:'9px', padding:'10px', fontSize:'13px', fontWeight:'800', cursor:'pointer', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>자료실에서 불러오기 (분석해 둔 시험지·정답 가져오기)</button>
                )}

                {(editingExamId || examDraft.material_id || (examDraft.existing_paths||[]).length>0 || (examDraft.answer_existing_paths||[]).length>0) && (
                  <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>
                    <div style={{ fontSize:'12px', fontWeight:'800', color:'#1e40af', marginBottom:'8px' }}>등록된 시험지 파일 (클릭하면 새 탭에서 크게 보기)</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                      <span style={{ fontSize:'12px', fontWeight:'700', color:(examDraft.existing_paths||[]).length>0?'#1e3a8a':'#9ca3af' }}>시험지 {(examDraft.existing_paths||[]).length}장{(examDraft.existing_paths||[]).length===0?' (없음)':''}</span>
                      {editingExamId && !examDraft.material_id && (examDraft.existing_paths||[]).length>0 && <button onClick={() => removeExamFilesTeacher('exam')} style={{ background:'#fff', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>시험지 모두 삭제</button>}
                    </div>
                    {renderFileList(examDraft.existing_paths, '시험지', '페이지')}
                    {(examDraft.answer_existing_paths||[]).length>0 && (<>
                      <div style={{ fontSize:'12px', fontWeight:'700', color:'#1e3a8a', marginTop:'10px' }}>답안지·해설 {(examDraft.answer_existing_paths||[]).length}개</div>
                      {renderFileList(examDraft.answer_existing_paths, '답안지·해설', '')}
                    </>)}
                  </div>
                )}
                {!examDraft.material_id && (<>
                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>시험지 직접 올리기 (이미지 또는 PDF){editingExamId ? ' — 새 파일 선택하면 위 기존 시험지 전체가 교체됩니다' : ' (선택 — 자료실에서 안 불러올 때만)'}</label>
                  <input type="file" accept="image/*,application/pdf,.pdf" multiple onChange={e => setExamDraft({ ...examDraft, files: Array.from(e.target.files || []) })} style={{ width:'100%', fontSize:'13px', marginBottom:'4px' }} />
                  {examDraft.files && examDraft.files.length > 0 && (
                    <div style={{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'14px' }}>새 시험지 {examDraft.files.length}장 선택됨 (저장 시 교체)</div>
                  )}
                </>)}

                <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'10px', marginBottom:'14px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'#374151', fontWeight:'700' }}>
                  <input type="checkbox" checked={!!examDraft.hide_paper} onChange={e => setExamDraft({ ...examDraft, hide_paper: e.target.checked })} style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#E60012' }} />
                  <span>종이 시험지로 진행 — 학생 화면엔 OMR 답안만 표시 (시험지는 종이로 나눠줌)</span>
                </label>
                {examDraft.analysis && renderExamAnalysis(examDraft.analysis)}

                {/* 일반 시험: 기존 입력 그대로 */}
                {examDraft.kind !== 'homework' && (
                  <>
                    <div style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>객관식 문제 수</label>
                        <input type="number" min="0" value={examDraft.question_count} onChange={e => setExamDraft({ ...examDraft, question_count: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>보기 수 (객관식)</label>
                        <select value={examDraft.choices_per_question} onChange={e => setExamDraft({ ...examDraft, choices_per_question: e.target.value })} style={inputStyle}>
                          {["3","4","5"].map(n => <option key={n} value={n}>{n}지선다</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>서술형 문제 수 (0 = 없음)</label>
                        <input type="number" min="0" value={examDraft.text_question_count} onChange={e => setExamDraft({ ...examDraft, text_question_count: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>시간 제한 (분, 0 = 무제한)</label>
                        <input type="number" min="0" value={examDraft.time_limit_minutes} onChange={e => setExamDraft({ ...examDraft, time_limit_minutes: e.target.value })} placeholder="예: 50" style={inputStyle} />
                      </div>
                    </div>
                  </>
                )}

                {/* 숙제: 답안 종류 통합 카드 */}
                {examDraft.kind === 'homework' && (() => {
                  const objOn = parseInt(examDraft.question_count, 10) > 0;
                  const txtOn = parseInt(examDraft.text_question_count, 10) > 0;
                  return (
                    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                      <div style={{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'10px', fontFamily:'Manrope, sans-serif' }}>답안 종류 — 받을 항목을 골라주세요 (1개 이상)</div>
                      {/* 객관식 */}
                      <div style={{ marginBottom:'10px' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                          <input type="checkbox" checked={objOn} onChange={e => setExamDraft({ ...examDraft, question_count: e.target.checked ? '5' : '0', answer_key: e.target.checked ? (examDraft.answer_key || {}) : {} })} style={{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' }} />
                          <span style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>객관식</span>
                        </label>
                        {objOn && (
                          <div style={{ display:'flex', gap:'10px', marginTop:'8px', paddingLeft:'26px' }}>
                            <div style={{ flex:1 }}>
                              <label style={{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' }}>문항 수</label>
                              <input type="number" min="1" value={examDraft.question_count} onChange={e => setExamDraft({ ...examDraft, question_count: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ flex:1 }}>
                              <label style={{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' }}>보기 수</label>
                              <select value={examDraft.choices_per_question} onChange={e => setExamDraft({ ...examDraft, choices_per_question: e.target.value })} style={inputStyle}>
                                {["3","4","5"].map(n => <option key={n} value={n}>{n}지선다</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 서술형 */}
                      <div style={{ marginBottom:'10px' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                          <input type="checkbox" checked={txtOn} onChange={e => setExamDraft({ ...examDraft, text_question_count: e.target.checked ? '1' : '0' })} style={{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' }} />
                          <span style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>서술형</span>
                        </label>
                        {txtOn && (
                          <div style={{ marginTop:'8px', paddingLeft:'26px' }}>
                            <label style={{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' }}>문항 수</label>
                            <input type="number" min="1" value={examDraft.text_question_count} onChange={e => setExamDraft({ ...examDraft, text_question_count: e.target.value })} style={{ ...inputStyle, width:'120px' }} />
                          </div>
                        )}
                      </div>
                      {/* 녹음 */}
                      <div>
                        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                          <input type="checkbox" checked={!!examDraft.allow_audio_answer} onChange={e => setExamDraft({ ...examDraft, allow_audio_answer: e.target.checked })} style={{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' }} />
                          <span style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>녹음 (학생 마이크 답안)</span>
                        </label>
                        {!!examDraft.allow_audio_answer && (
                          <div style={{ marginTop:'4px', paddingLeft:'26px', fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>학생이 마이크로 녹음하여 제출 (최대 5분).</div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 객관식 정답 입력 (직접 기입) */}
                {(parseInt(examDraft.question_count, 10) || 0) > 0 && (() => {
                  const qc = parseInt(examDraft.question_count, 10) || 0;
                  const akKeys = Object.keys(examDraft.answer_key || {});
                  const nums = (akKeys.length === qc) ? akKeys.slice().sort((a,b)=>Number(a)-Number(b)) : Array.from({ length: qc }).map((_, i) => String(i + 1));
                  return (
                  <div style={{ marginBottom:'14px' }}>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>객관식 정답{examDraft.material_id ? ' (자료실에서 불러옴 — 필요하면 수정)' : ' (직접 기입, 비워두면 자동 채점 X)'}</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px, 1fr))', gap:'6px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px' }}>
                      {nums.map((num) => (
                          <div key={num} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                            <span style={{ fontSize:'12px', fontWeight:'700', color:'#6b7280', minWidth:'22px', textAlign:'right' }}>{num}.</span>
                            <input type="text" value={(examDraft.answer_key && examDraft.answer_key[num]) || ''} onChange={e => {
                              const v = e.target.value;
                              setExamDraft(p => {
                                const ak = Object.assign({}, p.answer_key || {});
                                if (v) ak[num] = v; else delete ak[num];
                                return Object.assign({}, p, { answer_key: ak });
                              });
                            }} placeholder="예: 3" style={{ flex:1, border:'1px solid #d6dbde', borderRadius:'6px', padding:'5px 6px', fontSize:'12px', fontFamily:'Manrope, sans-serif', textAlign:'center', boxSizing:'border-box' }} />
                          </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                {(parseInt(examDraft.text_question_count, 10) || 0) > 0 && (
                  <div style={{ marginBottom:'14px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'10px 12px', fontSize:'12px', color:'#0c4a6e', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' }}>
                    <strong>서술형 문항</strong>은 학생이 제출한 뒤 선생님이 직접 채점합니다 — 정답을 미리 입력할 필요 없습니다.
                  </div>
                )}

                <button onClick={() => submitExam(false)} disabled={examUploading} style={{ width:'100%', background: examUploading ? '#9ca3af' : '#E60012', color:'#fff', border:'none', borderRadius:'9px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: examUploading ? 'not-allowed' : 'pointer', marginTop:'4px', fontFamily:'Manrope, sans-serif' }}>{examUploading ? '저장 중...' : (editingExamId ? '수정 저장' : (examKindLabel(examDraft.kind) + ' 발행'))}</button>
                <div style={{ marginTop:'8px' }}>
                  <button onClick={closeExamForm} disabled={examUploading} style={{ ...lightButtonStyle, width:'100%', padding:'10px', fontSize:'13px', cursor: examUploading ? 'not-allowed' : 'pointer' }}>닫기</button>
                </div>
              </div>
            </div>
          )}

          {/* 자료실에서 자료 고르기 */}
          {materialPickerOpen && (
            <div onClick={() => setMaterialPickerOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
              <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'560px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'88vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#111827', margin:0 }}>자료실에서 불러오기</h3>
                  <button onClick={() => setMaterialPickerOpen(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>
                <p style={{ fontSize:'12px', color:'#6b7280', marginTop:0, marginBottom:'12px' }}>분석해 둔 시험지를 고르면 시험지·정답·문항 수가 자동으로 채워집니다. 자료가 없으면 "자료실" 탭에서 먼저 만들어 주세요.</p>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                  <select value={materialFilters.subject} onChange={e => setMaterialFilters({ ...materialFilters, subject: e.target.value })} style={{ ...inputStyle, width:'95px' }}>
                    <option value="">과목</option>
                    {["국어","영어","수학","과학","사회","한국사","기타"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={materialFilters.level} onChange={e => setMaterialFilters({ ...materialFilters, level: e.target.value, grade: '' })} style={{ ...inputStyle, width:'85px' }}>
                    <option value="">초중고</option>
                    {["초등","중등","고등"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={materialFilters.grade} onChange={e => setMaterialFilters({ ...materialFilters, grade: e.target.value })} style={{ ...inputStyle, width:'90px' }}>
                    <option value="">학년</option>
                    {gradeOptsForLevel(materialFilters.level).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input value={materialFilters.search} onChange={e => setMaterialFilters({ ...materialFilters, search: e.target.value })} placeholder="제목·설명 검색" style={{ ...inputStyle, flex:1, minWidth:'120px' }} />
                </div>
                {materialLoading ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>불러오는 중...</div> : (() => {
                  var list = (materials || []).filter(function(m){
                    if (!m.analysis) return false; // 분석된 것만 불러올 수 있음
                    if (materialFilters.subject && m.subject !== materialFilters.subject) return false;
                    if (materialFilters.level && m.school_level !== materialFilters.level) return false;
                    if (materialFilters.grade && m.target_grade !== materialFilters.grade) return false;
                    if (materialFilters.search) { var q = materialFilters.search.toLowerCase(); if (((m.title||'')+' '+(m.description||'')).toLowerCase().indexOf(q) < 0) return false; }
                    return true;
                  });
                  if (list.length === 0) return <div style={{ padding:'18px', textAlign:'center', color:'#9ca3af', fontSize:'13px' }}>불러올 수 있는 분석 자료가 없습니다.</div>;
                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {list.map(function(m){
                        var qc = m.question_count || 0; var tqc = m.text_question_count || 0;
                        return (
                          <button key={m.id} onClick={() => loadMaterialIntoExam(m)} style={{ textAlign:'left', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px 12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                              {m.subject && <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151' }}>{m.subject}</span>}
                              {(m.school_level || m.target_grade) && <span style={{ fontSize:'11px', color:'#6b7280' }}>{[m.school_level, m.target_grade].filter(Boolean).join(' ')}</span>}
                              <span style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>{m.title}</span>
                            </div>
                            <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'2px' }}>객관식 {qc}문항{tqc>0?' · 서술형 '+tqc+'문항':''}{m.teacher_name?' · '+m.teacher_name:''}{m.created_at?' · '+String(m.created_at).slice(0,10):''}</div>
                            {m.description && <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'2px', whiteSpace:'pre-line' }}>{m.description}</div>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      );
      })()}

      {/* ── 단어장 관리 ── */}
      {teacherView === "vocab" && window.VocabManager && (
        <div style={{ ...cardStyle, marginBottom:'24px' }}>
          {React.createElement(window.VocabManager, { user: user, isAdmin: false })}
        </div>
      )}

      {/* ── 탭1.5: 강좌 개설 ── */}
      {teacherView === "course" && (() => {
        const LEVELS = { "초등":["1학년","2학년","3학년","4학년","5학년","6학년"], "중등":["중1","중2","중3"], "고등":["고1","고2","고3"] };
        const SUBJECTS = ["국어","영어","수학","과학"];
        return (
          <div style={{ ...cardStyle, marginBottom:'24px' }}>
            <h2 style={{ marginBottom:'4px' }}>강좌 개설</h2>
            <p style={{ color:'#6b7280', fontSize:'14px', marginTop:0, marginBottom:'20px' }}>새 강좌를 만들고 클래스 / 개별 학생 / 학년 단위로 배포 대상을 지정합니다. 영상은 개설 후 "강의 추가" 탭에서 등록합니다.</p>

            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>강좌명</label>
              <input style={inputStyle} value={courseDraft.title} onChange={e => setCourseDraft({ ...courseDraft, title: e.target.value })} placeholder="예: 고1 영어 문법 마스터" />
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>설명 (선택)</label>
              <textarea style={{ ...inputStyle, minHeight:'72px', resize:'vertical' }} value={courseDraft.description} onChange={e => setCourseDraft({ ...courseDraft, description: e.target.value })} placeholder="강좌 소개·커리큘럼 등" />
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>과목</label>
              <select style={inputStyle} value={courseDraft.subject} onChange={e => setCourseDraft({ ...courseDraft, subject: e.target.value })}>
                <option value="">선택</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'6px' }}>배포 대상 (선택)</label>
              <div style={{ display:'flex', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
                {[
                  { v:'unassigned', l:'미정 (나중에 설정)' },
                  { v:'class',      l:'클래스 전체' },
                  { v:'students',   l:'개별 학생 선택' },
                ].map(opt => (
                  <label key={opt.v} style={{ fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                    <input type="radio" checked={courseDraft.scope === opt.v} onChange={() => { setCourseDraft({ ...courseDraft, scope: opt.v, class_id:'', level:'', grade:'', grades:[], student_ids:[], picker_class_id:'' }); setCourseStuFilters(STU_FILTER_INIT); if (opt.v === 'students') ensureAllStudentsLoaded(); }} /> {opt.l}
                  </label>
                ))}
              </div>
              {courseDraft.scope === 'class' && (
                <select style={inputStyle} value={courseDraft.class_id} onChange={e => setCourseDraft({ ...courseDraft, class_id: e.target.value })}>
                  <option value="">클래스 선택</option>
                  {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              )}
              {courseDraft.scope === 'students' && (
                <div>
                  <div style={{ fontSize:'11px', color:'#6b7280', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>한 학년 전체에 주려면 아래 "학년" 필터로 그 학년만 본 뒤 "보이는 N명 모두 추가"를 누르세요.</div>
                  {renderStudentPicker({
                    selectedIds: courseDraft.student_ids,
                    onChange: ids => setCourseDraft({ ...courseDraft, student_ids: ids }),
                    filters: courseStuFilters,
                    onFiltersChange: setCourseStuFilters,
                  })}
                </div>
              )}
            </div>
            <button style={buttonStyle} onClick={createCourse} disabled={creatingCourse}>{creatingCourse ? '개설 중...' : '강좌 개설'}</button>

            {/* 내 강좌 목록 + 배포 설정 */}
            <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'24px', paddingTop:'18px' }}>
              <h3 style={{ fontSize:'15px', fontWeight:'800', marginBottom:'8px' }}>내 강좌 · {(teacherCourses || []).length}개</h3>
              <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'12px', fontFamily:'Manrope, sans-serif' }}>이미 만든 강좌의 이름·설명·과목을 수정하거나, 배포 대상을 변경하거나, 강좌를 삭제할 수 있습니다.</p>
              {(teacherCourses || []).length === 0 ? (
                <div style={{ color:'#9ca3af', fontSize:'13px', padding:'16px', background:'#f9fafb', borderRadius:'8px', fontFamily:'Manrope, sans-serif' }}>아직 개설한 강좌가 없습니다.</div>
              ) : (
                (teacherCourses || []).map(c => (
                  <div key={c.id} style={{ border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:'200px' }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' }}>{c.title}</div>
                        <div style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{[c.subject, describeCourseScope(c), (c.lectures||[]).length+'강'].filter(Boolean).join(' · ')}</div>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        <button style={smallPrimaryButtonStyle} onClick={() => { if (String(editingCourseId) === String(c.id)) setEditingCourseId(''); else openCourseEditor(c); }}>
                          {String(editingCourseId) === String(c.id) ? '닫기' : '수정'}
                        </button>
                        <button style={smallLightButtonStyle} onClick={() => { if (String(distributeCourseId) === String(c.id)) setDistributeCourseId(''); else openDistributeEditor(c); }}>
                          {String(distributeCourseId) === String(c.id) ? '닫기' : '배포 설정'}
                        </button>
                        <button style={smallDangerButtonStyle} onClick={() => deleteTeacherCourse(c)}>삭제</button>
                      </div>
                    </div>

                    {String(editingCourseId) === String(c.id) && (
                      <div style={{ marginTop:'12px', padding:'12px', background:'#f9fafb', borderRadius:'8px' }}>
                        <label style={{ fontSize:'11px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>강좌명</label>
                        <input style={{ ...inputStyle, marginBottom:'10px' }} value={editCourseDraft.title} onChange={e => setEditCourseDraft({ ...editCourseDraft, title: e.target.value })} placeholder="강좌명" />
                        <label style={{ fontSize:'11px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>설명 (선택)</label>
                        <textarea style={{ ...inputStyle, minHeight:'60px', resize:'vertical', marginBottom:'10px' }} value={editCourseDraft.description} onChange={e => setEditCourseDraft({ ...editCourseDraft, description: e.target.value })} placeholder="강좌 소개·커리큘럼 등" />
                        <label style={{ fontSize:'11px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>과목</label>
                        <select style={{ ...inputStyle, marginBottom:'12px' }} value={editCourseDraft.subject} onChange={e => setEditCourseDraft({ ...editCourseDraft, subject: e.target.value })}>
                          <option value="">선택 안 함</option>
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button style={{ ...lightButtonStyle, flex:1 }} onClick={() => setEditingCourseId('')}>취소</button>
                          <button style={{ ...buttonStyle, flex:1, opacity: savingCourseEdit ? 0.6 : 1, cursor: savingCourseEdit ? 'not-allowed' : 'pointer' }} onClick={saveCourseEdit} disabled={savingCourseEdit}>{savingCourseEdit ? '저장 중...' : '저장'}</button>
                        </div>
                      </div>
                    )}

                    {String(distributeCourseId) === String(c.id) && (
                      <div style={{ marginTop:'12px', padding:'12px', background:'#f9fafb', borderRadius:'8px' }}>
                        <div style={{ display:'flex', gap:'12px', marginBottom:'10px', flexWrap:'wrap' }}>
                          {[
                            { v:'unassigned', l:'미정' },
                            { v:'class',      l:'클래스' },
                            { v:'students',   l:'개별 학생' },
                          ].map(opt => (
                            <label key={opt.v} style={{ fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                              <input type="radio" checked={distributeDraft.scope === opt.v} onChange={() => { setDistributeDraft({ ...distributeDraft, scope: opt.v, class_id:'', level:'', grade:'', student_ids: opt.v === 'students' ? distEnrollments.slice() : [], picker_class_id:'' }); setDistStuFilters(STU_FILTER_INIT); if (opt.v === 'students') ensureAllStudentsLoaded(); }} /> {opt.l}
                            </label>
                          ))}
                        </div>
                        {distributeDraft.scope === 'class' && (
                          <select style={inputStyle} value={distributeDraft.class_id} onChange={e => setDistributeDraft({ ...distributeDraft, class_id: e.target.value })}>
                            <option value="">클래스 선택</option>
                            {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                          </select>
                        )}
                        {distributeDraft.scope === 'students' && (
                          <div>
                            <div style={{ fontSize:'11px', color:'#6b7280', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>한 학년 전체에 주려면 아래 "학년" 필터로 그 학년만 본 뒤 "보이는 N명 모두 추가"를 누르세요.</div>
                            {renderStudentPicker({
                              selectedIds: distributeDraft.student_ids,
                              onChange: ids => setDistributeDraft({ ...distributeDraft, student_ids: ids }),
                              filters: distStuFilters,
                              onFiltersChange: setDistStuFilters,
                            })}
                          </div>
                        )}
                        {distributeDraft.scope === 'unassigned' && (
                          <div style={{ fontSize:'12px', color:'#6b7280', padding:'10px 12px', background:'#fff', borderRadius:'6px', fontFamily:'Manrope, sans-serif' }}>배포를 미정 상태로 두면 학생 화면에 노출되지 않습니다.</div>
                        )}
                        <div style={{ marginTop:'10px', display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                          <button style={lightButtonStyle} onClick={() => setDistributeCourseId('')}>취소</button>
                          <button style={buttonStyle} onClick={saveDistribution} disabled={distributing}>{distributing ? '저장 중...' : '배포 저장'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 탭2: 강의 추가 ── */}
      {teacherView === "lecture" && (() => {
        const LECTURE_GRADES = {
          "초등": ["1학년","2학년","3학년","4학년","5학년","6학년"],
          "중등": ["중1","중2","중3"],
          "고등": ["고1","고2","고3"],
        };
        const LECTURE_SUBJECTS = ["국어","영어","수학","과학"];
        // 과목만 필수. 초중고/학년/클래스는 범위를 좁히고 싶을 때만 선택.
        const classMode = !!lectureClassId;
        // 클래스를 골랐는데 과목이 비어있으면 클래스의 subject로 추론
        const inferredClass = classMode ? (availableClassCards || []).find(c => String(c.id) === String(lectureClassId)) : null;
        const effectiveSubject = lectureSubject || (inferredClass && inferredClass.subject) || "";
        const ready = !!effectiveSubject && lectureCourseName.trim();
        // 필터 조건에 맞는 기존 강좌만 후보로 (필터 미선택 시 빈 목록)
        const hasAnyFilter = classMode || !!lectureLevel || !!lectureGrade || !!effectiveSubject;
        const scopedCourses = !hasAnyFilter ? [] : (teacherCourses || []).filter(c => {
          // 강좌의 해당 필드가 비어 있으면 그 필드는 와일드카드로 취급(필터와 매치)
          if (classMode) {
            if (String(c.class_id || "") === String(lectureClassId)) return true;
            // 클래스 미지정(공통) 강좌도 그 클래스의 학년/과목과 호환되면 후보에 포함
            if (c.class_id) return false;
            const cls = inferredClass;
            if (cls) {
              if (c.subject && cls.subject && clean(c.subject) !== clean(cls.subject)) return false;
              if (c.grade && cls.grade && String(c.grade).split(',').map(function(s){ return s.trim(); }).indexOf(cls.grade) < 0) return false;
            }
            return true;
          }
          // 학년/과목 모드: 클래스 전용 강좌는 제외
          if (c.class_id) return false;
          if (lectureLevel && c.level && c.level !== lectureLevel) return false;
          if (lectureGrade && c.grade && String(c.grade).split(',').map(function(s){ return s.trim(); }).indexOf(lectureGrade) < 0) return false;
          if (effectiveSubject && c.subject && clean(c.subject) !== clean(effectiveSubject)) return false;
          return true;
        });
        const courseSuggestions = Array.from(new Set(scopedCourses.map(c => c.title).filter(Boolean)));
        const matchedCourse = lectureCourseName.trim()
          ? teacherCourses.find(c => clean(c.title) === clean(lectureCourseName) && (!effectiveSubject || !c.subject || clean(c.subject) === clean(effectiveSubject)))
          : null;
        const visibleLectures = matchedCourse ? (matchedCourse.lectures || []) : [];

        return (
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "4px" }}>강의 추가</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "20px" }}>과목만 고르면 됩니다. 초중고·학년·클래스는 범위를 좁히고 싶을 때만 선택하세요. (클래스를 고르면 그 반 학생에게, 학년을 고르면 그 학년 학생에게, 둘 다 안 고르면 그 과목 학생 전체에게 강의가 배정됩니다.)</p>

            {/* 1. 상단 필터 (4개 드롭다운) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#E60012", display: "block", marginBottom: "4px" }}>과목 *</label>
                <select style={inputStyle} value={lectureSubject} onChange={e => setLectureSubject(e.target.value)}>
                  <option value="">선택</option>
                  {LECTURE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>초중고 (선택)</label>
                <select style={inputStyle} value={lectureLevel} onChange={e => { setLectureLevel(e.target.value); setLectureGrade(""); }}>
                  <option value="">전체</option>
                  {Object.keys(LECTURE_GRADES).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>학년 (선택)</label>
                <select style={inputStyle} value={lectureGrade} onChange={e => setLectureGrade(e.target.value)} disabled={!lectureLevel}>
                  <option value="">전체</option>
                  {(LECTURE_GRADES[lectureLevel] || []).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>클래스 (선택)</label>
                <select style={inputStyle} value={lectureClassId} onChange={e => setLectureClassId(e.target.value)}>
                  <option value="">전체</option>
                  {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </div>
            </div>

            {/* 1.5. 내 강좌 목록 (필터 조건에 맞는 강좌만 표시, 클릭으로 선택) */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                내 강좌 · {courseSuggestions.length}개
                {classMode ? " (선택한 클래스)" :
                  (lectureLevel || lectureGrade || effectiveSubject)
                    ? ` (${[lectureLevel, lectureGrade, effectiveSubject].filter(Boolean).join(" · ")})`
                    : ""}
              </label>
              {courseSuggestions.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: "12px", padding: "10px 12px", background: "#f9fafb", borderRadius: "8px", fontFamily: "Manrope, sans-serif" }}>
                  {(classMode || lectureLevel || lectureGrade || effectiveSubject)
                    ? `이 조건으로 생성된 강좌가 없습니다. (전체 로드: ${(teacherCourses||[]).length}개${classMode && inferredClass ? `, 클래스: ${inferredClass.name} / ${inferredClass.subject || "?"} / ${inferredClass.grade || "?"}` : ""})`
                    : "먼저 과목을 선택하세요. 선택한 과목(과 초중고·학년·클래스)에 맞는 강좌가 여기 표시됩니다."}
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "180px", overflowY: "auto", padding: "8px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #edf0f2" }}>
                  {courseSuggestions.map(name => {
                    const c = scopedCourses.find(x => clean(x.title) === clean(name));
                    const lectureCount = c ? (c.lectures || []).length : 0;
                    const active = clean(lectureCourseName) === clean(name);
                    return (
                      <button key={name} onClick={() => setLectureCourseName(name)}
                        style={{ background: active ? "#E60012" : "#fff", color: active ? "#fff" : "#1A1A1A", border: active ? "2px solid #E60012" : "1px solid #d6dbde", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "Manrope, sans-serif", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>{name}</span>
                        <span style={{ fontSize: "11px", opacity: 0.7 }}>{lectureCount}강</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. 강좌명 (기존 강좌 자동완성 + 새 강좌명 입력 가능) */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강좌명</label>
              <input list="lecture-course-names" style={inputStyle} value={lectureCourseName} onChange={e => setLectureCourseName(e.target.value)} placeholder="예: 문법 (위 목록에서 클릭하거나 새로 입력)" />
              <datalist id="lecture-course-names">
                {courseSuggestions.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>

            {/* 3. 강의 입력 — 강좌명과 동일하게 풀폭으로 통일 */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강의 제목</label>
              <input style={inputStyle} value={courseVideoTitle} onChange={e => setCourseVideoTitle(e.target.value)} placeholder="예: 명사" />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강의 링크</label>
              <input style={inputStyle} value={courseVideoLink} onChange={e => setCourseVideoLink(e.target.value)} placeholder="YouTube 링크/ID 또는 영상 URL" />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "end", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px", minWidth: "140px" }}>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>노출 기간</label>
                <select style={inputStyle} value={videoExpireDays} onChange={e => setVideoExpireDays(e.target.value)}>
                  <option value="">제한 없음</option>
                  <option value="30">30일</option>
                  <option value="45">45일</option>
                  <option value="60">60일</option>
                </select>
              </div>
              <button style={buttonStyle} onClick={addVideoToCourse} disabled={savingOnline}>{savingOnline ? "저장 중..." : "강의 저장"}</button>
            </div>

            {/* 4. 강의 목록 (강좌명이 입력되면 표시) */}
            {!lectureCourseName.trim() ? (
              <div style={{ color: "#9ca3af", textAlign: "center", padding: "24px", fontSize: "13px", background: "#f9fafb", borderRadius: "10px", fontFamily: "Manrope, sans-serif" }}>
                위 "내 강좌"에서 클릭하거나 강좌명을 입력하면 강의 목록이 표시됩니다.
              </div>
            ) : !matchedCourse ? (
              <div style={{ color: "#9ca3af", textAlign: "center", padding: "24px", fontSize: "13px", background: "#f9fafb", borderRadius: "10px", fontFamily: "Manrope, sans-serif" }}>
                "{lectureCourseName}" 강좌가 아직 없습니다. 강의를 저장하면 새 강좌로 자동 생성됩니다.
              </div>
            ) : visibleLectures.length === 0 ? (
              <div style={{ color: "#9ca3af", textAlign: "center", padding: "24px", fontSize: "13px", background: "#f9fafb", borderRadius: "10px", fontFamily: "Manrope, sans-serif" }}>
                "{matchedCourse.title}" 강좌에 등록된 강의가 없습니다.
              </div>
            ) : (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ background: "#1A1A1A", padding: "10px 14px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "800", fontFamily: "Manrope, sans-serif" }}>{matchedCourse.title}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontFamily: "Manrope, sans-serif" }}>{visibleLectures.length}강</span>
                </div>
                <div style={{ padding: "8px 14px" }}>
                  {visibleLectures.map((lec, idx) => {
                    var exp = lec.expires_at ? new Date(lec.expires_at) : null;
                    var expired = exp && exp.getTime() < Date.now();
                    var daysLeft = exp ? Math.ceil((exp.getTime() - Date.now()) / (24*60*60*1000)) : null;
                    return (
                      <div key={lec.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: idx < visibleLectures.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#E60012", width: "30px", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{idx+1}강</span>
                        <span style={{ fontSize: "14px", color: "#374151", flex: 1, fontFamily: "Manrope, sans-serif" }}>{lec.title}</span>
                        {exp && (
                          <span style={{ fontSize:'11px', fontWeight:'700', color: expired ? '#c82014' : '#6b7280', background: expired ? '#fef2f2' : '#f3f4f6', padding:'2px 8px', borderRadius:'10px', fontFamily:'Manrope, sans-serif' }}>
                            {expired ? '만료됨' : 'D-' + daysLeft}
                          </span>
                        )}
                        <button onClick={() => deleteLecture(matchedCourse.id, lec.id)} style={{ background: "none", border: "none", color: "#c82014", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 탭3: 특이사항 (전체 학생 대상, 클래스 무관) ── */}
      {teacherView === "notes" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>특이사항 기록</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "20px" }}>담당 학생들의 특이사항, 상담 내용 등을 기록합니다.</p>

          {/* 작성 폼 */}
          <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            {/* 모드 토글 */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>대상</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: 'all', label: '일반 특이사항' },
                  { id: 'student', label: '학생별 특이사항' },
                ].map(opt => {
                  const active = noteTargetMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNoteTargetMode(opt.id)}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: active ? "2px solid #E60012" : "1px solid #e5e7eb",
                        background: active ? "#f0fdf4" : "white",
                        color: active ? "#065f46" : "#374151",
                        fontWeight: "700",
                        cursor: "pointer",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >{opt.label}</button>
                  );
                })}
              </div>
            </div>

            {/* 학생별 모드: 반/학생 선택 */}
            {noteTargetMode === 'student' && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>반</label>
                  <select
                    style={inputStyle}
                    value={noteClassId}
                    onChange={e => { setNoteClassId(e.target.value); loadNoteClassStudents(e.target.value); }}
                  >
                    <option value="">반 선택</option>
                    {(availableClassCards || []).map(cls => (
                      <option key={cls.id} value={String(cls.id)}>{cls.name}{cls.grade ? ` (${cls.grade})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>학생</label>
                  <select
                    style={inputStyle}
                    value={noteStudentId}
                    onChange={e => setNoteStudentId(e.target.value)}
                    disabled={!noteClassId}
                  >
                    <option value="">{noteClassId ? (noteStudents.length === 0 ? "(학생 없음)" : "학생 선택") : "먼저 반을 선택하세요"}</option>
                    {noteStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.grade ? ` (${s.grade})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "10px", maxWidth: "200px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>날짜</label>
              <input style={inputStyle} type="date" value={noteDraft.date} onChange={e => setNoteDraft(p => ({...p, date: e.target.value}))} />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>내용</label>
              <textarea rows={15} style={{ ...inputStyle, minHeight: "360px", resize: "vertical", lineHeight: "1.6" }}
                placeholder="특이사항, 상담 내용, 학습 태도 등을 기록하세요."
                value={noteDraft.content}
                onChange={e => setNoteDraft(p => ({...p, content: e.target.value}))}
              />
            </div>
            <button style={buttonStyle} onClick={saveNote} disabled={savingNote}>{savingNote ? "저장 중..." : "저장"}</button>
          </div>

          {teacherNotes.length === 0
            ? <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>아직 기록이 없습니다.</div>
            : <div style={{ display: "grid", gap: "10px" }}>
                {teacherNotes.map(note => (
                  <div key={note.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: "800", background: "#ecfdf5", color: "#065f46", borderRadius: "6px", padding: "2px 10px", fontFamily: "Manrope, sans-serif" }}>{note.note_type}</span>
                        {note.students?.name && <span style={{ fontSize: "12px", color: "#6b7280", fontFamily: "Manrope, sans-serif" }}>{note.students.name}</span>}
                        <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "Manrope, sans-serif" }}>{note.note_date}</span>
                      </div>
                      <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "#c82014", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: "1.7", whiteSpace: "pre-line", fontFamily: "Manrope, sans-serif" }}>{note.content}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ── 성적 탭 서브 토글 ── */}
      {teacherView === "scores" && (
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid #e5e7eb', marginBottom:'18px', flexWrap:'wrap' }}>
          {[{ id:'browse', label:'성적 보기' }, { id:'register', label:'내신 성적 입력' }, { id:'analysis', label:'성적 분석' }].map(sm => (
            <button key={sm.id} onClick={() => setScoreSubMode(sm.id)} style={{
              padding:'12px 16px', background:'none', border:'none',
              borderBottom: scoreSubMode===sm.id ? '2px solid #E60012' : '2px solid transparent',
              fontSize:'14px', fontWeight:'700',
              color: scoreSubMode===sm.id ? '#E60012' : 'rgba(0,0,0,0.55)',
              cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'-1px'
            }}>{sm.label}</button>
          ))}
        </div>
      )}

      {/* ── 성적 보기: 종류 → 필터 → 학생 → 점수 ── */}
      {teacherView === "scores" && scoreSubMode === "browse" && (() => {
        var KINDS = [
          { v:'숙제', l:'숙제', kk:'homework' },
          { v:'주간평가', l:'주간테스트', kk:'weekly' },
          { v:'월말평가', l:'월말테스트', kk:'monthly' },
          { v:'레벨테스트', l:'레벨테스트', kk:'level' },
          { v:'__naesin__', l:'내신', kk:'class' },
        ];
        var kindLabelOf = function(v){ var f = KINDS.find(function(k){ return k.v === v; }); return f ? f.l : v; };
        var matchKind = function(r){ return scoreBrowseKind === '__naesin__' ? (r.exam_id == null) : ((r.test_type || '') === scoreBrowseKind); };
        var scColor = function(v){ return (v == null || isNaN(v)) ? '#9ca3af' : (v >= 80 ? '#16a34a' : v >= 60 ? '#c87000' : '#c82014'); };
        var classNamesOf = function(sid){ var out = []; (availableClassCards || []).forEach(function(cls){ if (((analysisClassStudents[cls.id] || []).map(String)).indexOf(String(sid)) >= 0) out.push(cls.name); }); return out; };
        var inClass = function(sid, cid){ if (!cid) return true; return ((analysisClassStudents[cid] || []).map(String)).indexOf(String(sid)) >= 0; };
        var rows = (scoreAnalysis || []).filter(function(r){
          if (!scoreBrowseKind) return false;
          if (!matchKind(r)) return false;
          if (scoreBrowseFilters.subject && (r.subject || '') !== scoreBrowseFilters.subject) return false;
          var std = analysisAllStudents[r.student_id] || {};
          var g = (r.students && r.students.grade) || std.grade || '';
          if (scoreBrowseFilters.grade && g !== scoreBrowseFilters.grade) return false;
          if (scoreBrowseFilters.level && window.B2Utils.levelFromGrade(g) !== scoreBrowseFilters.level) return false;
          if (scoreBrowseFilters.classId && !inClass(r.student_id, scoreBrowseFilters.classId)) return false;
          return true;
        });
        var byStudent = {};
        rows.forEach(function(r){ (byStudent[r.student_id] = byStudent[r.student_id] || []).push(r); });
        var studentList = Object.keys(byStudent).map(function(sid){
          var sr = byStudent[sid].slice().sort(function(a,b){ return String(b.test_date||'').localeCompare(String(a.test_date||'')); });
          var std = analysisAllStudents[sid] || {};
          var nm = (sr[0].students && sr[0].students.name) || std.name || '-';
          var gd = (sr[0].students && sr[0].students.grade) || std.grade || '';
          var vals = sr.map(function(r){ return Number(r.score); }).filter(function(v){ return !isNaN(v); });
          var av = vals.length ? Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length) : null;
          return { sid:sid, name:nm, grade:gd, classes:classNamesOf(sid), n:sr.length, last:Number(sr[0].score), avg:av, scores:sr };
        }).sort(function(a,b){ return String(a.name).localeCompare(String(b.name)); });
        var gradeOpts = scoreBrowseFilters.level === '초등' ? ['1학년','2학년','3학년','4학년','5학년','6학년'] : scoreBrowseFilters.level === '중등' ? ['중1','중2','중3'] : scoreBrowseFilters.level === '고등' ? ['고1','고2','고3'] : ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
        var subjectOpts = Array.from(new Set((scoreAnalysis||[]).filter(matchKind).map(function(r){ return r.subject; }).filter(Boolean)));
        return (
        <div style={{ ...cardStyle, marginBottom:'24px' }}>
          <h2 style={{ marginTop:0, marginBottom:'4px' }}>성적 보기</h2>
          <p style={{ marginTop:0, marginBottom:'14px', color:'#6b7280', fontSize:'14px' }}>{!scoreBrowseKind ? '어떤 테스트의 성적을 볼지 골라주세요.' : (kindLabelOf(scoreBrowseKind) + ' 성적 — 필터로 학생을 좁히고, 학생을 누르면 점수를 봅니다.')}</p>

          {!scoreBrowseKind ? (
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              {KINDS.map(function(k){
                var c = examKindBadgeStyle(k.kk);
                return <button key={k.v} onClick={() => { setScoreBrowseKind(k.v); setScoreBrowseFilters({ level:'', grade:'', subject:'', classId:'' }); setScoreBrowseStudent(null); if (!scoreAnalysis || scoreAnalysis.length === 0) loadScoreAnalysis(); }} style={{ flex:'1 1 130px', minWidth:'120px', background:'#fff', color:c.color, border:'1.5px solid '+c.color, borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>{k.l}</button>;
              })}
            </div>
          ) : scoreBrowseStudent ? (() => {
            var sr0 = byStudent[scoreBrowseStudent] || [];
            var sr = sr0.slice().sort(function(a,b){ return String(b.test_date||'').localeCompare(String(a.test_date||'')); });
            var std = analysisAllStudents[scoreBrowseStudent] || {};
            var nm = (sr[0] && sr[0].students && sr[0].students.name) || std.name || '-';
            var gd = (sr[0] && sr[0].students && sr[0].students.grade) || std.grade || '';
            var vals = sr.map(function(r){ return Number(r.score); }).filter(function(v){ return !isNaN(v); });
            var av = vals.length ? Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length) : null;
            return (
              <div>
                <button onClick={() => setScoreBrowseStudent(null)} style={{ ...lightButtonStyle, marginBottom:'12px' }}>← 학생 목록</button>
                <h3 style={{ margin:'0 0 10px' }}>{nm}{gd ? <span style={{ fontSize:'13px', color:'#6b7280', fontWeight:'600' }}> · {gd}</span> : null}<span style={{ fontSize:'13px', color:'#6b7280', fontWeight:'600' }}> · {kindLabelOf(scoreBrowseKind)}</span>{av != null ? <span style={{ fontSize:'13px', color:'#6b7280', fontWeight:'600' }}> · 평균 {av}점</span> : null}</h3>
                {sr.length === 0 ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>점수가 없습니다.</div> : (
                  <div style={{ borderTop:'1px solid #eef2f7' }}>
                    {sr.map(function(r){
                      return <div key={r.id} style={{ borderBottom:'1px solid #eef2f7', padding:'9px 2px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', fontFamily:'Manrope, sans-serif' }}>
                        <span style={{ fontSize:'12px', color:'#9ca3af', whiteSpace:'nowrap' }}>{String(r.test_date||'').slice(0,10)}</span>
                        {r.subject && <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151' }}>{r.subject}</span>}
                        <span style={{ fontSize:'13px', color:'#111827', flex:1, minWidth:'120px' }}>{r.test_name || '-'}{r.exam_id ? '' : ' (직접 입력)'}</span>
                        <span style={{ fontSize:'16px', fontWeight:'800', color: scColor(Number(r.score)) }}>{r.score == null ? '-' : r.score}<span style={{ fontSize:'11px', color:'#9ca3af', fontWeight:'600' }}> / {r.total != null ? r.total : 100}</span></span>
                      </div>;
                    })}
                  </div>
                )}
              </div>
            );
          })() : (
            <div>
              <button onClick={() => { setScoreBrowseKind(null); setScoreBrowseStudent(null); }} style={{ ...lightButtonStyle, marginBottom:'12px' }}>← 종류 다시 고르기</button>
              <div style={{ fontSize:'11px', fontWeight:'800', color:'#6b7280', marginBottom:'6px' }}>필터 (선택)</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                <select value={scoreBrowseFilters.level} onChange={e => setScoreBrowseFilters({ ...scoreBrowseFilters, level:e.target.value, grade:'' })} style={{ ...inputStyle, width:'92px' }}>
                  <option value="">초중고</option>{['초등','중등','고등'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={scoreBrowseFilters.grade} onChange={e => setScoreBrowseFilters({ ...scoreBrowseFilters, grade:e.target.value })} style={{ ...inputStyle, width:'92px' }}>
                  <option value="">학년</option>{gradeOpts.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={scoreBrowseFilters.subject} onChange={e => setScoreBrowseFilters({ ...scoreBrowseFilters, subject:e.target.value })} style={{ ...inputStyle, width:'92px' }}>
                  <option value="">과목</option>{subjectOpts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={scoreBrowseFilters.classId} onChange={e => setScoreBrowseFilters({ ...scoreBrowseFilters, classId:e.target.value })} style={{ ...inputStyle, flex:1, minWidth:'130px' }}>
                  <option value="">클래스</option>{(availableClassCards||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {(scoreBrowseFilters.level || scoreBrowseFilters.grade || scoreBrowseFilters.subject || scoreBrowseFilters.classId) && <button onClick={() => setScoreBrowseFilters({ level:'', grade:'', subject:'', classId:'' })} style={{ ...lightButtonStyle, padding:'8px 12px', fontSize:'12px' }}>필터 초기화</button>}
              </div>
              {analysisLoading ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>불러오는 중...</div> : studentList.length === 0 ? (
                <div style={{ padding:'18px', textAlign:'center', color:'#9ca3af', fontSize:'13px' }}>조건에 맞는 학생이 없습니다.{(scoreAnalysis||[]).filter(matchKind).length === 0 ? ' (이 종류의 성적이 아직 없습니다.)' : ''}</div>
              ) : (
                <div>
                  <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>학생 <strong>{studentList.length}명</strong> — 학생을 누르면 그 학생의 성적이 보입니다.</div>
                  <div style={{ borderTop:'1px solid #eef2f7' }}>
                    {studentList.map(function(st){
                      var clsTxt = st.classes.filter(function(v,i,a){ return a.indexOf(v) === i; }).join(', ');
                      return <button key={st.sid} onClick={() => setScoreBrowseStudent(st.sid)} style={{ width:'100%', textAlign:'left', borderBottom:'1px solid #eef2f7', borderTop:'none', borderLeft:'none', borderRight:'none', background:'#fff', padding:'10px 2px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', fontFamily:'Manrope, sans-serif' }}>
                        <span style={{ fontSize:'14px', fontWeight:'700', color:'#111827' }}>{st.name}</span>
                        {st.grade && <span style={{ fontSize:'12px', color:'#6b7280' }}>{st.grade}</span>}
                        {clsTxt && <span style={{ fontSize:'12px', color:'#9ca3af' }}>{clsTxt}</span>}
                        <span style={{ flex:1 }} />
                        <span style={{ fontSize:'12px', color:'#1d4ed8', fontWeight:'700', whiteSpace:'nowrap' }}>성적 보기 ›</span>
                      </button>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        );
      })()}

      {/* ── 탭4: 성적 등록 ── */}
      {teacherView === "scores" && scoreSubMode === "register" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>내신 성적 입력</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "10px" }}>학교 중간고사·기말고사·모의고사 등 학생들의 내신 시험 점수를 기록하는 곳입니다. 대상 반을 선택하면 학생이 자동으로 표시됩니다.</p>
          <div style={{ background:"#FFF7ED", border:"1px solid #fed7aa", borderRadius:"8px", padding:"9px 12px", marginBottom:"16px", fontSize:"12px", color:"#9a3412", fontFamily:"Manrope, sans-serif", lineHeight:1.6 }}>
            앱에서 OMR로 본 테스트(숙제·주간·월말·레벨)와 단어 시험은 자동으로 채점되니 여기 입력하지 않아도 돼요. 이 칸은 <strong>학교 내신 시험</strong>처럼 앱 밖에서 본 시험 점수를 기록하는 곳입니다. (입력한 점수는 "성적 보기"의 "내신"에서 볼 수 있어요.)
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>대상 반</label>
            <select
              style={{ ...inputStyle, maxWidth: "320px" }}
              value={selectedClassId || ""}
              onChange={e => {
                const id = e.target.value;
                if (!id) { selectClass(null); return; }
                const cls = availableClassCards.find(c => String(c.id) === String(id));
                if (cls) selectClass(cls);
              }}
            >
              <option value="">반 선택</option>
              {availableClassCards.map(cls => (
                <option key={cls.id} value={String(cls.id)}>{cls.name}{cls.grade ? ` (${cls.grade})` : ""}</option>
              ))}
            </select>
          </div>

          {!selectedClass ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "32px", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>대상 반을 선택해 주세요</div>
          ) : students.length === 0 ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "32px", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>이 반에 배정된 학생이 없습니다.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <select style={inputStyle} value={testInfo.testType} onChange={e => setTestInfo(p => ({...p, testType: e.target.value}))}>
                  {["1학기 중간고사","1학기 기말고사","2학기 중간고사","2학기 기말고사","모의고사","수행평가","기타 시험"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={inputStyle} type="date" value={testInfo.testDate} onChange={e => setTestInfo(p => ({...p, testDate: e.target.value}))} />
                <select style={inputStyle} value={testInfo.subject} onChange={e => setTestInfo(p => ({...p, subject: e.target.value}))}>
                  <option value="">과목 선택</option>
                  {["국어","영어","수학","과학"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <input style={inputStyle} placeholder="시험 범위 (선택)" value={testInfo.testRange} onChange={e => setTestInfo(p => ({...p, testRange: e.target.value}))} />
              </div>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>점수를 입력하면 그 학생은 자동으로 체크됩니다. 체크된 학생 중 점수가 입력된 학생만 저장돼요. 체크를 풀면 그 학생은 제외됩니다.</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                <button style={lightButtonStyle} onClick={selectAllStudents}>전체 선택</button>
                <button style={lightButtonStyle} onClick={clearAllStudents}>전체 해제</button>
                <span style={{ alignSelf: "center", fontSize: "12px", color: "#6b7280", fontFamily: "Manrope, sans-serif" }}>점수 입력 {students.filter(s => String(scores[s.id]||"").trim() !== "").length}명 / 전체 {students.length}명</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: teacherIsMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(178px, 1fr))", gap: "6px", marginBottom: "12px" }}>
                {students.map(s => {
                  const checked = selectedStudentIds.includes(s.id);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 7px", border: checked ? "1.5px solid #E60012" : "1px solid #e5e7eb", borderRadius: "7px", background: checked ? "#fff7f7" : "white" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.id)} style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: "700", fontSize: "13px", color: "#1A1A1A", fontFamily: "Manrope, sans-serif" }} title={s.grade ? s.name + " (" + s.grade + ")" : s.name}>{s.name}</span>
                      <input style={{ ...inputStyle, width: "52px", flexShrink: 0, textAlign: "center", padding: "5px 3px", fontSize: "13px" }} type="number" placeholder="점수" value={scores[s.id] || ""} onChange={e => { updateScore(s.id, e.target.value); if (e.target.value && !selectedStudentIds.includes(s.id)) toggleStudent(s.id); }} />
                    </div>
                  );
                })}
              </div>
              <button style={buttonStyle} onClick={saveAllScores}>선택 학생 성적 저장</button>
            </>
          )}
        </div>
      )}

      {/* ── 탭5: 성적 분석 (종합 대시보드) ── */}
      {teacherView === "scores" && scoreSubMode === "analysis" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>성적 분석</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>등록된 성적을 기반으로 자동 생성되는 리포트입니다.</p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <select style={{ ...inputStyle, maxWidth: "200px" }} value={analysisClassId} onChange={e => { setAnalysisClassId(e.target.value); setAnalysisStudentId(''); }}>
              <option value="">반 선택</option>
              {availableClassCards.map(cls => <option key={cls.id} value={String(cls.id)}>{cls.name}</option>)}
            </select>
            <select style={{ ...inputStyle, maxWidth: "140px" }} value={analysisSubject} onChange={e => setAnalysisSubject(e.target.value)}>
              <option value="전체">과목 전체</option>
              {["국어","영어","수학","과학"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={{ ...inputStyle, maxWidth: "200px" }} value={analysisTestName} onChange={e => setAnalysisTestName(e.target.value)}>
              <option value="전체">시험 전체</option>
              {Array.from(new Set((scoreAnalysis||[]).map(r => r.test_name).filter(Boolean))).sort().map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input style={{ ...inputStyle, minWidth: "180px", flex: 1 }} placeholder="학생명 검색" value={analysisSearch} onChange={e => setAnalysisSearch(e.target.value)} />
            <button style={lightButtonStyle} onClick={loadScoreAnalysis}>{analysisLoading ? "로딩 중..." : "새로고침"}</button>
          </div>

          {analysisLoading ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>로딩 중...</div>
          ) : !analysisClassId ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "32px", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>반을 선택해 주세요</div>
          ) : (() => {
            const q = analysisSearch.trim().toLowerCase();
            const scoresFiltered = scoreAnalysis.filter(s => {
              if (analysisSubject !== "전체" && s.subject !== analysisSubject) return false;
              if (analysisTestName !== "전체" && s.test_name !== analysisTestName) return false;
              return true;
            });
            const targetIds = (analysisClassStudents[analysisClassId] || []).map(String);
            const subjectActive = analysisSubject !== "전체";
            const testNameActive = analysisTestName !== "전체";

            // 학생 행 구성
            const rows = targetIds.map(sid => {
              const std = analysisAllStudents[sid];
              const studentName = (std && std.name) || (scoreAnalysis.find(s => String(s.student_id) === sid)?.students?.name) || "학생";
              const studentGrade = (std && std.grade) || "";
              const myScores = scoresFiltered.filter(s => String(s.student_id) === sid)
                .slice().sort((a,b) => (a.test_date||"").localeCompare(b.test_date||""));
              if ((subjectActive || testNameActive) && myScores.length === 0) return null;
              if (q && studentName.toLowerCase().indexOf(q) < 0) return null;
              const myVals = myScores.map(s => Number(s.score)).filter(v => !isNaN(v));
              const myAvg = myVals.length ? (myVals.reduce((a,b)=>a+b,0)/myVals.length) : null;
              const last = myScores[myScores.length-1];
              const prev = myScores[myScores.length-2];
              return { id: sid, name: studentName, grade: studentGrade, scores: myScores, avg: myAvg, last, prev };
            }).filter(Boolean);

            if (rows.length === 0) return <div style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>표시할 학생이 없습니다.</div>;

            // 1) 요약 카드
            const allVals = rows.flatMap(r => r.scores.map(s => Number(s.score))).filter(v => !isNaN(v));
            const avg = allVals.length ? (allVals.reduce((a,b)=>a+b,0)/allVals.length) : null;
            const max = allVals.length ? Math.max(...allVals) : null;
            const min = allVals.length ? Math.min(...allVals) : null;
            // 시험 회차 키 (날짜·시험명·과목 단위)
            const testKeys = Array.from(new Set(scoresFiltered.filter(s => targetIds.indexOf(String(s.student_id)) >= 0).map(s => `${s.test_date||''}|${s.test_name||''}|${s.subject||''}`))).filter(Boolean).sort();
            const lastKey = testKeys[testKeys.length-1] || null;
            const prevKey = testKeys[testKeys.length-2] || null;
            function avgForKey(key){ if(!key) return null; var arr = scoresFiltered.filter(s => `${s.test_date||''}|${s.test_name||''}|${s.subject||''}` === key && targetIds.indexOf(String(s.student_id))>=0).map(s => Number(s.score)).filter(v=>!isNaN(v)); return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
            const lastAvg = avgForKey(lastKey);
            const prevAvg = avgForKey(prevKey);
            const avgChange = (lastAvg != null && prevAvg != null) ? lastAvg - prevAvg : null;
            const lastVals = lastKey ? scoresFiltered.filter(s => `${s.test_date||''}|${s.test_name||''}|${s.subject||''}` === lastKey && targetIds.indexOf(String(s.student_id))>=0).map(s => Number(s.score)).filter(v=>!isNaN(v)) : [];
            const lastMax = lastVals.length ? Math.max(...lastVals) : null;
            const lastMin = lastVals.length ? Math.min(...lastVals) : null;
            const lastTakers = lastVals.length;
            // 등급별 인원 (이번 시험 기준)
            const buckets = { g1:0, g2:0, g3:0, fail:0 };
            lastVals.forEach(function(v){ var b = gradeBucketOf(v); if(b===1) buckets.g1++; else if(b===2) buckets.g2++; else if(b===3) buckets.g3++; else buckets.fail++; });
            // 점수 분포 (이번 시험)
            const distLabels = ['0-59','60-69','70-79','80-89','90-100'];
            const dist = { '0-59':0,'60-69':0,'70-79':0,'80-89':0,'90-100':0 };
            lastVals.forEach(function(v){ var b = distributionBucketOf(v); if(b) dist[b]++; });
            const distMax = Math.max(1, ...distLabels.map(function(l){ return dist[l]; }));
            // 학생별 (이번 시험) 정렬
            const lastStudentScores = lastKey ? rows.map(function(r){
              var s = r.scores.find(function(x){ return `${x.test_date||''}|${x.test_name||''}|${x.subject||''}` === lastKey; });
              return s ? { id:r.id, name:r.name, score: Number(s.score) } : null;
            }).filter(Boolean).sort(function(a,b){ return b.score - a.score; }) : [];
            // 시험 회차별 평균 추이 (최근 5회)
            const trendKeys = testKeys.slice(-5);
            const trend = trendKeys.map(function(k){ return { key:k, label: k.split('|')[0] || '-', avg: avgForKey(k) }; });
            // 누적 분석
            const stuStats = rows.map(function(r){
              var firstHalf = r.scores.slice(0, Math.max(1, Math.floor(r.scores.length/2))).map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
              var secondHalf = r.scores.slice(Math.floor(r.scores.length/2)).map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
              var firstAvg = firstHalf.length ? firstHalf.reduce(function(a,b){return a+b;},0)/firstHalf.length : null;
              var secondAvg = secondHalf.length ? secondHalf.reduce(function(a,b){return a+b;},0)/secondHalf.length : null;
              var change = (firstAvg!=null && secondAvg!=null) ? secondAvg - firstAvg : null;
              // 최근 3회 연속 하락
              var last3 = r.scores.slice(-3).map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
              var consecutiveDrop = last3.length === 3 && last3[0] > last3[1] && last3[1] > last3[2];
              // 꾸준히 상위권 (모든 시험 80점 이상)
              var allHigh = r.scores.length >= 2 && r.scores.every(function(s){ return Number(s.score) >= 80; });
              return { id:r.id, name:r.name, avg:r.avg, change:change, consecutiveDrop:consecutiveDrop, allHigh:allHigh };
            });
            const ranked = stuStats.slice().filter(function(s){ return s.avg != null; }).sort(function(a,b){ return b.avg - a.avg; });
            const movers = stuStats.slice().filter(function(s){ return s.change != null; }).sort(function(a,b){ return b.change - a.change; });
            const topUp = movers.slice(0,3).filter(function(s){ return s.change > 0; });
            const topDown = movers.slice(-3).filter(function(s){ return s.change < 0; }).reverse();
            const stars = stuStats.filter(function(s){ return s.allHigh; });
            const watch = stuStats.filter(function(s){ return s.consecutiveDrop; });
            // 개인 추이 (선택된 학생)
            const focusStudent = analysisStudentId ? rows.find(function(r){ return String(r.id) === String(analysisStudentId); }) : null;

            const cardLabel = { fontSize:'12px', color:'#6b7280', marginTop:'4px', fontFamily:'Manrope, sans-serif' };
            const cardVal = { fontSize:'18px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' };

            return (
              <>
                {/* 1) 요약 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={cardVal}>{lastAvg != null ? lastAvg.toFixed(1)+'점' : '-'}</div>
                    <div style={cardLabel}>이번 시험 평균</div>
                    {avgChange != null && (
                      <div style={{ fontSize:'11px', marginTop:'4px', fontWeight:'700', color: avgChange >= 0 ? '#E60012' : '#c82014', fontFamily:'Manrope, sans-serif' }}>
                        {avgChange >= 0 ? '▲' : '▼'} {Math.abs(avgChange).toFixed(1)}점 (전회 대비)
                      </div>
                    )}
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={cardVal}>{lastMax != null ? lastMax+'점' : '-'}</div>
                    <div style={cardLabel}>이번 시험 최고점</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={cardVal}>{lastMin != null ? lastMin+'점' : '-'}</div>
                    <div style={cardLabel}>이번 시험 최저점</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={cardVal}>{lastTakers || '-'}명</div>
                    <div style={cardLabel}>응시 인원</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'20px' }}>
                  {[
                    { label:'1등급(90+)', val: buckets.g1, color:'#E60012' },
                    { label:'2등급(80+)', val: buckets.g2, color:'#3A3A3A' },
                    { label:'3등급(70+)', val: buckets.g3, color:'#F8B500' },
                    { label:'미달(<70)', val: buckets.fail, color:'#c82014' },
                  ].map(function(b){ return (
                    <div key={b.label} style={{ background:'#fff', border:'1px solid '+b.color+'33', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
                      <div style={{ fontSize:'16px', fontWeight:'800', color:b.color, fontFamily:'Manrope, sans-serif' }}>{b.val}명</div>
                      <div style={cardLabel}>{b.label}</div>
                    </div>
                  ); })}
                </div>

                {/* 2-a) 점수 분포 막대 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>점수 분포 (이번 시험)</div>
                  {lastVals.length === 0 ? (
                    <div style={{ color:'#9ca3af', fontSize:'12px' }}>이번 시험 응시 데이터가 없습니다.</div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', height:'140px', borderBottom:'2px solid #e5e7eb', padding:'0 8px' }}>
                      {distLabels.map(function(l){
                        var v = dist[l];
                        var h = Math.round((v / distMax) * 120);
                        var color = l === '90-100' ? '#E60012' : l === '80-89' ? '#3A3A3A' : l === '70-79' ? '#F8B500' : l === '60-69' ? '#dd6b20' : '#c82014';
                        return (
                          <div key={l} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                            <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>{v}명</div>
                            <div style={{ width:'100%', height:h+'px', background:color, borderRadius:'6px 6px 0 0' }} />
                            <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'6px', fontFamily:'Manrope, sans-serif' }}>{l}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2-b) 학생별 점수 가로 바 (이번 시험) */}
                {lastStudentScores.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>학생별 점수 (이번 시험, 높은순)</div>
                    {lastStudentScores.map(function(it){
                      var pct = Math.max(0, Math.min(100, it.score));
                      return (
                        <div key={it.id} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                          <span style={{ width:'80px', fontSize:'12px', color:'#374151', fontWeight:'600', fontFamily:'Manrope, sans-serif' }}>{it.name}</span>
                          <div style={{ flex:1, height:'14px', background:'#f3f4f6', borderRadius:'7px', overflow:'hidden' }}>
                            <div style={{ width:pct+'%', height:'100%', background: colorForScore(it.score) }} />
                          </div>
                          <span style={{ width:'44px', fontSize:'12px', fontWeight:'700', color:colorForScore(it.score), textAlign:'right', fontFamily:'Manrope, sans-serif' }}>{it.score}점</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2-c) 시험 회차별 평균 추이 (꺾은선) */}
                {trend.length >= 2 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>시험 회차별 평균 추이 (최근 {trend.length}회)</div>
                    <svg viewBox={"0 0 600 160"} style={{ width:'100%', height:'160px', background:'#f9fafb', borderRadius:'10px' }}>
                      {(() => {
                        var w = 600, h = 160, padL = 40, padR = 20, padT = 16, padB = 30;
                        var n = trend.length;
                        var avgs = trend.map(function(t){ return t.avg; });
                        var validAvgs = avgs.filter(function(v){ return v != null; });
                        if (!validAvgs.length) return null;
                        var minY = 0, maxY = 100;
                        var xs = trend.map(function(_, i){ return n === 1 ? (w-padL-padR)/2 + padL : padL + i * ((w-padL-padR)/(n-1)); });
                        var ys = avgs.map(function(v){ return v == null ? null : (h - padB - ((v - minY) / (maxY - minY)) * (h - padT - padB)); });
                        var pathD = '';
                        ys.forEach(function(y, i){ if (y != null) pathD += (pathD ? ' L ' : 'M ') + xs[i] + ',' + y; });
                        return (
                          <g>
                            {[0,25,50,75,100].map(function(g){
                              var y = h - padB - ((g - minY) / (maxY - minY)) * (h - padT - padB);
                              return <g key={g}>
                                <line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={padL-4} y={y+4} textAnchor="end" fontSize="10" fill="#9ca3af">{g}</text>
                              </g>;
                            })}
                            <path d={pathD} fill="none" stroke="#E60012" strokeWidth="2.5" />
                            {ys.map(function(y, i){ return y == null ? null : (
                              <g key={i}>
                                <circle cx={xs[i]} cy={y} r="4" fill="#E60012" />
                                <text x={xs[i]} y={y-8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#E60012">{avgs[i].toFixed(1)}</text>
                                <text x={xs[i]} y={h-padB+16} textAnchor="middle" fontSize="10" fill="#6b7280">{trend[i].label}</text>
                              </g>
                            ); })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                )}

                {/* 3) 누적 분석 */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>누적 분석 (전체 시험 기록 기반)</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#E60012', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>가장 많이 오른 학생 TOP 3</div>
                      {topUp.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        topUp.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#E60012', fontWeight:'700'}}>+{s.change.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#c82014', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>가장 많이 떨어진 학생 TOP 3</div>
                      {topDown.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        topDown.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#c82014', fontWeight:'700'}}>{s.change.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#E60012', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>꾸준히 상위권 유지</div>
                      {stars.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        stars.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#E60012', fontWeight:'700'}}>평균 {s.avg.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#fff7ed', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#c2410c', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>최근 3회 연속 하락 (관리 필요)</div>
                      {watch.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        watch.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name}</div>; })
                      }
                    </div>
                  </div>
                  <div style={{ marginTop:'10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>학생별 평균 누적 순위</div>
                    {ranked.map(function(s, i){ return (
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', borderBottom: i < ranked.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                        <span style={{ width:'24px', fontSize:'12px', fontWeight:'700', color: i<3?'#E60012':'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{i+1}위</span>
                        <span style={{ flex:1, fontSize:'12px', color:'#374151', fontFamily:'Manrope, sans-serif' }}>{s.name}</span>
                        <span style={{ fontSize:'12px', fontWeight:'700', color: colorForScore(s.avg), fontFamily:'Manrope, sans-serif' }}>{s.avg.toFixed(1)}점</span>
                      </div>
                    ); })}
                  </div>
                </div>

                {/* 2-d) 학생 개인별 성적 추이 */}
                <div style={{ marginBottom: '20px', background:'#f9fafb', borderRadius:'10px', padding:'14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <span style={{ fontSize:'13px', fontWeight:'800', color:'#374151', fontFamily:'Manrope, sans-serif' }}>학생 개인별 추이</span>
                    <select style={{ ...inputStyle, maxWidth:'180px', marginBottom:0 }} value={analysisStudentId} onChange={e => setAnalysisStudentId(e.target.value)}>
                      <option value="">학생 선택</option>
                      {rows.map(function(r){ return <option key={r.id} value={r.id}>{r.name}</option>; })}
                    </select>
                  </div>
                  {!focusStudent ? (
                    <div style={{ fontSize:'12px', color:'#9ca3af' }}>학생을 선택하면 개인 추이가 표시됩니다.</div>
                  ) : (
                    <svg viewBox={"0 0 600 160"} style={{ width:'100%', height:'160px', background:'#fff', borderRadius:'8px' }}>
                      {(() => {
                        var w = 600, h = 160, padL = 40, padR = 20, padT = 16, padB = 30;
                        var ss = focusStudent.scores;
                        var n = ss.length;
                        if (n === 0) return null;
                        var vals = ss.map(function(s){ return Number(s.score); });
                        var xs = ss.map(function(_, i){ return n === 1 ? (w-padL-padR)/2 + padL : padL + i * ((w-padL-padR)/(n-1)); });
                        var ys = vals.map(function(v){ return isNaN(v) ? null : (h - padB - (v / 100) * (h - padT - padB)); });
                        var pathD = '';
                        ys.forEach(function(y, i){ if (y != null) pathD += (pathD ? ' L ' : 'M ') + xs[i] + ',' + y; });
                        return (
                          <g>
                            {[0,25,50,75,100].map(function(g){
                              var y = h - padB - (g / 100) * (h - padT - padB);
                              return <g key={g}>
                                <line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={padL-4} y={y+4} textAnchor="end" fontSize="10" fill="#9ca3af">{g}</text>
                              </g>;
                            })}
                            <path d={pathD} fill="none" stroke="#F8B500" strokeWidth="2.5" />
                            {ys.map(function(y, i){ return y == null ? null : (
                              <g key={i}>
                                <circle cx={xs[i]} cy={y} r="4" fill={colorForScore(vals[i])} />
                                <text x={xs[i]} y={y-8} textAnchor="middle" fontSize="11" fontWeight="700" fill={colorForScore(vals[i])}>{vals[i]}</text>
                                <text x={xs[i]} y={h-padB+16} textAnchor="middle" fontSize="10" fill="#6b7280">{ss[i].test_name || '-'}</text>
                              </g>
                            ); })}
                          </g>
                        );
                      })()}
                    </svg>
                  )}
                </div>

                {/* 학부모 일괄 발송 버튼 */}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginBottom:'12px' }}>
                  <button style={lightButtonStyle} onClick={function(){ setKakaoTarget({ mode:'bulk', students: rows.map(function(r){ return { id:r.id, name:r.name, last:r.last, prev:r.prev }; }) }); }}>전체 학부모 일괄 발송</button>
                </div>

                {/* 학생별 카드 (점수목록 + AI코멘트 + 발송/리포트 버튼) */}
                {rows.map(function(r){
                  var lastScore = r.last ? Number(r.last.score) : null;
                  var prevScore = r.prev ? Number(r.prev.score) : null;
                  var trendVals = r.scores.map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
                  var aiComment = B2Utils.generateComment({
                    studentName: r.name,
                    score: lastScore,
                    prevScore: prevScore,
                    classAvg: lastAvg,
                    recentTrend: trendVals,
                    subject: r.last ? r.last.subject : '',
                    testName: r.last ? r.last.test_name : ''
                  });
                  return (
                    <div key={r.id} style={{ marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ background: '#1A1A1A', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}>{r.name}</span>
                          {r.grade && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '8px', fontFamily: 'Manrope, sans-serif' }}>{r.grade}</span>}
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginLeft: '12px', fontFamily: 'Manrope, sans-serif' }}>{r.scores.length}회 · 평균 {r.avg != null ? r.avg.toFixed(1)+'점' : '-'}</span>
                        </div>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button style={smallButtonStyle} onClick={function(){ setReportStudentId(r.id); }}>학부모 리포트</button>
                          <button style={{ ...smallButtonStyle, background:'#F8B500', color:'#fff' }} onClick={function(){ setKakaoTarget({ mode:'single', students:[{ id:r.id, name:r.name, last:r.last, prev:r.prev }] }); }}>알림톡</button>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px' }}>
                        {r.scores.length === 0 ? (
                          <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', fontFamily: 'Manrope, sans-serif' }}>아직 등록된 성적이 없습니다 (미응시)</div>
                        ) : (
                          <>
                            {r.scores.slice().sort(function(a,b){ return (b.test_date||'').localeCompare(a.test_date||''); }).map(function(s, si){
                              var pct = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
                              return (
                                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                  <div style={{ width: '180px', flexShrink: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: 'Manrope, sans-serif' }}>{s.test_name || '(무제)'}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'Manrope, sans-serif' }}>{[s.subject, s.test_date].filter(Boolean).join(' · ')}</div>
                                  </div>
                                  <span style={{ width: '78px', fontSize: '11px', color: '#9ca3af', flexShrink: 0, fontFamily: 'Manrope, sans-serif' }}>{s.teachers?.name ? s.teachers.name + ' 선생님' : ''}</span>
                                  <div style={{ flex: 1, height: '14px', background: '#f3f4f6', borderRadius: '7px', overflow: 'hidden' }}>
                                    <div style={{ width: pct+'%', height: '100%', background: colorForScore(s.score) }} />
                                  </div>
                                  <span style={{ width: '44px', fontSize: '13px', fontWeight: '700', color: colorForScore(s.score), textAlign: 'right', flexShrink: 0, fontFamily: 'Manrope, sans-serif' }}>{s.score}점</span>
                                </div>
                              );
                            })}
                            <div style={{ marginTop:'10px', padding:'10px 12px', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'8px' }}>
                              <div style={{ fontSize:'11px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>AI 자동 코멘트 (학부모 전달용)</div>
                              <div style={{ fontSize:'13px', color:'#374151', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' }}>{aiComment}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 5) 시험지 분석 자리 (PDF 업로드 준비) */}
                <div style={{ marginTop:'24px', padding:'18px', background:'#f9fafb', border:'1px dashed #d6dbde', borderRadius:'12px', textAlign:'center' }}>
                  <div style={{ fontSize:'14px', fontWeight:'800', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>시험지 분석</div>
                  <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' }}>문제별 정답률 · 유형별 취약점 · 학생별 약점 개념 · 학습 우선순위 제안</div>
                  <button disabled style={{ ...smallButtonStyle, background:'#e5e7eb', color:'#9ca3af', cursor:'not-allowed' }}>시험지 PDF 업로드 (준비 중)</button>
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'8px', fontFamily:'Manrope, sans-serif' }}>시험지 분석 기능은 준비 중입니다.</div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── 탭: 학습 현황 (담당 학생 영상 시청 진도) ── */}
      {teacherView === "studyviews" && (
        <div>
          <div style={{ ...cardStyle, marginBottom: "16px" }}>
            <h2 style={{ marginBottom: "6px" }}>학습 현황</h2>
            <p style={{ marginTop: 0, marginBottom: 0, color: "#6b7280", fontSize: "14px" }}>내가 개설한 강좌를 수강 중인 학생들의 영상 시청 진도를 확인합니다.</p>
          </div>
          {(studyViewsLoading || studyViews === null) ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>불러오는 중...</div>
          ) : (teacherCourses || []).length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", color: "#9ca3af", fontSize: "14px", padding: "32px" }}>개설한 온라인 강좌가 없습니다. "강좌 개설"·"강의 추가"에서 먼저 강좌와 영상을 등록해 주세요.</div>
          ) : studyViews.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", color: "#9ca3af", fontSize: "14px", padding: "32px" }}>아직 영상을 시청한 학생이 없습니다.</div>
          ) : (() => {
            var byStudent = {};
            studyViews.forEach(function(v){
              var sid = v.student_id;
              if (!byStudent[sid]) byStudent[sid] = { student: v.students || { id: sid, name: "학생" }, rows: [] };
              byStudent[sid].rows.push(v);
            });
            var groups = Object.keys(byStudent).map(function(k){ return byStudent[k]; });
            groups.sort(function(a, b){
              var la = a.rows.reduce(function(m, r){ return (r.last_watched_at || "") > m ? r.last_watched_at : m; }, "");
              var lb = b.rows.reduce(function(m, r){ return (r.last_watched_at || "") > m ? r.last_watched_at : m; }, "");
              return String(lb).localeCompare(String(la));
            });
            return (
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", marginBottom: "8px", fontFamily: "Manrope, sans-serif" }}>{groups.length + "명"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {groups.map(function(g){
                    var st = g.student;
                    var open = studyViewsExpandedId === st.id;
                    var total = g.rows.length;
                    var done = g.rows.filter(function(r){ return (r.progress_pct || 0) >= 90; }).length;
                    var avg = total > 0 ? Math.round(g.rows.reduce(function(a, r){ return a + (r.progress_pct || 0); }, 0) / total) : 0;
                    var byCourse = {};
                    g.rows.forEach(function(r){
                      var ck = r.course_id;
                      if (!byCourse[ck]) byCourse[ck] = { title: (r.courses && r.courses.title) || "강좌", subject: (r.courses && r.courses.subjects && r.courses.subjects.name) || "", videos: [] };
                      byCourse[ck].videos.push(r);
                    });
                    return (
                      <div key={st.id} style={{ background: "#fff", border: open ? "2px solid #1A1A1A" : "1.5px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", fontFamily: "Manrope, sans-serif" }}>
                        <button onClick={function(){ setStudyViewsExpandedId(open ? null : st.id); }} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px" }}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#FFEBED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: "#E60012", flexShrink: 0 }}>{st.grade || String(st.name || "")[0] || "—"}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: "#111827" }}>{st.name}{st.school ? <span style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", marginLeft: "6px" }}>{st.school}</span> : null}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{"시청 " + total + "강 · 완료 " + done + "강 · 평균 진도 " + avg + "%"}</div>
                          </div>
                          <div style={{ fontSize: "18px", color: "#d1d5db", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</div>
                        </button>
                        {open && (
                          <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            {Object.keys(byCourse).map(function(ck, ci){
                              var grp = byCourse[ck];
                              var grpDone = grp.videos.filter(function(r){ return (r.progress_pct || 0) >= 90; }).length;
                              return (
                                <div key={ci} style={{ marginTop: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                                  <div style={{ background: "#1A1A1A", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: "800", color: "#fff", fontSize: "13px" }}>{grp.title}{grp.subject ? " · " + grp.subject : ""}</span>
                                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>{grpDone + "/" + grp.videos.length + "강 완료"}</span>
                                  </div>
                                  <div style={{ padding: "8px 12px" }}>
                                    {grp.videos.map(function(r, vi){
                                      var pct = r.progress_pct || 0;
                                      var barColor = pct >= 90 ? "#E60012" : pct >= 50 ? "#F8B500" : "#e5e7eb";
                                      var txtColor = pct >= 90 ? "#E60012" : pct >= 50 ? "#F8B500" : "#9ca3af";
                                      var lw = r.last_watched_at ? String(r.last_watched_at).slice(0, 10) : "—";
                                      return (
                                        <div key={vi} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderBottom: vi < grp.videos.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                                          <span style={{ fontSize: "12px", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(r.videos && r.videos.title) || "강의"}</span>
                                          <div style={{ width: "80px", height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
                                            <div style={{ width: pct + "%", height: "100%", background: barColor, borderRadius: "3px" }} />
                                          </div>
                                          <span style={{ width: "34px", fontSize: "11px", fontWeight: "700", color: txtColor, textAlign: "right", flexShrink: 0 }}>{pct + "%"}</span>
                                          <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0, width: "64px", textAlign: "right" }}>{lw}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 탭6: 자료실 (원본 자료 / 분석본 도서관) ── */}
      {teacherView === "files" && (
        <>
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px', marginBottom:'4px' }}>
            <h2 style={{ margin:0 }}>자료실 — 원본 자료 / 분석본</h2>
            <button onClick={openMaterialForm} style={buttonStyle}>+ 원본 자료 업로드</button>
          </div>
          <p style={{ color:'#6b7280', fontSize:'14px', marginTop:0, marginBottom:'16px' }}>시험지·문제집(원본 자료)을 올리고 "분석" 버튼을 누르면 Claude가 문항별 정답·단원을 분석해 "분석본"으로 저장합니다. 시험·숙제는 [시험]·[숙제] 탭에서 여기 자료를 불러와 만듭니다. (모든 선생님·관리자가 함께 쓰는 도서관)</p>

          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px', alignItems:'center' }}>
            {[{ v:'all', l:'원본' }, { v:'analyzed', l:'분석본' }].map(o => (
              <button key={o.v} onClick={() => setMaterialFilters({ ...materialFilters, view: o.v })} style={{ fontSize:'12px', fontWeight:'700', borderRadius:'8px', padding:'7px 14px', cursor:'pointer', fontFamily:'Manrope, sans-serif', border:'1px solid ' + (materialFilters.view===o.v ? '#0f766e' : '#d6dbde'), background: materialFilters.view===o.v ? '#0f766e' : '#fff', color: materialFilters.view===o.v ? '#fff' : '#374151' }}>{o.l}</button>
            ))}
            <select value={materialFilters.subject} onChange={e => setMaterialFilters({ ...materialFilters, subject: e.target.value })} style={{ ...inputStyle, width:'95px' }}>
              <option value="">과목</option>
              {["국어","영어","수학","과학","사회","한국사","기타"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={materialFilters.level} onChange={e => setMaterialFilters({ ...materialFilters, level: e.target.value, grade: '' })} style={{ ...inputStyle, width:'85px' }}>
              <option value="">초중고</option>
              {["초등","중등","고등"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={materialFilters.grade} onChange={e => setMaterialFilters({ ...materialFilters, grade: e.target.value })} style={{ ...inputStyle, width:'90px' }}>
              <option value="">학년</option>
              {gradeOptsForLevel(materialFilters.level).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input value={materialFilters.search} onChange={e => setMaterialFilters({ ...materialFilters, search: e.target.value })} placeholder="제목·설명 검색" style={{ ...inputStyle, flex:1, minWidth:'130px' }} />
          </div>

          {materialLoading ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>불러오는 중...</div> : (() => {
            var list = (materials || []).filter(function(m){
              if (materialFilters.subject && m.subject !== materialFilters.subject) return false;
              if (materialFilters.level && m.school_level !== materialFilters.level) return false;
              if (materialFilters.grade && m.target_grade !== materialFilters.grade) return false;
              if (materialFilters.view === 'analyzed' && !m.analysis) return false;
              if (materialFilters.search) {
                var q = materialFilters.search.toLowerCase();
                if (((m.title||'') + ' ' + (m.description||'')).toLowerCase().indexOf(q) < 0) return false;
              }
              return true;
            });
            if (list.length === 0) return <div style={{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Manrope, sans-serif' }}>{(materials||[]).length === 0 ? '아직 등록된 분석 자료가 없습니다. "+ 새 자료 분석"으로 시험지를 올려보세요.' : '검색 결과가 없습니다.'}</div>;
            var btnS = { fontSize:'11px', fontWeight:'700', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap', border:'1px solid' };
            return (
              <div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>총 {list.length}개</div>
                <div style={{ borderTop:'1px solid #eef2f7' }}>
                {list.map(function(m){
                  var qc = m.question_count || 0; var tqc = m.text_question_count || 0;
                  var imgs = Array.isArray(m.image_paths) ? m.image_paths : [];
                  var ans = Array.isArray(m.answer_paths) ? m.answer_paths : [];
                  var open = materialAnalysisOpenId === m.id;
                  var busy = analyzingMaterialId === m.id;
                  return (
                    <div key={m.id} style={{ borderBottom:'1px solid #eef2f7', padding:'8px 2px', fontFamily:'Manrope, sans-serif' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                        {m.analysis ? <span style={{ fontSize:'10px', fontWeight:'800', background:'#dcfce7', color:'#15803d', borderRadius:'4px', padding:'1px 6px' }}>분석완료</span> : <span style={{ fontSize:'10px', fontWeight:'800', background:'#fef3c7', color:'#92400e', borderRadius:'4px', padding:'1px 6px' }}>분석전</span>}
                        {m.subject && <span style={{ fontSize:'11px', fontWeight:'700', color:'#374151' }}>{m.subject}</span>}
                        {(m.school_level || m.target_grade) && <span style={{ fontSize:'11px', color:'#9ca3af' }}>{[m.school_level, m.target_grade].filter(Boolean).join(' ')}</span>}
                        <span style={{ fontSize:'13px', fontWeight:'700', color:'#111827', flex:1, minWidth:'110px' }}>{m.title}</span>
                        <span style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' }}>{m.analysis ? '객'+qc+(tqc>0?(' 서'+tqc):'') : ('시험지 '+imgs.length)}{m.teacher_name ? (' · '+m.teacher_name) : ''}{m.created_at ? (' · '+String(m.created_at).slice(5,10)) : ''}</span>
                        <span style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                          <button onClick={() => setMaterialAnalysisOpenId(open ? null : m.id)} style={{ ...btnS, color:'#1d4ed8', borderColor:'#bfdbfe', background: open ? '#eff6ff' : '#fff' }}>{open ? '접기' : '자세히'}</button>
                          <button onClick={() => openMaterialFormForEdit(m)} style={{ ...btnS, color:'#E60012', borderColor:'#E60012', background:'#fff' }}>수정</button>
                          <button onClick={() => reanalyzeMaterial(m)} disabled={busy} style={{ ...btnS, color:'#fff', borderColor: busy ? '#9ca3af' : '#0f766e', background: busy ? '#9ca3af' : '#0f766e', cursor: busy ? 'wait' : 'pointer' }}>{busy ? '분석중' : (m.analysis ? '재분석' : '분석')}</button>
                          <button onClick={() => deleteMaterial(m)} style={{ ...btnS, color:'#c82014', borderColor:'#f3c5c0', background:'#fff' }}>삭제</button>
                        </span>
                      </div>
                      {m.description && <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'2px', whiteSpace:'pre-line' }}>{m.description}</div>}
                      {open && (
                        <div style={{ marginTop:'6px' }}>
                          <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 10px', marginBottom:'8px' }}>
                            <div style={{ fontSize:'11px', fontWeight:'800', color:'#1e40af', marginBottom:'4px' }}>원본 파일 (눌러서 열기)</div>
                            <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'2px' }}>시험지 {imgs.length}개{imgs.length===0?' (없음)':''}</div>
                            {renderFileList(imgs, '시험지', '')}
                            {ans.length > 0 && <><div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginTop:'8px', marginBottom:'2px' }}>답안지·해설 {ans.length}개</div>{renderFileList(ans, '답안지·해설', '')}</>}
                          </div>
                          {m.analysis ? renderExamAnalysis(m.analysis) : <div style={{ fontSize:'11px', color:'#92400e', background:'#fef3c7', borderRadius:'8px', padding:'8px 10px', fontFamily:'Manrope, sans-serif' }}>아직 Claude 문항 분석이 안 됐어요. 오른쪽 "분석" 버튼을 누르면 분석합니다.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            );
          })()}

          {/* 자료 분석 폼 모달 */}
          {materialFormOpen && (
            <div onClick={closeMaterialForm} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
              <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <h3 style={{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 }}>{materialEditId ? '원본 자료 수정' : '원본 자료 업로드'}</h3>
                  <button onClick={closeMaterialForm} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                </div>

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>자료 제목 *</label>
                <input value={materialDraft.title} onChange={e => setMaterialDraft({ ...materialDraft, title: e.target.value })} placeholder="예: 2024 9월 고2 영어 모의고사 / 능률 영어1 3과 본문" style={{ ...inputStyle, marginBottom:'14px' }} />

                <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>과목</label>
                    <select value={materialDraft.subject} onChange={e => setMaterialDraft({ ...materialDraft, subject: e.target.value })} style={inputStyle}>
                      <option value="">선택</option>
                      {["국어","영어","수학","과학","사회","한국사","기타"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>초중고</label>
                    <select value={materialDraft.school_level} onChange={e => setMaterialDraft({ ...materialDraft, school_level: e.target.value, target_grade: '' })} style={inputStyle}>
                      <option value="">선택</option>
                      {["초등","중등","고등"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>학년 (선택)</label>
                    <select value={materialDraft.target_grade} onChange={e => setMaterialDraft({ ...materialDraft, target_grade: e.target.value })} disabled={!materialDraft.school_level} style={inputStyle}>
                      <option value="">{materialDraft.school_level ? '학년 선택' : '먼저 초중고 선택'}</option>
                      {(materialDraft.school_level==='초등'?['1학년','2학년','3학년','4학년','5학년','6학년']:materialDraft.school_level==='중등'?['중1','중2','중3']:materialDraft.school_level==='고등'?['고1','고2','고3']:[]).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>설명·출처 (선택)</label>
                <textarea value={materialDraft.description} onChange={e => setMaterialDraft({ ...materialDraft, description: e.target.value })} rows={2} placeholder="예: 어법·빈칸 위주, 21~40번만" style={{ ...inputStyle, resize:'vertical', marginBottom:'14px' }} />

                {(materialEditId || (materialDraft.existing_paths||[]).length>0 || (materialDraft.answer_existing_paths||[]).length>0) && (
                  <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>
                    <div style={{ fontSize:'12px', fontWeight:'800', color:'#1e40af', marginBottom:'6px' }}>현재 등록된 파일 (클릭하면 새 탭에서 보기)</div>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:(materialDraft.existing_paths||[]).length>0?'#1e3a8a':'#9ca3af' }}>시험지 {(materialDraft.existing_paths||[]).length}개{(materialDraft.existing_paths||[]).length===0?' (없음)':''}</div>
                    {renderFileList(materialDraft.existing_paths, '시험지', '')}
                    <div style={{ fontSize:'12px', fontWeight:'700', color:(materialDraft.answer_existing_paths||[]).length>0?'#1e3a8a':'#9ca3af', marginTop:'8px' }}>답안지·해설 {(materialDraft.answer_existing_paths||[]).length}개{(materialDraft.answer_existing_paths||[]).length===0?' (없음)':''}</div>
                    {renderFileList(materialDraft.answer_existing_paths, '답안지·해설', '')}
                  </div>
                )}

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>시험지·문제집 (이미지 또는 PDF, 여러 장 가능){materialEditId ? ' — 새 파일 선택하면 기존 시험지를 교체합니다' : ''}</label>
                <input type="file" accept="image/*,application/pdf,.pdf" multiple onChange={e => setMaterialDraft({ ...materialDraft, files: Array.from(e.target.files || []) })} style={{ width:'100%', fontSize:'13px', marginBottom:'4px' }} />
                {materialDraft.files && materialDraft.files.length > 0 && <div style={{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'12px' }}>새 시험지 {materialDraft.files.length}개 선택됨</div>}

                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>답안지·해설 (선택 — 정답·해설 정확도 향상, PDF 가능){materialEditId ? ' — 새 파일 선택하면 기존 답안을 교체합니다' : ''}</label>
                <input type="file" accept="image/*,application/pdf,.pdf" multiple onChange={e => setMaterialDraft({ ...materialDraft, answer_files: Array.from(e.target.files || []) })} style={{ width:'100%', fontSize:'13px', marginBottom:'4px' }} />
                {materialDraft.answer_files && materialDraft.answer_files.length > 0 && <div style={{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'12px' }}>새 답안지 {materialDraft.answer_files.length}개 선택됨</div>}

                <div style={{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>
                  <div style={{ fontSize:'12px', fontWeight:'800', color:'#0f766e', marginBottom:'8px' }}>분석 범위 (선택 — 비워두면 전체 분석)</div>
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'140px' }}>
                      <label style={{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' }}>분석할 페이지 (예: 3-5)</label>
                      <input type="text" value={materialDraft.analyze_page_range || ''} onChange={e => setMaterialDraft({ ...materialDraft, analyze_page_range: e.target.value })} placeholder="비워두면 전체" style={{ ...inputStyle, width:'100%' }} />
                    </div>
                    <div style={{ flex:1, minWidth:'140px' }}>
                      <label style={{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' }}>이 자료에서 쓸 문항 번호 (예: 21-40)</label>
                      <input type="text" value={materialDraft.selected_questions_text || ''} onChange={e => setMaterialDraft({ ...materialDraft, selected_questions_text: e.target.value })} placeholder="비워두면 전체" style={{ ...inputStyle, width:'100%' }} />
                    </div>
                  </div>
                  <div style={{ fontSize:'10px', color:'#64748b', marginTop:'6px', lineHeight:'1.5' }}>페이지를 지정하면 그 페이지만 Claude에 보내 비용을 줄입니다 (PDF·여러 장일 때). 답안지·해설은 항상 전체를 보냅니다.</div>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'10px', fontSize:'12px', color:'#0f766e', fontWeight:'700' }}>
                    <input type="checkbox" checked={!!materialDraft.precise} onChange={e => setMaterialDraft({ ...materialDraft, precise: e.target.checked })} style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#0f766e' }} />
                    문항 분석을 정밀하게 (고난도 모의고사 등 — 비용 약 5배)
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'8px', fontSize:'12px', color:'#0f766e', fontWeight:'700' }}>
                    <input type="checkbox" checked={!!materialDraft.precise_student} onChange={e => setMaterialDraft({ ...materialDraft, precise_student: e.target.checked })} style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#0f766e' }} />
                    이 자료로 만든 시험의 학생 답안 분석도 정밀하게
                  </label>
                </div>

                <button onClick={() => submitMaterial(true)} disabled={materialUploading || !!analyzingMaterialId} style={{ width:'100%', background:(materialUploading||analyzingMaterialId)?'#9ca3af':'#0f766e', color:'#fff', border:'none', borderRadius:'9px', padding:'11px', fontSize:'14px', fontWeight:'800', cursor:(materialUploading||analyzingMaterialId)?'not-allowed':'pointer', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>{analyzingMaterialId ? '분석 중... (1~2분)' : (materialUploading ? '업로드 중...' : '업로드하고 바로 분석')}</button>
                <button onClick={() => submitMaterial(false)} disabled={materialUploading || !!analyzingMaterialId} style={{ ...lightButtonStyle, width:'100%', padding:'9px', fontSize:'13px', marginBottom:'10px', cursor:(materialUploading||analyzingMaterialId)?'not-allowed':'pointer' }}>업로드만 (분석은 나중에)</button>
                {materialDraft.analysis && renderExamAnalysis(materialDraft.analysis)}
                <div style={{ marginTop:'10px' }}>
                  <button onClick={closeMaterialForm} disabled={materialUploading || !!analyzingMaterialId} style={{ ...lightButtonStyle, width:'100%', padding:'9px', fontSize:'13px' }}>닫기</button>
                </div>
              </div>
            </div>
          )}
        </div>

        </>
      )}

      {/* ── 탭8: 학원 일정 ── */}
      {teacherView === "schedule" && (() => {
        const y = scrMonth.y, m = scrMonth.m;
        const monthLabel = y + '.' + String(m+1).padStart(2,'0');
        const firstDay = new Date(y, m, 1).getDay(); // 0=일
        const daysInMonth = new Date(y, m+1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        const todayStr = new Date().toISOString().slice(0,10);
        function dateStrOf(d) { return y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0'); }
        const reqsByDate = {};
        scrRequests.forEach(r => { (reqsByDate[r.target_date] = reqsByDate[r.target_date] || []).push(r); });
        // 날짜별 학사일정 (기간 펼치기)
        const acByDate = {};
        academicList.forEach(a => {
          if (!a.start_date || !a.end_date) return;
          const s = new Date(a.start_date + 'T00:00:00');
          const e = new Date(a.end_date + 'T00:00:00');
          for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate()+1)) {
            const ds2 = dt.toISOString().slice(0,10);
            (acByDate[ds2] = acByDate[ds2] || []).push(a);
          }
        });
        const myRequests = scrRequests.filter(r => teacherInfo && r.teacher_id === ((user && user.id) || teacherInfo.id));
        function shiftMonth(delta) {
          const nm = m + delta;
          const ny = y + Math.floor(nm / 12);
          const nmm = ((nm % 12) + 12) % 12;
          setScrMonth({ y: ny, m: nmm });
        }
        // 현재 월에 걸치는 학사일정만
        const monthStartStr = dateStrOf(1);
        const monthEndStr = dateStrOf(daysInMonth);
        const academicInMonth = academicList.filter(a => !(a.end_date < monthStartStr || a.start_date > monthEndStr));

        return (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '6px' }}>학원 일정</h2>
            <p style={{ marginTop: 0, marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>강의일정 변경 신청 또는 학사일정(방학·시험기간 등)을 확인하고 등록할 수 있습니다.</p>

            {/* 모드 토글 */}
            <div style={{ display:'flex', gap:'0', borderBottom:'1px solid #e5e7eb', marginBottom:'14px' }}>
              {[{ id:'change', label:'강의일정 변경' }, { id:'academic', label:'학사일정' }].map(sm => (
                <button key={sm.id} onClick={() => setScrMode(sm.id)} style={{
                  padding:'12px 20px', background:'none', border:'none',
                  borderBottom: scrMode===sm.id ? '2px solid #E60012' : '2px solid transparent',
                  fontSize:'14px', fontWeight:'700',
                  color: scrMode===sm.id ? '#E60012' : 'rgba(0,0,0,0.55)',
                  cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'-1px'
                }}>{sm.label}</button>
              ))}
            </div>

            {/* 일정 검색 */}
            <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'14px' }}>
              <input value={scheduleSearch} onChange={e => setScheduleSearch(e.target.value)} placeholder={scrMode === 'change' ? '신청 검색 (선생님·사유·날짜)' : '학사일정 검색 (제목·학교·분류·내용)'} style={{ ...inputStyle, flex:1 }} />
              {scheduleSearch && <button onClick={() => setScheduleSearch('')} style={smallLightButtonStyle}>지우기</button>}
            </div>

            {/* 월 네비게이션 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <button onClick={() => shiftMonth(-1)} style={smallLightButtonStyle}>‹ 이전</button>
              <div style={{ fontSize:'18px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' }}>{monthLabel}</div>
              <button onClick={() => shiftMonth(1)} style={smallLightButtonStyle}>다음 ›</button>
            </div>

            {/* 달력 */}
            {(scrLoading || academicLoading) ? <div style={{ color:'#9ca3af' }}>불러오는 중...</div> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'24px' }}>
                {['일','월','화','수','목','금','토'].map((w,i) => (
                  <div key={w} style={{ textAlign:'center', padding:'8px 0', fontSize:'12px', fontWeight:'700', color: i===0 ? '#c82014' : i===6 ? '#1d4ed8' : '#374151', fontFamily:'Manrope, sans-serif' }}>{w}</div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={'e'+i} style={{ minHeight:'88px', background:'transparent' }} />;
                  const ds = dateStrOf(d);
                  const reqs = reqsByDate[ds] || [];
                  const acs = acByDate[ds] || [];
                  const holi = window.B2Utils.holidayName(ds);
                  const isToday = ds === todayStr;
                  const dow = (firstDay + d - 1) % 7;
                  const dColor = holi ? '#c82014' : (dow === 0 ? '#c82014' : dow === 6 ? '#1d4ed8' : '#111827');
                  function onCellClick() {
                    if (scrMode === 'change') openScrForm(ds);
                    else setAcademicDayOpen(ds);
                  }
                  return (
                    <button key={d} onClick={onCellClick} style={{
                      minHeight:'88px', textAlign:'left', padding:'6px 8px',
                      background: isToday ? '#fef3c7' : (holi ? '#fef2f2' : '#fff'),
                      border: isToday ? '2px solid #F8B500' : '1px solid #e5e7eb',
                      borderRadius:'8px', cursor:'pointer',
                      display:'flex', flexDirection:'column', gap:'3px',
                      fontFamily:'Manrope, sans-serif', overflow:'hidden'
                    }}>
                      <span style={{ fontSize:'13px', fontWeight:'700', color: dColor }}>{d}</span>
                      {holi && <span style={{ fontSize:'10px', fontWeight:'700', background:'#fee2e2', color:'#c82014', borderRadius:'4px', padding:'2px 5px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{holi}</span>}
                      {scrMode === 'change' ? (
                        <>
                          {reqs.slice(0,3).map((r,ri) => {
                            const mine = teacherInfo && r.teacher_id === ((user && user.id) || teacherInfo.id);
                            return (
                              <span key={ri} style={{
                                fontSize:'10px', fontWeight:'700',
                                background: mine ? '#E60012' : '#1A1A1A',
                                color:'#fff', borderRadius:'4px', padding:'2px 5px',
                                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                              }}>{r.teacher_name}</span>
                            );
                          })}
                          {reqs.length > 3 && <span style={{ fontSize:'10px', color:'#6b7280' }}>+{reqs.length-3}건</span>}
                        </>
                      ) : (
                        <>
                          {acs.slice(0,3).map((a,ai) => (
                            <span key={ai} style={{
                              fontSize:'10px', fontWeight:'700',
                              background: academicCategoryColor(a.category),
                              color:'#fff', borderRadius:'4px', padding:'2px 5px',
                              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                            }}>{a.school ? a.school + ' ' : ''}{a.title}</span>
                          ))}
                          {acs.length > 3 && <span style={{ fontSize:'10px', color:'#6b7280' }}>+{acs.length-3}건</span>}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 모드별 하단 영역 */}
            {scrMode === 'change' ? (() => {
              var q = scheduleSearch.trim().toLowerCase();
              var list = (scrRequests || []).filter(function(r){ if (!q) return true; return ((r.teacher_name||'') + ' ' + (r.reason||'') + ' ' + (r.target_date||'')).toLowerCase().indexOf(q) >= 0; });
              var sorted = list.slice().sort(function(a,b){ return String(b.target_date||'').localeCompare(String(a.target_date||'')); });
              return (
                <div style={{ marginTop:'8px' }}>
                  <details open={!!q}>
                    <summary style={{ cursor:'pointer', fontSize:'13px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' }}>{q ? ('검색 결과 (' + sorted.length + '건)') : ('신청 목록 펼치기 (' + sorted.length + '건)')}</summary>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px' }}>
                      {sorted.length === 0 ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>{q ? '검색 결과가 없습니다.' : '신청 내역이 없습니다.'}</div> : sorted.map(function(r){
                        return <div key={r.id} style={{ display:'flex', gap:'12px', padding:'12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', alignItems:'flex-start' }}>
                          <div style={{ minWidth:'90px', flexShrink:0, fontFamily:'Manrope, sans-serif' }}>
                            <div style={{ fontSize:'14px', fontWeight:'800', color:'#111827' }}>{String(r.target_date||'')}</div>
                            <div style={{ fontSize:'12px', fontWeight:'700', color:'#E60012', marginTop:'2px' }}>{r.teacher_name || '-'}</div>
                          </div>
                          <div style={{ flex:1, minWidth:0, fontFamily:'Manrope, sans-serif' }}>
                            <div style={{ fontSize:'13px', color:'#374151', whiteSpace:'pre-line', lineHeight:'1.6' }}>{r.reason}</div>
                            {r.file_path && <div style={{ marginTop:'4px' }}><a href={attachmentPublicUrl(r.file_path)} target="_blank" rel="noopener" style={{ fontSize:'12px', color:'#E60012', fontWeight:'700', textDecoration:'underline' }}>첨부 {(r.file_name || '파일')}</a></div>}
                            <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>신청일: {String(r.created_at||'').slice(0,16).replace('T',' ')}</div>
                          </div>
                        </div>;
                      })}
                    </div>
                  </details>
                </div>
              );
            })() : (() => {
              var q = scheduleSearch.trim().toLowerCase();
              var src = q ? (academicList || []) : academicInMonth;
              var list = src.filter(function(a){ if (!q) return true; return ((a.title||'') + ' ' + (a.school||'') + ' ' + (a.description||'') + ' ' + academicCategoryLabel(a.category) + ' ' + (a.start_date||'') + ' ' + (a.end_date||'')).toLowerCase().indexOf(q) >= 0; });
              var sorted = list.slice().sort(function(a,b){ return String(b.start_date||'').localeCompare(String(a.start_date||'')); });
              return (
                <div style={{ marginTop:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
                    <div style={{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>달력에서 <strong>날짜를 누르면</strong> 그 날 일정을 볼 수 있어요.{q ? '' : (' 이 달 학사일정 ' + academicInMonth.length + '건.')}</div>
                    <button onClick={() => openAcademicForm('')} style={buttonStyle}>+ 학사일정 추가</button>
                  </div>
                  <details open={!!q}>
                    <summary style={{ cursor:'pointer', fontSize:'13px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' }}>{q ? ('검색 결과 (' + sorted.length + '건)') : ('이 달 학사일정 목록 펼치기 (' + sorted.length + '건)')}</summary>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'10px' }}>
                      {sorted.length === 0 ? <div style={{ color:'#9ca3af', fontSize:'13px' }}>{q ? '검색 결과가 없습니다.' : '이 달에 등록된 학사일정이 없습니다.'}</div> : sorted.map(a => (
                        <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'2px' }}>
                              <span style={{ fontSize:'11px', fontWeight:'800', background: academicCategoryColor(a.category), color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' }}>{academicCategoryLabel(a.category)}</span>
                              {a.school && <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' }}>{a.school}</span>}
                              <span style={{ fontSize:'13px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' }}>{a.title}</span>
                            </div>
                            <div style={{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>{a.start_date} ~ {a.end_date}</div>
                            {a.description && <div style={{ fontSize:'13px', color:'#374151', marginTop:'4px', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif' }}>{a.description}</div>}
                            <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px', fontFamily:'Manrope, sans-serif' }}>{a.creator_name} · {String(a.created_at||'').slice(0,10)}</div>
                          </div>
                          <button onClick={() => deleteAcademicSchedule(a)} style={smallDangerButtonStyle}>삭제</button>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })()}

            {/* 학사일정: 날짜별 일정 보기 팝업 */}
            {academicDayOpen && (() => {
              var dayItems = (academicList || []).filter(function(a){ return String(a.start_date||'') <= academicDayOpen && String(a.end_date||'') >= academicDayOpen; });
              var dayHoli = window.B2Utils.holidayName(academicDayOpen);
              return (
                <div onClick={() => setAcademicDayOpen(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                      <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#111827', margin:0 }}>{academicDayOpen} 학사일정</h3>
                      <button onClick={() => setAcademicDayOpen(null)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                    </div>
                    {dayHoli && <div style={{ background:'#fee2e2', color:'#c82014', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'700', marginBottom:'12px' }}>공휴일 — {dayHoli}</div>}
                    {dayItems.length === 0 ? (
                      <div style={{ color:'#9ca3af', fontSize:'13px', padding:'8px 0 14px' }}>이 날 등록된 학사일정이 없습니다.</div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
                        {dayItems.map(a => (
                          <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'2px' }}>
                                <span style={{ fontSize:'11px', fontWeight:'800', background: academicCategoryColor(a.category), color:'#fff', borderRadius:'4px', padding:'2px 7px' }}>{academicCategoryLabel(a.category)}</span>
                                {a.school && <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151' }}>{a.school}</span>}
                                <span style={{ fontSize:'13px', fontWeight:'800', color:'#111827' }}>{a.title}</span>
                              </div>
                              <div style={{ fontSize:'12px', color:'#6b7280' }}>{a.start_date} ~ {a.end_date}</div>
                              {a.description && <div style={{ fontSize:'13px', color:'#374151', marginTop:'4px', whiteSpace:'pre-line' }}>{a.description}</div>}
                              <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>{a.creator_name} · {String(a.created_at||'').slice(0,10)}</div>
                            </div>
                            <button onClick={() => deleteAcademicSchedule(a)} style={smallDangerButtonStyle}>삭제</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { var d0 = academicDayOpen; setAcademicDayOpen(null); openAcademicForm(d0); }} style={{ ...buttonStyle, width:'100%' }}>+ 이 날 학사일정 추가</button>
                    <div style={{ marginTop:'8px' }}><button onClick={() => setAcademicDayOpen(null)} style={{ ...lightButtonStyle, width:'100%' }}>닫기</button></div>
                  </div>
                </div>
              );
            })()}

            {/* 강의일정 변경 신청 폼 모달 */}
            {scrFormOpen && (
              <div onClick={closeScrForm} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'460px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                    <h3 style={{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 }}>강의일정 변경 신청</h3>
                    <button onClick={closeScrForm} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                  </div>
                  <div style={{ fontSize:'13px', color:'#6b7280', marginBottom:'16px' }}>대상 날짜: <strong style={{ color:'#111827' }}>{scrSelectedDate}</strong></div>

                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>변경 사유 *</label>
                  <textarea value={scrDraft.reason} onChange={e => setScrDraft({ ...scrDraft, reason: e.target.value })} rows={4} placeholder="일정 변경이 필요한 사유를 입력해 주세요." style={{ ...inputStyle, resize:'vertical', marginBottom:'16px' }} />

                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>첨부서류 (선택)</label>
                  <input type="file" onChange={e => setScrDraft({ ...scrDraft, file: e.target.files?.[0] || null })} style={{ width:'100%', fontSize:'13px', marginBottom:'4px' }} />
                  {scrDraft.file && <div style={{ fontSize:'11px', color:'#6b7280', marginBottom:'16px' }}>{scrDraft.file.name} ({scrFormatBytes(scrDraft.file.size)})</div>}

                  <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
                    <button onClick={closeScrForm} style={{ ...lightButtonStyle, flex:1 }}>취소</button>
                    <button onClick={submitScheduleRequest} disabled={scrSubmitting} style={{ ...buttonStyle, flex:1, opacity: scrSubmitting ? 0.6 : 1, cursor: scrSubmitting ? 'not-allowed' : 'pointer' }}>{scrSubmitting ? '제출 중...' : '제출'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* 학사일정 추가 폼 모달 */}
            {academicFormOpen && (
              <div onClick={closeAcademicForm} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'480px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                    <h3 style={{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 }}>학사일정 추가</h3>
                    <button onClick={closeAcademicForm} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' }}>×</button>
                  </div>

                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>분류 *</label>
                  <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
                    {[{k:'vacation',l:'방학'},{k:'exam',l:'시험기간'},{k:'other',l:'기타'}].map(c => (
                      <button key={c.k} onClick={() => setAcademicDraft({ ...academicDraft, category: c.k })} style={{
                        flex:1, padding:'9px 0', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif',
                        background: academicDraft.category===c.k ? academicCategoryColor(c.k) : '#fff',
                        color: academicDraft.category===c.k ? '#fff' : '#374151',
                        border: '1px solid ' + (academicDraft.category===c.k ? academicCategoryColor(c.k) : '#d1d5db'),
                      }}>{c.l}</button>
                    ))}
                  </div>

                  {academicDraft.category === 'other' ? (<>
                    <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>제목 *</label>
                    <input value={academicDraft.title} onChange={e => setAcademicDraft({ ...academicDraft, title: e.target.value })} placeholder="예: 학교 행사, 개교기념일" style={{ ...inputStyle, marginBottom:'14px' }} />
                  </>) : (
                    <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>제목은 자동으로 "{academicCategoryLabel(academicDraft.category)}"으로 표시됩니다. (별도 입력 안 해도 됨)</div>
                  )}

                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>학교 (선택)</label>
                  <select value={academicDraft.school} onChange={e => setAcademicDraft({ ...academicDraft, school: e.target.value })} style={{ ...inputStyle, marginBottom:'14px' }}>
                    <option value="">학교 선택 안 함 (전체)</option>
                    {TP_NEARBY_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                    <div style={{ flex:1 }}>
                      <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>시작일 *</label>
                      <input type="date" value={academicDraft.start_date} onChange={e => setAcademicDraft({ ...academicDraft, start_date: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>종료일 *</label>
                      <input type="date" value={academicDraft.end_date} onChange={e => setAcademicDraft({ ...academicDraft, end_date: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>설명 (선택)</label>
                  <textarea value={academicDraft.description} onChange={e => setAcademicDraft({ ...academicDraft, description: e.target.value })} rows={3} placeholder="추가 안내사항이 있으면 입력해 주세요." style={{ ...inputStyle, resize:'vertical', marginBottom:'8px' }} />

                  <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                    <button onClick={closeAcademicForm} style={{ ...lightButtonStyle, flex:1 }}>취소</button>
                    <button onClick={submitAcademicSchedule} disabled={academicSubmitting} style={{ ...buttonStyle, flex:1, opacity: academicSubmitting ? 0.6 : 1, cursor: academicSubmitting ? 'not-allowed' : 'pointer' }}>{academicSubmitting ? '등록 중...' : '등록'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 탭7: 마이페이지 ── */}
      {teacherView === "mypage" && (
        <div style={{ ...cardStyle, marginBottom: "24px", maxWidth:'640px' }}>
          <h2 style={{ marginBottom: "4px" }}>마이페이지</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>본인의 정보를 직접 수정하실 수 있습니다.</p>
          {!profileDraft ? <div style={{ color:'#9ca3af' }}>불러오는 중...</div> : (
            <>
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>이메일 (변경 불가)</label>
                <input value={profileDraft.email} disabled style={{ ...inputStyle, background:'#f9fafb', color:'#9ca3af' }} />
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>이름</label>
                <input style={inputStyle} value={profileDraft.name} onChange={e => setProfileDraft({ ...profileDraft, name: e.target.value })} />
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>전화번호</label>
                <input style={inputStyle} value={profileDraft.phone} onChange={e => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
              </div>
              <div style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>주소</label>
                <input style={inputStyle} value={profileDraft.address} onChange={e => setProfileDraft({ ...profileDraft, address: e.target.value })} />
              </div>
              <button style={buttonStyle} onClick={saveMyProfile} disabled={savingProfile}>{savingProfile ? '저장 중...' : '정보 저장'}</button>

              <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'24px', paddingTop:'18px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:'800', marginBottom:'10px' }}>비밀번호 변경</h3>
                <input type="password" name="current-password" autoComplete="current-password" placeholder="현재 비밀번호" value={pwDraft.current} onChange={e => setPwDraft({ ...pwDraft, current: e.target.value })} style={{ ...inputStyle, marginBottom:'8px' }} />
                <input type="password" name="new-password" autoComplete="new-password" placeholder="새 비밀번호" value={pwDraft.next} onChange={e => setPwDraft({ ...pwDraft, next: e.target.value })} style={{ ...inputStyle, marginBottom:'8px' }} />
                <input type="password" name="new-password-confirm" autoComplete="new-password" placeholder="새 비밀번호 확인" value={pwDraft.confirm} onChange={e => setPwDraft({ ...pwDraft, confirm: e.target.value })} style={{ ...inputStyle, marginBottom:'10px' }} />
                <button style={lightButtonStyle} onClick={changeMyPassword}>비밀번호 변경</button>
              </div>

              <div style={{ borderTop:'1px solid #fef2f2', marginTop:'24px', paddingTop:'18px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:'800', marginBottom:'6px', color:'#c82014' }}>회원 탈퇴</h3>
                <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' }}>탈퇴 시 로그인이 차단되며 담당 강좌·기록 등은 계정이 비활성화 처리됩니다. 복구가 어려우니 신중히 결정해 주세요.</p>
                <button onClick={withdrawMyAccount} style={{ ...lightButtonStyle, background:'#fff', color:'#c82014', border:'1px solid #c82014', width:'100%' }}>회원 탈퇴</button>
              </div>
            </>
          )}
        </div>
      )}

      </>)}

      {/* 학부모 리포트 모달 (개별 학생) */}
      {reportStudentId && (() => {
        var sid = String(reportStudentId);
        var std = analysisAllStudents[sid] || {};
        var name = std.name || '학생';
        var grade = std.grade || '';
        var allScoresForStudent = (scoreAnalysis || []).filter(function(s){ return String(s.student_id) === sid; }).slice().sort(function(a,b){ return (a.test_date||'').localeCompare(b.test_date||''); });
        var last = allScoresForStudent[allScoresForStudent.length-1];
        var prev = allScoresForStudent[allScoresForStudent.length-2];
        var vals = allScoresForStudent.map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
        var avgPersonal = vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : null;
        var aiC = B2Utils.generateComment({
          studentName: name,
          score: last ? Number(last.score) : null,
          prevScore: prev ? Number(prev.score) : null,
          classAvg: null,
          recentTrend: vals,
          subject: last ? last.subject : '',
          testName: last ? last.test_name : ''
        });
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:'12px', padding:'24px', maxWidth:'640px', width:'100%', maxHeight:'90vh', overflowY:'auto' }} className="parent-report">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <h2 style={{ margin:0, fontFamily:'Manrope, sans-serif' }}>학부모 전달용 리포트</h2>
                <div style={{ display:'flex', gap:'6px' }} className="no-print">
                  <button style={smallLightButtonStyle} onClick={function(){ window.print(); }}>🖨 인쇄/PDF</button>
                  <button style={smallLightButtonStyle} onClick={function(){ setReportStudentId(''); }}>닫기</button>
                </div>
              </div>
              <div style={{ borderTop:'2px solid #E60012', paddingTop:'14px' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' }}>{name} {grade && <span style={{fontSize:'13px', color:'#6b7280', marginLeft:'8px'}}>{grade}</span>}</div>
                <div style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>발행일: {new Date().toISOString().slice(0,10)} · B2빅뱅학원</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' }}>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' }}>{last ? last.score+'점' : '-'}</div>
                    <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>최근 점수</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' }}>{avgPersonal != null ? avgPersonal.toFixed(1)+'점' : '-'}</div>
                    <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>개인 평균</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' }}>{allScoresForStudent.length}회</div>
                    <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>응시 횟수</div>
                  </div>
                </div>
                <div style={{ marginBottom:'14px' }}>
                  <div style={{ fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>개인 성적 추이</div>
                  {allScoresForStudent.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>등록된 점수가 없습니다.</div> : (
                    <svg viewBox={"0 0 600 160"} style={{ width:'100%', height:'160px', background:'#f9fafb', borderRadius:'8px' }}>
                      {(() => {
                        var w = 600, h = 160, padL = 40, padR = 20, padT = 16, padB = 30;
                        var ss = allScoresForStudent;
                        var n = ss.length;
                        var v = ss.map(function(s){ return Number(s.score); });
                        var xs = ss.map(function(_, i){ return n === 1 ? (w-padL-padR)/2 + padL : padL + i * ((w-padL-padR)/(n-1)); });
                        var ys = v.map(function(x){ return isNaN(x) ? null : (h - padB - (x / 100) * (h - padT - padB)); });
                        var pathD = '';
                        ys.forEach(function(y, i){ if (y != null) pathD += (pathD ? ' L ' : 'M ') + xs[i] + ',' + y; });
                        return (
                          <g>
                            {[0,50,100].map(function(g){
                              var y = h - padB - (g / 100) * (h - padT - padB);
                              return <g key={g}>
                                <line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={padL-4} y={y+4} textAnchor="end" fontSize="10" fill="#9ca3af">{g}</text>
                              </g>;
                            })}
                            <path d={pathD} fill="none" stroke="#E60012" strokeWidth="2.5" />
                            {ys.map(function(y, i){ return y == null ? null : (
                              <g key={i}>
                                <circle cx={xs[i]} cy={y} r="4" fill={colorForScore(v[i])} />
                                <text x={xs[i]} y={y-8} textAnchor="middle" fontSize="11" fontWeight="700" fill={colorForScore(v[i])}>{v[i]}</text>
                                <text x={xs[i]} y={h-padB+16} textAnchor="middle" fontSize="9" fill="#6b7280">{ss[i].test_name || '-'}</text>
                              </g>
                            ); })}
                          </g>
                        );
                      })()}
                    </svg>
                  )}
                </div>
                <div style={{ padding:'12px', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'8px' }}>
                  <div style={{ fontSize:'12px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>담당 선생님 코멘트</div>
                  <div style={{ fontSize:'13px', color:'#374151', lineHeight:'1.7', fontFamily:'Manrope, sans-serif' }}>{aiC}</div>
                </div>
                <div style={{ marginTop:'14px', fontSize:'11px', color:'#9ca3af', textAlign:'center', fontFamily:'Manrope, sans-serif' }}>본 리포트는 학습 지도 참고용입니다. 자세한 상담은 학원으로 문의해 주세요.</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 카카오 알림톡 미리보기 모달 */}
      {kakaoTarget && (() => {
        var items = (kakaoTarget.students || []).map(function(s){
          var sid = String(s.id);
          var std = analysisAllStudents[sid] || {};
          var lastScore = s.last ? Number(s.last.score) : null;
          var prevScore = s.prev ? Number(s.prev.score) : null;
          var allScores = (scoreAnalysis || []).filter(function(x){ return String(x.student_id) === sid; }).map(function(x){ return Number(x.score); }).filter(function(v){ return !isNaN(v); });
          var comment = B2Utils.generateComment({
            studentName: s.name || std.name,
            score: lastScore,
            prevScore: prevScore,
            classAvg: null,
            recentTrend: allScores,
            subject: s.last ? s.last.subject : '',
            testName: s.last ? s.last.test_name : ''
          });
          var msg = B2Utils.formatKakao({
            studentName: s.name || std.name,
            testName: s.last ? s.last.test_name : '-',
            testDate: s.last ? s.last.test_date : '-',
            score: lastScore,
            prevScore: prevScore,
            comment: comment
          });
          return {
            student_id: sid,
            parent_phone: std.parent_phone || std.phone || null,
            message_content: msg,
            test_score_id: s.last ? s.last.id : null,
          };
        });
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', maxWidth:'520px', width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <h3 style={{ margin:0, fontSize:'15px', fontFamily:'Manrope, sans-serif' }}>알림톡 발송 미리보기 ({items.length}명)</h3>
                <button style={{ background:'none', border:'none', fontSize:'18px', cursor:'pointer' }} onClick={function(){ setKakaoTarget(null); }}>×</button>
              </div>
              <div style={{ marginBottom:'10px', padding:'10px', background:'#fff7ed', borderRadius:'8px', fontSize:'12px', color:'#7a3e0c', fontFamily:'Manrope, sans-serif' }}>실제 카카오 알림톡 API 연동은 추후 진행됩니다. 지금은 발송 이력만 저장됩니다.</div>
              {items.map(function(it, i){
                var st = analysisAllStudents[it.student_id] || {};
                return (
                  <div key={i} style={{ marginBottom:'10px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>{st.name || '학생'} · {B2Utils.formatPhone(it.parent_phone) || '연락처 없음'}</div>
                    <pre style={{ margin:0, fontSize:'12px', color:'#374151', whiteSpace:'pre-wrap', fontFamily:'Manrope, sans-serif', lineHeight:'1.6', background:'#fef7e0', padding:'10px', borderRadius:'6px' }}>{it.message_content}</pre>
                  </div>
                );
              })}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'10px' }}>
                <button style={lightButtonStyle} onClick={function(){ setKakaoTarget(null); }}>취소</button>
                <button style={buttonStyle} onClick={async function(){ await sendKakaoNotifications(items); setKakaoTarget(null); }}>발송 이력 저장</button>
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}


window.TeacherPortal = TeacherPortal;
