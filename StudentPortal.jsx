// StudentPortal.jsx — Login modal + Course grid + Video player

const SUBJECT_COLORS = {
  '국어': '#2b5148',
  '영어': '#00754A',
  '수학': '#006241',
  '과학': '#1E3932',
};

/* ── Login Modal ──────────────────────────────── */
function LoginModal({ onLogin, onClose }) {
  const [tab, setTab] = React.useState('login');
  const [name, setName] = React.useState('');

  function handleProvider(provider) {
    const mockUser = provider === 'google'
      ? { id:'google_demo', name:'김학생', email:'student@gmail.com', provider:'google', enrolledCourses:[1,2] }
      : { id:'kakao_demo', name:'이수강', email:'student@kakao.com', provider:'kakao', enrolledCourses:[3,4] };
    onLogin(mockUser);
  }

  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }, onClick:onClose },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', width:'400px', padding:'36px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative' }, onClick:e=>e.stopPropagation() },
      React.createElement('button', { onClick:onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' } },
        React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#006241', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, 'B2'),
        React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '빅뱅학원')
      ),
      React.createElement('div', { style:{ display:'flex', borderBottom:'2px solid rgba(0,0,0,0.08)', marginBottom:'24px' } },
        ['login','signup'].map(t =>
          React.createElement('button', { key:t, onClick:()=>setTab(t), style:{ flex:1, padding:'10px', background:'none', border:'none', borderBottom: tab===t ? '2px solid #006241' : '2px solid transparent', marginBottom:'-2px', fontSize:'14px', fontWeight:'700', color: tab===t ? '#006241' : 'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, t==='login'?'로그인':'회원가입')
        )
      ),
      tab === 'signup' && React.createElement('div', { style:{ marginBottom:'16px', position:'relative', background:'#f9f9f9', borderRadius:'4px', border:'1px solid #d6dbde', padding:'14px 12px 10px' } },
        React.createElement('div', { style:{ position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, '이름'),
        React.createElement('input', { placeholder:'홍길동', value:name, onChange:e=>setName(e.target.value), style:{ width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' } })
      ),
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'12px' } },
        // Google
        React.createElement('button', { onClick:()=>handleProvider('google'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'1px solid rgba(0,0,0,0.2)', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em', transition:'all 0.2s ease' },
          onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)',
          onMouseEnter:e=>e.currentTarget.style.background='#f9f9f9', onMouseLeave:e=>e.currentTarget.style.background='#fff' },
          React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z', fill:'#4285F4' }),
            React.createElement('path', { d:'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill:'#34A853' }),
            React.createElement('path', { d:'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill:'#FBBC05' }),
            React.createElement('path', { d:'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill:'#EA4335' })
          ),
          tab==='login' ? 'Google로 로그인' : 'Google로 가입하기'
        ),
        // Kakao
        React.createElement('button', { onClick:()=>handleProvider('kakao'), style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', width:'100%', padding:'14px', borderRadius:'8px', border:'none', background:'#FEE500', cursor:'pointer', fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.85)', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em', transition:'all 0.2s ease' },
          onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)',
          onMouseEnter:e=>e.currentTarget.style.background='#f0d800', onMouseLeave:e=>e.currentTarget.style.background='#FEE500' },
          React.createElement('svg', { width:'20', height:'20', viewBox:'0 0 24 24' },
            React.createElement('path', { d:'M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.87 5.47 4.69 6.93l-.97 3.57c-.09.33.28.59.57.4l4.38-2.89c.43.05.87.08 1.33.08 5.52 0 10-3.69 10-8.25C22 6.69 17.52 3 12 3z', fill:'#3C1E1E' })
          ),
          tab==='login' ? '카카오톡으로 로그인' : '카카오톡으로 가입하기'
        )
      ),
      React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', textAlign:'center', marginTop:'16px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } }, '로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다.\n*데모 버전: 실제 로그인 없이 테스트 계정으로 진행됩니다')
    )
  );
}

/* ── Video Player ─────────────────────────────── */
function VideoPlayer({ course, onBack, studentName }) {
  const [playing, setPlaying] = React.useState(false);
  const playerRef = React.useRef(null);
  const [progress, setProgress] = React.useState(
    parseFloat(localStorage.getItem(`progress_${course.id}`) || '0')
  );
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          const next = Math.min(p + 0.5, 100);
          localStorage.setItem(`progress_${course.id}`, next);
          return next;
        });
      }, 300);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, course.id]);

  const lectures = [
    { n:1, title:'오리엔테이션 및 강좌 소개', duration:'25:00', done: progress > 20 },
    { n:2, title:'1단원: 개념 완성', duration:'45:00', done: progress > 40 },
    { n:3, title:'2단원: 유형 정리', duration:'50:00', done: progress > 60 },
    { n:4, title:'3단원: 실전 문제풀이', duration:'55:00', done: progress > 80 },
    { n:5, title:'모의고사 풀이 및 해설', duration:'60:00', done: progress > 95 },
  ];

  const today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\. /g,'.').replace('.','');

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    // Back button bar
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'6px' } }, '← 강의 목록으로'),
      React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
      React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, course.name)
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'20px 16px' } },
      // 영상 플레이어
      React.createElement('div', { ref: playerRef, style:{ background:'#1E3932', borderRadius:'12px', aspectRatio:'16/9', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', marginBottom:'12px', width:'100%' } },
        React.createElement('div', { style:{ position:'absolute', fontSize:'80px', fontWeight:'800', color:'rgba(255,255,255,0.05)', fontFamily:'Manrope, sans-serif' } }, course.subject),
        React.createElement('button', { onClick:()=>setPlaying(!playing), style:{ width:'64px', height:'64px', borderRadius:'50%', background: playing?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.9)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease', position:'relative', zIndex:2 } },
          React.createElement('span', { style:{ fontSize:'24px', marginLeft: playing?0:'4px', color: playing?'#fff':'#006241' } }, playing?'⏸':'▶')
        ),
        // 워터마크
        React.createElement('div', { style:{ position:'absolute', bottom:'16px', right:'16px', fontSize:'12px', fontWeight:'600', color:'rgba(255,255,255,0.25)', fontFamily:'Manrope, sans-serif', pointerEvents:'none', userSelect:'none', zIndex:3 } },
          `${studentName} · ${today}`
        ),
        // 전체화면 버튼 (유튜브 스타일)
        React.createElement('button', {
          onClick: () => {
            const el = playerRef.current;
            if (!el) return;
            if (document.fullscreenElement || document.webkitFullscreenElement) {
              if (document.exitFullscreen) document.exitFullscreen();
              else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            } else {
              if (el.requestFullscreen) el.requestFullscreen();
              else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            }
          },
          style:{ position:'absolute', bottom:'12px', right:'12px', background:'rgba(0,0,0,0.4)', border:'none', borderRadius:'4px', padding:'5px 7px', cursor:'pointer', color:'#fff', fontSize:'14px', zIndex:3, display:'flex', alignItems:'center', justifyContent:'center' }
        },
          React.createElement('svg', { width:'18', height:'18', viewBox:'0 0 24 24', fill:'#fff' },
            React.createElement('path', { d:'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z' })
          )
        ),
        playing && React.createElement('div', { style:{ position:'absolute', top:'16px', left:'16px', background:'rgba(192,18,20,0.9)', borderRadius:'8px', padding:'4px 12px', display:'flex', alignItems:'center', gap:'6px' } },
          React.createElement('div', { style:{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff' } }),
          React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '재생 중')
        )
      ),
      // 진행률 바
      React.createElement('div', { style:{ background:'#fff', borderRadius:'8px', padding:'12px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14)' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '학습 진도'),
        React.createElement('div', { style:{ flex:1, height:'6px', background:'#f2f0eb', borderRadius:'3px', overflow:'hidden' } },
          React.createElement('div', { style:{ height:'100%', background:'#006241', borderRadius:'3px', width:`${progress}%`, transition:'width 0.3s ease' } })
        ),
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, `${Math.round(progress)}%`)
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

/* ── Course List ──────────────────────────────── */
function CourseList({ subject, courses, studentGrade, enrolledIds, onSelectCourse, onBack }) {
  var subjectCourses = courses.filter(function(c) { return c.subject === subject && enrolledIds.includes(c.id); });
  var color = SUBJECT_COLORS[subject] || '#006241';
  var now = new Date();

  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'60vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px' } },
      React.createElement('button', { onClick: onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '\u2190 과목 선택으로')
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } },
        now.getFullYear() + '년 ' + (now.getMonth()+1) + '월 ' + subject + ' 강의'
      ),
      subjectCourses.length === 0
        ? React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center' } },
            React.createElement('p', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '배정된 강좌가 없습니다.')
          )
        : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
            subjectCourses.map(function(course, idx) {
              var progress = Math.round(parseFloat(localStorage.getItem('progress_' + course.id) || 0));
              return React.createElement('div', {
                key: course.id,
                onClick: function() { onSelectCourse(course); },
                style:{ background:'#fff', borderRadius:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'transform 0.15s ease' },
                onMouseEnter: function(e) { e.currentTarget.style.transform='translateX(3px)'; },
                onMouseLeave: function(e) { e.currentTarget.style.transform='translateX(0)'; },
              },
                React.createElement('div', { style:{ width:'5px', alignSelf:'stretch', background: color, flexShrink:0 } }),
                React.createElement('div', { style:{ width:'40px', textAlign:'center', fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.2)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, idx+1),
                React.createElement('div', { style:{ flex:1, padding:'16px 12px', minWidth:0 } },
                  React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
                    (studentGrade || course.grade) + ' ' + course.name
                  )
                ),
                React.createElement('div', { style:{ padding:'0 16px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' } },
                  React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color: progress > 0 ? color : 'rgba(0,0,0,0.25)', fontFamily:'Manrope, sans-serif' } }, progress + '%'),
                  React.createElement('div', { style:{ width:'40px', height:'4px', background:'#f2f0eb', borderRadius:'2px', overflow:'hidden' } },
                    React.createElement('div', { style:{ height:'100%', background: color, borderRadius:'2px', width: progress + '%', transition:'width 0.3s ease' } })
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
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [selectedSubject, setSelectedSubject] = React.useState(null);

  // 비로그인 상태
  if (!user) {
    return React.createElement('div', { style:{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'20px', background:'#f2f0eb', padding:'40px' } },
      React.createElement('div', { style:{ width:'72px', height:'72px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px' } }, '🎓'),
      React.createElement('h2', { style:{ fontSize:'28px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, '로그인이 필요합니다'),
      React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', textAlign:'center', lineHeight:'1.7' } }, '수강 중인 강의를 보려면 로그인해 주세요.\nGoogle 또는 카카오톡으로 간편하게 로그인할 수 있습니다.'),
      React.createElement('button', { onClick:onLoginClick, style:{ background:'#00754A', color:'#fff', border:'none', borderRadius:'8px', padding:'14px 32px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
        onMouseDown:e=>e.currentTarget.style.transform='scale(0.95)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, '로그인하기')
    );
  }

  // 학생 데이터
  const student = students.find(s => s.id === user.id);
  const studentGrade = student?.grade || null;
  const studentSubjects = student?.subjects || [];
  const enrolledIds = student?.enrolledCourses || [];

  // 과목별 수강 강좌
  const coursesBySubject = studentSubjects.reduce((acc, sub) => {
    acc[sub] = courses.filter(c => c.subject === sub && enrolledIds.includes(c.id));
    return acc;
  }, {});

  // 영상 시청 화면
  if (selectedCourse) {
    return React.createElement(VideoPlayer, { course:selectedCourse, onBack:()=>setSelectedCourse(null), studentName:user.name });
  }

  // 과목별 강좌 목록 화면
  if (selectedSubject) {
    return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
      React.createElement('div', { style:{ background:'#1E3932', padding:'28px 16px' } },
        React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
            React.createElement('div', { style:{ width:'44px', height:'44px', borderRadius:'50%', background:'#00754A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name[0]),
            React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name + '님')
          ),
          studentGrade && React.createElement('div', { style:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding:'6px 16px' } },
            React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, studentGrade)
          )
        )
      ),
      React.createElement(CourseList, {
        subject: selectedSubject,
        courses,
        studentGrade,
        enrolledIds,
        onSelectCourse: setSelectedCourse,
        onBack: () => setSelectedSubject(null),
      })
    );
  }

  // 과목 선택 화면
  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },

    // 상단 헤더
    React.createElement('div', { style:{ background:'#1E3932', padding:'28px 16px' } },
      React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'16px' } },
          React.createElement('div', { style:{ width:'52px', height:'52px', borderRadius:'50%', background:'#00754A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, user.name[0]),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'14px', color:'rgba(255,255,255,0.6)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, `${user.provider === 'google' ? 'Google' : '카카오'} 계정`),
            React.createElement('div', { style:{ fontSize:'22px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, `${user.name}님, 안녕하세요!`)
          )
        ),
        studentGrade && React.createElement('div', { style:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'8px', padding:'8px 20px' } },
          React.createElement('span', { style:{ fontSize:'14px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, studentGrade)
        )
      )
    ),

    // 수강 과목이 없는 경우
    studentSubjects.length === 0
      ? React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'24px 16px' } },
          React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'48px', textAlign:'center', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' } },
            React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '📚'),
            React.createElement('p', { style:{ fontSize:'15px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '배정된 강좌가 없습니다. 관리자에게 문의해 주세요.')
          )
        )
      : React.createElement(SubjectSelect, {
          studentSubjects,
          coursesBySubject,
          onSelect: setSelectedSubject,
        })
  );
}

Object.assign(window, { LoginModal, StudentPortal });
