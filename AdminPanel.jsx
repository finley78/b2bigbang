// AdminPanel.jsx — Admin login + full management panel

const GRADES = ['중1','중2','중3','고1','고2','고3'];
const SUBJECTS = ['국어','영어','수학','과학'];
const SCHOOLS = ['전체','은지초','검암초','간재울초','검암중','간재울중','백석중','대인고','서인천고','백석고'];
const SCHOOL_LEVELS = {
  '초등': { schools:['은지초','검암초','간재울초'], grades:['1학년','2학년','3학년','4학년','5학년','6학년'] },
  '중등': { schools:['검암중','간재울중','백석중'], grades:['중1','중2','중3'] },
  '고등': { schools:['대인고','서인천고','백석고'], grades:['고1','고2','고3'] },
};

/* ── Admin Login ────────────────────────────── */
function AdminLogin({ onLogin }) {
  const [pw, setPw] = React.useState('');
  const [error, setError] = React.useState(false);

  function attempt() {
    if (pw === 'b2admin') { onLogin(); }
    else { setError(true); setTimeout(() => setError(false), 2000); }
  }

  return React.createElement('div', { style:{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb' } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'40px', width:'360px', boxShadow:'0 4px 24px rgba(0,0,0,0.1)' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#cba258', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '★'),
        React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '관리자 로그인')
      ),
      React.createElement('div', { style:{ position:'relative', background:'#f9f9f9', borderRadius:'4px', border:`1px solid ${error?'#c82014':'#d6dbde'}`, padding:'14px 12px 10px', marginBottom:'16px' } },
        React.createElement('div', { style:{ position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color: error?'#c82014':'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, error?'비밀번호 오류':'비밀번호'),
        React.createElement('input', { type:'password', value:pw, onChange:e=>setPw(e.target.value), onKeyDown:e=>e.key==='Enter'&&attempt(), placeholder:'관리자 비밀번호', style:{ width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' } })
      ),
      React.createElement('button', { onClick:attempt, style:{ width:'100%', background:'#1E3932', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
        onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, '로그인'),
      React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.35)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif' } }, '데모 비밀번호: b2admin')
    )
  );
}

/* ── Admin Panel ────────────────────────────── */
function AdminPanel({ state, setState, onLogout, adminAuthed, setAdminAuthed }) {
  const authed = adminAuthed;
  const setAuthed = setAdminAuthed;
  const [tab, setTab] = React.useState('banner');
  const [editingBanner, setEditingBanner] = React.useState(null);
  const [editingNotice, setEditingNotice] = React.useState(null);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [expandedStudent, setExpandedStudent] = React.useState(null);
  const [expandedMember, setExpandedMember] = React.useState(null);
  const [memberFilter, setMemberFilter] = React.useState('전체');
  const [memberSearch, setMemberSearch] = React.useState('');
  const [editingMember, setEditingMember] = React.useState(null);
  const [filterSchool, setFilterSchool] = React.useState('전체');
  const [filterLevel, setFilterLevel] = React.useState('전체');
  const [filterGrade, setFilterGrade] = React.useState('전체');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [bulkGrade, setBulkGrade] = React.useState('');
  const [bulkSchool, setBulkSchool] = React.useState('');
  const [dbStudents, setDbStudents] = React.useState([]);
  const [dbMembers, setDbMembers] = React.useState([]);
  const [dbTeachers, setDbTeachers] = React.useState([]);
  const [dbPending, setDbPending] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [dbClasses, setDbClasses] = React.useState([]);
  const [newClassName, setNewClassName] = React.useState('');
  const [newSubject, setNewSubject] = React.useState('');
  const [newGrade, setNewGrade] = React.useState('');
  const [newTeacherId, setNewTeacherId] = React.useState('');

  const sb = window.supabase;

  React.useEffect(() => {
    if (!authed) return;
    loadAllData();
  }, [authed]);

  async function loadAllData() {
    // 배너
    const { data: banners } = await sb.from('banners').select('*').order('sort_order');
    if (banners && banners.length > 0) setState(s => ({ ...s, banners }));

    // 공지
    const { data: notices } = await sb.from('notices').select('*').order('created_at', { ascending: false });
    if (notices) setState(s => ({ ...s, notices }));

    // 발표
    const { data: announcements } = await sb.from('announcements').select('*').order('created_at', { ascending: false });
    if (announcements) setState(s => ({ ...s, announcements }));

    // 강좌 + 영상
    const { data: courses } = await sb.from('courses').select(`*, subjects(name,color), videos(*)`).order('sort_order');
    if (courses && courses.length > 0) {
      const mapped = courses.map(c => ({
        id: c.id, subject: c.subjects?.name || '', color: c.subjects?.color || '#006241',
        name: c.title, description: c.description, grade: c.grade || '',
        days: c.days || 0, duration: c.duration || 0, teacher: c.teacher || '',
        price: c.price || '', badge: c.badge || null, intro: c.intro || '',
        target: c.target || '', curriculum: c.curriculum || '', teacherDesc: c.teacher_desc || '',
        youtube: c.youtube || '',
        lectures: (c.videos || []).sort((a,b) => a.sort_order - b.sort_order).map(v => ({
          id: v.id, title: v.title, videoUrl: v.youtube_id ? `https://www.youtube.com/watch?v=${v.youtube_id}` : '', youtubeId: v.youtube_id,
        })),
      }));
      setState(s => ({ ...s, courses: mapped }));
    }

    // 수강생 (강좌 배정용 — student 역할만)
    const { data: students } = await sb.from('students').select('*, enrollments(course_id)').eq('is_active', true).eq('role', 'student');
    if (students) {
      const mapped = students.map(st => ({
        id: st.id, name: st.name, email: st.email, provider: st.login_provider,
        grade: st.grade || '', school: st.school || '', subjects: st.subjects || [],
        enrolledCourses: (st.enrollments || []).map(e => e.course_id),
        phone: st.phone || '', role: 'student',
      }));
      setDbStudents(mapped);
    }


    // 전체 회원 (student, parent, teacher 모두) — parent_id + 수강 여부 포함
    const { data: allMembers } = await sb.from('students').select('*, enrollments(course_id)').in('role', ['student','parent','teacher']).eq('is_active', true);
    if (allMembers) {
      setDbMembers(allMembers.map(m => ({
        id: m.id, name: m.name, email: m.email, provider: m.login_provider,
        role: m.role, grade: m.grade || '', school: m.school || '',
        phone: m.phone || '', address: m.address || '', createdAt: m.created_at,
        parentId: m.parent_id || null,
        isEnrollee: (m.enrollments || []).length > 0,
      })));
    }

    // 선생님
    const { data: teachers } = await sb.from('students').select('*').in('role', ['teacher','pending_teacher']);
    if (teachers) {
      setDbTeachers(teachers.map(t => ({
        id: t.id, name: t.name, email: t.email, role: t.role,
        subjects: t.subjects || [], createdAt: t.created_at,
      })));
    }

    // 승인 대기
    const { data: pending } = await sb.from('students').select('*').in('role', ['pending_student','pending_parent','pending_teacher']);
    if (pending) setDbPending(pending.map(p => ({ id: p.id, name: p.name, phone: p.phone, role: p.role, grade: p.grade, school: p.school })));

    // 반 목록
    const { data: classes } = await sb
      .from('classes')
      .select('*, teachers(name)')
      .order('created_at', { ascending: false });

    if (classes) {
      setDbClasses(classes.map(c => ({
        id: c.id,
        className: c.class_name || '',
        subject: c.subject || '',
        grade: c.grade || '',
        teacherId: c.teacher_id || null,
        teacherName: c.teachers?.name || '',
        createdAt: c.created_at,
      })));
    }

  }

  // 수강생 학년 업데이트
  async function updateStudentGrade(studentId, grade) {
    await sb.from('students').update({ grade }).eq('id', studentId);
    setDbStudents(s => s.map(st => st.id === studentId ? { ...st, grade } : st));
  }

  // 수강생 과목 토글
  async function toggleSubject(studentId, subject) {
    const st = dbStudents.find(s => s.id === studentId);
    const subjects = st.subjects || [];
    const updated = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
    await sb.from('students').update({ subjects: updated }).eq('id', studentId);
    setDbStudents(s => s.map(st => st.id === studentId ? { ...st, subjects: updated } : st));
  }

  // 강좌 수강 토글
  async function toggleEnroll(studentId, courseId) {
    const st = dbStudents.find(s => s.id === studentId);
    const enrolled = st.enrolledCourses.includes(courseId);
    if (enrolled) {
      await sb.from('enrollments').delete().eq('student_id', studentId).eq('course_id', courseId);
    } else {
      await sb.from('enrollments').insert({ student_id: studentId, course_id: courseId });
    }
    setDbStudents(s => s.map(st => {
      if (st.id !== studentId) return st;
      const ec = enrolled ? st.enrolledCourses.filter(c => c !== courseId) : [...st.enrolledCourses, courseId];
      return { ...st, enrolledCourses: ec };
    }));
  }

  // 선생님 승인
  async function approveTeacher(teacherId) {
    await sb.from('students').update({ role: 'teacher', is_active: true }).eq('id', teacherId);
    setDbTeachers(ts => ts.map(t => t.id === teacherId ? { ...t, role: 'teacher' } : t));
  }

  async function rejectTeacher(teacherId) {
    if (!confirm('이 선생님 계정을 삭제할까요?')) return;
    await sb.from('students').delete().eq('id', teacherId);
    setDbTeachers(ts => ts.filter(t => t.id !== teacherId));
  }

  async function toggleTeacherSubject(teacherId, subject) {
    const t = dbTeachers.find(x => x.id === teacherId);
    const subjects = t.subjects || [];
    const updated = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
    await sb.from('students').update({ subjects: updated }).eq('id', teacherId);
    setDbTeachers(ts => ts.map(x => x.id === teacherId ? { ...x, subjects: updated } : x));
  }

  if (!authed) return React.createElement(AdminLogin, { onLogin:()=>setAuthed(true) });

  const tabs = [
    { id:'banner',  label:'배너 관리' },
    { id:'notice',  label:'공지사항' },
    { id:'course',  label:'강좌 관리' },
    { id:'enrollee',label:'수강생 관리' },
    { id:'member',  label:'회원 정보' },
    { id:'teacher', label:'👨‍🏫 선생님 관리' },
    { id:'class', label:'반 관리' },
    { id:'feature', label:'섹션 편집' },
  ];

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box' };
  const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px', display:'block' };
  const cardS = { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', marginBottom:'12px' };
  const btnS = (color='#00754A') => ({ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' });
  const btnOutS = { background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' };

  const ROLE_LABEL = { student:'학생', parent:'학부모', teacher:'선생님' };
  const ROLE_ICON  = { student:'🎓', parent:'👨‍👩‍👧', teacher:'👨‍🏫' };

  // 배너 함수들
  async function updateBanner(id, field, val) {
    setState(s => ({ ...s, banners: s.banners.map(b => b.id===id ? {...b,[field]:val} : b) }));
    await sb.from('banners').update({ [field]: val }).eq('id', id);
  }
  async function addBanner() {
    const newB = { bg:'#006241', subtitle:'새 배너 부제목', title:'새 배너 제목', label:'개강 예정', badge:'새로운', active:true, cta:'자세히 보기', sort_order: state.banners.length+1 };
    const { data } = await sb.from('banners').insert(newB).select().single();
    if (data) setState(s => ({ ...s, banners: [...s.banners, data] }));
  }
  async function deleteBanner(id) {
    await sb.from('banners').delete().eq('id', id);
    setState(s => ({ ...s, banners: s.banners.filter(b => b.id!==id) }));
    if (editingBanner?.id===id) setEditingBanner(null);
  }

  // 공지 함수들
  async function addNotice() {
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'.');
    const { data } = await sb.from('notices').insert({ type:'공지', text:'새 공지사항 제목', date: today }).select().single();
    if (data) setState(s => ({ ...s, notices: [data, ...s.notices] }));
  }
  async function deleteNotice(id) {
    await sb.from('notices').delete().eq('id', id);
    setState(s => ({ ...s, notices: s.notices.filter(n => n.id!==id) }));
  }
  async function addAnnouncement() {
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'.');
    const { data } = await sb.from('announcements').insert({ title:'새 공지사항', date: today }).select().single();
    if (data) setState(s => ({ ...s, announcements: [data, ...s.announcements] }));
  }
  async function deleteAnnouncement(id) {
    await sb.from('announcements').delete().eq('id', id);
    setState(s => ({ ...s, announcements: s.announcements.filter(a => a.id!==id) }));
  }

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    // Header
    React.createElement('div', { style:{ background:'#1E3932', padding:'24px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#cba258', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '★'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, 'B2빅뱅학원 관리자'),
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.5)', fontFamily:'Manrope, sans-serif' } }, '관리자 전용 페이지')
        )
      ),
      React.createElement('button', { onClick:onLogout, style:{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그아웃')
    ),

    // Tabs
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 40px', display:'flex', gap:'0', overflowX:'auto' } },
      tabs.map(t =>
        React.createElement('button', { key:t.id, onClick:()=>setTab(t.id), style:{ padding:'16px 20px', background:'none', border:'none', borderBottom: tab===t.id?'2px solid #006241':'2px solid transparent', fontSize:'14px', fontWeight:'700', color: tab===t.id?'#006241':'rgba(0,0,0,0.55)', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease', marginBottom:'-1px', whiteSpace:'nowrap' } }, t.label)
      )
    ),

    // Content
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 40px' } },

      /* ── BANNER TAB ── */
      tab==='banner' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '히어로 배너'),
          React.createElement('button', { onClick:addBanner, style:btnS() }, '+ 배너 추가')
        ),
        state.banners.map(b =>
          React.createElement('div', { key:b.id, style:cardS },
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: editingBanner?.id===b.id?'12px':0 } },
              React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
                React.createElement('div', { style:{ width:'28px', height:'28px', borderRadius:'6px', background:b.bg, flexShrink:0 } }),
                React.createElement('div', null,
                  React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, b.title),
                  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, b.subtitle)
                ),
                React.createElement('div', { style:{ background: b.active?'#d4e9e2':'#f2f0eb', color: b.active?'#006241':'rgba(0,0,0,0.45)', borderRadius:'8px', padding:'2px 10px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, b.active?'노출중':'숨김')
              ),
              React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                React.createElement('button', { onClick:()=>setEditingBanner(editingBanner?.id===b.id?null:b), style:btnS('#2b5148') }, editingBanner?.id===b.id?'닫기':'편집'),
                React.createElement('button', { onClick:()=>deleteBanner(b.id), style:btnOutS }, '삭제')
              )
            ),
            editingBanner?.id===b.id && React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
              [{f:'title',l:'제목'},{f:'subtitle',l:'부제목'},{f:'badge',l:'뱃지'},{f:'label',l:'라벨'},{f:'cta',l:'버튼 텍스트'},{f:'bg',l:'배경색 (#hex)'},{f:'image',l:'배경 이미지 URL'},{f:'youtube',l:'배경 유튜브 링크'}].map(({f,l})=>
                React.createElement('div', {key:f},
                  React.createElement('label',{style:labelS},l),
                  React.createElement('input',{value:b[f]||'',onChange:e=>updateBanner(b.id,f,e.target.value),style:inputS})
                )
              ),
              React.createElement('div', {key:'active'},
                React.createElement('label',{style:labelS},'노출 여부'),
                React.createElement('select',{value:b.active?'true':'false',onChange:e=>updateBanner(b.id,'active',e.target.value==='true'),style:inputS},
                  React.createElement('option',{value:'true'},'노출'),
                  React.createElement('option',{value:'false'},'숨김')
                )
              )
            )
          )
        )
      ),

      /* ── NOTICE TAB ── */
      tab==='notice' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항 관리'),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            React.createElement('button', { onClick:addNotice, style:btnS() }, '+ 공지 추가'),
            React.createElement('button', { onClick:addAnnouncement, style:btnS('#2b5148') }, '+ 발표 추가')
          )
        ),
        editingNotice
          ? React.createElement('div', null,
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' } },
                React.createElement('button', { onClick:()=>setEditingNotice(null), style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '← 목록으로'),
                React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지 편집')
              ),
              React.createElement('div', { style:{ ...cardS, display:'flex', flexDirection:'column', gap:'14px' } },
                React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
                  editingNotice.type !== undefined && React.createElement('select', { value:editingNotice.type, onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,type:v})); setState(s=>({...s,notices:s.notices.map(x=>x.id===editingNotice.id?{...x,type:v}:x)})); }, style:{ ...inputS, width:'80px', flexShrink:0 } },
                    ['강좌','이벤트','공지','모집'].map(t=>React.createElement('option',{key:t,value:t},t))
                  ),
                  React.createElement('input', { value:editingNotice.text||editingNotice.title||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,text:v,title:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,text:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,title:v}:x) })); }, placeholder:'제목', style:{ ...inputS, flex:1 } }),
                  React.createElement('input', { value:editingNotice.date||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,date:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,date:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,date:v}:x) })); }, style:{ ...inputS, width:'110px', flexShrink:0 } })
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'본문 내용'),
                  React.createElement('textarea',{value:editingNotice.content||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,content:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,content:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,content:v}:x) })); },placeholder:'공지 내용을 입력하세요',rows:6,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'유튜브 링크 (선택)'),
                  React.createElement('input',{value:editingNotice.youtube||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,youtube:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x) })); },placeholder:'https://youtube.com/watch?v=...',style:inputS})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'외부 링크 (선택)'),
                  React.createElement('input',{value:editingNotice.link||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,link:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,link:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,link:v}:x) })); },placeholder:'https://blog.naver.com/...',style:inputS})
                ),
                React.createElement('button', { onClick: async ()=>{
                  if (editingNotice.type !== undefined) {
                    await window.supabase.from('notices').update({ type:editingNotice.type, text:editingNotice.text, date:editingNotice.date }).eq('id', editingNotice.id);
                  } else {
                    await window.supabase.from('announcements').update({ title:editingNotice.title, date:editingNotice.date }).eq('id', editingNotice.id);
                  }
                  setEditingNotice(null);
                }, style:{ ...btnS(), alignSelf:'flex-start' } }, '✓ 저장 완료')
              )
            )
          : React.createElement('div', null,
              React.createElement('h3', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'8px', letterSpacing:'0.05em', textTransform:'uppercase' } }, '강좌/이벤트 공지'),
              state.notices.map(n =>
                React.createElement('div', { key:n.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }, onClick:()=>setEditingNotice(n) },
                  React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.type),
                  React.createElement('span', { style:{ fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flex:1 } }, n.text),
                  React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.date),
                  React.createElement('button', { onClick:e=>{ e.stopPropagation(); deleteNotice(n.id); }, style:{ ...btnOutS, flexShrink:0 } }, '삭제')
                )
              ),
              React.createElement('h3', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', margin:'16px 0 8px', letterSpacing:'0.05em', textTransform:'uppercase' } }, '공지사항 발표'),
              state.announcements.map(a =>
                React.createElement('div', { key:a.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }, onClick:()=>setEditingNotice(a) },
                  React.createElement('span', { style:{ fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flex:1 } }, a.title),
                  React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, a.date),
                  React.createElement('button', { onClick:e=>{ e.stopPropagation(); deleteAnnouncement(a.id); }, style:{ ...btnOutS, flexShrink:0 } }, '삭제')
                )
              )
            )
      ),

      /* ── COURSE TAB ── */
      tab==='course' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '강좌 목록'),
          React.createElement('button', { onClick: async function() {
            try {
              // subjects 테이블에서 수학 id 조회
              var subjRes = await window.supabase.from('subjects').select('id,name,color').eq('name','수학').single();
              var subjId = subjRes.data ? subjRes.data.id : null;
              var subjName = subjRes.data ? subjRes.data.name : '수학';
              var subjColor = subjRes.data ? subjRes.data.color : '#006241';
              // subjects가 없으면 첫 번째 subject 사용
              if (!subjId) {
                var allSubj = await window.supabase.from('subjects').select('id,name,color').limit(1).single();
                if (allSubj.data) { subjId = allSubj.data.id; subjName = allSubj.data.name; subjColor = allSubj.data.color; }
              }
              var insertRes = await window.supabase.from('courses').insert({ subject_id: subjId, title:'새 강좌', teacher:'강사명', grade:'고1', price:'0원', sort_order: state.courses.length+1 }).select('*, subjects(name,color)').single();
              var data = insertRes.data;
              if (data) {
                setState(function(s) { return {...s, courses:[...s.courses,{ id:data.id, subject:data.subjects?.name||subjName, color:data.subjects?.color||subjColor, name:data.title, teacher:data.teacher||'', grade:data.grade||'', price:data.price||'', badge:null, lectures:[] }]}; });
              } else {
                alert('강좌 추가 실패: ' + JSON.stringify(insertRes.error));
              }
            } catch(e) { alert('오류: ' + e.message); }
          }, style:btnS() }, '+ 강좌 추가')
        ),
        state.courses.map(c =>
          React.createElement('div', { key:c.id, style:cardS },
            React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:editingCourse===c.id?'12px':0 } },
              React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
                React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif' } }, c.subject),
                React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name),
                React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, `${c.teacher} · ${c.grade}`)
              ),
              React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                editingCourse===c.id && React.createElement('button', { onClick: async ()=>{
                  const subj = await window.supabase.from('subjects').select('id').eq('name', c.subject).single();
                  await window.supabase.from('courses').update({ title:c.name, teacher:c.teacher, grade:c.grade, price:c.price, badge:c.badge, description:c.description, intro:c.intro, target:c.target, curriculum:c.curriculum, teacher_desc:c.teacherDesc, youtube:c.youtube, subject_id:subj.data?.id }).eq('id', c.id);
                  alert('저장되었습니다!');
                }, style:btnS('#cba258') }, '💾 저장'),
                React.createElement('button', { onClick:()=>setEditingCourse(editingCourse===c.id?null:c.id), style:btnS('#2b5148') }, editingCourse===c.id?'닫기':'편집'),
                React.createElement('button', { onClick: async ()=>{ if(!confirm('정말 삭제할까요?')) return; await window.supabase.from('courses').delete().eq('id',c.id); setState(s=>({...s,courses:s.courses.filter(x=>x.id!==c.id)})); setEditingCourse(null); }, style:btnOutS }, '삭제')
              )
            ),
            editingCourse===c.id && React.createElement('div', { style:{ paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' } },
                [{f:'name',l:'강좌명'},{f:'teacher',l:'강사'},{f:'price',l:'수강료'},{f:'badge',l:'뱃지'}].map(({f,l})=>
                  React.createElement('div', {key:f},
                    React.createElement('label',{style:labelS},l),
                    React.createElement('input',{value:c[f]||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,[f]:e.target.value}:x)})),style:inputS})
                  )
                ),
                React.createElement('div', {key:'subject'},
                  React.createElement('label',{style:labelS},'과목'),
                  React.createElement('select',{value:c.subject||'수학',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,subject:e.target.value}:x)})),style:inputS},
                    SUBJECTS.map(sub=>React.createElement('option',{key:sub,value:sub},sub))
                  )
                ),
                React.createElement('div', {key:'grade'},
                  React.createElement('label',{style:labelS},'학년'),
                  React.createElement('select',{value:c.grade||'고1',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,grade:e.target.value}:x)})),style:inputS},
                    GRADES.map(g=>React.createElement('option',{key:g,value:g},g))
                  )
                )
              ),
              React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
                React.createElement('div', null, React.createElement('label',{style:labelS},'강좌 소개'), React.createElement('textarea',{value:c.intro||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,intro:e.target.value}:x)})),placeholder:'이 강좌에 대한 상세 소개를 입력하세요',rows:4,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
                React.createElement('div', null, React.createElement('label',{style:labelS},'수강 대상'), React.createElement('textarea',{value:c.target||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,target:e.target.value}:x)})),placeholder:'어떤 학생에게 맞는 강좌인지 입력하세요',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
                React.createElement('div', null, React.createElement('label',{style:labelS},'커리큘럼 (줄바꿈으로 구분)'), React.createElement('textarea',{value:c.curriculum||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,curriculum:e.target.value}:x)})),placeholder:'1. 수열의 개념\n2. 극한의 이해',rows:5,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
                React.createElement('div', null, React.createElement('label',{style:labelS},'강사 소개'), React.createElement('textarea',{value:c.teacherDesc||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,teacherDesc:e.target.value}:x)})),placeholder:'강사 경력, 특징 등',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
                React.createElement('div', null, React.createElement('label',{style:labelS},'미리보기 유튜브 링크 (선택)'), React.createElement('input',{value:c.youtube||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,youtube:e.target.value}:x)})),placeholder:'https://youtube.com/watch?v=...',style:inputS})),
                // 강의 목록
                React.createElement('div', { style:{ borderTop:'2px solid #d4e9e2', paddingTop:'14px', marginTop:'4px' } },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
                    React.createElement('label', { style:{ fontSize:'13px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '온라인 강의 목록'),
                    React.createElement('button', { onClick: async function() {
                      var newTitle = (((c.lectures||[]).length)+1) + '강: 새 강의';
                      var { data } = await window.supabase.from('videos').insert({ course_id:c.id, title:newTitle, youtube_id:'', sort_order:(c.lectures||[]).length+1 }).select().single();
                      if (data) setState(function(s) { return {...s, courses:s.courses.map(function(x) { return x.id===c.id ? {...x, lectures:[...(x.lectures||[]),{id:data.id,title:data.title,videoUrl:'',youtubeId:''}]} : x; })}; });
                    }, style:btnS() }, '+ 강의 추가')
                  ),
                  (c.lectures||[]).length === 0
                    ? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '아직 강의가 없습니다.')
                    : (c.lectures||[]).map(function(lec, idx) {
                        return React.createElement('div', { key:lec.id, style:{ background:'#f9f9f9', borderRadius:'8px', padding:'10px 12px', marginBottom:'8px', display:'flex', flexDirection:'column', gap:'6px' } },
                          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
                            React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (idx+1)+'강'),
                            React.createElement('input', { value:lec.title||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,title:val}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({title:e.target.value}).eq('id',lec.id); }, placeholder:'강의 제목', style:{...inputS,marginBottom:0,flex:1} }),
                            React.createElement('button', { onClick:async function(){ await window.supabase.from('videos').delete().eq('id',lec.id); setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.filter(function(l){ return l.id!==lec.id; })}:x; })}; }); }, style:{...btnOutS,padding:'4px 10px',fontSize:'12px'} }, '삭제')
                          ),
                          React.createElement('input', { value:lec.youtubeId||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,youtubeId:val,videoUrl:val?'https://www.youtube.com/watch?v='+val:''}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({youtube_id:e.target.value}).eq('id',lec.id); }, placeholder:'YouTube 영상 ID (ex: dQw4w9WgXcQ)', style:{...inputS,marginBottom:0,fontSize:'12px'} })
                        );
                      })
                )
              )
            )
          )
        )
      ),

      /* ── 수강생 관리 TAB ── */
      tab==='enrollee' && React.createElement('div', null,

        // 필터 바 — 초/중/고, 학년, 학교 항상 3개 표시. 독립 필터링
        React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginRight:'8px', flexShrink:0 } },
            `수강생 관리 (${dbStudents.length}명)`),

          // 초/중/고 드롭다운
          React.createElement('select', {
            value: filterLevel,
            onChange: function(e) { setFilterLevel(e.target.value); setFilterGrade('전체'); setFilterSchool('전체'); setSelectedIds([]); },
            style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
          },
            React.createElement('option', { value:'전체' }, '전체'),
            React.createElement('option', { value:'초등' }, '초'),
            React.createElement('option', { value:'중등' }, '중'),
            React.createElement('option', { value:'고등' }, '고')
          ),

          // 학년 드롭다운 — 항상 표시, 초/중/고에 따라 옵션 변경
          React.createElement('select', {
            value: filterGrade,
            onChange: function(e) { setFilterGrade(e.target.value); setSelectedIds([]); },
            style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
          },
            React.createElement('option', { value:'전체' }, '전체 학년'),
            filterLevel === '전체'
              ? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
              : SCHOOL_LEVELS[filterLevel].grades.map(function(g){ return React.createElement('option',{key:g,value:g},g); })
          ),

          // 학교 드롭다운 — 항상 표시, 초/중/고에 따라 옵션 변경
          React.createElement('select', {
            value: filterSchool,
            onChange: function(e) { setFilterSchool(e.target.value); setSelectedIds([]); },
            style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
          },
            React.createElement('option', { value:'전체' }, '전체 학교'),
            (filterLevel === '전체'
              ? SCHOOLS.filter(function(s){ return s !== '전체'; })
              : SCHOOL_LEVELS[filterLevel].schools
            ).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
          )
        ),

        // 일괄 변경 바 (선택 시)
        selectedIds.length > 0 && React.createElement('div', { style:{ background:'#1E3932', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
          React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, `${selectedIds.length}명 선택됨`),

          React.createElement('select', {
            value: bulkGrade,
            onChange: function(e) { setBulkGrade(e.target.value); },
            style:{ border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', cursor:'pointer' }
          },
            React.createElement('option', { value:'' }, '학년 일괄 변경'),
            ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
          ),

          React.createElement('select', {
            value: bulkSchool,
            onChange: function(e) { setBulkSchool(e.target.value); },
            style:{ border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', cursor:'pointer' }
          },
            React.createElement('option', { value:'' }, '학교 일괄 변경'),
            SCHOOLS.filter(function(s){ return s !== '전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
          ),

          React.createElement('button', {
            onClick: async function() {
              if (!bulkGrade && !bulkSchool) { alert('변경할 학년 또는 학교를 선택하세요.'); return; }
              var updates = {};
              if (bulkGrade) updates.grade = bulkGrade;
              if (bulkSchool) updates.school = bulkSchool;
              for (var i = 0; i < selectedIds.length; i++) {
                await sb.from('students').update(updates).eq('id', selectedIds[i]);
              }
              setDbStudents(function(prev) {
                return prev.map(function(s) {
                  if (!selectedIds.includes(s.id)) return s;
                  return Object.assign({}, s, bulkGrade?{grade:bulkGrade}:{}, bulkSchool?{school:bulkSchool}:{});
                });
              });
              setBulkGrade(''); setBulkSchool(''); setSelectedIds([]);
              alert('저장 완료!');
            },
            style:{ background:'#00754A', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, '💾 일괄저장'),

          React.createElement('button', {
            onClick: async function() {
              if (!confirm(`선택한 ${selectedIds.length}명을 삭제할까요?`)) return;
              for (var i = 0; i < selectedIds.length; i++) {
                await sb.from('students').delete().eq('id', selectedIds[i]);
              }
              setDbStudents(function(prev) { return prev.filter(function(s){ return !selectedIds.includes(s.id); }); });
              setDbMembers(function(prev) { return prev.filter(function(m){ return !selectedIds.includes(m.id); }); });
              setSelectedIds([]);
            },
            style:{ background:'#c82014', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, '🗑 삭제'),

          React.createElement('button', {
            onClick: function() { setSelectedIds([]); setBulkGrade(''); setBulkSchool(''); },
            style:{ background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, '취소')
        ),

        // 학생 목록
        (function() {
          var filtered = dbStudents.filter(function(st) {
            // 학교급(초/중/고) 필터: 학년 기준으로 판단
            if (filterLevel !== '전체') {
              var lvGrades = SCHOOL_LEVELS[filterLevel].grades;
              if (!lvGrades.includes(st.grade)) return false;
            }
            // 학교 필터
            if (filterSchool !== '전체' && st.school !== filterSchool) return false;
            // 학년 필터
            if (filterGrade !== '전체' && st.grade !== filterGrade) return false;
            return true;
          });

          if (filtered.length === 0) return React.createElement('div', { style:{ ...cardS, textAlign:'center', padding:'48px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '해당하는 수강생이 없습니다');

          var allSelected = filtered.length > 0 && filtered.every(function(s){ return selectedIds.includes(s.id); });

          return React.createElement('div', null,
            // 전체선택 헤더
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 18px', marginBottom:'4px' } },
              React.createElement('div', {
                onClick: function() {
                  var ids = filtered.map(function(s){ return s.id; });
                  if (allSelected) setSelectedIds(function(prev){ return prev.filter(function(id){ return !ids.includes(id); }); });
                  else setSelectedIds(function(prev){ return Array.from(new Set(prev.concat(ids))); });
                },
                style:{ width:'18px', height:'18px', borderRadius:'4px', border: allSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: allSelected?'#1E3932':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
              },
                allSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
                  React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
                )
              ),
              React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, `전체 선택 (${filtered.length}명)`)
            ),

            // 카드 목록
            filtered.map(function(st) {
              var isSelected = selectedIds.includes(st.id);
              return React.createElement('div', { key:st.id, style:{ ...cardS, border: isSelected?'2px solid #1E3932':'2px solid transparent', transition:'border 0.15s' } },
                React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
                  React.createElement('div', {
                    onClick: function() { setSelectedIds(function(prev){ return isSelected?prev.filter(function(i){ return i!==st.id; }):[...prev,st.id]; }); },
                    style:{ width:'18px', height:'18px', borderRadius:'4px', border: isSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: isSelected?'#1E3932':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
                  },
                    isSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
                      React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
                    )
                  ),
                  React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
                  React.createElement('div', { style:{ flex:1, minWidth:0 }, onClick:function(){ setExpandedStudent(expandedStudent===st.id?null:st.id); }, style2:{ cursor:'pointer' } },
                    React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
                    React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [st.school, st.grade, st.phone].filter(Boolean).join(' · ') || '정보 없음')
                  ),
                  React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap' } },
                    st.grade && React.createElement('span', { style:{ background:'#1E3932', color:'#fff', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
                    (st.subjects||[]).map(function(sub){ return React.createElement('span', { key:sub, style:{ background:'#d4e9e2', color:'#006241', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub); })
                  ),
                  React.createElement('span', {
                    onClick: function() { setExpandedStudent(expandedStudent===st.id?null:st.id); },
                    style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', cursor:'pointer', transition:'transform 0.2s', transform: expandedStudent===st.id?'rotate(180deg)':'none', flexShrink:0 }
                  }, '▾')
                ),

                expandedStudent===st.id && React.createElement('div', { style:{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
                  // 학년/학교 개별 편집
                  React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' } },
                    React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학년'),
                    React.createElement('select', {
                      value: st.grade || '',
                      onChange: function(e) { updateStudentGrade(st.id, e.target.value || null); },
                      style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
                    },
                      React.createElement('option', { value:'' }, '선택'),
                      ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
                    ),
                    React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학교'),
                    React.createElement('select', {
                      value: st.school || '',
                      onChange: async function(e) {
                        var school = e.target.value;
                        await sb.from('students').update({ school }).eq('id', st.id);
                        setDbStudents(function(prev){ return prev.map(function(s){ return s.id===st.id?Object.assign({},s,{school}):s; }); });
                      },
                      style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
                    },
                      React.createElement('option', { value:'' }, '선택'),
                      SCHOOLS.filter(function(s){ return s!=='전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
                    )
                  ),
                  // 과목 설정
                  React.createElement('div', { style:{ marginBottom:'14px' } },
                    React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 과목'),
                    React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                      SUBJECTS.map(function(sub) {
                        return React.createElement('button', { key:sub, onClick:function(){ toggleSubject(st.id, sub); },
                          style:{ background:(st.subjects||[]).includes(sub)?'#006241':'#f2f0eb', color:(st.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.7)', border:(st.subjects||[]).includes(sub)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub);
                      })
                    )
                  ),
                  // 수강 강좌
                  React.createElement('div', null,
                    React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 강좌 배정'),
                    state.courses.length === 0
                      ? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '등록된 강좌가 없습니다')
                      : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
                          SUBJECTS.map(function(sub) {
                            var subCourses = state.courses.filter(function(c){ return c.subject===sub; });
                            if (subCourses.length === 0) return null;
                            return React.createElement('div', { key:sub },
                              React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } }, sub),
                              React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                                subCourses.map(function(c) {
                                  return React.createElement('button', { key:c.id, onClick:function(){ toggleEnroll(st.id, c.id); },
                                    style:{ background:st.enrolledCourses.includes(c.id)?'#006241':'#f2f0eb', color:st.enrolledCourses.includes(c.id)?'#fff':'rgba(0,0,0,0.55)', border:st.enrolledCourses.includes(c.id)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } },
                                    c.name + (c.grade?' ('+c.grade+')':'')
                                  );
                                })
                              )
                            );
                          })
                        )
                  )
                )
              );
            })
          );
        })()
      ),

            /* ── 회원 관리 TAB ── */
      tab==='member' && React.createElement('div', null,
        // 헤더 + 검색 + 드롭다운
        React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '회원 정보'),

          // 검색창
          React.createElement('input', {
            value: memberSearch,
            onChange: function(e) { setMemberSearch(e.target.value); setExpandedMember(null); },
            placeholder: '이름 또는 전화번호 검색',
            style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', outline:'none', background:'#fff', minWidth:'180px', flex:1 }
          }),

          // 구분 드롭다운
          React.createElement('select', {
            value: memberFilter,
            onChange: function(e) { setMemberFilter(e.target.value); setExpandedMember(null); setEditingMember(null); },
            style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', background:'#fff', cursor:'pointer', outline:'none' }
          },
            React.createElement('option', { value:'전체' }, '전체 ' + dbMembers.length + '명'),
            React.createElement('option', { value:'수강생' }, '수강생 ' + dbMembers.filter(function(m){ return m.role==='student'&&m.isEnrollee; }).length + '명'),
            React.createElement('option', { value:'일반회원' }, '일반회원 ' + dbMembers.filter(function(m){ return m.role==='student'&&!m.isEnrollee; }).length + '명'),
            React.createElement('option', { value:'학부모' }, '학부모 ' + dbMembers.filter(function(m){ return m.role==='parent'; }).length + '명'),
            React.createElement('option', { value:'선생님' }, '선생님 ' + dbMembers.filter(function(m){ return m.role==='teacher'; }).length + '명')
          )
        ),

        // 목록
        (function() {
          var filtered = dbMembers.filter(function(m) {
            if (memberFilter === '수강생'   && !(m.role==='student' && m.isEnrollee))  return false;
            if (memberFilter === '일반회원' && !(m.role==='student' && !m.isEnrollee)) return false;
            if (memberFilter === '학부모'   && m.role !== 'parent')  return false;
            if (memberFilter === '선생님'   && m.role !== 'teacher') return false;
            if (memberSearch.trim()) {
              var q = memberSearch.trim().toLowerCase();
              if (!(m.name||'').toLowerCase().includes(q) && !(m.phone||'').includes(q)) return false;
            }
            return true;
          });

          if (filtered.length === 0) return [React.createElement('div', { key:'empty', style:{ ...cardS, textAlign:'center', padding:'48px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '해당 회원이 없습니다')];

          return filtered.map(function(m) {
            var linkedParent = m.role==='student' && m.parentId ? dbMembers.find(function(x){ return x.id===m.parentId; }) : null;
            var linkedChildren = m.role==='parent' ? dbMembers.filter(function(x){ return x.role==='student' && x.parentId===m.id; }) : [];
            var roleBg    = m.role==='teacher'?'#d4e9e2': m.role==='parent'?'#fff3cd': m.isEnrollee?'#e8f4fd':'#f2f0eb';
            var roleColor = m.role==='teacher'?'#006241': m.role==='parent'?'#856404': m.isEnrollee?'#0066cc':'rgba(0,0,0,0.45)';
            var roleLabel = m.role==='teacher'?'선생님': m.role==='parent'?'학부모': m.isEnrollee?'수강생':'일반회원';
            var isEditing = editingMember === m.id;

            return React.createElement('div', { key:m.id, style:{ ...cardS, border: isEditing?'2px solid #006241':'2px solid transparent', transition:'border 0.15s' } },
              // 헤더
              React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
                React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0, cursor:'pointer' }, onClick:function(){ setExpandedMember(expandedMember===m.id?null:m.id); setEditingMember(null); } },
                  React.createElement('div', { style:{ width:'40px', height:'40px', borderRadius:'50%', background:roleBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:roleColor, fontFamily:'Manrope, sans-serif', flexShrink:0 } }, m.name[0]),
                  React.createElement('div', { style:{ minWidth:0 } },
                    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
                      React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, m.name),
                      React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:roleBg, color:roleColor, borderRadius:'6px', padding:'2px 8px', fontFamily:'Manrope, sans-serif' } }, roleLabel),
                      linkedParent && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학부모: ' + linkedParent.name),
                      linkedChildren.length > 0 && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '자녀: ' + linkedChildren.map(function(c){ return c.name; }).join(', '))
                    ),
                    React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } },
                      [m.phone, m.grade, m.school].filter(Boolean).join(' · ') || m.email || '—'
                    )
                  )
                ),
                // 편집/삭제 버튼
                React.createElement('div', { style:{ display:'flex', gap:'6px', flexShrink:0 } },
                  React.createElement('button', {
                    onClick: function() { setEditingMember(isEditing?null:m.id); setExpandedMember(m.id); },
                    style:{ background: isEditing?'#006241':'#f2f0eb', color: isEditing?'#fff':'rgba(0,0,0,0.6)', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
                  }, isEditing ? '닫기' : '수정'),
                  React.createElement('button', {
                    onClick: async function() {
                      if (!confirm(m.name + '님을 삭제할까요?')) return;
                      await sb.from('students').delete().eq('id', m.id);
                      setDbMembers(function(prev){ return prev.filter(function(x){ return x.id!==m.id; }); });
                      setDbStudents(function(prev){ return prev.filter(function(x){ return x.id!==m.id; }); });
                    },
                    style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
                  }, '삭제')
                )
              ),

              // 펼침: 편집 모드
              expandedMember===m.id && isEditing && React.createElement('div', { style:{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
                React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' } },
                  [
                    { key:'name', label:'이름', type:'text' },
                    { key:'phone', label:'전화번호', type:'tel' },
                    { key:'email', label:'이메일', type:'email' },
                    { key:'address', label:'주소', type:'text' },
                  ].map(function(f) {
                    return React.createElement('div', { key:f.key },
                      React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, f.label),
                      React.createElement('input', {
                        value: m[f.key] || '',
                        onChange: function(e) {
                          var val = e.target.value;
                          setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id ? Object.assign({},x,{[f.key]:val}) : x; }); });
                        },
                        style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'6px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', outline:'none', boxSizing:'border-box', background:'#fafafa' }
                      })
                    );
                  })
                ),
                // 학생인 경우 학교/학년 편집
                m.role === 'student' && React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'12px' } },
                  React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학년'),
                  React.createElement('select', {
                    value: m.grade || '',
                    onChange: function(e) { var val=e.target.value; setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{grade:val}):x; }); }); },
                    style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
                  },
                    React.createElement('option', { value:'' }, '선택'),
                    ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
                  ),
                  React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학교'),
                  React.createElement('select', {
                    value: m.school || '',
                    onChange: function(e) { var val=e.target.value; setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{school:val}):x; }); }); },
                    style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
                  },
                    React.createElement('option', { value:'' }, '선택'),
                    SCHOOLS.filter(function(s){ return s!=='전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
                  )
                ),
                // 저장 버튼
                React.createElement('button', {
                  onClick: async function() {
                    var updates = { name:m.name, phone:m.phone, email:m.email, address:m.address };
                    if (m.role==='student') { updates.grade=m.grade; updates.school=m.school; }
                    await sb.from('students').update(updates).eq('id', m.id);
                    if (m.role==='student') {
                      setDbStudents(function(prev){ return prev.map(function(s){ return s.id===m.id?Object.assign({},s,updates):s; }); });
                    }
                    setEditingMember(null);
                    alert('저장 완료!');
                  },
                  style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
                }, '💾 저장')
              ),

              // 펼침: 읽기 모드
              expandedMember===m.id && !isEditing && React.createElement('div', { style:{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
                React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom: (m.role==='student'||m.role==='parent')?'14px':'0' } },
                  [
                    { label:'이름', value:m.name },
                    { label:'구분', value:roleLabel },
                    { label:'전화번호', value:m.phone||'—' },
                    { label:'이메일', value:m.email||'—' },
                    { label:'주소', value:m.address||'—' },
                    { label:'학교', value:m.school||'—' },
                    { label:'학년', value:m.grade||'—' },
                    { label:'가입일', value:m.createdAt?m.createdAt.slice(0,10):'—' },
                  ].map(function(item) {
                    return React.createElement('div', { key:item.label },
                      React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, item.label),
                      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'600', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif' } }, item.value)
                    );
                  })
                ),

                // 학부모 연결 (학생)
                m.role==='student' && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px', marginBottom:'8px' } },
                  React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '학부모 연결'),
                  linkedParent
                    ? React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
                        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
                          React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:'#fff3cd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#856404', fontFamily:'Manrope, sans-serif' } }, linkedParent.name[0]),
                          React.createElement('div', null,
                            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, linkedParent.name),
                            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, linkedParent.phone || linkedParent.email || '—')
                          )
                        ),
                        React.createElement('button', {
                          onClick: async function() {
                            await sb.from('students').update({ parent_id: null }).eq('id', m.id);
                            setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{parentId:null}):x; }); });
                          },
                          style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
                        }, '연결 해제')
                      )
                    : React.createElement('select', {
                        defaultValue: '',
                        onChange: async function(e) {
                          var parentId = e.target.value;
                          if (!parentId) return;
                          await sb.from('students').update({ parent_id: parentId }).eq('id', m.id);
                          setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{parentId}):x; }); });
                        },
                        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', background:'#fff', outline:'none', width:'100%', cursor:'pointer' }
                      },
                        React.createElement('option', { value:'' }, '학부모를 선택하세요'),
                        dbMembers.filter(function(x){ return x.role==='parent'; }).map(function(p){
                          return React.createElement('option', { key:p.id, value:p.id }, p.name + (p.phone?' ('+p.phone+')':''));
                        })
                      )
                ),

                // 자녀 목록 (학부모)
                m.role==='parent' && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px' } },
                  React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '자녀 (' + linkedChildren.length + '명)'),
                  linkedChildren.length === 0
                    ? React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '연결된 자녀가 없습니다')
                    : linkedChildren.map(function(child) {
                        return React.createElement('div', { key:child.id, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
                          React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:'#e8f4fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#0066cc', fontFamily:'Manrope, sans-serif' } }, child.name[0]),
                          React.createElement('div', null,
                            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, child.name),
                            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [child.grade, child.school].filter(Boolean).join(' · ') || '—')
                          )
                        );
                      })
                )
              )
            );
          });
        })()
      ),

            /* ── TEACHER TAB ── */
      tab==='teacher' && React.createElement('div', null,
        // 승인 대기 (학생/학부모)
        dbPending.filter(p => p.role !== 'pending_teacher').length > 0 && React.createElement('div', { style:{ marginBottom:'28px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' } },
            React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '학생/학부모 승인 대기'),
            React.createElement('span', { style:{ background:'#c82014', color:'#fff', borderRadius:'20px', padding:'2px 10px', fontSize:'12px', fontWeight:'800', fontFamily:'Manrope, sans-serif' } }, dbPending.filter(p=>p.role!=='pending_teacher').length)
          ),
          dbPending.filter(p => p.role !== 'pending_teacher').map(p =>
            React.createElement('div', { key:p.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
                React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, p.role==='pending_student'?'🎓':'👨‍👩‍👧'),
                React.createElement('div', null,
                  React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, p.name),
                  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, (p.role==='pending_student'?'학생':'학부모') + (p.school?' · '+p.school:'') + (p.grade?' '+p.grade:'')),
                  React.createElement('div', { style:{ display:'inline-block', background:'#fff3cd', color:'#856404', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '승인 대기 중')
                )
              ),
              React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                React.createElement('button', { onClick: async ()=>{
                  const newRole = p.role==='pending_student'?'student':'parent';
                  await sb.from('students').update({ role:newRole, is_active:true }).eq('id', p.id);
                  setDbPending(ps => ps.filter(x => x.id !== p.id));
                  setDbStudents(prev => [...prev, { id:p.id, name:p.name, phone:p.phone||'', grade:p.grade||'', subjects:[], enrolledCourses:[], role:newRole }]);
                  setDbMembers(prev => [...prev, { id:p.id, name:p.name, phone:p.phone||'', grade:p.grade||'', school:p.school||'', role:newRole }]);
                }, style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✓ 승인'),
                React.createElement('button', { onClick: async ()=>{
                  if (!confirm('이 신청을 거절할까요?')) return;
                  await sb.from('students').delete().eq('id', p.id);
                  setDbPending(ps => ps.filter(x => x.id !== p.id));
                }, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✕ 거절')
              )
            )
          )
        ),

        // 선생님 승인 대기
        React.createElement('div', { style:{ marginBottom:'28px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' } },
            React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '선생님 승인 대기'),
            React.createElement('span', { style:{ background:'#c82014', color:'#fff', borderRadius:'20px', padding:'2px 10px', fontSize:'12px', fontWeight:'800', fontFamily:'Manrope, sans-serif' } }, dbTeachers.filter(t=>t.role==='pending_teacher').length)
          ),
          dbTeachers.filter(t => t.role==='pending_teacher').length === 0
            ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'24px', textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '대기 중인 선생님이 없습니다')
            : dbTeachers.filter(t => t.role==='pending_teacher').map(t =>
                React.createElement('div', { key:t.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' } },
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
                    React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, '👨‍🏫'),
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
                      React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, t.email),
                      React.createElement('div', { style:{ display:'inline-block', background:'#fff3cd', color:'#856404', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '승인 대기 중')
                    )
                  ),
                  React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                    React.createElement('button', { onClick:()=>approveTeacher(t.id), style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✓ 승인'),
                    React.createElement('button', { onClick:()=>rejectTeacher(t.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✕ 거절')
                  )
                )
              )
        ),

        // 승인된 선생님
        React.createElement('div', null,
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, `승인된 선생님 (${dbTeachers.filter(t=>t.role==='teacher').length}명)`),
          dbTeachers.filter(t => t.role==='teacher').length === 0
            ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'24px', textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '승인된 선생님이 없습니다')
            : dbTeachers.filter(t => t.role==='teacher').map(t =>
                React.createElement('div', { key:t.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)' } },
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' } },
                    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
                      React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, '👨‍🏫'),
                      React.createElement('div', null,
                        React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
                        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, t.email)
                      ),
                      React.createElement('div', { style:{ display:'inline-block', background:'#d4e9e2', color:'#006241', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '승인됨')
                    ),
                    React.createElement('button', { onClick:()=>rejectTeacher(t.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '계정 삭제')
                  ),
                  React.createElement('div', null,
                    React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '담당 과목 배정'),
                    React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                      SUBJECTS.map(sub =>
                        React.createElement('button', { key:sub, onClick:()=>toggleTeacherSubject(t.id, sub),
                          style:{ background: (t.subjects||[]).includes(sub)?'#006241':'#f2f0eb', color: (t.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.55)', border: (t.subjects||[]).includes(sub)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub)
                      )
                    )
                  )
                )
              )
        )
      ),


      /* ── CLASS TAB ── */
      tab==='class' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '반 관리'),
          React.createElement('button', {
            onClick: async function() {
              const { data: classes } = await sb
                .from('classes')
                .select('*, teachers(name)')
                .order('created_at', { ascending: false });

              if (classes) {
                setDbClasses(classes.map(c => ({
                  id: c.id,
                  className: c.class_name || '',
                  subject: c.subject || '',
                  grade: c.grade || '',
                  teacherId: c.teacher_id || null,
                  teacherName: c.teachers?.name || '',
                  createdAt: c.created_at,
                })));
              }
            },
            style:btnS('#2b5148')
          }, '새로고침')
        ),

        React.createElement('div', { style:{ ...cardS, marginBottom:'18px' } },
          React.createElement('h3', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '새 반 생성'),

          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' } },
            React.createElement('div', null,
              React.createElement('label', { style:labelS }, '반 이름'),
              React.createElement('input', {
                placeholder:'예: 중2 영어 A반',
                value:newClassName,
                onChange:e=>setNewClassName(e.target.value),
                style:inputS
              })
            ),

            React.createElement('div', null,
              React.createElement('label', { style:labelS }, '과목'),
              React.createElement('select', {
                value:newSubject,
                onChange:e=>setNewSubject(e.target.value),
                style:inputS
              },
                React.createElement('option', { value:'' }, '과목 선택'),
                SUBJECTS.map(sub =>
                  React.createElement('option', { key:sub, value:sub }, sub)
                )
              )
            ),

            React.createElement('div', null,
              React.createElement('label', { style:labelS }, '학년'),
              React.createElement('select', {
                value:newGrade,
                onChange:e=>setNewGrade(e.target.value),
                style:inputS
              },
                React.createElement('option', { value:'' }, '학년 선택'),
                GRADES.map(g =>
                  React.createElement('option', { key:g, value:g }, g)
                )
              )
            ),

            React.createElement('div', null,
              React.createElement('label', { style:labelS }, '담당 선생님'),
              React.createElement('select', {
                value:newTeacherId,
                onChange:e=>setNewTeacherId(e.target.value),
                style:inputS
              },
                React.createElement('option', { value:'' }, '담당 선생님 선택'),
                dbTeachers
                  .filter(t => t.role === 'teacher')
                  .map(t =>
                    React.createElement('option', { key:t.id, value:t.id }, t.name)
                  )
              )
            )
          ),

          React.createElement('button', {
            onClick: async function() {
              if (!newClassName || !newSubject || !newGrade || !newTeacherId) {
                alert('모든 항목을 입력해주세요.');
                return;
              }

              setSaving(true);

              const { data, error } = await sb
                .from('classes')
                .insert({
                  class_name: newClassName,
                  subject: newSubject,
                  grade: newGrade,
                  teacher_id: newTeacherId
                })
                .select('*, teachers(name)')
                .single();

              setSaving(false);

              if (error) {
                alert('반 생성 실패: ' + error.message);
                return;
              }

              if (data) {
                setDbClasses(prev => [{
                  id: data.id,
                  className: data.class_name || '',
                  subject: data.subject || '',
                  grade: data.grade || '',
                  teacherId: data.teacher_id || null,
                  teacherName: data.teachers?.name || '',
                  createdAt: data.created_at,
                }, ...prev]);
              }

              setNewClassName('');
              setNewSubject('');
              setNewGrade('');
              setNewTeacherId('');

              alert('반 생성 완료!');
            },
            disabled:saving,
            style:{ ...btnS(), marginTop:'16px', opacity:saving?0.6:1 }
          }, saving ? '저장 중...' : '반 생성')
        ),

        React.createElement('div', null,
          React.createElement('h3', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, `생성된 반 목록 (${dbClasses.length}개)`),

          dbClasses.length === 0
            ? React.createElement('div', { style:{ ...cardS, textAlign:'center', padding:'36px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '등록된 반이 없습니다.')
            : dbClasses.map(cls =>
                React.createElement('div', { key:cls.id, style:cardS },
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' } },
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, cls.className),
                      React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } },
                        [cls.grade, cls.subject, cls.teacherName ? '담당: ' + cls.teacherName : '담당 미지정'].filter(Boolean).join(' · ')
                      )
                    ),
                    React.createElement('button', {
                      onClick: async function() {
                        if (!confirm(cls.className + ' 반을 삭제할까요?')) return;

                        const { error } = await sb.from('classes').delete().eq('id', cls.id);

                        if (error) {
                          alert('반 삭제 실패: ' + error.message);
                          return;
                        }

                        setDbClasses(prev => prev.filter(c => c.id !== cls.id));
                      },
                      style:btnOutS
                    }, '삭제')
                  )
                )
              )
        )
      ),

      /* ── FEATURE TAB ── */
      tab==='feature' && React.createElement('div', null,
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '홍보 섹션 편집'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' } },
          [{f:'featureEyebrow',l:'눈길끄는 문구 (작은 글자)'},{f:'featureTitle',l:'메인 제목 (큰 글자)'},{f:'featureBody',l:'본문 설명'},{f:'featureCta1',l:'버튼 1 텍스트'},{f:'featureCta2',l:'버튼 2 텍스트'},{f:'heroTitle',l:'메인 배너 큰 제목'}].map(({f,l})=>
            React.createElement('div', {key:f},
              React.createElement('label',{style:labelS},l),
              React.createElement('input',{value:state.siteInfo?.[f]||state.content?.[f]||'',placeholder:l,onChange:e=>{
                if(['featureEyebrow','featureTitle','featureBody','featureCta1','featureCta2'].includes(f))
                  setState(s=>({...s,content:{...(s.content||{}),[f]:e.target.value}}));
                else
                  setState(s=>({...s,siteInfo:{...s.siteInfo,[f]:e.target.value}}));
              },style:inputS})
            )
          )
        ),
        React.createElement('div', { style:{ marginTop:'20px', padding:'16px', background:'#d4e9e2', borderRadius:'8px' } },
          React.createElement('p', { style:{ fontSize:'13px', color:'#006241', fontFamily:'Manrope, sans-serif', fontWeight:'600' } }, '✓ 변경사항은 자동으로 저장됩니다. 홈 화면에서 바로 확인하세요.')
        )
      )
    )
  );
}

Object.assign(window, { AdminPanel });