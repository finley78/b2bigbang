// StudentPortal.jsx — Login modal + Course grid + Video player

const SUBJECT_COLORS = {
  '국어': '#2b5148',
  '영어': '#00754A',
  '수학': '#006241',
  '과학': '#1E3932',
};

function getLectureYoutubeId(lecture) {
  var raw = String((lecture && (lecture.youtubeId || lecture.youtube_id || lecture.videoUrl || lecture.video_url)) || '').trim();
  if (!raw) return '';
  var match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
  if (match && match[1]) return match[1];
  if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return raw;
  return '';
}

function getLectureDirectUrl(lecture) {
  var raw = String((lecture && (lecture.videoUrl || lecture.video_url || lecture.youtubeId || lecture.youtube_id)) || '').trim();
  if (!raw) return '';
  if (/youtube\.com|youtu\.be/i.test(raw)) return '';
  if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return '';
  return raw;
}

function getYoutubeEmbedUrl(lecture) {
  var id = getLectureYoutubeId(lecture);
  return id ? 'https://www.youtube.com/embed/' + id : '';
}


/* ── Login Modal ──────────────────────────────── */
function LoginModal({ onLogin, onClose, onAdminLogin, onSignup }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const sb = window.supabase;

  const inputFieldStyle = { position:'relative', background:'#f9f9f9', borderRadius:'4px', border:'1px solid #d6dbde', padding:'14px 12px 10px', marginBottom:'10px' };
  const floatLabelStyle = { position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' };
  const inputStyle = { width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' };

  // 관리자 로그인
  function handleAdminLogin() {
    if (!email || !password) { setMsg('아이디와 비밀번호를 입력해 주세요.'); return; }
    if (email === 'admin' && password === 'b2admin') { onAdminLogin(); onClose(); }
    else { setMsg('관리자 정보가 맞지 않습니다.'); }
  }

  // 일반 로그인 (학생/학부모/선생님)
  async function handleEmailLogin() {
    if (!email || !password) { setMsg('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: user, error } = await sb.from('students')
        .select('*').eq('email', email.trim()).single();
      if (error || !user) { setMsg('등록된 계정이 없습니다.'); setLoading(false); return; }
      if (user.role === 'pending_teacher') { setMsg('관리자 승인 대기 중입니다.'); setLoading(false); return; }
      if (user.role === 'pending_student' || user.role === 'pending_parent') { setMsg('가입 처리 중입니다. 잠시 후 다시 시도해 주세요.'); setLoading(false); return; }
      if (user.password_hash !== password) { setMsg('비밀번호가 틀렸습니다.'); setLoading(false); return; }
      const { data: enrollments } = await sb.from('enrollments').select('course_id').eq('student_id', user.id);
      onLogin({ id: user.id, name: user.name, email: user.email, role: user.role, subjects: user.subjects || [], enrolledCourses: (enrollments||[]).map(e=>e.course_id) });
      onClose();
    } catch(e) { setMsg('오류가 발생했습니다.'); }
    setLoading(false);
  }

  // 소셜 로그인 — 데모용: 실제 DB 학생 계정을 이메일로 찾아 연결
  function handleProvider(provider) {
    const mockUser = provider === 'google'
      ? { name: '김학생', email: 'student@gmail.com' }
      : { name: '이수강', email: 'student@kakao.com' };
    async function loginWithDB() {
      try {
        // 1. 이미 존재하는 학생 계정 검색 (이메일 또는 소셜 provider 기준)
        let student = null;
        const { data: existing } = await sb.from('students')
          .select('*').eq('email', mockUser.email).single();
        if (existing) {
          student = existing;
        } else {
          // 2. 없으면 새로 생성
          const { data: created, error: createErr } = await sb.from('students')
            .insert({ email: mockUser.email, name: mockUser.name, login_provider: provider, role: 'student', is_active: true })
            .select().single();
          if (createErr) throw createErr;
          student = created;
        }
        // 3. 수강 배정 조회
        const { data: enrollments } = await sb.from('enrollments').select('course_id').eq('student_id', student.id);
        onLogin({
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role || 'student',
          grade: student.grade || '',
          subjects: student.subjects || [],
          enrolledCourses: (enrollments||[]).map(e=>e.course_id),
        });
        onClose();
      } catch(e) {
        console.error('소셜 로그인 오류:', e);
        // fallback: 임시 로그인 (강좌 없음 상태)
        onLogin({ id: provider+'_demo', name: mockUser.name, email: mockUser.email, role: 'student', grade:'', subjects:[], enrolledCourses: [] });
        onClose();
      }
    }
    loginWithDB();
  }

  function handleLogin() {
    if (isAdmin) handleAdminLogin();
    else handleEmailLogin();
  }

  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' }, onClick:e=>e.stopPropagation() },

      React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),

      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, 'B2'),
        React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '빅뱅학원')
      ),
      React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'24px' } }, '학생·학부모·선생님 모두 같은 로그인 화면을 사용합니다.'),

      // 이메일/아이디 입력
      React.createElement('div', { style:inputFieldStyle },
        React.createElement('div', { style:floatLabelStyle }, isAdmin ? '관리자 아이디' : '이메일'),
        React.createElement('input', { type: isAdmin ? 'text' : 'email', placeholder: isAdmin ? '관리자 아이디 입력' : 'example@email.com', value:email, onChange:e=>{ setEmail(e.target.value); setMsg(''); }, style:inputStyle })
      ),

      // 비밀번호 입력
      React.createElement('div', { style:{ ...inputFieldStyle, marginBottom:'12px' } },
        React.createElement('div', { style:floatLabelStyle }, '비밀번호'),
        React.createElement('input', { type:'password', placeholder:'비밀번호 입력', value:password, onChange:e=>{ setPassword(e.target.value); setMsg(''); }, onKeyDown:e=>e.key==='Enter'&&handleLogin(), style:inputStyle })
      ),

      // 관리자 체크박스
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', cursor:'pointer' }, onClick:()=>{ setIsAdmin(v=>!v); setMsg(''); setEmail(''); setPassword(''); } },
        React.createElement('div', { style:{ width:'18px', height:'18px', borderRadius:'4px', border: isAdmin ? 'none' : '1.5px solid rgba(0,0,0,0.3)', background: isAdmin ? '#1E3932' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' } },
          isAdmin && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
            React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
          )
        ),
        React.createElement('span', { style:{ fontSize:'13px', fontWeight:'600', color: isAdmin ? '#1E3932' : 'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', userSelect:'none' } }, '관리자로 로그인')
      ),

      msg && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', lineHeight:'1.6', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),

      // 로그인 버튼
      React.createElement('button', { onClick:handleLogin, disabled:loading, style:{ width:'100%', background: loading?'#aaa': isAdmin ? '#1E3932' : '#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'16px', transition:'background 0.2s' } },
        loading ? '로그인 중...' : (isAdmin ? '관리자 로그인' : '로그인')
      ),

      // 소셜 로그인 (관리자가 아닐 때만)
      !isAdmin && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' } },
          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.1)' } }),
          React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif' } }, '소셜 로그인'),
          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.1)' } })
        ),
        React.createElement('button', { onClick:()=>handleProvider('google'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'13px', borderRadius:'8px', border:'1px solid rgba(0,0,0,0.2)', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' },
          onMouseEnter:e=>e.currentTarget.style.background='#f9f9f9', onMouseLeave:e=>e.currentTarget.style.background='#fff' },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z', fill:'#4285F4' }),
            React.createElement('path', { d:'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill:'#34A853' }),
            React.createElement('path', { d:'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill:'#FBBC05' }),
            React.createElement('path', { d:'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill:'#EA4335' })
          ),
          'Google로 로그인'
        ),
        React.createElement('button', { onClick:()=>handleProvider('kakao'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'13px', borderRadius:'8px', border:'none', background:'#FEE500', cursor:'pointer', fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.85)', fontFamily:'Manrope, sans-serif' },
          onMouseEnter:e=>e.currentTarget.style.background='#f0d800', onMouseLeave:e=>e.currentTarget.style.background='#FEE500' },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.93l-.97 3.57c-.09.33.28.59.57.4l4.38-2.89c.43.05.87.08 1.33.08 5.52 0 10-3.69 10-8.25C22 6.69 17.52 3 12 3z', fill:'#3C1E1E' })
          ),
          '카카오톡으로 로그인'
        ),
        React.createElement('div', { style:{ textAlign:'center', marginTop:'8px' } },
          React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '아직 회원이 아니신가요? '),
          React.createElement('span', { onClick:()=>{ onClose(); onSignup&&onSignup(); }, style:{ fontSize:'13px', color:'#006241', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', textDecoration:'underline' } }, '회원가입')
        ),
        React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'8px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, '로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.')
      )
    )
  );
}

/* ── Signup Page (회원가입 전체 페이지) ─────────── */
function SignupPage({ onBack, onComplete }) {
  const [step, setStep] = React.useState(1); // 1: 역할선택, 2: 양식작성, 3: 완료
  const [roleType, setRoleType] = React.useState(''); // 'student' | 'parent' | 'teacher'
  const [form, setForm] = React.useState({ name:'', school:'', grade:'', phone:'', address:'', agree:false });
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const sb = window.supabase;

  const ROLE_OPTIONS = [
    { key:'student', label:'학생', icon:'🎓', desc:'수강 중인 학생' },
    { key:'parent',  label:'학부모', icon:'👨‍👩‍👧', desc:'학부모님' },
    { key:'teacher', label:'선생님', icon:'👨‍🏫', desc:'강사 (관리자 승인 필요)' },
  ];

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box', background:'#fafafa' };
  const labelS = { display:'block', fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'6px', letterSpacing:'0.04em' };
  const fieldS = { marginBottom:'16px' };

  function setF(k, v) { setForm(f=>({...f, [k]:v})); }

  async function handleSubmit() {
    if (!form.name.trim()) { setMsg('이름을 입력해 주세요.'); return; }
    if (roleType === 'student') {
      if (!form.school.trim()) { setMsg('학교를 입력해 주세요.'); return; }
      if (!form.grade.trim()) { setMsg('학년을 입력해 주세요.'); return; }
    }
    if (!form.phone.trim()) { setMsg('전화번호를 입력해 주세요.'); return; }
    if (!form.address.trim()) { setMsg('주소를 입력해 주세요.'); return; }
    if (!form.agree) { setMsg('개인정보 활용에 동의해 주세요.'); return; }

    setLoading(true); setMsg('');
    const dbRole = roleType === 'teacher' ? 'pending_teacher' : roleType;
    const insertData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      role: dbRole,
      is_active: roleType !== 'teacher',
      agree_privacy: true,
      created_at: new Date().toISOString(),
    };
    if (roleType === 'student') {
      insertData.school = form.school.trim();
      insertData.grade = form.grade.trim();
    }

    try {
      if (sb) {
        const { error } = await sb.from('students').insert(insertData);
        if (error) throw error;
      }
      setStep(3);
    } catch(e) {
      setMsg('가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
    setLoading(false);
  }

  // 공통 헤더
  const header = React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:10 } },
    React.createElement('button', { onClick: step === 2 ? ()=>setStep(1) : onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif', padding:'4px 0' } }, '← ' + (step === 2 ? '역할 선택으로' : '로그인으로')),
    React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
    React.createElement('span', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '회원가입')
  );

  // 완료 화면
  if (step === 3) return React.createElement('div', { style:{ minHeight:'100vh', background:'#f2f0eb' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'60px 20px', textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'64px', marginBottom:'20px' } }, roleType === 'teacher' ? '⏳' : '🎉'),
      React.createElement('h2', { style:{ fontSize:'24px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, roleType === 'teacher' ? '가입 신청 완료' : '가입 완료!'),
      React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.8' } },
        roleType === 'teacher'
          ? '선생님 가입은 관리자 승인 후 이용 가능합니다.\n승인 완료 시 연락드리겠습니다.'
          : `${form.name}님, 환영합니다!\n이제 로그인하여 수강하실 수 있습니다.`
      ),
      React.createElement('button', { onClick: onBack, style:{ marginTop:'32px', background:'#006241', color:'#fff', border:'none', borderRadius:'10px', padding:'14px 36px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그인하러 가기')
    )
  );

  // 역할 선택 (step 1)
  if (step === 1) return React.createElement('div', { style:{ minHeight:'100vh', background:'#f2f0eb' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'32px 20px' } },
      React.createElement('h2', { style:{ fontSize:'20px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '어떤 분이세요?'),
      React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'28px' } }, '가입 유형을 선택해 주세요.'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
        ROLE_OPTIONS.map(r =>
          React.createElement('div', { key:r.key, onClick:()=>setRoleType(r.key),
            style:{ background:'#fff', borderRadius:'14px', padding:'20px', display:'flex', alignItems:'center', gap:'16px', cursor:'pointer', border: roleType===r.key ? '2px solid #006241' : '2px solid transparent', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', transition:'all 0.15s' } },
            React.createElement('div', { style:{ fontSize:'32px', flexShrink:0 } }, r.icon),
            React.createElement('div', { style:{ flex:1 } },
              React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, r.label),
              React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, r.desc)
            ),
            React.createElement('div', { style:{ width:'20px', height:'20px', borderRadius:'50%', border: roleType===r.key ? '6px solid #006241' : '2px solid rgba(0,0,0,0.25)', transition:'all 0.15s', flexShrink:0 } })
          )
        )
      ),
      React.createElement('button', { onClick:()=>{ if(!roleType){setMsg('유형을 선택해 주세요.');return;} setMsg(''); setStep(2); }, style:{ width:'100%', marginTop:'24px', background: roleType ? '#006241' : '#ccc', color:'#fff', border:'none', borderRadius:'10px', padding:'15px', fontSize:'15px', fontWeight:'700', cursor: roleType?'pointer':'not-allowed', fontFamily:'Manrope, sans-serif', transition:'background 0.2s' } }, '다음'),
      msg && React.createElement('div', { style:{ fontSize:'13px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginTop:'12px', textAlign:'center' } }, msg)
    )
  );

  // 양식 작성 (step 2)
  return React.createElement('div', { style:{ minHeight:'100vh', background:'#f2f0eb' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'32px 20px' } },
      React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'20px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid rgba(0,0,0,0.07)' } },
          React.createElement('div', { style:{ fontSize:'24px' } }, ROLE_OPTIONS.find(r=>r.key===roleType)?.icon),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, ROLE_OPTIONS.find(r=>r.key===roleType)?.label + ' 회원가입'),
            roleType === 'teacher' && React.createElement('div', { style:{ fontSize:'12px', color:'#c87000', fontFamily:'Manrope, sans-serif', marginTop:'2px', fontWeight:'600' } }, '⚠ 관리자 승인 후 이용 가능합니다')
          )
        ),

        // 이름 (공통)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '이름 *'),
          React.createElement('input', { value:form.name, onChange:e=>setF('name',e.target.value), placeholder:'홍길동', style:inputS })
        ),

        // 학교 + 학년 (학생만)
        roleType === 'student' && React.createElement(React.Fragment, null,
          React.createElement('div', { style:fieldS },
            React.createElement('label', { style:labelS }, '학교 *'),
            React.createElement('input', { value:form.school, onChange:e=>setF('school',e.target.value), placeholder:'예: 서울중학교', style:inputS })
          ),
          React.createElement('div', { style:fieldS },
            React.createElement('label', { style:labelS }, '학년 *'),
            React.createElement('select', { value:form.grade, onChange:e=>setF('grade',e.target.value), style:{ ...inputS, cursor:'pointer' } },
              React.createElement('option', { value:'' }, '학년 선택'),
              ['중1','중2','중3','고1','고2','고3'].map(g => React.createElement('option', { key:g, value:g }, g))
            )
          )
        ),

        // 전화번호 (공통)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '전화번호 *'),
          React.createElement('input', { value:form.phone, onChange:e=>setF('phone',e.target.value), placeholder:'010-0000-0000', style:inputS, type:'tel' })
        ),

        // 주소 (공통)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '주소 *'),
          React.createElement('input', { value:form.address, onChange:e=>setF('address',e.target.value), placeholder:'예: 서울시 강남구 역삼동', style:inputS })
        ),

        // 개인정보 동의 (공통)
        React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'8px', padding:'14px', marginBottom:'16px' } },
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', marginBottom:'10px' } },
            '수집된 개인정보(이름, 연락처, 주소 등)는 학원 운영 및 수강 관리 목적으로만 사용되며, 동의 없이 제3자에게 제공하지 않습니다.'
          ),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }, onClick:()=>setF('agree',!form.agree) },
            React.createElement('div', { style:{ width:'18px', height:'18px', borderRadius:'4px', border: form.agree ? 'none' : '1.5px solid rgba(0,0,0,0.3)', background: form.agree ? '#006241' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' } },
              form.agree && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
                React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
              )
            ),
            React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color: form.agree ? '#006241' : 'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', userSelect:'none' } }, '개인정보 수집 및 활용에 동의합니다 *')
          )
        ),

        msg && React.createElement('div', { style:{ fontSize:'13px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),

        React.createElement('button', { onClick:handleSubmit, disabled:loading, style:{ width:'100%', background: loading?'#aaa':'#006241', color:'#fff', border:'none', borderRadius:'10px', padding:'15px', fontSize:'15px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', transition:'background 0.2s' } },
          loading ? '처리 중...' : (roleType === 'teacher' ? '가입 신청하기' : '가입 완료')
        )
      )
    )
  );
}


