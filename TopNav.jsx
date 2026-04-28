// TopNav.jsx — Recovery version with Admin button
// 기존 TopNav.jsx 전체를 이 파일 내용으로 교체하세요.

const NAV_LINKS = ['학원안내', '프로그램', '모집안내', '온라인 강의', '문의하기'];
const PAGE_MAP  = { '학원안내':'about', '프로그램':'service', '모집안내':'recruit', '온라인 강의':'portal', '문의하기':'contact' };

function dDay(targetDateStr) {
  const target = new Date(targetDateStr);
  const today  = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function TopBar({ user, onLoginClick, onLogout, onAdminClick, examDate }) {
  return null;
}

function MainNav({ page, setPage, user, adminAuthed, onLoginClick, onSignupClick, onAdminClick, onLogout, examDate }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const d = dDay(examDate || '2026-11-12');

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function goAdmin() {
    if (typeof onAdminClick === 'function') {
      onAdminClick();
    } else if (typeof setPage === 'function') {
      setPage('admin');
    }
    setMenuOpen(false);
  }

  function goHome() {
    setPage('home');
    setMenuOpen(false);
  }

  function goLink(label) {
    if (label === '온라인 강의' && !user && !adminAuthed) {
      onLoginClick && onLoginClick();
      setMenuOpen(false);
      return;
    }
    setPage(PAGE_MAP[label] || 'home');
    setMenuOpen(false);
  }

  const isLoggedIn = !!user || !!adminAuthed;
  const displayName = user?.name || user?.email || (adminAuthed ? '관리자' : '');
  const firstLetter = displayName ? String(displayName)[0] : 'B';

  return React.createElement('nav', { style: { ...mnStyles.nav, position: 'sticky', top: 0, zIndex: 100 } },

    !isMobile && React.createElement('div', { style: mnStyles.inner },
      React.createElement('div', { style: mnStyles.logo, onClick: goHome },
        React.createElement('div', { style: mnStyles.logoMark }, 'B2'),
        React.createElement('div', { style: mnStyles.logoText },
          React.createElement('div', { style: mnStyles.logoMain }, '빅뱅학원'),
          React.createElement('div', { style: mnStyles.logoSub }, 'Big Bang Academy')
        )
      ),

      React.createElement('div', { style: mnStyles.links },
        NAV_LINKS.map(label =>
          React.createElement('span', {
            key: label,
            style: {
              ...mnStyles.link,
              color: page === PAGE_MAP[label] ? '#006241' : 'rgba(0,0,0,0.87)',
              borderBottom: page === PAGE_MAP[label] ? '2px solid #006241' : '2px solid transparent',
            },
            onClick: () => goLink(label),
          }, label)
        )
      ),

      React.createElement('div', { style: mnStyles.cta },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
          React.createElement('button', { style: mnStyles.adminBtn, onClick: goAdmin }, '관리자'),

          isLoggedIn
            ? React.createElement(React.Fragment, null,
                React.createElement('div', { style: mnStyles.userBadge },
                  React.createElement('div', { style: mnStyles.avatar }, firstLetter),
                  React.createElement('span', { style: mnStyles.userName }, displayName)
                ),
                React.createElement('span', {
                  style: mnStyles.logoutText,
                  onClick: onLogout,
                }, '로그아웃')
              )
            : React.createElement(React.Fragment, null,
                React.createElement('button', { style: mnStyles.ctaBtnOutline, onClick: onLoginClick }, '로그인'),
                React.createElement('button', { style: mnStyles.ctaBtn, onClick: onSignupClick || onLoginClick }, '회원가입')
              )
        )
      )
    ),

    isMobile && React.createElement('div', { style: mnStyles.mobileBar },
      React.createElement('div', { style: mnStyles.logo, onClick: goHome },
        React.createElement('div', { style: { ...mnStyles.logoMark, width:'32px', height:'32px', fontSize:'12px' } }, 'B2'),
        React.createElement('div', { style: mnStyles.logoMain }, '빅뱅학원')
      ),
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif' } }, `수능 D-${d}`),
        isLoggedIn && React.createElement('div', { style:{ width:'28px', height:'28px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, firstLetter),
        React.createElement('button', {
          onClick: () => setMenuOpen(!menuOpen),
          style: { background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', flexDirection:'column', gap:'5px' }
        },
          React.createElement('div', { style:{ width:'22px', height:'2px', background:'rgba(0,0,0,0.7)', borderRadius:'1px', transition:'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' } }),
          React.createElement('div', { style:{ width:'22px', height:'2px', background:'rgba(0,0,0,0.7)', borderRadius:'1px', opacity: menuOpen ? 0 : 1, transition:'all 0.2s' } }),
          React.createElement('div', { style:{ width:'22px', height:'2px', background:'rgba(0,0,0,0.7)', borderRadius:'1px', transition:'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' } })
        )
      )
    ),

    isMobile && menuOpen && React.createElement('div', { style: mnStyles.mobileMenu },
      NAV_LINKS.map(label =>
        React.createElement('div', {
          key: label,
          style: {
            ...mnStyles.mobileMenuItem,
            color: page === PAGE_MAP[label] ? '#006241' : 'rgba(0,0,0,0.87)',
            fontWeight: page === PAGE_MAP[label] ? '700' : '500',
          },
          onClick: () => goLink(label),
        }, label)
      ),
      React.createElement('div', { style:{ borderTop:'1px solid rgba(0,0,0,0.08)', marginTop:'8px', paddingTop:'8px' } },
        React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'#111827', fontWeight:'800' }, onClick: goAdmin }, '관리자'),
        isLoggedIn
          ? React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'rgba(0,0,0,0.45)' }, onClick:()=>{ onLogout && onLogout(); setMenuOpen(false); } }, '로그아웃')
          : React.createElement(React.Fragment, null,
              React.createElement('div', { style:{ ...mnStyles.mobileMenuItem }, onClick:()=>{ onLoginClick && onLoginClick(); setMenuOpen(false); } }, '로그인'),
              React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'#006241', fontWeight:'700' }, onClick:()=>{ (onSignupClick || onLoginClick) && (onSignupClick || onLoginClick)(); setMenuOpen(false); } }, '회원가입')
            )
      )
    )
  );
}

