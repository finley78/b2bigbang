// TopNav.jsx — Top utility bar + Main navigation (반응형)
const NAV_LINKS = ['학원안내', '프로그램', '모집안내', '강의실', '문의하기', '레벨테스트'];
const PAGE_MAP  = { '학원안내':'about', '프로그램':'service', '모집안내':'recruit', '강의실':'portal', '문의하기':'contact', '레벨테스트':'leveltest' };

function dDay(targetDateStr) {
  const target = new Date(targetDateStr);
  const today  = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
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

  return React.createElement('nav', { style: { ...mnStyles.nav, position: 'sticky', top: 0, zIndex: 100 } },

    // 데스크탑 네비
    !isMobile && React.createElement('div', { style: mnStyles.inner },
      // 로고
      React.createElement('div', { style: mnStyles.logo, onClick: () => setPage('home') },
        React.createElement('div', { style: mnStyles.logoMark },
          React.createElement('img', { src: 'icons/web-app-manifest-192x192.png', alt: 'B2빅뱅학원', style: { width:'100%', height:'100%', objectFit:'cover', display:'block', transform:'scale(1.45)' } })
        ),
        React.createElement('div', { style: mnStyles.logoText },
          React.createElement('div', { style: mnStyles.logoMain }, '빅뱅학원'),
          React.createElement('div', { style: mnStyles.logoSub }, 'Big Bang Academy')
        )
      ),
      // 링크
      React.createElement('div', { style: mnStyles.links },
        NAV_LINKS.map(label =>
          React.createElement('span', {
            key: label,
            style: {
              ...mnStyles.link,
              color: page === PAGE_MAP[label] ? '#E60012' : 'rgba(0,0,0,0.87)',
              borderBottom: page === PAGE_MAP[label] ? '2px solid #E60012' : '2px solid transparent',
            },
            onClick: () => {
              if (label === '강의실') { if (!user && !adminAuthed) { onLoginClick(); return; } }
              setPage(PAGE_MAP[label] || 'home');
            }
          }, label)
        )
      ),
      // 우측 버튼들
      React.createElement('div', { style: mnStyles.cta },
        user
          ? React.createElement('div', { style: { display:'flex', alignItems:'center', gap:'12px' } },
              React.createElement('div', { style: mnStyles.userBadge },
                React.createElement('div', { style: mnStyles.avatar }, (user.name || '?')[0]),
                React.createElement('span', { style: mnStyles.userName }, user.name || '')
              ),
              React.createElement('button', { onClick: onLogout, style:{ background:'transparent', color:'#E60012', border:'1px solid #E60012', borderRadius:'8px', padding:'6px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s' } }, '로그아웃')
            )
          : React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
              React.createElement('button', { style: mnStyles.ctaBtnOutline, onClick: onLoginClick }, '로그인'),
              React.createElement('button', { style: mnStyles.ctaBtn, onClick: onSignupClick || onLoginClick }, '회원가입')
            )
      )
    ),

    // 모바일 네비
    isMobile && React.createElement('div', { style: mnStyles.mobileBar },
      // 로고
      React.createElement('div', { style: mnStyles.logo, onClick: () => { setPage('home'); setMenuOpen(false); } },
        React.createElement('div', { style: { ...mnStyles.logoMark, width:'44px', height:'44px', fontSize:'12px' } },
          React.createElement('img', { src: 'icons/web-app-manifest-192x192.png', alt: 'B2빅뱅학원', style: { width:'100%', height:'100%', objectFit:'cover', display:'block', transform:'scale(1.45)' } })
        ),
        React.createElement('div', { style: mnStyles.logoMain }, '빅뱅학원')
      ),
      // 우측: D-day + 햄버거
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#000000', fontFamily:'Manrope, sans-serif' } }, `수능 D-${d}`),
        user && React.createElement('div', { style:{ width:'28px', height:'28px', borderRadius:'50%', background:'#E60012', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, (user.name || '?')[0]),
        // 햄버거 버튼
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

    // 모바일 드롭다운 메뉴
    isMobile && menuOpen && React.createElement('div', { style: mnStyles.mobileMenu },
      NAV_LINKS.map(label =>
        React.createElement('div', {
          key: label,
          style: {
            ...mnStyles.mobileMenuItem,
            color: page === PAGE_MAP[label] ? '#E60012' : 'rgba(0,0,0,0.87)',
            fontWeight: page === PAGE_MAP[label] ? '700' : '500',
          },
          onClick: () => {
            if (label === '강의실') { if (!user && !adminAuthed) { onLoginClick(); setMenuOpen(false); return; } }
            setPage(PAGE_MAP[label] || 'home');
            setMenuOpen(false);
          }
        }, label)
      ),
      React.createElement('div', { style:{ borderTop:'1px solid rgba(0,0,0,0.08)', marginTop:'8px', paddingTop:'8px' } },
        user
          ? React.createElement('div', null,
              React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'rgba(0,0,0,0.45)' }, onClick:()=>{ onLogout(); setMenuOpen(false); } }, '로그아웃')
            )
          : React.createElement('div', null,
              React.createElement('div', { style:{ ...mnStyles.mobileMenuItem }, onClick:()=>{ onLoginClick(); setMenuOpen(false); } }, '로그인'),
              React.createElement('div', { style:{ ...mnStyles.mobileMenuItem, color:'#E60012', fontWeight:'700' }, onClick:()=>{ (onSignupClick || onLoginClick)(); setMenuOpen(false); } }, '회원가입')
            )
      )
    ),
    // 모바일 로그아웃 버튼 (로그인 상태)
    isMobile && menuOpen && user && React.createElement('div', { style:{ background:'#fff', borderTop:'1px solid rgba(0,0,0,0.06)', padding:'12px 20px' } },
      React.createElement('button', {
        onClick:()=>{ onLogout(); setMenuOpen(false); },
        style:{ width:'100%', background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'10px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, '로그아웃')
    )
  );
}

const mnStyles = {
  nav: { background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', zIndex:100 },
  inner: { maxWidth:'1280px', margin:'0 auto', height:'72px', display:'flex', alignItems:'center', gap:'40px', padding:'0 40px' },
  logo: { display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', flexShrink:0 },
  logoMark: { width:'56px', height:'56px', borderRadius:'50%', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', overflow:'hidden' },
  logoText: { display:'flex', flexDirection:'column' },
  logoMain: { fontSize:'17px', fontWeight:'800', color:'#000000', letterSpacing:'-0.5px', lineHeight:'1.1', fontFamily:'Manrope, sans-serif' },
  logoSub: { fontSize:'9px', fontWeight:'500', color:'rgba(0,0,0,0.4)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' },
  links: { display:'flex', gap:'28px', flex:1, justifyContent:'center' },
  link: { fontSize:'14px', fontWeight:'600', letterSpacing:'-0.01em', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'color 0.2s', paddingBottom:'2px' },
  cta: { flexShrink:0 },
  ctaBtn: { background:'#1E3932', color:'#fff', border:'1px solid #1E3932', borderRadius:'8px', padding:'9px 20px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s', whiteSpace:'nowrap' },
  ctaBtnOutline: { background:'transparent', color:'rgba(0,0,0,0.7)', border:'1px solid rgba(0,0,0,0.2)', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em', transition:'all 0.2s' },
  userBadge: { display:'flex', alignItems:'center', gap:'8px' },
  avatar: { width:'34px', height:'34px', borderRadius:'50%', background:'#E60012', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' },
  userName: { fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' },

  // 모바일
  mobileBar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:'56px' },
  mobileMenu: { background:'#fff', borderTop:'1px solid rgba(0,0,0,0.08)', padding:'8px 0 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' },
  mobileMenuItem: { padding:'14px 20px', fontSize:'15px', fontWeight:'500', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', cursor:'pointer', letterSpacing:'-0.01em' },
};

Object.assign(window, { MainNav });
