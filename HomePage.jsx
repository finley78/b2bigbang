// HomePage.jsx — 완전 반응형 버전

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

function getBannerYoutubeId(url) {
  if (!url) return null;
  const match = String(url).match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function HeroBanner({ banners, isAdmin, onEdit, onSelectBanner }) {
  // 모든 hook은 early return 전에 호출 — hook 호출 개수가 렌더마다 일관되어야 함 (React error #310 방지)
  const isMobile = useIsMobile();
  const active = banners.filter(b => b.active);
  const hasMany = active.length > 1;
  // 무한 캐러셀: [마지막 복제, ...실제, 첫 복제] 형태로 렌더해서 끝→처음 회전을 자연스럽게
  const extended = hasMany ? [active[active.length - 1]].concat(active, [active[0]]) : active;
  // idx 는 extended 배열의 위치. 다중 배너면 1번부터(첫 실제 카드) 시작
  const [idx, setIdx] = React.useState(hasMany ? 1 : 0);
  const [transition, setTransition] = React.useState(true);
  const touchRef = React.useRef({ startX: 0, startY: 0, locked: false, dragging: false });

  // active 배너 개수가 바뀌면 idx 리셋
  React.useEffect(() => {
    setIdx(hasMany ? 1 : 0);
    setTransition(true);
  }, [active.length]);

  // 자동 슬라이드 — 단순히 +1 (modulo 안 씀, 끝의 복제까지 가서 부드럽게 회전)
  React.useEffect(() => {
    if (!hasMany || !isMobile) return;
    const t = setInterval(() => {
      setTransition(true);
      setIdx(i => i + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [active.length, isMobile]);

  // 점프 후 다음 프레임에 트랜지션 다시 활성화
  React.useEffect(() => {
    if (transition) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransition(true));
    });
    return () => cancelAnimationFrame(id);
  }, [transition]);

  // PC는 선생님 전용이므로 히어로 배너 숨김 (PWA만 렌더)
  if (!isMobile) return null;
  if (!active.length) return null;

  // 폰: 카드형 3D 캐러셀
  const realIdx = hasMany ? ((idx - 1 + active.length) % active.length) : 0;
  const b = active[realIdx];
  const accentColor = b.bg || '#E60012';

  function next() { setTransition(true); setIdx(i => i + 1); }
  function prev() { setTransition(true); setIdx(i => i - 1); }
  function gotoReal(i) { setTransition(true); setIdx(hasMany ? i + 1 : i); }

  // 트랜지션이 끝났을 때 복제 카드 위치면 실제 위치로 무음 점프
  function onTransitionEnd() {
    if (!hasMany) return;
    if (idx >= extended.length - 1) {
      setTransition(false);
      setIdx(1);
    } else if (idx <= 0) {
      setTransition(false);
      setIdx(extended.length - 2);
    }
  }

  function onTouchStart(e) {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, locked: false, dragging: true };
  }
  function onTouchMove(e) {
    if (!touchRef.current.dragging || touchRef.current.locked) return;
    const dx = Math.abs(e.touches[0].clientX - touchRef.current.startX);
    const dy = Math.abs(e.touches[0].clientY - touchRef.current.startY);
    if (dx > dy && dx > 8) touchRef.current.locked = true;
  }
  function onTouchEnd(e) {
    if (!touchRef.current.dragging) return;
    const diff = touchRef.current.startX - e.changedTouches[0].clientX;
    touchRef.current.dragging = false;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
    }
  }

  return React.createElement('div', { style: { position:'relative', background:'#f8fafc' } },
    // 상단 컬러 액센트 (활성 카드 색)
    React.createElement('div', { style:{ height:'2px', background: accentColor, transition:'background-color 0.6s ease' } }),
    // 부드러운 컬러 워시 (배경에 반영)
    React.createElement('div', { style:{ position:'absolute', top:'2px', left:0, right:0, height:'160px', background:`linear-gradient(to bottom, ${accentColor}22, transparent)`, transition:'background 0.6s ease', pointerEvents:'none' } }),

    // 카드 슬라이더 (3D perspective 적용)
    React.createElement('div', {
      style:{ overflow:'hidden', padding: isMobile ? '20px 12px 14px' : '32px 40px 22px', position:'relative', perspective:'800px' },
      onTouchStart, onTouchMove, onTouchEnd,
    },
      React.createElement('div', {
        onTransitionEnd: onTransitionEnd,
        style:{
          display:'flex',
          transform:`translateX(-${idx * 100}%)`,
          transition: transition ? 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          willChange:'transform',
          transformStyle:'preserve-3d',
        }
      },
        extended.map(function(card, i) {
          const ytId = getBannerYoutubeId(card.youtube);
          const directVideo = card.video_url || '';
          const isActive = i === idx;
          // 활성 카드 기준 좌우 카드는 안쪽으로 회전 (마름모 효과)
          const offset = i - idx;
          const rotateDeg = Math.max(-50, Math.min(50, offset * 45));
          // 거리에 따라 살짝 작아지게 (깊이감 강조)
          const isFar = Math.abs(offset) >= 1;
          const cardScale = isFar ? 0.86 : 1;
          const cardOpacity = Math.abs(offset) >= 2 ? 0 : 1; // 멀리 있는 건 숨김(성능/혼란 방지)
          return React.createElement('div', {
            key: i,
            onClick: function() { if (onSelectBanner && isActive) onSelectBanner(card); },
            style:{
              flex:'0 0 100%',
              padding:'0 6px',
              boxSizing:'border-box',
              cursor: onSelectBanner ? 'pointer' : 'default',
              display:'flex',
              justifyContent:'center',
              transform:`rotateY(${rotateDeg}deg) scale(${cardScale})`,
              transformStyle:'preserve-3d',
              transition: transition ? 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease' : 'none',
              opacity: cardOpacity,
              willChange:'transform',
            },
          },
            React.createElement('div', {
              style:{
                width:'100%',
                maxWidth: isMobile ? 'none' : '480px',
                borderRadius:'16px',
                overflow:'hidden',
                boxShadow:`0 1px 2px rgba(0,0,0,0.08), 0 10px 28px ${card.bg}1A`,
                position:'relative',
                transition:'box-shadow 0.4s ease',
                aspectRatio:'2/3',
                background:`linear-gradient(135deg, ${card.bg}, ${card.bg}DD)`,
              }
            },
              // 미디어 영역 — 카드 전체를 덮음 (텍스트 영역 제거됨, 사진에 직접 글씨 넣을 것)
              React.createElement('div', {
                style:{
                  position:'absolute', inset:0,
                  overflow:'hidden',
                }
              },
                directVideo
                  ? React.createElement('video', {
                      src: directVideo,
                      style:{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' },
                      autoPlay: true, muted: true, loop: true, playsInline: true,
                      preload: 'metadata',
                    })
                  : ytId
                    ? React.createElement('iframe', {
                        src:`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&modestbranding=1&rel=0`,
                        style:{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'177.78%', height:'100%', border:'none', pointerEvents:'none' },
                        allow:'autoplay; encrypted-media',
                        title: card.title || '',
                      })
                    : card.image
                      ? React.createElement('img', {
                          src: card.image,
                          alt: card.title || '',
                          style:{ width:'100%', height:'100%', objectFit:'cover', display:'block' },
                          loading: i === 0 ? 'eager' : 'lazy',
                        })
                      : React.createElement('div', { style:{ position:'absolute', inset:0, opacity:0.12 } },
                          React.createElement('svg', { width:'100%', height:'100%' },
                            React.createElement('pattern', { id:'gridb-'+i, x:0, y:0, width:40, height:40, patternUnits:'userSpaceOnUse' },
                              React.createElement('path', { d:'M 40 0 L 0 0 0 40', fill:'none', stroke:'#fff', strokeWidth:'0.5' })
                            ),
                            React.createElement('rect', { width:'100%', height:'100%', fill:'url(#gridb-'+i+')' })
                          )
                        ),
                // 영상 인디케이터 (직접 영상이거나 유튜브일 때)
                (directVideo || ytId) && React.createElement('div', {
                  style:{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.55)', color:'#fff', fontSize:'10px', fontWeight:'700', padding:'3px 8px', borderRadius:'6px', fontFamily:'Manrope, sans-serif', zIndex:2 }
                }, '▶ 영상')
              )
            )
          );
        })
      )
    ),
    // 페이지네이션 닷
    active.length > 1 && React.createElement('div', {
      style:{ display:'flex', justifyContent:'center', alignItems:'center', gap:'4px', padding:'2px 0 18px' }
    },
      active.map(function(_, i) {
        return React.createElement('button', {
          key:i,
          onClick:function(){ gotoReal(i); },
          'aria-label': '슬라이드 ' + (i+1),
          style:{
            border:'none',
            background:'none',
            padding:'8px 4px',
            cursor:'pointer',
            WebkitTapHighlightColor:'transparent',
          }
        },
          React.createElement('div', {
            style:{
              width: i===realIdx ? 22 : 6,
              height: 6,
              borderRadius:'3px',
              background: i===realIdx ? accentColor : 'rgba(0,0,0,0.18)',
              transition:'all 0.35s ease'
            }
          })
        );
      })
    ),
    isAdmin && React.createElement('button', {
      onClick: function(e){ e.stopPropagation(); onEdit && onEdit(); },
      style:{ position:'absolute', top:'14px', right:'14px', zIndex:4, background:'rgba(248,181,0,0.9)', color:'#fff', border:'none', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
    }, '✏ 배너 편집')
  );
}

function BannerDetailPage({ banner, onBack, setPage }) {
  const isMobile = useIsMobile();
  const PAGE_BG = isMobile ? '#f8fafc' : '#f2f0eb';
  const ytId = getBannerYoutubeId(banner.youtube);
  const directVideo = banner.video_url || '';
  // PC는 그린 톤 강제, PWA는 DB의 banner.bg 사용
  const accent = isMobile ? (banner.bg || '#E60012') : '#006241';

  function handleCta() {
    var dest = banner.link_to || banner.linkPage || banner.link || '';
    if (!dest) { if (setPage) setPage('contact'); return; }
    if (/^https?:\/\//i.test(dest)) { window.open(dest, '_blank', 'noopener'); return; }
    if (setPage) setPage(dest);
  }

  return React.createElement('div', { style:{ background: PAGE_BG, minHeight:'80vh' } },
    React.createElement('div', { style:{ height:'4px', background: accent } }),
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color: accent, fontFamily:'Manrope, sans-serif' } }, '← 홈으로')
    ),
    React.createElement('div', { style:{ maxWidth:'820px', margin:'0 auto', padding: isMobile ? '20px 16px' : '32px' } },
      (directVideo || ytId || banner.image) && React.createElement('div', {
        style:{ borderRadius:'14px', overflow:'hidden', aspectRatio:'16/9', marginBottom:'22px', background:`linear-gradient(135deg, ${accent}, ${accent}DD)` }
      },
        directVideo
          ? React.createElement('video', { src: directVideo, controls:true, autoPlay:true, playsInline:true, style:{ width:'100%', height:'100%', objectFit:'contain', background:'#000', display:'block' } })
          : ytId
            ? React.createElement('iframe', { width:'100%', height:'100%', src:`https://www.youtube.com/embed/${ytId}?autoplay=1`, frameBorder:'0', allowFullScreen:true, style:{ display:'block', border:'none' } })
            : React.createElement('img', { src: banner.image, alt: banner.title || '', style:{ width:'100%', height:'100%', objectFit:'cover', display:'block' } })
      ),
      banner.badge && React.createElement('span', {
        style:{ display:'inline-block', background:`${accent}22`, color: accent, borderRadius:'6px', padding:'4px 12px', fontSize:'12px', fontWeight:'700', letterSpacing:'0.04em', marginBottom:'10px', fontFamily:'Manrope, sans-serif' }
      }, banner.badge),
      banner.subtitle && React.createElement('div', {
        style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'6px' }
      }, banner.subtitle),
      React.createElement('h1', { style:{ fontSize: isMobile?'24px':'30px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.2px', lineHeight:'1.3', marginBottom:'18px' } }, banner.title),
      banner.label && React.createElement('div', {
        style:{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#fff', border:`1px solid ${accent}30`, borderRadius:'10px', padding:'10px 16px', marginBottom:'24px' }
      },
        React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif' } }, '개강'),
        React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color: accent, fontFamily:'Manrope, sans-serif' } }, banner.label)
      ),
      banner.description && React.createElement('div', {
        style:{ fontSize:'15px', color:'rgba(0,0,0,0.75)', lineHeight:'1.8', fontFamily:'Manrope, sans-serif', marginBottom:'24px', whiteSpace:'pre-line' }
      }, banner.description),
      banner.cta && React.createElement('button', {
        onClick: handleCta,
        style:{ background: accent, color:'#fff', border:'none', borderRadius:'10px', padding:'14px 28px', fontSize:'15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, banner.cta)
    )
  );
}

