function TeacherPortal({ user, onLogout }) {
  const [teacherInfo, setTeacherInfo] = React.useState(null);
  const [classes, setClasses] = React.useState([]);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [debug, setDebug] = React.useState("");

  const [testInfo, setTestInfo] = React.useState({
    testType: "주간 테스트",
    testName: "",
    subject: "",
    testDate: new Date().toISOString().slice(0, 10),
  });

  const [scores, setScores] = React.useState({});

  const sb = window.supabase;

  React.useEffect(() => {
    loadTeacherAndClasses();
  }, []);

  function clean(value) {
    return String(value || "").trim().toLowerCase();
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
      .eq("teacher_id", teacher.id);

    if (classError) {
      setDebug("classes 조회 오류: " + classError.message);
      setLoading(false);
      return;
    }

    setClasses(classList || []);
    setDebug("3. 담당 반 수: " + (classList || []).length);
    setLoading(false);
  }

  async function selectClass(cls) {
    setSelectedClass(cls);
    setStudents([]);
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
      .in("id", studentIds);

    if (studentError) {
      setDebug("students 조회 오류: " + studentError.message);
      return;
    }

    setStudents(studentList || []);
    setTestInfo((prev) => ({
      ...prev,
      subject: cls.subject || prev.subject,
    }));
    setDebug("5. 선택한 반 학생 수: " + (studentList || []).length);
  }

  function updateScore(studentId, value) {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
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

    const rows = students
      .filter((student) => String(scores[student.id] || "").trim() !== "")
      .map((student) => ({
        student_id: student.id,
        teacher_id: teacherInfo.id,
        class_id: selectedClass.id,
        test_type: testInfo.testType,
        test_name: testInfo.testName.trim(),
        subject: testInfo.subject.trim(),
        test_date: testInfo.testDate,
        score: Number(scores[student.id]),
        created_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      alert("입력된 점수가 없습니다.");
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>선생님 페이지</h1>
          <p>{user?.name} 선생님 반별 성적 관리</p>
        </div>

        <button onClick={onLogout}>로그아웃</button>
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
            <h2 style={{ marginBottom: "16px" }}>담당 반 선택</h2>

            {classes.length === 0 ? (
              <div>담당 반이 없습니다.</div>
            ) : (
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
            )}
          </div>

          {selectedClass && (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <h2 style={{ marginBottom: "16px" }}>
                선택한 반: {selectedClass.name}
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <select
                  style={inputStyle}
                  value={testInfo.testType}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, testType: e.target.value }))
                  }
                >
                  <option>주간 테스트</option>
                  <option>월간 테스트</option>
                  <option>학교 중간고사</option>
                  <option>학교 기말고사</option>
                  <option>모의고사</option>
                  <option>수행평가</option>
                </select>

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
                  placeholder="과목 예: 영어"
                  value={testInfo.subject}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, subject: e.target.value }))
                  }
                />

                <input
                  style={inputStyle}
                  type="date"
                  value={testInfo.testDate}
                  onChange={(e) =>
                    setTestInfo((prev) => ({ ...prev, testDate: e.target.value }))
                  }
                />
              </div>

              {students.length === 0 ? (
                <div>이 반에 등록된 학생이 없습니다.</div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {students.map((student) => (
                      <div
                        key={student.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 140px",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                        }}
                      >
                        <div>
                          <strong>{student.name}</strong>
                          <div style={{ fontSize: "13px", color: "#6b7280" }}>
                            {student.grade || "-"} / {student.phone || "-"}
                          </div>
                        </div>

                        <input
                          style={inputStyle}
                          type="number"
                          placeholder="점수"
                          value={scores[student.id] || ""}
                          onChange={(e) => updateScore(student.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "20px", textAlign: "right" }}>
                    <button style={buttonStyle} onClick={saveAllScores}>
                      전체 성적 저장
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
