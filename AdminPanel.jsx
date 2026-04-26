// AdminPanel.jsx — Admin login + full management panel

const GRADES = ['중1','중2','중3','고1','고2','고3'];
const SUBJECTS = ['국어','영어','수학','과학'];

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

  if (!authed) return React.createElement(AdminLogin, { onLogin:()=>setAuthed(true) });

  const tabs = [
    { id:'banner', label:'배너 관리' },
    { id:'notice', label:'공지사항' },
    { id:'course', label:'강좌 관리' },
    { id:'student', label:'회원 관리' },
    { id:'feature', label:'섹션 편집' },
  ];

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box' };
  const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px', display:'block' };
  const cardS = { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', marginBottom:'12px' };
  const btnS = (color='#00754A') => ({ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' });
  const btnOutS = { background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' };

  // 학생 학년 업데이트
  function updateStudentGrade(studentId, grade) {
    setState(s => ({
      ...s,
      students: s.students.map(st =>
        st.id === studentId ? { ...st, grade } : st
      )
    }));
  }

  // 학생 과목 토글
  function toggleSubject(studentId, subject) {
    setState(s => ({
      ...s,
      students: s.students.map(st => {
        if (st.id !== studentId) return st;
        const subjects = st.subjects || [];
        const updated = subjects.includes(subject)
          ? subjects.filter(s => s !== subject)
          : [...subjects, subject];
        return { ...st, subjects: updated };
      })
    }));
  }

  // 강좌 수강 토글 (기존 방식 유지)
  function toggleEnroll(studentId, courseId) {
    setState(s => ({
      ...s,
      students: s.students.map(st => {
        if (st.id !== studentId) return st;
        const enrolled = st.enrolledCourses.includes(courseId)
          ? st.enrolledCourses.filter(c => c !== courseId)
          : [...st.enrolledCourses, courseId];
        return { ...st, enrolledCourses: enrolled };
      })
    }));
  }

  function updateBanner(id, field, val) {
    setState(s => ({ ...s, banners: s.banners.map(b => b.id===id ? {...b,[field]:val} : b) }));
  }
  function addBanner() {
    const id = Date.now();
    setState(s => ({ ...s, banners: [...s.banners, { id, bg:'#006241', subtitle:'새 배너 부제목', title:'새 배너 제목', label:'개강 예정', badge:'새로운', active:true, cta:'자세히 보기' }] }));
  }
  function deleteBanner(id) {
    setState(s => ({ ...s, banners: s.banners.filter(b => b.id!==id) }));
    if (editingBanner?.id===id) setEditingBanner(null);
  }

  function updateNotice(id, field, val) {
    setState(s => ({ ...s, notices: s.notices.map(n => n.id===id ? {...n,[field]:val} : n) }));
  }
  function addNotice() {
    const id = Date.now();
    setState(s => ({ ...s, notices: [{id, type:'공지', text:'새 공지사항 제목', date:new Date().toISOString().slice(0,10).replace(/-/g,'.')}, ...s.notices] }));
  }
  function deleteNotice(id) {
    setState(s => ({ ...s, notices: s.notices.filter(n => n.id!==id) }));
  }

  function updateAnnouncement(id, field, val) {
    setState(s => ({ ...s, announcements: s.announcements.map(a => a.id===id ? {...a,[field]:val} : a) }));
  }
  function addAnnouncement() {
    const id = Date.now();
    setState(s => ({ ...s, announcements: [{id, title:'새 공지사항', date:new Date().toISOString().slice(0,10).replace(/-/g,'.')}, ...s.announcements] }));
  }
  function deleteAnnouncement(id) {
    setState(s => ({ ...s, announcements: s.announcements.filter(a => a.id!==id) }));
  }

  const panelStyle = { background:'#f2f0eb', minHeight:'80vh' };
  const headerStyle = { background:'#1E3932', padding:'24px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' };

  return React.createElement('div', { style:panelStyle },
    // Header
    React.createElement('div', { style:headerStyle },
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
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 40px', display:'flex', gap:'0' } },
      tabs.map(t =>
        React.createElement('button', { key:t.id, onClick:()=>setTab(t.id), style:{ padding:'16px 20px', background:'none', border:'none', borderBottom: tab===t.id?'2px solid #006241':'2px solid transparent', fontSize:'14px', fontWeight:'700', color: tab===t.id?'#006241':'rgba(0,0,0,0.55)', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease', marginBottom:'-1px' } }, t.label)
      )
    ),

    // Content
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 40px' } },

      /* BANNER TAB */
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
              [
                {f:'title',l:'제목'},{f:'subtitle',l:'부제목'},{f:'badge',l:'뱃지'},{f:'label',l:'라벨'},{f:'cta',l:'버튼 텍스트'},{f:'bg',l:'배경색 (#hex)'},{f:'image',l:'배경 이미지 URL'},{f:'youtube',l:'배경 유튜브 링크'},
              ].map(({f,l})=>
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

      /* NOTICE TAB */
      tab==='notice' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항 관리'),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            React.createElement('button', { onClick:addNotice, style:btnS() }, '+ 공지 추가'),
            React.createElement('button', { onClick:addAnnouncement, style:btnS('#2b5148') }, '+ 발표 추가')
          )
        ),

        // 편집 중인 공지가 있으면 편집 화면 표시
        editingNotice
          ? React.createElement('div', null,
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' } },
                React.createElement('button', { onClick:()=>setEditingNotice(null), style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '← 목록으로'),
                React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지 편집')
              ),
              React.createElement('div', { style:{ ...cardS, display:'flex', flexDirection:'column', gap:'14px' } },
                // 타입 + 제목 + 날짜
                React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
                  editingNotice.type !== undefined && React.createElement('select', { value:editingNotice.type, onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,type:v})); setState(s=>({...s,notices:s.notices.map(x=>x.id===editingNotice.id?{...x,type:v}:x)})); }, style:{ ...inputS, width:'80px', flexShrink:0 } },
                    ['강좌','이벤트','공지','모집'].map(t=>React.createElement('option',{key:t,value:t},t))
                  ),
                  React.createElement('input', { value:editingNotice.text||editingNotice.title||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n, text:v, title:v})); setState(s=>({ ...s, notices: s.notices.map(x=>x.id===editingNotice.id?{...x,text:v}:x), announcements: s.announcements.map(x=>x.id===editingNotice.id?{...x,title:v}:x) })); }, placeholder:'제목', style:{ ...inputS, flex:1 } }),
                  React.createElement('input', { value:editingNotice.date||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,date:v})); setState(s=>({ ...s, notices: s.notices.map(x=>x.id===editingNotice.id?{...x,date:v}:x), announcements: s.announcements.map(x=>x.id===editingNotice.id?{...x,date:v}:x) })); }, style:{ ...inputS, width:'110px', flexShrink:0 } })
                ),
                // 본문
                React.createElement('div', null,
                  React.createElement('label', { style:labelS }, '본문 내용'),
                  React.createElement('textarea', { value:editingNotice.content||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,content:v})); setState(s=>({ ...s, notices: s.notices.map(x=>x.id===editingNotice.id?{...x,content:v}:x), announcements: s.announcements.map(x=>x.id===editingNotice.id?{...x,content:v}:x) })); }, placeholder:'공지 내용을 입력하세요', rows:6, style:{ ...inputS, resize:'vertical', lineHeight:'1.6' } })
                ),
                // 유튜브
                React.createElement('div', null,
                  React.createElement('label', { style:labelS }, '유튜브 링크 (선택)'),
                  React.createElement('input', { value:editingNotice.youtube||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,youtube:v})); setState(s=>({ ...s, notices: s.notices.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x), announcements: s.announcements.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x) })); }, placeholder:'https://youtube.com/watch?v=...', style:inputS })
                ),
                // 외부 링크
                React.createElement('div', null,
                  React.createElement('label', { style:labelS }, '외부 링크 (선택)'),
                  React.createElement('input', { value:editingNotice.link||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,link:v})); setState(s=>({ ...s, notices: s.notices.map(x=>x.id===editingNotice.id?{...x,link:v}:x), announcements: s.announcements.map(x=>x.id===editingNotice.id?{...x,link:v}:x) })); }, placeholder:'https://blog.naver.com/...', style:inputS })
                ),
                React.createElement('button', { onClick:()=>setEditingNotice(null), style:{ ...btnS(), alignSelf:'flex-start' } }, '✓ 저장 완료')
              )
            )
          : React.createElement('div', null,
              // 공지 목록
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

      /* COURSE TAB */
      tab==='course' && React.createElement('div', null,
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '강좌 목록'),
          React.createElement('button', { onClick:()=>{ const id=Date.now(); setState(s=>({...s,courses:[...s.courses,{id,subject:'수학',name:'새 강좌',teacher:'강사명',grade:'고1',days:2,duration:80,price:'0원',badge:null,color:'#006241'}]})); }, style:btnS() }, '+ 강좌 추가')
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
                React.createElement('button', { onClick:()=>setEditingCourse(editingCourse===c.id?null:c.id), style:btnS('#2b5148') }, editingCourse===c.id?'닫기':'편집'),
                React.createElement('button', { onClick:()=>setState(s=>({...s,courses:s.courses.filter(x=>x.id!==c.id)})), style:btnOutS }, '삭제')
              )
            ),
            editingCourse===c.id && React.createElement('div', { style:{ paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' } },
                [
                  {f:'name',l:'강좌명'},{f:'teacher',l:'강사'},{f:'price',l:'수강료'},{f:'badge',l:'뱃지'},
                ].map(({f,l})=>
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
              // 상세 페이지 내용
              React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'강좌 소개'),
                  React.createElement('textarea',{value:c.intro||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,intro:e.target.value}:x)})),placeholder:'이 강좌에 대한 상세 소개를 입력하세요',rows:4,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'수강 대상'),
                  React.createElement('textarea',{value:c.target||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,target:e.target.value}:x)})),placeholder:'어떤 학생에게 맞는 강좌인지 입력하세요',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'커리큘럼 (줄바꿈으로 구분)'),
                  React.createElement('textarea',{value:c.curriculum||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,curriculum:e.target.value}:x)})),placeholder:'1. 수열의 개념\n2. 극한의 이해\n3. 미분 기초',rows:5,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'강사 소개'),
                  React.createElement('textarea',{value:c.teacherDesc||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,teacherDesc:e.target.value}:x)})),placeholder:'강사 경력, 특징 등',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
                ),
                React.createElement('div', null,
                  React.createElement('label',{style:labelS},'미리보기 유튜브 링크 (선택)'),
                  React.createElement('input',{value:c.youtube||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,youtube:e.target.value}:x)})),placeholder:'https://youtube.com/watch?v=...',style:inputS})
                ),

                // 강의 목록 관리
                React.createElement('div', { style:{ borderTop:'2px solid #d4e9e2', paddingTop:'14px', marginTop:'4px' } },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
                    React.createElement('label', { style:{ fontSize:'13px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '온라인 강의 목록'),
                    React.createElement('button', {
                      onClick: function() {
                        var newLec = { id: Date.now(), title: (((c.lectures||[]).length)+1) + '강: 새 강의', videoUrl: '' };
                        setState(function(s) { return {...s, courses: s.courses.map(function(x) { return x.id===c.id ? {...x, lectures:[...(x.lectures||[]),newLec]} : x; })}; });
                      },
                      style: btnS()
                    }, '+ 강의 추가')
                  ),
                  (c.lectures||[]).length === 0
                    ? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '아직 강의가 없습니다. 강의를 추가해주세요.')
                    : (c.lectures||[]).map(function(lec, idx) {
                        return React.createElement('div', { key: lec.id, style:{ background:'#f9f9f9', borderRadius:'8px', padding:'10px 12px', marginBottom:'8px', display:'flex', flexDirection:'column', gap:'6px' } },
                          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
                            React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (idx+1) + '강'),
                            React.createElement('input', {
                              value: lec.title||'',
                              onChange: function(e) {
                                var val = e.target.value;
                                setState(function(s) { return {...s, courses: s.courses.map(function(x) { return x.id===c.id ? {...x, lectures: x.lectures.map(function(l) { return l.id===lec.id ? {...l, title:val} : l; })} : x; })}; });
                              },
                              placeholder: '강의 제목',
                              style: {...inputS, marginBottom:0, flex:1}
                            }),
                            React.createElement('button', {
                              onClick: function() {
                                setState(function(s) { return {...s, courses: s.courses.map(function(x) { return x.id===c.id ? {...x, lectures: x.lectures.filter(function(l) { return l.id!==lec.id; })} : x; })}; });
                              },
                              style: {...btnOutS, padding:'4px 10px', fontSize:'12px'}
                            }, '삭제')
                          ),
                          React.createElement('input', {
                            value: lec.videoUrl||'',
                            onChange: function(e) {
                              var val = e.target.value;
                              setState(function(s) { return {...s, courses: s.courses.map(function(x) { return x.id===c.id ? {...x, lectures: x.lectures.map(function(l) { return l.id===lec.id ? {...l, videoUrl:val} : l; })} : x; })}; });
                            },
                            placeholder: '시놀로지 영상 URL (예: https://nas.xxx.com/video/1강.mp4)',
                            style: {...inputS, marginBottom:0, fontSize:'12px'}
                          })
                        );
                      })
                )
              )
            )
          )
        )
      ),

      /* STUDENT TAB */
      tab==='student' && React.createElement('div', null,
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, `회원 목록 (${state.students.length}명)`),
        state.students.map(st =>
          React.createElement('div', { key:st.id, style:cardS },
            // 학생 기본 정보 헤더
            React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }, onClick:()=>setExpandedStudent(expandedStudent===st.id?null:st.id) },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
                React.createElement('div', { style:{ width:'40px', height:'40px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
                React.createElement('div', null,
                  React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
                  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } },
                    `${st.provider==='google'?'Google':'카카오'} · ${st.email}`
                  )
                ),
                // 학년 + 과목 뱃지 미리보기
                React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' } },
                  st.grade && React.createElement('span', { style:{ background:'#1E3932', color:'#fff', borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
                  (st.subjects||[]).map(sub=>
                    React.createElement('span', { key:sub, style:{ background:'#d4e9e2', color:'#006241', borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub)
                  )
                )
              ),
              React.createElement('span', { style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', transition:'transform 0.2s', transform: expandedStudent===st.id?'rotate(180deg)':'none' } }, '▾')
            ),

            // 펼쳐지는 배정 영역
            expandedStudent===st.id && React.createElement('div', { style:{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(0,0,0,0.08)' } },

              // 학년 설정
              React.createElement('div', { style:{ marginBottom:'16px' } },
                React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '학년 설정'),
                React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                  GRADES.map(g =>
                    React.createElement('button', { key:g, onClick:()=>updateStudentGrade(st.id, st.grade===g?null:g), style:{ background: st.grade===g?'#1E3932':'#f2f0eb', color: st.grade===g?'#fff':'rgba(0,0,0,0.7)', border: st.grade===g?'2px solid #1E3932':'2px solid transparent', borderRadius:'8px', padding:'7px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, g)
                  )
                )
              ),

              // 수강 과목 배정
              React.createElement('div', { style:{ marginBottom:'16px' } },
                React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 과목 배정'),
                React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                  SUBJECTS.map(sub =>
                    React.createElement('button', { key:sub, onClick:()=>toggleSubject(st.id, sub), style:{ background: (st.subjects||[]).includes(sub)?'#006241':'#f2f0eb', color: (st.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.7)', border: (st.subjects||[]).includes(sub)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub)
                  )
                )
              ),

              // 수강 강좌 배정 (과목에 맞는 강좌만 표시)
              React.createElement('div', null,
                React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 강좌 배정'),
                (st.subjects||[]).length === 0
                  ? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '과목을 먼저 배정해 주세요')
                  : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
                      SUBJECTS.filter(sub=>(st.subjects||[]).includes(sub)).map(sub=>
                        React.createElement('div', { key:sub },
                          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } }, sub),
                          React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
                            state.courses.filter(c=>c.subject===sub).length === 0
                              ? React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '등록된 강좌 없음')
                              : state.courses.filter(c=>c.subject===sub).map(c=>
                                  React.createElement('button', { key:c.id, onClick:()=>toggleEnroll(st.id,c.id), style:{ background: st.enrolledCourses.includes(c.id)?'#006241':'#f2f0eb', color: st.enrolledCourses.includes(c.id)?'#fff':'rgba(0,0,0,0.55)', border: st.enrolledCourses.includes(c.id)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } },
                                    `${c.name} (${c.grade})`
                                  )
                                )
                          )
                        )
                      )
                    )
              )
            )
          )
        )
      ),

      /* FEATURE TAB */
      tab==='feature' && React.createElement('div', null,
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '홍보 섹션 편집'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' } },
          [
            {f:'featureEyebrow',l:'눈길끄는 문구 (작은 글자)'},
            {f:'featureTitle',l:'메인 제목 (큰 글자)'},
            {f:'featureBody',l:'본문 설명'},
            {f:'featureCta1',l:'버튼 1 텍스트'},
            {f:'featureCta2',l:'버튼 2 텍스트'},
            {f:'heroTitle',l:'메인 배너 큰 제목'},
          ].map(({f,l})=>
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