function SplitSection({ notices, announcements, isAdmin, onEditNotices, onSelectNotice, slides }) {
  const isMobile = useIsMobile();
  // PC는 예전 스타벅스 그린 톤, PWA(모바일)는 현재 메가스터디 톤
  const PAGE_BG = isMobile ? '#f8fafc' : '#f2f0eb';
  const ACCENT = isMobile ? '#E60012' : '#006241';
  const ACCENT_BG = isMobile ? '#FFEBED' : '#d4e9e2';
  const GOLD_BTN_LIGHT_BG = isMobile ? 'rgba(248,181,0,0.15)' : 'rgba(203,162,88,0.15)';
  const GOLD_BTN_COLOR = isMobile ? '#F8B500' : '#cba258';
  const [slideIdx, setSlideIdx] = React.useState(0);
  // PC 슬라이드는 그린 톤으로 fallback (기본 슬라이드)
  const defaultSlides = isMobile
    ? [
        { bg:'#1A1A1A', text1:'최고의 결과를 만든다', text2:'B2빅뱅 학습 시스템', accent:'2027 합격이 보인다', image:'', youtube:'' },
        { bg:'#E60012', text1:'체계적인 커리큘럼', text2:'전문 강사진의 1:1 관리', accent:'목표 대학을 향해', image:'', youtube:'' },
      ]
    : [
        { bg:'#1E3932', text1:'최고의 결과를 만든다', text2:'B2빅뱅 학습 시스템', accent:'2027 합격이 보인다', image:'', youtube:'' },
        { bg:'#006241', text1:'체계적인 커리큘럼', text2:'전문 강사진의 1:1 관리', accent:'목표 대학을 향해', image:'', youtube:'' },
      ];
  const allSlides = (slides && slides.length) ? slides : defaultSlides;

  React.useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i+1)%allSlides.length), 5000);
    return () => clearInterval(t);
  }, [allSlides.length]);

  const s = allSlides[slideIdx];
  // PC 슬라이드 배경: index.html INITIAL_STATE의 메가스터디 톤(#1A1A1A/#E60012) 무시하고 그린 팔레트 사용
  const PC_SLIDE_PALETTE = ['#1E3932', '#006241'];
  const slideBg = isMobile ? s.bg : PC_SLIDE_PALETTE[slideIdx % PC_SLIDE_PALETTE.length];

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }
  const ytId = getYoutubeId(s.youtube);

  return React.createElement('div', { style: { background: PAGE_BG, padding: isMobile ? '16px' : '24px 40px', overflow:'hidden' } },
    React.createElement('div', { style: { maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px', width:'100%', alignItems:'stretch' } },
      !isMobile && React.createElement('div', { style: { borderRadius:'12px', overflow:'hidden', position:'relative', minHeight:'280px', background: slideBg } },
        // 배경 이미지
        s.image && React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:`url(${s.image})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.6 } }),
        // 유튜브 임베드
        ytId
          ? React.createElement('iframe', { src:`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0`, style:{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }, allow:'autoplay' })
          : React.createElement('div', { style:{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', padding:'20px 24px', background: s.image ? 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' : 'none' } },
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.65)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, s.accent),
                React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', lineHeight:'1.3', fontFamily:'Manrope, sans-serif' } }, s.text1),
                React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(255,255,255,0.85)', lineHeight:'1.3', fontFamily:'Manrope, sans-serif' } }, s.text2)
              )
            ),
        !ytId && React.createElement('div', { style:{ position:'absolute', bottom:'14px', right:'16px', display:'flex', gap:'5px', zIndex:2 } },
          allSlides.map((_,i) => React.createElement('div', { key:i, onClick:()=>setSlideIdx(i), style:{ width:i===slideIdx?18:5, height:5, borderRadius:'3px', background:i===slideIdx?'#fff':'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.3s ease' } }))
        )
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
        React.createElement('div', { style:{ background: isMobile ? '#eef2f7' : '#fff', borderRadius:'12px', padding:'16px', boxShadow: isMobile ? 'none' : '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color: ACCENT, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom: isMobile ? '10px' : '6px', fontFamily:'Manrope, sans-serif' } }, 'B2빅뱅 학습 시스템'),
          !isMobile && React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', lineHeight:'1.4', fontFamily:'Manrope, sans-serif', marginBottom:'12px', whiteSpace:'pre-line' } }, '최고의 강사가 모인다\n최고의 합격이 보인다'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap: isMobile ? '14px' : '8px' } },
            notices.slice(0,4).map((n,i) =>
              React.createElement('div', { key:i, onClick:()=>onSelectNotice(n), style:{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: isMobile ? 'none' : '1px solid rgba(0,0,0,0.06)', paddingBottom: isMobile ? '0' : '7px', cursor:'pointer' },
                onMouseEnter:e=>e.currentTarget.style.opacity='0.7',
                onMouseLeave:e=>e.currentTarget.style.opacity='1' },
                React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', flex:1, minWidth:0, overflow:'hidden' } },
                  React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background: ACCENT_BG, color: ACCENT, borderRadius:'4px', padding:'2px 6px', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.type),
                  React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, n.text)
                ),
                !isMobile && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0, marginLeft:'8px', whiteSpace:'nowrap' } }, n.date)
              )
            )
          )
        ),
        // 공지사항: 폰=2x2 사진 카드 그리드, PC=옛날 텍스트 리스트
        isMobile
          ? React.createElement('div', null,
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항'),
                isAdmin && React.createElement('button', { onClick:onEditNotices, style:{ background: GOLD_BTN_LIGHT_BG, color: GOLD_BTN_COLOR, border:`1px solid ${GOLD_BTN_COLOR}`, borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 편집')
              ),
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' } },
                announcements.slice(0,4).map(function(a, i) {
                  var bg = a.image ? `url(${a.image})` : null;
                  var fallbackBgs = ['#1A1A1A','#F8B500','#e8e3d3','#a988a3'];
                  return React.createElement('div', {
                    key: a.id || i,
                    onClick: function(){ onSelectNotice(a); },
                    style:{
                      position:'relative',
                      aspectRatio:'10/12',
                      borderRadius:'14px',
                      overflow:'hidden',
                      cursor:'pointer',
                      background: bg ? '#000' : fallbackBgs[i % fallbackBgs.length],
                      boxShadow:'0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)',
                      transition:'transform 0.2s ease',
                    },
                    onMouseEnter: function(e){ e.currentTarget.style.transform='translateY(-2px)'; },
                    onMouseLeave: function(e){ e.currentTarget.style.transform='translateY(0)'; },
                  },
                    bg && React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage: bg, backgroundSize:'cover', backgroundPosition:'center' } }),
                    bg && React.createElement('div', { style:{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0) 100%)' } }),
                    React.createElement('div', { style:{ position:'absolute', top:'14px', left:'14px', right:'56px', fontSize:'15px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', lineHeight:'1.25', letterSpacing:'-0.16px', textShadow:'0 1px 4px rgba(0,0,0,0.35)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' } }, a.title),
                    React.createElement('div', { style:{ position:'absolute', top:'12px', right:'12px', width:'34px', height:'34px', borderRadius:'50%', background:'rgba(0,0,0,0.8)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'700' } }, '→')
                  );
                })
              )
            )
          : React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden' } },
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항'),
                isAdmin && React.createElement('button', { onClick:onEditNotices, style:{ background: GOLD_BTN_LIGHT_BG, color: GOLD_BTN_COLOR, border:`1px solid ${GOLD_BTN_COLOR}`, borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 편집')
              ),
              React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'7px' } },
                announcements.slice(0,4).map(function(a, i) {
                  return React.createElement('div', { key:a.id||i, onClick:function(){ onSelectNotice(a); }, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: i<3 ? '1px solid rgba(0,0,0,0.05)' : 'none', paddingBottom:'7px', cursor:'pointer' },
                    onMouseEnter:function(e){ e.currentTarget.style.opacity='0.7'; },
                    onMouseLeave:function(e){ e.currentTarget.style.opacity='1'; }
                  },
                    React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 } }, a.title),
                    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0, marginLeft:'8px' } }, a.date)
                  );
                })
              )
            )
      )
    )
  );
}

function StatsBand() {
  const isMobile = useIsMobile();
  const ACCENT = isMobile ? '#E60012' : '#006241';
  const stats = [
    { val:'10+', label:'년 교육 경험' },
    { val:'국·영·수·과', label:'전 과목 전문 강사진' },
    { val:'내신+수능', label:'통합 관리 시스템' },
    { val:'1:1', label:'맞춤형 학습 관리' },
  ];
  return React.createElement('div', { style:{ background:'#fff', padding: isMobile ? '24px 16px' : '32px 40px', borderTop:'1px solid rgba(0,0,0,0.06)' } },
    React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'16px', textAlign:'center' } },
      stats.map((s,i) =>
        React.createElement('div', { key:i, style:{ padding:'8px 0' } },
          React.createElement('div', { style:{ fontSize: isMobile ? '26px' : '34px', fontWeight:'800', color: ACCENT, fontFamily:'Manrope, sans-serif' } }, s.val),
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, s.label)
        )
      )
    )
  );
}

function FeatureBand({ setPage, isAdmin, content, onEdit }) {
  const isMobile = useIsMobile();
  const BAND_BG = isMobile ? '#1A1A1A' : '#1E3932';
  const ACCENT = isMobile ? '#E60012' : '#006241';
  const GOLD_BTN_BG = isMobile ? 'rgba(248,181,0,0.9)' : 'rgba(203,162,88,0.9)';
  return React.createElement('div', { style:{ background: BAND_BG, padding: isMobile ? '40px 16px' : '56px 40px', position:'relative' } },
    React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent:'space-between', gap: isMobile ? '20px' : '40px' } },
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, content.featureEyebrow || '지금 등록하면'),
        React.createElement('div', { style:{ fontSize: isMobile ? '30px' : '38px', fontWeight:'800', color:'#fff', lineHeight:'1.2', fontFamily:'Manrope, sans-serif', marginBottom:'12px', whiteSpace:'pre-line' } }, content.featureTitle || '첫 달 수강료\n50% 할인'),
        React.createElement('div', { style:{ fontSize:'15px', color:'rgba(255,255,255,0.65)', lineHeight:'1.7', marginBottom:'24px', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line' } }, content.featureBody || '신규 등록생 한정 · 선착순 마감\n지금 바로 문의해 주세요'),
        React.createElement('div', { style:{ display:'flex', gap:'12px', flexWrap:'wrap' } },
          React.createElement('button', { onClick:()=>setPage('contact'), style:{ background:'#fff', color: ACCENT, border:'1px solid #fff', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
            onMouseDown:e=>e.currentTarget.style.transform='scale(0.95)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' },
            content.featureCta1 || '지금 문의하기'
          ),
          React.createElement('button', { onClick:()=>setPage('service'), style:{ background:'transparent', color:'#fff', border:'1px solid #fff', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
            onMouseDown:e=>e.currentTarget.style.transform='scale(0.95)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' },
            content.featureCta2 || '프로그램 보기'
          )
        )
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'row', gap:'12px' } },
        [{ val:'50%', label:'첫 달 수강료 할인' }, { val:'무료', label:'첫 상담 진행' }].map((item,i)=>
          React.createElement('div', { key:i, style:{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px', padding: isMobile ? '16px 20px' : '18px 28px', textAlign:'center', flex:1 } },
            React.createElement('div', { style:{ fontSize: isMobile ? '26px' : '32px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, item.val),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, item.label)
          )
        )
      )
    ),
    isAdmin && React.createElement('button', { onClick:onEdit, style:{ position:'absolute', top:'12px', right:'12px', background: GOLD_BTN_BG, color:'#fff', border:'none', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 편집')
  );
}

/* ── Notice Detail Page ─────────────────────── */
function NoticeDetailPage({ notice, onBack, setPage }) {
  const isMobile = useIsMobile();
  const PAGE_BG = isMobile ? '#f8fafc' : '#f2f0eb';
  const ACCENT = isMobile ? '#E60012' : '#006241';
  const ACCENT_BG = isMobile ? '#FFEBED' : '#d4e9e2';

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }

  const ytId = getYoutubeId(notice.youtube);

  // CTA 버튼 클릭 처리
  function handleCta() {
    var dest = notice.link_to || '';
    if (!dest) { if (setPage) setPage('contact'); return; }
    if (/^https?:\/\//i.test(dest)) { window.open(dest, '_blank', 'noopener'); return; }
    if (setPage) setPage(dest);
  }

  return React.createElement('div', { style:{ background: PAGE_BG, minHeight:'80vh' } },
    // 뒤로가기
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color: ACCENT, fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'6px' } }, '← 목록으로')
    ),
    // 본문
    React.createElement('div', { style:{ maxWidth:'720px', margin:'0 auto', padding: isMobile ? '24px 16px' : '40px' } },
      // 카테고리 뱃지 (notices만)
      notice.type && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background: ACCENT_BG, color: ACCENT, borderRadius:'4px', padding:'3px 8px', fontFamily:'Manrope, sans-serif', display:'inline-block', marginBottom:'12px' } }, notice.type),
      // 카드 이미지 (announcements에 image 있을 때)
      notice.image && React.createElement('div', { style:{ marginBottom:'18px', borderRadius:'12px', overflow:'hidden', aspectRatio:'10/13', maxWidth:'360px', background:'#000' } },
        React.createElement('img', { src: notice.image, alt: notice.title || '', style:{ width:'100%', height:'100%', objectFit:'cover', display:'block' } })
      ),
      // 제목
      React.createElement('h1', { style:{ fontSize: isMobile ? '22px' : '28px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px', lineHeight:'1.3', marginBottom:'8px' } }, notice.text || notice.title),
      // 날짜
      React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid rgba(0,0,0,0.08)' } }, notice.date),
      // 본문 내용
      notice.content && React.createElement('div', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif', lineHeight:'1.8', marginBottom:'24px', whiteSpace:'pre-line' } }, notice.content),
      // 유튜브 임베드
      ytId && React.createElement('div', { style:{ marginBottom:'24px', borderRadius:'12px', overflow:'hidden', aspectRatio:'16/9' } },
        React.createElement('iframe', { width:'100%', height:'100%', src:`https://www.youtube.com/embed/${ytId}`, frameBorder:'0', allowFullScreen:true, style:{ display:'block' } })
      ),
      // CTA 버튼들 (관리자가 설정한 cta + 외부 링크)
      React.createElement('div', { style:{ display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'8px' } },
        notice.cta && React.createElement('button', {
          onClick: handleCta,
          style:{ display:'inline-flex', alignItems:'center', gap:'8px', background: ACCENT, color:'#fff', border:'none', borderRadius:'10px', padding:'14px 28px', fontSize:'15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
        }, notice.cta),
        notice.link && !notice.cta && React.createElement('a', { href:notice.link, target:'_blank', rel:'noopener noreferrer', style:{ display:'inline-flex', alignItems:'center', gap:'8px', background: ACCENT, color:'#fff', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', fontFamily:'Manrope, sans-serif', textDecoration:'none' } }, '🔗 자세히 보기')
      )
    )
  );
}

/* ── 레벨테스트 신청 CTA (메인 페이지) ─────────────── */
function LevelTestCTA({ user, onLoginClick, setPage }) {
  const isMobile = useIsMobile();
  const sb = window.supabase;
  const [tests, setTests] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [signupPromptOpen, setSignupPromptOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ school_level:'중', grade:'', semester:'', score:'' });
  const [submitting, setSubmitting] = React.useState(false);
  const [myReqs, setMyReqs] = React.useState({});

  React.useEffect(function(){
    (async function(){
      try {
        const { data } = await sb.from('exams').select('*').eq('kind','level').eq('status','open').order('created_at', { ascending:false });
        setTests(data || []);
        if (user && user.id) {
          const { data: reqs } = await sb.from('level_test_requests').select('*').eq('student_id', user.id);
          const m = {}; (reqs || []).forEach(function(r){ m[r.exam_id] = r; });
          setMyReqs(m);
        }
      } catch (e) { console.error('레벨테스트 CTA 로드 실패:', e); }
      finally { setLoaded(true); }
    })();
  }, [user]);

  function pickMatching(school_level, grade, semester, score) {
    const matched = tests.filter(function(ex){
      if (ex.school_level && ex.school_level !== school_level) return false;
      if (ex.target_grade && String(ex.target_grade) !== String(grade)) return false;
      if (ex.target_semester && semester && String(ex.target_semester) !== String(semester)) return false;
      if (ex.min_score != null && score < ex.min_score) return false;
      if (ex.max_score != null && score > ex.max_score) return false;
      return true;
    });
    if (matched.length === 0) return null;
    const both = matched.filter(function(ex){ return ex.target_semester && semester && String(ex.target_semester) === String(semester); });
    return both.length > 0 ? both[0] : matched[0];
  }

  function openForm() {
    if (tests.length === 0) { alert('현재 신청 가능한 레벨테스트가 없습니다.\n곧 새로운 시험이 등록될 예정입니다.'); return; }
    if (!user) { setSignupPromptOpen(true); return; }
    setDraft({ school_level:'중', grade:'', semester:'', score:'' });
    setFormOpen(true);
  }

  async function submit() {
    if (!user) { alert('로그인 후 신청할 수 있습니다.'); return; }
    if (!draft.school_level) { alert('학교급을 선택해 주세요.'); return; }
    if (!draft.grade) { alert('학년을 선택해 주세요.'); return; }
    const sc = parseInt(draft.score, 10);
    if (isNaN(sc) || sc < 0 || sc > 100) { alert('내신 점수를 0~100 사이로 입력해 주세요.'); return; }
    const matched = pickMatching(draft.school_level, draft.grade, draft.semester, sc);
    if (!matched) { alert('입력하신 정보에 맞는 레벨테스트가 없습니다.\n관리자에게 문의해 주세요.'); return; }
    setSubmitting(true);
    try {
      const { error } = await sb.from('level_test_requests').insert({
        exam_id: matched.id, student_id: user.id, student_name: user.name || '',
        school_level: draft.school_level, grade: draft.grade,
        semester: draft.semester || null, score: sc,
      });
      if (error && !String(error.message||'').includes('duplicate')) throw error;
      const { data: reqs } = await sb.from('level_test_requests').select('*').eq('student_id', user.id);
      const m = {}; (reqs || []).forEach(function(r){ m[r.exam_id] = r; });
      setMyReqs(m);
      setFormOpen(false);
      const goPortal = confirm('"' + matched.title + '" 시험이 매칭되었습니다.\n지금 강의실로 이동해서 응시하시겠습니까?');
      if (goPortal && setPage) setPage('portal');
    } catch (e) { alert('신청 실패: ' + (e.message || e)); }
    finally { setSubmitting(false); }
  }

  if (!loaded) return null;

  const hasMyReq = Object.keys(myReqs).length > 0;
  const hasTests = tests.length > 0;
  return React.createElement('div', { style:{ background:'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)', padding: isMobile ? '28px 16px' : '36px 40px' } },
    React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent:'space-between', gap: isMobile ? '16px' : '24px' } },
      React.createElement('div', { style:{ flex:1 } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' } },
          React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.7)', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, '🎯 LEVEL TEST'),
          !hasTests && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:'999px', padding:'2px 9px', fontFamily:'Manrope, sans-serif' } }, '준비 중')
        ),
        React.createElement('div', { style:{ fontSize: isMobile ? '22px' : '28px', fontWeight:'800', color:'#fff', lineHeight:'1.3', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } }, '내 실력에 맞는 레벨테스트, 무료로 신청'),
        React.createElement('div', { style:{ fontSize:'13px', color:'rgba(255,255,255,0.75)', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, hasTests ? ('학교급·학년·내신 점수에 맞는 시험이 자동으로 매칭되어 집에서 응시할 수 있습니다.' + (user ? '' : ' (회원가입 후 신청)')) : '곧 새로운 레벨테스트가 등록될 예정입니다. 회원가입 후 알림을 받아보세요.')
      ),
      React.createElement('div', { style:{ display:'flex', gap:'10px', flexShrink:0, flexWrap:'wrap' } },
        hasMyReq && React.createElement('button', { onClick:function(){ if (setPage) setPage('portal'); }, style:{ background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.55)', borderRadius:'10px', padding:'12px 22px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '내 신청 보기'),
        React.createElement('button', { onClick:openForm, style:{ background:'#fff', color:'#1d4ed8', border:'none', borderRadius:'10px', padding:'12px 26px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', boxShadow:'0 8px 20px rgba(0,0,0,0.18)', opacity: hasTests ? 1 : 0.85 } }, hasMyReq ? '추가 신청' : '레벨테스트 신청')
      )
    ),

    /* 회원가입 안내 모달 (비로그인 사용자가 신청 시도) */
    signupPromptOpen && React.createElement('div', { onClick:function(){ setSignupPromptOpen(false); }, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
      React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'16px', padding:'32px 28px', width:'100%', maxWidth:'400px', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', fontFamily:'Manrope, sans-serif', textAlign:'center' } },
        React.createElement('div', { style:{ fontSize:'42px', marginBottom:'10px' } }, '🔒'),
        React.createElement('h3', { style:{ fontSize:'20px', fontWeight:'800', color:'#111827', margin:'4px 0 8px' } }, '회원가입이 필요합니다'),
        React.createElement('p', { style:{ fontSize:'14px', color:'#6b7280', lineHeight:'1.7', marginBottom:'22px' } }, '레벨테스트는 학원 회원만 신청할 수 있습니다.\n간단한 회원가입 후 본인에게 맞는 시험을 무료로 응시해 보세요.'),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
          React.createElement('button', { onClick:function(){ setSignupPromptOpen(false); if (setPage) setPage('signup'); }, style:{ background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'10px', padding:'14px', fontSize:'15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '회원가입하기'),
          React.createElement('button', { onClick:function(){ setSignupPromptOpen(false); if (onLoginClick) onLoginClick(); }, style:{ background:'#fff', color:'#1d4ed8', border:'1px solid #1d4ed8', borderRadius:'10px', padding:'13px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '이미 회원이신가요? 로그인'),
          React.createElement('button', { onClick:function(){ setSignupPromptOpen(false); }, style:{ background:'none', color:'#9ca3af', border:'none', padding:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '닫기')
        )
      )
    ),

    /* 신청 폼 모달 */
    formOpen && React.createElement('div', { onClick:function(){ setFormOpen(false); }, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
      React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'14px', padding:'24px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' } },
          React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 } }, '레벨테스트 신청'),
          React.createElement('button', { onClick:function(){ setFormOpen(false); }, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' } }, '×')
        ),
        React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'14px' } }, '학교급·학년·내신 성적에 맞는 시험이 자동으로 매칭됩니다.'),
        React.createElement('div', { style:{ marginBottom:'12px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학교급 *'),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            ['초','중','고'].map(function(s){
              const picked = draft.school_level === s;
              return React.createElement('button', { key:s, onClick:function(){ setDraft(Object.assign({}, draft, { school_level:s, grade:'' })); }, style:{ flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'800', fontFamily:'Manrope, sans-serif', background: picked ? '#1d4ed8' : '#fff', color: picked ? '#fff' : '#374151', border: '1px solid ' + (picked ? '#1d4ed8' : '#d1d5db') } }, s);
            })
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'10px' } },
          React.createElement('div', { style:{ flex:1 } },
            React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학년 *'),
            React.createElement('select', { value:draft.grade, onChange:function(e){ setDraft(Object.assign({}, draft, { grade:e.target.value })); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } },
              React.createElement('option', { value:'' }, '학년 선택'),
              (draft.school_level === '초' ? ['1','2','3','4','5','6'] : ['1','2','3']).map(function(g){ return React.createElement('option', { key:g, value:g }, g + '학년'); })
            )
          ),
          React.createElement('div', { style:{ flex:1 } },
            React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학기 (선택)'),
            React.createElement('select', { value:draft.semester, onChange:function(e){ setDraft(Object.assign({}, draft, { semester:e.target.value })); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } },
              React.createElement('option', { value:'' }, '학기 무관'),
              ['1','2'].map(function(s){ return React.createElement('option', { key:s, value:s }, s + '학기'); })
            )
          )
        ),
        React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginBottom:'10px' } }, '※ 선행 학습 중이라면 더 높은 학년/학기를 선택할 수 있습니다.'),
        React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '내신 성적 (0~100점) *'),
          React.createElement('input', { type:'number', min:'0', max:'100', value:draft.score, onChange:function(e){ setDraft(Object.assign({}, draft, { score:e.target.value })); }, placeholder:'예: 85', style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', fontFamily:'Manrope, sans-serif', boxSizing:'border-box' } })
        ),
        React.createElement('div', { style:{ display:'flex', gap:'8px' } },
          React.createElement('button', { onClick:function(){ setFormOpen(false); }, style:{ flex:1, background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer' } }, '취소'),
          React.createElement('button', { onClick:submit, disabled:submitting, style:{ flex:1, background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: submitting?'not-allowed':'pointer', opacity: submitting ? 0.6 : 1 } }, submitting ? '매칭 중...' : '시험 매칭 및 신청')
        )
      )
    )
  );
}

function HomePage({ banners, slides, categories, notices, announcements, setPage, isAdmin, content, onAdminAction, user, onLoginClick }) {
  const [selectedNotice, setSelectedNotice] = React.useState(null);
  const [selectedBanner, setSelectedBanner] = React.useState(null);

  if (selectedNotice) {
    return React.createElement(NoticeDetailPage, { notice:selectedNotice, setPage, onBack:()=>setSelectedNotice(null) });
  }
  if (selectedBanner) {
    return React.createElement(BannerDetailPage, { banner:selectedBanner, setPage, onBack:()=>setSelectedBanner(null) });
  }

  return React.createElement('div', null,
    React.createElement(HeroBanner, { banners, isAdmin, onEdit:()=>onAdminAction('banner'), onSelectBanner:setSelectedBanner }),
    React.createElement(LevelTestCTA, { user, onLoginClick, setPage }),
    React.createElement(SplitSection, { notices, announcements, isAdmin, onEditNotices:()=>onAdminAction('notice'), onSelectNotice:setSelectedNotice, slides }),
    React.createElement(StatsBand),
    React.createElement(FeatureBand, { setPage, isAdmin, content, onEdit:()=>onAdminAction('feature') })
  );
}

Object.assign(window, { HomePage });
