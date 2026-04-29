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

    setTeacherInfo(teacher);
    setDebug("2. 선생님 찾음: " + teacher.id);

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
    await loadTeacherCourses(teacher, classList || []);
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

    const teacherName = clean(teacher?.name || user?.name);
    const teacherEmail = clean(teacher?.email || user?.email);
    const classSubjects = new Set((classList || []).map((cls) => clean(cls.subject)).filter(Boolean));
    const classNames = new Set((classList || []).map((cls) => clean(cls.name)).filter(Boolean));
    const filtered = (courseList || []).filter((course) => {
      if (isAdmin || adminAuthed || user?.role === "admin") return true;
      if (String(course.teacher_id || "") && String(course.teacher_id) === String(teacher?.id)) return true;
      if (teacherName && clean(course.teacher) === teacherName) return true;
      if (teacherEmail && clean(course.teacher_email) === teacherEmail) return true;

      const courseTitle = clean(course.title || course.name);
      const courseSubject = clean(course.subjects?.name || course.subject);

      if (classNames.size > 0 && classNames.has(courseTitle)) return true;
      if (classNames.size === 0 && classSubjects.size > 0 && classSubjects.has(courseSubject)) return true;
      return false;
    });

    setTeacherCourses(filtered.map(mapCourseForTeacher));
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>선생님 페이지</h1>
          <p style={{ marginTop: "8px", color: "#6b7280" }}>{user?.name} 선생님 반별 성적 관리</p>
        </div>

        <button style={lightButtonStyle} onClick={onLogout}>로그아웃</button>
      </div>

      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
          color: "#9a3412",
        }}
      >
        진단 결과: {debug}
      </div>

      {loading ? (
        <div>불러오는 중...</div>
      ) : (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px" }}>온라인 강의 관리</h2>
            <p style={{ marginTop: "-6px", marginBottom: "14px", color: "#6b7280", fontSize: "14px" }}>본인 담당 강좌에 유튜브 링크/ID 또는 시놀로지 영상 URL을 등록할 수 있습니다.</p>

            {teacherCourses.length === 0 ? (
              <div>담당 강좌가 없습니다. 관리자에게 강좌 배정을 요청해 주세요.</div>
            ) : (
              <>
                <select
                  style={{ ...inputStyle, maxWidth: "520px", marginBottom: "16px" }}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">강의를 등록할 강좌를 선택해 주세요</option>
                  {teacherCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}{course.subject ? ` / ${course.subject}` : ""}
                    </option>
                  ))}
                </select>

                {selectedCourseId && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <strong>{teacherCourses.find((course) => String(course.id) === String(selectedCourseId))?.title}</strong>
                      <button style={buttonStyle} onClick={() => addLectureToCourse(selectedCourseId)}>+ 강의 추가</button>
                    </div>

                    {(teacherCourses.find((course) => String(course.id) === String(selectedCourseId))?.lectures || []).length === 0 ? (
                      <div style={{ color: "#6b7280" }}>아직 등록된 강의가 없습니다.</div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {(teacherCourses.find((course) => String(course.id) === String(selectedCourseId))?.lectures || []).map((lecture, idx) => (
                          <div key={lecture.id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", display: "grid", gap: "8px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: "8px", alignItems: "center" }}>
                              <strong style={{ color: "#006241" }}>{idx + 1}강</strong>
                              <input
                                style={inputStyle}
                                value={lecture.title || ""}
                                placeholder="강의 제목"
                                onChange={(e) => updateLecture(selectedCourseId, lecture.id, "title", e.target.value, false)}
                                onBlur={(e) => updateLecture(selectedCourseId, lecture.id, "title", e.target.value, true)}
                              />
                              <button style={lightButtonStyle} onClick={() => deleteLecture(selectedCourseId, lecture.id)}>삭제</button>
                            </div>
                            <input
                              style={inputStyle}
                              value={lecture.youtubeId || ""}
                              placeholder="YouTube 링크/ID 또는 시놀로지 영상 URL"
                              onChange={(e) => updateLecture(selectedCourseId, lecture.id, "youtubeId", e.target.value, false)}
                              onBlur={(e) => updateLecture(selectedCourseId, lecture.id, "youtubeId", e.target.value, true)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ ...cardStyle, marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px" }}>담당 클래스 필터</h2>

            {classes.length === 0 ? (
              <div>담당 반이 없습니다.</div>
            ) : (
              <>
                <select
                  style={{ ...inputStyle, maxWidth: "420px", marginBottom: "16px" }}
                  value={selectedClassId}
                  onChange={(e) => handleClassSelect(e.target.value)}
                >
                  <option value="">담당 반을 선택해 주세요</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}{cls.subject ? ` / ${cls.subject}` : ""}{cls.grade ? ` / ${cls.grade}` : ""}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => selectClass(cls)}
                      style={{
                        ...buttonStyle,
                        background: selectedClass?.id === cls.id ? "#111827" : "#006241",
                      }}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedClass && (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <h2 style={{ margin: 0 }}>선택한 반: {selectedClass.name}</h2>
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
