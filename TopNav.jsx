// TopNav.jsx — Top utility bar + Main navigation (반응형 / 관리자 버튼 복구 버전)
const NAV_LINKS = ['학원안내', '프로그램', '모집안내', '온라인 강의', '문의하기'];
const PAGE_MAP  = { '학원안내':'about', '프로그램':'service', '모집안내':'recruit', '온라인 강의':'portal', '문의하기':'contact' };

function dDay(targetDateStr) {
  const target = new Date(targetDateStr);
  const today  = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function isAdminUser(user, adminAuthed) {
  const role = String(user?.role || user?.user_role || user?.type || '').toLowerCase();
  return Boolean(adminAuthed || role === 'admin' || role === 'manager' || user?.is_admin || user?.isAdmin);
}

function TopBar({ user, adminAuthed, onLoginClick, onLogout, onAdminClick, setPage, examDate }) {
  return null;
}

const tbStyles = {
  wrap:  { background:'#f9f9f9', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 40px' },
  inner: { maxWidth:'1280px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:'34px' },
  left:  { display:'flex', gap:'16px' },
  right: { display:'flex', gap:'8px', alignItems:'center', flexShrink:0, overflow:'hidden' },
  branch:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em', cursor:'pointer' },
  dday:  { fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em', whiteSpace:'nowrap' },
  link:  { fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em' },
  divider:{ fontSize:'12px', color:'rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif' },
};

function TopNavAuthButtons({
  user,
  adminAuthed,
  onLoginClick,
  onSignupClick,
  onAdminClick,
  onLogout,
  setPage,
  isMobile,
  closeMenu,
}) {
  const authed = Boolean(user || adminAuthed);
  const admin = isAdminUser(user, adminAuthed);
  const displayName = user?.name || user?.email || (admin ? '관리자' : '사용자');
  const firstLetter = String(displayName || 'B').slice(0, 1).toUpperCase();

  function close() {
    if (typeof closeMenu === 'function') closeMenu();
  }

  function run(fn) {
    if (typeof fn === 'function') fn();
    close();
  }

  function openAdmin() {
    if (typeof onAdminClick === 'function') {
      onAdminClick();
    } else if (typeof setPage === 'function') {
      setPage('admin');
    }
    close();
  }

  if (!authed) {
    if (isMobile) {
      return React.createElement('div', null,
        React.createElement('div', { style:{ ...mnStyles.mobileMenuItem }, onClick:()=>run(onLoginClick) }, '로그인'),
        React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'#006241', fontWeight:'700' }, onClick:()=>run(onSignupClick || onLoginClick) }, '회원가입')
      );
    }

    return React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
      React.createElement('button', { style: mnStyles.ctaBtnOutline, onClick: onLoginClick }, '로그인'),
      React.createElement('button', { style: mnStyles.ctaBtn, onClick: onSignupClick || onLoginClick }, '회원가입')
    );
  }

  if (isMobile) {
    return React.createElement('div', null,
      React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'rgba(0,0,0,0.7)', fontWeight:'700' } }, displayName),
      admin && React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'#006241', fontWeight:'800' }, onClick:openAdmin }, '관리자 화면'),
      React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'rgba(0,0,0,0.45)' }, onClick:()=>run(onLogout) }, '로그아웃')
    );
  }

  return React.createElement('div', { style: { display:'flex', alignItems:'center', gap:'12px' } },
    React.createElement('div', { style: mnStyles.userBadge },
      React.createElement('div', { style: mnStyles.avatar }, firstLetter),
      React.createElement('span', { style: mnStyles.userName }, displayName)
    ),
    admin && React.createElement('button', { style: mnStyles.adminBtn, onClick: openAdmin }, '관리자'),
    React.createElement('span', { style: mnStyles.logoutLink, onClick: onLogout }, '로그아웃')
  );
}

