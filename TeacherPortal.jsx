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

  async function saveAllScores() {
    if (!teacherInfo) {
      alert("선생님 정보를 먼저 불러와야 합니다.");
      return;
    }

    if (!selectedClass) {
      alert("반을 선택해 주세요.");
      return;
    }

    if (!testInfo.testName.trim()) {
      alert("시험명을 입력해 주세요.");
      return;
    }

    if (!testInfo.subject.trim()) {
      alert("과목을 입력해 주세요.");
      return;
    }

    if (!testInfo.testRange.trim()) {
      alert("시험 범위를 입력해 주세요.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      alert("성적을 저장할 학생을 선택해 주세요.");
      return;
    }

    const selectedIdSet = new Set(selectedStudentIds);
    const rows = students
      .filter((student) => selectedIdSet.has(student.id))
      .filter((student) => String(scores[student.id] || "").trim() !== "")
      .map((student) => ({
        student_id: student.id,
        teacher_id: teacherInfo.id,
        class_id: selectedClass.id,
        test_type: testInfo.testType,
        test_name: testInfo.testName.trim(),
        subject: testInfo.subject.trim(),
        test_range: testInfo.testRange.trim(),
        test_date: testInfo.testDate,
        score: Number(scores[student.id]),
        created_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      alert("선택된 학생 중 입력된 점수가 없습니다.");
      return;
    }

    const { error } = await sb.from("test_scores").insert(rows);

    if (error) {
      alert("성적 저장 실패: " + error.message);
      return;
    }

    alert(rows.length + "명 성적 저장 완료");
    setScores({});
  }

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

  const selectedCount = selectedStudentIds.length;
  const teacherAssignments = getTeacherAssignments();
  const availableClassCards = classes || [];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#1E3932" }}>선생님 페이지</h1>
        <p style={{ marginTop: "6px", color: "#6b7280", fontSize: "14px" }}>{user?.name} 선생님 담당 클래스 관리</p>
      </div>

      {loading ? (
        <div>불러오는 중...</div>
      ) : (
        <>
          {teacherView !== "home" && (
            <div style={{ marginBottom: "18px" }}>
              <button style={lightButtonStyle} onClick={goTeacherHome}>← 담당 클래스 선택으로 돌아가기</button>
            </div>
          )}

          {teacherView === "home" && (
            <>
              <div style={{ ...cardStyle, marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "10px" }}>담당 클래스 선택</h2>
                <p style={{ marginTop: 0, marginBottom: "18px", color: "#6b7280", fontSize: "14px" }}>
                  담당 클래스를 먼저 선택한 뒤 성적 등록 또는 강의 추가를 선택해 주세요.
                </p>

                {availableClassCards.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>
                    담당 클래스가 없습니다. 관리자 페이지에서 담당 클래스 또는 담당 학년을 먼저 배정해 주세요.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                    {availableClassCards.map((cls) => {
                      const active = String(selectedClass?.id || "") === String(cls.id);
                      return (
                        <button
                          key={cls.id}
                          onClick={() => selectClass(cls)}
                          style={{
                            textAlign: "left",
                            border: active ? "2px solid #006241" : "1px solid #e5e7eb",
                            background: active ? "#f0fdf4" : "white",
                            borderRadius: "16px",
                            padding: "18px",
                            cursor: "pointer",
                            boxShadow: active ? "0 8px 20px rgba(0,98,65,0.10)" : "0 4px 14px rgba(0,0,0,0.04)",
                          }}
                        >
                          <strong style={{ display: "block", fontSize: "17px", marginBottom: "8px", color: "#111827" }}>{cls.name}</strong>
                          <span style={{ display: "block", fontSize: "13px", color: "#6b7280" }}>
                            {cls.subject || getPrimarySubject()} {cls.grade ? ` / ${cls.grade}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedClass && (
                <div style={{ ...cardStyle, marginBottom: "24px" }}>
                  <h2 style={{ marginBottom: "8px" }}>선택한 클래스</h2>
                  <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>{classLabel(selectedClass)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    <button
                      style={{ ...buttonStyle, padding: "20px", fontSize: "16px" }}
                      onClick={openScorePage}
                    >
                      성적 등록
                    </button>
                    <button
                      style={{ ...buttonStyle, padding: "20px", fontSize: "16px", background: "#111827" }}
                      onClick={openLecturePage}
                    >
                      강의 추가
                    </button>
                  </div>
                </div>
              )}

              {/* 담당 강좌 목록 (관리자가 배정한 강좌만 표시) */}
              {teacherCourses.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: "24px" }}>
                  <h2 style={{ marginBottom: "12px" }}>담당 강좌 목록</h2>
                  <p style={{ marginTop: 0, marginBottom: "14px", color: "#6b7280", fontSize: "14px" }}>관리자가 배정한 강좌입니다. 강의 추가는 클래스 선택 후 진행하세요.</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {teacherCourses.map((course) => (
                      <span key={course.id} style={{ background: "#ecfdf5", color: "#065f46", padding: "8px 14px", borderRadius: "999px", fontWeight: "700", fontSize: "13px", fontFamily: "Manrope, sans-serif" }}>
                        {course.title}{course.subject ? ` · ${course.subject}` : ""} ({(course.lectures || []).length}강)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {teacherView === "lecture" && selectedClass && (
            <>
              <div style={{ ...cardStyle, marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "8px" }}>강의 추가</h2>
                <p style={{ marginTop: 0, marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
                  선택 클래스: <strong>{classLabel(selectedClass)}</strong>
                </p>

                {teacherCourses.length === 0 ? (
                  <div style={{ color: "#6b7280", padding: "16px", background: "#f9fafb", borderRadius: "10px" }}>
                    배정된 강좌가 없습니다. 관리자 페이지에서 담당 강좌를 먼저 배정해 주세요.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>강좌 선택 (관리자가 배정한 강좌)</label>
                      <select style={inputStyle} value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                        <option value="">강좌를 선택해 주세요</option>
                        {teacherCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}{course.subject ? ` / ${course.subject}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: "12px", alignItems: "end" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>영상 제목</label>
                        <input style={inputStyle} value={courseVideoTitle} onChange={(e) => setCourseVideoTitle(e.target.value)} placeholder="예: 4월 3주차 문법 보충강의" />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "800", color: "#374151", display: "block", marginBottom: "6px" }}>영상 링크</label>
                        <input style={inputStyle} value={courseVideoLink} onChange={(e) => setCourseVideoLink(e.target.value)} placeholder="YouTube 링크/ID 또는 시놀로지 영상 URL" />
                      </div>
                      <button style={buttonStyle} onClick={addVideoToCourse} disabled={savingOnline}>
                        {savingOnline ? "저장 중..." : "강의 저장"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "16px" }}>내 온라인 강좌 목록</h2>
                <p style={{ marginTop: "-6px", marginBottom: "14px", color: "#6b7280", fontSize: "14px" }}>등록된 강좌와 영상을 확인하고 제목/링크를 수정할 수 있습니다.</p>

                {teacherCourses.length === 0 ? (
                  <div>아직 등록된 온라인 강좌가 없습니다.</div>
                ) : (
                  <>
                    <select style={{ ...inputStyle, maxWidth: "620px", marginBottom: "16px" }} value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                      <option value="">강좌를 선택해 주세요</option>
                      {teacherCourses.map((course) => (
                        <option key={course.id} value={course.id}>{course.title}{course.subject ? ` / ${course.subject}` : ""}</option>
                      ))}
                    </select>

                    {selectedCourseId && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          <strong>{selectedCourse()?.title}</strong>
                          <button style={buttonStyle} onClick={() => addLectureToCourse(selectedCourseId)}>+ 빈 강의 추가</button>
                        </div>

                        {(selectedCourse()?.lectures || []).length === 0 ? (
                          <div style={{ color: "#6b7280" }}>아직 등록된 강의가 없습니다.</div>
                        ) : (
                          <div style={{ display: "grid", gap: "10px" }}>
                            {(selectedCourse()?.lectures || []).map((lecture, idx) => (
                              <div key={lecture.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", display: "grid", gap: "8px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: "8px", alignItems: "center" }}>
                                  <strong style={{ color: "#006241" }}>{idx + 1}강</strong>
                                  <input style={inputStyle} value={lecture.title || ""} placeholder="강의 제목" onChange={(e) => updateLecture(selectedCourseId, lecture.id, "title", e.target.value, false)} onBlur={(e) => updateLecture(selectedCourseId, lecture.id, "title", e.target.value, true)} />
                                  <button style={lightButtonStyle} onClick={() => deleteLecture(selectedCourseId, lecture.id)}>삭제</button>
                                </div>
                                <input style={inputStyle} value={lecture.youtubeId || ""} placeholder="YouTube 링크/ID 또는 시놀로지 영상 URL" onChange={(e) => updateLecture(selectedCourseId, lecture.id, "youtubeId", e.target.value, false)} onBlur={(e) => updateLecture(selectedCourseId, lecture.id, "youtubeId", e.target.value, true)} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {teacherView === "score" && selectedClass && (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ margin: 0 }}>성적 등록</h2>
                  <div style={{ marginTop: "6px", fontSize: "14px", color: "#6b7280" }}>선택 클래스: {classLabel(selectedClass)}</div>
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  선택 학생 {selectedCount}명 / 전체 {students.length}명
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <select
                  style={inputStyle}
                  value={testInfo.reportPeriod}
                  onChange={(e) =>
                    setTestInfo((prev) => ({
                      ...prev,
                      reportPeriod: e.target.value,
                      testType: `${e.target.value} 성적표`,
                    }))
                  }
                >
                  <option value="일일">일일 성적표</option>
                  <option value="주간">주간 성적표</option>
                  <option value="월간">월간 성적표</option>
                </select>

                <input
                  style={inputStyle}
                  type="date"
                  value={testInfo.testDate}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, testDate: e.target.value }))
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="과목 예: 영어"
                  value={testInfo.subject}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, subject: e.target.value }))
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <input
                  style={inputStyle}
                  placeholder="시험명 예: 4월 4주차 단어 테스트"
                  value={testInfo.testName}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, testName: e.target.value }))
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="시험 범위 예: Unit 1~3 / 본문 1과 / 3월 모의고사 20~24번"
                  value={testInfo.testRange}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, testRange: e.target.value }))
                  }
                />
              </div>

              {students.length === 0 ? (
                <div>이 반에 등록된 학생이 없습니다.</div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "14px", color: "#6b7280" }}>
                      체크된 학생에게만 성적이 저장됩니다. 점수가 비어 있는 학생은 저장되지 않습니다.
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={lightButtonStyle} onClick={selectAllStudents}>전체 선택</button>
                      <button style={lightButtonStyle} onClick={clearAllStudents}>전체 해제</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "10px" }}>
                    {students.map((student) => {
                      const checked = selectedStudentIds.includes(student.id);

                      return (
                        <div
                          key={student.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "36px 1fr 140px",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            border: checked ? "1px solid #006241" : "1px solid #e5e7eb",
                            borderRadius: "12px",
                            background: checked ? "#f0fdf4" : "white",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(student.id)}
                            style={{ width: "18px", height: "18px" }}
                          />

                          <div>
                            <strong>{student.name}</strong>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>
                              {student.grade || "-"} / {student.school || student.phone || "-"}
                            </div>
                          </div>

                          <input
                            style={inputStyle}
                            type="number"
                            placeholder="점수"
                            value={scores[student.id] || ""}
                            disabled={!checked}
                            onChange={(e) => updateScore(student.id, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: "20px", textAlign: "right" }}>
                    <button style={buttonStyle} onClick={saveAllScores}>
                      선택 학생 성적 저장
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

}

window.TeacherPortal = TeacherPortal;
