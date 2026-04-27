// StudentPortal.jsx — Login modal + Course grid + Video player

const SUBJECT_COLORS = {
  '국어': '#2b5148',
  '영어': '#00754A',
  '수학': '#006241',
  '과학': '#1E3932',
};

/* ── Login Modal ──────────────────────────────── */
function LoginModal({ onLogin, onClose, onAdminLogin, onSignup }) {
  const [role, setRole] = React.useState(null); // null | 'student' | 'parent' | 'teacher' | 'admin'
  const [tab, setTab] = React.useState('login'); // 'login' | 'signup'
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const sb = window.supabase;

  // 선생님 이메일/비번 로그인
  async function handleTeacherLogin() {
    if (!email || !password) { setMsg('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: teacher, error } = await sb.from('students')
        .select('*').eq('email', email.trim()).in('role', ['teacher','pending_teacher']).single();
      if (error || !teacher) { setMsg('등록된 선생님 계정이 없습니다.'); setLoading(false); return; }
      if (teacher.role === 'pending_teacher') { setMsg('관리자 승인 대기 중입니다.'); setLoading(false); return; }
      // 간단한 비밀번호 체크 (password_hash 컬럼 비교)
      if (teacher.password_hash !== password) { setMsg('비밀번호가 틀렸습니다.'); setLoading(false); return; }
      onLogin({ id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher', subjects: teacher.subjects || [] });
    } catch(e) { setMsg('오류가 발생했습니다.'); setLoading(false); }
  }

  // 선생님 회원가입
  async function handleTeacherSignup() {
    if (!name || !email || !password) { setMsg('이름, 이메일, 비밀번호를 모두 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: exist } = await sb.from('students').select('id').eq('email', email.trim()).maybeSingle();
      if (exist) { setMsg('이미 등록된 이메일입니다.'); setLoading(false); return; }
      const { error } = await sb.from('students').insert({
        name: name.trim(), email: email.trim(), password_hash: password,
        login_provider: 'email', role: 'pending_teacher', subjects: [],
      });
      if (error) throw error;
      setMsg('✓ 가입 신청이 완료되었습니다!\n관리자 승인 후 로그인하실 수 있습니다.');
      setLoading(false);
    } catch(e) { setMsg('오류가 발생했습니다.'); setLoading(false); }
  }

  // 학생 소셜 로그인
  function handleProvider(provider) {
    const mockUser = provider === 'google'
      ? { name:'김학생', email:'student@gmail.com', provider:'google' }
      : { name:'이수강', email:'student@kakao.com', provider:'kakao' };

    async function loginWithDB() {
      try {
        const { data: student, error } = await sb.from('students')
          .upsert({ email: mockUser.email, name: mockUser.name, login_provider: provider, role: 'student' }, { onConflict: 'email' })
          .select().single();
        if (error) throw error;
        const { data: enrollments } = await sb.from('enrollments')
          .select('course_id').eq('student_id', student.id).eq('is_active', true);
        const enrolledCourses = (enrollments || []).map(e => e.course_id);
        onLogin({ id: student.id, name: student.name, email: student.email, provider: student.login_provider, role: 'student', enrolledCourses });
      } catch(e) {
        console.error('로그인 오류:', e);
        onLogin({ id: provider+'_demo', name: mockUser.name, email: mockUser.email, provider, role: 'student', enrolledCourses: [] });
      }
    }
    loginWithDB();
  }

  const inputFieldStyle = { position:'relative', background:'#f9f9f9', borderRadius:'4px', border:'1px solid #d6dbde', padding:'14px 12px 10px', marginBottom:'10px' };
  const floatLabelStyle = { position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' };
  const inputStyle = { width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' };

  const ROLES = [
    { key:'student', emoji:'🎓', label:'학생' },
    { key:'parent',  emoji:'👨‍👩‍👧', label:'학부모' },
    { key:'teacher', emoji:'👨‍🏫', label:'선생님' },
    { key:'admin',   emoji:'⚙️',  label:'관리자' },
  ];

  // 소셜 로그인 (학생/학부모 공통)
  function handleProvider(provider) {
    const isParent = role === 'parent';
    const mockUser = provider === 'google'
      ? { name: isParent ? '김학부모' : '김학생', email: isParent ? 'parent@gmail.com' : 'student@gmail.com', provider:'google' }
      : { name: isParent ? '이학부모' : '이수강',  email: isParent ? 'parent@kakao.com'  : 'student@kakao.com',  provider:'kakao' };
    async function loginWithDB() {
      try {
        const { data: student, error } = await sb.from('students')
          .upsert({ email: mockUser.email, name: mockUser.name, login_provider: provider, role: isParent ? 'parent' : 'student' }, { onConflict: 'email' })
          .select().single();
        if (error) throw error;
        const { data: enrollments } = await sb.from('enrollments')
          .select('course_id').eq('student_id', student.id).eq('is_active', true);
        onLogin({ id: student.id, name: student.name, email: student.email, provider: student.login_provider, role: isParent ? 'parent' : 'student', enrolledCourses: (enrollments||[]).map(e=>e.course_id) });
      } catch(e) {
        onLogin({ id: provider+'_demo', name: mockUser.name, email: mockUser.email, provider, role: isParent ? 'parent' : 'student', enrolledCourses: [] });
      }
    }
    loginWithDB();
  }

  // 선생님 로그인
  async function handleTeacherLogin() {
    if (!email || !password) { setMsg('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: teacher, error } = await sb.from('students')
        .select('*').eq('email', email.trim()).in('role', ['teacher','pending_teacher']).single();
      if (error || !teacher) { setMsg('등록된 선생님 계정이 없습니다.'); setLoading(false); return; }
      if (teacher.role === 'pending_teacher') { setMsg('관리자 승인 대기 중입니다.'); setLoading(false); return; }
      if (teacher.password_hash !== password) { setMsg('비밀번호가 틀렸습니다.'); setLoading(false); return; }
      onLogin({ id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher', subjects: teacher.subjects || [] });
    } catch(e) { setMsg('오류가 발생했습니다.'); setLoading(false); }
  }

  // 선생님 회원가입
  async function handleTeacherSignup() {
    if (!name || !email || !password) { setMsg('이름, 이메일, 비밀번호를 모두 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: exist } = await sb.from('students').select('id').eq('email', email.trim()).maybeSingle();
      if (exist) { setMsg('이미 등록된 이메일입니다.'); setLoading(false); return; }
      const { error } = await sb.from('students').insert({
        name: name.trim(), email: email.trim(), password_hash: password,
        login_provider: 'email', role: 'pending_teacher', subjects: [],
      });
      if (error) throw error;
      setMsg('✓ 가입 신청 완료!\n관리자 승인 후 로그인하실 수 있습니다.');
      setLoading(false);
    } catch(e) { setMsg('오류가 발생했습니다.'); setLoading(false); }
  }

  // 관리자 로그인
  async function handleAdminLogin() {
    if (!password) { setMsg('비밀번호를 입력해 주세요.'); return; }
    if (password === 'b2admin') {
      onAdminLogin();
      onClose();
    } else {
      setMsg('비밀번호가 틀렸습니다.');
    }
  }

  // 소셜 버튼 렌더
  function renderSocialButtons() {
    return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
      React.createElement('button', { onClick:()=>handleProvider('google'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'1px solid rgba(0,0,0,0.2)', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
        onMouseEnter:e=>e.currentTarget.style.background='#f9f9f9', onMouseLeave:e=>e.currentTarget.style.background='#fff' },
        React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
          React.createElement('path', { d:'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z', fill:'#4285F4' }),
          React.createElement('path', { d:'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill:'#34A853' }),
          React.createElement('path', { d:'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill:'#FBBC05' }),
          React.createElement('path', { d:'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill:'#EA4335' })
        ),
        tab==='login' ? 'Google로 로그인' : 'Google로 로그인'
      ),
      React.createElement('button', { onClick:()=>handleProvider('kakao'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'none', background:'#FEE500', cursor:'pointer', fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.85)', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
        onMouseEnter:e=>e.currentTarget.style.background='#f0d800', onMouseLeave:e=>e.currentTarget.style.background='#FEE500' },
        React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
          React.createElement('path', { d:'M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.93l-.97 3.57c-.09.33.28.59.57.4l4.38-2.89c.43.05.87.08 1.33.08 5.52 0 10-3.69 10-8.25C22 6.69 17.52 3 12 3z', fill:'#3C1E1E' })
        ),
        tab==='login' ? '카카오톡으로 로그인' : '카카오톡으로 로그인'
      )
    );
  }

  // 역할 선택 시 초기화
  function selectRole(r) { setRole(r); setMsg(''); setTab('login'); setName(''); setEmail(''); setPassword(''); }

  var showSocial = !role || role === 'student' || role === 'parent';

  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' }, onClick:e=>e.stopPropagation() },

      // 닫기
      React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),

      // 로고
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, 'B2'),
        React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '빅뱅학원')
      ),

      // 역할 선택 (텍스트 ○ 가로 나열)
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' } },
        ROLES.map(r =>
          React.createElement('button', { key:r.key, onClick:()=>selectRole(r.key),
            style:{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 0', border:'none', background:'none', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'600', color:'rgba(0,0,0,0.75)' } }, r.label),
            React.createElement('div', { style:{ width:'13px', height:'13px', borderRadius:'50%', border: role===r.key ? '4px solid #000' : '1.5px solid #000', background:'#fff', transition:'all 0.15s ease', flexShrink:0 } })
          )
        )
      ),

      // 선생님 폼
      role === 'teacher' && React.createElement('div', { style:{ marginBottom:'16px' } },
        tab === 'signup' && React.createElement('div', { style:inputFieldStyle },
          React.createElement('div', { style:floatLabelStyle }, '이름'),
          React.createElement('input', { placeholder:'홍길동', value:name, onChange:e=>setName(e.target.value), style:inputStyle })
        ),
        React.createElement('div', { style:inputFieldStyle },
          React.createElement('div', { style:floatLabelStyle }, '이메일'),
          React.createElement('input', { type:'email', placeholder:'teacher@b2bigbang.com', value:email, onChange:e=>setEmail(e.target.value), style:inputStyle })
        ),
        React.createElement('div', { style:{ ...inputFieldStyle, marginBottom:'16px' } },
          React.createElement('div', { style:floatLabelStyle }, '비밀번호'),
          React.createElement('input', { type:'password', placeholder:'비밀번호 입력', value:password, onChange:e=>setPassword(e.target.value), onKeyDown:e=>e.key==='Enter'&&(tab==='login'?handleTeacherLogin():handleTeacherSignup()), style:inputStyle })
        ),
        msg && React.createElement('div', { style:{ fontSize:'12px', color: msg.startsWith('✓')?'#006241':'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', lineHeight:'1.6', whiteSpace:'pre-line' } }, msg),
        React.createElement('button', { onClick: tab==='login'?handleTeacherLogin:handleTeacherSignup, disabled:loading, style:{ width:'100%', background: loading?'#aaa':'#1E3932', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } },
          loading ? '처리 중...' : (tab==='login' ? '로그인' : '가입 신청')
        ),
        tab==='signup' && React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif' } }, '가입 신청 후 관리자 승인이 필요합니다.')
      ),

      // 관리자 폼
      role === 'admin' && React.createElement('div', { style:{ marginBottom:'16px' } },
        React.createElement('div', { style:{ ...inputFieldStyle, marginBottom:'16px' } },
          React.createElement('div', { style:floatLabelStyle }, '비밀번호'),
          React.createElement('input', { type:'password', placeholder:'관리자 비밀번호', value:password, onChange:e=>setPassword(e.target.value), onKeyDown:e=>e.key==='Enter'&&handleAdminLogin(), style:inputStyle, autoFocus:true })
        ),
        msg && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, msg),
        React.createElement('button', { onClick:handleAdminLogin, style:{ width:'100%', background:'#1E3932', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '관리자 로그인')
      ),

      // 구글/카카오 버튼 (학생, 학부모, 미선택일 때)
      showSocial && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
        React.createElement('button', { onClick:()=>handleProvider('google'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'1px solid rgba(0,0,0,0.2)', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
          onMouseEnter:e=>e.currentTarget.style.background='#f9f9f9', onMouseLeave:e=>e.currentTarget.style.background='#fff' },
          React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z', fill:'#4285F4' }),
            React.createElement('path', { d:'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill:'#34A853' }),
            React.createElement('path', { d:'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill:'#FBBC05' }),
            React.createElement('path', { d:'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill:'#EA4335' })
          ),
          tab==='login' ? 'Google로 로그인' : 'Google로 로그인'
        ),
        React.createElement('button', { onClick:()=>handleProvider('kakao'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'none', background:'#FEE500', cursor:'pointer', fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.85)', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
          onMouseEnter:e=>e.currentTarget.style.background='#f0d800', onMouseLeave:e=>e.currentTarget.style.background='#FEE500' },
          React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.93l-.97 3.57c-.09.33.28.59.57.4l4.38-2.89c.43.05.87.08 1.33.08 5.52 0 10-3.69 10-8.25C22 6.69 17.52 3 12 3z', fill:'#3C1E1E' })
          ),
          tab==='login' ? '카카오톡으로 로그인' : '카카오톡으로 로그인'
        ),
        React.createElement('div', { style:{ textAlign:'center', marginTop:'14px' } },
          React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '아직 회원이 아니신가요? '),
          React.createElement('span', { onClick:()=>onSignup && onSignup(role||'student'), style:{ fontSize:'13px', color:'#006241', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', textDecoration:'underline' } }, '회원가입')
        ),
        React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'10px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, '로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.')
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
  var progress = duration > 0 ? Math.min((currentSec / duration) * 100, 100) : 0;
  var speeds = [1, 1.2, 1.5, 1.8, 2];
  var color = SUBJECT_COLORS[course.subject] || '#006241';

  React.useEffect(function() {
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
        React.createElement('video', {
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
        React.createElement('div', { style:{ position:'absolute', inset:0, zIndex:3, opacity: showControls?1:0, transition: showControls?'opacity 0.15s ease':'opacity 0.6s ease', background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.65) 100%)', display:'flex', flexDirection:'column', justifyContent:'space-between', pointerEvents: showControls?'auto':'none' } },
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
function StudentPortal({ user, courses, students, onLoginClick }) {
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

  var enrolledIds = user ? (user.enrolledCourses || []) : [];
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
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [lectures, setLectures] = React.useState([]);
  const [tab, setTab] = React.useState('lectures'); // 'lectures' | 'add'
  const [form, setForm] = React.useState({ title:'', youtubeUrl:'', file:null });
  const [uploading, setUploading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [loadingLectures, setLoadingLectures] = React.useState(false);

  const sb = window.supabase;
  const mySubjects = user.subjects || [];
  const myCourses = courses.filter(c => mySubjects.includes(c.subject));

  // 강좌 선택 시 강의 목록 로드
  React.useEffect(() => {
    if (!selectedCourse) { setLectures([]); return; }
    setLoadingLectures(true);
    sb.from('videos').select('*').eq('course_id', selectedCourse.id).order('sort_order')
      .then(({ data }) => { setLectures(data || []); setLoadingLectures(false); });
  }, [selectedCourse]);

  function extractYoutubeId(url) {
    if (!url) return '';
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return m ? m[1] : url.trim();
  }

  async function addLecture() {
    if (!form.title.trim()) { setMsg('강의 제목을 입력해 주세요.'); return; }
    if (!form.youtubeUrl && !form.file) { setMsg('YouTube URL 또는 영상 파일을 입력해 주세요.'); return; }
    setUploading(true); setMsg('');
    try {
      var youtubeId = '';
      if (form.youtubeUrl) {
        youtubeId = extractYoutubeId(form.youtubeUrl);
      } else if (form.file) {
        // 파일 업로드: Supabase Storage 'videos' 버킷
        var fileName = Date.now() + '_' + form.file.name;
        var { error: uploadErr } = await sb.storage.from('videos').upload(fileName, form.file, { cacheControl:'3600', upsert:false });
        if (uploadErr) throw uploadErr;
        // 파일 업로드 성공 시 youtubeId 대신 storage path를 임시로 사용
        youtubeId = 'file:' + fileName;
      }
      var sortOrder = lectures.length + 1;
      var { data, error } = await sb.from('videos').insert({
        course_id: selectedCourse.id, title: form.title.trim(),
        youtube_id: youtubeId, sort_order: sortOrder,
        uploaded_by: user.id,
      }).select().single();
      if (error) throw error;
      setLectures(prev => [...prev, data]);
      setForm({ title:'', youtubeUrl:'', file:null });
      setMsg('✓ 강의가 추가되었습니다!');
      setTab('lectures');
    } catch(e) {
      console.error(e);
      setMsg('오류가 발생했습니다: ' + (e.message || ''));
    }
    setUploading(false);
  }

  async function deleteLecture(id) {
    if (!confirm('이 강의를 삭제할까요?')) return;
    await sb.from('videos').delete().eq('id', id);
    setLectures(prev => prev.filter(l => l.id !== id));
  }

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'6px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box', background:'#fff' };
  const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'6px', display:'block' };
  const SUBJECT_COLORS_LOCAL = { '국어':'#2b5148', '영어':'#00754A', '수학':'#006241', '과학':'#1E3932' };

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },

    // 헤더
    React.createElement('div', { style:{ background:'#1E3932', padding:'20px 24px' } },
      React.createElement('div', { style:{ maxWidth:'900px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
          React.createElement('div', { style:{ width:'44px', height:'44px', borderRadius:'50%', background:'#cba258', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '👨‍🏫'),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name + ' 선생님'),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.55)', fontFamily:'Manrope, sans-serif' } },
              '담당 과목: ' + (mySubjects.length > 0 ? mySubjects.join(', ') : '배정 대기 중')
            )
          )
        ),
        React.createElement('button', { onClick:onLogout, style:{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그아웃')
      )
    ),

    React.createElement('div', { style:{ maxWidth:'900px', margin:'0 auto', padding:'28px 20px' } },

      // 담당 과목 없을 때
      mySubjects.length === 0
        ? React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'48px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'48px', marginBottom:'16px' } }, '⏳'),
            React.createElement('h3', { style:{ fontSize:'20px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '담당 과목 배정 대기 중'),
            React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } }, '관리자가 담당 과목을 배정하면 강의를 관리할 수 있습니다.')
          )
        : React.createElement('div', { style:{ display:'flex', gap:'24px' } },

            // 왼쪽: 강좌 목록
            React.createElement('div', { style:{ width:'240px', flexShrink:0 } },
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'12px' } }, '내 강좌'),
              myCourses.length === 0
                ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'20px', fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', textAlign:'center' } }, '등록된 강좌가 없습니다')
                : myCourses.map(c =>
                    React.createElement('div', { key:c.id, onClick:()=>{ setSelectedCourse(c); setTab('lectures'); setMsg(''); },
                      style:{ background: selectedCourse?.id===c.id ? '#1E3932' : '#fff', borderRadius:'10px', padding:'14px 16px', marginBottom:'8px', cursor:'pointer', transition:'all 0.2s ease',
                        boxShadow: selectedCourse?.id===c.id ? 'none' : '0 1px 4px rgba(0,0,0,0.08)' } },
                      React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color: selectedCourse?.id===c.id ? 'rgba(255,255,255,0.6)' : (SUBJECT_COLORS_LOCAL[c.subject]||'#006241'), fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, c.subject),
                      React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color: selectedCourse?.id===c.id ? '#fff' : 'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', lineHeight:'1.4' } }, c.name),
                      React.createElement('div', { style:{ fontSize:'11px', color: selectedCourse?.id===c.id ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, c.grade)
                    )
                  )
            ),

            // 오른쪽: 강의 관리
            React.createElement('div', { style:{ flex:1, minWidth:0 } },
              !selectedCourse
                ? React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'48px', textAlign:'center' } },
                    React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '←'),
                    React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '왼쪽에서 강좌를 선택하세요')
                  )
                : React.createElement('div', null,
                    // 강좌 제목 + 탭
                    React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' } },
                      React.createElement('div', null,
                        React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color: SUBJECT_COLORS_LOCAL[selectedCourse.subject]||'#006241', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, selectedCourse.subject),
                        React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, selectedCourse.name)
                      ),
                      React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                        ['lectures','add'].map(t =>
                          React.createElement('button', { key:t, onClick:()=>{ setTab(t); setMsg(''); }, style:{ padding:'8px 16px', borderRadius:'8px', border:'none', background: tab===t ? '#006241' : '#f2f0eb', color: tab===t ? '#fff' : 'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } },
                            t === 'lectures' ? '📋 강의 목록' : '+ 강의 추가'
                          )
                        )
                      )
                    ),

                    // 강의 목록 탭
                    tab === 'lectures' && React.createElement('div', null,
                      loadingLectures
                        ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'32px', textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...')
                        : lectures.length === 0
                          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'48px', textAlign:'center' } },
                              React.createElement('div', { style:{ fontSize:'36px', marginBottom:'12px' } }, '🎬'),
                              React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '아직 등록된 강의가 없습니다.'),
                              React.createElement('button', { onClick:()=>setTab('add'), style:{ marginTop:'12px', background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 첫 강의 추가하기')
                            )
                          : lectures.map((lec, idx) =>
                              React.createElement('div', { key:lec.id, style:{ background:'#fff', borderRadius:'10px', padding:'14px 18px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px' } },
                                React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'8px', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, idx+1),
                                React.createElement('div', { style:{ flex:1, minWidth:0 } },
                                  React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, lec.title),
                                  React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } },
                                    lec.youtube_id
                                      ? (lec.youtube_id.startsWith('file:') ? '📁 파일 업로드' : '▶ YouTube: ' + lec.youtube_id)
                                      : '영상 없음'
                                  )
                                ),
                                React.createElement('button', { onClick:()=>deleteLecture(lec.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '삭제')
                              )
                            )
                    ),

                    // 강의 추가 탭
                    tab === 'add' && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px' } },
                      React.createElement('h3', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '새 강의 추가'),

                      React.createElement('div', { style:{ marginBottom:'16px' } },
                        React.createElement('label', { style:labelS }, '강의 제목 *'),
                        React.createElement('input', { value:form.title, onChange:e=>setForm(f=>({...f,title:e.target.value})), placeholder:'예: 1강 - 수열의 개념', style:inputS })
                      ),

                      React.createElement('div', { style:{ marginBottom:'16px', background:'#f9f9f9', borderRadius:'10px', padding:'16px' } },
                        React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '영상 소스 (택 1)'),
                        React.createElement('div', { style:{ marginBottom:'12px' } },
                          React.createElement('label', { style:labelS }, '① YouTube URL'),
                          React.createElement('input', { value:form.youtubeUrl, onChange:e=>setForm(f=>({...f,youtubeUrl:e.target.value,file:null})), placeholder:'https://www.youtube.com/watch?v=...', style:inputS, disabled:!!form.file })
                        ),
                        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' } },
                          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.1)' } }),
                          React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif', fontWeight:'600' } }, 'OR'),
                          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.1)' } })
                        ),
                        React.createElement('div', null,
                          React.createElement('label', { style:labelS }, '② 영상 파일 업로드'),
                          React.createElement('input', { type:'file', accept:'video/*', disabled:!!form.youtubeUrl,
                            onChange:e=>setForm(f=>({...f,file:e.target.files[0]||null,youtubeUrl:''})),
                            style:{ ...inputS, padding:'8px', cursor:'pointer' } }),
                          form.file && React.createElement('div', { style:{ fontSize:'12px', color:'#006241', fontFamily:'Manrope, sans-serif', marginTop:'6px', fontWeight:'600' } }, '✓ ' + form.file.name + ' (' + (form.file.size/1024/1024).toFixed(1) + 'MB)')
                        )
                      ),

                      msg && React.createElement('div', { style:{ fontSize:'13px', color: msg.startsWith('✓')?'#006241':'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', fontWeight:'600' } }, msg),

                      React.createElement('div', { style:{ display:'flex', gap:'10px' } },
                        React.createElement('button', { onClick:addLecture, disabled:uploading, style:{ flex:1, background: uploading?'#aaa':'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor: uploading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, uploading ? '업로드 중...' : '강의 추가'),
                        React.createElement('button', { onClick:()=>{ setTab('lectures'); setMsg(''); setForm({ title:'', youtubeUrl:'', file:null }); }, style:{ padding:'13px 20px', background:'#f2f0eb', color:'rgba(0,0,0,0.6)', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '취소')
                      )
                    )
                  )
            )
          )
    )
  );
}

/* ── Sign Up Page ─────────────────────────────── */
function SignUpPage({ onBack, onComplete }) {
  const [role, setRole] = React.useState(null); // null | 'student' | 'parent' | 'teacher'
  const [form, setForm] = React.useState({ name:'', phone:'', school:'', grade:'', address:'', subject:'', email:'', password:'', agree:false });
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const sb = window.supabase;
  const GRADES = ['중1','중2','중3','고1','고2','고3'];
  const SUBJECTS = ['국어','영어','수학','과학'];
  function setF(k, v) { setForm(f => ({...f, [k]:v})); }

  async function handleSubmit() {
    if (!form.name.trim()) { setMsg('이름을 입력해 주세요.'); return; }
    if (!form.phone.trim()) { setMsg('전화번호를 입력해 주세요.'); return; }
    if (role === 'student' && !form.school.trim()) { setMsg('학교를 입력해 주세요.'); return; }
    if (role === 'student' && !form.grade) { setMsg('학년을 선택해 주세요.'); return; }
    if (!form.address.trim()) { setMsg('주소를 입력해 주세요.'); return; }
    if (role === 'teacher' && !form.subject) { setMsg('담당 과목을 선택해 주세요.'); return; }
    if (role === 'teacher' && !form.email.trim()) { setMsg('이메일을 입력해 주세요.'); return; }
    if (role === 'teacher' && !form.password.trim()) { setMsg('비밀번호를 입력해 주세요.'); return; }
    if (!form.agree) { setMsg('개인정보 수집 및 이용에 동의해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { error } = await sb.from('students').insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        school: role === 'student' ? form.school.trim() : null,
        grade: role === 'student' ? form.grade : null,
        subjects: role === 'teacher' ? [form.subject] : [],
        email: role === 'teacher' ? form.email.trim() : null,
        password_hash: role === 'teacher' ? form.password.trim() : null,
        login_provider: role === 'teacher' ? 'email' : 'form',
        role: 'pending_' + role, // pending_student | pending_parent | pending_teacher
        is_active: false,
      });
      if (error) throw error;
      setDone(true);
    } catch(e) { setMsg('오류가 발생했습니다. 다시 시도해 주세요.'); }
    setLoading(false);
  }

  const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'13px 14px', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box', background:'#fff' };
  const labelS = { fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'6px', display:'block' };
  const fieldS = { marginBottom:'16px' };

  // 완료 화면
  if (done) return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'48px', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' } },
      React.createElement('div', { style:{ fontSize:'52px', marginBottom:'16px' } }, '✅'),
      React.createElement('h2', { style:{ fontSize:'20px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '가입 신청 완료!'),
      React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', marginBottom:'24px' } }, '관리자 승인 후 로그인하실 수 있습니다.\n승인까지 1~2일 소요될 수 있습니다.'),
      React.createElement('button', { onClick:onBack, style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'13px 32px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '홈으로 돌아가기')
    )
  );

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh', padding:'40px 16px' } },
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto' } },

      // 헤더
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px' } },
        React.createElement('button', { onClick: role ? ()=>{ setRole(null); setMsg(''); setForm({ name:'', phone:'', school:'', grade:'', address:'', subject:'', email:'', password:'', agree:false }); } : onBack,
          style:{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:'rgba(0,0,0,0.4)', padding:'4px' } }, '←'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, 'B2빅뱅학원'),
          React.createElement('h1', { style:{ fontSize:'22px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } },
            role === 'student' ? '학생 회원가입' : role === 'parent' ? '학부모 회원가입' : role === 'teacher' ? '선생님 회원가입' : '회원가입'
          )
        )
      ),

      // 역할 선택
      !role && React.createElement('div', null,
        React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '가입 유형을 선택해 주세요'),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
          [
            { key:'student', emoji:'🎓', label:'학생', desc:'수강생으로 가입합니다' },
            { key:'parent',  emoji:'👨‍👩‍👧', label:'학부모', desc:'자녀의 수강 관리를 위해 가입합니다' },
            { key:'teacher', emoji:'👨‍🏫', label:'선생님', desc:'강사로 가입합니다' },
          ].map(r =>
            React.createElement('button', { key:r.key, onClick:()=>setRole(r.key),
              style:{ background:'#fff', borderRadius:'12px', padding:'18px 20px', border:'2px solid rgba(0,0,0,0.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:'16px', textAlign:'left', transition:'all 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
              onMouseEnter:e=>{ e.currentTarget.style.border='2px solid #006241'; }, onMouseLeave:e=>{ e.currentTarget.style.border='2px solid rgba(0,0,0,0.08)'; } },
              React.createElement('div', { style:{ fontSize:'28px' } }, r.emoji),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, r.label),
                React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, r.desc)
              ),
              React.createElement('div', { style:{ marginLeft:'auto', fontSize:'18px', color:'rgba(0,0,0,0.2)' } }, '›')
            )
          )
        ),
        React.createElement('p', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', textAlign:'center', marginTop:'20px', lineHeight:'1.6' } }, '가입 신청 후 관리자 승인이 필요합니다.')
      ),

      // 폼
      role && React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' } },

        // 이름
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '이름 *'),
          React.createElement('input', { value:form.name, onChange:e=>setF('name',e.target.value), placeholder:'홍길동', style:inputS })
        ),

        // 전화번호
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '전화번호 *'),
          React.createElement('input', { value:form.phone, onChange:e=>setF('phone',e.target.value), placeholder:'010-0000-0000', style:inputS })
        ),

        // 학교 (학생만)
        role === 'student' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '학교 *'),
          React.createElement('input', { value:form.school, onChange:e=>setF('school',e.target.value), placeholder:'OO고등학교', style:inputS })
        ),

        // 학년 (학생만)
        role === 'student' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '학년 *'),
          React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
            GRADES.map(g =>
              React.createElement('button', { key:g, onClick:()=>setF('grade',g),
                style:{ padding:'9px 16px', borderRadius:'8px', border: form.grade===g?'2px solid #006241':'2px solid rgba(0,0,0,0.1)', background: form.grade===g?'#006241':'#fff', color: form.grade===g?'#fff':'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' } }, g)
            )
          )
        ),

        // 주소
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '주소 *'),
          React.createElement('input', { value:form.address, onChange:e=>setF('address',e.target.value), placeholder:'서울시 마포구 ...', style:inputS })
        ),

        // 담당 과목 (선생님만)
        role === 'teacher' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '담당 과목 *'),
          React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
            SUBJECTS.map(s =>
              React.createElement('button', { key:s, onClick:()=>setF('subject',s),
                style:{ padding:'9px 18px', borderRadius:'8px', border: form.subject===s?'2px solid #006241':'2px solid rgba(0,0,0,0.1)', background: form.subject===s?'#006241':'#fff', color: form.subject===s?'#fff':'rgba(0,0,0,0.6)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' } }, s)
            )
          )
        ),

        // 이메일/비밀번호 (선생님만)
        role === 'teacher' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '이메일 *'),
          React.createElement('input', { type:'email', value:form.email, onChange:e=>setF('email',e.target.value), placeholder:'teacher@b2bigbang.com', style:inputS })
        ),
        role === 'teacher' && React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '비밀번호 *'),
          React.createElement('input', { type:'password', value:form.password, onChange:e=>setF('password',e.target.value), placeholder:'로그인 시 사용할 비밀번호', style:inputS })
        ),

        // 개인정보 동의
        React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'8px', padding:'14px', marginBottom:'20px' } },
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', marginBottom:'10px', whiteSpace:'pre-line' } },
            '수집 항목: 이름, 전화번호, 주소' + (role==='student' ? ', 학교, 학년' : role==='teacher' ? ', 이메일, 담당 과목' : '') + '\n수집 목적: 수강 관리 및 학원 서비스 제공\n보유 기간: 회원 탈퇴 시까지'
          ),
          React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' } },
            React.createElement('input', { type:'checkbox', checked:form.agree, onChange:e=>setF('agree',e.target.checked), style:{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#006241' } }),
            React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '개인정보 수집 및 이용에 동의합니다 *')
          )
        ),

        msg && React.createElement('div', { style:{ fontSize:'13px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'14px', fontWeight:'600' } }, msg),

        React.createElement('button', { onClick:handleSubmit, disabled:loading,
          style:{ width:'100%', background: loading?'#aaa':'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'15px', fontSize:'15px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } },
          loading ? '처리 중...' : '가입 신청하기'
        ),
        React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif' } }, '가입 신청 후 관리자 승인 후 이용 가능합니다.')
      )
    )
  );
}

Object.assign(window, { LoginModal, StudentPortal, TeacherPortal, SignUpPage });