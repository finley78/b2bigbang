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
  const [savingOnline, setSavingOnline] = React.useState(false);
  const [teacherView, setTeacherView] = React.useState("home");
  // 업무일지
  const [teacherNotes, setTeacherNotes] = React.useState([]);
  const [noteDraft, setNoteDraft] = React.useState({ date: new Date().toISOString().slice(0,10), type: '특이사항', studentId: '', content: '' });
  const [savingNote, setSavingNote] = React.useState(false);
  // 성적 현황/통계
  const [scoreHistory, setScoreHistory] = React.useState([]);
  const [statsClassId, setStatsClassId] = React.useState('');
  const [statsStudentId, setStatsStudentId] = React.useState('');
  const [loadingStats, setLoadingStats] = React.useState(false);

  const [testInfo, setTestInfo] = React.useState({
    reportPeriod: "주간",
    testType: "주간 성적표",
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
    setTestInfo((prev) => ({
      ...prev,
      testType: `${prev.reportPeriod} 성적표`,
    }));
  }, [testInfo.reportPeriod]);

  React.useEffect(() => {
    const assignments = getTeacherAssignments();
    if (!selectedCourseAssignment && assignments.length > 0) {
      setSelectedCourseAssignment(assignments[0]);
    }
  }, [teacherInfo]);

  function clean(value) {
    return String(value || "").trim().toLowerCase();
  }

  function extractYoutubeId(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    if (match && match[1]) return match[1];
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return raw;
    return raw;
  }

  function lectureVideoUrl(video) {
    const raw = String((video && (video.video_url || video.youtube_id)) || "").trim();
    if (!raw) return "";
    if (/youtube\.com|youtu\.be/i.test(raw)) return raw;
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return "https://www.youtube.com/watch?v=" + raw;
    return raw;
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
      lectures: (course.videos || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((video) => ({
        id: video.id,
        title: video.title || "",
        youtubeId: video.youtube_id || "",
        videoUrl: lectureVideoUrl(video),
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
      .order("name", { ascending: true });

    if (classError) {
      setDebug("classes 조회 오류: " + classError.message);
      setLoading(false);
      return;
    }

    setClasses(classList || []);

    // 관리자가 배정한 학년 기반 가상 클래스 생성 (과목-학교급 학년 형식)
    const gradeRaw = (mergedTeacher.grade || "").split(",").map(s => s.trim()).filter(Boolean);
    const virtualClasses = [];
    gradeRaw.forEach(function(assignment, idx) {
      // "영어-고등 1학년" 또는 "고등 1학년" 형식 처리
      const dashIdx = assignment.indexOf("-");
      let subject = "", grade = assignment;
      if (dashIdx > 0) {
        subject = assignment.substring(0, dashIdx).trim();
        grade = assignment.substring(dashIdx + 1).trim();
      }
      const virtualName = subject ? `${subject} ${grade}` : grade;
      // 실제 classes에 같은 이름이 없을 때만 추가
      const alreadyExists = (classList || []).some(c =>
        c.name === virtualName ||
        (c.subject === subject && c.grade === grade)
      );
      if (!alreadyExists && virtualName) {
        virtualClasses.push({
          id: `virt_${idx}`,
          name: virtualName,
          subject: subject,
          grade: grade,
          teacher_id: teacher.id,
          isVirtual: true,
        });
      }
    });

    const mergedClasses = [...(classList || []), ...virtualClasses];
    setClasses(mergedClasses);
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

  // 선택한 강좌에 영상 직접 추가 (강좌는 teacherCourses에서 선택)
  async function addVideoToCourse() {
    const courseId = selectedCourseId;
    const title = String(courseVideoTitle || "").trim();
    const link = String(courseVideoLink || "").trim();

    if (!courseId) { alert("강좌를 선택해 주세요."); return; }
    if (!title) { alert("영상 제목을 입력해 주세요."); return; }
    if (!link) { alert("YouTube 링크 또는 영상 URL을 입력해 주세요."); return; }

    setSavingOnline(true);
    try {
      const target = teacherCourses.find((c) => String(c.id) === String(courseId));
      const nextOrder = (target?.lectures || []).length + 1;
      const { data: video, error: videoError } = await sb
        .from("videos")
        .insert({ course_id: courseId, title, youtube_id: extractYoutubeId(link), sort_order: nextOrder })
        .select()
        .single();

      if (videoError) throw videoError;

      const lecture = { id: video.id, title: video.title, youtubeId: video.youtube_id || "", videoUrl: lectureVideoUrl(video) };
      setTeacherCourses((prev) => prev.map((c) =>
        String(c.id) === String(courseId) ? { ...c, lectures: [...(c.lectures || []), lecture] } : c
      ));
      setCourseVideoTitle("");
      setCourseVideoLink("");
      alert("강의가 등록되었습니다.");

      // 이 강좌의 담당 클래스 학생들에게 자동 수강 배정
      try {
        for (var i = 0; i < classes.length; i++) {
          var cls = classes[i];
          var { data: classLinks } = await sb.from("class_students").select("student_id").eq("class_id", cls.id);
          if (classLinks && classLinks.length > 0) {
            var studentIds = classLinks.map(function(l) { return l.student_id; });
            var { data: existing } = await sb.from("enrollments").select("student_id").eq("course_id", courseId).in("student_id", studentIds);
            var alreadySet = new Set((existing||[]).map(function(e){ return e.student_id; }));
            var toAdd = studentIds.filter(function(sid){ return !alreadySet.has(sid); });
            if (toAdd.length > 0) {
              await sb.from("enrollments").insert(toAdd.map(function(sid){ return { student_id: sid, course_id: courseId }; }));
            }
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
        ? { ...course, lectures: [...(course.lectures || []), { id: data.id, title: data.title, youtubeId: data.youtube_id || "", videoUrl: lectureVideoUrl(data) }] }
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
          if (field === "youtubeId") next.videoUrl = lectureVideoUrl({ youtube_id: value });
          return next;
        }),
      };
    }));

    if (!saveToDB) return;
    const payload = field === "title" ? { title: value } : { youtube_id: extractYoutubeId(value) };
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
    { id: "classes", label: "담당 클래스" },
    { id: "lecture", label: "강의 추가" },
    { id: "notes",   label: "특이사항" },
    { id: "stats",   label: "성적 현황" },
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
          <button key={t.id} onClick={() => { setTeacherView(t.id); if(t.id==="stats") loadScoreHistory(); if(t.id==="notes") loadNotes(); }}
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
                    <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px", color: "#111827", fontFamily: "Manrope, sans-serif" }}>{cls.name}</strong>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontFamily: "Manrope, sans-serif" }}>{cls.subject || ""}{cls.grade ? ` / ${cls.grade}` : ""}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 선택된 클래스의 학생 목록 */}
          {selectedClass && students.length > 0 && (
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "12px", color: "#1E3932", fontFamily: "Manrope, sans-serif" }}>
                {classLabel(selectedClass)} · {students.length}명
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

      {/* ── 탭2: 강의 추가 ── */}
      {teacherView === "lecture" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "16px" }}>강의 추가</h2>
          {teacherCourses.length === 0 ? (
            <div style={{ color: "#6b7280", padding: "16px", background: "#f9fafb", borderRadius: "10px" }}>
              배정된 강좌가 없습니다. 관리자 페이지에서 담당 강좌를 먼저 배정해 주세요.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강좌 선택</label>
                <select style={inputStyle} value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                  <option value="">강좌를 선택해 주세요</option>
                  {teacherCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}{course.subject ? ` / ${course.subject}` : ""}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>영상 제목</label>
                  <input style={inputStyle} value={courseVideoTitle} onChange={e => setCourseVideoTitle(e.target.value)} placeholder="예: 4월 3주차 문법 강의" />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>영상 링크</label>
                  <input style={inputStyle} value={courseVideoLink} onChange={e => setCourseVideoLink(e.target.value)} placeholder="YouTube 링크/ID 또는 영상 URL" />
                </div>
                <button style={buttonStyle} onClick={addVideoToCourse} disabled={savingOnline}>{savingOnline ? "저장 중..." : "강의 저장"}</button>
              </div>
            </div>
          )}

          {/* 등록된 강의 목록 */}
          {teacherCourses.filter(c => (c.lectures||[]).length > 0).map(course => (
            <div key={course.id} style={{ marginTop: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#006241", marginBottom: "10px", fontFamily: "Manrope, sans-serif" }}>
                {course.title} ({(course.lectures||[]).length}강)
              </div>
              {(course.lectures||[]).map((lec, idx) => (
                <div key={lec.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#006241", width: "30px", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{idx+1}강</span>
                  <span style={{ fontSize: "14px", color: "#374151", flex: 1, fontFamily: "Manrope, sans-serif" }}>{lec.title}</span>
                  <button onClick={() => deleteLecture(course.id, lec.id)} style={{ background: "none", border: "none", color: "#c82014", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── 탭3: 특이사항 (전체 학생 대상, 클래스 무관) ── */}
      {teacherView === "notes" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>특이사항 기록</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "20px" }}>담당 학생들의 특이사항, 상담 내용 등을 기록합니다.</p>

          {/* 작성 폼 */}
          <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>날짜</label>
                <input style={inputStyle} type="date" value={noteDraft.date} onChange={e => setNoteDraft(p => ({...p, date: e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>유형</label>
                <select style={inputStyle} value={noteDraft.type} onChange={e => setNoteDraft(p => ({...p, type: e.target.value}))}>
                  {["특이사항","학습태도","상담","과제","기타"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>학생 (선택)</label>
                <select style={inputStyle} value={noteDraft.studentId} onChange={e => setNoteDraft(p => ({...p, studentId: e.target.value}))}>
                  <option value="">전체/미지정</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "4px" }}>내용</label>
              <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical", lineHeight: "1.6" }}
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

      {/* ── 탭4: 성적 현황 ── */}
      {teacherView === "stats" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>성적 현황</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>본인이 등록한 성적만 표시됩니다.</p>

          {/* 성적 등록 */}
          <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px", color: "#1E3932", fontFamily: "Manrope, sans-serif" }}>성적 등록</h3>
            {!selectedClass && (
              <p style={{ fontSize: "13px", color: "#c82014", margin: 0, fontFamily: "Manrope, sans-serif" }}>먼저 담당 클래스 탭에서 클래스를 선택해 주세요.</p>
            )}
            {selectedClass && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <select style={inputStyle} value={testInfo.testType} onChange={e => setTestInfo(p => ({...p, testType: e.target.value}))}>
                    {["주간 성적표","월간 성적표","단원 평가","모의고사","수행평가","기타"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input style={inputStyle} type="date" value={testInfo.testDate} onChange={e => setTestInfo(p => ({...p, testDate: e.target.value}))} />
                  <select style={inputStyle} value={testInfo.subject} onChange={e => setTestInfo(p => ({...p, subject: e.target.value}))}>
                    <option value="">과목 선택</option>
                    {["국어","영어","수학","과학"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <input style={inputStyle} placeholder="시험명" value={testInfo.testName} onChange={e => setTestInfo(p => ({...p, testName: e.target.value}))} />
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

          {/* 성적 현황 */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <select style={{ ...inputStyle, maxWidth: "200px" }} value={statsStudentId} onChange={e => setStatsStudentId(e.target.value)}>
              <option value="">전체 학생</option>
              {students.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
            <button style={lightButtonStyle} onClick={loadScoreHistory}>{loadingStats ? "로딩 중..." : "새로고침"}</button>
          </div>

          {loadingStats ? <div style={{ color: "#6b7280" }}>로딩 중...</div> : (() => {
            let filtered = scoreHistory.filter(s => {
              if (statsStudentId && String(s.student_id) !== statsStudentId) return false;
              return true;
            });
            if (filtered.length === 0) return <div style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>등록된 성적이 없습니다.</div>;

            const vals = filtered.map(s => Number(s.score)).filter(v => !isNaN(v));
            const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "-";
            const max = vals.length ? Math.max(...vals) : "-";
            const min = vals.length ? Math.min(...vals) : "-";

            const byTest = {};
            filtered.forEach(s => {
              const key = `${s.test_date}_${s.test_name}_${s.subject}`;
              if (!byTest[key]) byTest[key] = { test_name: s.test_name, subject: s.subject, date: s.test_date, scores: [] };
              byTest[key].scores.push(s);
            });
            const groups = Object.values(byTest).sort((a,b) => b.date.localeCompare(a.date));

            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
                  {[{label:"총 시험", val: groups.length+"회"},{label:"평균",val:avg+"점"},{label:"최고",val:max+"점"},{label:"최저",val:min+"점"}].map(item => (
                    <div key={item.label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#006241", fontFamily: "Manrope, sans-serif" }}>{item.val}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", fontFamily: "Manrope, sans-serif" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {groups.map((g, gi) => {
                  const gVals = g.scores.map(s => Number(s.score)).filter(v => !isNaN(v));
                  const gAvg = gVals.length ? (gVals.reduce((a,b)=>a+b,0)/gVals.length).toFixed(1) : "-";
                  return (
                    <div key={gi} style={{ marginBottom: "14px", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ background: "#1E3932", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: "800", color: "#fff", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>{g.test_name}</span>
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginLeft: "10px", fontFamily: "Manrope, sans-serif" }}>{g.subject} · {g.date}</span>
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", fontFamily: "Manrope, sans-serif" }}>평균 {gAvg}점</span>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {g.scores.sort((a,b) => b.score - a.score).map((s, si) => {
                          const pct = Math.min(100, Math.round(s.score));
                          const color = s.score >= 90 ? "#006241" : s.score >= 70 ? "#2b5148" : s.score >= 50 ? "#cba258" : "#c82014";
                          return (
                            <div key={si} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                              <span style={{ width: "70px", fontSize: "13px", fontWeight: "600", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{s.students?.name || "학생"}</span>
                              <div style={{ flex: 1, height: "14px", background: "#f3f4f6", borderRadius: "7px", overflow: "hidden" }}>
                                <div style={{ width: pct+"%", height: "100%", background: color, borderRadius: "7px" }} />
                              </div>
                              <span style={{ width: "36px", fontSize: "13px", fontWeight: "700", color, textAlign: "right", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{s.score}점</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      </>)}
      </div>
    </div>
  );
}


window.TeacherPortal = TeacherPortal;
