// StudentPortal.jsx — Login modal + Course grid + Video player

const SUBJECT_COLORS = {
  '국어': '#E60012',
  '영어': '#E60012',
  '수학': '#E60012',
  '과학': '#E60012',
};

// 학년 → 학교급 추출은 B2Utils로 통합
var levelFromGrade = window.B2Utils.levelFromGrade;

/* ── Login Modal ──────────────────────────────── */
function LoginModal({ onClose, onSignup, initialForgot }) {
  // 아이디 저장: 마지막에 체크된 상태로 로그인했다면 그 이메일을 mount 시 미리 채움
  const [email, setEmail] = React.useState(function(){
    try { return localStorage.getItem('b2_remembered_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [forgotMode, setForgotMode] = React.useState(!!initialForgot);
  const [emailMode, setEmailMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotSending, setForgotSending] = React.useState(false);
  const [forgotDone, setForgotDone] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [rememberEmail, setRememberEmail] = React.useState(function(){
    try { return !!localStorage.getItem('b2_remembered_email'); } catch { return false; }
  });
  // 자동입력 자동 로그인 방지 — emailMode 진입 시각 기록 (1차 가드)
  const emailModeOpenedAtRef = React.useRef(0);
  // 자동입력 자동 로그인 방지 (2차 가드) — 로그인 버튼 자체에 직접 신뢰된 pointerdown이 있었는지.
  // PWA 비밀번호 매니저가 input을 채운 뒤 자동으로 submit click을 dispatch하는 시나리오를 차단한다.
  // 페이지 어디든의 pointerdown이 아니라 "버튼을 향한 pointerdown"만 카운트한다.
  const loginBtnPointerRef = React.useRef(0);
  const isMobile = window.B2Utils.useIsMobile();
  // OAuth 페이지 다녀오거나 뒤로가기로 돌아왔을 때 loading 잠금 자동 해제
  // (signInWithOAuth가 redirect 안 하고 끝나면 다른 소셜 버튼이 disabled로 묶이는 문제 방지)
  React.useEffect(() => {
    function onVis() {
      if (document.visibilityState === 'visible') setLoading(false);
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  const sb = window.supabase;

  const inputFieldStyle = { position:'relative', background:'#f9f9f9', borderRadius:'4px', border:'1px solid #d6dbde', padding:'14px 12px 10px', marginBottom:'10px' };
  const floatLabelStyle = { position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' };
  const inputStyle = { width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' };

  // 이메일/비밀번호 로그인 (Supabase Auth)
  // 학생·학부모·선생님·관리자 모두 동일한 흐름. role은 students 행에서 결정됨.
  // 상태 검사(pending/withdrawn) 및 user 상태 갱신·페이지 이동은 App.syncSession이 SIGNED_IN 이벤트에서 단일 처리.
  async function handleEmailLogin(opts) {
    // 1차 가드: emailMode 진입 후 800ms 이내는 자동 트리거로 간주
    if (emailModeOpenedAtRef.current && Date.now() - emailModeOpenedAtRef.current < 800) return;
    // 2차 가드: 사용자가 명시적으로 트리거한 호출인지 검증
    //  - opts.fromEnter=true: 비번 input에서 Enter 눌렀고 isTrusted=true (호출자가 검증)
    //  - opts.fromTrustedClick=true: 로그인 버튼 click이 isTrusted=true이고 버튼 자체에 신뢰된 pointerdown이 있었음 (호출자가 검증)
    // PWA 비밀번호 매니저가 자동 submit하는 경우 click은 isTrusted=false라 통과 못 함.
    var fromEnter = !!(opts && opts.fromEnter);
    var fromTrustedClick = !!(opts && opts.fromTrustedClick);
    if (!fromEnter && !fromTrustedClick) return;
    if (!email || !password) { setMsg('이메일과 비밀번호를 입력해 주세요.'); return; }
    setLoading(true); setMsg('');
    try {
      const { data: authData, error: authError } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        const m = String(authError.message || '').toLowerCase();
        if (m.includes('invalid') || m.includes('credentials')) {
          setMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setMsg('로그인 실패: ' + authError.message);
        }
        setLoading(false); return;
      }
      if (!authData?.user?.id) {
        setMsg('로그인 응답을 받지 못했습니다.'); setLoading(false); return;
      }
      // 아이디 저장 처리 — 체크되어 있으면 저장, 해제되어 있으면 삭제
      try {
        if (rememberEmail) localStorage.setItem('b2_remembered_email', email.trim().toLowerCase());
        else localStorage.removeItem('b2_remembered_email');
      } catch (e) {}
      // 인증 성공. SIGNED_IN 이벤트로 syncSession이 students 조회·상태 검증·라우팅 처리.
      onClose();
    } catch(e) {
      setMsg('오류가 발생했습니다: ' + (e?.message || e));
    }
    setLoading(false);
  }

  // 소셜 로그인 — supabase.auth.signInWithOAuth 트리거. Phase 4 syncSession이 매칭/링크 처리.
  async function handleProvider(provider) {
    setLoading(true); setMsg('');
    try {
      if (provider === 'naver') {
        // Naver는 Supabase가 미지원 + Edge Function이 Supabase 세션을 발급하지 못해 임시 비활성화.
        setMsg('네이버 로그인은 현재 점검 중입니다. 다른 로그인 방법을 이용해 주세요.');
        setLoading(false);
        return;
      }
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setMsg('소셜 로그인을 시작하지 못했습니다: ' + (error.message || ''));
        setLoading(false);
      }
      // 성공 시 브라우저가 OAuth 페이지로 이동 — 이 함수는 더 이상 진행 안 함
    } catch (e) {
      setMsg('네트워크 오류가 발생했습니다.');
      setLoading(false);
    }
  }

  function handleLogin() {
    handleEmailLogin();
  }

  async function submitForgot() {
    setMsg('');
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setMsg('올바른 이메일 주소를 입력해 주세요.'); return;
    }
    setForgotSending(true);
    try {
      // Supabase Auth 내장 비밀번호 재설정 메일 발송
      const { error } = await sb.auth.resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
        { redirectTo: window.location.origin + '/?reset=supabase' }
      );
      if (error) {
        // 보안상 이메일 존재 여부 노출 X — 어떤 응답이든 동일하게 처리
        console.warn('resetPasswordForEmail:', error.message);
      }
      setForgotDone(true);
    } catch (e) {
      setMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setForgotSending(false);
    }
  }

  // 비밀번호 찾기 모드
  if (forgotMode) {
    return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
      React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' }, onClick:e=>e.stopPropagation() },
        React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 8px', fontFamily:'Manrope, sans-serif' } }, '비밀번호 찾기'),
        forgotDone
          ? React.createElement('div', null,
              React.createElement('p', { style:{ fontSize:'13px', color:'#16a34a', fontWeight:'700', margin:'12px 0', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } }, '✓ 입력하신 이메일로 재설정 안내를 보냈습니다.'),
              React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } }, '메일이 안 보이면 스팸함도 확인해 주세요. 링크는 1시간 동안 유효합니다.'),
              React.createElement('button', { onClick: function(){ setForgotMode(false); setForgotDone(false); setForgotEmail(''); setMsg(''); }, style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', marginTop:'18px' } }, '로그인 화면으로')
            )
          : React.createElement('div', null,
              React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.5)', margin:'0 0 16px', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } }, '가입 시 등록한 이메일을 입력하시면 재설정 링크를 보내드려요.'),
              React.createElement('input', { type:'email', name:'email', autoComplete:'email', placeholder:'example@email.com', value:forgotEmail, onChange:function(e){ setForgotEmail(e.target.value); setMsg(''); }, onKeyDown:function(e){ if (e.key==='Enter') submitForgot(); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box', marginBottom:'12px' } }),
              msg && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', lineHeight:'1.6', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),
              React.createElement('button', { onClick:submitForgot, disabled:forgotSending, style:{ width:'100%', background: forgotSending?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor: forgotSending?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, forgotSending ? '발송 중...' : '재설정 메일 받기'),
              React.createElement('button', { onClick:function(){ setForgotMode(false); setMsg(''); }, style:{ width:'100%', background:'transparent', color:'rgba(0,0,0,0.55)', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '← 로그인으로 돌아가기')
            )
      )
    );
  }

  // 이메일 로그인 모드 (이메일/비번 입력 화면)
  if (emailMode) {
    return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
      React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' }, onClick:e=>e.stopPropagation() },
        React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('button', { onClick: function(){ setEmailMode(false); setMsg(''); setEmail(''); setPassword(''); }, style:{ background:'none', border:'none', fontSize:'13px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', cursor:'pointer', padding:0, marginBottom:'16px' } }, '← 돌아가기'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 18px', fontFamily:'Manrope, sans-serif' } }, '이메일로 로그인'),

        // 이메일 입력
        React.createElement('div', { style:inputFieldStyle },
          React.createElement('div', { style:floatLabelStyle }, '이메일'),
          React.createElement('input', { type:'email', name:'email', autoComplete:'email', placeholder:'example@email.com', value:email, onChange:e=>{ setEmail(e.target.value); setMsg(''); }, style:inputStyle })
        ),

        // 비밀번호 입력
        React.createElement('div', { style:{ ...inputFieldStyle, marginBottom:'12px' } },
          React.createElement('div', { style:floatLabelStyle }, '비밀번호'),
          React.createElement('input', { type: showPw ? 'text' : 'password', name:'password', autoComplete:'current-password', placeholder:'비밀번호 입력', value:password, onChange:e=>{ setPassword(e.target.value); setMsg(''); }, onKeyDown:e=>{ if (e.key==='Enter' && e.isTrusted) handleEmailLogin({ fromEnter:true }); }, style:{ ...inputStyle, paddingRight:'28px' } }),
          React.createElement('button', { type:'button', onClick:()=>setShowPw(v=>!v), 'aria-label': showPw ? '비밀번호 숨기기' : '비밀번호 표시', style:{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', padding:'4px', cursor:'pointer', color:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' } },
            showPw
              ? React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' },
                  React.createElement('path', { d:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }),
                  React.createElement('circle', { cx:'12', cy:'12', r:'3' })
                )
              : React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' },
                  React.createElement('path', { d:'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }),
                  React.createElement('line', { x1:'1', y1:'1', x2:'23', y2:'23' })
                )
          )
        ),

        // 아이디 저장 체크박스
        React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px', cursor:'pointer', userSelect:'none', fontFamily:'Manrope, sans-serif' } },
          React.createElement('input', {
            type:'checkbox',
            checked: rememberEmail,
            onChange: function(e){
              var checked = e.target.checked;
              setRememberEmail(checked);
              // 체크박스 즉시 반영 — 해제하면 저장된 값도 즉시 삭제
              try {
                if (!checked) localStorage.removeItem('b2_remembered_email');
              } catch (err) {}
            },
            style:{ width:'16px', height:'16px', accentColor: isMobile ? '#E60012' : '#1E3932', cursor:'pointer', margin:0 }
          }),
          React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.7)', fontWeight:'600' } }, '아이디 저장')
        ),

        msg && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', lineHeight:'1.6', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),

        // 로그인 버튼 — type='button'으로 form submit 오인 방지.
        // 자동완성 자동 로그인 차단:
        //  (1) onPointerDown: 사용자가 버튼 자체를 누르면 isTrusted=true → loginBtnPointerRef 갱신
        //  (2) onClick: e.isTrusted=true이고 직전 600ms 내 버튼 pointerdown이 있어야만 통과
        //  PWA 비밀번호 매니저가 자동으로 click()을 dispatch하면 isTrusted=false라 차단됨.
        React.createElement('button', {
          type:'button',
          onPointerDown: function(e){ if (e && e.isTrusted) loginBtnPointerRef.current = Date.now(); },
          onClick: function(e){
            if (!e || !e.isTrusted) return; // synthetic click(자동완성 등) 차단
            var hasBtnPointer = (Date.now() - loginBtnPointerRef.current) < 600 && loginBtnPointerRef.current > 0;
            if (!hasBtnPointer) return; // 버튼에 향한 신뢰된 pointerdown이 없으면 차단
            handleEmailLogin({ fromTrustedClick:true });
          },
          disabled:loading,
          style:{ width:'100%', background: loading?'#aaa': (isMobile ? '#E60012' : '#1E3932'), color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'14px', transition:'background 0.2s' }
        },
          loading ? '로그인 중...' : '로그인'
        ),

        // 비밀번호 찾기
        React.createElement('div', { style:{ textAlign:'center' } },
          React.createElement('span', { onClick: function(){ setForgotMode(true); setForgotEmail(email); setMsg(''); }, style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', cursor:'pointer', textDecoration:'underline' } }, '비밀번호 잊으셨나요?')
        )
      )
    );
  }

  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' }, onClick:e=>e.stopPropagation() },

      React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),

      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#E60012', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' } },
          React.createElement('img', { src: 'icons/web-app-manifest-192x192.png', alt: 'B2빅뱅학원', style: { width:'100%', height:'100%', objectFit:'cover', display:'block', transform:'scale(1.45)' } })
        ),
        React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '빅뱅학원')
      ),
      React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'24px' } }, '학생·학부모·선생님 모두 같은 로그인 화면을 사용합니다.'),

      // 메인 "이메일 로그인" 버튼 (이메일 모드 진입)
      React.createElement('button', {
        onClick: function(){ setEmailMode(true); setMsg(''); emailModeOpenedAtRef.current = Date.now(); },
        style:{ width:'100%', background: isMobile ? '#E60012' : '#1E3932', color:'#fff', border:'none', borderRadius:'8px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'16px', transition:'background 0.2s' }
      }, '이메일 로그인'),

      msg && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', lineHeight:'1.6', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),

      // 회원가입 링크 + 소셜 로그인
      React.createElement('div', null,
        // 구분선 + 소셜 로그인 라벨
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', margin:'4px 0 14px' } },
          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.08)' } }),
          React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontWeight:'600' } }, '간편 로그인'),
          React.createElement('div', { style:{ flex:1, height:'1px', background:'rgba(0,0,0,0.08)' } })
        ),
        // Google 로그인 버튼
        React.createElement('button', {
          onClick: function(){ handleProvider('google'); },
          disabled: loading,
          style:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', background:'#fff', color:'rgba(0,0,0,0.75)', border:'1px solid #d6dbde', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'12px', transition:'background 0.15s' },
          onMouseEnter: function(e){ if(!loading) e.currentTarget.style.background = '#f9fafb'; },
          onMouseLeave: function(e){ e.currentTarget.style.background = '#fff'; },
        },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 18 18', xmlns:'http://www.w3.org/2000/svg' },
            React.createElement('path', { fill:'#4285F4', d:'M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z' }),
            React.createElement('path', { fill:'#34A853', d:'M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z' }),
            React.createElement('path', { fill:'#FBBC05', d:'M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z' }),
            React.createElement('path', { fill:'#EA4335', d:'M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z' })
          ),
          'Google로 로그인'
        ),
        // Kakao 로그인 버튼
        React.createElement('button', {
          onClick: function(){ handleProvider('kakao'); },
          disabled: loading,
          style:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', background:'#FEE500', color:'rgba(0,0,0,0.85)', border:'1px solid #FEE500', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'12px', transition:'background 0.15s' },
          onMouseEnter: function(e){ if(!loading) e.currentTarget.style.background = '#fdd800'; },
          onMouseLeave: function(e){ e.currentTarget.style.background = '#FEE500'; },
        },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 256 256', xmlns:'http://www.w3.org/2000/svg' },
            React.createElement('path', { fill:'#000000', d:'M128 36C70.562 36 24 72.713 24 118c0 29.279 19.466 54.97 48.748 69.477-1.593 5.494-10.237 35.344-10.581 37.689 0 0-.207 1.762.934 2.434 1.143.673 2.487.154 2.487.154 3.272-.458 37.943-24.811 43.944-29.04 5.844.836 11.884 1.286 18.468 1.286 57.438 0 104-36.713 104-82S185.438 36 128 36' })
          ),
          '카카오로 로그인'
        ),
        // Naver 로그인 버튼
        React.createElement('button', {
          onClick: function(){ handleProvider('naver'); },
          disabled: loading,
          style:{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', background:'#03C75A', color:'#fff', border:'1px solid #03C75A', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'12px', transition:'background 0.15s' },
          onMouseEnter: function(e){ if(!loading) e.currentTarget.style.background = '#02b150'; },
          onMouseLeave: function(e){ e.currentTarget.style.background = '#03C75A'; },
        },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 16 16', xmlns:'http://www.w3.org/2000/svg' },
            React.createElement('path', { fill:'#ffffff', d:'M9.297 8.554L6.653 4.75H4v6.5h2.703V7.446l2.644 3.804H12v-6.5H9.297v3.804z' })
          ),
          '네이버로 로그인'
        ),
        React.createElement('div', { style:{ textAlign:'center', marginTop:'8px' } },
          React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '아직 회원이 아니신가요? '),
          React.createElement('span', { onClick:()=>{ onClose(); onSignup&&onSignup(); }, style:{ fontSize:'13px', color:'#E60012', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', textDecoration:'underline' } }, '회원가입')
        ),
        React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, '로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.')
      )
    )
  );
}

