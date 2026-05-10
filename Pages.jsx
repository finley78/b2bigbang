// Pages.jsx — ServicePage + ContactPage + CourseDetailPage

/* ── Course Detail Page ─────────────────────── */
function CourseDetailPage({ course, onBack, setPage, user, onLoginClick, refresh }) {
  const [enrolling, setEnrolling] = React.useState(false);
  const [requested, setRequested] = React.useState(false);      // 방금 신청 제출함
  const [enrollStatus, setEnrollStatus] = React.useState(null); // null=확인중, 'approved'|'pending'|'none'
  const adminMode = !!(user && (user.role === 'admin' || user.isAdmin));
  const isTeacher = !!(user && (user.role === 'teacher' || user.role === 'teachers'));
  // 이 강좌에 대한 내 수강 상태 조회 (버튼 표시용)
  React.useEffect(function(){
    if (!user || !user.id || !course || !course.id) { setEnrollStatus('none'); return; }
    var sb = window.supabase;
    sb.from('enrollments').select('status, is_active').eq('student_id', user.id).eq('course_id', course.id).maybeSingle()
      .then(function(r){
        var d = r && r.data;
        if (!d) { setEnrollStatus('none'); return; }
        if (d.is_active === true || d.status === 'approved') setEnrollStatus('approved');
        else if (d.status === 'pending') setEnrollStatus('pending');
        else setEnrollStatus('none');
      })
      .catch(function(){ setEnrollStatus('none'); });
  }, [user && user.id, course && course.id]);
  const alreadyEnrolled = enrollStatus === 'approved' || (user && Array.isArray(user.enrolledCourses) && user.enrolledCourses.indexOf(course.id) >= 0);
  const pendingRequest = requested || enrollStatus === 'pending';

  async function enroll() {
    if (!user) { if (onLoginClick) onLoginClick(); return; }
    if (alreadyEnrolled) { alert('이미 수강 중인 강좌입니다.'); return; }
    if (pendingRequest) { alert('이미 수강 신청하셨습니다. 관리자 승인을 기다려 주세요.'); return; }
    setEnrolling(true);
    var sb = window.supabase;
    try {
      var { data: existing } = await sb.from('enrollments').select('id, status, is_active').eq('student_id', user.id).eq('course_id', course.id).maybeSingle();
      if (existing && (existing.is_active === true || existing.status === 'approved')) {
        setEnrollStatus('approved');
        alert('이미 수강 중인 강좌입니다.');
      } else if (existing && existing.status === 'pending') {
        setEnrollStatus('pending');
        alert('이미 수강 신청하셨습니다. 관리자 승인을 기다려 주세요.');
      } else {
        if (!existing) {
          var { error } = await sb.from('enrollments').insert({ student_id: user.id, course_id: course.id, status: 'pending', is_active: false });
          if (error) throw error;
        } else {
          var { error: ue } = await sb.from('enrollments').update({ status: 'pending', is_active: false }).eq('id', existing.id);
          if (ue) throw ue;
        }
        setRequested(true);
        setEnrollStatus('pending');
        alert('수강 신청이 접수되었습니다. 관리자 승인 후 수강하실 수 있어요.');
      }
    } catch (e) {
      alert('수강 신청 실패: ' + (e.message || e));
    } finally {
      setEnrolling(false);
    }
  }
  const isMobile = window.B2Utils.useIsMobile();
  const color = course.color || '#E60012';

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    // 뒤로가기
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '← 강좌 목록으로')
    ),
    // 헤더
    React.createElement('div', { style:{ background: color, padding: isMobile ? '32px 16px' : '48px 40px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto' } },
        React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' } },
          React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.7)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, `${course.subject} · ${course.grade}`),
          course.badge && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'rgba(255,255,255,0.2)', color:'#fff', borderRadius:'8px', padding:'2px 10px', fontFamily:'Manrope, sans-serif' } }, course.badge)
        ),
        React.createElement('h1', { style:{ fontSize: isMobile ? '26px' : '36px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px', lineHeight:'1.2', marginBottom:'12px' } }, course.name),
        React.createElement('p', { style:{ fontSize:'15px', color:'rgba(255,255,255,0.75)', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, course.description ?? course.desc),
        React.createElement('div', { style:{ display:'flex', gap:'24px', marginTop:'20px', flexWrap:'wrap' } },
          [
            { label:'수업 횟수', val:`주 ${course.days}회` },
            { label:'수업 시간', val:`${course.duration}분` },
            { label:'수강료', val:course.price },
          ].map((item,i) =>
            React.createElement('div', { key:i },
              React.createElement('div', { style:{ fontSize:'11px', color:'rgba(255,255,255,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, item.label),
              React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, item.val)
            )
          )
        )
      )
    ),
    // 본문
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding: isMobile ? '24px 16px' : '40px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap:'24px', alignItems:'start' } },
      // 왼쪽
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'20px' } },
        // 강좌 소개
        course.intro && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '강좌 소개'),
          React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.7)', fontFamily:'Manrope, sans-serif', lineHeight:'1.8', whiteSpace:'pre-line' } }, course.intro)
        ),
        // 수강 대상
        course.target && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '수강 대상'),
          React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.7)', fontFamily:'Manrope, sans-serif', lineHeight:'1.8', whiteSpace:'pre-line' } }, course.target)
        ),
        // 커리큘럼
        course.curriculum && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, '커리큘럼'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
            course.curriculum.split('\n').filter(l=>l.trim()).map((line,i) =>
              React.createElement('div', { key:i, style:{ display:'flex', gap:'12px', alignItems:'flex-start', padding:'10px 12px', background: i%2===0?'#f9f9f9':'#fff', borderRadius:'6px' } },
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#fff', background:color, borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'Manrope, sans-serif' } }, i+1),
                React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif', lineHeight:'1.5' } }, line.replace(/^\d+\.\s*/, ''))
              )
            )
          )
        ),
        // 유튜브
        course.youtube && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '미리보기'),
          React.createElement('div', { style:{ borderRadius:'8px', overflow:'hidden', aspectRatio:'16/9' } },
            React.createElement('iframe', { width:'100%', height:'100%', src:`https://www.youtube.com/embed/${course.youtube.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]}`, frameBorder:'0', allowFullScreen:true, style:{ display:'block' } })
          )
        )
      ),
      // 오른쪽 사이드바
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'16px' } },
        // 강사 소개
        React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
          React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '담당 강사'),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' } },
            React.createElement('div', { style:{ width:'48px', height:'48px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (course.teacher||'강')[0]),
            React.createElement('div', null,
              React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, course.teacher),
              React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, course.subject)
            )
          ),
          course.teacherDesc && React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.65)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', whiteSpace:'pre-line' } }, course.teacherDesc)
        ),
        // 수강 신청 버튼 (로그인 상태에 따라 동작 분기)
        (function(){
          if (alreadyEnrolled) {
            return React.createElement('button', { disabled:true, style:{ background:'#e5e7eb', color:'#6b7280', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'700', cursor:'not-allowed', fontFamily:'Manrope, sans-serif', width:'100%' } }, '✓ 수강 중인 강좌');
          }
          if (adminMode || isTeacher) {
            return React.createElement('button', { onClick:()=>setPage(adminMode ? 'admin' : 'teacher'), style:{ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, adminMode ? '관리자 페이지로' : '선생님 페이지로');
          }
          if (pendingRequest) {
            return React.createElement('div', null,
              React.createElement('button', { disabled:true, style:{ background:'#fff3cd', color:'#856404', border:'1px solid #f0d97a', borderRadius:'8px', padding:'16px', fontSize:'15px', fontWeight:'700', cursor:'not-allowed', fontFamily:'Manrope, sans-serif', width:'100%' } }, '신청 접수됨 · 관리자 승인 대기 중'),
              React.createElement('div', { style:{ marginTop:'8px', fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', textAlign:'center' } }, '관리자가 승인하면 강의실에서 수강하실 수 있어요.')
            );
          }
          if (!user) {
            return React.createElement('div', null,
              React.createElement('button', { onClick:enroll, style:{ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, '로그인 후 수강 신청'),
              React.createElement('button', { onClick:()=>setPage('contact'), style:{ marginTop:'8px', background:'#fff', color:color, border:'1px solid '+color, borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', width:'100%' } }, '먼저 문의하기')
            );
          }
          return React.createElement('button', { onClick:enroll, disabled:enrolling || enrollStatus===null, style:{ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'700', cursor:(enrolling||enrollStatus===null)?'wait':'pointer', fontFamily:'Manrope, sans-serif', width:'100%', opacity:(enrolling||enrollStatus===null)?0.7:1 } }, enrolling ? '신청 중...' : (enrollStatus===null ? '확인 중...' : '수강 신청하기'));
        })()
      )
    )
  );
}

/* ── Service Page ───────────────────────────── */
function ServicePage({ setPage, courses, onSelectCourse, user, onLoginClick, refresh }) {
  const isMobileState = window.B2Utils.useIsMobile();
  const [filterLevel, setFilterLevel] = React.useState('전체');
  const [filterGrade, setFilterGrade] = React.useState('전체');
  const [filterSubject, setFilterSubject] = React.useState('전체');
  const [pgContent, setPgContent] = React.useState(null);
  const SERVICE_LEVELS = { '초등': ['1학년','2학년','3학년','4학년','5학년','6학년'], '중등': ['중1','중2','중3'], '고등': ['고1','고2','고3'] };
  React.useEffect(() => {
    (async () => {
      try {
        const v = await window.B2Utils.loadSiteContent('programs');
        if (v) setPgContent(v);
      } catch (e) { console.error('프로그램 콘텐츠 로드 실패:', e); }
    })();
  }, []);
  const pc = pgContent || {};
  const isMob = isMobileState;
  const programs = courses && courses.length ? courses : [
    { id:1, subject:'수학', color:'#E60012', grade:'고1·2·3', name:'수능 수학 완성반', desc:'수능 수학 전 범위를 체계적으로 완성. 개념→유형→실전 3단계 구성', days:3, duration:90, price:'280,000원', badge:'인기', teacher:'김민준 강사' },
    { id:2, subject:'영어', color:'#E60012', grade:'고2·3', name:'수능 영어 1등급반', desc:'독해·듣기·어휘를 통합한 수능 영어 완성 프로그램', days:2, duration:100, price:'250,000원', badge:'신규', teacher:'이수진 강사' },
    { id:3, subject:'국어', color:'#3A3A3A', grade:'고1·2·3', name:'수능 국어 독서·문학', desc:'문학·독서·화작 전 영역 집중 훈련으로 1등급 달성', days:2, duration:90, price:'240,000원', badge:null, teacher:'박지영 강사' },
    { id:4, subject:'과학', color:'#1A1A1A', grade:'고1·2', name:'물리·화학 내신 특강', desc:'학교 내신 완벽 대비. 중간·기말 시험 직전 집중 특강', days:2, duration:80, price:'200,000원', badge:'특강', teacher:'정서연 강사' },
    { id:5, subject:'수학', color:'#E60012', grade:'중3·고1', name:'중·고 연계 수학 심화', desc:'중학교 수학부터 고등 연계까지 탄탄한 기초를 다지는 과정', days:3, duration:80, price:'220,000원', badge:'추천', teacher:'최민호 강사' },
    { id:6, subject:'영어', color:'#33433d', grade:'중2·3', name:'중등 영어 기초·심화', desc:'중학교 영어 문법·독해·회화를 통합한 실력 향상 과정', days:2, duration:70, price:'180,000원', badge:null, teacher:'오현주 강사' },
  ];

  const [selectedCourse, setSelectedCourse] = React.useState(null);

  const teachers = (pc.teachers && pc.teachers.length > 0) ? pc.teachers : [
    { name:'김민준', subject:'수학', career:'서울대 수학교육과, 수능 출제 경험 10년', badge:'수학 대표 강사' },
    { name:'이수진', subject:'영어', career:'연세대 영어영문과, 수능 영어 전문 15년', badge:'영어 대표 강사' },
    { name:'박지영', subject:'국어', career:'고려대 국어국문과, 수능 국어 전문 12년', badge:'국어 대표 강사' },
    { name:'최민호', subject:'과학', career:'KAIST 물리학과, 내신·수능 과학 전문', badge:'과학 대표 강사' },
  ];

  if (selectedCourse) {
    return React.createElement(CourseDetailPage, { course:selectedCourse, onBack:()=>setSelectedCourse(null), setPage, user, onLoginClick, refresh });
  }

  // 필터 적용 (DB 강좌만 필터; 데모용 mock 데이터는 그대로 노출)
  const isMockData = !courses || courses.length === 0;
  const filteredPrograms = isMockData ? programs : programs.filter(function(p){
    if (filterLevel !== '전체' && p.level && p.level !== filterLevel) return false;
    if (filterGrade !== '전체' && p.grade && p.grade !== filterGrade) return false;
    if (filterSubject !== '전체' && p.subject && p.subject !== filterSubject) return false;
    return true;
  });

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    React.createElement('div', { style:{ background: pc.header_image ? `linear-gradient(135deg, rgba(26,26,26,0.85), rgba(58,0,7,0.85)), url(${pc.header_image}) center/cover no-repeat` : '#1A1A1A', padding: isMob ? '32px 16px' : '56px 40px' } },
      React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, pc.header_eyebrow || 'Programs'),
        React.createElement('h1', { style:{ fontSize:'44px', fontWeight:'800', color:'#fff', letterSpacing:'-0.16px', lineHeight:'1.2', fontFamily:'Manrope, sans-serif', marginBottom:'12px', whiteSpace:'pre-line' } }, pc.header_title || 'B2빅뱅학원\n프로그램 안내'),
        React.createElement('p', { style:{ fontSize:'16px', color:'rgba(255,255,255,0.65)', letterSpacing:'-0.01em', fontFamily:'Manrope, sans-serif' } }, pc.header_subtitle || '수능·내신·특기 전 과목 전문 강사진과 함께')
      )
    ),
    React.createElement('div', { style:{ maxWidth:'1280px', margin:'0 auto', padding: isMob ? '24px 16px' : '40px 40px' } },
      React.createElement('h2', { style:{ fontSize:'24px', fontWeight:'800', color:'#E60012', letterSpacing:'-0.16px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, pc.list_title || '강좌 목록'),
      // 필터: 초중고 / 학년 / 과목
      !isMockData && React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'18px' } },
        React.createElement('select', {
          value: filterLevel,
          onChange: function(e){ setFilterLevel(e.target.value); setFilterGrade('전체'); },
          style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
        },
          React.createElement('option', { value:'전체' }, '초중고 전체'),
          ['초등','중등','고등'].map(function(l){ return React.createElement('option', { key:l, value:l }, l); })
        ),
        React.createElement('select', {
          value: filterGrade,
          onChange: function(e){ setFilterGrade(e.target.value); },
          style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' },
          disabled: filterLevel === '전체'
        },
          React.createElement('option', { value:'전체' }, '학년 전체'),
          (SERVICE_LEVELS[filterLevel] || []).map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
        ),
        React.createElement('select', {
          value: filterSubject,
          onChange: function(e){ setFilterSubject(e.target.value); },
          style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
        },
          React.createElement('option', { value:'전체' }, '과목 전체'),
          ['국어','영어','수학','과학'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
        ),
        (filterLevel !== '전체' || filterGrade !== '전체' || filterSubject !== '전체') && React.createElement('button', {
          onClick: function(){ setFilterLevel('전체'); setFilterGrade('전체'); setFilterSubject('전체'); },
          style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#E60012', fontFamily:'Manrope, sans-serif' }
        }, '필터 초기화'),
        React.createElement('div', { style:{ flex:1 } }),
        React.createElement('div', { style:{ alignSelf:'center', fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif' } }, filteredPrograms.length + '개 강좌')
      ),
      filteredPrograms.length === 0 && React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'40px' } },
        '선택한 조건에 맞는 강좌가 없습니다. 필터를 조정해 주세요.'
      ),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMob ? '1fr' : 'repeat(3,1fr)', gap:'16px', marginBottom:'56px' } },
        filteredPrograms.map((p,i) =>
          React.createElement('div', { key:i, onClick:()=>setSelectedCourse(p), style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s ease' },
            onMouseEnter:e=>e.currentTarget.style.transform='translateY(-2px)',
            onMouseLeave:e=>e.currentTarget.style.transform='translateY(0)' },
            React.createElement('div', { style:{ height:'8px', background:p.color||'#E60012' } }),
            React.createElement('div', { style:{ padding:'18px' } },
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' } },
                React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, `${p.subject} · ${p.grade}`),
                p.badge && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'8px', padding:'3px 10px', fontFamily:'Manrope, sans-serif' } }, p.badge)
              ),
              React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', letterSpacing:'-0.01em', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, p.name),
              React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.55)', letterSpacing:'-0.01em', lineHeight:'1.5', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, p.desc),
              React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:'12px' } },
                React.createElement('div', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, `주 ${p.days}회 · ${p.duration}분`),
                React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, p.price)
              )
            )
          )
        )
      ),
      React.createElement('h2', { style:{ fontSize:'24px', fontWeight:'800', color:'#E60012', letterSpacing:'-0.16px', marginBottom:'24px', fontFamily:'Manrope, sans-serif' } }, pc.teachers_title || '강사진'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMob ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'16px', marginBottom:'40px' } },
        teachers.map((t,i) =>
          React.createElement('div', { key:i, style:{ background:'#fff', borderRadius:'12px', padding:'24px 20px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', textAlign:'center' } },
            t.image
              ? React.createElement('div', { style:{ width:'72px', height:'72px', borderRadius:'50%', overflow:'hidden', margin:'0 auto 12px', background:`url(${t.image}) center/cover no-repeat #FFEBED` } })
              : React.createElement('div', { style:{ width:'60px', height:'60px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'22px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, (t.name || '?')[0]),
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, t.name),
            t.badge && React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#E60012', background:'#FFEBED', borderRadius:'8px', padding:'3px 10px', display:'inline-block', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, t.badge),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', letterSpacing:'-0.01em', lineHeight:'1.5', fontFamily:'Manrope, sans-serif' } }, t.career)
          )
        )
      ),
      React.createElement('div', { style:{ textAlign:'center' } },
        React.createElement('button', { onClick:()=>setPage('contact'), style:{ background:'#E60012', color:'#fff', border:'1px solid #E60012', borderRadius:'8px', padding:'14px 36px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
          onMouseDown:e=>e.currentTarget.style.transform='scale(0.95)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, pc.cta_button || '무료 상담 신청하기')
      )
    )
  );
}