function MainNav({ page, setPage, user, adminAuthed, onLoginClick, onSignupClick, onAdminClick, onLogout, examDate }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const d = dDay(examDate || '2026-11-12');
  const authed = Boolean(user || adminAuthed);

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function goPageByLabel(label) {
    if (label === '온라인 강의' && !authed) {
      if (typeof onLoginClick === 'function') onLoginClick();
      return;
    }
    setPage(PAGE_MAP[label] || 'home');
  }

  return React.createElement('nav', { style: { ...mnStyles.nav, position: 'sticky', top: 0, zIndex: 100 } },
    !isMobile && React.createElement('div', { style: mnStyles.inner },
      React.createElement('div', { style: mnStyles.logo, onClick: () => setPage('home') },
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
            onClick: () => goPageByLabel(label)
          }, label)
        )
      ),
      React.createElement('div', { style: mnStyles.cta },
        React.createElement(TopNavAuthButtons, {
          user,
          adminAuthed,
          onLoginClick,
          onSignupClick,
          onAdminClick,
          onLogout,
          setPage,
          isMobile: false,
        })
      )
    ),

    isMobile && React.createElement('div', { style: mnStyles.mobileBar },
      React.createElement('div', { style: mnStyles.logo, onClick: () => { setPage('home'); setMenuOpen(false); } },
        React.createElement('div', { style: { ...mnStyles.logoMark, width:'32px', height:'32px', fontSize:'12px' } }, 'B2'),
        React.createElement('div', { style: mnStyles.logoMain }, '빅뱅학원')
      ),
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif' } }, `수능 D-${d}`),
        user && React.createElement('div', { style: mnStyles.mobileAvatar }, String(user.name || user.email || 'B').slice(0, 1).toUpperCase()),
        !user && adminAuthed && React.createElement('div', { style:{ ...mnStyles.mobileAvatar, background:'#111827' } }, 'A'),
        React.createElement('button', {
          onClick: () => setMenuOpen(!menuOpen),
          style: mnStyles.hamburgerBtn
        },
          React.createElement('div', { style:{ ...mnStyles.hamburgerLine, transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' } }),
          React.createElement('div', { style:{ ...mnStyles.hamburgerLine, opacity: menuOpen ? 0 : 1 } }),
          React.createElement('div', { style:{ ...mnStyles.hamburgerLine, transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' } })
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
          onClick: () => {
            goPageByLabel(label);
            setMenuOpen(false);
          }
        }, label)
      ),
      React.createElement('div', { style:{ borderTop:'1px solid rgba(0,0,0,0.08)', marginTop:'8px', paddingTop:'8px' } },
        React.createElement(TopNavAuthButtons, {
          user,
          adminAuthed,
          onLoginClick,
          onSignupClick,
          onAdminClick,
          onLogout,
          setPage,
          isMobile: true,
          closeMenu: () => setMenuOpen(false),
        })
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
  ctaBtn: { background:'#00754A', color:'#fff', border:'1px solid #00754A', borderRadius:'8px', padding:'9px 20px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s', whiteSpace:'nowrap' },
  ctaBtnOutline: { background:'transparent', color:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,0,0,0.2)', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s' },
  adminBtn: { background:'#111827', color:'#fff', border:'1px solid #111827', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', cursor:'pointer', whiteSpace:'nowrap' },
  logoutLink: { fontSize:'12px', color:'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
  userBadge: { display:'flex', alignItems:'center', gap:'8px' },
  avatar: { width:'34px', height:'34px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' },
  userName: { fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' },
  mobileBar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:'56px' },
  mobileAvatar: { width:'28px', height:'28px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' },
  hamburgerBtn: { background:'none', border:'none', cursor:'pointer', padding:'4px', display:'flex', flexDirection:'column', gap:'5px' },
  hamburgerLine: { width:'22px', height:'2px', background:'rgba(0,0,0,0.7)', borderRadius:'1px', transition:'all 0.2s' },
  mobileMenu: { background:'#fff', borderTop:'1px solid rgba(0,0,0,0.08)', padding:'8px 0 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' },
  mobileMenuItem: { padding:'14px 20px', fontSize:'15px', fontWeight:'500', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em' },
};

Object.assign(window, { TopBar, MainNav, TopNavAuthButtons });