/* ── Signup Page (회원가입 전체 페이지) ─────────── */
function SignupPage({ onBack, onComplete, prefill }) {
  const [step, setStep] = React.useState(1); // 1: 역할선택, 2: 양식작성, 3: 완료
  const [roleType, setRoleType] = React.useState(''); // 'student' | 'parent' | 'teacher'
  const [form, setForm] = React.useState({
    name: (prefill && prefill.name) || '',
    email: (prefill && prefill.email) || '',
    password:'', passwordConfirm:'', school:'', grade:'', phone:'', address:'',
    agree:false, parentPhone:'', studentPhone:'',
  });
  const [msg, setMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = React.useState(false); // signUp 후 세션이 없으면 이메일 인증 대기
  const sb = window.supabase;

  const ROLE_OPTIONS = [
    { key:'student', label:'학생' },
    { key:'parent',  label:'학부모' },
    { key:'teacher', label:'선생님 · 학원 직원' },
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
    if (!form.email.trim()) { setMsg('이메일을 입력해 주세요. (비밀번호 찾기에 사용됩니다)'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setMsg('이메일 형식이 올바르지 않습니다.'); return; }
    if (!form.password) { setMsg('비밀번호를 입력해 주세요.'); return; }
    if (form.password.length < 6) { setMsg('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (form.password !== form.passwordConfirm) { setMsg('비밀번호 확인이 일치하지 않습니다.'); return; }
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
    const emailNorm = form.email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    try {
      if (!sb) { setMsg('네트워크 연결 오류'); setLoading(false); return; }

      // 모든 프로필 필드를 metadata로 전달 → handle_new_user 트리거가
      // SECURITY DEFINER로 students 행 생성 시 한 번에 채움.
      // 이메일 확인 옵션 ON일 때도 RLS 막힘 없이 가입 완성.
      const metadata = {
        name: form.name.trim(),
        role: dbRole,
        phone: form.phone.trim(),
        address: form.address.trim(),
        privacy_agreed: true,
        agreed_at: nowIso,
      };
      if (roleType === 'student') {
        metadata.school = form.school.trim();
        metadata.grade = form.grade.trim();
        metadata.parent_phone = form.parentPhone.trim();
      }

      const { data: signupData, error: signupError } = await sb.auth.signUp({
        email: emailNorm,
        password: form.password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin,
        },
      });
      if (signupError) {
        const m = String(signupError.message || '').toLowerCase();
        if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
          setMsg('이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해 주세요.');
        } else if (m.includes('password')) {
          setMsg('비밀번호 형식 오류: ' + signupError.message);
        } else {
          setMsg('가입 실패: ' + signupError.message);
        }
        setLoading(false); return;
      }
      if (!signupData?.user?.id) {
        setMsg('가입 응답을 받지 못했습니다.'); setLoading(false); return;
      }
      // 세션이 안 왔으면(이메일 확인 옵션 ON) 이메일 인증 링크 안내가 필요
      setNeedsEmailConfirm(!signupData.session);

      // 학생-학부모 자동 연결: 트리거가 만든 students 행 id를 가져와 RPC 호출.
      // 세션이 있을 때만 가능 (이메일 확인 ON이면 RPC가 안전하게 NULL 반환).
      try {
        const { data: myRow } = await sb.from('students')
          .select('id').eq('auth_user_id', signupData.user.id).maybeSingle();
        const insertedId = myRow?.id;
        if (insertedId) {
          if (roleType === 'student') {
            await sb.rpc('link_family_by_phone', {
              my_id: insertedId,
              target_phone: form.parentPhone.trim(),
              my_role: 'student',
            });
          } else if (roleType === 'parent') {
            await sb.rpc('link_family_by_phone', {
              my_id: insertedId,
              target_phone: form.studentPhone.trim(),
              my_role: 'parent',
            });
          }
        }
      } catch (e) { console.warn('가족 자동 연결 실패(무시):', e); }

      // 선생님은 트리거가 is_active=false로 만들어 둠. 즉시 로그아웃.
      if (roleType === 'teacher') {
        try { await sb.auth.signOut(); } catch (e) {}
      }

      setStep(3);
    } catch(e) {
      setMsg('가입 중 오류가 발생했습니다: ' + (e?.message || e));
    }
    setLoading(false);
  }

  // 공통 헤더
  const header = React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:10 } },
    React.createElement('button', { onClick: step === 2 ? ()=>setStep(1) : onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif', padding:'4px 0' } }, '← ' + (step === 2 ? '역할 선택으로' : '로그인으로')),
    React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
    React.createElement('span', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '회원가입')
  );

  // 완료 화면
  if (step === 3) return React.createElement('div', { style:{ minHeight:'100vh', background:'#f8fafc' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'60px 20px', textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'64px', marginBottom:'20px' } }, needsEmailConfirm ? '📧' : '완료'),
      React.createElement('h2', { style:{ fontSize:'24px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, roleType === 'teacher' ? '가입 신청 완료' : (needsEmailConfirm ? '이메일 인증만 남았어요' : '가입 완료!')),
      React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.8', whiteSpace:'pre-line' } },
        (function(){
          var lines = [];
          if (roleType === 'teacher') {
            lines.push('선생님 가입 신청이 접수되었습니다.');
            if (needsEmailConfirm) lines.push('① 가입하신 이메일(' + form.email.trim() + ')로 보낸 인증 링크를 눌러주세요.\n② 관리자 승인이 완료되면 로그인하실 수 있습니다. (승인 시 연락드립니다.)');
            else lines.push('관리자 승인이 완료되면 로그인하실 수 있습니다. (승인 시 연락드립니다.)');
          } else {
            lines.push(form.name + '님, 환영합니다!');
            if (needsEmailConfirm) lines.push('가입하신 이메일(' + form.email.trim() + ')로 인증 링크를 보냈어요.\n메일의 링크를 눌러 인증을 마치면 로그인하실 수 있습니다.\n(메일이 안 보이면 스팸함도 확인해 주세요.)');
            else lines.push('이제 로그인하여 수강하실 수 있습니다.');
          }
          return lines.join('\n');
        })()
      ),
      React.createElement('button', { onClick: onBack, style:{ marginTop:'32px', background:'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding:'14px 36px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그인하러 가기')
    )
  );

  // 역할 선택 (step 1)
  if (step === 1) return React.createElement('div', { style:{ minHeight:'100vh', background:'#f8fafc' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'32px 20px' } },
      React.createElement('h2', { style:{ fontSize:'20px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '어떤 분이세요?'),
      React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'28px' } }, '가입 유형을 선택해 주세요.'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
        ROLE_OPTIONS.map(r =>
          React.createElement('div', { key:r.key, onClick:()=>setRoleType(r.key),
            style:{ background:'#fff', borderRadius:'14px', padding:'22px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', cursor:'pointer', border: roleType===r.key ? '2px solid #E60012' : '2px solid transparent', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', transition:'all 0.15s' } },
            React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, r.label),
            React.createElement('div', { style:{ width:'20px', height:'20px', borderRadius:'50%', border: roleType===r.key ? '6px solid #E60012' : '2px solid rgba(0,0,0,0.25)', transition:'all 0.15s', flexShrink:0 } })
          )
        )
      ),
      React.createElement('button', { onClick:()=>{ if(!roleType){setMsg('유형을 선택해 주세요.');return;} setMsg(''); setStep(2); }, style:{ width:'100%', marginTop:'24px', background: roleType ? '#E60012' : '#ccc', color:'#fff', border:'none', borderRadius:'10px', padding:'15px', fontSize:'15px', fontWeight:'700', cursor: roleType?'pointer':'not-allowed', fontFamily:'Manrope, sans-serif', transition:'background 0.2s' } }, '다음'),
      msg && React.createElement('div', { style:{ fontSize:'13px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginTop:'12px', textAlign:'center' } }, msg)
    )
  );

  // 양식 작성 (step 2)
  return React.createElement('div', { style:{ minHeight:'100vh', background:'#f8fafc' } },
    header,
    React.createElement('div', { style:{ maxWidth:'480px', margin:'0 auto', padding:'32px 20px' } },
      React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'20px' } },
        React.createElement('div', { style:{ marginBottom:'20px', paddingBottom:'16px', borderBottom:'1px solid rgba(0,0,0,0.07)' } },
          React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, ROLE_OPTIONS.find(r=>r.key===roleType)?.label + ' 회원가입'),
          roleType === 'teacher' && React.createElement('div', { style:{ fontSize:'12px', color:'#c87000', fontFamily:'Manrope, sans-serif', marginTop:'4px', fontWeight:'600', lineHeight:'1.6' } }, '차량 기사·행정 직원 등 학원 관계자도 여기서 가입하세요. 관리자 승인 후 이용 가능합니다.')
        ),

        // 소셜 로그인에서 prefill된 경우 안내
        prefill && prefill.email && React.createElement('div', { style:{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px', fontSize:'12px', color:'#0c4a6e', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } },
          React.createElement('div', { style:{ fontWeight:'700', marginBottom:'4px' } }, 'Google 계정 (' + prefill.email + ')'),
          '학원에 등록되지 않은 계정이라 회원가입이 필요해요. 추가 정보를 입력해 주세요.'
        ),

        // 이름 (공통)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '이름 *'),
          React.createElement('input', { value:form.name, onChange:e=>setF('name',e.target.value), placeholder:'홍길동', style:inputS })
        ),

        // 이메일 (공통, 비밀번호 찾기용)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '이메일 * (로그인 ID · 비밀번호 찾기에 사용)'),
          React.createElement('input', { type:'email', name:'email', autoComplete:'email', value:form.email, onChange:e=>setF('email',e.target.value), placeholder:'example@email.com', style:inputS })
        ),

        // 비밀번호 (공통)
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '비밀번호 * (6자 이상)'),
          React.createElement('input', { type:'password', name:'new-password', autoComplete:'new-password', value:form.password, onChange:e=>setF('password',e.target.value), placeholder:'영문/숫자/특수문자 조합 권장', style:inputS })
        ),
        React.createElement('div', { style:fieldS },
          React.createElement('label', { style:labelS }, '비밀번호 확인 *'),
          React.createElement('input', { type:'password', name:'new-password-confirm', autoComplete:'new-password', value:form.passwordConfirm, onChange:e=>setF('passwordConfirm',e.target.value), placeholder:'비밀번호 다시 입력', style:inputS })
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
            React.createElement('div', { style:{ width:'18px', height:'18px', borderRadius:'4px', border: form.agree ? 'none' : '1.5px solid rgba(0,0,0,0.3)', background: form.agree ? '#E60012' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' } },
              form.agree && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
                React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
              )
            ),
            React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color: form.agree ? '#E60012' : 'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', userSelect:'none' } }, '개인정보 수집 및 활용에 동의합니다 *')
          )
        ),

        msg && React.createElement('div', { style:{ fontSize:'13px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginBottom:'12px', background:'#fff5f5', borderRadius:'6px', padding:'8px 12px' } }, msg),

        React.createElement('button', { onClick:handleSubmit, disabled:loading, style:{ width:'100%', background: loading?'#aaa':'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding:'15px', fontSize:'15px', fontWeight:'700', cursor: loading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', transition:'background 0.2s' } },
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

/* ── 학생 녹음 답안 (숙제용) ───────────────────────────────
   어린 학생도 쓸 수 있게 큰 버튼 + 한 번에 한 상태만 노출.
   외부 의존성: window.B2Utils.{isAudioRecordingSupported,uploadAudioBlob,audioPublicUrl,deleteAudio}
   미래에 시놀로지로 옮기더라도 B2Utils 내부만 바꾸면 됨.
*/
function StudentAudioRecorder({ examId, studentId, existingPath, isLocked, onPathChange }) {
  var [path, setPath] = React.useState(existingPath || null);
  var [recording, setRecording] = React.useState(false);
  var [elapsedSec, setElapsedSec] = React.useState(0);
  var [uploading, setUploading] = React.useState(false);
  var [error, setError] = React.useState('');
  var [previewBlob, setPreviewBlob] = React.useState(null);
  var [previewUrl, setPreviewUrl] = React.useState('');
  var mediaRecorderRef = React.useRef(null);
  var streamRef = React.useRef(null);
  var timerRef = React.useRef(null);
  var chunksRef = React.useRef([]);
  var MAX_SEC = 300;

  React.useEffect(function(){ setPath(existingPath || null); }, [existingPath]);
  React.useEffect(function(){
    if (!previewBlob) { setPreviewUrl(''); return; }
    var u = URL.createObjectURL(previewBlob);
    setPreviewUrl(u);
    return function(){ URL.revokeObjectURL(u); };
  }, [previewBlob]);
  React.useEffect(function(){
    return function(){
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(function(t){ t.stop(); });
    };
  }, []);

  function fmtSec(s) { var m = Math.floor(s/60), r = s%60; return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0'); }

  async function startRecord() {
    setError('');
    if (!window.B2Utils || !window.B2Utils.isAudioRecordingSupported()) { setError('이 브라우저는 녹음 기능을 지원하지 않아요. 다른 브라우저(크롬·사파리 최신 버전)에서 다시 시도해 주세요.'); return; }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      streamRef.current = stream;
      var mr;
      try { mr = new MediaRecorder(stream); }
      catch (e) { setError('녹음을 시작할 수 없어요. 마이크가 연결되었는지 확인해 주세요.'); stream.getTracks().forEach(function(t){ t.stop(); }); return; }
      chunksRef.current = [];
      mr.ondataavailable = function(e){ if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = function(){
        var blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setPreviewBlob(blob);
        setRecording(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(function(t){ t.stop(); }); streamRef.current = null; }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setElapsedSec(0);
      var startTs = Date.now();
      timerRef.current = setInterval(function(){
        var sec = Math.floor((Date.now() - startTs) / 1000);
        setElapsedSec(sec);
        if (sec >= MAX_SEC) { try { mr.stop(); } catch(e) {} }
      }, 200);
    } catch (e) {
      setError('마이크 사용 권한이 필요해요. 브라우저 주소창의 자물쇠 아이콘을 눌러 마이크를 허용해 주세요.');
    }
  }

  function stopRecord() {
    var mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') { try { mr.stop(); } catch(e) {} }
  }

  async function submit() {
    if (!previewBlob) return;
    setUploading(true); setError('');
    try {
      if (path) { try { await window.B2Utils.deleteAudio(path); } catch(e) {} }
      var res = await window.B2Utils.uploadAudioBlob(previewBlob, examId, studentId);
      if (res.error) throw res.error;
      setPath(res.path);
      setPreviewBlob(null);
      if (onPathChange) onPathChange(res.path);
    } catch (e) {
      setError('업로드 실패: ' + (e.message || e));
    } finally {
      setUploading(false);
    }
  }

  async function deleteAndRedo() {
    if (!confirm('이전 녹음을 지우고 새로 녹음할까요?')) return;
    if (path) { try { await window.B2Utils.deleteAudio(path); } catch(e) {} }
    setPath(null); setPreviewBlob(null); setElapsedSec(0); setError('');
    if (onPathChange) onPathChange(null);
  }
  function discardPreview() { setPreviewBlob(null); setElapsedSec(0); }

  var remainingSec = MAX_SEC - elapsedSec;
  var timeColor = remainingSec <= 10 ? '#dc2626' : (remainingSec <= 30 ? '#f59e0b' : '#1A1A1A');

  return React.createElement('div', { style:{ background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:'12px', padding:'18px', marginTop:'16px' } },
    React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#92400e', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, '녹음 답안 (최대 5분)'),

    error && React.createElement('div', { style:{ background:'#fee2e2', color:'#991b1b', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, error),

    !isLocked && !recording && !previewBlob && !path && React.createElement('button', {
      onClick: startRecord,
      style:{ width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'12px', padding:'18px', fontSize:'17px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', minHeight:'56px' }
    }, '녹음 시작'),

    !isLocked && recording && React.createElement('div', { style:{ textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'42px', fontWeight:'800', color: timeColor, fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, fmtSec(elapsedSec) + ' / 05:00'),
      React.createElement('div', { style:{ fontSize:'13px', color:'#dc2626', marginBottom:'14px', fontFamily:'Manrope, sans-serif', fontWeight:'700' } }, '녹음 중...'),
      React.createElement('button', {
        onClick: stopRecord,
        style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'12px', padding:'16px', fontSize:'16px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', minHeight:'56px' }
      }, '정지')
    ),

    !isLocked && previewBlob && React.createElement('div', null,
      React.createElement('div', { style:{ fontSize:'13px', color:'#92400e', marginBottom:'10px', fontFamily:'Manrope, sans-serif', fontWeight:'700' } }, '들어보고 제출하거나, 다시 녹음할 수 있어요.'),
      previewUrl && React.createElement('audio', { controls:true, src: previewUrl, style:{ width:'100%', marginBottom:'12px' } }),
      React.createElement('div', { style:{ display:'flex', gap:'8px' } },
        React.createElement('button', { onClick:discardPreview, disabled:uploading, style:{ flex:1, background:'#fff', color:'#92400e', border:'2px solid #f59e0b', borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:'800', cursor: uploading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', minHeight:'52px' } }, '↺ 다시 녹음'),
        React.createElement('button', { onClick:submit, disabled:uploading, style:{ flex:1, background: uploading ? '#9ca3af' : '#16a34a', color:'#fff', border:'none', borderRadius:'10px', padding:'14px', fontSize:'14px', fontWeight:'800', cursor: uploading?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', minHeight:'52px' } }, uploading ? '업로드 중...' : '✓ 이 녹음 제출')
      )
    ),

    isLocked && path && React.createElement('div', null,
      React.createElement('div', { style:{ fontSize:'13px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '제출된 녹음입니다.'),
      React.createElement('audio', { controls:true, src: window.B2Utils.audioPublicUrl(path), style:{ width:'100%' } })
    ),

    !isLocked && path && !previewBlob && React.createElement('div', null,
      React.createElement('div', { style:{ fontSize:'13px', color:'#16a34a', fontWeight:'800', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '✓ 녹음 제출 완료'),
      React.createElement('audio', { controls:true, src: window.B2Utils.audioPublicUrl(path), style:{ width:'100%', marginBottom:'12px' } }),
      React.createElement('button', { onClick:deleteAndRedo, style:{ width:'100%', background:'#fff', color:'#dc2626', border:'2px solid #dc2626', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', minHeight:'52px' } }, '🗑 녹음 삭제하고 다시')
    )
  );
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
  var [videoAttachments, setVideoAttachments] = React.useState([]);

  // 이 영상에 첨부된 파일 로드
  React.useEffect(function() {
    if (!lecture || !lecture.id) return;
    var sb = window.supabase;
    if (!sb) return;
    var cancelled = false;
    sb.from('attachments').select('*').eq('video_id', lecture.id).order('created_at', { ascending:true })
      .then(function(res) {
        if (!cancelled) setVideoAttachments(res.data || []);
      });
    return function() { cancelled = true; };
  }, [lecture && lecture.id]);

  function videoAttachmentUrl(path) {
    var sb = window.supabase;
    if (!sb || !path) return '';
    var d = sb.storage.from('attachments').getPublicUrl(path);
    return (d && d.data && d.data.publicUrl) || '';
  }
  function fmtBytes(n) {
    var v = Number(n) || 0;
    if (v < 1024) return v + ' B';
    if (v < 1024*1024) return (v/1024).toFixed(1) + ' KB';
    return (v/1024/1024).toFixed(1) + ' MB';
  }

  var storageKey = 'lec_progress_' + lecture.id;
  var progress = duration > 0 ? Math.min((currentSec / duration) * 100, 100) : 0;
  var speeds = [1, 1.2, 1.5, 1.8, 2];
  var color = SUBJECT_COLORS[course.subject] || '#E60012';
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

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '\u2190 강의 목록으로'),
      React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
      React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, lecture.title)
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'20px 16px' } },
      React.createElement('div', {
        style:{ position:'relative', width:'100%', aspectRatio:'16/9', borderRadius:'12px', overflow:'hidden', background:'#1A1A1A', marginBottom:'12px', cursor:'pointer' },
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
              return React.createElement('button', { key:s, onTouchEnd:function(e){e.stopPropagation();setSpeed(s);if(playing)showThenHide();}, onClick:function(e){e.stopPropagation();setSpeed(s);if(playing)showThenHide();}, style:{ background:speed===s?'#fff':'rgba(0,0,0,0.5)', border:'none', borderRadius:'4px', padding:'5px 9px', fontSize:'12px', fontWeight:'700', color:speed===s?'#1A1A1A':'#fff', cursor:'pointer', fontFamily:'Manrope, sans-serif', WebkitTapHighlightColor:'transparent' } }, s===1?'1x':s+'x');
            })
          ),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 } },
            React.createElement('button', {
              onTouchEnd: function(e) { e.stopPropagation(); togglePlay(); },
              onClick: function(e) { e.stopPropagation(); togglePlay(); showThenHide(); },
              style:{ width:'68px', height:'68px', borderRadius:'50%', background:playing?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.92)', border:'2px solid rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }
            },
              React.createElement('span', { style:{ fontSize:'28px', marginLeft:playing?0:'4px', color:playing?'#fff':'#1A1A1A', lineHeight:1 } }, playing?'\u275a\u275a':'\u25b6')
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
        React.createElement('div', { style:{ flex:1, height:'6px', background:'#f8fafc', borderRadius:'3px', overflow:'hidden' } },
          React.createElement('div', { style:{ height:'100%', background:color, borderRadius:'3px', width:progress+'%', transition:'width 0.3s ease' } })
        ),
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:color, fontFamily:'Manrope, sans-serif', flexShrink:0 } }, Math.round(progress)+'%')
      ),
      // \uac15\uc758 \ucca8\ubd80 \uc790\ub8cc
      videoAttachments.length > 0 && React.createElement('div', { style:{ background:'#fff', borderRadius:'8px', padding:'14px 16px', marginTop:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14)' } },
        React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'rgba(0,0,0,0.7)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '\ud83d\udcce \uac15\uc758 \uc790\ub8cc'),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
          videoAttachments.map(function(att) {
            return React.createElement('a', {
              key: att.id,
              href: videoAttachmentUrl(att.file_path),
              target: '_blank',
              rel: 'noopener',
              download: att.file_name || true,
              style:{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#f8fafc', textDecoration:'none', color:'inherit' },
            },
              React.createElement('span', { style:{ fontSize:'18px', flexShrink:0 } }, '\ud83d\udcc4'),
              React.createElement('div', { style:{ flex:1, minWidth:0 } },
                React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, att.title || att.file_name),
                att.description ? React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, att.description) : null,
                React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, [att.file_name, fmtBytes(att.file_size)].filter(Boolean).join(' \u00b7 '))
              ),
              React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', flexShrink:0 } }, '\u2b07 \ub2e4\uc6b4\ub85c\ub4dc')
            );
          })
        )
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
        var color = SUBJECT_COLORS[sub] || '#E60012';
        return React.createElement('div', {
          key: sub,
          onClick: function() { onSelect(sub); },
          style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
          onMouseEnter: function(e) { e.currentTarget.style.transform='translateX(3px)'; },
          onMouseLeave: function(e) { e.currentTarget.style.transform='translateX(0)'; },
        },
          React.createElement('div', { style:{ width:'6px', alignSelf:'stretch', background: color, flexShrink:0 } }),
          React.createElement('div', { style:{ flex:1, padding:'18px 16px', display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap' } },
            React.createElement('span', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, sub),
            React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '강좌 ' + count + '개')
          ),
          React.createElement('div', { style:{ padding:'0 20px', fontSize:'22px', color:'rgba(0,0,0,0.2)' } }, '›')
        );
      })
    )
  );
}

/* ── Course List (강좌 선택) ──────────────────── */
function CourseList({ subject, courses, studentGrade, enrolledIds, onSelectCourse, onBack }) {
  var subjectCourses = courses.filter(function(c) { return c.subject === subject && enrolledIds.includes(c.id); });
  var color = SUBJECT_COLORS[subject] || '#E60012';

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'60vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '\u2190 과목 선택으로')
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
                  React.createElement('div', { style:{ width:'40px', height:'4px', background:'#f8fafc', borderRadius:'2px', overflow:'hidden' } },
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
  var color = SUBJECT_COLORS[course.subject] || '#E60012';
  var lectures = course.lectures || [];

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'60vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '\u2190 강좌 목록으로'),
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
                  React.createElement('div', { style:{ width:'36px', height:'3px', background:'#f8fafc', borderRadius:'2px', overflow:'hidden' } },
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
  var [portalView, setPortalView] = React.useState('main'); // 'main' | 'mypage' | 'exam'
  var [profileDraft, setProfileDraft] = React.useState(null);
  var [savingProfile, setSavingProfile] = React.useState(false);
  var [pwDraft, setPwDraft] = React.useState({ current:'', next:'', confirm:'' });
  // 시험 응시
  var [availableExams, setAvailableExams] = React.useState([]);
  var [mySubmissions, setMySubmissions] = React.useState({}); // { exam_id: submission }
  var [activeExam, setActiveExam] = React.useState(null);
  var [examAnswers, setExamAnswers] = React.useState({}); // { qNum: answer }
  var [examTextAnswer, setExamTextAnswer] = React.useState(''); // legacy 단일 서술형
  var [examTextAnswers, setExamTextAnswers] = React.useState({}); // { qNum: text } 다중 서술형
  var [examAudioPath, setExamAudioPath] = React.useState(null); // 숙제 녹음 답안 path
  // ── 학부모 view ──
  var [parentChildren, setParentChildren] = React.useState([]);
  var [parentSelectedChildId, setParentSelectedChildId] = React.useState(null);
  var [parentChildExams, setParentChildExams] = React.useState([]); // [{ exam, submission }]
  var [parentChildVideos, setParentChildVideos] = React.useState([]); // [{ video, view }]
  var [parentLoading, setParentLoading] = React.useState(false);
  var [parentTab, setParentTab] = React.useState('test'); // 'test' | 'homework' | 'video'
  var [examSubmitting, setExamSubmitting] = React.useState(false);
  var [examImgIdx, setExamImgIdx] = React.useState(0);
  var [examTimeLeft, setExamTimeLeft] = React.useState(null); // 남은 초
  var autoSubmitDoneRef = React.useRef(false);
  // 강의실 진입 모드 (학생 전용): 'home' | 'video' | 'test'
  var [studentMode, setStudentMode] = React.useState('home');
  // 반응형 (PC vs 모바일)
  var portalIsMobile = window.B2Utils.useIsMobile();
  // PC 답안지 팝업 최소화 토글
  var [answerPanelOpen, setAnswerPanelOpen] = React.useState(true);
  // 결과 페이지 표시
  var [resultExam, setResultExam] = React.useState(null);
  var [resultSub, setResultSub] = React.useState(null);

  function viewExamResult(exam) {
    var sub = mySubmissions[exam.id];
    if (!sub) { alert('답안 정보가 없습니다.'); return; }
    setResultExam(exam);
    setResultSub(sub);
  }
  function closeExamResult() {
    setResultExam(null);
    setResultSub(null);
  }
  // 모바일 답안지 시트 모드: 'small' | 'large' | 'closed'
  var [sheetMode, setSheetMode] = React.useState('small');

  // 레벨테스트 관련 state
  var [levelTests, setLevelTests] = React.useState([]);
  var [myLevelRequests, setMyLevelRequests] = React.useState({}); // { exam_id: request }
  // 레벨테스트 신청 폼
  var [ltApplyOpen, setLtApplyOpen] = React.useState(false);
  var [ltApplyDraft, setLtApplyDraft] = React.useState({ school_level:'중', grade:'', semester:'', score:'' });
  var [ltApplySubmitting, setLtApplySubmitting] = React.useState(false);

  React.useEffect(function(){
    if (!user) { setAvailableExams([]); setMySubmissions({}); setLevelTests([]); setMyLevelRequests({}); return; }
    (async function(){
      var sb = window.supabase;
      try {
        // 반 단위 테스트 (반 시험 + 선생님 발행 주간/월말/숙제/레벨 — 반에 직접 배포된 것)
        var classExams = [];
        if (user.classIds && user.classIds.length > 0) {
          var { data: ce } = await sb.from('exams').select('*').in('kind', ['class','weekly','monthly','homework','level']).in('class_id', user.classIds).eq('status', 'open').order('created_at', { ascending: false });
          classExams = ce || [];
        }
        // 학원 전체 발행 (관리자가 class_id 없이 발행한 주간/월말/숙제 모두 응시 가능)
        var { data: globalExams } = await sb.from('exams').select('*').in('kind', ['weekly','monthly','homework']).is('class_id', null).eq('status', 'open').order('created_at', { ascending: false });
        var combinedClassExams = classExams.concat(globalExams || []);
        setAvailableExams(combinedClassExams);
        // 레벨테스트 신청용 — 관리자가 반 없이 발행한 것만 (반에 배포된 레벨테스트는 위 classExams로 바로 응시)
        var { data: lt } = await sb.from('exams').select('*').eq('kind','level').is('class_id', null).eq('status', 'open').order('created_at', { ascending: false });
        setLevelTests(lt || []);
        // 본인 신청·답안
        var allIds = combinedClassExams.map(function(e){ return e.id; }).concat((lt || []).map(function(e){ return e.id; }));
        if (allIds.length > 0) {
          var { data: subs } = await sb.from('exam_submissions').select('*').eq('student_id', user.id).in('exam_id', allIds);
          var map = {};
          (subs || []).forEach(function(s){ map[s.exam_id] = s; });
          setMySubmissions(map);
        } else {
          setMySubmissions({});
        }
        // 레벨테스트 신청 내역
        var { data: reqs } = await sb.from('level_test_requests').select('*').eq('student_id', user.id);
        var rmap = {};
        (reqs || []).forEach(function(r){ rmap[r.exam_id] = r; });
        setMyLevelRequests(rmap);

        // 레벨테스트 페이지에서 넘어온 자동 응시 (sessionStorage)
        try {
          var autoId = sessionStorage.getItem('b2_auto_exam_id');
          if (autoId) {
            sessionStorage.removeItem('b2_auto_exam_id');
            var found = (lt || []).find(function(e){ return e.id === autoId; }) || classExams.find(function(e){ return e.id === autoId; });
            if (found) {
              // 직접 응시 화면 진입 (openExam의 myLevelRequests stale closure 회피)
              var existing = null;
              try {
                var subRow = await sb.from('exam_submissions').select('*').eq('exam_id', found.id).eq('student_id', user.id).maybeSingle();
                existing = subRow.data || null;
              } catch (e) {}
              setActiveExam(found);
              setExamAnswers(existing && existing.answers ? existing.answers : {});
              var ta = existing && existing.text_answers && typeof existing.text_answers === 'object' ? existing.text_answers : {};
              if ((!ta || Object.keys(ta).length === 0) && existing && existing.text_answer) ta = { '1': existing.text_answer };
              setExamTextAnswers(ta);
              setExamTextAnswer(existing && existing.text_answer ? existing.text_answer : '');
              setExamAudioPath(existing && existing.audio_path ? existing.audio_path : null);
              setExamImgIdx(0);
              autoSubmitDoneRef.current = false;
              setPortalView('exam');
            }
          }
        } catch (e) {}
      } catch (e) { console.error('시험 로드 실패:', e); }
    })();
  }, [user, portalView, studentMode]);

  // ── 모바일 뒤로가기 처리: PWA 종료 대신 portal 내부 단계 복귀 ──
  // index.html에 page 레벨 popstate 핸들러가 이미 있음. capture phase로 가로채서
  // portal 내부의 깊은 화면(응시 / 학부모 자녀 상세 / 강의실 모드)에서는 한 단계만 복귀시키고,
  // 이미 강의실 홈이면 통과시켜 page='home'으로 자연스럽게 이동.
  React.useEffect(function(){
    if (typeof window === 'undefined') return;
    function onPop(e) {
      if (portalView === 'exam') {
        e.stopImmediatePropagation();
        closeExam();
        try { window.history.pushState({ page:'portal', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      if (parentSelectedChildId) {
        e.stopImmediatePropagation();
        setParentSelectedChildId(null);
        try { window.history.pushState({ page:'portal', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      if (studentMode !== 'home') {
        e.stopImmediatePropagation();
        setStudentMode('home');
        setSelectedSubject(null);
        try { window.history.pushState({ page:'portal', b2Inner:true }, ''); } catch (err) {}
        return;
      }
      // 강의실 홈이면 통과 → index.html 핸들러가 page='home'으로 복귀
    }
    window.addEventListener('popstate', onPop, true); // capture phase
    return function(){ window.removeEventListener('popstate', onPop, true); };
  }, [portalView, studentMode, parentSelectedChildId]);

  // 깊은 화면 진입 시 history에 한 단계 push (뒤로가기가 popstate를 유발하도록)
  React.useEffect(function(){
    if (typeof window === 'undefined') return;
    var deep = (portalView === 'exam') || !!parentSelectedChildId || (studentMode !== 'home' && studentMode != null);
    if (!deep) return;
    var st = window.history.state || {};
    if (!st.b2Inner) {
      try { window.history.pushState({ page:'portal', b2Inner:true }, ''); } catch (err) {}
    }
  }, [studentMode, portalView, parentSelectedChildId]);

  // ── 학부모: 자녀 목록 로드 ──
  React.useEffect(function(){
    if (!user || user.role !== 'parent') { setParentChildren([]); return; }
    (async function(){
      var sb = window.supabase;
      try {
        var { data } = await sb.from('students').select('*').eq('parent_id', user.id).eq('role', 'student');
        setParentChildren(data || []);
      } catch (e) { console.error('자녀 목록 로드 실패:', e); }
    })();
  }, [user]);

  // ── 학부모: 선택한 자녀의 시험·숙제·영상 시청 데이터 로드 ──
  React.useEffect(function(){
    if (!parentSelectedChildId) { setParentChildExams([]); setParentChildVideos([]); return; }
    (async function(){
      setParentLoading(true);
      var sb = window.supabase;
      try {
        // 시험·숙제 (자녀 ID로 모든 submission)
        var { data: subs } = await sb.from('exam_submissions').select('*').eq('student_id', parentSelectedChildId).order('submitted_at', { ascending:false });
        var examIds = Array.from(new Set((subs || []).map(function(s){ return s.exam_id; }).filter(Boolean)));
        var exams = [];
        if (examIds.length > 0) {
          var { data: ex } = await sb.from('exams').select('*').in('id', examIds);
          exams = ex || [];
        }
        var combined = (subs || []).map(function(s){
          return { submission: s, exam: exams.find(function(e){ return e.id === s.exam_id; }) || null };
        }).filter(function(x){ return x.exam; });
        setParentChildExams(combined);

        // 영상 시청
        var { data: vv } = await sb.from('video_views').select('*').eq('student_id', parentSelectedChildId).order('updated_at', { ascending:false });
        var videoIds = Array.from(new Set((vv || []).map(function(v){ return v.video_id; }).filter(Boolean)));
        var videos = [];
        if (videoIds.length > 0) {
          var { data: vs } = await sb.from('videos').select('*').in('id', videoIds);
          videos = vs || [];
        }
        var combinedVids = (vv || []).map(function(v){
          return { view: v, video: videos.find(function(vid){ return vid.id === v.video_id; }) || null };
        }).filter(function(x){ return x.video; });
        setParentChildVideos(combinedVids);
      } catch (e) { console.error('자녀 데이터 로드 실패:', e); }
      finally { setParentLoading(false); }
    })();
  }, [parentSelectedChildId]);

  function openLtApplyForm() {
    if (!user) {
      alert('로그인 후 신청할 수 있습니다.');
      if (onLoginClick) onLoginClick();
      return;
    }
    setLtApplyDraft({ school_level:'중', grade:'', semester:'', score:'' });
    setLtApplyOpen(true);
  }
  function closeLtApplyForm() { setLtApplyOpen(false); }

  function pickMatchingLevelTest(school_level, grade, semester, score) {
    // 학교급 + 학년 + 학기(둘 중 하나라도 NULL이면 무관) + 점수 범위 매칭
    var matched = levelTests.filter(function(ex){
      if (ex.school_level && ex.school_level !== school_level) return false;
      if (ex.target_grade && String(ex.target_grade) !== String(grade)) return false;
      // 학기는 양쪽 모두 값이 있을 때만 비교 (없으면 무관)
      if (ex.target_semester && semester && String(ex.target_semester) !== String(semester)) return false;
      if (ex.min_score != null && score < ex.min_score) return false;
      if (ex.max_score != null && score > ex.max_score) return false;
      return true;
    });
    if (matched.length === 0) return null;
    // 학기까지 일치하는 시험을 우선
    var bothMatch = matched.filter(function(ex){ return ex.target_semester && semester && String(ex.target_semester) === String(semester); });
    return (bothMatch.length > 0 ? bothMatch[0] : matched[0]);
  }

  async function submitLevelTestApply() {
    if (!user) return;
    var d = ltApplyDraft;
    if (!d.school_level) { alert('학교급을 선택해 주세요.'); return; }
    if (!d.grade) { alert('학년을 선택해 주세요.'); return; }
    var sc = parseInt(d.score, 10);
    if (isNaN(sc) || sc < 0 || sc > 100) { alert('내신 점수를 0~100 사이로 입력해 주세요.'); return; }
    var matched = pickMatchingLevelTest(d.school_level, d.grade, d.semester, sc);
    if (!matched) {
      alert('입력하신 정보에 맞는 레벨테스트가 없습니다.\n관리자에게 문의해 주세요.');
      return;
    }
    setLtApplySubmitting(true);
    var sb = window.supabase;
    try {
      var { error } = await sb.from('level_test_requests').insert({
        exam_id: matched.id,
        student_id: user.id,
        student_name: user.name || '',
        school_level: d.school_level,
        grade: d.grade,
        semester: d.semester || null,
        score: sc,
      });
      if (error && !String(error.message||'').includes('duplicate')) throw error;
      var { data: reqs } = await sb.from('level_test_requests').select('*').eq('student_id', user.id);
      var rmap = {};
      (reqs || []).forEach(function(r){ rmap[r.exam_id] = r; });
      setMyLevelRequests(rmap);
      closeLtApplyForm();
      alert('"' + matched.title + '" 시험으로 매칭되었습니다. 준비되면 응시하세요.');
    } catch (e) {
      alert('신청 실패: ' + (e.message || e));
    } finally {
      setLtApplySubmitting(false);
    }
  }
  async function cancelLevelTestRequest(exam) {
    if (!confirm('이 레벨테스트 신청을 취소하시겠습니까?')) return;
    var sb = window.supabase;
    try {
      await sb.from('level_test_requests').delete().eq('exam_id', exam.id).eq('student_id', user.id);
      var rmap = Object.assign({}, myLevelRequests);
      delete rmap[exam.id];
      setMyLevelRequests(rmap);
    } catch (e) { alert('취소 실패: ' + (e.message || e)); }
  }

  function examPublicUrl(path) {
    if (!path) return '';
    var sb = window.supabase;
    var { data } = sb.storage.from('attachments').getPublicUrl(path);
    return data?.publicUrl || '';
  }
  function openExam(exam) {
    if (!user) {
      alert('로그인 후 이용할 수 있습니다.');
      if (onLoginClick) onLoginClick();
      return;
    }
    if (exam.kind === 'level' && !exam.class_id && !myLevelRequests[exam.id]) {
      alert('레벨테스트는 신청 후 응시할 수 있습니다.');
      return;
    }
    setActiveExam(exam);
    var existing = mySubmissions[exam.id];
    setExamAnswers(existing && existing.answers ? existing.answers : {});
    var ta = existing && existing.text_answers && typeof existing.text_answers === 'object' ? existing.text_answers : {};
    if ((!ta || Object.keys(ta).length === 0) && existing && existing.text_answer) {
      ta = { '1': existing.text_answer };
    }
    setExamTextAnswers(ta);
    setExamTextAnswer(existing && existing.text_answer ? existing.text_answer : '');
    setExamAudioPath(existing && existing.audio_path ? existing.audio_path : null);
    setExamImgIdx(0);
    autoSubmitDoneRef.current = false;
    setPortalView('exam');
  }
  function closeExam() {
    var wasLevelTest = !!(activeExam && activeExam.kind === 'level' && !activeExam.class_id);
    setActiveExam(null);
    setExamAnswers({});
    setExamTextAnswer('');
    setExamTextAnswers({});
    setExamAudioPath(null);
    setExamTimeLeft(null);
    autoSubmitDoneRef.current = false;
    setPortalView('main');
    // 레벨테스트는 강의실에 머물지 않고 레벨테스트 신청 페이지로 복귀
    try {
      var rt = sessionStorage.getItem('b2_return_to_leveltest');
      if (rt && wasLevelTest) {
        sessionStorage.removeItem('b2_return_to_leveltest');
        if (typeof window.location !== 'undefined') {
          // App의 navigate를 직접 호출할 수 없으므로 hash 기반 라우팅이 없는 경우 reload-style 처리
          // 가장 안전: window.b2Navigate가 있으면 호출, 없으면 setPortalView('main') 후 setPage('leveltest') 처리는 부모에서
          if (typeof window.b2Navigate === 'function') window.b2Navigate('leveltest');
        }
      }
    } catch (e) {}
  }
  async function startExamSession() {
    if (!user || !activeExam) return;
    if (activeExam.kind === 'level' && !activeExam.class_id && !myLevelRequests[activeExam.id]) {
      alert('레벨테스트는 신청 후 응시할 수 있습니다.');
      closeExam();
      return;
    }
    var sb = window.supabase;
    try {
      var nowIso = new Date().toISOString();
      var row = {
        exam_id: activeExam.id,
        student_id: user.id,
        student_name: user.name || '',
        answers: {},
        text_answer: null,
        started_at: nowIso,
        submitted_at: nowIso,
        updated_at: nowIso,
        locked: false,
      };
      var { data, error } = await sb.from('exam_submissions').insert(row).select().single();
      if (error) throw error;
      setMySubmissions(function(p){ var n = Object.assign({}, p); n[activeExam.id] = data; return n; });
    } catch (e) {
      alert('응시 시작 실패: ' + (e.message || e));
    }
  }
  async function autoSubmitDueToTimeout() {
    if (!user || !activeExam) return;
    if (autoSubmitDoneRef.current) return;
    autoSubmitDoneRef.current = true;
    var sb = window.supabase;
    try {
      var existing = mySubmissions[activeExam.id];
      if (!existing) return;
      var firstText2 = examTextAnswers['1'] || examTextAnswer || null;
      var row = {
        answers: examAnswers || {},
        text_answers: examTextAnswers || {},
        text_answer: firstText2,
        updated_at: new Date().toISOString(),
        locked: true,
      };
      await sb.from('exam_submissions').update(row).eq('id', existing.id);
      setMySubmissions(function(p){ var n = Object.assign({}, p); n[activeExam.id] = Object.assign({}, existing, row); return n; });
      alert('시간이 종료되어 자동 제출되었습니다.');
    } catch (e) { console.error('자동 제출 실패:', e); }
  }

  // 카운트다운 타이머
  React.useEffect(function(){
    if (portalView !== 'exam' || !activeExam || !activeExam.time_limit_minutes) {
      setExamTimeLeft(null);
      return;
    }
    var sub = activeExam ? mySubmissions[activeExam.id] : null;
    if (!sub || !sub.started_at) { setExamTimeLeft(null); return; }
    if (sub.locked) { setExamTimeLeft(0); return; }
    var endMs = new Date(sub.started_at).getTime() + activeExam.time_limit_minutes * 60 * 1000;
    function tick() {
      var remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setExamTimeLeft(remaining);
      if (remaining === 0 && !autoSubmitDoneRef.current) {
        autoSubmitDueToTimeout();
      }
    }
    tick();
    var iv = setInterval(tick, 1000);
    return function(){ clearInterval(iv); };
  }, [portalView, activeExam, mySubmissions, examAnswers, examTextAnswer]);

  function formatTimeLeft(secs) {
    if (secs == null) return '';
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }
  async function submitExamAnswer() {
    if (!user || !activeExam) return;
    if (activeExam.kind === 'level' && !activeExam.class_id && !myLevelRequests[activeExam.id]) {
      alert('레벨테스트는 신청 후 응시할 수 있습니다.');
      closeExam();
      return;
    }
    var existing = mySubmissions[activeExam.id];
    if (existing && existing.locked) { alert('시간이 종료되어 답안을 수정할 수 없습니다.'); return; }
    setExamSubmitting(true);
    var sb = window.supabase;
    try {
      var nowIso = new Date().toISOString();
      var firstText = examTextAnswers['1'] || examTextAnswer || null;
      // 객관식 자동 채점
      var ak = (activeExam.answer_key && typeof activeExam.answer_key === 'object') ? activeExam.answer_key : {};
      var qc = activeExam.question_count || 0;
      var hasAnswerKey = Object.keys(ak).length > 0;
      var objScore = null, objTotal = null;
      if (qc > 0 && hasAnswerKey) {
        var correct = 0;
        for (var i = 1; i <= qc; i++) {
          if (ak[i] != null && String(examAnswers[i] || '') === String(ak[i])) correct++;
        }
        objScore = correct;
        objTotal = qc;
      }
      var row;
      if (existing) {
        row = {
          answers: examAnswers || {},
          text_answers: examTextAnswers || {},
          text_answer: firstText,
          audio_path: examAudioPath,
          objective_score: objScore,
          objective_total: objTotal,
          updated_at: nowIso,
        };
        var { error } = await sb.from('exam_submissions').update(row).eq('id', existing.id);
        if (error) throw error;
      } else {
        row = {
          exam_id: activeExam.id,
          student_id: user.id,
          student_name: user.name || '',
          answers: examAnswers || {},
          text_answers: examTextAnswers || {},
          text_answer: firstText,
          audio_path: examAudioPath,
          objective_score: objScore,
          objective_total: objTotal,
          submitted_at: nowIso,
          updated_at: nowIso,
        };
        var { error: e2 } = await sb.from('exam_submissions').insert(row);
        if (e2) throw e2;
      }
      // 다시 로드
      var { data: subs } = await sb.from('exam_submissions').select('*').eq('student_id', user.id).eq('exam_id', activeExam.id);
      var map = Object.assign({}, mySubmissions);
      (subs || []).forEach(function(s){ map[s.exam_id] = s; });
      setMySubmissions(map);
      // 객관식 자동채점이 끝났으면 성적(test_scores)에도 반영 (서술형 있으면 선생님 채점 후 반영됨)
      try { if (subs && subs[0] && subs[0].id) window.B2Utils.syncExamScore(activeExam.id, subs[0].id); } catch (e) {}
      alert(existing ? '답안이 수정되었습니다.' : '답안이 제출되었습니다.');
      closeExam();
    } catch (e) {
      alert('제출 실패: ' + (e.message || e));
    } finally {
      setExamSubmitting(false);
    }
  }

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
    window.B2Utils.clearAuthStorage();
    window.location.href = '/';
  }
  async function changePassword() {
    if (!user) return;
    if (!pwDraft.current || !pwDraft.next) { alert('현재 비밀번호와 새 비밀번호를 입력해 주세요.'); return; }
    if (pwDraft.next !== pwDraft.confirm) { alert('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    if (pwDraft.next.length < 6) { alert('새 비밀번호는 6자 이상이어야 합니다.'); return; }
    if (!user.email) { alert('이메일 정보를 찾을 수 없습니다.'); return; }
    var sb = window.supabase;
    // 현재 비밀번호 검증 — 같은 이메일로 재로그인 시도
    var verify = await sb.auth.signInWithPassword({ email: user.email, password: pwDraft.current });
    if (verify.error) { alert('현재 비밀번호가 맞지 않습니다.'); return; }
    var upd = await sb.auth.updateUser({ password: pwDraft.next });
    if (upd.error) { alert('변경 실패: ' + upd.error.message); return; }
    alert('비밀번호가 변경되었습니다.');
    setPwDraft({ current:'', next:'', confirm:'' });
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
                    .filter(function(c){
                      if (c.level !== user.level) return false;
                      // c.grade 는 '고1' 한 개 또는 '고1,고2' 처럼 콤마로 여러 개일 수 있음
                      return String(c.grade||'').split(',').map(function(s){ return s.trim(); }).indexOf(user.grade) >= 0;
                    })
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
    return React.createElement('div', { style:{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px', background:'#f8fafc', padding:'40px' } },
      React.createElement('div', { style:{ width:'72px', height:'72px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' } }, '\uD83C\uDF93'),
      React.createElement('h2', { style:{ fontSize:'28px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, '로그인이 필요합니다'),
      React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', textAlign:'center', lineHeight:'1.7' } }, '수강 중인 강의를 보려면 로그인해 주세요.\nGoogle 또는 카카오톡으로 간편하게 로그인할 수 있습니다.'),
      React.createElement('button', { onClick:onLoginClick, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'14px 32px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
        onMouseDown:function(e){e.currentTarget.style.transform='scale(0.95)';}, onMouseUp:function(e){e.currentTarget.style.transform='scale(1)';} }, '로그인하기')
    );
  }

  // 상단 헤더 공통
  function renderHeader(small) {
    return React.createElement('div', { style:{ background: isTeacherMode ? '#3A3A3A' : '#1A1A1A', padding: small ? '20px 16px' : '28px 16px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap: small ? '10px' : '16px' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize: small?'16px':'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, (user.name || '회원') + '님' + (small ? '' : ', 안녕하세요!')),
            isTeacherMode && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.65)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, '내가 등록한 강의 보기')
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
          !adminMode && !isTeacherMode && React.createElement('button', { onClick:function(){ setPortalView('mypage'); setProfileDraft(null); }, style:{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 12px':'8px 16px', fontSize: small?'12px':'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '👤 마이페이지'),
          isTeacherMode && React.createElement('div', { style:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding: small?'5px 14px':'8px 20px' } },
            React.createElement('span', { style:{ fontSize: small?'12px':'14px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '선생님')
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
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement('div', { style:{ maxWidth:'640px', margin:'0 auto', padding:'24px 16px' } },
        React.createElement('button', { onClick:function(){ setPortalView('main'); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '← 홈으로'),
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
            React.createElement('button', { onClick:saveProfile, disabled:savingProfile, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, savingProfile ? '저장 중...' : '정보 저장')
          ),
          React.createElement('div', { style:{ borderTop:'1px solid #e5e7eb', marginTop:'24px', paddingTop:'18px' } },
            React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '비밀번호 변경'),
            React.createElement('div', { style:{ marginBottom:'8px' } }, React.createElement('input', { type:'password', name:'current-password', autoComplete:'current-password', placeholder:'현재 비밀번호', value:pwDraft.current, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { current:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('div', { style:{ marginBottom:'8px' } }, React.createElement('input', { type:'password', name:'new-password', autoComplete:'new-password', placeholder:'새 비밀번호', value:pwDraft.next, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { next:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('div', { style:{ marginBottom:'10px' } }, React.createElement('input', { type:'password', name:'new-password-confirm', autoComplete:'new-password', placeholder:'새 비밀번호 확인', value:pwDraft.confirm, onChange:function(e){ var v = e.target.value; setPwDraft(function(p){ return Object.assign({}, p, { confirm:v }); }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })),
            React.createElement('button', { onClick:changePassword, style:{ background:'#fff', color:'#E60012', border:'1px solid #E60012', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, '비밀번호 변경')
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

  // (자료실 뷰는 영상별 첨부로 대체되어 제거됨 — 영상 아래에 첨부 자료가 표시됨)

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
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
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
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
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

  // 시험 결과 화면 (응시 완료 후 결과/분석)
  if (resultExam && resultSub && window.ExamResultPage) {
    return React.createElement(window.ExamResultPage, { exam: resultExam, submission: resultSub, onClose: closeExamResult });
  }

  // 시험 응시 화면
  if (portalView === 'exam' && activeExam) {
    var imgs = Array.isArray(activeExam.image_paths) ? activeExam.image_paths : [];
    var qc = activeExam.question_count || 0;
    var existingSub = mySubmissions[activeExam.id];
    var hasTimeLimit = (activeExam.time_limit_minutes || 0) > 0;
    var notStarted = hasTimeLimit && !existingSub;
    var isLocked = !!(existingSub && existingSub.locked);

    // 시작 전 안내 화면 (시간 제한 있고 아직 응시 시작 전)
    if (notStarted) {
      return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
        renderHeader(true),
        React.createElement('div', { style:{ maxWidth:'640px', margin:'0 auto', padding:'24px 16px' } },
          React.createElement('button', { onClick:closeExam, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '← 돌아가기'),
          React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'32px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'2px solid #1A1A1A', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#92400e', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px' } }, 'TIMED EXAM'),
            React.createElement('h2', { style:{ fontSize:'22px', fontWeight:'800', color:'#1A1A1A', margin:'4px 0', fontFamily:'Manrope, sans-serif' } }, activeExam.title),
            activeExam.subject && React.createElement('div', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, activeExam.subject),
            React.createElement('div', { style:{ background:'#fef3c7', border:'1px solid #F8B500', borderRadius:'10px', padding:'14px', margin:'18px 0', fontFamily:'Manrope, sans-serif' } },
              React.createElement('div', { style:{ fontSize:'13px', color:'#92400e', fontWeight:'700', marginBottom:'4px' } }, '시간 제한'),
              React.createElement('div', { style:{ fontSize:'28px', fontWeight:'800', color:'#1A1A1A' } }, activeExam.time_limit_minutes + '분')
            ),
            activeExam.description && React.createElement('div', { style:{ fontSize:'13px', color:'#374151', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif', textAlign:'left', background:'#f9fafb', borderRadius:'8px', padding:'12px', marginBottom:'16px' } }, activeExam.description),
            React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, '응시 시작 버튼을 누르면 카운트다운이 시작되며, 시간이 종료되면 자동 제출됩니다.\n시작 후에는 시간을 멈출 수 없습니다.'),
            React.createElement('div', { style:{ display:'flex', gap:'8px' } },
              React.createElement('button', { onClick:closeExam, style:{ flex:1, background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '취소'),
              React.createElement('button', { onClick:startExamSession, style:{ flex:2, background:'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding:'13px', fontSize:'15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '응시 시작')
            )
          )
        )
      );
    }

    var answerPanelWidth = 420;
    var pcAnswerSidePadding = (!portalIsMobile && answerPanelOpen) ? (answerPanelWidth + 32) : 0;
    // 모바일 시트 높이 (답안지 시트가 차지하는 화면 비율). full = 전체화면
    var mobileSheetHeightVh = sheetMode === 'full' ? 100 : (sheetMode === 'large' ? 75 : (sheetMode === 'small' ? 35 : 0));
    var mobileBottomPadding = portalIsMobile && sheetMode !== 'closed' ? ('calc(' + Math.min(mobileSheetHeightVh, 80) + 'vh + 24px)') : '24px';
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(true),
      React.createElement('div', { style:{ maxWidth: portalIsMobile ? '960px' : '1400px', margin:'0 auto', padding:'24px 16px', paddingRight: portalIsMobile ? '16px' : (pcAnswerSidePadding + 16) + 'px', paddingBottom: mobileBottomPadding } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
          React.createElement('button', { onClick:closeExam, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '← 돌아가기'),
          hasTimeLimit && examTimeLeft != null && React.createElement('div', { style:{
            background: examTimeLeft <= 60 ? '#E60012' : (examTimeLeft <= 300 ? '#F8B500' : '#1A1A1A'),
            color:'#fff', borderRadius:'10px', padding:'8px 14px',
            fontSize:'15px', fontWeight:'800', fontFamily:'Manrope, sans-serif',
            boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
          } }, (isLocked ? '시간 종료 ' : '남은 시간 ') + formatTimeLeft(examTimeLeft))
        ),
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', marginBottom:'16px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' } },
            activeExam.subject && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, activeExam.subject),
            existingSub && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background:'#16a34a', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, '제출 완료')
          ),
          React.createElement('h2', { style:{ fontSize:'20px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif', margin:'4px 0' } }, activeExam.title),
          activeExam.test_date && React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '시험일: ' + activeExam.test_date),
          activeExam.description && React.createElement('div', { style:{ fontSize:'13px', color:'#374151', marginTop:'8px', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif' } }, activeExam.description)
        ),

        /* 종이 시험지 안내 (hide_paper_for_students 일 때) */
        activeExam.hide_paper_for_students && React.createElement('div', { style:{ background:'#fef3c7', border:'1px solid #F8B500', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px', fontFamily:'Manrope, sans-serif' } },
          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#92400e', marginBottom:'4px' } }, '종이 시험지로 진행하는 시험입니다'),
          React.createElement('div', { style:{ fontSize:'12px', color:'#92400e', lineHeight:'1.6' } }, '나눠 받은 종이 시험지를 보고 문제를 풀어주세요. 아래 OMR 답안란에 답을 표시하면 됩니다.')
        ),

        /* 시험지 이미지 뷰어 */
        imgs.length > 0 && !activeExam.hide_paper_for_students && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', marginBottom:'16px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '시험지 (' + (examImgIdx+1) + '/' + imgs.length + ')'),
            imgs.length > 1 && React.createElement('div', { style:{ display:'flex', gap:'6px' } },
              React.createElement('button', { onClick:function(){ setExamImgIdx(Math.max(0, examImgIdx-1)); }, disabled: examImgIdx===0, style:{ background: examImgIdx===0?'#f3f4f6':'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', fontWeight:'700', cursor: examImgIdx===0?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, '‹ 이전'),
              React.createElement('button', { onClick:function(){ setExamImgIdx(Math.min(imgs.length-1, examImgIdx+1)); }, disabled: examImgIdx===imgs.length-1, style:{ background: examImgIdx===imgs.length-1?'#f3f4f6':'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', fontWeight:'700', cursor: examImgIdx===imgs.length-1?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, '다음 ›')
            )
          ),
          (function(){
            var cur = imgs[examImgIdx];
            var url = examPublicUrl(cur);
            var isPdf = (String(cur).split('.').pop() || '').toLowerCase() === 'pdf';
            if (isPdf) {
              return React.createElement('div', null,
                React.createElement('a', { href:url, target:'_blank', rel:'noopener noreferrer', style:{ display:'inline-block', background:'#1A1A1A', color:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', fontWeight:'700', textDecoration:'none', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '시험지 PDF 새 탭에서 열기'),
                React.createElement('iframe', { src:url, title:'시험지 PDF', style:{ width:'100%', height:'72vh', border:'1px solid #e5e7eb', borderRadius:'8px' } }),
                React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'6px', fontFamily:'Manrope, sans-serif' } }, '시험지가 안 보이면 위의 "새 탭에서 열기"를 눌러주세요.')
              );
            }
            return React.createElement('img', { src: url, alt:'시험지 ' + (examImgIdx+1), style:{ width:'100%', display:'block', borderRadius:'8px', border:'1px solid #e5e7eb' } });
          })(),
          imgs.length > 1 && React.createElement('div', { style:{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' } },
            imgs.map(function(_, i){
              return React.createElement('button', { key:i, onClick:function(){ setExamImgIdx(i); }, style:{ background: i===examImgIdx?'#E60012':'#fff', color: i===examImgIdx?'#fff':'#374151', border: '1px solid ' + (i===examImgIdx?'#E60012':'#d1d5db'), borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, String(i+1));
            })
          )
        ),

        /* 답안지 (OMR 형태) — PC: 우측 fixed 팝업 / 모바일: 하단 시트 (full=전체화면) */
        React.createElement('div', { style: portalIsMobile ? (sheetMode === 'closed' ? { display:'none' } : (sheetMode === 'full' ? {
          position:'fixed', inset:0, width:'100%', height:'100dvh',
          background:'#fff', padding:'8px 14px 16px',
          overflowY:'auto', overflowX:'hidden', zIndex: 80
        } : {
          position:'fixed', left:0, right:0, bottom:0,
          height: mobileSheetHeightVh + 'vh',
          background:'#fff',
          borderTopLeftRadius:'18px', borderTopRightRadius:'18px',
          borderTop:'2px solid #1A1A1A', borderLeft:'2px solid #1A1A1A', borderRight:'2px solid #1A1A1A',
          boxShadow:'0 -10px 30px rgba(0,0,0,0.18)',
          padding:'0 18px 16px',
          overflowY:'auto', overflowX:'hidden',
          zIndex: 60, transition:'height 0.2s ease'
        })) : (answerPanelOpen ? {
          position:'fixed', top:'90px', right:'24px', width: answerPanelWidth + 'px', maxHeight:'calc(100vh - 110px)', overflowY:'auto',
          background:'#fff', borderRadius:'14px', padding:'20px', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', border:'2px solid #1A1A1A', zIndex: 50
        } : { display:'none' }) },
          /* 답안지 헤더 (모바일 시트에선 sticky) */
          React.createElement('div', { style: portalIsMobile ? {
            position:'sticky', top:0, background:'#fff', zIndex: 1,
            borderBottom:'2px solid #1A1A1A', paddingBottom:'10px', marginBottom:'14px',
            paddingTop:'4px',
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px'
          } : { borderBottom:'2px solid #1A1A1A', paddingBottom:'12px', marginBottom:'18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' } },
            /* 모바일 시트 핸들 (전체화면 모드에선 숨김) */
            portalIsMobile && sheetMode !== 'full' && React.createElement('button', { onClick:function(){ setSheetMode(sheetMode === 'small' ? 'large' : 'small'); }, style:{ background:'none', border:'none', padding:'4px 0 6px', cursor:'pointer', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', order:-1 } },
              React.createElement('div', { style:{ width:'48px', height:'4px', borderRadius:'2px', background:'#9ca3af' } })
            ),
            React.createElement('div', null,
              React.createElement('h3', { style:{ fontSize: portalIsMobile ? '15px' : '18px', fontWeight:'800', color:'#1A1A1A', margin:0, fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } }, portalIsMobile ? '답안지' : '답   안   지'),
              React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'2px', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'220px' } }, activeExam.title)
            ),
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px' } },
              !portalIsMobile && React.createElement('div', { style:{ fontSize:'12px', color:'#374151', fontFamily:'Manrope, sans-serif', textAlign:'right' } },
                React.createElement('div', null, React.createElement('span', { style:{ color:'#6b7280' } }, '응시자: '), React.createElement('strong', null, user.name || '-')),
                activeExam.test_date && React.createElement('div', null, React.createElement('span', { style:{ color:'#6b7280' } }, '시험일: '), React.createElement('strong', null, activeExam.test_date))
              ),
              portalIsMobile && sheetMode !== 'full' && React.createElement('button', { onClick:function(){ setSheetMode(sheetMode === 'small' ? 'large' : 'small'); }, title: sheetMode === 'small' ? '펼치기' : '줄이기', style:{ background:'none', border:'1px solid #d1d5db', borderRadius:'6px', cursor:'pointer', color:'#374151', fontSize:'14px', fontWeight:'800', width:'30px', height:'30px', padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } }, sheetMode === 'small' ? '⌃' : '⌄'),
              portalIsMobile && React.createElement('button', { onClick:function(){ setSheetMode(sheetMode === 'full' ? 'large' : 'full'); }, title: sheetMode === 'full' ? '전체화면 나가기' : '전체화면 (가로 권장)', style:{ background: sheetMode === 'full' ? '#1A1A1A' : 'none', border:'1px solid ' + (sheetMode === 'full' ? '#1A1A1A' : '#d1d5db'), borderRadius:'6px', cursor:'pointer', color: sheetMode === 'full' ? '#fff' : '#374151', fontSize:'10px', fontWeight:'800', minWidth:'34px', height:'30px', padding:'0 5px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'Manrope, sans-serif' } }, sheetMode === 'full' ? '축소' : '전체'),
              portalIsMobile && React.createElement('button', { onClick:function(){ setSheetMode('closed'); }, title:'닫기', style:{ background:'none', border:'1px solid #d1d5db', borderRadius:'6px', cursor:'pointer', color:'#6b7280', fontSize:'16px', fontWeight:'800', width:'30px', height:'30px', padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } }, '✕'),
              !portalIsMobile && React.createElement('button', { onClick:function(){ setAnswerPanelOpen(false); }, title:'답안지 접기', style:{ background:'none', border:'1px solid #d1d5db', borderRadius:'6px', cursor:'pointer', color:'#6b7280', fontSize:'14px', fontWeight:'800', width:'26px', height:'26px', padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } }, '−')
            )
          ),

          /* 객관식 OMR (복수 정답 문항 지원) */
          qc > 0 && (function(){
            var cpq = activeExam.choices_per_question || 5;
            var circles = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
            var ak = (activeExam.answer_key && typeof activeExam.answer_key === 'object') ? activeExam.answer_key : {};
            var akNums = Object.keys(ak).map(Number).filter(function(n){ return !isNaN(n) && n > 0; }).sort(function(a,b){ return a-b; });
            var qNums = (akNums.length === qc) ? akNums : Array.from({ length: qc }, function(_, i){ return i + 1; });
            function pickCountFor(num){ var a = String(ak[num] || ''); return (a.indexOf(',') >= 0) ? a.split(',').filter(Boolean).length : 1; }
            var hasMulti = qNums.some(function(num){ return pickCountFor(num) > 1; });
            return React.createElement('div', { style:{ marginBottom: activeExam.allow_text_answer ? '24px' : 0 } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'4px' } },
                React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, '객관식 (' + qc + '문항 · ' + cpq + '지선다)'),
                React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, hasMulti ? '※ 보기를 클릭. 일부 문항은 여러 개 골라야 합니다' : '※ 보기를 클릭해 답을 선택하세요')
              ),
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'6px', border:'1px solid #1A1A1A', borderRadius:'6px', padding:'10px' } },
                qNums.map(function(num){
                  var current = examAnswers[num];
                  var pc = pickCountFor(num);
                  var pickedArr = String(current || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
                  return React.createElement('div', { key:num, style:{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 4px', borderBottom:'1px dashed #e5e7eb' } },
                    React.createElement('span', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', minWidth: pc > 1 ? '54px' : '28px', fontFamily:'Manrope, sans-serif', textAlign:'right' } }, num + '.' + (pc > 1 ? ' (' + pc + '개)' : '')),
                    React.createElement('div', { style:{ display:'flex', gap:'4px', flex:1, flexWrap:'wrap' } },
                      Array.from({ length: cpq }).map(function(_, ci){
                        var val = String(ci + 1);
                        var picked = pickedArr.indexOf(val) >= 0;
                        return React.createElement('button', { key:ci, disabled: isLocked, onClick:function(){
                          if (isLocked) return;
                          setExamAnswers(function(p){
                            var n = Object.assign({}, p);
                            if (pc <= 1) { n[num] = val; return n; }
                            var arr = String(n[num] || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
                            var pos = arr.indexOf(val);
                            if (pos >= 0) { arr.splice(pos, 1); }
                            else { arr.push(val); if (arr.length > pc) arr.shift(); }
                            if (arr.length === 0) delete n[num]; else n[num] = arr.slice().sort().join(',');
                            return n;
                          });
                        }, style:{
                          width:'32px', height:'32px', borderRadius:'50%',
                          background: picked ? '#1A1A1A' : '#fff',
                          color: picked ? '#fff' : '#374151',
                          border: '1.5px solid ' + (picked ? '#1A1A1A' : '#9ca3af'),
                          fontSize:'14px', fontWeight:'800', cursor: isLocked ? 'not-allowed' : 'pointer',
                          fontFamily:'Manrope, sans-serif', padding:0, opacity: isLocked ? 0.6 : 1,
                          display:'flex', alignItems:'center', justifyContent:'center'
                        } }, circles[ci] || (ci+1));
                      })
                    ),
                    current && !isLocked && React.createElement('button', { onClick:function(){ setExamAnswers(function(p){ var n = Object.assign({}, p); delete n[num]; return n; }); }, style:{ background:'none', border:'none', color:'#9ca3af', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✕')
                  );
                })
              )
            );
          })(),

          /* 녹음 답안 (allow_audio_answer 일 때만) */
          activeExam.allow_audio_answer && React.createElement(StudentAudioRecorder, {
            examId: activeExam.id,
            studentId: user && user.id,
            existingPath: examAudioPath,
            isLocked: isLocked,
            onPathChange: function(p){ setExamAudioPath(p); }
          }),

          /* 서술형 (다중) */
          (function(){
            var tqc = activeExam.text_question_count || 0;
            if (tqc === 0 && activeExam.allow_text_answer) tqc = 1; // legacy
            if (tqc === 0) return null;
            var startNum = (activeExam.question_count || 0) + 1;
            return React.createElement('div', null,
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '서술형 답안 (' + tqc + '문항)'),
              React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'14px' } },
                Array.from({ length: tqc }).map(function(_, i){
                  var num = i + 1;
                  var displayNum = startNum + i;
                  return React.createElement('div', { key:num },
                    React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '서술형 ' + num + '번 (문항 번호 ' + displayNum + ')'),
                    React.createElement('textarea', { value: examTextAnswers[num] || '', disabled: isLocked, onChange:function(e){ var v = e.target.value; setExamTextAnswers(function(p){ var n = Object.assign({}, p); n[num] = v; return n; }); }, rows: 5, placeholder:'답안을 작성해 주세요.', style:{ width:'100%', border:'1px solid #1A1A1A', borderRadius:'8px', padding:'12px 14px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box', resize:'vertical', lineHeight:'1.7', backgroundImage: 'linear-gradient(transparent, transparent calc(1.7em - 1px), #e5e7eb calc(1.7em - 1px), #e5e7eb 1.7em)', backgroundSize: '100% 1.7em', backgroundAttachment:'local', opacity: isLocked ? 0.7 : 1 } })
                  );
                })
              )
            );
          })(),

          /* 제출 버튼 */
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginTop:'24px', borderTop:'1px solid #e5e7eb', paddingTop:'18px' } },
            React.createElement('button', { onClick:closeExam, style:{ flex:1, background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, isLocked ? '닫기' : '취소'),
            !isLocked && React.createElement('button', { onClick:submitExamAnswer, disabled: examSubmitting, style:{ flex:1, background:'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding:'13px', fontSize:'14px', fontWeight:'800', cursor: examSubmitting?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', opacity: examSubmitting ? 0.6 : 1 } }, examSubmitting ? '제출 중...' : (existingSub && existingSub.started_at ? '답안 수정 제출' : '답안 제출'))
          )
        ),
        /* 답안지 접혔을 때 floating 펼치기 버튼 (PC: answerPanel 닫힘 / 모바일: 시트 closed) */
        ((!portalIsMobile && !answerPanelOpen) || (portalIsMobile && sheetMode === 'closed')) && React.createElement('button', { onClick:function(){ if (portalIsMobile) setSheetMode('small'); else setAnswerPanelOpen(true); }, style:{ position:'fixed', right:'20px', bottom:'20px', background:'#E60012', color:'#fff', border:'none', borderRadius:'999px', padding:'14px 22px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', boxShadow:'0 8px 22px rgba(0,0,0,0.18)', zIndex: 60 } }, '답안지 열기')
      )
    );
  }

  // 학생 전용 강의실: 영상 강의 / 테스트 / 숙제 카드 메뉴
  var testExamsAll = availableExams.filter(function(ex){ return ex.kind !== 'homework'; });
  var homeworkExamsAll = availableExams.filter(function(ex){ return ex.kind === 'homework'; });
  var pendingExams = testExamsAll.filter(function(ex){ var s = mySubmissions[ex.id]; return !(s && s.locked); });
  var pendingHomework = homeworkExamsAll.filter(function(ex){ var s = mySubmissions[ex.id]; return !(s && s.locked); });
  var isParent = !!(user && user.role === 'parent') && !adminMode && !isTeacherMode;
  var isStudent = !adminMode && !isTeacherMode && !isParent;

  // ── 학부모: 자녀 학습 현황 read-only ───────────────────────────
  if (isParent) {
    // 자녀 미선택 — 자녀 목록
    if (!parentSelectedChildId) {
      return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
        renderHeader(false),
        React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 16px' } },
          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '학부모'),
          React.createElement('h1', { style:{ fontSize:'22px', fontWeight:'800', color:'#111827', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, '자녀 학습 현황'),
          parentChildren.length === 0
            ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' } },
                React.createElement('p', { style:{ fontSize:'14px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '연결된 자녀가 없습니다. 학원에 자녀 등록을 요청해 주세요.')
              )
            : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
                parentChildren.map(function(c){
                  return React.createElement('div', {
                    key:c.id,
                    onClick: function(){ setParentSelectedChildId(c.id); setParentTab('test'); },
                    style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', padding:'18px 20px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer' }
                  },
                    React.createElement('div', { style:{ width:'48px', height:'48px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize: c.grade ? '14px' : '18px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, c.grade || (c.name || '?')[0]),
                    React.createElement('div', { style:{ flex:1, minWidth:0 } },
                      React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name)
                    ),
                    React.createElement('div', { style:{ fontSize:'22px', color:'rgba(0,0,0,0.2)' } }, '›')
                  );
                })
              )
        )
      );
    }
    // 자녀 상세
    var selectedChild = parentChildren.find(function(c){ return c.id === parentSelectedChildId; }) || {};
    var examItems = parentChildExams.filter(function(x){ return x.exam.kind !== 'homework'; });
    var hwItems = parentChildExams.filter(function(x){ return x.exam.kind === 'homework'; });

    var KIND_LABELS_PARENT = { level:'레벨', weekly:'주간', monthly:'월말', class:'반 시험', homework:'숙제' };
    function renderChildCard(item) {
      var ex = item.exam, sub = item.submission;
      var audioUrl = sub.audio_path && window.B2Utils ? window.B2Utils.audioPublicUrl(sub.audio_path) : '';
      var graded = !!sub.graded_at;
      return React.createElement('div', { key:sub.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:'10px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'8px' } },
          React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#1A1A1A', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, KIND_LABELS_PARENT[ex.kind] || ex.kind),
          ex.subject && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, ex.subject),
          React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', color: graded ? '#16a34a' : '#9ca3af', fontFamily:'Manrope, sans-serif' } }, graded ? '채점 완료' : '채점 대기')
        ),
        React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#111827', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, ex.title),
        React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '제출: ' + String(sub.submitted_at || '').slice(0,16).replace('T',' ')),
        sub.score != null && React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#1d4ed8', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '점수: ' + sub.score + '점'),
        sub.objective_score != null && sub.objective_total != null && React.createElement('div', { style:{ fontSize:'12px', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '객관식: ' + sub.objective_score + ' / ' + sub.objective_total),
        sub.feedback && React.createElement('div', { style:{ fontSize:'12px', color:'#374151', background:'#f9fafb', borderRadius:'8px', padding:'10px', marginBottom:'8px', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line' } }, '코멘트: ' + sub.feedback),
        audioUrl && React.createElement('div', { style:{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'8px', padding:'10px', marginBottom:'8px' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#92400e', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '자녀 녹음 답안'),
          React.createElement('audio', { controls:true, src: audioUrl, style:{ width:'100%' } })
        ),
        sub.text_answers && Object.keys(sub.text_answers).length > 0 && React.createElement('div', { style:{ marginTop:'8px' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '서술형 답안'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' } },
            Object.keys(sub.text_answers).map(function(k){
              return React.createElement('div', { key:k, style:{ background:'#f9fafb', borderRadius:'6px', padding:'8px 10px', fontSize:'12px', color:'#374151', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line' } },
                React.createElement('strong', { style:{ marginRight:'6px' } }, k + '번:'), sub.text_answers[k]
              );
            })
          )
        )
      );
    }

    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(false),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'18px 20px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'14px' } },
          React.createElement('div', { style:{ width:'48px', height:'48px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize: selectedChild.grade ? '14px' : '18px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, selectedChild.grade || (selectedChild.name || '?')[0]),
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' } }, selectedChild.name || '자녀')
          ),
          parentChildren.length > 1 && React.createElement('button', { onClick:function(){ setParentSelectedChildId(null); }, style:{ background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '다른 자녀')
        ),
        React.createElement('div', { style:{ display:'inline-flex', background:'#f2f0eb', borderRadius:'8px', padding:'3px', gap:'2px', marginBottom:'14px', flexWrap:'wrap' } },
          [{v:'test',l:'시험 ' + examItems.length},{v:'homework',l:'숙제 ' + hwItems.length},{v:'video',l:'영상 시청 ' + parentChildVideos.length}].map(function(o){
            var on = parentTab === o.v;
            return React.createElement('button', { key:o.v, onClick:function(){ setParentTab(o.v); }, style:{ background: on?'#1A1A1A':'transparent', color: on?'#fff':'rgba(0,0,0,0.55)', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, o.l);
          })
        ),
        parentLoading && React.createElement('div', { style:{ color:'#9ca3af', padding:'20px', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...'),
        !parentLoading && parentTab === 'test' && (examItems.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'30px', textAlign:'center', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '응시한 시험이 없습니다.')
          : React.createElement('div', null, examItems.map(renderChildCard))
        ),
        !parentLoading && parentTab === 'homework' && (hwItems.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'30px', textAlign:'center', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '제출한 숙제가 없습니다.')
          : React.createElement('div', null, hwItems.map(renderChildCard))
        ),
        !parentLoading && parentTab === 'video' && (parentChildVideos.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'30px', textAlign:'center', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '시청한 영상이 없습니다.')
          : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
              parentChildVideos.map(function(it){
                var v = it.video, vw = it.view;
                var pct = vw.progress != null ? Math.round(parseFloat(vw.progress) * 100) : null;
                return React.createElement('div', { key: vw.id || v.id, style:{ background:'#fff', borderRadius:'12px', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' } },
                  React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, v.title || '영상'),
                  React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } },
                    (pct != null ? ('진도 ' + pct + '%') : '시청 시작') + ' · 마지막 시청 ' + String(vw.updated_at || vw.created_at || '').slice(0,16).replace('T',' ')
                  )
                );
              })
            )
        )
      )
    );
  }

  // 학생 강의실 홈 (세 카드 선택)
  if (isStudent && studentMode === 'home') {
    // PWA(모바일) - SubjectSelect 스타일 카드 (좌측 색 띠 + 제목 + 우측 화살표)
    if (portalIsMobile) {
      var classroomItems = [
        { id:'video',    color:'#E60012', title:'영상 강의', sub:'수강 과목 ' + studentSubjects.length + '개', onClick:function(){ setStudentMode('video'); setSelectedSubject(null); } },
        { id:'test',     color:'#E60012', title:'테스트',  sub:'응시 가능 ' + testExamsAll.length + '건' + (pendingExams.length > 0 ? ' · 미응시 ' + pendingExams.length : ''), onClick:function(){ setStudentMode('test'); } },
        { id:'homework', color:'#E60012', title:'숙제',    sub:'제출 가능 ' + homeworkExamsAll.length + '건' + (pendingHomework.length > 0 ? ' · 미제출 ' + pendingHomework.length : ''), onClick:function(){ setStudentMode('homework'); } },
        { id:'vocab',    color:'#E60012', title:'단어 시험', sub:'학습·시험·결과·순위', requiresEnglish:true, onClick:function(){ setStudentMode('vocab'); } },
      ].filter(function(it){ return !it.requiresEnglish || studentSubjects.indexOf('영어') >= 0; });
      return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
        renderHeader(false),
        React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 16px' } },
          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '강의실'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
            classroomItems.map(function(it){
              return React.createElement('div', {
                key:it.id, onClick:it.onClick,
                style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
                onMouseEnter:function(e){ e.currentTarget.style.transform='translateX(3px)'; },
                onMouseLeave:function(e){ e.currentTarget.style.transform='translateX(0)'; }
              },
                React.createElement('div', { style:{ width:'6px', alignSelf:'stretch', background:it.color, flexShrink:0 } }),
                React.createElement('div', { style:{ flex:1, padding:'18px 16px', display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap' } },
                  React.createElement('span', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, it.title),
                  React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, it.sub)
                ),
                React.createElement('div', { style:{ padding:'0 20px', fontSize:'22px', color:'rgba(0,0,0,0.2)' } }, '›')
              );
            })
          )
        )
      );
    }

    // PC - 영상 강의 진입 시와 동일한 카드 스타일 (좌측 색띠 + 큰 제목 + 우측 화살표)
    var classroomItemsPC = [
      { id:'video',    color:'#E60012', title:'영상 강의', sub:'수강 과목 ' + studentSubjects.length + '개', onClick:function(){ setStudentMode('video'); setSelectedSubject(null); } },
      { id:'test',     color:'#E60012', title:'테스트',  sub:'응시 가능 ' + testExamsAll.length + '건' + (pendingExams.length > 0 ? ' · 미응시 ' + pendingExams.length : ''), onClick:function(){ setStudentMode('test'); } },
      { id:'homework', color:'#E60012', title:'숙제',    sub:'제출 가능 ' + homeworkExamsAll.length + '건' + (pendingHomework.length > 0 ? ' · 미제출 ' + pendingHomework.length : ''), onClick:function(){ setStudentMode('homework'); } },
      { id:'vocab',    color:'#E60012', title:'단어 시험', sub:'학습·시험·결과·순위', requiresEnglish:true, onClick:function(){ setStudentMode('vocab'); } },
    ].filter(function(it){ return !it.requiresEnglish || studentSubjects.indexOf('영어') >= 0; });
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(false),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 16px' } },
        React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '강의실'),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
          classroomItemsPC.map(function(it){
            return React.createElement('div', {
              key:it.id, onClick:it.onClick,
              style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
              onMouseEnter:function(e){ e.currentTarget.style.transform='translateX(3px)'; },
              onMouseLeave:function(e){ e.currentTarget.style.transform='translateX(0)'; }
            },
              React.createElement('div', { style:{ width:'6px', alignSelf:'stretch', background:it.color, flexShrink:0 } }),
              React.createElement('div', { style:{ flex:1, padding:'18px 16px', display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap' } },
                React.createElement('span', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, it.title),
                React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, it.sub)
              ),
              React.createElement('div', { style:{ padding:'0 20px', fontSize:'22px', color:'rgba(0,0,0,0.2)' } }, '›')
            );
          })
        )
      )
    );
  }

  // 학생 - 단어 시험 (보카트레인 형식: STUDY/TEST/REPORT/RANKING) — 영어 수강생만 이용
  if (isStudent && studentMode === 'vocab') {
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'100vh' } },
      renderHeader(false),
      React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.06)', padding:'10px 16px', maxWidth:'960px', margin:'0 auto' } },
        React.createElement('button', { onClick:function(){ setStudentMode('home'); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '← 강의실로')
      ),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto' } },
        studentSubjects.indexOf('영어') < 0
          ? React.createElement('div', { style:{ padding:'48px 24px', textAlign:'center', color:'#9ca3af', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '단어 시험은 영어 수강생만 이용할 수 있어요.')
        : window.VocabPlayer
          ? React.createElement(window.VocabPlayer, { user: user })
          : React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '단어 시험 모듈이 로드되지 않았습니다.')
      )
    );
  }

  // 학생 - 테스트 모드 (시험 카드 그리드, 숙제 제외)
  if (isStudent && studentMode === 'test') {
    var anyTest = testExamsAll.length > 0 || levelTests.length > 0;
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(false),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:'16px' } },
        React.createElement('button', { onClick:function(){ setStudentMode('home'); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', alignSelf:'flex-start' } }, '← 강의실로'),

        /* 레벨테스트 섹션 — 별도 '레벨테스트 신청' 페이지로 이동, 강의실에는 표시 X */
        false && (function(){
          var myReqList = Object.keys(myLevelRequests).map(function(eid){ return { req: myLevelRequests[eid], exam: levelTests.find(function(e){ return e.id === eid; }) }; }).filter(function(x){ return !!x.exam; });
          return React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'2px solid #1d4ed8' } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'8px' } },
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#1d4ed8', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, '레벨테스트'),
                React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'2px 0 0', fontFamily:'Manrope, sans-serif' } }, '내 실력 진단')
              ),
              React.createElement('button', { onClick: openLtApplyForm, style:{ background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 16px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 레벨테스트 신청')
            ),
            React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '학교급·학년·내신 점수를 입력하면 적합한 시험이 자동으로 매칭됩니다.'),
            myReqList.length === 0
              ? React.createElement('div', { style:{ fontSize:'13px', color:'#9ca3af', fontFamily:'Manrope, sans-serif', padding:'10px 0' } }, '아직 신청한 레벨테스트가 없습니다.')
              : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'12px' } },
                  myReqList.map(function(item){
                    var ex = item.exam, req = item.req;
                    var sub = mySubmissions[ex.id];
                    var imgsCount = Array.isArray(ex.image_paths) ? ex.image_paths.length : 0;
                    var isLockedSub = !!(sub && sub.locked);
                    var statusLabel, statusColor;
                    if (sub) { statusLabel = isLockedSub ? '시간 종료' : '응시 완료'; statusColor = isLockedSub ? '#6b7280' : '#16a34a'; }
                    else { statusLabel = '응시 가능'; statusColor = '#1d4ed8'; }
                    return React.createElement('div', { key:ex.id, style:{ background:'#fff', border:'2px solid ' + statusColor, borderRadius:'12px', padding:'16px', fontFamily:'Manrope, sans-serif' } },
                      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px', flexWrap:'wrap' } },
                        React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background: statusColor, color:'#fff', borderRadius:'4px', padding:'2px 7px' } }, statusLabel),
                        ex.subject && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 7px' } }, ex.subject),
                        ex.time_limit_minutes > 0 && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', color:'#6b7280' } }, '제한 ' + ex.time_limit_minutes + '분')
                      ),
                      React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#111827', marginBottom:'4px' } }, ex.title),
                      (req.school_level || req.grade) && React.createElement('div', { style:{ fontSize:'11px', color:'#1d4ed8', fontWeight:'700' } }, '신청 정보: ' + [req.school_level, req.grade ? req.grade + '학년' : null, req.semester ? req.semester + '학기' : null, req.score != null ? req.score + '점' : null].filter(Boolean).join(' / ')),
                      React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'4px' } }, '이미지 ' + imgsCount + '장' + (ex.question_count > 0 ? ' · 객관식 ' + ex.question_count + '문항' : '') + ((ex.text_question_count || 0) > 0 ? ' · 서술형 ' + ex.text_question_count + '문항' : '')),
                      React.createElement('div', { style:{ marginTop:'10px', display:'flex', gap:'6px' } },
                        !sub && React.createElement('button', { onClick:function(){ openExam(ex); }, style:{ flex:1, background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px', fontSize:'13px', fontWeight:'800', cursor:'pointer' } }, '응시하기'),
                        !sub && React.createElement('button', { onClick:function(){ cancelLevelTestRequest(ex); }, style:{ background:'#fff', color:'#6b7280', border:'1px solid #d1d5db', borderRadius:'8px', padding:'9px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer' } }, '신청 취소'),
                        sub && React.createElement('button', { disabled:true, style:{ flex:1, background:'#f3f4f6', color:'#9ca3af', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'9px', fontSize:'13px', fontWeight:'700', cursor:'not-allowed' } }, '응시 완료')
                      )
                    );
                  })
                ),

            /* 신청 폼 모달 */
            ltApplyOpen && React.createElement('div', { onClick:closeLtApplyForm, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
              React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'14px', padding:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif' } },
                React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' } },
                  React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 } }, '레벨테스트 신청'),
                  React.createElement('button', { onClick:closeLtApplyForm, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' } }, '×')
                ),
                React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'14px' } }, '학교급·학년·내신 성적에 맞는 시험이 자동으로 매칭됩니다.'),

                React.createElement('div', { style:{ marginBottom:'12px' } },
                  React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학교급 *'),
                  React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                    ['초','중','고'].map(function(s){
                      var picked = ltApplyDraft.school_level === s;
                      return React.createElement('button', { key:s, onClick:function(){ setLtApplyDraft(Object.assign({}, ltApplyDraft, { school_level:s, grade:'' })); }, style:{ flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'800', fontFamily:'Manrope, sans-serif', background: picked ? '#1d4ed8' : '#fff', color: picked ? '#fff' : '#374151', border: '1px solid ' + (picked ? '#1d4ed8' : '#d1d5db') } }, s);
                    })
                  )
                ),
                React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'12px' } },
                  React.createElement('div', { style:{ flex:1 } },
                    React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학년 *'),
                    React.createElement('select', { value:ltApplyDraft.grade, onChange:function(e){ setLtApplyDraft(Object.assign({}, ltApplyDraft, { grade:e.target.value })); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } },
                      React.createElement('option', { value:'' }, '학년 선택'),
                      (ltApplyDraft.school_level === '초' ? ['1','2','3','4','5','6'] : ['1','2','3']).map(function(g){ return React.createElement('option', { key:g, value:g }, g + '학년'); })
                    )
                  ),
                  React.createElement('div', { style:{ flex:1 } },
                    React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학기 (선택)'),
                    React.createElement('select', { value:ltApplyDraft.semester, onChange:function(e){ setLtApplyDraft(Object.assign({}, ltApplyDraft, { semester:e.target.value })); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } },
                      React.createElement('option', { value:'' }, '학기 무관'),
                      ['1','2'].map(function(s){ return React.createElement('option', { key:s, value:s }, s + '학기'); })
                    )
                  )
                ),
                React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginBottom:'12px' } }, '※ 선행 학습 중이라면 더 높은 학년/학기를 선택할 수 있습니다.'),
                React.createElement('div', { style:{ marginBottom:'14px' } },
                  React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '내신 성적 (0~100점) *'),
                  React.createElement('input', { type:'number', min:'0', max:'100', value:ltApplyDraft.score, onChange:function(e){ setLtApplyDraft(Object.assign({}, ltApplyDraft, { score:window.B2Utils.stripLeadingZero(e.target.value) })); }, placeholder:'예: 85', style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })
                ),

                React.createElement('div', { style:{ display:'flex', gap:'8px' } },
                  React.createElement('button', { onClick:closeLtApplyForm, style:{ flex:1, background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer' } }, '취소'),
                  React.createElement('button', { onClick:submitLevelTestApply, disabled:ltApplySubmitting, style:{ flex:1, background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: ltApplySubmitting?'not-allowed':'pointer', opacity: ltApplySubmitting ? 0.6 : 1 } }, ltApplySubmitting ? '매칭 중...' : '시험 매칭 및 신청')
                )
              )
            )
          );
        })(),

        /* 클래스 시험 */
        !anyTest
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'40px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' } },
              React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 8px', fontFamily:'Manrope, sans-serif' } }, '응시 가능한 시험이 없습니다'),
              React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '선생님이 시험지를 발행하거나 레벨테스트가 등록되면 이 곳에 표시됩니다.')
            )
          : testExamsAll.length === 0
          ? null
          : React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'2px solid #1A1A1A' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' } },
                React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:0, fontFamily:'Manrope, sans-serif' } }, '내 반 시험'),
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#fff', background: pendingExams.length > 0 ? '#E60012' : '#16a34a', borderRadius:'999px', padding:'4px 12px', fontFamily:'Manrope, sans-serif' } }, pendingExams.length > 0 ? ('미응시 ' + pendingExams.length + '건') : '모두 응시 완료')
              ),
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'12px' } },
                testExamsAll.map(function(ex){
                  var sub = mySubmissions[ex.id];
                  var imgsCount = Array.isArray(ex.image_paths) ? ex.image_paths.length : 0;
                  var isLockedSub = !!(sub && sub.locked);
                  var isStartedSub = !!(sub && sub.started_at && !isLockedSub);
                  var statusLabel = isLockedSub ? '시간 종료' : (isStartedSub ? '응시 중' : (sub ? '제출 완료' : '미응시'));
                  var statusColor = isLockedSub ? '#6b7280' : (isStartedSub ? '#F8B500' : (sub ? '#16a34a' : '#E60012'));
                  return React.createElement('button', { key:ex.id, onClick:function(){ if (sub) viewExamResult(ex); else openExam(ex); }, style:{ textAlign:'left', cursor:'pointer', background:'#fff', border: '2px solid ' + statusColor, borderRadius:'12px', padding:'16px', fontFamily:'Manrope, sans-serif' } },
                    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px', flexWrap:'wrap' } },
                      React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background: statusColor, color:'#fff', borderRadius:'4px', padding:'2px 7px' } }, statusLabel),
                      ex.subject && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 7px' } }, ex.subject),
                      ex.time_limit_minutes > 0 && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', color:'#6b7280' } }, '제한 ' + ex.time_limit_minutes + '분')
                    ),
                    React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#111827', marginBottom:'4px' } }, ex.title),
                    ex.test_date && React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280' } }, '시험일 ' + ex.test_date),
                    React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'4px' } }, '이미지 ' + imgsCount + '장' + (ex.question_count > 0 ? ' · 객관식 ' + ex.question_count + '문항' : '') + ((ex.text_question_count || 0) > 0 ? ' · 서술형 ' + ex.text_question_count + '문항' : (ex.allow_text_answer ? ' · 서술형' : '')))
                  );
                })
              )
            )
      )
    );
  }

  // 학생 - 숙제 모드 (숙제 카드 그리드)
  if (isStudent && studentMode === 'homework') {
    return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
      renderHeader(false),
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px', display:'flex', flexDirection:'column', gap:'16px' } },
        React.createElement('button', { onClick:function(){ setStudentMode('home'); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', alignSelf:'flex-start' } }, '← 강의실로'),
        homeworkExamsAll.length === 0
          ? React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'40px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.05)' } },
              React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 8px', fontFamily:'Manrope, sans-serif' } }, '제출할 숙제가 없습니다'),
              React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '선생님이 숙제를 발행하면 이 곳에 표시됩니다.')
            )
          : React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)', border:'2px solid #1A1A1A' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' } },
                React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:0, fontFamily:'Manrope, sans-serif' } }, '내 숙제'),
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#fff', background: pendingHomework.length > 0 ? '#E60012' : '#16a34a', borderRadius:'999px', padding:'4px 12px', fontFamily:'Manrope, sans-serif' } }, pendingHomework.length > 0 ? ('미제출 ' + pendingHomework.length + '건') : '모두 제출 완료')
              ),
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'12px' } },
                homeworkExamsAll.map(function(ex){
                  var sub = mySubmissions[ex.id];
                  var imgsCount = Array.isArray(ex.image_paths) ? ex.image_paths.length : 0;
                  var isLockedSub = !!(sub && sub.locked);
                  var statusLabel = isLockedSub ? '마감' : (sub ? '제출 완료' : '미제출');
                  var statusColor = isLockedSub ? '#6b7280' : (sub ? '#16a34a' : '#E60012');
                  return React.createElement('button', { key:ex.id, onClick:function(){ if (sub) viewExamResult(ex); else openExam(ex); }, style:{ textAlign:'left', cursor:'pointer', background:'#fff', border: '2px solid ' + statusColor, borderRadius:'12px', padding:'16px', fontFamily:'Manrope, sans-serif' } },
                    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px', flexWrap:'wrap' } },
                      React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background: statusColor, color:'#fff', borderRadius:'4px', padding:'2px 7px' } }, statusLabel),
                      ex.subject && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 7px' } }, ex.subject)
                    ),
                    React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#111827', marginBottom:'4px' } }, ex.title),
                    ex.test_date && React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280' } }, '마감 ' + ex.test_date),
                    React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'4px' } }, '이미지 ' + imgsCount + '장' + (ex.question_count > 0 ? ' · 객관식 ' + ex.question_count + '문항' : '') + ((ex.text_question_count || 0) > 0 ? ' · 서술형 ' + ex.text_question_count + '문항' : (ex.allow_text_answer ? ' · 서술형' : '')))
                  );
                })
              )
            )
      )
    );
  }

  // 학생 - 영상 강의 모드 / 선생님·관리자: 기존 과목 선택 흐름
  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    renderHeader(false),
    isStudent && React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'12px 16px 0' } },
      React.createElement('button', { onClick:function(){ setStudentMode('home'); setSelectedSubject(null); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '← 강의실로')
    ),
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
