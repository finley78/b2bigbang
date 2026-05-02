// StudentPortal.jsx — Login modal + Course grid + Video player

const SUBJECT_COLORS = {
  '국어': '#2b5148',
  '영어': '#00754A',
  '수학': '#006241',
  '과학': '#1E3932',
};

// 학생 grade 문자열에서 level(초등/중등/고등) 추출
function levelFromGrade(g) {
  if (!g) return '';
  if (/^\d+학년$/.test(g)) return '초등';
  if (/^중\d$/.test(g)) return '중등';
  if (/^고\d$/.test(g)) return '고등';
  return '';
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
      if (user.withdrawn_at || user.is_active === false) { setMsg('탈퇴 처리된 계정입니다.'); setLoading(false); return; }
      if (user.role === 'pending_teacher') { setMsg('관리자 승인 대기 중입니다.'); setLoading(false); return; }
      if (user.role === 'pending_student' || user.role === 'pending_parent') { setMsg('가입 처리 중입니다. 잠시 후 다시 시도해 주세요.'); setLoading(false); return; }
      if (user.password_hash !== password) { setMsg('비밀번호가 틀렸습니다.'); setLoading(false); return; }
      const { data: enrollments } = await sb.from('enrollments').select('course_id').eq('student_id', user.id).eq('is_active', true);
      const { data: classRows } = await sb.from('class_students').select('class_id').eq('student_id', user.id);
      onLogin({
        id: user.id, name: user.name, email: user.email, role: user.role,
        grade: user.grade || '', level: levelFromGrade(user.grade),
        subjects: user.subjects || [],
        enrolledCourses: (enrollments||[]).map(e=>e.course_id),
        classIds: (classRows||[]).map(r=>r.class_id),
      });
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
        // 3. 수강 배정 + 클래스 소속 조회
        const { data: enrollments } = await sb.from('enrollments').select('course_id').eq('student_id', student.id).eq('is_active', true);
        const { data: classRows } = await sb.from('class_students').select('class_id').eq('student_id', student.id);
        onLogin({
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role || 'student',
          grade: student.grade || '',
          level: levelFromGrade(student.grade),
          subjects: student.subjects || [],
          enrolledCourses: (enrollments||[]).map(e=>e.course_id),
          classIds: (classRows||[]).map(r=>r.class_id),
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
  const [form, setForm] = React.useState({ name:'', school:'', grade:'', phone:'', address:'', agree:false, parentPhone:'', studentPhone:'' });
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const sb = window.supabase;

  const ROLE_OPTIONS = [
    { key:'student', label:'학생' },
    { key:'parent',  label:'학부모' },
    { key:'teacher', label:'선생님' },
  ];

  function normalizePhone(s) {
    return String(s || '').replace(/[^0-9]/g, '');
  }

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box', background:'#fafafa' };
  const labelS = { display:'block', fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'6px', letterSpacing:'0.04em' };
  const fieldS = { marginBottom:'16px' };

  function setF(k, v) { setForm(f=>({...f, [k]:v})); }

  async function handleSubmit() {
    if (!form.name.trim()) { setMsg('이름을 입력해 주세요.'); return; }
    if (roleType === 'student') {
      if (!form.school.trim()) { setMsg('학교를 입력해 주세요.'); return; }
      if (!form.grade.trim()) { setMsg('학년을 입력해 주세요.'); return; }
      if (!form.parentPhone.trim()) { setMsg('학부모 전화번호를 입력해 주세요.'); return; }
    }
    if (roleType === 'parent') {
      if (!form.studentPhone.trim()) { setMsg('자녀(학생) 전화번호를 입력해 주세요.'); return; }
    }
    if (!form.phone.trim()) { setMsg('전화번호를 입력해 주세요.'); return; }
    if (!form.address.trim()) { setMsg('주소를 입력해 주세요.'); return; }
    if (!form.agree) { setMsg('개인정보 활용에 동의해 주세요.'); return; }

    setLoading(true); setMsg('');
    const dbRole = roleType === 'teacher' ? 'pending_teacher' : roleType;
    const ownPhoneNorm = normalizePhone(form.phone);
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
      insertData.parent_phone = form.parentPhone.trim();
    }

    try {
      if (sb) {
        const { data: inserted, error } = await sb.from('students').insert(insertData).select().single();
        if (error) throw error;

        // 학생-학부모 자동 연결 (전화번호 매칭)
        if (roleType === 'student' && inserted?.id) {
          const targetPhone = normalizePhone(form.parentPhone);
          const { data: parents } = await sb.from('students').select('id, phone').eq('role', 'parent');
          const matchedParent = (parents || []).find(p => normalizePhone(p.phone) === targetPhone);
          if (matchedParent) {
            await sb.from('students').update({ parent_id: matchedParent.id }).eq('id', inserted.id);
          }
        } else if (roleType === 'parent' && inserted?.id) {
          const targetPhone = normalizePhone(form.studentPhone);
          const { data: studentsList } = await sb.from('students').select('id, phone').eq('role', 'student');
          const matchedStudent = (studentsList || []).find(s => normalizePhone(s.phone) === targetPhone);
          if (matchedStudent) {
            await sb.from('students').update({ parent_id: inserted.id, parent_phone: form.phone.trim() }).eq('id', matchedStudent.id);
          }
        }
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
      React.createElement('div', { style:{ fontSize:'64px', marginBottom:'20px' } }, '완료'),
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
            style:{ background:'#fff', borderRadius:'14px', padding:'22px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', cursor:'pointer', border: roleType===r.key ? '2px solid #006241' : '2px solid transparent', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', transition:'all 0.15s' } },
            React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, r.label),
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
        React.createElement('div', { style:{ marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid rgba(0,0,0,0.07)' } },
          React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, ROLE_OPTIONS.find(r=>r.key===roleType)?.label + ' 회원가입'),
          roleType === 'teacher' && React.createElement('div', { style:{ fontSize:'12px', color:'#c87000', fontFamily:'Manrope, sans-serif', marginTop:'4px', fontWeight:'600' } }, '관리자 승인 후 이용 가능합니다')
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

        // 학부모 전화번호 (학생만)
        roleType === 'student' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '학부모 전화번호 *'),
          React.createElement('input', { value:form.parentPhone, onChange:e=>setF('parentPhone',e.target.value), placeholder:'010-0000-0000', style:inputS, type:'tel' })
        ),

        // 학생 전화번호 (학부모만)
        roleType === 'parent' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '자녀(학생) 전화번호 *'),
          React.createElement('input', { value:form.studentPhone, onChange:e=>setF('studentPhone',e.target.value), placeholder:'010-0000-0000', style:inputS, type:'tel' })
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


function getYoutubeEmbedUrlForPortal(url) {
  var raw = String(url || '').trim();
  if (!raw) return '';
  var id = '';
  var match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
  if (match && match[1]) id = match[1];
  else if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) id = raw;
  if (!id) return '';
  var origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  return 'https://www.youtube.com/embed/' + id + '?enablejsapi=1&rel=0&origin=' + encodeURIComponent(origin);
}

function ensureYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._ytApiPromise) return window._ytApiPromise;
  window._ytApiPromise = new Promise(function(resolve) {
    if (window.YT && window.YT.Player) { resolve(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() { if (typeof prev === 'function') prev(); resolve(); };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.body.appendChild(s);
  });
  return window._ytApiPromise;
}

/* ── Video Player ─────────────────────────────── */
function VideoPlayer({ lecture, course, onBack, studentName, userId }) {
  var videoRef = React.useRef(null);
  var seekBarRef = React.useRef(null);
  var hideRef = React.useRef(null);
  var tapRef = React.useRef({ count: 0, timer: null });
  var touchStartRef = React.useRef({ x: 0, y: 0, time: 0 });
  var saveTimerRef = React.useRef(null);
  var viewStartRef = React.useRef(null);
  var ytPlayerRef = React.useRef(null);
  var ytPollRef = React.useRef(null);
  var ytIframeId = 'yt-player-' + lecture.id;

  var [duration, setDuration] = React.useState(0);
  var [currentSec, setCurrentSec] = React.useState(0);
  var [playing, setPlaying] = React.useState(false);
  var [speed, setSpeed] = React.useState(1);
  var [showControls, setShowControls] = React.useState(true);
  var [seekDragging, setSeekDragging] = React.useState(false);
  var [skipAnim, setSkipAnim] = React.useState(null);

  var storageKey = 'lec_progress_' + lecture.id;
  var progress = duration > 0 ? Math.min((currentSec / duration) * 100, 100) : 0;
  var speeds = [1, 1.2, 1.5, 1.8, 2];
  var color = SUBJECT_COLORS[course.subject] || '#006241';
  var youtubeEmbedUrl = getYoutubeEmbedUrlForPortal(lecture.videoUrl || lecture.youtubeId || '');
  var isYoutubeVideo = !!youtubeEmbedUrl;

  // DB에 진도 저장 함수
  async function saveProgressToDB(progressPct, watchedSec) {
    if (!userId || !lecture.id) return;
    var sb = window.supabase;
    if (!sb) return;
    try {
      await sb.from('video_views').upsert({
        student_id: userId,
        video_id: lecture.id,
        course_id: course.id,
        progress_pct: Math.round(progressPct),
        watched_sec: Math.round(watchedSec || 0),
        last_watched_at: new Date().toISOString(),
      }, { onConflict: 'student_id,video_id' });
    } catch(e) { /* 오류 무시 - localStorage로 fallback */ }
  }

  // 시청 시작 기록
  async function recordViewStart() {
    if (!userId || !lecture.id) return;
    viewStartRef.current = new Date();
    var sb = window.supabase;
    if (!sb) return;
    try {
      // view_count 증가
      var { data: existing } = await sb.from('video_views')
        .select('view_count, progress_pct')
        .eq('student_id', userId).eq('video_id', lecture.id).single();
      var savedProgress = existing?.progress_pct || 0;
      if (savedProgress > 0) {
        localStorage.setItem(storageKey, String(savedProgress));
      }
      await sb.from('video_views').upsert({
        student_id: userId,
        video_id: lecture.id,
        course_id: course.id,
        view_count: (existing?.view_count || 0) + 1,
        progress_pct: savedProgress,
        last_watched_at: new Date().toISOString(),
      }, { onConflict: 'student_id,video_id' });
    } catch(e) {}
  }

  React.useEffect(function() {
    recordViewStart();
    return function() {
      clearInterval(saveTimerRef.current);
    };
  }, [lecture.id]);

  // YouTube 영상 진도 추적
  React.useEffect(function() {
    if (!isYoutubeVideo) return;
    var canceled = false;

    function attach() {
      if (canceled) return;
      var iframeEl = document.getElementById(ytIframeId);
      if (!iframeEl || !window.YT || !window.YT.Player) return;
      try {
        ytPlayerRef.current = new window.YT.Player(ytIframeId, {
          events: {
            onReady: function(e) {
              try {
                var dur = e.target.getDuration();
                if (dur > 0) setDuration(dur);
                var saved = parseFloat(localStorage.getItem(storageKey) || '0');
                if (saved > 0 && saved < 99 && dur > 0) e.target.seekTo((saved / 100) * dur, true);
              } catch (err) {}
            },
            onStateChange: function(e) {
              var state = e.data;
              try {
                var t = e.target.getCurrentTime();
                var d = e.target.getDuration();
                setCurrentSec(t);
                if (d > 0) setDuration(d);
                var pct = d > 0 ? (t / d * 100) : 0;
                if (state === 1) {
                  setPlaying(true);
                  clearInterval(ytPollRef.current);
                  ytPollRef.current = setInterval(function() {
                    try {
                      var tt = e.target.getCurrentTime();
                      var dd = e.target.getDuration();
                      setCurrentSec(tt);
                      if (dd > 0) setDuration(dd);
                      var pp = dd > 0 ? (tt / dd * 100) : 0;
                      localStorage.setItem(storageKey, pp.toFixed(2));
                      saveProgressToDB(pp, tt);
                    } catch (err) {}
                  }, 5000);
                } else if (state === 2) {
                  setPlaying(false);
                  clearInterval(ytPollRef.current);
                  localStorage.setItem(storageKey, pct.toFixed(2));
                  saveProgressToDB(pct, t);
                } else if (state === 0) {
                  setPlaying(false);
                  clearInterval(ytPollRef.current);
                  localStorage.setItem(storageKey, '100');
                  saveProgressToDB(100, d);
                }
              } catch (err) {}
            },
          },
        });
      } catch (err) {}
    }

    ensureYouTubeIframeApi().then(function() {
      // iframe이 DOM에 마운트될 시간을 살짝 줌
      setTimeout(attach, 50);
    });

    return function() {
      canceled = true;
      clearInterval(ytPollRef.current);
      try {
        var t = ytPlayerRef.current && ytPlayerRef.current.getCurrentTime ? ytPlayerRef.current.getCurrentTime() : 0;
        var d = ytPlayerRef.current && ytPlayerRef.current.getDuration ? ytPlayerRef.current.getDuration() : 0;
        var pct = d > 0 ? (t / d * 100) : 0;
        if (pct > 0) saveProgressToDB(pct, t);
      } catch (err) {}
      try { if (ytPlayerRef.current && ytPlayerRef.current.destroy) ytPlayerRef.current.destroy(); } catch (e) {}
      ytPlayerRef.current = null;
    };
  }, [lecture.id, isYoutubeVideo]);

  React.useEffect(function() {
    if (isYoutubeVideo) return;
    var v = videoRef.current;
    if (!v) return;
    var saved = parseFloat(localStorage.getItem(storageKey) || '0');
    function onLoaded() {
      if (saved > 0 && v.duration) v.currentTime = (saved / 100) * v.duration;
      setDuration(v.duration || 0);
    }
    function onTimeUpdate() {
      setCurrentSec(v.currentTime);
      var pct = v.duration ? (v.currentTime / v.duration * 100) : 0;
      localStorage.setItem(storageKey, pct.toFixed(2));
    }
    function onPlay() {
      setPlaying(true);
      // 30초마다 DB 저장
      saveTimerRef.current = setInterval(function() {
        var pct = v.duration ? (v.currentTime / v.duration * 100) : 0;
        saveProgressToDB(pct, v.currentTime);
      }, 30000);
    }
    function onPause() {
      setPlaying(false);
      clearInterval(saveTimerRef.current);
      var pct = v.duration ? (v.currentTime / v.duration * 100) : 0;
      saveProgressToDB(pct, v.currentTime);
    }
    function onEnded() {
      setPlaying(false);
      clearInterval(saveTimerRef.current);
      saveProgressToDB(100, v.duration);
      localStorage.setItem(storageKey, '100');
    }
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    return function() {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      clearInterval(saveTimerRef.current);
    };
  }, [lecture.id]);

  React.useEffect(function() {
    var v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed]);

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
        isYoutubeVideo
          ? React.createElement('iframe', {
              id: ytIframeId,
              src: youtubeEmbedUrl,
              style:{ width:'100%', height:'100%', border:0, display:'block' },
              allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
              allowFullScreen:true,
              title: lecture.title || '온라인 강의',
            })
          : React.createElement('video', {
              ref: videoRef,
              src: lecture.videoUrl || '',
              style:{ width:'100%', height:'100%', objectFit:'contain', display:'block' },
              playsInline: true,
              preload: 'metadata',
              controlsList: 'nodownload nofullscreen',
              disablePictureInPicture: true,
              onContextMenu: function(e) { e.preventDefault(); },
              onError: function(e) { console.log('video error', e); },
            }),
        !lecture.videoUrl && React.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' } },
          React.createElement('div', { style:{ fontSize:'50px', fontWeight:'800', color:'rgba(255,255,255,0.07)', fontFamily:'Manrope, sans-serif' } }, course.subject),
          React.createElement('div', { style:{ fontSize:'13px', color:'rgba(255,255,255,0.35)', fontFamily:'Manrope, sans-serif', marginTop:'8px' } }, '영상 준비 중입니다')
        ),
        React.createElement('div', { style:{ position:'absolute', bottom:'52px', right:'12px', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.2)', fontFamily:'Manrope, sans-serif', pointerEvents:'none', userSelect:'none', zIndex:4 } },
          studentName + ' \u00b7 ' + today
        ),
        skipAnim ? React.createElement('div', { style:{ position:'absolute', top:'50%', transform:'translateY(-50%)', left: skipAnim==='left'?'8%':'auto', right: skipAnim==='right'?'8%':'auto', background:'rgba(0,0,0,0.55)', borderRadius:'8px', padding:'8px 14px', pointerEvents:'none', zIndex:6 } },
          React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, skipAnim==='left'?'-10\ucd08':'+10\ucd08')
        ) : null,
        !isYoutubeVideo && React.createElement('div', { style:{ position:'absolute', inset:0, zIndex:3, opacity: showControls?1:0, transition: showControls?'opacity 0.15s ease':'opacity 0.6s ease', background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.65) 100%)', display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents: showControls?'auto':'none' } },
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
                  !lec.videoUrl && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.3)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, '영상 준비 중')
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
function StudentPortal({ user, courses, onLoginClick, isAdmin, adminAuthed }) {
  var [selectedSubject, setSelectedSubject] = React.useState(null);
  var [selectedCourse, setSelectedCourse] = React.useState(null);
  var [selectedLecture, setSelectedLecture] = React.useState(null);
  var [portalView, setPortalView] = React.useState('main'); // 'main' | 'mypage' | 'files'
  var [profileDraft, setProfileDraft] = React.useState(null);
  var [savingProfile, setSavingProfile] = React.useState(false);
  var [pwDraft, setPwDraft] = React.useState({ current:'', next:'', confirm:'' });
  var [myAttachments, setMyAttachments] = React.useState([]);
  var [loadingFiles, setLoadingFiles] = React.useState(false);

  React.useEffect(function(){
    if (portalView === 'mypage' && user && !profileDraft) {
      (async function(){
        var sb = window.supabase;
        var { data } = await sb.from('students').select('*').eq('id', user.id).single();
        if (data) setProfileDraft({
          name: data.name || '', phone: data.phone || '', school: data.school || '',
          grade: data.grade || '', address: data.address || '', parent_phone: data.parent_phone || '',
          email: data.email || ''
        });
      })();
    }
  }, [portalView, user]);

  React.useEffect(function(){
    if (portalView === 'files' && user) {
      (async function(){
        setLoadingFiles(true);
        var sb = window.supabase;
        // 1) 학생이 속한 클래스 id들
        var { data: cs } = await sb.from('class_students').select('class_id').eq('student_id', user.id);
        var myClassIds = (cs || []).map(function(r){ return r.class_id; });
        // 2) 명시적 수신자 첨부파일 ids
        var { data: ar } = await sb.from('attachment_recipients').select('attachment_id').eq('student_id', user.id);
        var directIds = (ar || []).map(function(r){ return r.attachment_id; });
        // 3) class scope 첨부 (내 클래스 기준) + student scope 명시
        var queries = [];
        if (myClassIds.length > 0) queries.push(sb.from('attachments').select('*').eq('scope','class').in('class_id', myClassIds));
        if (directIds.length > 0) queries.push(sb.from('attachments').select('*').eq('scope','student').in('id', directIds));
        var all = [];
        for (var i = 0; i < queries.length; i++) {
          var r = await queries[i];
          if (r.data) all = all.concat(r.data);
        }
        // 중복 제거
        var seen = {};
        var unique = all.filter(function(x){ if (seen[x.id]) return false; seen[x.id] = true; return true; });
        unique.sort(function(a,b){ return String(b.created_at||'').localeCompare(String(a.created_at||'')); });
        setMyAttachments(unique);
        setLoadingFiles(false);
      })();
    }
  }, [portalView, user]);

  async function saveProfile() {
    if (!profileDraft || !user) return;
    setSavingProfile(true);
    var sb = window.supabase;
    var updates = {
      name: (profileDraft.name||'').trim(),
      phone: (profileDraft.phone||'').trim(),
      school: (profileDraft.school||'').trim(),
      grade: (profileDraft.grade||'').trim(),
      address: (profileDraft.address||'').trim(),
      parent_phone: (profileDraft.parent_phone||'').trim(),
    };
    var { error } = await sb.from('students').update(updates).eq('id', user.id);
    setSavingProfile(false);
    if (error) { alert('저장 실패: ' + error.message); return; }
    alert('정보가 저장되었습니다.');
  }
  async function withdrawAccount() {
    if (!user) return;
    var name = prompt('정말 탈퇴하시겠습니까?\n탈퇴를 진행하시려면 본인 이름 "' + user.name + '"을(를) 입력해 주세요.\n탈퇴 후에는 로그인할 수 없으며 데이터 복구가 어렵습니다.');
    if (name == null) return;
    if (String(name).trim() !== String(user.name).trim()) { alert('이름이 일치하지 않습니다. 탈퇴가 취소되었습니다.'); return; }
    var sb = window.supabase;
    var { error } = await sb.from('students').update({ is_active: false, withdrawn_at: new Date().toISOString() }).eq('id', user.id);
    if (error) { alert('탈퇴 처리 실패: ' + error.message); return; }
    alert('탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
    try {
      sessionStorage.removeItem('b2_user');
      sessionStorage.removeItem('b2_is_admin');
      sessionStorage.removeItem('b2_admin_authed');
      sessionStorage.removeItem('b2_page');
    } catch (e) {}
    window.location.href = '/';
  }
  async function changePassword() {
    if (!user) return;
    if (!pwDraft.current || !pwDraft.next) { alert('현재 비밀번호와 새 비밀번호를 입력해 주세요.'); return; }
    if (pwDraft.next !== pwDraft.confirm) { alert('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    var sb = window.supabase;
    var { data: row } = await sb.from('students').select('password_hash').eq('id', user.id).single();
    if (!row || row.password_hash !== pwDraft.current) { alert('현재 비밀번호가 맞지 않습니다.'); return; }
    var { error } = await sb.from('students').update({ password_hash: pwDraft.next }).eq('id', user.id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    alert('비밀번호가 변경되었습니다.');
    setPwDraft({ current:'', next:'', confirm:'' });
  }
  function attachmentPublicUrl(path) {
    var sb = window.supabase;
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  }
  function formatBytes(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    if (v < 1024*1024) return (v/1024).toFixed(1) + ' KB';
    return (v/1024/1024).toFixed(1) + ' MB';
  }

  var adminMode = !!(isAdmin || adminAuthed || user?.role === 'admin' || user?.isAdmin);
  var isTeacherMode = !adminMode && (user?.role === 'teacher' || user?.role === 'teachers');

  // 선생님: 본인이 올린 강의만, 학생: 명시 enrollment + 클래스 배정 + 학년 배정 합집합, 관리자: 전체
  var enrolledIds = adminMode
    ? courses.map(function(c) { return c.id; })
    : isTeacherMode
      ? courses.filter(function(c) {
          return c.teacher === user?.name ||
                 c.teacher_id === user?.id ||
                 String(c.teacher_email||'') === String(user?.email||'');
        }).map(function(c){ return c.id; })
      : (user
          ? (function(){
              var explicit = user.enrolledCourses || [];
              var classIds = user.classIds || [];
              var byClass = courses
                .filter(function(c){ return c.class_id && classIds.indexOf(c.class_id) >= 0; })
                .map(function(c){ return c.id; });
              var byLevel = (user.level && user.grade)
                ? courses
                    .filter(function(c){ return c.level === user.level && c.grade === user.grade; })
                    .map(function(c){ return c.id; })
                : [];
              return Array.from(new Set([].concat(explicit, byClass, byLevel)));
            })()
          : []);
  var studentGrade = user ? (user.grade || '') : '';
  var studentSubjects = React.useMemo(() => {
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

  // 상단 헤더 공통
  function renderHeader(small) {
    return React.createElement('div', { style:{ background: isTeacherMode ? '#2b5148' : '#1E3932', padding: small ? '20px 16px' : '28px 16px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap: small ? '10px' : '16px' } },
          React.createElement('div', { style:{ width: small?'40px':'52px', height: small?'40px':'52px', borderRadius:'50%', background:'#00754A', display:'flex', alignItems:'center', justifyContent:'center', fontSize: small?'18px':'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, (user.name || '?')[0]),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize: small?'16px':'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, (user.name || '회원') + '님' + (small ? '' : ', 안녕하세요!')),
            isTeacherMode && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.65)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, '내가 등록한 강의 보기')
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
          !adminMode && React.createElement('button', { onClick:function(){ setPortalView('files'); }, style:{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 12px':'8px 16px', fontSize: small?'12px':'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '📎 자료실'),
          !adminMode && !isTeacherMode && React.createElement('button', { onClick:function(){ setPortalView('mypage'); setProfileDraft(null); }, style:{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 12px':'8px 16px', fontSize: small?'12px':'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '👤 마이페이지'),
          (studentGrade || isTeacherMode) && React.createElement('div', { style:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 14px':'8px 20px' } },
            React.createElement('span', { style:{ fontSize: small?'12px':'14px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, isTeacherMode ? '선생님' : studentGrade)
          )
        )
      )
    );
  }

  // 마이페이지
  if (portalView === 'mypage') {
    var fld = function(label, key, type) {
      return React.createElement('div', { key:key, style:{ marginBottom:'12px' } },
        React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, label),
        React.createElement('input', {
          type: type || 'text',
          value: (profileDraft && profileDraft[key]) || '',
          onChange: function(e){ var v = e.target.value; setProfileDraft(function(p){ return Object.assign({}, p, (function(o){ o[key] = v; return o; })({})); }); },
          style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' }
        })
      );
    };
    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement('div', { style:{ maxWidth:'640px', margin:'0 auto', padding:'24px 16px' } },
        React.createElement('button', { onClick:function(){ setPortalView('main'); }, style:{ background:'none', border:'none', color:'#006241', cursor:'pointer', fontSize:'13px', fontWeight:'700', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '← 홈으로'),
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '마이페이지'),
          React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'16px', fontFamily:'Manrope, sans-serif' } }, '본인의 정보를 직접 수정하실 수 있습니다.'),
          !profileDraft ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') : React.createElement('div', null,
            React.createElement('div', { style:{ marginBottom:'12px' } },
              React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '이메일 (변경 불가)'),
              React.createElement('input', { value: profileDraft.email, disabled:true, style:{ width:'100%', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#f9fafb', color:'#9ca3af', boxSizing:'border-box' } })
            ),
            fld('이름', 'name'),
            fld('전화번호', 'phone'),
            fld('학교', 'school'),
            fld('학년', 'grade'),
            fld('주소', 'address'),
            fld('학부모 전화번호', 'parent_phone'),
            React.createElement('button', { onClick:saveProfile, disabled:savingProfile, style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, savingProfile ? '저장 중...' : '정보 저장')
          ),
          React.createElement('div', { style:{ borderTop:'1px solid #e5e7eb', marginTop:'24px', paddingTop:'18px' } },
            React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '비밀번호 변경'),
            React.createElement('div', { style:{ marginBottom:'8px' } }, React.createElement('input', { type:'password', placeholder:'현재 비밀번호', value:pwDraft.current, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { current:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('div', { style:{ marginBottom:'8px' } }, React.createElement('input', { type:'password', placeholder:'새 비밀번호', value:pwDraft.next, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { next:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('div', { style:{ marginBottom:'10px' } }, React.createElement('input', { type:'password', placeholder:'새 비밀번호 확인', value:pwDraft.confirm, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { confirm:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('button', { onClick:changePassword, style:{ background:'#fff', color:'#006241', border:'1px solid #006241', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, '비밀번호 변경')
          ),
          React.createElement('div', { style:{ borderTop:'1px solid #fef2f2', marginTop:'24px', paddingTop:'18px' } },
            React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'6px', color:'#c82014', fontFamily:'Manrope, sans-serif' } }, '회원 탈퇴'),
            React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } }, '탈퇴 시 로그인이 차단되며 등록된 수강 정보·기록 등은 계정이 비활성화 처리됩니다. 복구가 어려우니 신중히 결정해 주세요.'),
            React.createElement('button', { onClick:withdrawAccount, style:{ background:'#fff', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, '회원 탈퇴')
          )
        )
      )
    );
  }

  // 자료실 (학생/선생님 모두 본인 수신 자료 보기)
  if (portalView === 'files') {
    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
        React.createElement('button', { onClick:function(){ setPortalView('main'); }, style:{ background:'none', border:'none', color:'#006241', cursor:'pointer', fontSize:'13px', fontWeight:'700', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '← 홈으로'),
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' } },
          React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '자료실'),
          React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'16px', fontFamily:'Manrope, sans-serif' } }, '담당 선생님이 보내주신 자료를 다운로드할 수 있습니다.'),
          loadingFiles ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
          myAttachments.length === 0 ? React.createElement('div', { style:{ padding:'30px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Manrope, sans-serif' } }, '받은 자료가 아직 없습니다.') :
          myAttachments.map(function(a){
            return React.createElement('div', { key:a.id, style:{ border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' } },
              React.createElement('div', { style:{ flex:1, minWidth:'200px' } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'#1E3932', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, a.title || a.file_name),
                a.description && React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, a.description),
                React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, [a.file_name, formatBytes(a.file_size), String(a.created_at||'').slice(0,10)].filter(Boolean).join(' · '))
              ),
              React.createElement('a', { href: attachmentPublicUrl(a.file_path), target:'_blank', rel:'noopener', download: a.file_name || true, style:{ background:'#006241', color:'#fff', textDecoration:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'12px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '⬇ 다운로드')
            );
          })
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
      userId: user.id,
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
            React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, isTeacherMode ? '등록한 강의가 없습니다. 선생님 페이지에서 강의를 추가해 주세요.' : '배정된 강좌가 없습니다. 관리자에게 문의해 주세요.')
          )
        )
      : React.createElement(SubjectSelect, {
          studentSubjects: studentSubjects,
          coursesBySubject: coursesBySubject,
          onSelect: setSelectedSubject,
        })
  );
}

Object.assign(window, { LoginModal, SignupPage, StudentPortal });