/* ── Video Player ─────────────────────────────── */
function VideoPlayer({ lecture, course, onBack, studentName }) {
  var videoRef = React.useRef(null);
  var seekBarRef = React.useRef(null);
  var hideRef = React.useRef(null);
  var tapRef = React.useRef({ count: 0, timer: null });
  var touchStartRef = React.useRef({ x: 0, y: 0, time: 0 });

  var [duration, setDuration] = React.useState(0);
  var [currentSec, setCurrentSec] = React.useState(0);
  var [playing, setPlaying] = React.useState(false);
  var [speed, setSpeed] = React.useState(1);
  var [showControls, setShowControls] = React.useState(true);
  var [seekDragging, setSeekDragging] = React.useState(false);
  var [skipAnim, setSkipAnim] = React.useState(null);

  var storageKey = 'lec_progress_' + lecture.id;
  var youtubeEmbedUrl = getYoutubeEmbedUrl(lecture);
  var directVideoUrl = getLectureDirectUrl(lecture);
  var hasPlayableVideo = !!(youtubeEmbedUrl || directVideoUrl);
  var progress = duration > 0 ? Math.min((currentSec / duration) * 100, 100) : 0;
  var speeds = [1, 1.2, 1.5, 1.8, 2];
  var color = SUBJECT_COLORS[course.subject] || '#006241';

  React.useEffect(function() {
    if (youtubeEmbedUrl) return;
    var v = videoRef.current;
    if (!v) return;
    var saved = parseFloat(localStorage.getItem(storageKey) || '0');
    function onLoaded() {
      if (saved > 0 && v.duration) v.currentTime = (saved / 100) * v.duration;
      setDuration(v.duration || 0);
    }
    function onTimeUpdate() {
      setCurrentSec(v.currentTime);
      if (v.duration) localStorage.setItem(storageKey, (v.currentTime / v.duration * 100).toFixed(2));
    }
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); }
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return function() {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [lecture.id, youtubeEmbedUrl]);

  React.useEffect(function() {
    if (youtubeEmbedUrl) return;
    var v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, youtubeEmbedUrl]);

  function armHide() {
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(function() { setShowControls(false); }, 2500);
  }
  function showThenHide() { setShowControls(true); armHide(); }
  React.useEffect(function() {
    if (playing) armHide();
    else { clearTimeout(hideRef.current); setShowControls(true); }
  }, [playing]);
  React.useEffect(function() { return function() { clearTimeout(hideRef.current); }; }, []);

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function togglePlay() {
    var v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }

  function getSeekPct(e) {
    var bar = seekBarRef.current;
    if (!bar) return null;
    var rect = bar.getBoundingClientRect();
    var cx = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
  }
  function onSeekStart(e) {
    e.stopPropagation();
    setSeekDragging(true);
    var p = getSeekPct(e);
    if (p !== null && videoRef.current && videoRef.current.duration)
      videoRef.current.currentTime = p * videoRef.current.duration;
  }
  function onSeekMove(e) {
    if (!seekDragging) return;
    var p = getSeekPct(e);
    if (p !== null && videoRef.current && videoRef.current.duration)
      videoRef.current.currentTime = p * videoRef.current.duration;
  }
  function onSeekEnd(e) { e.stopPropagation(); setSeekDragging(false); }

  function onPlayerTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }
  function onPlayerTouchEnd(e) {
    var dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
    var dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    var dt = Date.now() - touchStartRef.current.time;
    if (dx > 10 || dy > 10 || dt > 500) return;
    var rect = e.currentTarget.getBoundingClientRect();
    var isLeft = e.changedTouches[0].clientX < rect.left + rect.width / 2;
    tapRef.current.count += 1;
    clearTimeout(tapRef.current.timer);
    if (tapRef.current.count >= 2) {
      tapRef.current.count = 0;
      var v = videoRef.current;
      if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + (isLeft ? -10 : 10)));
      setSkipAnim(isLeft ? 'left' : 'right');
      setTimeout(function() { setSkipAnim(null); }, 500);
      if (playing) showThenHide();
    } else {
      tapRef.current.timer = setTimeout(function() {
        tapRef.current.count = 0;
        if (playing) {
          setShowControls(function(s) {
            if (s) { clearTimeout(hideRef.current); return false; }
            armHide(); return true;
          });
        }
      }, 200);
    }
  }

  var today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\. /g,'.').replace(/\.$/,'');

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '\u2190 강의 목록으로'),
      React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
      React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, lecture.title)
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'20px 16px' } },
      React.createElement('div', {
        style:{ position:'relative', width:'100%', aspectRatio:'16/9', borderRadius:'12px', overflow:'hidden', background:'#1E3932', marginBottom:'12px', cursor:'pointer' },
        onTouchStart: onPlayerTouchStart,
        onTouchEnd: onPlayerTouchEnd,
        onMouseMove: showThenHide,
        onClick: function(e) {
          // PC: 컨트롤 영역 클릭이 아닌 경우 컨트롤 토글
          if (e.target === e.currentTarget || e.target.tagName === 'VIDEO') {
            if (playing) {
              setShowControls(function(s) {
                if (s) { clearTimeout(hideRef.current); return false; }
                armHide(); return true;
              });
            } else {
              setShowControls(true);
            }
          }
        },
      },
        youtubeEmbedUrl
          ? React.createElement('iframe', {
              src: youtubeEmbedUrl,
              title: lecture.title || 'YouTube lecture',
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
              allowFullScreen: true,
              style:{ width:'100%', height:'100%', border:'none', display:'block', background:'#000' },
            })
          : React.createElement('video', {
              ref: videoRef,
              src: directVideoUrl || '',
              style:{ width:'100%', height:'100%', objectFit:'contain', display:'block' },
              playsInline: true,
              preload: 'metadata',
              controlsList: 'nodownload nofullscreen',
              disablePictureInPicture: true,
              onContextMenu: function(e) { e.preventDefault(); },
              onError: function(e) { console.log('video error', e); },
            }),
        !hasPlayableVideo && React.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' } },
          React.createElement('div', { style:{ fontSize:'50px', fontWeight:'800', color:'rgba(255,255,255,0.07)', fontFamily:'Manrope, sans-serif' } }, course.subject),
          React.createElement('div', { style:{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontFamily:'Manrope, sans-serif', marginTop:'8px' } }, '영상 준비 중입니다')
        ),
        React.createElement('div', { style:{ position:'absolute', bottom:'52px', right:'12px', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.2)', fontFamily:'Manrope, sans-serif', pointerEvents:'none', userSelect:'none', zIndex:4 } },
          studentName + ' \u00b7 ' + today
        ),
        !youtubeEmbedUrl && skipAnim ? React.createElement('div', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', left: skipAnim==='left'?'8%':'auto', right: skipAnim==='right'?'8%':'auto', background:'rgba(0,0,0,0.55)', borderRadius:'8px', padding:'8px 14px', pointerEvents:'none', zIndex:6 } },
          React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, skipAnim==='left'?'-10\ucd08':'+10\ucd08')
        ) : null,
        !youtubeEmbedUrl && React.createElement('div', { style:{ position:'absolute', inset:0, zIndex:3, opacity: showControls?1:0, transition: showControls?'opacity 0.15s ease':'opacity 0.6s ease', background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.65) 100%)', display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents: showControls?'auto':'none' } },
          React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', padding:'10px 12px', gap:'5px' } },
            speeds.map(function(s) {
              return React.createElement('button', { key:s, onTouchEnd:function(e){e.stopPropagation();setSpeed(s);if(playing)showThenHide();}, onClick:function(e){e.stopPropagation();setSpeed(s);if(playing)showThenHide();}, style:{ background:speed===s?'#fff':'rgba(0,0,0,0.5)', border:'none', borderRadius:'4px', padding:'5px 9px', fontSize:'12px', fontWeight:'700', color:speed===s?'#1E3932':'#fff', cursor:'pointer', fontFamily:'Manrope, sans-serif', WebkitTapHighlightColor:'transparent' } }, s===1?'1x':s+'x');
            })
          ),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 } },
            React.createElement('button', {
              onTouchEnd: function(e) { e.stopPropagation(); togglePlay(); },
              onClick: function(e) { e.stopPropagation(); togglePlay(); showThenHide(); },
              style:{ width:'68px', height:'68px', borderRadius:'50%', background:playing?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.92)', border:'2px solid rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }
            },
              React.createElement('span', { style:{ fontSize:'28px', marginLeft:playing?0:'4px', color:playing?'#fff':'#1E3932', lineHeight:1 } }, playing?'\u275a\u275a':'\u25b6')
            )
          ),
          React.createElement('div', { style:{ padding:'0 14px 12px' } },
            React.createElement('div', { ref:seekBarRef, style:{ position:'relative', height:'28px', display:'flex', alignItems:'center', marginBottom:'4px' }, onTouchStart:onSeekStart, onTouchMove:onSeekMove, onTouchEnd:onSeekEnd, onMouseDown:onSeekStart, onMouseMove:onSeekMove, onMouseUp:onSeekEnd },
              React.createElement('div', { style:{ position:'absolute', left:0, right:0, height:'3px', background:'rgba(255,255,255,0.25)', borderRadius:'2px' } }),
              React.createElement('div', { style:{ position:'absolute', left:0, height:'3px', background:'#ff0000', borderRadius:'2px', width:progress+'%' } }),
              React.createElement('div', { style:{ position:'absolute', left:progress+'%', transform:'translateX(-50%)', width:'14px', height:'14px', borderRadius:'50%', background:'#ff0000' } })
            ),
            React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
              React.createElement('span', { style:{ fontSize:'12px', fontWeight:'600', color:'#fff', fontFamily:'Manrope, sans-serif' } }, fmt(currentSec)+' / '+fmt(duration)),
              React.createElement('button', { onTouchEnd:function(e){e.stopPropagation();var v=videoRef.current;if(v){var go=v.requestFullscreen||v.webkitRequestFullscreen;if(go)go.call(v);}}, onClick:function(e){e.stopPropagation();var v=videoRef.current;if(v){var go=v.requestFullscreen||v.webkitRequestFullscreen;if(go)go.call(v);}}, style:{ background:'none', border:'none', cursor:'pointer', padding:'4px', WebkitTapHighlightColor:'transparent' } },
                React.createElement('svg', { width:'22', height:'22', viewBox:'0 0 24 24', fill:'#fff' },
                  React.createElement('path', { d:'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z' })
                )
              )
            )
          )
        )
      ),
      React.createElement('div', { style:{ background:'#fff', borderRadius:'8px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14)' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '\ud559\uc2b5 \uc9c4\ub3c4'),
        React.createElement('div', { style:{ flex:1, height:'6px', background:'#f2f0eb', borderRadius:'3px', overflow:'hidden' } },
          React.createElement('div', { style:{ height:'100%', background:color, borderRadius:'3px', width:progress+'%', transition:'width 0.3s ease' } })
        ),
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:color, fontFamily:'Manrope, sans-serif', flexShrink:0 } }, Math.round(progress)+'%')
      )
    )
  );
}