/* ── Contact Page ───────────────────────────── */
function ContactPage() {
  const [form, setForm] = React.useState({ name:'', phone:'', subjects:[], grade:'', message:'', agree:false });
  const [sent, setSent] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const GRADES = ['초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];
  const SUBJECTS = ['국어','영어','수학','과학'];

  function toggleSubject(s) {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter(x=>x!==s) : [...f.subjects, s]
    }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = '이름을 입력해 주세요';
    if (!form.phone.trim()) e.phone = '연락처를 입력해 주세요';
    if (form.subjects.length === 0) e.subjects = '과목을 하나 이상 선택해 주세요';
    if (!form.agree) e.agree = '개인정보 수집에 동의해 주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (validate()) setSent(true);
  }

  if (sent) return React.createElement('div', { style:{ minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', background:'#f8fafc' } },
    React.createElement('div', { style:{ width:'72px', height:'72px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' } }, '✓'),
    React.createElement('h2', { style:{ fontSize:'28px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, '문의가 접수되었습니다'),
    React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', textAlign:'center', lineHeight:'1.7' } }, '빠른 시일 내에 담당자가 연락드리겠습니다.\n평균 응대 시간: 영업일 기준 1~2일'),
    React.createElement('button', { onClick:()=>setSent(false), style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 28px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '다시 문의하기')
  );

  const inputStyle = { width:'100%', border:'none', outline:'none', fontSize:'15px', color:'rgba(0,0,0,0.87)', letterSpacing:'-0.01em', fontFamily:'Manrope, sans-serif', background:'transparent', boxSizing:'border-box', padding:'0' };

  function Field({ label, error, required, children }) {
    return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' } },
      React.createElement('label', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.65)', fontFamily:'Manrope, sans-serif' } }, label + (required ? ' *' : '')),
      React.createElement('div', { style:{ background:'#fff', borderRadius:'8px', border:`1.5px solid ${error?'#c82014':'rgba(0,0,0,0.12)'}`, padding:'12px 14px' } },
        children
      ),
      error && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif' } }, error)
    );
  }

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    React.createElement('div', { style:{ background:'#1A1A1A', padding:'48px 40px' } },
      React.createElement('div', { style:{ maxWidth:'640px', margin:'0 auto' } },
        React.createElement('h1', { style:{ fontSize:'36px', fontWeight:'800', color:'#fff', letterSpacing:'-0.16px', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '무료 상담 신청'),
        React.createElement('p', { style:{ fontSize:'15px', color:'rgba(255,255,255,0.6)', fontFamily:'Manrope, sans-serif' } }, '전화 또는 방문 상담을 원하시면 아래 양식을 작성해 주세요')
      )
    ),
    React.createElement('div', { style:{ maxWidth:'640px', margin:'0 auto', padding:'40px 20px' } },
      React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'32px', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', gap:'20px' } },
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' } },
          React.createElement(Field, { label:'이름', required:true, error:errors.name },
            React.createElement('input', { style:inputStyle, placeholder:'홍길동', value:form.name, onChange:e=>setForm({...form,name:e.target.value}) })
          ),
          React.createElement(Field, { label:'연락처', required:true, error:errors.phone },
            React.createElement('input', { style:inputStyle, placeholder:'010-0000-0000', type:'tel', value:form.phone, onChange:e=>setForm({...form,phone:e.target.value}) })
          )
        ),
        React.createElement(Field, { label:'학년' },
          React.createElement('select', { style:{ ...inputStyle, cursor:'pointer' }, value:form.grade, onChange:e=>setForm({...form,grade:e.target.value}) },
            React.createElement('option', { value:'' }, '선택해 주세요'),
            GRADES.map(g=>React.createElement('option',{key:g,value:g},g))
          )
        ),
        React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' } },
          React.createElement('label', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.65)', fontFamily:'Manrope, sans-serif' } }, '과목 *'),
          React.createElement('div', { style:{ display:'flex', gap:'10px', flexWrap:'wrap' } },
            SUBJECTS.map(s =>
              React.createElement('button', { key:s, type:'button', onClick:()=>toggleSubject(s), style:{ background: form.subjects.includes(s) ? '#E60012' : '#fff', color: form.subjects.includes(s) ? '#fff' : 'rgba(0,0,0,0.7)', border: `1.5px solid ${form.subjects.includes(s) ? '#E60012' : 'rgba(0,0,0,0.15)'}`, borderRadius:'8px', padding:'10px 24px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, s)
            )
          ),
          errors.subjects && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif' } }, errors.subjects)
        ),
        React.createElement(Field, { label:'문의 내용' },
          React.createElement('textarea', { style:{...inputStyle, resize:'vertical', minHeight:'100px', lineHeight:'1.6'}, placeholder:'궁금한 점이나 상담 희망 일정을 알려주세요', value:form.message, onChange:e=>setForm({...form,message:e.target.value}) })
        ),
        React.createElement('div', { style:{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'14px 16px', background:'#f9f9f9', borderRadius:'8px', border:errors.agree?'1.5px solid #c82014':'1.5px solid rgba(0,0,0,0.08)' } },
          React.createElement('input', { type:'checkbox', id:'agree', checked:form.agree, onChange:e=>setForm({...form,agree:e.target.checked}), style:{ marginTop:'2px', accentColor:'#E60012', width:'16px', height:'16px', flexShrink:0, cursor:'pointer' } }),
          React.createElement('label', { htmlFor:'agree', style:{ fontSize:'13px', color:'rgba(0,0,0,0.65)', fontFamily:'Manrope, sans-serif', lineHeight:'1.5', cursor:'pointer' } }, '개인정보 수집 및 이용에 동의합니다. 수집된 정보는 상담 목적으로만 사용됩니다. (필수)')
        ),
        errors.agree && React.createElement('div', { style:{ fontSize:'12px', color:'#c82014', fontFamily:'Manrope, sans-serif', marginTop:'-12px' } }, errors.agree),
        React.createElement('button', { onClick:submit, style:{ width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'16px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
          onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, '상담 신청하기')
      ),
      React.createElement('div', { style:{ marginTop:'24px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' } },
        [
          { icon:'', label:'전화 상담', val:'문의 전화', sub:'평일 9:00~20:00' },
          { icon:'', label:'카카오톡', val:'카카오채널 문의', sub:'채널 검색: B2빅뱅학원' },
          { icon:'', label:'방문 상담', val:'인천 검암동', sub:'사전 예약 필수' },
        ].map((item,i)=>
          React.createElement('div', { key:i, style:{ background:'#fff', borderRadius:'12px', padding:'16px', textAlign:'center', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
            React.createElement('div', { style:{ fontSize:'22px', marginBottom:'6px' } }, item.icon),
            React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, item.label),
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, item.val),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, item.sub)
          )
        )
      )
    )
  );
}

/* ── About Page (학원안내) ───────────────────── */
function AboutPage({ setPage }) {
  const isMobile = window.B2Utils.useIsMobile();
  const [content, setContent] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      try {
        const v = await window.B2Utils.loadSiteContent('about');
        if (v) setContent(v);
      } catch (e) { console.error('학원안내 콘텐츠 로드 실패:', e); }
    })();
  }, []);

  const c = content || {};
  const values = (c.promise_items && c.promise_items.length > 0) ? c.promise_items : [
    { num:'01', title:'목표 중심 학습', desc:'단순 수업이 아닌 목표 대학과 목표 점수를 기준으로 역산한 맞춤형 커리큘럼을 제공합니다.' },
    { num:'02', title:'소수 정예 수업', desc:'학생 한 명 한 명의 진도와 이해도를 파악할 수 있는 소수 정예 반 운영을 원칙으로 합니다.' },
    { num:'03', title:'체계적 성과 관리', desc:'정기적인 성취도 평가와 피드백으로 학습 상태를 투명하게 관리합니다.' },
    { num:'04', title:'학부모 소통', desc:'정기 상담과 알림 서비스로 학부모님과 긴밀하게 소통합니다.' },
  ];
  const subjects = (c.subjects && c.subjects.length > 0) ? c.subjects : [
    { name:'국어', sub:'KOREAN', color:'#1A1A1A',  desc:'독서·문학·화작 전 영역\n내신 + 수능 통합 대비' },
    { name:'영어', sub:'ENGLISH', color:'#E60012', desc:'독해·어휘·듣기 통합\n내신 + 수능 1등급 목표' },
    { name:'수학', sub:'MATH',    color:'#3A3A3A', desc:'개념·유형·실전 3단계\n내신 + 수능 완성' },
    { name:'과학', sub:'SCIENCE', color:'#0d2520', desc:'물리·화학·생물·지구과학\n내신 집중 대비' },
  ];
  const keywords = (c.keywords && c.keywords.length > 0) ? c.keywords : ['#소수정예', '#목표역산', '#1:1관리', '#투명한소통'];

  const sectionTitle = (eyebrow, title) => React.createElement('div', { style:{ marginBottom:'28px' } },
    React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#E60012', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, eyebrow),
    React.createElement('h2', { style:{ fontSize: isMobile ? '24px' : '32px', fontWeight:'800', color:'#1A1A1A', letterSpacing:'-0.02em', lineHeight:'1.25', fontFamily:'Manrope, sans-serif' } }, title)
  );

  return React.createElement('div', { style:{ background:'#fff', minHeight:'80vh' } },

    /* HERO */
    React.createElement('section', { style:{ position:'relative', overflow:'hidden', background: c.hero_image ? `linear-gradient(135deg, rgba(26,26,26,0.85) 0%, rgba(58,0,7,0.85) 100%), url(${c.hero_image}) center/cover no-repeat` : 'linear-gradient(135deg, #1A1A1A 0%, #2a2a2a 60%, #3a0007 100%)', padding: isMobile ? '64px 16px 80px' : '120px 40px' } },
      React.createElement('div', { style:{ position:'absolute', top:'-80px', right: isMobile ? '-100px' : '-60px', width:'360px', height:'360px', borderRadius:'50%', background:'radial-gradient(circle, rgba(230,0,18,0.18) 0%, rgba(230,0,18,0) 70%)', pointerEvents:'none' } }),
      React.createElement('div', { style:{ position:'relative', maxWidth:'1100px', margin:'0 auto' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#E60012', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, c.hero_eyebrow || 'About B2BIGBANG'),
        React.createElement('h1', { style:{ fontSize: isMobile ? '34px' : '60px', fontWeight:'800', color:'#fff', letterSpacing:'-0.03em', lineHeight:'1.15', fontFamily:'Manrope, sans-serif', marginBottom:'18px' } },
          React.createElement('span', null, c.hero_title_1 || '인천 검암동'), React.createElement('br'),
          React.createElement('span', { style:{ color:'#E60012' } }, c.hero_title_2 || '입시 전문'), React.createElement('span', null, c.hero_title_3 || ' 학원')
        ),
        React.createElement('p', { style:{ fontSize: isMobile ? '15px' : '17px', color:'rgba(255,255,255,0.72)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', maxWidth:'600px' } }, c.hero_subtitle || '체계적인 커리큘럼과 전문 강사진이 학생 한 명 한 명의 목표를 현실로 바꿉니다.'),
        React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'28px' } },
          keywords.map(k =>
            React.createElement('span', { key:k, style:{ fontSize:'13px', fontWeight:'700', color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'999px', padding:'7px 14px', fontFamily:'Manrope, sans-serif' } }, k)
          )
        )
      )
    ),

    /* 미션 / 학원 소개 */
    React.createElement('section', { style:{ background:'#fff', padding: isMobile ? '56px 16px' : '96px 40px', borderBottom:'1px solid rgba(0,0,0,0.06)' } },
      React.createElement('div', { style:{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '24px' : '64px', alignItems:'start' } },
        React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#E60012', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, c.mission_eyebrow || 'Our Mission'),
          React.createElement('h2', { style:{ fontSize: isMobile ? '24px' : '34px', fontWeight:'800', color:'#1A1A1A', letterSpacing:'-0.02em', lineHeight:'1.25', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line' } }, c.mission_title || '학생 한 명 한 명의\n목표를 현실로')
        ),
        React.createElement('div', null,
          c.mission_image && React.createElement('div', { style:{ width:'100%', aspectRatio:'16/10', borderRadius:'14px', overflow:'hidden', marginBottom:'20px', background:`url(${c.mission_image}) center/cover no-repeat #f3f4f6` } }),
          React.createElement('div', { style:{ fontSize: isMobile ? '15px' : '17px', color:'rgba(0,0,0,0.72)', fontFamily:'Manrope, sans-serif', lineHeight:'1.95' } },
            React.createElement('p', { style:{ marginBottom:'18px' } }, c.mission_body_1 || 'B2빅뱅학원은 인천 검암동에 위치한 입시 전문 학원입니다. 국어·영어·수학·과학 전 과목을 아우르는 전문 강사진이 학생 한 명 한 명의 목표에 맞는 맞춤 학습을 제공합니다.'),
            React.createElement('p', null, c.mission_body_2 || '내신부터 수능까지, 학생의 현재 위치에서 목표 대학·목표 점수까지의 거리를 정확히 측정하고 그 사이를 메우는 체계적인 커리큘럼을 운영합니다.')
          )
        )
      )
    ),

    /* 핵심 가치 */
    React.createElement('section', { style:{ background:'#f8fafc', padding: isMobile ? '56px 16px' : '96px 40px' } },
      React.createElement('div', { style:{ maxWidth:'1100px', margin:'0 auto' } },
        sectionTitle('Promise', c.promise_title || '우리의 약속'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' } },
          values.map(v =>
            React.createElement('div', { key:v.num, style:{ background:'#fff', borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)', transition:'transform 0.2s, box-shadow 0.2s', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' } },
              v.image && React.createElement('div', { style:{ width:'100%', aspectRatio:'16/9', background:`url(${v.image}) center/cover no-repeat #f3f4f6` } }),
              React.createElement('div', { style:{ padding: isMobile ? '24px' : '32px' } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#E60012', letterSpacing:'0.04em', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, v.num),
                React.createElement('div', { style:{ fontSize:'19px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', marginBottom:'10px', letterSpacing:'-0.01em' } }, v.title),
                React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.75', margin:0 } }, v.desc)
              )
            )
          )
        )
      )
    ),

    /* 개설 과목 */
    React.createElement('section', { style:{ background:'#fff', padding: isMobile ? '56px 16px' : '96px 40px' } },
      React.createElement('div', { style:{ maxWidth:'1100px', margin:'0 auto' } },
        sectionTitle('Subjects', c.subjects_title || '개설 과목'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'14px' } },
          subjects.map(s =>
            React.createElement('div', { key:s.name, style:{ background: s.image ? `linear-gradient(135deg, ${s.color}EE, ${s.color}CC), url(${s.image}) center/cover no-repeat` : s.color, borderRadius:'16px', padding: isMobile ? '24px 18px' : '32px 24px', minHeight: isMobile ? '160px' : '220px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' } },
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'rgba(255,255,255,0.55)', letterSpacing:'0.14em', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, s.sub),
                React.createElement('div', { style:{ fontSize: isMobile ? '24px' : '28px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.02em' } }, s.name)
              ),
              React.createElement('div', { style:{ fontSize:'13px', color:'rgba(255,255,255,0.78)', fontFamily:'Manrope, sans-serif', lineHeight:'1.65', whiteSpace:'pre-line', marginTop:'14px' } }, s.desc)
            )
          )
        )
      )
    ),

    /* CTA */
    (function(){
      const ctaBg = c.cta_bg_color || '#FFEBED';
      const ctaText = c.cta_text_color || '#1A1A1A';
      const isLight = ctaBg !== '#1A1A1A' && ctaBg !== '#000000' && ctaBg !== '#1E3932';
      const subColor = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.65)';
      const outlineColor = isLight ? '#1A1A1A' : 'rgba(255,255,255,0.4)';
      return React.createElement('section', { style:{ background: ctaBg, padding: isMobile ? '56px 16px' : '96px 40px', textAlign:'center' } },
        React.createElement('div', { style:{ maxWidth:'720px', margin:'0 auto' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#E60012', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, c.cta_eyebrow || 'Get Started'),
          React.createElement('h2', { style:{ fontSize: isMobile ? '26px' : '36px', fontWeight:'800', color: ctaText, letterSpacing:'-0.02em', lineHeight:'1.25', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, c.cta_title || '지금 시작해 보세요'),
          React.createElement('p', { style:{ fontSize:'15px', color: subColor, fontFamily:'Manrope, sans-serif', lineHeight:'1.75', marginBottom:'28px' } }, c.cta_body || '레벨테스트로 현재 실력을 확인하거나 전화 한 통으로 상담을 시작하세요.'),
          React.createElement('div', { style:{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' } },
            React.createElement('button', { onClick: function(){ if (setPage) setPage('leveltest'); }, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding: isMobile ? '13px 22px' : '15px 32px', fontSize: isMobile ? '14px' : '15px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '레벨테스트 신청'),
            React.createElement('button', { onClick: function(){ if (setPage) setPage('contact'); }, style:{ background:'transparent', color: ctaText, border: `1px solid ${outlineColor}`, borderRadius:'10px', padding: isMobile ? '12px 22px' : '14px 32px', fontSize: isMobile ? '14px' : '15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '문의하기')
          )
        )
      );
    })()
  );
}

/* ── Recruit Page (모집안내) ─────────────────── */
function RecruitPage({ setPage }) {
  const isMobile = window.B2Utils.useIsMobile();

  const steps = [
    { step:'01', title:'상담 신청', desc:'전화, 카카오채널, 또는 홈페이지 문의 폼으로 상담을 신청합니다.', icon:'' },
    { step:'02', title:'레벨 테스트', desc:'현재 학습 수준을 파악하기 위한 간단한 레벨 테스트를 진행합니다.', icon:'' },
    { step:'03', title:'커리큘럼 상담', desc:'테스트 결과를 바탕으로 적합한 반과 커리큘럼을 안내해 드립니다.', icon:'' },
    { step:'04', title:'등록 완료', desc:'등록 후 학생 포털 계정이 발급되며 온라인 강의를 이용하실 수 있습니다.', icon:'' },
  ];

  const targets = [
    { grade:'초등', icon:'', desc:'기초 학습 습관 형성\n초등 수학·영어 집중\n중학교 대비 선행' },
    { grade:'중등', icon:'', desc:'내신 완벽 대비\n고등 대비 선행 학습\n학습 습관 정착' },
    { grade:'고등', icon:'', desc:'내신 + 수능 통합 관리\n목표 대학별 맞춤 전략\n실전 모의고사 대비' },
    { grade:'재수·반수', icon:'', desc:'수능 집중 완성 과정\n취약 과목 집중 공략\n정시·수시 동시 대비' },
  ];

  return React.createElement('div', { style:{ background:'#f8fafc', minHeight:'80vh' } },
    React.createElement('div', { style:{ background:'#1A1A1A', padding: isMobile ? '40px 16px' : '64px 40px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, 'Recruit'),
        React.createElement('h1', { style:{ fontSize: isMobile ? '30px' : '44px', fontWeight:'800', color:'#fff', letterSpacing:'-0.16px', lineHeight:'1.2', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '모집 안내'),
        React.createElement('p', { style:{ fontSize:'16px', color:'rgba(255,255,255,0.65)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } }, '지금 바로 상담을 신청하고\n첫 걸음을 시작하세요.')
      )
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding: isMobile ? '32px 16px' : '56px 40px' } },
      // 대상
      React.createElement('h2', { style:{ fontSize:'22px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '모집 대상'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:'12px', marginBottom:'48px' } },
        targets.map((t, i) =>
          React.createElement('div', { key:i, style:{ background:'#fff', borderRadius:'12px', padding:'20px 16px', textAlign:'center', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)' } },
            t.icon ? React.createElement('div', { style:{ fontSize:'28px', marginBottom:'8px' } }, t.icon) : null,
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, t.grade),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', whiteSpace:'pre-line' } }, t.desc)
          )
        )
      ),
      // 등록 과정
      React.createElement('h2', { style:{ fontSize:'22px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '등록 과정'),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'48px' } },
        steps.map((s, i) =>
          React.createElement('div', { key:i, style:{ background:'#fff', borderRadius:'12px', padding:'20px 24px', display:'flex', alignItems:'center', gap:'20px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)' } },
            React.createElement('div', { style:{ width:'48px', height:'48px', borderRadius:'50%', background:'#E60012', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, s.step),
            React.createElement('div', { style:{ flex:1 } },
              React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, s.icon + '  ' + s.title),
              React.createElement('div', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, s.desc)
            )
          )
        )
      ),
      // CTA
      React.createElement('div', { style:{ background:'#E60012', borderRadius:'16px', padding: isMobile ? '28px 20px' : '40px', textAlign:'center' } },
        React.createElement('div', { style:{ fontSize:'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '지금 바로 상담 신청하기'),
        React.createElement('p', { style:{ fontSize:'15px', color:'rgba(255,255,255,0.75)', fontFamily:'Manrope, sans-serif', marginBottom:'24px' } }, '첫 상담은 무료입니다. 부담 없이 연락해 주세요.'),
        React.createElement('button', { onClick:()=>setPage('contact'), style:{ background:'#fff', color:'#E60012', border:'none', borderRadius:'8px', padding:'14px 36px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
          onMouseDown:e=>e.currentTarget.style.transform='scale(0.97)',
          onMouseUp:e=>e.currentTarget.style.transform='scale(1)' },
          '무료 상담 신청 →'
        )
      )
    )
  );
}

/* ── 개인정보처리방침 ─────────── */
function PrivacyPolicyPage() {
  const isMobile = window.B2Utils.useIsMobile();
  const wrap = { background:'#fff', minHeight:'80vh', padding: isMobile ? '32px 18px' : '60px 40px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.82)' };
  const inner = { maxWidth:'860px', margin:'0 auto', lineHeight:'1.85', fontSize:'14px' };
  const h1 = { fontSize: isMobile ? '24px' : '30px', fontWeight:'800', color:'#111', margin:'0 0 8px' };
  const intro = { fontSize:'13px', color:'rgba(0,0,0,0.55)', marginBottom:'28px' };
  const h2 = { fontSize: isMobile ? '17px' : '19px', fontWeight:'800', color:'#111', margin:'28px 0 10px', borderTop:'1px solid rgba(0,0,0,0.08)', paddingTop:'22px' };
  const h3 = { fontSize:'14px', fontWeight:'700', color:'#1A1A1A', margin:'14px 0 6px' };
  const p = { margin:'6px 0 10px' };
  const ul = { margin:'4px 0 10px', paddingLeft:'22px' };
  const li = { margin:'3px 0' };
  const tableBox = { borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb', display:'grid', gridTemplateColumns: isMobile ? '110px 1fr' : '160px 1fr', fontSize:'13px', margin:'8px 0 14px' };
  const cellH = { background:'#f9fafb', padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontWeight:'700' };
  const cellV = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' };

  return React.createElement('div', { style:wrap },
    React.createElement('div', { style:inner },
      React.createElement('h1', { style:h1 }, '개인정보처리방침'),
      React.createElement('div', { style:intro }, 'B2빅뱅학원(이하 "학원")은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같은 개인정보 처리방침을 수립·공개합니다.'),

      React.createElement('h2', { style:h2 }, '제1조 (개인정보의 처리 목적)'),
      React.createElement('p', { style:p }, '학원은 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '회원 가입·관리 및 본인 식별·인증'),
        React.createElement('li', { style:li }, '학습 서비스 제공: 강의 수강, 과제 제출, 시험 응시, 학습 이력 관리'),
        React.createElement('li', { style:li }, '학부모-자녀 연결 및 학습 현황 공유'),
        React.createElement('li', { style:li }, '학원 공지·상담·민원 처리 및 안내'),
        React.createElement('li', { style:li }, '서비스 운영·개선을 위한 통계 분석')
      ),

      React.createElement('h2', { style:h2 }, '제2조 (처리하는 개인정보의 항목)'),
      React.createElement('h3', { style:h3 }, '필수 항목'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '회원가입: 이름, 이메일, 비밀번호, 역할(학생/학부모/선생님)'),
        React.createElement('li', { style:li }, '학생: 학교, 학년, 연락처, 학부모 연락처'),
        React.createElement('li', { style:li }, '학부모: 자녀와의 연결 정보(전화번호 매칭)'),
        React.createElement('li', { style:li }, '서비스 이용 기록: 학습 진도, 시험 결과, 숙제 제출 내역, 영상 시청 기록')
      ),
      React.createElement('h3', { style:h3 }, '선택 항목'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '주소, 추가 연락처'),
        React.createElement('li', { style:li }, '음성 답안(과제 제출 시 학생이 직접 녹음)')
      ),
      React.createElement('h3', { style:h3 }, '소셜 로그인(Google·Kakao·Naver) 이용 시'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '제공받는 항목: 이메일, 이름(또는 닉네임)'),
        React.createElement('li', { style:li }, '제공 목적: 본인 식별 및 학원에 등록된 회원 매칭')
      ),
      React.createElement('h3', { style:h3 }, '자동 수집 항목'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '서비스 이용 시각·접속 IP·브라우저 종류, 쿠키 및 sessionStorage 식별자')
      ),

      React.createElement('h2', { style:h2 }, '제3조 (개인정보의 처리 및 보유 기간)'),
      React.createElement('p', { style:p }, '학원은 법령에 따른 보유·이용 기간 또는 정보주체로부터 동의받은 보유·이용 기간 내에서 개인정보를 처리·보유합니다.'),
      React.createElement('div', { style:tableBox },
        React.createElement('div', { style:{ ...cellH, fontWeight:'800', background:'#f3f4f6' } }, '구분'),
        React.createElement('div', { style:{ ...cellV, fontWeight:'800', background:'#f3f4f6' } }, '보유 기간'),
        React.createElement('div', { style:cellH }, '회원 정보'),
        React.createElement('div', { style:cellV }, '회원 탈퇴 시까지 (탈퇴 후 즉시 파기, 단 분쟁 대응을 위해 30일 보관)'),
        React.createElement('div', { style:cellH }, '학습 이력'),
        React.createElement('div', { style:cellV }, '서비스 제공 종료 후 1년'),
        React.createElement('div', { style:cellH }, '음성 답안'),
        React.createElement('div', { style:cellV }, '채점 완료 후 90일 이내 자동 삭제'),
        React.createElement('div', { style:cellH }, '비밀번호 재설정 토큰'),
        React.createElement('div', { style:cellV }, '발급 후 1시간 (사용 시 즉시 무효화)')
      ),

      React.createElement('h2', { style:h2 }, '제4조 (개인정보의 제3자 제공)'),
      React.createElement('p', { style:p }, '학원은 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의·법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.'),
      React.createElement('p', { style:p }, '현재 학원은 정보주체의 개인정보를 제3자에게 제공하지 않습니다.'),

      React.createElement('h2', { style:h2 }, '제5조 (개인정보 처리의 위탁)'),
      React.createElement('p', { style:p }, '학원은 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다. 위탁계약 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 손해배상 등 책임에 관한 사항을 계약서에 명시하고 있습니다.'),
      React.createElement('div', { style:tableBox },
        React.createElement('div', { style:{ ...cellH, fontWeight:'800', background:'#f3f4f6' } }, '수탁자'),
        React.createElement('div', { style:{ ...cellV, fontWeight:'800', background:'#f3f4f6' } }, '위탁 업무'),
        React.createElement('div', { style:cellH }, 'Supabase Inc.'),
        React.createElement('div', { style:cellV }, '데이터베이스·인증·파일 저장 등 인프라 운영'),
        React.createElement('div', { style:cellH }, 'Sendinblue (Brevo)'),
        React.createElement('div', { style:cellV }, '비밀번호 재설정 등 거래 이메일 발송'),
        React.createElement('div', { style:cellH }, 'Google·Kakao·Naver'),
        React.createElement('div', { style:cellV }, '소셜 로그인(OAuth) 본인 인증')
      ),

      React.createElement('h2', { style:h2 }, '제6조 (정보주체와 법정대리인의 권리·의무 및 행사방법)'),
      React.createElement('p', { style:p }, '정보주체는 학원에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다.'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '개인정보 열람 요구'),
        React.createElement('li', { style:li }, '오류 등이 있을 경우 정정 요구'),
        React.createElement('li', { style:li }, '삭제 요구'),
        React.createElement('li', { style:li }, '처리 정지 요구')
      ),
      React.createElement('p', { style:p }, '권리 행사는 학원에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라 서면, 전자우편 등을 통하여 하실 수 있으며 학원은 이에 대해 지체 없이 조치하겠습니다. 만 14세 미만 아동의 개인정보에 관해서는 법정대리인이 권리를 행사할 수 있습니다.'),

      React.createElement('h2', { style:h2 }, '제7조 (개인정보의 파기)'),
      React.createElement('p', { style:p }, '학원은 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '파기 절차: 파기 사유가 발생한 개인정보를 선정하고, 학원의 개인정보 보호책임자 승인을 받아 파기합니다.'),
        React.createElement('li', { style:li }, '파기 방법: 전자적 파일 형태는 복구 불가능한 방식으로 영구 삭제하며, 종이 문서는 분쇄기로 분쇄하거나 소각합니다.')
      ),

      React.createElement('h2', { style:h2 }, '제8조 (개인정보의 안전성 확보 조치)'),
      React.createElement('p', { style:p }, '학원은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '관리적 조치: 개인정보 취급자 최소화 및 교육'),
        React.createElement('li', { style:li }, '기술적 조치: 비밀번호 SHA-256 해시 저장, 데이터 전송 시 HTTPS 암호화, 접근 권한 제한'),
        React.createElement('li', { style:li }, '물리적 조치: 자료 보관실 접근 통제')
      ),

      React.createElement('h2', { style:h2 }, '제9조 (쿠키 및 자동 수집 장치)'),
      React.createElement('p', { style:p }, '학원은 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 sessionStorage 및 쿠키(cookie)를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 거부 시 일부 서비스 이용에 어려움이 발생할 수 있습니다.'),

      React.createElement('h2', { style:h2 }, '제10조 (개인정보 보호책임자)'),
      React.createElement('p', { style:p }, '학원은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.'),
      React.createElement('div', { style:tableBox },
        React.createElement('div', { style:cellH }, '책임자'),
        React.createElement('div', { style:cellV }, '김도영 (원장)'),
        React.createElement('div', { style:cellH }, '연락처'),
        React.createElement('div', { style:cellV }, 'kimdoyoung868@gmail.com')
      ),
      React.createElement('p', { style:p }, '※ 위 내용은 학원의 실제 정보로 갱신해 주세요.'),

      React.createElement('h2', { style:h2 }, '제11조 (권익 침해 구제 방법)'),
      React.createElement('p', { style:p }, '정보주체는 개인정보 침해로 인한 구제를 받기 위하여 다음 기관에 분쟁 해결이나 상담 등을 신청할 수 있습니다.'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '개인정보분쟁조정위원회: 1833-6972 (privacy.go.kr)'),
        React.createElement('li', { style:li }, '개인정보침해신고센터: 118 (privacy.kisa.or.kr)'),
        React.createElement('li', { style:li }, '대검찰청: 1301 (spo.go.kr)'),
        React.createElement('li', { style:li }, '경찰청: 182 (ecrm.cyber.go.kr)')
      ),

      React.createElement('h2', { style:h2 }, '제12조 (개인정보 처리방침 변경)'),
      React.createElement('p', { style:p }, '이 개인정보 처리방침은 2026년 5월 7일부터 적용됩니다. 법령 또는 서비스 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경 사항을 시행 7일 전부터 본 페이지를 통해 공지하겠습니다.'),
      React.createElement('div', { style:{ marginTop:'30px', fontSize:'12px', color:'rgba(0,0,0,0.5)' } }, '시행일: 2026년 5월 7일')
    )
  );
}

/* ── 이용약관 ─────────── */
function TermsPage() {
  const isMobile = window.B2Utils.useIsMobile();
  const wrap = { background:'#fff', minHeight:'80vh', padding: isMobile ? '32px 18px' : '60px 40px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.82)' };
  const inner = { maxWidth:'860px', margin:'0 auto', lineHeight:'1.85', fontSize:'14px' };
  const h1 = { fontSize: isMobile ? '24px' : '30px', fontWeight:'800', color:'#111', margin:'0 0 8px' };
  const intro = { fontSize:'13px', color:'rgba(0,0,0,0.55)', marginBottom:'28px' };
  const h2 = { fontSize: isMobile ? '17px' : '19px', fontWeight:'800', color:'#111', margin:'28px 0 10px', borderTop:'1px solid rgba(0,0,0,0.08)', paddingTop:'22px' };
  const p = { margin:'6px 0 10px' };
  const ul = { margin:'4px 0 10px', paddingLeft:'22px' };
  const li = { margin:'3px 0' };

  return React.createElement('div', { style:wrap },
    React.createElement('div', { style:inner },
      React.createElement('h1', { style:h1 }, '이용약관'),
      React.createElement('div', { style:intro }, '본 약관은 B2빅뱅학원(이하 "학원")이 제공하는 온라인 학습 플랫폼(이하 "서비스")의 이용 조건과 절차, 이용자와 학원의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.'),

      React.createElement('h2', { style:h2 }, '제1조 (목적)'),
      React.createElement('p', { style:p }, '본 약관은 학원이 제공하는 학습 플랫폼 서비스 이용과 관련하여 학원과 회원 간의 권리, 의무, 책임 사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.'),

      React.createElement('h2', { style:h2 }, '제2조 (정의)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '"서비스": 학원이 운영하는 b2bigbang.com 웹사이트와 그 부속 기능을 의미합니다.'),
        React.createElement('li', { style:li }, '"회원": 학원에 등록되어 본 약관에 동의하고 서비스를 이용하는 학생, 학부모, 선생님을 말합니다.'),
        React.createElement('li', { style:li }, '"계정": 회원이 서비스 이용을 위해 부여받은 식별 정보(이메일·비밀번호 또는 소셜 로그인 정보)를 말합니다.')
      ),

      React.createElement('h2', { style:h2 }, '제3조 (약관의 효력 및 변경)'),
      React.createElement('p', { style:p }, '본 약관은 서비스 화면에 게시함으로써 효력을 발생합니다. 학원은 필요시 본 약관을 변경할 수 있으며, 변경된 약관은 시행 7일 전부터 공지합니다. 회원이 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.'),

      React.createElement('h2', { style:h2 }, '제4조 (회원가입)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '회원가입은 학원에 등록된 학생·학부모·선생님에 한해 본 약관 및 개인정보처리방침 동의 후 가입할 수 있습니다.'),
        React.createElement('li', { style:li }, '소셜 로그인(Google·Kakao·Naver)을 통해 가입한 경우, 학원에 사전에 등록된 이메일과 일치할 때 자동으로 매칭됩니다.'),
        React.createElement('li', { style:li }, '허위 정보로 가입한 경우 학원은 가입을 거절하거나 사후 회원 자격을 취소할 수 있습니다.')
      ),

      React.createElement('h2', { style:h2 }, '제5조 (회원의 의무)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '회원은 본인의 계정 정보를 안전하게 관리할 책임이 있으며, 제3자가 무단 사용하지 않도록 해야 합니다.'),
        React.createElement('li', { style:li }, '회원은 서비스를 이용함에 있어 관계 법령, 본 약관, 학원이 통지한 사항을 준수해야 합니다.'),
        React.createElement('li', { style:li }, '회원은 다른 회원의 학습을 방해하거나 서비스 운영을 저해하는 행위를 해서는 안 됩니다.')
      ),

      React.createElement('h2', { style:h2 }, '제6조 (학원의 의무)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '학원은 안정적인 서비스 운영을 위해 최선을 다합니다.'),
        React.createElement('li', { style:li }, '학원은 회원의 개인정보를 본 서비스의 개인정보처리방침에 따라 안전하게 보호합니다.'),
        React.createElement('li', { style:li }, '학원은 회원의 의견·불만이 정당하다고 인정될 경우 신속히 처리합니다.')
      ),

      React.createElement('h2', { style:h2 }, '제7조 (서비스 이용)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '서비스는 연중무휴 제공함을 원칙으로 하나, 시스템 점검·천재지변 등 부득이한 경우 일시 중단될 수 있습니다.'),
        React.createElement('li', { style:li }, '학원은 서비스 운영상 필요에 따라 일부 또는 전체 기능을 추가·변경·중단할 수 있습니다.')
      ),

      React.createElement('h2', { style:h2 }, '제8조 (서비스 이용 제한)'),
      React.createElement('p', { style:p }, '학원은 회원이 본 약관을 위반하거나 서비스의 정상적 운영을 방해한 경우 사전 통지 없이 서비스 이용을 일시 정지하거나 회원 자격을 박탈할 수 있습니다.'),

      React.createElement('h2', { style:h2 }, '제9조 (면책 조항)'),
      React.createElement('ul', { style:ul },
        React.createElement('li', { style:li }, '천재지변, 전쟁, 통신서비스 장애 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 학원은 책임을 지지 않습니다.'),
        React.createElement('li', { style:li }, '회원의 귀책사유로 인한 서비스 이용 장애에 대해 학원은 책임을 지지 않습니다.'),
        React.createElement('li', { style:li }, '회원이 서비스에 게재한 정보·자료의 신뢰도, 정확성에 대한 책임은 회원 본인에게 있습니다.')
      ),

      React.createElement('h2', { style:h2 }, '제10조 (분쟁 해결)'),
      React.createElement('p', { style:p }, '본 약관은 대한민국 법률에 따라 규정되고 이행되며, 서비스 이용과 관련하여 발생한 분쟁에 대해 학원과 회원 간 협의로 해결하되, 협의가 이루어지지 않을 경우 「민사소송법」상의 관할법원에 소를 제기할 수 있습니다.'),

      React.createElement('div', { style:{ marginTop:'30px', fontSize:'12px', color:'rgba(0,0,0,0.5)' } }, '시행일: 2026년 5월 7일')
    )
  );
}

Object.assign(window, { ServicePage, ContactPage, AboutPage, RecruitPage, PrivacyPolicyPage, TermsPage });