const mnStyles = {
  nav: { background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', zIndex:100 },
  inner: { maxWidth:'1280px', margin:'0 auto', height:'72px', display:'flex', alignItems:'center', gap:'40px', padding:'0 40px' },
  logo: { display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', flexShrink:0 },
  logoMark: { width:'40px', height:'40px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' },
  logoText: { display:'flex', flexDirection:'column' },
  logoMain: { fontSize:'17px', fontWeight:'800', color:'#006241', letterSpacing:'-0.5px', lineHeight:'1.1', fontFamily:'Manrope, sans-serif' },
  logoSub: { fontSize:'9px', fontWeight:'500', color:'rgba(0,0,0,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' },
  links: { display:'flex', gap:'28px', flex:1, justifyContent:'center' },
  link: { fontSize:'14px', fontWeight:'600', letterSpacing:'-0.01em', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'color 0.2s', paddingBottom:'2px' },
  cta: { flexShrink:0 },
  adminBtn: { background:'#111827', color:'#fff', border:'1px solid #111827', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', whiteSpace:'nowrap' },
  ctaBtn: { background:'#00754A', color:'#fff', border:'1px solid #00754A', borderRadius:'8px', padding:'9px 20px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s', whiteSpace:'nowrap' },
  ctaBtnOutline: { background:'transparent', color:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,0,0,0.2)', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s' },
  userBadge: { display:'flex', alignItems:'center', gap:'8px' },
  avatar: { width:'34px', height:'34px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' },
  userName: { fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', maxWidth:'110px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  logoutText: { fontSize:'12px', color:'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
  mobileBar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:'56px' },
  mobileMenu: { background:'#fff', borderTop:'1px solid rgba(0,0,0,0.08)', padding:'8px 0 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' },
  mobileMenuItem: { padding:'14px 20px', fontSize:'15px', fontWeight:'500', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em' },
};

Object.assign(window, { TopBar, MainNav });
