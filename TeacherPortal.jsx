function TeacherPortal({ user, onLogout }) {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const sb = window.supabase;

  React.useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);

      // 1. teachers 테이블에서 현재 선생님 찾기
      const { data: teacher, error: teacherError } = await sb
        .from("teachers")
        .select("*")
        .eq("email", user.email)
        .single();

      if (teacherError || !teacher) {
        console.error("teacher 조회 실패", teacherError);
        setLoading(false);
        return;
      }

      // 2. teacher_students에서 담당 학생 연결 조회
      const { data: links, error: linkError } = await sb
        .from("teacher_students")
        .select("student_id")
        .eq("teacher_id", teacher.id);

      if (linkError) {
        console.error("teacher_students 조회 실패", linkError);
        setLoading(false);
        return;
      }

      if (!links || links.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = links.map(item => item.student_id);

      // 3. students 테이블에서 실제 학생 정보 조회
      const { data: studentList, error: studentError } = await sb
        .from("students")
        .select("*")
        .in("id", studentIds)
        .order("name", { ascending: true });

      if (studentError) {
        console.error("students 조회 실패", studentError);
        setLoading(false);
        return;
      }

      setStudents(studentList || []);
      setLoading(false);

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  async function saveAttendance(studentId, status) {
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await sb
      .from("attendance")
      .insert({
        student_id: studentId,
        teacher_id: user.id,
        date: today,
        status: status
      });

    if (error) {
      alert("출결 저장 실패");
      console.error(error);
      return;
    }

    alert("출결 저장 완료");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "40px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
      }}>
        <div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "8px"
          }}>
            선생님 페이지
          </h1>

          <p style={{
            color: "#666"
          }}>
            {user?.name} 선생님 담당 학생 관리
          </p>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "10px",
            background: "#111827",
            color: "white",
            cursor: "pointer"
          }}
        >
          로그아웃
        </button>
      </div>

      {loading ? (
        <div>학생 목록 불러오는 중...</div>
      ) : students.length === 0 ? (
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "20px"
        }}>
          담당 학생이 없습니다.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gap: "20px"
        }}>
          {students.map((student) => (
            <div
              key={student.id}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
              }}
            >
              <h2 style={{
                fontSize: "22px",
                marginBottom: "10px"
              }}>
                {student.name}
              </h2>

              <p style={{
                color: "#666",
                marginBottom: "20px"
              }}>
                학년: {student.grade || "-"} / 연락처: {student.phone || "-"}
              </p>

              <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
              }}>
                <button
                  onClick={() => saveAttendance(student.id, "present")}
                  style={btnStyle}
                >
                  출석
                </button>

                <button
                  onClick={() => saveAttendance(student.id, "late")}
                  style={btnStyle}
                >
                  지각
                </button>

                <button
                  onClick={() => saveAttendance(student.id, "absent")}
                  style={btnStyle}
                >
                  결석
                </button>

                <button style={subBtnStyle}>
                  성적 입력
                </button>

                <button style={subBtnStyle}>
                  특이사항
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: "12px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#111827",
  color: "white",
  cursor: "pointer"
};

const subBtnStyle = {
  padding: "12px 18px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  background: "white",
  cursor: "pointer"
};

window.TeacherPortal = TeacherPortal;
