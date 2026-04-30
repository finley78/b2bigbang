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
  // 성적 분석 (선생님 공유)
  const [scoreAnalysis, setScoreAnalysis] = React.useState([]);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [analysisClassId, setAnalysisClassId] = React.useState('');
  const [analysisSubject, setAnalysisSubject] = React.useState('전체');
  const [analysisTestName, setAnalysisTestName] = React.useState('전체');
  const [analysisSearch, setAnalysisSearch] = React.useState('');
  const [analysisClassStudents, setAnalysisClassStudents] = React.useState({}); // { class_id: [student_id, ...] }
  const [analysisAllStudents, setAnalysisAllStudents] = React.useState({}); // { id: {name, grade, school} }

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

  async function saveNote() {
    if (!teacherInfo) { alert("선생님 정보를 먼저 불러와야 합니다."); return; }
    if (!String(noteDraft.content || "").trim()) { alert("내용을 입력해 주세요."); return; }
    setSavingNote(true);
    const { error } = await sb.from("teacher_notes").insert({
      teacher_id: teacherInfo.id,
      student_id: noteDraft.studentId || null,
      note_type: noteDraft.type,
      note_date: noteDraft.date,
      content: noteDraft.content.trim(),
    });
    setSavingNote(false);
    if (error) { alert("저장 실패: " + error.message); return; }
    setNoteDraft({ date: new Date().toISOString().slice(0,10), type: '특이사항', studentId: '', content: '' });
    await loadNotes();
  }

  async function deleteNote(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await sb.from("teacher_notes").delete().eq("id", id);
    if (error) { alert("삭제 실패: " + error.message); return; }
    await loadNotes();
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
    { id: "lecture",  label: "강의 추가" },
    { id: "notes",    label: "특이사항" },
    { id: "stats",    label: "성적 등록" },
    { id: "analysis", label: "성적 분석" },
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
          <button key={t.id} onClick={() => { setTeacherView(t.id); if(t.id==="notes") loadNotes(); if(t.id==="analysis") loadScoreAnalysis(); }}
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

      {/* ── 탭5: 성적 분석 ── */}
      {teacherView === "analysis" && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "4px" }}>성적 분석</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>모든 선생님이 등록한 성적을 함께 확인할 수 있습니다.</p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <select style={{ ...inputStyle, maxWidth: "200px" }} value={analysisClassId} onChange={e => setAnalysisClassId(e.target.value)}>
              <option value="">반 전체</option>
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
            <input style={{ ...inputStyle, minWidth: "180px", flex: 1 }} placeholder="학생명·선생님명 검색" value={analysisSearch} onChange={e => setAnalysisSearch(e.target.value)} />
            <button style={lightButtonStyle} onClick={loadScoreAnalysis}>{analysisLoading ? "로딩 중..." : "새로고침"}</button>
          </div>

          {analysisLoading ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>로딩 중...</div>
          ) : !analysisClassId ? (
            <div style={{ color: "#6b7280", textAlign: "center", padding: "32px", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>반을 선택해 주세요</div>
          ) : (() => {
            const q = analysisSearch.trim().toLowerCase();
            // 1. 점수 데이터에 비-반 필터(과목/시험명) 적용
            const scoresFiltered = scoreAnalysis.filter(s => {
              if (analysisSubject !== "전체" && s.subject !== analysisSubject) return false;
              if (analysisTestName !== "전체" && s.test_name !== analysisTestName) return false;
              return true;
            });
            // 2. 표시 대상 학생: 선택된 반의 학생들
            const targetIds = (analysisClassStudents[analysisClassId] || []).map(String);
            // 3. 학생별 행 구성 + 검색 필터
            const subjectActive = analysisSubject !== "전체";
            const testNameActive = analysisTestName !== "전체";
            const rows = targetIds.map(sid => {
              const std = analysisAllStudents[sid];
              const studentName = (std && std.name) || (scoreAnalysis.find(s => String(s.student_id) === sid)?.students?.name) || "학생";
              const studentGrade = (std && std.grade) || "";
              const myScores = scoresFiltered.filter(s => String(s.student_id) === sid);
              // 과목·시험명 필터가 활성화된 경우 매칭 점수가 없는 학생은 제외
              if ((subjectActive || testNameActive) && myScores.length === 0) return null;
              if (q) {
                const teacherNames = myScores.map(s => s.teachers?.name).filter(Boolean);
                const hay = [studentName, ...teacherNames].join(" ").toLowerCase();
                if (hay.indexOf(q) < 0) return null;
              }
              return { id: sid, name: studentName, grade: studentGrade, scores: myScores };
            }).filter(Boolean);

            if (rows.length === 0) return <div style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>표시할 학생이 없습니다.</div>;

            const allVals = rows.flatMap(r => r.scores.map(s => Number(s.score))).filter(v => !isNaN(v));
            const avg = allVals.length ? (allVals.reduce((a,b)=>a+b,0)/allVals.length).toFixed(1) : "-";
            const max = allVals.length ? Math.max(...allVals) : "-";
            const min = allVals.length ? Math.min(...allVals) : "-";
            const totalTests = new Set(rows.flatMap(r => r.scores.map(s => `${s.test_date}_${s.test_name}_${s.subject}`))).size;

            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
                  {[
                    {label:"학생", val: rows.length+"명"},
                    {label:"총 시험", val: totalTests+"회"},
                    {label:"평균", val: avg+"점"},
                    {label:"최고", val: max+"점"},
                    {label:"최저", val: min+"점"},
                  ].map(item => (
                    <div key={item.label} style={{ background: "#f9fafb", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#006241", fontFamily: "Manrope, sans-serif" }}>{item.val}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", fontFamily: "Manrope, sans-serif" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {rows.map(r => {
                  const myVals = r.scores.map(s => Number(s.score)).filter(v => !isNaN(v));
                  const myAvg = myVals.length ? (myVals.reduce((a,b)=>a+b,0)/myVals.length).toFixed(1) : "-";
                  return (
                    <div key={r.id} style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ background: "#1E3932", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <span style={{ fontWeight: "800", color: "#fff", fontSize: "14px", fontFamily: "Manrope, sans-serif" }}>{r.name}</span>
                          {r.grade && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginLeft: "8px", fontFamily: "Manrope, sans-serif" }}>{r.grade}</span>}
                        </div>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", fontFamily: "Manrope, sans-serif" }}>{r.scores.length}회 응시{myVals.length > 0 ? ` · 평균 ${myAvg}점` : ""}</span>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {r.scores.length === 0 ? (
                          <div style={{ color: "#9ca3af", fontSize: "13px", fontStyle: "italic", fontFamily: "Manrope, sans-serif" }}>아직 등록된 성적이 없습니다 (미응시)</div>
                        ) : (
                          r.scores.slice().sort((a,b) => (b.test_date||"").localeCompare(a.test_date||"")).map((s, si) => {
                            const pct = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
                            const color = s.score >= 90 ? "#006241" : s.score >= 70 ? "#2b5148" : s.score >= 50 ? "#cba258" : "#c82014";
                            return (
                              <div key={si} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                <div style={{ width: "180px", flexShrink: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", fontFamily: "Manrope, sans-serif" }}>{s.test_name || "(무제)"}</div>
                                  <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "Manrope, sans-serif" }}>{[s.subject, s.test_date].filter(Boolean).join(" · ")}</div>
                                </div>
                                <span style={{ width: "78px", fontSize: "11px", color: "#9ca3af", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{s.teachers?.name ? `${s.teachers.name} 선생님` : ""}</span>
                                <div style={{ flex: 1, height: "14px", background: "#f3f4f6", borderRadius: "7px", overflow: "hidden" }}>
                                  <div style={{ width: pct+"%", height: "100%", background: color, borderRadius: "7px" }} />
                                </div>
                                <span style={{ width: "44px", fontSize: "13px", fontWeight: "700", color, textAlign: "right", flexShrink: 0, fontFamily: "Manrope, sans-serif" }}>{s.score}점</span>
                              </div>
                            );
                          })
                        )}
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
