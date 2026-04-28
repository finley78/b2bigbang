function TeacherPortal({ user, onLogout }) {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [debug, setDebug] = React.useState("");

  const sb = window.supabase;

  console.log("로그인 user 전체:", user);
console.log("user.email:", user.email);
console.log("user.name:", user.name);
  
  React.useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    setDebug("1. 학생 조회 시작");

   const { data: teacher, error: teacherError } = await sb
  .from("teachers")
  .select("*")
  .ilike("email", user.email.trim())
  .maybeSingle();

    if (teacherError) {
      setDebug("teachers 조회 오류: " + teacherError.message);
      setLoading(false);
      return;
    }

  if (!teacher) {
  setDebug(
    "teachers에서 선생님을 못 찾음 / 로그인 이메일: " +
    user.email +
    " / 로그인 이름: " +
    user.name
  );
  setLoading(false);
  return;
}

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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>선생님 페이지</h1>
          <p>{user?.name} 선생님 담당 학생 관리</p>
        </div>

        <button onClick={onLogout}>로그아웃</button>
      </div>

      <div style={{
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        padding: "16px",
        borderRadius: "12px",
        marginBottom: "20px",
        color: "#9a3412"
      }}>
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
            <div key={student.id} style={{
              background: "white",
              padding: "24px",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
            }}>
              <h2>{student.name}</h2>
              <p>학년: {student.grade || "-"} / 연락처: {student.phone || "-"}</p>

              <button onClick={() => saveAttendance(student.id, "present")}>출석</button>
              <button onClick={() => saveAttendance(student.id, "late")}>지각</button>
              <button onClick={() => saveAttendance(student.id, "absent")}>결석</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.TeacherPortal = TeacherPortal;