/* ── Subject Select ───────────────────────────── */
function SubjectSelect({ studentSubjects, coursesBySubject, onSelect }) {
  return React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 16px' } },
    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '수강 과목 선택'),
    React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
      studentSubjects.map(function(sub) {
        var count = (coursesBySubject[sub] && coursesBySubject[sub].length) || 0;
        var color = SUBJECT_COLORS[sub] || '#006241';
        return React.createElement('div', {
          key: sub,
          onClick: function() { onSelect(sub); },
          style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
          onMouseEnter: function(e) { e.currentTarget.style.transform='translateX(3px)'; },
          onMouseLeave: function(e) { e.currentTarget.style.transform='translateX(0)'; },
        },
          React.createElement('div', { style:{ width:'6px', alignSelf:'stretch', background: color, flexShrink:0 } }),
          React.createElement('div', { style:{ flex:1, padding:'18px 16px' } },
            React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, sub),
            React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, '강좌 ' + count + '개')
          ),
          React.createElement('div', { style:{ padding:'0 20px', fontSize:'22px', color:'rgba(0,0,0,0.2)' } }, '\u203a')
        );
      })
    )
  );
}

/* ── Course List (강좌 선택) ──────────────────── */
function CourseList({ subject, courses, studentGrade, enrolledIds, onSelectCourse, onBack }) {
  var subjectCourses = courses.filter(function(c) { return c.subject === subject && enrolledIds.includes(c.id); });
  var color = SUBJECT_COLORS[subject] || '#006241';

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'60vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '\u2190 과목 선택으로')
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, subject + ' 강좌'),
      subjectCourses.length === 0
        ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center' } },
            React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '배정된 강좌가 없습니다.')
          )
        : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
            subjectCourses.map(function(course) {
              var lectures = course.lectures || [];
              var totalLec = lectures.length;
              // 강의별 진도 평균
              var totalProgress = lectures.reduce(function(sum, lec) {
                return sum + parseFloat(localStorage.getItem('lec_progress_' + lec.id) || '0');
              }, 0);
              var avgProgress = totalLec > 0 ? Math.round(totalProgress / totalLec) : 0;
              return React.createElement('div', {
                key: course.id,
                onClick: function() { onSelectCourse(course); },
                style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
                onMouseEnter: function(e) { e.currentTarget.style.transform='translateX(3px)'; },
                onMouseLeave: function(e) { e.currentTarget.style.transform='translateX(0)'; },
              },
                React.createElement('div', { style:{ width:'5px', alignSelf:'stretch', background: color, flexShrink:0 } }),
                React.createElement('div', { style:{ flex:1, padding:'16px 12px', minWidth:0 } },
                  React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, course.name),
                  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'3px' } }, course.teacher + ' · 총 ' + totalLec + '강')
                ),
                React.createElement('div', { style:{ padding:'0 16px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' } },
                  React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color: avgProgress > 0 ? color : 'rgba(0,0,0,0.25)', fontFamily:'Manrope, sans-serif' } }, avgProgress + '%'),
                  React.createElement('div', { style:{ width:'40px', height:'4px', background:'#f2f0eb', borderRadius:'2px', overflow:'hidden' } },
                    React.createElement('div', { style:{ height:'100%', background: color, borderRadius:'2px', width: avgProgress + '%' } })
                  )
                ),
                React.createElement('div', { style:{ padding:'0 14px 0 4px', fontSize:'20px', color:'rgba(0,0,0,0.2)', flexShrink:0 } }, '\u203a')
              );
            })
          )
    )
  );
}

