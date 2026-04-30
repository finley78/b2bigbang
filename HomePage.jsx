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

function HeroBanner({ banners, isAdmin, onEdit }) {
  const [idx, setIdx] = React.useState(0);
  const isMobile = useIsMobile();
  const active = banners.filter(b => b.active);

  React.useEffect(() => {
    if (active.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % active.length), 4000);
    return () => clearInterval(t);
  }, [active.length]);

  if (!active.length) return null;
  const b = active[idx];

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }
  const ytId = getYoutubeId(b.youtube);

  return React.createElement('div', { style: { position:'relative', overflow:'hidden', height: isMobile ? '220px' : '300px', background: b.bg } },
    // 배경 이미지
    b.image && React.createElement('div', { style:{ position:'absolute', inset:0, backgroundImage:`url(${b.image})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.4 } }),
    // 배경 유튜브
    ytId && React.createElement('div', { style:{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' } },
      React.createElement('iframe', { src:`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0`, style:{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'177.78vh', height:'100vh', minWidth:'100%', minHeight:'100%', opacity:0.4, border:'none' }, allow:'autoplay' })
    ),
    // 그리드 패턴 (이미지 없을 때)
    !b.image && !ytId && React.createElement('div', { style: { position:'absolute', inset:0, opacity:0.07 } },
      React.createElement('svg', { width:'100%', height:'100%', style:{position:'absolute',inset:0} },
        React.createElement('pattern', { id:'grid', x:0, y:0, width:40, height:40, patternUnits:'userSpaceOnUse' },
          React.createElement('path', { d:'M 40 0 L 0 0 0 40', fill:'none', stroke:'white', strokeWidth:'0.5' })
        ),
        React.createElement('rect', { width:'100%', height:'100%', fill:'url(#grid)' })
      )
    ),
    // 어두운 오버레이 (이미지/영상 있을 때)
    (b.image || ytId) && React.createElement('div', { style:{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' } }),
    // 콘텐츠
    React.createElement('div', { style: { position:'relative', zIndex:2, width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '0 16px' : '0 40px', boxSizing:'border-box' } },
      React.createElement('div', { style:{ flex:1, minWidth:0 } },
        b.badge && React.createElement('div', { style: { display:'inline-block', background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:'8px', padding:'3px 12px', fontSize:'11px', fontWeight:'700', letterSpacing:'0.05em', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, b.badge),
        React.createElement('div', { style: { fontSize:'12px', color:'rgba(255,255,255,0.75)', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, b.subtitle),
        React.createElement('div', { style: { fontSize: isMobile ? '22px' : '34px', fontWeight:'800', color:'#fff', letterSpacing:'-0.16px', lineHeight:'1.2', fontFamily:'Manrope, sans-serif' } }, b.title),
        b.cta && React.createElement('button', {
          style: { marginTop:'12px', background:'#fff', color: b.bg, border:'none', borderRadius:'8px', padding:'7px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
          onMouseDown: e => e.currentTarget.style.transform='scale(0.95)',
          onMouseUp: e => e.currentTarget.style.transform='scale(1)',
        }, b.cta)
      ),
      React.createElement('div', { style: { flexShrink:0, marginLeft:'12px' } },
        React.createElement('div', { style: { background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'8px', padding: isMobile ? '8px 12px' : '10px 18px', textAlign:'center' } },
          React.createElement('div', { style: { fontSize:'10px', color:'rgba(255,255,255,0.7)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, '개강'),
          React.createElement('div', { style: { fontSize: isMobile ? '13px' : '15px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, b.label)
        )
      )
    ),
    React.createElement('div', { style: { position:'absolute', bottom:'12px', right:'16px', display:'flex', gap:'6px', alignItems:'center', zIndex:3 } },
      React.createElement('span', { style: { fontSize:'11px', color:'rgba(255,255,255,0.7)', fontFamily:'Manrope, sans-serif' } }, `${idx+1}/${active.length}`),
      active.map((_,i) =>
        React.createElement('div', { key:i, onClick:()=>setIdx(i), style: { width:i===idx?18:5, height:5, borderRadius:'3px', background:i===idx?'#fff':'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.3s ease' } })
      )
    ),
    isAdmin && React.createElement('button', { onClick:onEdit, style:{ position:'absolute', top:'12px', right:'12px', zIndex:4, background:'rgba(203,162,88,0.9)', color:'#fff', border:'none', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 배너 편집')
  );
}

function SplitSection({ notices, announcements, isAdmin, onEditNotices, onSelectNotice, slides }) {
  const isMobile = useIsMobile();
  const [slideIdx, setSlideIdx] = React.useState(0);
  const defaultSlides = [
    { bg:'#1E3932', text1:'최고의 결과를 만든다', text2:'B2빅뱅 학습 시스템', accent:'2027 합격이 보인다', image:'', youtube:'' },
    { bg:'#006241', text1:'체계적인 커리큘럼', text2:'전문 강사진의 1:1 관리', accent:'목표 대학을 향해', image:'', youtube:'' },
  ];
  const allSlides = (slides && slides.length) ? slides : defaultSlides;

  React.useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i+1)%allSlides.length), 5000);
    return () => clearInterval(t);
  }, [allSlides.length]);

  const s = allSlides[slideIdx];

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }
  const ytId = getYoutubeId(s.youtube);

  return React.createElement('div', { style: { background:'#f2f0eb', padding: isMobile ? '16px' : '24px 40px', overflow:'hidden' } },
    React.createElement('div', { style: { maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px', width:'100%', alignItems:'stretch' } },
      !isMobile && React.createElement('div', { style: { borderRadius:'12px', overflow:'hidden', position:'relative', minHeight:'280px', background: s.bg } },
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
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#006241', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, 'B2빅뱅 학습 시스템'),
          React.createElement('div', { style:{ fontSize: isMobile ? '16px' : '18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', lineHeight:'1.4', fontFamily:'Manrope, sans-serif', marginBottom:'12px', whiteSpace:'pre-line' } }, '최고의 강사가 모인다\n최고의 합격이 보인다'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
            notices.slice(0,3).map((n,i) =>
              React.createElement('div', { key:i, onClick:()=>onSelectNotice(n), style:{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(0,0,0,0.06)', paddingBottom:'7px', cursor:'pointer' },
                onMouseEnter:e=>e.currentTarget.style.opacity='0.7',
                onMouseLeave:e=>e.currentTarget.style.opacity='1' },
                React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', flex:1, minWidth:0, overflow:'hidden' } },
                  React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 6px', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.type),
                  React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, n.text)
                ),
                React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0, marginLeft:'8px', whiteSpace:'nowrap' } }, n.date)
              )
            )
          )
        ),
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'16px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden' } },
          React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항'),
            isAdmin && React.createElement('button', { onClick:onEditNotices, style:{ background:'rgba(203,162,88,0.15)', color:'#cba258', border:'1px solid #cba258', borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 편집')
          ),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'7px' } },
            announcements.slice(0,4).map((a,i) =>
              React.createElement('div', { key:i, onClick:()=>onSelectNotice(a), style:{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:i<3?'1px solid rgba(0,0,0,0.05)':'none', paddingBottom:'7px', cursor:'pointer' },
                onMouseEnter:e=>e.currentTarget.style.opacity='0.7',
                onMouseLeave:e=>e.currentTarget.style.opacity='1' },
                React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 } }, a.title),
                React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0, marginLeft:'8px' } }, a.date)
              )
            )
          )
        )
      )
    )
  );
}

function StatsBand() {
  const isMobile = useIsMobile();
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
          React.createElement('div', { style:{ fontSize: isMobile ? '26px' : '34px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, s.val),
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, s.label)
        )
      )
    )
  );
}

function FeatureBand({ setPage, isAdmin, content, onEdit }) {
  const isMobile = useIsMobile();
  return React.createElement('div', { style:{ background:'#1E3932', padding: isMobile ? '40px 16px' : '56px 40px', position:'relative' } },
    React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent:'space-between', gap: isMobile ? '20px' : '40px' } },
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, content.featureEyebrow || '지금 등록하면'),
        React.createElement('div', { style:{ fontSize: isMobile ? '30px' : '38px', fontWeight:'800', color:'#fff', lineHeight:'1.2', fontFamily:'Manrope, sans-serif', marginBottom:'12px', whiteSpace:'pre-line' } }, content.featureTitle || '첫 달 수강료\n50% 할인'),
        React.createElement('div', { style:{ fontSize:'15px', color:'rgba(255,255,255,0.65)', lineHeight:'1.7', marginBottom:'24px', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line' } }, content.featureBody || '신규 등록생 한정 · 선착순 마감\n지금 바로 문의해 주세요'),
        React.createElement('div', { style:{ display:'flex', gap:'12px', flexWrap:'wrap' } },
          React.createElement('button', { onClick:()=>setPage('contact'), style:{ background:'#fff', color:'#00754A', border:'1px solid #fff', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
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
    isAdmin && React.createElement('button', { onClick:onEdit, style:{ position:'absolute', top:'12px', right:'12px', background:'rgba(203,162,88,0.9)', color:'#fff', border:'none', borderRadius:'8px', padding:'5px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '✏ 편집')
  );
}

/* ── Notice Detail Page ─────────────────────── */
function NoticeDetailPage({ notice, onBack }) {
  const isMobile = useIsMobile();

  function getYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? match[1] : null;
  }

  const ytId = getYoutubeId(notice.youtube);

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    // 뒤로가기
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'6px' } }, '← 목록으로')
    ),
    // 본문
    React.createElement('div', { style:{ maxWidth:'720px', margin:'0 auto', padding: isMobile ? '24px 16px' : '40px' } },
      // 카테고리 뱃지 (notices만)
      notice.type && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'3px 8px', fontFamily:'Manrope, sans-serif', display:'inline-block', marginBottom:'12px' } }, notice.type),
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
      // 외부 링크
      notice.link && React.createElement('a', { href:notice.link, target:'_blank', rel:'noopener noreferrer', style:{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#006241', color:'#fff', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', fontFamily:'Manrope, sans-serif', textDecoration:'none' } }, '🔗 자세히 보기')
    )
  );
}

function HomePage({ banners, slides, categories, notices, announcements, setPage, isAdmin, content, onAdminAction }) {
  const [selectedNotice, setSelectedNotice] = React.useState(null);

  if (selectedNotice) {
    return React.createElement(NoticeDetailPage, { notice:selectedNotice, onBack:()=>setSelectedNotice(null) });
  }

  return React.createElement('div', null,
    React.createElement(HeroBanner, { banners, isAdmin, onEdit:()=>onAdminAction('banner') }),
    React.createElement(SplitSection, { notices, announcements, isAdmin, onEditNotices:()=>onAdminAction('notice'), onSelectNotice:setSelectedNotice, slides }),
    React.createElement(StatsBand),
    React.createElement(FeatureBand, { setPage, isAdmin, content, onEdit:()=>onAdminAction('feature') })
  );
}

Object.assign(window, { HomePage });
