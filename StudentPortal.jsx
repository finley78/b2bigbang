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
  var TOTAL_SEC = 54 * 60;
  var [playing, setPlaying] = React.useState(false);
  var [isFullscreen, setIsFullscreen] = React.useState(false);
  var [speed, setSpeed] = React.useState(1);
  var [currentSec, setCurrentSec] = React.useState(
    Math.round((parseFloat(localStorage.getItem('progress_' + course.id) || '0') / 100) * TOTAL_SEC)
  );
  var [showControls, setShowControls] = React.useState(true);
  var [seekDragging, setSeekDragging] = React.useState(false);
  var [skipAnim, setSkipAnim] = React.useState(null);
  var timerRef = React.useRef(null);
  var hideRef = React.useRef(null);
  var seekBarRef = React.useRef(null);
  var tapRef = React.useRef({ count: 0, timer: null, lastX: 0 });
  var speedRef = React.useRef(speed);
  React.useEffect(function() { speedRef.current = speed; }, [speed]);

  var progress = Math.min((currentSec / TOTAL_SEC) * 100, 100);

  // 재생 타이머
  React.useEffect(function() {
    if (playing && !seekDragging) {
      timerRef.current = setInterval(function() {
        setCurrentSec(function(s) {
          var next = Math.min(s + speedRef.current, TOTAL_SEC);
          localStorage.setItem('progress_' + course.id, (next / TOTAL_SEC * 100).toFixed(2));
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return function() { clearInterval(timerRef.current); };
  }, [playing, seekDragging]);

  // 컨트롤 숨김 타이머 — 재생 중일 때 2초 후 fade out
  function armHide() {
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(function() { setShowControls(false); }, 2000);
  }
  function showThenHide() {
    setShowControls(true);
    armHide();
  }
  React.useEffect(function() {
    if (playing) { armHide(); }
    else { clearTimeout(hideRef.current); setShowControls(true); }
  }, [playing]);
  React.useEffect(function() {
    return function() { clearTimeout(hideRef.current); document.body.style.overflow = ''; };
  }, []);

  function fmt(s) {
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // 시크바 드래그
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
    if (p !== null) setCurrentSec(Math.round(p * TOTAL_SEC));
  }
  function onSeekMove(e) {
    if (!seekDragging) return;
    var p = getSeekPct(e);
    if (p !== null) setCurrentSec(Math.round(p * TOTAL_SEC));
  }
  function onSeekEnd(e) {
    e.stopPropagation();
    setSeekDragging(false);
  }

  // 화면 탭: touchstart로 위치 기록, touchend로 판정 (딜레이 없는 즉각 반응)
  var touchStartRef = React.useRef({ x: 0, y: 0, time: 0 });
  function onPlayerTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }
  function onPlayerTouchEnd(e) {
    var dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
    var dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    var dt = Date.now() - touchStartRef.current.time;
    // 스와이프나 드래그면 무시
    if (dx > 10 || dy > 10 || dt > 500) return;

    var rect = e.currentTarget.getBoundingClientRect();
    var cx = e.changedTouches[0].clientX;
    var isLeft = cx < rect.left + rect.width / 2;

    tapRef.current.count += 1;
    tapRef.current.lastX = cx;
    clearTimeout(tapRef.current.timer);

    if (tapRef.current.count >= 2) {
      // 즉시 더블탭 처리
      tapRef.current.count = 0;
      clearTimeout(tapRef.current.timer);
      var dir = isLeft ? -10 : 10;
      setCurrentSec(function(s) { return Math.max(0, Math.min(TOTAL_SEC, s + dir)); });
      setSkipAnim(isLeft ? 'left' : 'right');
      setTimeout(function() { setSkipAnim(null); }, 500);
      if (playing) showThenHide();
    } else {
      // 싱글탭: 150ms 대기 후 더블탭 없으면 컨트롤 토글
      tapRef.current.timer = setTimeout(function() {
        tapRef.current.count = 0;
        if (playing) {
          if (showControls) { setShowControls(false); clearTimeout(hideRef.current); }
          else { showThenHide(); }
        }
      }, 150);
    }
  }

  var today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }).replace(/\. /g,'.').replace(/\.$/,'');
  var speeds = [1, 1.2, 1.5, 1.8, 2];

  function renderPlayer() {
    return React.createElement('div', {
      style:{ position:'relative', width:'100%', height:'100%', background:'#1E3932', overflow:'hidden', userSelect:'none', WebkitUserSelect:'none' },
      onTouchStart: onPlayerTouchStart,
      onTouchEnd: onPlayerTouchEnd,
    },
      // 배경 과목 텍스트
      React.createElement('div', { style:{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'80px', fontWeight:'800', color:'rgba(255,255,255,0.05)', fontFamily:'Manrope, sans-serif', pointerEvents:'none', whiteSpace:'nowrap' } }, course.subject),

      // 워터마크
      React.createElement('div', { style:{ position:'absolute', bottom:'48px', right:'12px', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.15)', fontFamily:'Manrope, sans-serif', pointerEvents:'none', zIndex:4 } },
        studentName + ' · ' + today
      ),

      // 스킵 표시
      skipAnim ? React.createElement('div', {
        style:{ position:'absolute', top:'50%', transform:'translateY(-50%)',
          left: skipAnim === 'left' ? '8%' : 'auto',
          right: skipAnim === 'right' ? '8%' : 'auto',
          background:'rgba(0,0,0,0.5)', borderRadius:'8px', padding:'8px 14px', pointerEvents:'none', zIndex:6 }
      },
        React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, skipAnim === 'left' ? '-10초' : '+10초')
      ) : null,

      // 컨트롤 레이어 — opacity로 fade in/out
      React.createElement('div', {
        style:{ position:'absolute', inset:0, zIndex:3,
          opacity: showControls ? 1 : 0,
          transition: showControls ? 'opacity 0.15s ease' : 'opacity 0.6s ease',
          background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.65) 100%)',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          pointerEvents: showControls ? 'auto' : 'none',
        },

        // 상단: 속도 버튼
      },
        React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', padding:'10px 12px', gap:'5px' } },
          speeds.map(function(s) {
            return React.createElement('button', {
              key: s,
              onTouchEnd: function(e) { e.stopPropagation(); setSpeed(s); if (playing) showThenHide(); },
              onClick: function(e) { e.stopPropagation(); setSpeed(s); if (playing) showThenHide(); },
              style:{ background: speed===s ? '#fff' : 'rgba(0,0,0,0.5)', border:'none', borderRadius:'4px', padding:'5px 9px', fontSize:'12px', fontWeight:'700', color: speed===s ? '#1E3932' : '#fff', cursor:'pointer', fontFamily:'Manrope, sans-serif', WebkitTapHighlightColor:'transparent' }
            }, s === 1 ? '1x' : s + 'x');
          })
        ),

        // 중앙: 재생/일시정지
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 } },
          React.createElement('button', {
            onTouchEnd: function(e) { e.stopPropagation(); setPlaying(function(p) { return !p; }); },
            onClick: function(e) { e.stopPropagation(); setPlaying(function(p) { return !p; }); },
            style:{ width:'68px', height:'68px', borderRadius:'50%', background: playing ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.92)', border:'2px solid rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent' }
          },
            React.createElement('span', { style:{ fontSize:'28px', marginLeft: playing ? 0 : '4px', color: playing ? '#fff' : '#1E3932', lineHeight:1 } }, playing ? '\u275A\u275A' : '\u25B6')
          )
        ),

        // 하단: 시크바 + 시간 + 전체화면
        React.createElement('div', { style:{ padding:'0 14px 12px' } },
          React.createElement('div', {
            ref: seekBarRef,
            style:{ position:'relative', height:'28px', display:'flex', alignItems:'center', marginBottom:'4px' },
            onTouchStart: onSeekStart, onTouchMove: onSeekMove, onTouchEnd: onSeekEnd,
            onMouseDown: onSeekStart, onMouseMove: onSeekMove, onMouseUp: onSeekEnd,
          },
            React.createElement('div', { style:{ position:'absolute', left:0, right:0, height:'3px', background:'rgba(255,255,255,0.25)', borderRadius:'2px' } }),
            React.createElement('div', { style:{ position:'absolute', left:0, height:'3px', background:'#ff0000', borderRadius:'2px', width: progress + '%', transition: seekDragging ? 'none' : 'width 1s linear' } }),
            React.createElement('div', { style:{ position:'absolute', left: progress + '%', transform:'translateX(-50%)', width:'14px', height:'14px', borderRadius:'50%', background:'#ff0000', transition: seekDragging ? 'none' : 'left 1s linear' } })
          ),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
            React.createElement('span', { style:{ fontSize:'12px', fontWeight:'600', color:'#fff', fontFamily:'Manrope, sans-serif' } }, fmt(currentSec) + ' / ' + fmt(TOTAL_SEC)),
            React.createElement('button', {
              onTouchEnd: function(e) { e.stopPropagation(); setIsFullscreen(function(f) { document.body.style.overflow = f ? '' : 'hidden'; return !f; }); },
              onClick: function(e) { e.stopPropagation(); setIsFullscreen(function(f) { document.body.style.overflow = f ? '' : 'hidden'; return !f; }); },
              style:{ background:'none', border:'none', cursor:'pointer', padding:'4px', WebkitTapHighlightColor:'transparent' }
            },
              React.createElement('svg', { width:'22', height:'22', viewBox:'0 0 24 24', fill:'#fff' },
                isFullscreen
                  ? React.createElement('path', { d:'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z' })
                  : React.createElement('path', { d:'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z' })
              )
            )
          )
        )
      )
    );
  }

  // 전체화면 — 세로 폰에서 가로로 강제 rotate
  if (isFullscreen) {
    return React.createElement('div', { style:{ position:'fixed', inset:0, zIndex:9999, background:'#000', overflow:'hidden' } },
      React.createElement('div', {
        style:{
          position:'absolute',
          top:'0', left:'0',
          width:'100vh',
          height:'100vw',
          transformOrigin:'top left',
          transform:'rotate(90deg) translateY(-100%)',
        }
      }, renderPlayer())
    );
  }

  // 일반 모드
  return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },
    React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'12px 20px', display:'flex', alignItems:'center', gap:'12px' } },
      React.createElement('button', { onClick:onBack, style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '\u2190 강의 목록으로'),
      React.createElement('span', { style:{ color:'rgba(0,0,0,0.2)' } }, '|'),
      React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, course.name)
    ),
    React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'20px 16px' } },
      React.createElement('div', { style:{ borderRadius:'12px', overflow:'hidden', marginBottom:'12px', width:'100%', aspectRatio:'16/9' } },
        renderPlayer()
      ),
      React.createElement('div', { style:{ background:'#fff', borderRadius:'8px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14)' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '학습 진도'),
        React.createElement('div', { style:{ flex:1, height:'6px', background:'#f2f0eb', borderRadius:'3px', overflow:'hidden' } },
          React.createElement('div', { style:{ height:'100%', background:'#006241', borderRadius:'3px', width: progress + '%', transition:'width 0.3s ease' } })
        ),
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, Math.round(progress) + '%')
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