/* ── Lecture List (강의 목록) ─────────────────── */
function LectureList({ course, onSelectLecture, onBack }) {
  var color = SUBJECT_COLORS[course.subject] || '#006241';
  var lectures = course.lectures || [];

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'60vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '\u2190 강좌 목록으로'),
      React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
      React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', fontWeight:'600' } }, course.name)
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '강의 목록 · 총 ' + lectures.length + '강'),
      lectures.length === 0
        ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center' } },
            React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '등록된 강의가 없습니다.')
          )
        : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
            lectures.map(function(lec, idx) {
              var progress = Math.round(parseFloat(localStorage.getItem('lec_progress_' + lec.id) || '0'));
              var done = progress >= 90;
              return React.createElement('div', {
                key: lec.id,
                onClick: function() { onSelectLecture(lec); },
                style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
                onMouseEnter: function(e) { e.currentTarget.style.transform='translateX(3px)'; },
                onMouseLeave: function(e) { e.currentTarget.style.transform='translateX(0)'; },
              },
                React.createElement('div', { style:{ width:'5px', alignSelf:'stretch', background: done ? color : 'rgba(0,0,0,0.1)', flexShrink:0 } }),
                React.createElement('div', { style:{ width:'44px', textAlign:'center', fontSize:'13px', fontWeight:'800', color: done ? color : 'rgba(0,0,0,0.25)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (idx+1) + '강'),
                React.createElement('div', { style:{ flex:1, padding:'14px 12px', minWidth:0 } },
                  React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, lec.title),
                  !getLectureYoutubeId(lec) && !getLectureDirectUrl(lec) && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.3)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, '영상 준비 중')
                ),
                React.createElement('div', { style:{ padding:'0 16px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' } },
                  React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color: progress > 0 ? color : 'rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif' } }, progress + '%'),
                  React.createElement('div', { style:{ width:'36px', height:'3px', background:'#f2f0eb', borderRadius:'2px', overflow:'hidden' } },
                    React.createElement('div', { style:{ height:'100%', background: color, borderRadius:'2px', width: progress + '%' } })
                  )
                ),
                React.createElement('div', { style:{ padding:'0 14px 0 4px', fontSize:'20px', color:'rgba(0,0,0,0.2)', flexShrink:0 } }, '\u203a')
              );
            })
          )
    )
  );
}

