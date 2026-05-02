function TeacherPortal({ user, onLogout, isAdmin, adminAuthed }) {
  const [teacherInfo, setTeacherInfo] = React.useState(null);
  const [classes, setClasses] = React.useState([]);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [students, setStudents] = React.useState([]);
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
  const [teacherView, setTeacherView] = React.useState("home");
  // 업무일지
  const [teacherNotes, setTeacherNotes] = React.useState([]);
  const [noteDraft, setNoteDraft] = React.useState({ date: new Date().toISOString().slice(0,10), content: '' });
  const [savingNote, setSavingNote] = React.useState(false);
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
  const [courseDraft, setCourseDraft] = React.useState({ title:'', description:'', subject:'', scope:'unassigned', class_id:'', level:'', grade:'', student_ids:[], picker_class_id:'' });
  const [creatingCourse, setCreatingCourse] = React.useState(false);
  // 사후 배포 편집
  const [distributeCourseId, setDistributeCourseId] = React.useState('');
  const [distributeDraft, setDistributeDraft] = React.useState({ scope:'unassigned', class_id:'', level:'', grade:'', student_ids:[], picker_class_id:'' });
  const [distributing, setDistributing] = React.useState(false);
  const [distEnrollments, setDistEnrollments] = React.useState([]); // 현재 강좌의 enrollments
  const [allStudents, setAllStudents] = React.useState([]);
  const [classStudentMap, setClassStudentMap] = React.useState({}); // { class_id: [students...] }

  // 영상 노출 기간 (강의 추가 폼)
  const [videoExpireDays, setVideoExpireDays] = React.useState(''); // '', '30', '45', '60'

  // 자료실
  const [attachments, setAttachments] = React.useState([]);
  const [attachLoading, setAttachLoading] = React.useState(false);
  const [attachUploading, setAttachUploading] = React.useState(false);
  const [attachDraft, setAttachDraft] = React.useState({ title:'', description:'', scope:'class', class_id:'', student_ids:[], course_id:'', video_id:'', file:null });

  // 마이페이지
  const [profileDraft, setProfileDraft] = React.useState(null);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [pwDraft, setPwDraft] = React.useState({ current:'', next:'', confirm:'' });

  const [testInfo, setTestInfo] = React.useState({
    testType: "주간평가",
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

    // 두 가지 시나리오:
    //  A) 학년 단위 공통: 초중고 + 학년 + 과목 (클래스 없음) → 해당 학년·과목 학생 전체에게 배정
    //  B) 특정 클래스 전용: 클래스 (필요 시 다른 필드는 클래스에서 자동 추론) → 그 반 학생만 배정
    const useClass = !!lectureClassId;
    if (!useClass) {
      if (!lectureLevel) { alert("초중고를 선택하거나 클래스를 선택해 주세요."); return; }
      if (!lectureGrade) { alert("학년을 선택하거나 클래스를 선택해 주세요."); return; }
      if (!lectureSubject) { alert("과목을 선택하거나 클래스를 선택해 주세요."); return; }
    }
    if (!courseName) { alert("강좌명을 입력해 주세요."); return; }
    if (!title) { alert("강의 제목을 입력해 주세요."); return; }
    if (!link) { alert("YouTube 링크 또는 영상 URL을 입력해 주세요."); return; }

    // 클래스 모드일 때 과목이 비어있으면 클래스의 subject로 보충 (강좌 매칭에 필요)
    let effectiveSubject = lectureSubject;
    if (useClass && !effectiveSubject) {
      const cls = (availableClassCards || []).find(c => String(c.id) === String(lectureClassId));
      effectiveSubject = (cls && cls.subject) || "";
    }

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
        if (lectureGrade && c.grade && c.grade !== lectureGrade) return false;
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
          // B) 특정 클래스 전용
          const { data: classLinks } = await sb.from("class_students").select("student_id").eq("class_id", lectureClassId);
          studentIds = (classLinks || []).map(l => l.student_id);
        } else {
          // A) 학년 단위 공통: 같은 학년 + (과목 배열에 포함) 인 학생 전체
          const { data: gradeStudents } = await sb.from("students").select("id, subjects").eq("grade", lectureGrade).eq("role", "student").eq("is_active", true);
          studentIds = (gradeStudents || [])
            .filter(s => Array.isArray(s.subjects) ? s.subjects.includes(lectureSubject) : true)
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

  async function selectClass(cls) {
    if (!cls) {
      setSelectedClass(null);
      setSelectedClassId("");
      setStudents([]);
      setSelectedStudentIds([]);
      setScores({});
      return;
    }

    setSelectedClass(cls);
    setSelectedClassId(String(cls.id));
    const matchedAssignment = assignmentFromClass(cls);
    if (matchedAssignment) setSelectedCourseAssignment(matchedAssignment);
    setStudents([]);
    setSelectedStudentIds([]);
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
    if (!testInfo.testName.trim()) { alert("시험명을 입력해 주세요."); return; }
    if (!testInfo.subject.trim()) { alert("과목을 선택해 주세요."); return; }
    if (!testInfo.testRange.trim()) { alert("시험 범위를 입력해 주세요."); return; }
    if (selectedStudentIds.length === 0) { alert("성적을 저장할 학생을 선택해 주세요."); return; }

    const selectedIdSet = new Set(selectedStudentIds);
    const rows = students
      .filter(s => selectedIdSet.has(s.id))
      .filter(s => String(scores[s.id] || "").trim() !== "")
      .map(s => ({
        student_id: s.id,
        teacher_id: teacherInfo.id,
        test_type: testInfo.testType,
        test_name: testInfo.testName.trim(),
        subject: testInfo.subject.trim(),
        test_range: testInfo.testRange.trim(),
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

  // ── 성적 분석 헬퍼 ──
  function gradeBucketOf(score) {
    var s = Number(score);
    if (isNaN(s)) return null;
    if (s >= 90) return 1; // 1등급
    if (s >= 80) return 2;
    if (s >= 70) return 3;
    return 0; // 미달
  }
  function distributionBucketOf(score) {
    var s = Number(score);
    if (isNaN(s)) return null;
    if (s >= 90) return '90-100';
    if (s >= 80) return '80-89';
    if (s >= 70) return '70-79';
    if (s >= 60) return '60-69';
    return '0-59';
  }
  function colorForScore(score) {
    var s = Number(score);
    if (isNaN(s)) return '#9ca3af';
    if (s >= 90) return '#006241';
    if (s >= 70) return '#cba258';
    return '#c82014';
  }
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

  // ── 강좌 개설 ──
  async function createCourse() {
    var d = courseDraft;
    if (!teacherInfo) { alert('선생님 정보를 불러올 수 없습니다.'); return; }
    if (!d.title.trim()) { alert('강좌명을 입력해 주세요.'); return; }
    if (!d.subject) { alert('과목을 선택해 주세요.'); return; }
    if (d.scope === 'class' && !d.class_id) { alert('클래스를 선택해 주세요.'); return; }
    if (d.scope === 'level' && (!d.level || !d.grade)) { alert('초중고/학년을 선택해 주세요.'); return; }
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
        grade: d.scope === 'level' ? d.grade : null,
        class_id: d.scope === 'class' ? d.class_id : null,
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
      setCourseDraft({ title:'', description:'', subject:'', scope:'unassigned', class_id:'', level:'', grade:'', student_ids:[], picker_class_id:'' });
      var msg = d.scope === 'unassigned'
        ? '강좌가 개설되었습니다. 배포 대상은 아래 "내 강좌" 목록에서 언제든 설정할 수 있습니다.'
        : '강좌가 개설되었습니다. "강의 추가" 탭에서 영상을 등록하세요.';
      alert(msg);
      if (d.scope !== 'unassigned') {
        setTeacherView('lecture');
        setLectureCourseName(mapped.title);
        if (d.scope === 'class') setLectureClassId(d.class_id);
        if (d.scope === 'level') { setLectureLevel(d.level); setLectureGrade(d.grade); }
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
      student_ids: studentIds,
    });
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
    if (d.scope === 'level' && (!d.level || !d.grade)) { alert('초중고/학년을 선택해 주세요.'); return; }
    if (d.scope === 'students' && d.student_ids.length === 0) { alert('1명 이상의 학생을 선택해 주세요.'); return; }
    setDistributing(true);
    try {
      var updates = {
        class_id: d.scope === 'class' ? d.class_id : null,
        level:    d.scope === 'level' ? d.level : null,
        grade:    d.scope === 'level' ? d.grade : null,
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
    try {
      sessionStorage.removeItem('b2_user');
      sessionStorage.removeItem('b2_is_admin');
      sessionStorage.removeItem('b2_admin_authed');
      sessionStorage.removeItem('b2_page');
    } catch (e) {}
    window.location.href = '/';
  }
  async function changeMyPassword() {
    if (!profileDraft || !profileDraft._row_id) { alert('계정 정보를 찾을 수 없습니다.'); return; }
    if (!pwDraft.current || !pwDraft.next) { alert('현재/새 비밀번호를 모두 입력해 주세요.'); return; }
    if (pwDraft.next !== pwDraft.confirm) { alert('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    var { data: row } = await sb.from('students').select('password_hash').eq('id', profileDraft._row_id).single();
    if (!row || row.password_hash !== pwDraft.current) { alert('현재 비밀번호가 맞지 않습니다.'); return; }
    var { error } = await sb.from('students').update({ password_hash: pwDraft.next }).eq('id', profileDraft._row_id);
    if (error) { alert('변경 실패: ' + error.message); return; }
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

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: "700",
    background: "#006241",
    color: "white",
  };

  const lightButtonStyle = {
    ...buttonStyle,
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb",
  };

  // 4탭 구조 렌더링
  const TABS = [
    { id: "classes",  label: "담당 클래스" },
    { id: "course",   label: "강좌 개설" },
    { id: "lecture",  label: "강의 추가" },
    { id: "notes",    label: "특이사항" },
    { id: "stats",    label: "성적 등록" },
    { id: "analysis", label: "성적 분석" },
    { id: "files",    label: "자료실" },
    { id: "mypage",   label: "마이페이지" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* 헤더 */}
      <div style={{ background: "#1E3932", padding: "20px 40px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "#fff", fontFamily: "Manrope, sans-serif" }}>선생님 페이지</h1>
        <p style={{ marginTop: "4px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "Manrope, sans-serif" }}>{teacherInfo?.name || user?.name} 선생님</p>
      </div>

      {/* 탭 네비 */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 0, overflowX: "auto" }}>
        {TABS.map(t =>
          <button key={t.id} onClick={() => { setTeacherView(t.id); if(t.id==="notes") loadNotes(); if(t.id==="analysis") loadScoreAnalysis(); if(t.id==="files") loadAttachments(); if(t.id==="mypage") loadMyProfile(); }}
            style={{ padding: "16px 24px", background: "none", border: "none", borderBottom: teacherView===t.id ? "2px solid #006241" : "2px solid transparent", fontSize: "14px", fontWeight: "700", color: teacherView===t.id ? "#006241" : "rgba(0,0,0,0.55)", cursor: "pointer", fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        )}
      </div>

      <div style={{ padding: "32px 40px", maxWidth: "960px", margin: "0 auto" }}>
      {loading ? <div style={{ color: "#6b7280" }}>불러오는 중...</div> : (<>

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
                  <button key={cls.id} onClick={() => selectClass(cls)} style={{ textAlign: "left", border: active ? "2px solid #006241" : "1px solid #e5e7eb", background: active ? "#f0fdf4" : "white", borderRadius: "12px", padding: "16px", cursor: "pointer" }}>
                    <strong style={{ display: "block", fontSize: "15px", color: "#111827", fontFamily: "Manrope, sans-serif" }}>{cls.name}</strong>
                  </button>
                );
              })}
            </div>
          )}

          {/* 선택된 클래스의 학생 목록 */}
          {selectedClass && students.length > 0 && (
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "12px", color: "#1E3932", fontFamily: "Manrope, sans-serif" }}>
                {selectedClass.name} · {students.length}명
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {students.map(s => (
                  <div key={s.id} style={{ background: "#f9fafb", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#d4e9e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: "#006241", fontFamily: "Manrope, sans-serif", flexShrink: 0 }}>{s.name[0]}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827", fontFamily: "Manrope, sans-serif" }}>{s.name}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "Manrope, sans-serif" }}>{[s.grade, s.school].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedClass && students.length === 0 && (
            <div style={{ color: "#6b7280", fontSize: "14px", marginTop: "12px" }}>이 클래스에 등록된 학생이 없습니다.</div>
          )}
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
                  { v:'level',      l:'학년 (초중고+학년)' },
                ].map(opt => (
                  <label key={opt.v} style={{ fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                    <input type="radio" checked={courseDraft.scope === opt.v} onChange={() => setCourseDraft({ ...courseDraft, scope: opt.v, class_id:'', level:'', grade:'', student_ids:[], picker_class_id:'' })} /> {opt.l}
                  </label>
                ))}
              </div>
              {courseDraft.scope === 'class' && (
                <select style={inputStyle} value={courseDraft.class_id} onChange={e => setCourseDraft({ ...courseDraft, class_id: e.target.value })}>
                  <option value="">클래스 선택</option>
                  {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              )}
              {courseDraft.scope === 'students' && (() => {
                var pickerClassId = courseDraft.picker_class_id;
                var pickerStudents = pickerClassId ? (classStudentMap[pickerClassId] || []) : [];
                var loadingThisClass = pickerClassId && !classStudentMap[pickerClassId];
                return (
                  <div>
                    <select style={{ ...inputStyle, marginBottom:'8px' }} value={pickerClassId} onChange={e => {
                      var cid = e.target.value;
                      setCourseDraft({ ...courseDraft, picker_class_id: cid });
                      if (cid) loadClassStudentsCached(cid);
                    }}>
                      <option value="">클래스를 선택하세요 (그 클래스 학생 중에서 개별 선택)</option>
                      {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                    </select>
                    {!pickerClassId ? (
                      <div style={{ fontSize:'12px', color:'#9ca3af', padding:'10px 12px', background:'#f9fafb', borderRadius:'8px', fontFamily:'Manrope, sans-serif' }}>위 드롭다운에서 클래스를 선택하면 그 반의 학생들이 표시됩니다.</div>
                    ) : (
                      <div style={{ maxHeight:'200px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px', background:'#fff' }}>
                        {loadingThisClass ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>학생 목록 불러오는 중...</div>
                          : pickerStudents.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>이 클래스에 등록된 학생이 없습니다.</div>
                          : (
                            <>
                              <div style={{ display:'flex', gap:'8px', marginBottom:'6px', borderBottom:'1px solid #f3f4f6', paddingBottom:'6px' }}>
                                <button type="button" style={{ ...lightButtonStyle, padding:'4px 10px', fontSize:'11px' }} onClick={() => {
                                  var ids = pickerStudents.map(s => s.id);
                                  var merged = Array.from(new Set(courseDraft.student_ids.concat(ids)));
                                  setCourseDraft({ ...courseDraft, student_ids: merged });
                                }}>이 반 전체 추가</button>
                                <button type="button" style={{ ...lightButtonStyle, padding:'4px 10px', fontSize:'11px' }} onClick={() => {
                                  var ids = pickerStudents.map(s => s.id);
                                  setCourseDraft({ ...courseDraft, student_ids: courseDraft.student_ids.filter(id => ids.indexOf(id) < 0) });
                                }}>이 반에서 모두 제외</button>
                              </div>
                              {pickerStudents.map(s => (
                                <label key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 6px', cursor:'pointer', fontSize:'12px', fontFamily:'Manrope, sans-serif' }}>
                                  <input type="checkbox" checked={courseDraft.student_ids.indexOf(s.id) >= 0} onChange={e => {
                                    var next = e.target.checked ? courseDraft.student_ids.concat([s.id]) : courseDraft.student_ids.filter(id => id !== s.id);
                                    setCourseDraft({ ...courseDraft, student_ids: next });
                                  }} />
                                  <span>{s.name}</span>
                                  {s.grade && <span style={{ color:'#9ca3af' }}>· {s.grade}</span>}
                                  {s.school && <span style={{ color:'#9ca3af' }}>· {s.school}</span>}
                                </label>
                              ))}
                            </>
                          )
                        }
                      </div>
                    )}
                    <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'6px', fontFamily:'Manrope, sans-serif' }}>총 <strong>{courseDraft.student_ids.length}명</strong> 선택됨 (여러 반에서 누적 선택 가능)</div>
                  </div>
                );
              })()}
              {courseDraft.scope === 'level' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <select style={inputStyle} value={courseDraft.level} onChange={e => setCourseDraft({ ...courseDraft, level: e.target.value, grade:'' })}>
                    <option value="">초중고 선택</option>
                    {Object.keys(LEVELS).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select style={inputStyle} value={courseDraft.grade} onChange={e => setCourseDraft({ ...courseDraft, grade: e.target.value })} disabled={!courseDraft.level}>
                    <option value="">학년 선택</option>
                    {(LEVELS[courseDraft.level] || []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button style={buttonStyle} onClick={createCourse} disabled={creatingCourse}>{creatingCourse ? '개설 중...' : '강좌 개설'}</button>

            {/* 내 강좌 목록 + 배포 설정 */}
            <div style={{ borderTop:'1px solid #e5e7eb', marginTop:'24px', paddingTop:'18px' }}>
              <h3 style={{ fontSize:'15px', fontWeight:'800', marginBottom:'8px' }}>내 강좌 · {(teacherCourses || []).length}개</h3>
              <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'12px', fontFamily:'Manrope, sans-serif' }}>이미 만든 강좌의 배포 대상을 변경할 수 있습니다.</p>
              {(teacherCourses || []).length === 0 ? (
                <div style={{ color:'#9ca3af', fontSize:'13px', padding:'16px', background:'#f9fafb', borderRadius:'8px', fontFamily:'Manrope, sans-serif' }}>아직 개설한 강좌가 없습니다.</div>
              ) : (
                (teacherCourses || []).map(c => (
                  <div key={c.id} style={{ border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:'200px' }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:'#1E3932', fontFamily:'Manrope, sans-serif' }}>{c.title}</div>
                        <div style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{[c.subject, describeCourseScope(c), (c.lectures||[]).length+'강'].filter(Boolean).join(' · ')}</div>
                      </div>
                      <button style={{ ...lightButtonStyle, padding:'6px 12px', fontSize:'12px' }} onClick={() => { if (String(distributeCourseId) === String(c.id)) setDistributeCourseId(''); else openDistributeEditor(c); }}>
                        {String(distributeCourseId) === String(c.id) ? '닫기' : '배포 설정'}
                      </button>
                    </div>

                    {String(distributeCourseId) === String(c.id) && (
                      <div style={{ marginTop:'12px', padding:'12px', background:'#f9fafb', borderRadius:'8px' }}>
                        <div style={{ display:'flex', gap:'12px', marginBottom:'10px', flexWrap:'wrap' }}>
                          {[
                            { v:'unassigned', l:'미정' },
                            { v:'class',      l:'클래스' },
                            { v:'students',   l:'개별 학생' },
                            { v:'level',      l:'학년' },
                          ].map(opt => (
                            <label key={opt.v} style={{ fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                              <input type="radio" checked={distributeDraft.scope === opt.v} onChange={() => setDistributeDraft({ ...distributeDraft, scope: opt.v, class_id:'', level:'', grade:'', student_ids: opt.v === 'students' ? distEnrollments.slice() : [], picker_class_id:'' })} /> {opt.l}
                            </label>
                          ))}
                        </div>
                        {distributeDraft.scope === 'class' && (
                          <select style={inputStyle} value={distributeDraft.class_id} onChange={e => setDistributeDraft({ ...distributeDraft, class_id: e.target.value })}>
                            <option value="">클래스 선택</option>
                            {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                          </select>
                        )}
                        {distributeDraft.scope === 'level' && (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                            <select style={inputStyle} value={distributeDraft.level} onChange={e => setDistributeDraft({ ...distributeDraft, level: e.target.value, grade:'' })}>
                              <option value="">초중고</option>
                              {['초등','중등','고등'].map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <select style={inputStyle} value={distributeDraft.grade} onChange={e => setDistributeDraft({ ...distributeDraft, grade: e.target.value })} disabled={!distributeDraft.level}>
                              <option value="">학년</option>
                              {({ '초등':['1학년','2학년','3학년','4학년','5학년','6학년'], '중등':['중1','중2','중3'], '고등':['고1','고2','고3'] }[distributeDraft.level] || []).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                        )}
                        {distributeDraft.scope === 'students' && (() => {
                          var pickerClassId = distributeDraft.picker_class_id;
                          var pickerStudents = pickerClassId ? (classStudentMap[pickerClassId] || []) : [];
                          var loadingThis = pickerClassId && !classStudentMap[pickerClassId];
                          return (
                            <div>
                              <select style={{ ...inputStyle, marginBottom:'8px' }} value={pickerClassId} onChange={e => {
                                var cid = e.target.value;
                                setDistributeDraft({ ...distributeDraft, picker_class_id: cid });
                                if (cid) loadClassStudentsCached(cid);
                              }}>
                                <option value="">클래스 선택 (그 반 학생 중에서 개별 선택)</option>
                                {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                              </select>
                              {!pickerClassId ? (
                                <div style={{ fontSize:'12px', color:'#9ca3af', padding:'10px 12px', background:'#fff', borderRadius:'8px', fontFamily:'Manrope, sans-serif' }}>클래스를 선택하면 그 반의 학생들이 표시됩니다.</div>
                              ) : (
                                <div style={{ maxHeight:'200px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px', background:'#fff' }}>
                                  {loadingThis ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>학생 목록 불러오는 중...</div>
                                    : pickerStudents.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>이 클래스에 등록된 학생이 없습니다.</div>
                                    : (
                                      <>
                                        <div style={{ display:'flex', gap:'8px', marginBottom:'6px', borderBottom:'1px solid #f3f4f6', paddingBottom:'6px' }}>
                                          <button type="button" style={{ ...lightButtonStyle, padding:'4px 10px', fontSize:'11px' }} onClick={() => {
                                            var ids = pickerStudents.map(s => s.id);
                                            var merged = Array.from(new Set(distributeDraft.student_ids.concat(ids)));
                                            setDistributeDraft({ ...distributeDraft, student_ids: merged });
                                          }}>이 반 전체 추가</button>
                                          <button type="button" style={{ ...lightButtonStyle, padding:'4px 10px', fontSize:'11px' }} onClick={() => {
                                            var ids = pickerStudents.map(s => s.id);
                                            setDistributeDraft({ ...distributeDraft, student_ids: distributeDraft.student_ids.filter(id => ids.indexOf(id) < 0) });
                                          }}>이 반에서 모두 제외</button>
                                        </div>
                                        {pickerStudents.map(s => (
                                          <label key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 6px', cursor:'pointer', fontSize:'12px', fontFamily:'Manrope, sans-serif' }}>
                                            <input type="checkbox" checked={distributeDraft.student_ids.indexOf(s.id) >= 0} onChange={e => {
                                              var next = e.target.checked ? distributeDraft.student_ids.concat([s.id]) : distributeDraft.student_ids.filter(id => id !== s.id);
                                              setDistributeDraft({ ...distributeDraft, student_ids: next });
                                            }} />
                                            <span>{s.name}</span>
                                            {s.grade && <span style={{ color:'#9ca3af' }}>· {s.grade}</span>}
                                            {s.school && <span style={{ color:'#9ca3af' }}>· {s.school}</span>}
                                          </label>
                                        ))}
                                      </>
                                    )
                                  }
                                </div>
                              )}
                              <div style={{ fontSize:'11px', color:'#6b7280', marginTop:'6px', fontFamily:'Manrope, sans-serif' }}>총 <strong>{distributeDraft.student_ids.length}명</strong> 선택됨 (여러 반에서 누적 선택 가능)</div>
                            </div>
                          );
                        })()}
                        {distributeDraft.scope === 'unassigned' && (
                          <div style={{ fontSize:'12px', color:'#6b7280', padding:'10px 12px', background:'#fff', borderRadius:'6px', fontFamily:'Manrope, sans-serif' }}>배포를 미정 상태로 두면 학생 화면에 노출되지 않습니다.</div>
                        )}
                        <div style={{ marginTop:'10px', display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                          <button style={{ ...lightButtonStyle, padding:'8px 14px', fontSize:'12px' }} onClick={() => setDistributeCourseId('')}>취소</button>
                          <button style={{ ...buttonStyle, padding:'8px 14px', fontSize:'12px' }} onClick={saveDistribution} disabled={distributing}>{distributing ? '저장 중...' : '배포 저장'}</button>
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
        // 두 시나리오 모두 허용:
        //  A) 학년 단위 공통: 초중고+학년+과목 모두 선택 (클래스 미선택)
        //  B) 특정 클래스 전용: 클래스 선택
        const classMode = !!lectureClassId;
        const gradeMode = !!(lectureLevel && lectureGrade && lectureSubject);
        const scopeOk = classMode || gradeMode;
        const ready = scopeOk && lectureCourseName.trim();
        // 클래스 모드에서 과목이 비어있으면 클래스의 subject로 추론
        const inferredClass = classMode ? (availableClassCards || []).find(c => String(c.id) === String(lectureClassId)) : null;
        const effectiveSubject = lectureSubject || (inferredClass && inferredClass.subject) || "";
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
              if (c.grade && cls.grade && c.grade !== cls.grade) return false;
            }
            return true;
          }
          // 학년/과목 모드: 클래스 전용 강좌는 제외
          if (c.class_id) return false;
          if (lectureLevel && c.level && c.level !== lectureLevel) return false;
          if (lectureGrade && c.grade && c.grade !== lectureGrade) return false;
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
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "20px" }}>학년 단위 공통 강의는 초중고 + 학년 + 과목을, 특정 반 전용은 클래스만 선택하시면 됩니다.</p>

            {/* 1. 상단 필터 (4개 드롭다운) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>초중고</label>
                <select style={inputStyle} value={lectureLevel} onChange={e => { setLectureLevel(e.target.value); setLectureGrade(""); }}>
                  <option value="">선택</option>
                  {Object.keys(LECTURE_GRADES).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>학년</label>
                <select style={inputStyle} value={lectureGrade} onChange={e => setLectureGrade(e.target.value)} disabled={!lectureLevel}>
                  <option value="">선택</option>
                  {(LECTURE_GRADES[lectureLevel] || []).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>과목</label>
                <select style={inputStyle} value={lectureSubject} onChange={e => setLectureSubject(e.target.value)}>
                  <option value="">선택</option>
                  {LECTURE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>클래스</label>
                <select style={inputStyle} value={lectureClassId} onChange={e => setLectureClassId(e.target.value)}>
                  <option value="">선택</option>
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
                    : "필터를 선택하면 그 조건에 맞는 강좌가 여기 표시됩니다."}
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "180px", overflowY: "auto", padding: "8px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #edf0f2" }}>
                  {courseSuggestions.map(name => {
                    const c = scopedCourses.find(x => clean(x.title) === clean(name));
                    const lectureCount = c ? (c.lectures || []).length : 0;
                    const active = clean(lectureCourseName) === clean(name);
                    return (
                      <button key={name} onClick={() => setLectureCourseName(name)}
                        style={{ background: active ? "#006241" : "#fff", color: active ? "#fff" : "#1E3932", border: active ? "2px solid #006241" : "1px solid #d6dbde", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "Manrope, sans-serif", display: "inline-flex", alignItems: "center", gap: "6px" }}>
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

            {/* 3. 강의 입력 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 130px auto", gap: "10px", alignItems: "end", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강의 제목</label>
                <input style={inputStyle} value={courseVideoTitle} onChange={e => setCourseVideoTitle(e.target.value)} placeholder="예: 명사" />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강의 링크</label>
                <input style={inputStyle} value={courseVideoLink} onChange={e => setCourseVideoLink(e.target.value)} placeholder="YouTube 링크/ID 또는 영상 URL" />
              </div>
              <div>
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
                <div style={{ background: "#1E3932", padding: "10px 14px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#006241", width: "30px", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{idx+1}강</span>
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
                        border: active ? "2px solid #006241" : "1px solid #e5e7eb",
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

      {/* ── 탭4: 성적 등록 ── */}
      {teacherView === "stats" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>성적 등록</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>대상 반을 선택하면 학생이 자동으로 표시됩니다.</p>

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
                  {["주간평가","월말평가","1학기 중간","1학기 기말","2학기 중간","2학기 기말"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={inputStyle} type="date" value={testInfo.testDate} onChange={e => setTestInfo(p => ({...p, testDate: e.target.value}))} />
                <select style={inputStyle} value={testInfo.subject} onChange={e => setTestInfo(p => ({...p, subject: e.target.value}))}>
                  <option value="">과목 선택</option>
                  {["국어","영어","수학","과학"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <select style={inputStyle} value={testInfo.testName} onChange={e => setTestInfo(p => ({...p, testName: e.target.value}))}>
                  <option value="">시험명 선택</option>
                  {["주간평가","월말평가","1학기 중간","1학기 기말","2학기 중간","2학기 기말"].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <input style={inputStyle} placeholder="시험 범위" value={testInfo.testRange} onChange={e => setTestInfo(p => ({...p, testRange: e.target.value}))} />
              </div>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>체크된 학생에게만 성적이 저장됩니다.</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <button style={lightButtonStyle} onClick={selectAllStudents}>전체 선택</button>
                <button style={lightButtonStyle} onClick={clearAllStudents}>전체 해제</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {students.map(s => {
                  const checked = selectedStudentIds.includes(s.id);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", border: checked ? "1px solid #006241" : "1px solid #e5e7eb", borderRadius: "10px", background: checked ? "#f0fdf4" : "white" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.id)} style={{ width: "16px", height: "16px" }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontFamily: "Manrope, sans-serif" }}>{s.name}</strong>
                        <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "Manrope, sans-serif" }}>{s.grade || "-"}</div>
                      </div>
                      <input style={{ ...inputStyle, width: "100px" }} type="number" placeholder="점수" value={scores[s.id] || ""} disabled={!checked} onChange={e => updateScore(s.id, e.target.value)} />
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
      {teacherView === "analysis" && (
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
              {["주간평가","월말평가","1학기 중간","1학기 기말","2학기 중간","2학기 기말"].map(n => <option key={n} value={n}>{n}</option>)}
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
            const cardVal = { fontSize:'18px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' };

            return (
              <>
                {/* 1) 요약 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={cardVal}>{lastAvg != null ? lastAvg.toFixed(1)+'점' : '-'}</div>
                    <div style={cardLabel}>이번 시험 평균</div>
                    {avgChange != null && (
                      <div style={{ fontSize:'11px', marginTop:'4px', fontWeight:'700', color: avgChange >= 0 ? '#006241' : '#c82014', fontFamily:'Manrope, sans-serif' }}>
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
                    { label:'1등급(90+)', val: buckets.g1, color:'#006241' },
                    { label:'2등급(80+)', val: buckets.g2, color:'#2b5148' },
                    { label:'3등급(70+)', val: buckets.g3, color:'#cba258' },
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
                        var color = l === '90-100' ? '#006241' : l === '80-89' ? '#2b5148' : l === '70-79' ? '#cba258' : l === '60-69' ? '#dd6b20' : '#c82014';
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
                            <path d={pathD} fill="none" stroke="#006241" strokeWidth="2.5" />
                            {ys.map(function(y, i){ return y == null ? null : (
                              <g key={i}>
                                <circle cx={xs[i]} cy={y} r="4" fill="#006241" />
                                <text x={xs[i]} y={y-8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#006241">{avgs[i].toFixed(1)}</text>
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
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#006241', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>📈 가장 많이 오른 학생 TOP 3</div>
                      {topUp.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        topUp.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#006241', fontWeight:'700'}}>+{s.change.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#c82014', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>📉 가장 많이 떨어진 학생 TOP 3</div>
                      {topDown.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        topDown.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#c82014', fontWeight:'700'}}>{s.change.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#006241', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>⭐ 꾸준히 상위권 유지</div>
                      {stars.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        stars.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name} <span style={{color:'#006241', fontWeight:'700'}}>평균 {s.avg.toFixed(1)}점</span></div>; })
                      }
                    </div>
                    <div style={{ background:'#fff7ed', borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:'#c2410c', marginBottom:'8px', fontFamily:'Manrope, sans-serif' }}>⚠️ 최근 3회 연속 하락 (관리 필요)</div>
                      {watch.length === 0 ? <div style={{ fontSize:'12px', color:'#9ca3af' }}>해당 없음</div> :
                        watch.map(function(s){ return <div key={s.id} style={{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' }}>{s.name}</div>; })
                      }
                    </div>
                  </div>
                  <div style={{ marginTop:'10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>학생별 평균 누적 순위</div>
                    {ranked.map(function(s, i){ return (
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', borderBottom: i < ranked.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                        <span style={{ width:'24px', fontSize:'12px', fontWeight:'700', color: i<3?'#006241':'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{i+1}위</span>
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
                            <path d={pathD} fill="none" stroke="#cba258" strokeWidth="2.5" />
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
                  <button style={{ ...lightButtonStyle, padding:'8px 14px', fontSize:'12px' }} onClick={function(){ setKakaoTarget({ mode:'bulk', students: rows.map(function(r){ return { id:r.id, name:r.name, last:r.last, prev:r.prev }; }) }); }}>📨 전체 학부모 일괄 발송</button>
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
                      <div style={{ background: '#1E3932', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}>{r.name}</span>
                          {r.grade && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '8px', fontFamily: 'Manrope, sans-serif' }}>{r.grade}</span>}
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginLeft: '12px', fontFamily: 'Manrope, sans-serif' }}>{r.scores.length}회 · 평균 {r.avg != null ? r.avg.toFixed(1)+'점' : '-'}</span>
                        </div>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button style={{ background:'#fff', color:'#1E3932', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }} onClick={function(){ setReportStudentId(r.id); }}>📄 학부모 리포트</button>
                          <button style={{ background:'#cba258', color:'#fff', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }} onClick={function(){ setKakaoTarget({ mode:'single', students:[{ id:r.id, name:r.name, last:r.last, prev:r.prev }] }); }}>📨 알림톡</button>
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
                              <div style={{ fontSize:'11px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>🤖 AI 자동 코멘트 (학부모 전달용)</div>
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
                  <div style={{ fontSize:'14px', fontWeight:'800', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' }}>📋 시험지 분석</div>
                  <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' }}>문제별 정답률 · 유형별 취약점 · 학생별 약점 개념 · 학습 우선순위 제안</div>
                  <button disabled style={{ background:'#e5e7eb', color:'#9ca3af', border:'none', borderRadius:'6px', padding:'8px 16px', fontSize:'12px', fontWeight:'700', cursor:'not-allowed', fontFamily:'Manrope, sans-serif' }}>시험지 PDF 업로드 (준비 중)</button>
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'8px', fontFamily:'Manrope, sans-serif' }}>시험지 분석 기능은 준비 중입니다.</div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── 탭6: 자료실 ── */}
      {teacherView === "files" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>자료실</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>학생들에게 학습 자료를 첨부파일로 전달할 수 있습니다.</p>

          <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'16px', marginBottom:'18px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:'800', marginBottom:'10px' }}>새 자료 업로드</h3>
            <div style={{ marginBottom:'10px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>제목</label>
              <input style={inputStyle} value={attachDraft.title} onChange={e => setAttachDraft({ ...attachDraft, title: e.target.value })} placeholder="예: 1주차 영어 단어 정리" />
            </div>
            <div style={{ marginBottom:'10px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>설명 (선택)</label>
              <textarea style={{ ...inputStyle, minHeight:'60px', resize:'vertical' }} value={attachDraft.description} onChange={e => setAttachDraft({ ...attachDraft, description: e.target.value })} placeholder="자료 내용에 대한 간단한 설명" />
            </div>
            <div style={{ marginBottom:'10px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>받는 대상</label>
              <div style={{ display:'flex', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
                <label style={{ fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                  <input type="radio" checked={attachDraft.scope === 'class'} onChange={() => setAttachDraft({ ...attachDraft, scope:'class', student_ids:[], course_id:'', video_id:'' })} /> 클래스 전체
                </label>
                <label style={{ fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                  <input type="radio" checked={attachDraft.scope === 'student'} onChange={() => setAttachDraft({ ...attachDraft, scope:'student', class_id:'', course_id:'', video_id:'' })} /> 개별 학생 선택
                </label>
                <label style={{ fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>
                  <input type="radio" checked={attachDraft.scope === 'video'} onChange={() => setAttachDraft({ ...attachDraft, scope:'video', class_id:'', student_ids:[] })} /> 특정 강의
                </label>
              </div>
              {attachDraft.scope === 'class' ? (
                <select style={inputStyle} value={attachDraft.class_id} onChange={e => setAttachDraft({ ...attachDraft, class_id: e.target.value })}>
                  <option value="">클래스 선택</option>
                  {(availableClassCards || []).map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              ) : attachDraft.scope === 'video' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <select style={inputStyle} value={attachDraft.course_id} onChange={e => setAttachDraft({ ...attachDraft, course_id: e.target.value, video_id:'' })}>
                    <option value="">강좌 선택</option>
                    {(teacherCourses || []).map(c => <option key={c.id} value={c.id}>{c.title || c.name}</option>)}
                  </select>
                  <select style={inputStyle} value={attachDraft.video_id} onChange={e => setAttachDraft({ ...attachDraft, video_id: e.target.value })} disabled={!attachDraft.course_id}>
                    <option value="">{attachDraft.course_id ? '강의 영상 선택' : '먼저 강좌를 선택하세요'}</option>
                    {(() => {
                      var c = (teacherCourses || []).find(x => String(x.id) === String(attachDraft.course_id));
                      var lectures = (c && c.lectures) || [];
                      return lectures.map(v => <option key={v.id} value={v.id}>{v.title || '제목 없음'}</option>);
                    })()}
                  </select>
                </div>
              ) : (
                <div style={{ maxHeight:'160px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px', background:'#fff' }}>
                  {(students || []).length === 0 ? (
                    <div style={{ fontSize:'12px', color:'#9ca3af' }}>담당 클래스를 먼저 선택해 학생 목록을 불러와 주세요.</div>
                  ) : (students || []).map(s => (
                    <label key={s.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 6px', cursor:'pointer', fontSize:'12px', fontFamily:'Manrope, sans-serif' }}>
                      <input type="checkbox" checked={attachDraft.student_ids.indexOf(s.id) >= 0} onChange={e => {
                        var next = e.target.checked ? attachDraft.student_ids.concat([s.id]) : attachDraft.student_ids.filter(id => id !== s.id);
                        setAttachDraft({ ...attachDraft, student_ids: next });
                      }} />
                      <span>{s.name}</span>
                      {s.grade && <span style={{ color:'#9ca3af' }}>· {s.grade}</span>}
                    </label>
                  ))}
                  <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>{attachDraft.student_ids.length}명 선택됨</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' }}>파일</label>
              <input type="file" onChange={e => setAttachDraft({ ...attachDraft, file: e.target.files[0] || null })} style={{ fontFamily:'Manrope, sans-serif' }} />
              {attachDraft.file && <span style={{ fontSize:'12px', color:'#6b7280', marginLeft:'10px' }}>{attachDraft.file.name} · {formatBytes(attachDraft.file.size)}</span>}
            </div>
            <button style={buttonStyle} onClick={uploadAttachment} disabled={attachUploading}>{attachUploading ? '업로드 중...' : '업로드'}</button>
          </div>

          <h3 style={{ fontSize:'14px', fontWeight:'800', marginBottom:'10px' }}>업로드한 자료 · {attachments.length}개</h3>
          {attachLoading ? <div style={{ color:'#9ca3af' }}>불러오는 중...</div> :
            attachments.length === 0 ? <div style={{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Manrope, sans-serif' }}>아직 업로드한 자료가 없습니다.</div> :
            attachments.map(att => {
              var clsName = att.class_id ? ((availableClassCards||[]).find(c => String(c.id) === String(att.class_id))||{}).name : '';
              var videoLabel = '';
              if (att.video_id) {
                for (var i = 0; i < (teacherCourses || []).length; i++) {
                  var found = ((teacherCourses[i].lectures) || []).find(v => String(v.id) === String(att.video_id));
                  if (found) { videoLabel = (teacherCourses[i].title || teacherCourses[i].name || '강좌') + ' · ' + (found.title || '강의'); break; }
                }
                if (!videoLabel) videoLabel = '강의 (삭제됨)';
              }
              var scopeText = att.scope === 'class' ? ('클래스: ' + (clsName || '-'))
                : att.scope === 'video' ? ('강의: ' + videoLabel)
                : '개별 학생';
              return (
                <div key={att.id} style={{ border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:'200px' }}>
                    <div style={{ fontSize:'13px', fontWeight:'700', color:'#1E3932', fontFamily:'Manrope, sans-serif' }}>{att.title}</div>
                    {att.description && <div style={{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>{att.description}</div>}
                    <div style={{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' }}>{[scopeText, att.file_name, formatBytes(att.file_size), String(att.created_at||'').slice(0,10)].filter(Boolean).join(' · ')}</div>
                  </div>
                  <a href={attachmentPublicUrl(att.file_path)} target="_blank" rel="noopener" style={{ background:'#fff', color:'#006241', border:'1px solid #006241', textDecoration:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', fontFamily:'Manrope, sans-serif' }}>⬇ 다운로드</a>
                  <button onClick={() => deleteAttachment(att)} style={{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }}>삭제</button>
                </div>
              );
            })
          }
        </div>
      )}

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
                <input type="password" placeholder="현재 비밀번호" value={pwDraft.current} onChange={e => setPwDraft({ ...pwDraft, current: e.target.value })} style={{ ...inputStyle, marginBottom:'8px' }} />
                <input type="password" placeholder="새 비밀번호" value={pwDraft.next} onChange={e => setPwDraft({ ...pwDraft, next: e.target.value })} style={{ ...inputStyle, marginBottom:'8px' }} />
                <input type="password" placeholder="새 비밀번호 확인" value={pwDraft.confirm} onChange={e => setPwDraft({ ...pwDraft, confirm: e.target.value })} style={{ ...inputStyle, marginBottom:'10px' }} />
                <button style={lightButtonStyle} onClick={changeMyPassword}>비밀번호 변경</button>
              </div>

              <div style={{ borderTop:'1px solid #fef2f2', marginTop:'24px', paddingTop:'18px' }}>
                <h3 style={{ fontSize:'14px', fontWeight:'800', marginBottom:'6px', color:'#c82014' }}>회원 탈퇴</h3>
                <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' }}>탈퇴 시 로그인이 차단되며 담당 강좌·기록 등은 계정이 비활성화 처리됩니다. 복구가 어려우니 신중히 결정해 주세요.</p>
                <button onClick={withdrawMyAccount} style={{ background:'#fff', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' }}>회원 탈퇴</button>
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
                  <button style={{ ...lightButtonStyle, padding:'6px 12px', fontSize:'12px' }} onClick={function(){ window.print(); }}>🖨 인쇄/PDF</button>
                  <button style={{ ...lightButtonStyle, padding:'6px 12px', fontSize:'12px' }} onClick={function(){ setReportStudentId(''); }}>닫기</button>
                </div>
              </div>
              <div style={{ borderTop:'2px solid #006241', paddingTop:'14px' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color:'#1E3932', fontFamily:'Manrope, sans-serif' }}>{name} {grade && <span style={{fontSize:'13px', color:'#6b7280', marginLeft:'8px'}}>{grade}</span>}</div>
                <div style={{ fontSize:'12px', color:'#9ca3af', marginBottom:'14px', fontFamily:'Manrope, sans-serif' }}>발행일: {new Date().toISOString().slice(0,10)} · B2빅뱅학원</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' }}>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' }}>{last ? last.score+'점' : '-'}</div>
                    <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>최근 점수</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' }}>{avgPersonal != null ? avgPersonal.toFixed(1)+'점' : '-'}</div>
                    <div style={{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' }}>개인 평균</div>
                  </div>
                  <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' }}>{allScoresForStudent.length}회</div>
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
                            <path d={pathD} fill="none" stroke="#006241" strokeWidth="2.5" />
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
                    <div style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' }}>{st.name || '학생'} · {it.parent_phone || '연락처 없음'}</div>
                    <pre style={{ margin:0, fontSize:'12px', color:'#374151', whiteSpace:'pre-wrap', fontFamily:'Manrope, sans-serif', lineHeight:'1.6', background:'#fef7e0', padding:'10px', borderRadius:'6px' }}>{it.message_content}</pre>
                  </div>
                );
              })}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'10px' }}>
                <button style={{ ...lightButtonStyle, padding:'8px 14px', fontSize:'12px' }} onClick={function(){ setKakaoTarget(null); }}>취소</button>
                <button style={{ ...buttonStyle, padding:'8px 14px', fontSize:'12px' }} onClick={async function(){ await sendKakaoNotifications(items); setKakaoTarget(null); }}>📨 발송 이력 저장</button>
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
