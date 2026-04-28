export default function TeacherPortal() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "40px"
    }}>
      <h1 style={{
        fontSize: "32px",
        fontWeight: "bold",
        marginBottom: "20px"
      }}>
        선생님 페이지
      </h1>

      <div style={{
        background: "white",
        padding: "30px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
      }}>
        <h2>담당 학생 관리</h2>

        <p>여기에 담당 학생 목록이 들어갑니다.</p>

        <button style={{
          marginTop: "20px",
          padding: "12px 20px",
          border: "none",
          borderRadius: "10px",
          background: "#111827",
          color: "white",
          cursor: "pointer"
        }}>
          출석 입력
        </button>
      </div>
    </div>
  );
}
