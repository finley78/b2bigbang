function TeacherPortal({ user, onLogout }) {
  const [students, setStudents] = React.useState([]);
  const [teacherInfo, setTeacherInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [debug, setDebug] = React.useState("");

  const [scoreInputs, setScoreInputs] = React.useState({});
  const [noteInputs, setNoteInputs] = React.useState({});

  const sb = window.supabase;

  React.useEffect(() => {
    loadStudents();
  }, []);

  function clean(value) {
    return String(value || "").trim().toLowerCase();
  }

  async function loadStudents() {
    setLoading(true);
    setDebug("1. 학생 조회 시작");

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
          " / 로그인 이름: " +
          user.name +
          " / teachers 수: " +
          (allTeachers || []).length
      );
      setLoading(false);
      return;
    }

    setTeacherInfo(teacher);
    setDebug("2. 선생님 찾음: " + teacher.id);

    const { data: links, error: linkError } = await sb
      .from("teacher_students")
      .select("*")
      .eq("teacher_id", teacher.id);

    if (linkError) {
      setDebug("teacher_students 조회 오류: " + linkError.message);
      setLoading(false);
      return;
    }

    if (!links || links.length === 0) {
      setDebug("teacher_students 연결 0개 / teacher_id: " + teacher.id);
      setLoading(false);
      return;
    }

    setDebug("3. 연결된 학생 수: " + links.length);

    const studentIds = links.map((x) => x.student_id);

    const { data: studentList, error: studentError } = await sb
      .from("students")
      .select("*")
      .in("id", studentIds);

    if (studentError) {
      setDebug("students 조회 오류: " + studentError.message);
      setLoading(false);
      return;
    }

    setStudents(studentList || []);
    setDebug("4. 최종 학생 수: " + (studentList || []).length);
    setLoading(false);
  }

  async function saveAttendance(studentId, status) {
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await sb.from("attendance").insert({
      student_id: studentId,
      teacher_id: user.id,
      date: today,
      status,
    });

    if (error) {
      alert("출결 저장 실패: " + error.message);
      return;
    }

    alert("출결 저장 완료");
  }

  async function saveScore(studentId) {
    if (!teacherInfo) {
      alert("선생님 정보를 먼저 불러와야 합니다.");
      return;
    }

    const input = scoreInputs[studentId] || {};
    const testName = String(input.testName || "").trim();
    const subject = String(input.subject || "").trim();
    const score = String(input.score || "").trim();
    const memo = String(input.memo || "").trim();

    if (!testName) {
      alert("시험명을 입력해 주세요.");
      return;
    }

    if (!subject) {
      alert("과목을 입력해 주세요.");
      return;
    }

    if (!score) {
      alert("점수를 입력해 주세요.");
      return;
    }

    const { error } = await sb.from("test_scores").insert({
      student_id: studentId,
      teacher_id: teacherInfo.id,
      test_name: testName,
      subject: subject,
      score: Number(score),
      memo: memo,
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert("성적 저장 실패: " + error.message);
      return;
    }

    setScoreInputs((prev) => ({
      ...prev,
      [studentId]: {
        testName: "",
        subject: "",
        score: "",
        memo: "",
      },
    }));

    alert("성적 저장 완료");
  }

  async function saveNote(studentId) {
    if (!teacherInfo) {
      alert("선생님 정보를 먼저 불러와야 합니다.");
      return;
    }

    const note = String(noteInputs[studentId] || "").trim();

    if (!note) {
      alert("특이사항을 입력해 주세요.");
      return;
    }

    const { error } = await sb.from("teacher_notes").insert({
      student_id: studentId,
      teacher_id: teacherInfo.id,
      note: note,
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert("특이사항 저장 실패: " + error.message);
      return;
    }

    setNoteInputs((prev) => ({
      ...prev,
      [studentId]: "",
    }));

    alert("특이사항 저장 완료");
  }

  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 12px",
    marginRight: "8px",
    marginTop: "8px",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "700",
    background: "#006241",
    color: "white",
    marginRight: "8px",
    marginTop: "8px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>선생님 페이지</h1>
          <p>{user?.name} 선생님 담당 학생 관리</p>
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
        <div>학생 목록 불러오는 중...</div>
      ) : students.length === 0 ? (
        <div style={{ background: "white", padding: "30px", borderRadius: "20px" }}>
          담당 학생이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {students.map((student) => (
            <div
              key={student.id}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <h2>{student.name}</h2>
              <p>학년: {student.grade || "-"} / 연락처: {student.phone || "-"}</p>

              <div style={{ marginTop: "16px" }}>
                <strong>출결</strong>
                <br />
                <button onClick={() => saveAttendance(student.id, "present")}>출석</button>
                <button onClick={() => saveAttendance(student.id, "late")}>지각</button>
                <button onClick={() => saveAttendance(student.id, "absent")}>결석</button>
              </div>

              <div style={{ marginTop: "24px" }}>
                <strong>성적 입력</strong>
                <br />

                <input
                  style={inputStyle}
                  placeholder="시험명 예: 1학기 중간고사"
                  value={scoreInputs[student.id]?.testName || ""}
                  onChange={(e) =>
                    setScoreInputs((prev) => ({
                      ...prev,
                      [student.id]: {
                        ...(prev[student.id] || {}),
                        testName: e.target.value,
                      },
                    }))
                  }
                />

                <input
                  style={inputStyle}
                  placeholder="과목 예: 영어"
                  value={scoreInputs[student.id]?.subject || ""}
                  onChange={(e) =>
                    setScoreInputs((prev) => ({
                      ...prev,
                      [student.id]: {
                        ...(prev[student.id] || {}),
                        subject: e.target.value,
                      },
                    }))
                  }
                />

                <input
                  style={{ ...inputStyle, width: "100px" }}
                  placeholder="점수"
                  type="number"
                  value={scoreInputs[student.id]?.score || ""}
                  onChange={(e) =>
                    setScoreInputs((prev) => ({
                      ...prev,
                      [student.id]: {
                        ...(prev[student.id] || {}),
                        score: e.target.value,
                      },
                    }))
                  }
                />

                <input
                  style={{ ...inputStyle, width: "260px" }}
                  placeholder="메모 예: 문법 보완 필요"
                  value={scoreInputs[student.id]?.memo || ""}
                  onChange={(e) =>
                    setScoreInputs((prev) => ({
                      ...prev,
                      [student.id]: {
                        ...(prev[student.id] || {}),
                        memo: e.target.value,
                      },
                    }))
                  }
                />

                <button style={buttonStyle} onClick={() => saveScore(student.id)}>
                  성적 저장
                </button>
              </div>

              <div style={{ marginTop: "24px" }}>
                <strong>특이사항</strong>
                <br />

                <input
                  style={{ ...inputStyle, width: "70%" }}
                  placeholder="예: 숙제 미제출, 수업 태도 양호, 상담 필요 등"
                  value={noteInputs[student.id] || ""}
                  onChange={(e) =>
                    setNoteInputs((prev) => ({
                      ...prev,
                      [student.id]: e.target.value,
                    }))
                  }
                />

                <button style={buttonStyle} onClick={() => saveNote(student.id)}>
                  특이사항 저장
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.TeacherPortal = TeacherPortal;