/* ── Student Portal ───────────────────────────── */
function StudentPortal({ user, courses, students, onLoginClick, isAdmin, adminAuthed }) {
  var [selectedSubject, setSelectedSubject] = React.useState(null);
  var [selectedCourse, setSelectedCourse] = React.useState(null);
  var [selectedLecture, setSelectedLecture] = React.useState(null);

  // 비로그인 상태
  if (!user) {
    return React.createElement('div', { style:{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px', background:'#f2f0eb', padding:'40px' } },
      React.createElement('div', { style:{ width:'72px', height:'72px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' } }, '\uD83C\uDF93'),
      React.createElement('h2', { style:{ fontSize:'28px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, '로그인이 필요합니다'),
      React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', textAlign:'center', lineHeight:'1.7' } }, '수강 중인 강의를 보려면 로그인해 주세요.\nGoogle 또는 카카오톡으로 간편하게 로그인할 수 있습니다.'),
      React.createElement('button', { onClick:onLoginClick, style:{ background:'#00754A', color:'#fff', border:'none', borderRadius:'8px', padding:'14px 32px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
        onMouseDown:function(e){e.currentTarget.style.transform='scale(0.95)';}, onMouseUp:function(e){e.currentTarget.style.transform='scale(1)';} }, '로그인하기')
    );
  }

  var adminMode = !!(isAdmin || adminAuthed || user?.isAdmin || user?.role === 'admin');
  var enrolledIds = adminMode ? courses.map(function(c) { return c.id; }) : (user ? (user.enrolledCourses || []) : []);
  var studentGrade = user ? (user.grade || '') : '';
  var studentSubjects = React.useMemo(() => {
    // enrolledIds에 해당하는 courses의 subject 목록 추출
    var subjectsSet = new Set(
      courses.filter(c => enrolledIds.includes(c.id)).map(c => c.subject)
    );
    return Array.from(subjectsSet);
  }, [courses, enrolledIds]);

  var coursesBySubject = React.useMemo(() => {
    return studentSubjects.reduce(function(acc, sub) {
      acc[sub] = courses.filter(function(c) { return c.subject === sub && enrolledIds.includes(c.id); });
      return acc;
    }, {});
  }, [studentSubjects, courses, enrolledIds]);

  // 상단 헤더 공통
  function renderHeader(small) {
    return React.createElement('div', { style:{ background:'#1E3932', padding: small ? '20px 16px' : '28px 16px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap: small ? '10px' : '16px' } },
          React.createElement('div', { style:{ width: small?'40px':'52px', height: small?'40px':'52px', borderRadius:'50%', background:'#00754A', display:'flex', alignItems:'center', justifyContent:'center', fontSize: small?'18px':'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name[0]),
          React.createElement('div', { style:{ fontSize: small?'16px':'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name + '님' + (small ? '' : ', 안녕하세요!'))
        ),
        studentGrade && React.createElement('div', { style:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 14px':'8px 20px' } },
          React.createElement('span', { style:{ fontSize: small?'12px':'14px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, studentGrade)
        )
      )
    );
  }

  // 4단계: 영상 시청
  if (selectedLecture) {
    return React.createElement(VideoPlayer, {
      lecture: selectedLecture,
      course: selectedCourse,
      onBack: function() { setSelectedLecture(null); },
      studentName: user.name,
    });
  }

  // 3단계: 강의 목록
  if (selectedCourse) {
    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement(LectureList, {
        course: selectedCourse,
        onSelectLecture: setSelectedLecture,
        onBack: function() { setSelectedCourse(null); },
      })
    );
  }

  // 2단계: 강좌 목록
  if (selectedSubject) {
    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement(CourseList, {
        subject: selectedSubject,
        courses: courses,
        studentGrade: studentGrade,
        enrolledIds: enrolledIds,
        onSelectCourse: setSelectedCourse,
        onBack: function() { setSelectedSubject(null); },
      })
    );
  }

  // 1단계: 과목 선택
  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    renderHeader(false),
    studentSubjects.length === 0
      ? React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
          React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'48px', textAlign:'center' } },
            React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '배정된 강좌가 없습니다. 관리자에게 문의해 주세요.')
          )
        )
      : React.createElement(SubjectSelect, {
          studentSubjects: studentSubjects,
          coursesBySubject: coursesBySubject,
          onSelect: setSelectedSubject,
        })
  );
}

/* ── Teacher Portal ───────────────────────────── */
function TeacherPortal({ user, courses, onLogout }) {
  const sb = window.supabase;
  const mySubjects = user.subjects || [];

  // ── State ──────────────────────────────────────
  const [tab, setTab] = React.useState('students'); // 'students' | 'notes'
  const [myStudents, setMyStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 필터
  const [filterLevel, setFilterLevel] = React.useState('전체');
  const [filterGrade, setFilterGrade] = React.useState('전체');
  const [filterSchool, setFilterSchool] = React.useState('전체');

  // 선택된 학생
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [studentTab, setStudentTab] = React.useState('score'); // 'score' | 'attend' | 'note'

  // 성적 입력
  const [scores, setScores] = React.useState([]);
  const [scoreForm, setScoreForm] = React.useState({ test_type:'daily', subject: mySubjects[0]||'', score:'', total:'100', test_date: new Date().toISOString().slice(0,10), note:'' });

  // 출결 입력
  const [attendance, setAttendance] = React.useState([]);
  const [attendForm, setAttendForm] = React.useState({ date: new Date().toISOString().slice(0,10), status:'present', note:'' });

  // 특이사항
  const [notes, setNotes] = React.useState([]);
  const [noteInput, setNoteInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const SCHOOL_LEVELS = {
    '초등': { schools:['은지초','검암초','간재울초'], grades:['1학년','2학년','3학년','4학년','5학년','6학년'] },
    '중등': { schools:['검암중','간재울중','백석중'], grades:['중1','중2','중3'] },
    '고등': { schools:['대인고','서인천고','백석고'], grades:['고1','고2','고3'] },
  };
  const SCHOOLS = ['은지초','검암초','간재울초','검암중','간재울중','백석중','대인고','서인천고','백석고'];
  const TEST_TYPES = [
    { key:'daily', label:'일일 테스트' },
    { key:'weekly', label:'주간 테스트' },
    { key:'monthly', label:'월간 테스트' },
    { key:'school', label:'내신 성적' },
  ];
  const STATUS_OPTIONS = [
    { key:'present', label:'출석', color:'#006241', bg:'#d4e9e2' },
    { key:'late',    label:'지각', color:'#856404', bg:'#fff3cd' },
    { key:'absent',  label:'결석', color:'#c82014', bg:'#ffe5e5' },
  ];

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box', background:'#fafafa' };
  const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.05em', fontFamily:'Manrope, sans-serif', marginBottom:'5px', display:'block' };
  const cardS = { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:'10px' };
  const btnS = (bg='#006241') => ({ background:bg, color:'#fff', border:'none', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s' });

  // ── 담당 학생 로드 ─────────────────────────────
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // 담당 과목의 강좌에 수강 배정된 학생 조회
        const { data: courseData } = await sb.from('courses')
          .select('id, subjects(name)')
          .in('subject_id',
            (await sb.from('subjects').select('id').in('name', mySubjects.length ? mySubjects : [''])).data?.map(s=>s.id) || []
          );
        const courseIds = (courseData||[]).map(c=>c.id);

        let students = [];
        if (courseIds.length > 0) {
          const { data: enrolls } = await sb.from('enrollments')
            .select('student_id, students(id,name,grade,school,phone,subjects,parent_id)')
            .in('course_id', courseIds);
          const seen = new Set();
          (enrolls||[]).forEach(e => {
            if (e.students && !seen.has(e.students.id)) {
              seen.add(e.students.id);
              students.push(e.students);
            }
          });
        }
        setMyStudents(students);
      } catch(err) {
        console.error(err);
        setMyStudents([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── 학생 선택 시 데이터 로드 ──────────────────
  React.useEffect(() => {
    if (!selectedStudent) return;
    setScores([]); setAttendance([]); setNotes([]);

    sb.from('test_scores').select('*').eq('student_id', selectedStudent.id)
      .order('test_date', { ascending:false })
      .then(({ data }) => setScores(data||[]));

    sb.from('attendance').select('*').eq('student_id', selectedStudent.id)
      .order('date', { ascending:false })
      .then(({ data }) => setAttendance(data||[]));

    sb.from('teacher_notes').select('*').eq('student_id', selectedStudent.id)
      .order('created_at', { ascending:false })
      .then(({ data }) => setNotes(data||[]));
  }, [selectedStudent]);

  // ── 성적 저장 ─────────────────────────────────
  async function saveScore() {
    if (!scoreForm.score) { setMsg('점수를 입력해 주세요.'); return; }
    if (!scoreForm.subject) { setMsg('과목을 선택해 주세요.'); return; }
    setSaving(true); setMsg('');
    const { data, error } = await sb.from('test_scores').insert({
      student_id: selectedStudent.id,
      teacher_id: user.id,
      test_type: scoreForm.test_type,
      subject: scoreForm.subject,
      score: parseFloat(scoreForm.score),
      total: parseFloat(scoreForm.total||100),
      test_date: scoreForm.test_date,
      note: scoreForm.note,
    }).select().single();
    if (!error && data) {
      setScores(prev => [data, ...prev]);
      setScoreForm(f => ({ ...f, score:'', note:'' }));
      setMsg('✓ 저장완료');
    } else { setMsg('오류: ' + (error?.message||'')); }
    setSaving(false);
  }

  // ── 출결 저장 ─────────────────────────────────
  async function saveAttend() {
    setSaving(true); setMsg('');
    const { data, error } = await sb.from('attendance').insert({
      student_id: selectedStudent.id,
      teacher_id: user.id,
      date: attendForm.date,
      status: attendForm.status,
      note: attendForm.note,
    }).select().single();
    if (!error && data) {
      setAttendance(prev => [data, ...prev]);
      setAttendForm(f => ({ ...f, note:'' }));
      setMsg('✓ 저장완료');
    } else { setMsg('오류: ' + (error?.message||'')); }
    setSaving(false);
  }

  // ── 특이사항 저장 ─────────────────────────────
  async function saveNote() {
    if (!noteInput.trim()) return;
    setSaving(true);
    const { data, error } = await sb.from('teacher_notes').insert({
      student_id: selectedStudent.id,
      teacher_id: user.id,
      content: noteInput.trim(),
    }).select().single();
    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      setNoteInput('');
    }
    setSaving(false);
  }

  async function deleteNote(id) {
    await sb.from('teacher_notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  async function deleteScore(id) {
    await sb.from('test_scores').delete().eq('id', id);
    setScores(prev => prev.filter(s => s.id !== id));
  }

  async function deleteAttend(id) {
    await sb.from('attendance').delete().eq('id', id);
    setAttendance(prev => prev.filter(a => a.id !== id));
  }

  // ── 필터링 ────────────────────────────────────
  const filteredStudents = myStudents.filter(st => {
    if (filterLevel !== '전체') {
      const lvGrades = SCHOOL_LEVELS[filterLevel].grades;
      if (!lvGrades.includes(st.grade)) return false;
    }
    if (filterSchool !== '전체' && st.school !== filterSchool) return false;
    if (filterGrade !== '전체' && st.grade !== filterGrade) return false;
    return true;
  });

  // ── 공통 헤더 ─────────────────────────────────
  const header = React.createElement('div', { style:{ background:'#1E3932', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' } },
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#00754A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name[0]),
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name + ' 선생님'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } },
          '담당 과목: ' + (mySubjects.length ? mySubjects.join(' · ') : '미배정')
        )
      )
    ),
    React.createElement('button', { onClick:onLogout, style:{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'7px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그아웃')
  );

  // ── 탭 바 ─────────────────────────────────────
  const tabBar = React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 24px', display:'flex' } },
    [{ id:'students', label:'📋 학생 관리' }, { id:'notes', label:'📝 특이사항 전체' }].map(t =>
      React.createElement('button', { key:t.id, onClick:()=>{ setTab(t.id); setSelectedStudent(null); setMsg(''); },
        style:{ padding:'14px 20px', background:'none', border:'none', borderBottom: tab===t.id?'2px solid #006241':'2px solid transparent', fontSize:'14px', fontWeight:'700', color: tab===t.id?'#006241':'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, t.label)
    )
  );

  // ── 학생 상세 뷰 ──────────────────────────────
  if (selectedStudent) {
    const statCounts = {
      present: attendance.filter(a=>a.status==='present').length,
      late:    attendance.filter(a=>a.status==='late').length,
      absent:  attendance.filter(a=>a.status==='absent').length,
    };

    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'100vh' } },
      header,
      // 학생 서브헤더
      React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'14px 24px', display:'flex', alignItems:'center', gap:'12px' } },
        React.createElement('button', { onClick:()=>{ setSelectedStudent(null); setMsg(''); },
          style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '← 목록으로'),
        React.createElement('div', { style:{ width:'1px', height:'20px', background:'rgba(0,0,0,0.1)' } }),
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
          React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, selectedStudent.name[0]),
          React.createElement('div', null,
            React.createElement('span', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, selectedStudent.name),
            React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginLeft:'8px' } },
              [selectedStudent.school, selectedStudent.grade].filter(Boolean).join(' · '))
          )
        ),
        // 출결 요약
        React.createElement('div', { style:{ marginLeft:'auto', display:'flex', gap:'10px' } },
          [{ label:'출석', count:statCounts.present, color:'#006241', bg:'#d4e9e2' },
           { label:'지각', count:statCounts.late,    color:'#856404', bg:'#fff3cd' },
           { label:'결석', count:statCounts.absent,  color:'#c82014', bg:'#ffe5e5' }].map(s =>
            React.createElement('div', { key:s.label, style:{ background:s.bg, borderRadius:'8px', padding:'4px 12px', display:'flex', gap:'5px', alignItems:'center' } },
              React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:s.color, fontFamily:'Manrope, sans-serif' } }, s.label),
              React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:s.color, fontFamily:'Manrope, sans-serif' } }, s.count)
            )
          )
        )
      ),
      // 서브탭
      React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 24px', display:'flex' } },
        [{ id:'score', label:'📊 성적' }, { id:'attend', label:'📅 출결' }, { id:'note', label:'💬 특이사항' }].map(t =>
          React.createElement('button', { key:t.id, onClick:()=>{ setStudentTab(t.id); setMsg(''); },
            style:{ padding:'12px 18px', background:'none', border:'none', borderBottom: studentTab===t.id?'2px solid #006241':'2px solid transparent', fontSize:'13px', fontWeight:'700', color: studentTab===t.id?'#006241':'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, t.label)
        )
      ),

      React.createElement('div', { style:{ maxWidth:'720px', margin:'0 auto', padding:'24px 16px' } },

        // ── 성적 탭 ──
        studentTab==='score' && React.createElement('div', null,
          // 빠른 입력 카드
          React.createElement('div', { style:{ ...cardS, marginBottom:'20px' } },
            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '성적 입력'),

            // 테스트 종류 - 버튼 선택
            React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' } },
              TEST_TYPES.map(t =>
                React.createElement('button', { key:t.key, onClick:()=>setScoreForm(f=>({...f,test_type:t.key})),
                  style:{ padding:'7px 14px', borderRadius:'8px', border:'none', background: scoreForm.test_type===t.key?'#1E3932':'#f2f0eb', color: scoreForm.test_type===t.key?'#fff':'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' } }, t.label)
              )
            ),

            // 과목 선택
            React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' } },
              (mySubjects.length ? mySubjects : ['국어','영어','수학','과학']).map(sub =>
                React.createElement('button', { key:sub, onClick:()=>setScoreForm(f=>({...f,subject:sub})),
                  style:{ padding:'7px 14px', borderRadius:'8px', border:'none', background: scoreForm.subject===sub?'#006241':'#f2f0eb', color: scoreForm.subject===sub?'#fff':'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' } }, sub)
              )
            ),

            // 점수 + 날짜 한 줄
            React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'10px', alignItems:'flex-end' } },
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('label', { style:labelS }, '점수'),
                React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'4px' } },
                  React.createElement('input', { type:'number', value:scoreForm.score, onChange:e=>setScoreForm(f=>({...f,score:e.target.value})), placeholder:'85', style:{ ...inputS, width:'80px', textAlign:'center', fontSize:'20px', fontWeight:'800' }, min:0, max:200 }),
                  React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '/'),
                  React.createElement('input', { type:'number', value:scoreForm.total, onChange:e=>setScoreForm(f=>({...f,total:e.target.value})), style:{ ...inputS, width:'64px', textAlign:'center' }, min:1 })
                )
              ),
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('label', { style:labelS }, '날짜'),
                React.createElement('input', { type:'date', value:scoreForm.test_date, onChange:e=>setScoreForm(f=>({...f,test_date:e.target.value})), style:inputS })
              ),
              React.createElement('div', { style:{ flex:2 } },
                React.createElement('label', { style:labelS }, '메모 (선택)'),
                React.createElement('input', { value:scoreForm.note, onChange:e=>setScoreForm(f=>({...f,note:e.target.value})), placeholder:'오답 유형, 특이사항 등', style:inputS })
              )
            ),

            msg && React.createElement('div', { style:{ fontSize:'13px', color: msg.startsWith('✓')?'#006241':'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'8px', fontWeight:'600' } }, msg),

            React.createElement('button', { onClick:saveScore, disabled:saving,
              style:{ ...btnS(), width:'100%', padding:'12px', fontSize:'14px' } },
              saving ? '저장 중...' : '✓ 성적 저장')
          ),

          // 성적 기록 목록
          scores.length === 0
            ? React.createElement('div', { style:{ textAlign:'center', padding:'32px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '아직 기록된 성적이 없습니다.')
            : React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'8px', letterSpacing:'0.04em' } }, '성적 기록'),
                scores.map(s =>
                  React.createElement('div', { key:s.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px' } },
                    React.createElement('div', { style:{ width:'52px', height:'52px', borderRadius:'10px', background:'#1E3932', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 } },
                      React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', lineHeight:1 } }, s.score),
                      React.createElement('div', { style:{ fontSize:'10px', color:'rgba(255,255,255,0.6)', fontFamily:'Manrope, sans-serif' } }, '/' + s.total)
                    ),
                    React.createElement('div', { style:{ flex:1 } },
                      React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'3px' } },
                        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, s.subject),
                        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'600', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, TEST_TYPES.find(t=>t.key===s.test_type)?.label || s.test_type)
                      ),
                      React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } },
                        s.test_date + (s.note ? ' · ' + s.note : '')
                      )
                    ),
                    React.createElement('button', { onClick:()=>deleteScore(s.id), style:{ background:'none', border:'none', color:'rgba(0,0,0,0.25)', fontSize:'18px', cursor:'pointer', padding:'4px' } }, '×')
                  )
                )
              )
        ),

        // ── 출결 탭 ──
        studentTab==='attend' && React.createElement('div', null,
          React.createElement('div', { style:{ ...cardS, marginBottom:'20px' } },
            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '출결 입력'),

            // 출석/지각/결석 버튼
            React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'12px' } },
              STATUS_OPTIONS.map(s =>
                React.createElement('button', { key:s.key, onClick:()=>setAttendForm(f=>({...f,status:s.key})),
                  style:{ flex:1, padding:'14px', borderRadius:'10px', border:'none', background: attendForm.status===s.key?s.color:s.bg, color: attendForm.status===s.key?'#fff':s.color, fontSize:'15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' } }, s.label)
              )
            ),

            React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'10px' } },
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('label', { style:labelS }, '날짜'),
                React.createElement('input', { type:'date', value:attendForm.date, onChange:e=>setAttendForm(f=>({...f,date:e.target.value})), style:inputS })
              ),
              React.createElement('div', { style:{ flex:2 } },
                React.createElement('label', { style:labelS }, '메모 (선택)'),
                React.createElement('input', { value:attendForm.note, onChange:e=>setAttendForm(f=>({...f,note:e.target.value})), placeholder:'예: 병결, 조퇴 등', style:inputS })
              )
            ),

            msg && React.createElement('div', { style:{ fontSize:'13px', color: msg.startsWith('✓')?'#006241':'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'8px', fontWeight:'600' } }, msg),

            React.createElement('button', { onClick:saveAttend, disabled:saving,
              style:{ ...btnS(), width:'100%', padding:'12px', fontSize:'14px' } },
              saving ? '저장 중...' : '✓ 출결 저장')
          ),

          // 출결 기록
          attendance.length === 0
            ? React.createElement('div', { style:{ textAlign:'center', padding:'32px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '아직 기록된 출결이 없습니다.')
            : React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'8px', letterSpacing:'0.04em' } }, '출결 기록'),
                attendance.map(a => {
                  const st = STATUS_OPTIONS.find(s=>s.key===a.status) || STATUS_OPTIONS[0];
                  return React.createElement('div', { key:a.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px' } },
                    React.createElement('div', { style:{ background:st.bg, borderRadius:'8px', padding:'6px 14px', flexShrink:0 } },
                      React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:st.color, fontFamily:'Manrope, sans-serif' } }, st.label)
                    ),
                    React.createElement('div', { style:{ flex:1 } },
                      React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, a.date),
                      a.note && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, a.note)
                    ),
                    React.createElement('button', { onClick:()=>deleteAttend(a.id), style:{ background:'none', border:'none', color:'rgba(0,0,0,0.25)', fontSize:'18px', cursor:'pointer', padding:'4px' } }, '×')
                  );
                })
              )
        ),

        // ── 특이사항 탭 ──
        studentTab==='note' && React.createElement('div', null,
          React.createElement('div', { style:{ ...cardS, marginBottom:'20px' } },
            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '특이사항 작성'),
            React.createElement('textarea', {
              value: noteInput,
              onChange: e => setNoteInput(e.target.value),
              onKeyDown: e => { if (e.key==='Enter' && (e.ctrlKey||e.metaKey)) saveNote(); },
              placeholder: '학생에 대한 특이사항, 상담 내용, 변화 등을 기록하세요.\nCtrl+Enter로 빠르게 저장할 수 있습니다.',
              rows: 4,
              style: { ...inputS, resize:'vertical', lineHeight:'1.7' }
            }),
            React.createElement('button', { onClick:saveNote, disabled:saving||!noteInput.trim(),
              style:{ ...btnS(noteInput.trim()?'#006241':'#ccc'), marginTop:'10px', padding:'10px 24px' } },
              saving ? '저장 중...' : '저장')
          ),

          notes.length === 0
            ? React.createElement('div', { style:{ textAlign:'center', padding:'32px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '아직 기록된 특이사항이 없습니다.')
            : notes.map(n =>
                React.createElement('div', { key:n.id, style:{ ...cardS, padding:'14px 16px' } },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' } },
                    React.createElement('div', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', flex:1, whiteSpace:'pre-wrap' } }, n.content),
                    React.createElement('button', { onClick:()=>deleteNote(n.id), style:{ background:'none', border:'none', color:'rgba(0,0,0,0.25)', fontSize:'18px', cursor:'pointer', padding:'0 4px', flexShrink:0 } }, '×')
                  ),
                  React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', marginTop:'8px' } },
                    new Date(n.created_at).toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
                  )
                )
              )
        )
      )
    );
  }

  // ── 학생 목록 뷰 ──────────────────────────────
  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'100vh' } },
    header, tabBar,

    // 학생 관리 탭
    tab==='students' && React.createElement('div', { style:{ maxWidth:'800px', margin:'0 auto', padding:'24px 16px' } },

      // 필터 바
      React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' } },
        React.createElement('span', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginRight:'4px' } },
          loading ? '로딩 중...' : `담당 학생 (${filteredStudents.length}명)`),

        ['초등','중등','고등'].map(lv =>
          React.createElement('button', { key:lv, onClick:()=>{ setFilterLevel(filterLevel===lv?'전체':lv); setFilterGrade('전체'); setFilterSchool('전체'); },
            style:{ padding:'6px 14px', borderRadius:'8px', border:'none', background: filterLevel===lv?'#1E3932':'#fff', color: filterLevel===lv?'#fff':'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', transition:'all 0.15s' } }, lv)
        ),

        React.createElement('select', {
          value: filterGrade, onChange:e=>setFilterGrade(e.target.value),
          style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
        },
          React.createElement('option', { value:'전체' }, '전체 학년'),
          (filterLevel==='전체'
            ? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3']
            : SCHOOL_LEVELS[filterLevel].grades
          ).map(g => React.createElement('option',{key:g,value:g},g))
        ),

        React.createElement('select', {
          value: filterSchool, onChange:e=>setFilterSchool(e.target.value),
          style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
        },
          React.createElement('option', { value:'전체' }, '전체 학교'),
          (filterLevel==='전체' ? SCHOOLS : SCHOOL_LEVELS[filterLevel].schools)
            .map(s => React.createElement('option',{key:s,value:s},s))
        )
      ),

      // 학생 카드 목록
      loading
        ? React.createElement('div', { style:{ textAlign:'center', padding:'60px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif' } }, '로딩 중...')
        : filteredStudents.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'60px', textAlign:'center' } },
              React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '📋'),
              React.createElement('div', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '해당하는 학생이 없습니다.')
            )
          : filteredStudents.map(st =>
              React.createElement('div', { key:st.id, style:{ ...cardS, cursor:'pointer', transition:'box-shadow 0.15s' },
                onClick:()=>{ setSelectedStudent(st); setStudentTab('score'); setMsg(''); },
                onMouseEnter:e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)',
                onMouseLeave:e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.08)' },
                React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
                  React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
                  React.createElement('div', { style:{ flex:1 } },
                    React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
                    React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } },
                      [st.school, st.grade].filter(Boolean).join(' · ') || '정보 없음'
                    )
                  ),
                  React.createElement('div', { style:{ display:'flex', gap:'5px' } },
                    (st.subjects||[]).map(sub => React.createElement('span', { key:sub, style:{ background:'#d4e9e2', color:'#006241', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub))
                  ),
                  React.createElement('span', { style:{ fontSize:'18px', color:'rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif' } }, '›')
                )
              )
            )
    ),

    // 특이사항 전체 탭
    tab==='notes' && React.createElement('div', { style:{ maxWidth:'800px', margin:'0 auto', padding:'24px 16px' } },
      React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '전체 특이사항'),
      loading
        ? React.createElement('div', { style:{ textAlign:'center', padding:'60px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif' } }, '로딩 중...')
        : myStudents.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'48px', textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '담당 학생이 없습니다.')
          : React.createElement('div', null,
              myStudents.map(st => {
                const [stNotes, setStNotes] = React.useState(null);
                const [loaded, setLoaded] = React.useState(false);
                React.useEffect(() => {
                  sb.from('teacher_notes').select('*').eq('student_id', st.id).eq('teacher_id', user.id)
                    .order('created_at', { ascending:false }).limit(3)
                    .then(({ data }) => { setStNotes(data||[]); setLoaded(true); });
                }, []);
                if (!loaded || !stNotes || stNotes.length === 0) return null;
                return React.createElement('div', { key:st.id, style:{ ...cardS, marginBottom:'12px' } },
                  React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' } },
                    React.createElement('div', { style:{ width:'28px', height:'28px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, st.name[0]),
                    st.name,
                    React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontWeight:'400' } }, [st.school, st.grade].filter(Boolean).join(' · '))
                  ),
                  stNotes.map(n =>
                    React.createElement('div', { key:n.id, style:{ background:'#f9f9f9', borderRadius:'8px', padding:'10px 14px', marginBottom:'6px' } },
                      React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif', lineHeight:'1.6', whiteSpace:'pre-wrap' } }, n.content),
                      React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } },
                        new Date(n.created_at).toLocaleDateString('ko-KR'))
                    )
                  ),
                  React.createElement('button', { onClick:()=>{ setSelectedStudent(st); setStudentTab('note'); setTab('students'); },
                    style:{ background:'none', border:'none', color:'#006241', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', padding:'4px 0', marginTop:'4px' } }, '+ 더 보기 / 작성')
                );
              })
            )
    )
  );
}


Object.assign(window, { LoginModal, SignupPage, StudentPortal, TeacherPortal });
