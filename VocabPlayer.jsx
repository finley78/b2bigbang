// VocabPlayer.jsx — 학생용 단어 학습/시험 화면 (PWA 우선)
// 4섹션: STUDY (자유 학습) / TEST (배포된 시험) / REPORT (본인 결과) / RANKING (반별 순위)

(function(){

  // ── 공용 스타일 ─────────────────────────────────────
  var THEME = {
    primary: '#E60012',
    primaryDark: '#B8000F',
    primaryBg: '#FFEBED',
    dark: '#1A1A1A',
    text: 'rgba(0,0,0,0.87)',
    textMid: 'rgba(0,0,0,0.6)',
    textLight: 'rgba(0,0,0,0.45)',
    border: '#e5e7eb',
    bg: '#f8fafc',
    cardBg: '#fff',
    success: '#16a34a',
    successBg: '#dcfce7',
    fail: '#c82014',
    failBg: '#fff5f5',
    font: 'Manrope, sans-serif',
  };
  var S = {
    page: { background: THEME.bg, minHeight: '80vh', fontFamily: THEME.font },
    card: { background: THEME.cardBg, borderRadius: '12px', padding: '16px', boxShadow: '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' },
    btnPrimary: { background: THEME.primary, color: '#fff', border: 'none', borderRadius: '10px', padding: '14px 22px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font },
    btnGhost: { background: 'transparent', color: THEME.textMid, border: '1px solid ' + THEME.border, borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: THEME.font },
    label: { fontSize: '11px', fontWeight: '700', color: THEME.textMid, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: THEME.font, marginBottom: '4px' },
  };

  // ── TTS 헬퍼 (브라우저 SpeechSynthesis) ────────────────
  // iOS PWA는 사용자 제스처 후 첫 재생만 허용 — 학습 시작 버튼이 그 트리거
  function speak(text, opts) {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel(); // 이전 재생 중단
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = (opts && opts.lang) || 'en-US';
      u.rate = (opts && opts.rate) || 0.8; // 학생용: 약간 느리게 발음
      u.pitch = (opts && opts.pitch) || 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ── 메인 (4섹션 메뉴 + 받은 연습/시험) ─────────────────────────────────
  function VocabPlayer(props) {
    var sb = window.supabase;
    var user = props.user || {};
    var [view, setView] = React.useState('home'); // 'home' | 'study' | 'test' | 'report' | 'ranking' | 'assignment'
    var [assignments, setAssignments] = React.useState([]); // 받은 연습/시험
    var [attemptedIds, setAttemptedIds] = React.useState({}); // { assignment_id: true } — 본인이 응시한 발행
    var [selectedAssignment, setSelectedAssignment] = React.useState(null);

    React.useEffect(function(){
      (async function(){
        try {
          // 내가 받은 연습/시험 + 내 응시 기록 — 모두 user.id 의존, 서로 독립 → 병렬
          var quad = await Promise.all([
            sb.from('class_students').select('class_id').eq('student_id', user.id),
            sb.from('vocab_assignment_students').select('assignment_id').eq('student_id', user.id),
            sb.from('vocab_assignments').select('*, vocab_lists(name)').eq('status', 'open').order('created_at', { ascending: false }),
            sb.from('vocab_assignment_attempts').select('assignment_id').eq('student_id', user.id)
          ]);
          var myClassIds = ((quad[0] && quad[0].data) || []).map(function(r){ return r.class_id; });
          var myIndIds = ((quad[1] && quad[1].data) || []).map(function(r){ return r.assignment_id; });
          var all = (quad[2] && quad[2].data) || [];
          var atMap = {};
          (((quad[3] && quad[3].data) || [])).forEach(function(r){ atMap[r.assignment_id] = true; });
          setAttemptedIds(atMap);
          var myGrade = String(user.grade || '');
          var myLevel = (myGrade.indexOf('초') === 0) ? '초' : (myGrade.indexOf('중') === 0) ? '중' : (myGrade.indexOf('고') === 0) ? '고' : '';
          var myGradeNum = myGrade.replace(/[^0-9]/g, '');
          var mine = all.filter(function(a){
            // 안전망: 비활성/삭제된 단어장은 학생 RLS로 vocab_lists 조인이 null → 화면에서 숨김
            if (!a.vocab_lists) return false;
            if (a.target_class_id && myClassIds.indexOf(a.target_class_id) >= 0) return true;
            if (myIndIds.indexOf(a.id) >= 0) return true;
            // 초중고+학년 매칭 (둘 다 NULL이면 안 잡힘 — 반/개별로만)
            if (a.target_school_level || a.target_grade) {
              var levelOk = !a.target_school_level || a.target_school_level === myLevel;
              var gradeOk = !a.target_grade || String(a.target_grade) === myGradeNum;
              if (levelOk && gradeOk && (a.target_school_level || a.target_grade)) return true;
            }
            return false;
          });
          setAssignments(mine);
        } catch (e) { console.error('받은 연습/시험 로드 실패:', e); }
      })();
    }, []);

    function back() { setView('home'); setSelectedAssignment(null); }

    function pickAssignment(a) { setSelectedAssignment(a); setView('assignment'); }

    if (view === 'study') return React.createElement(StudyMenu, { user: user, assignments: assignments, onPickAssignment: pickAssignment, onBack: back });
    if (view === 'test') return React.createElement(TestMenu, { user: user, assignments: assignments, onPickAssignment: pickAssignment, onBack: back });
    if (view === 'report') return React.createElement(ReportCard, { user: user, onBack: back });
    if (view === 'ranking') return React.createElement(Ranking, { user: user, onBack: back });
    if (view === 'assignment' && selectedAssignment) return React.createElement(AssignmentRunner, { user: user, assignment: selectedAssignment, onBack: back });

    // '오늘 할 일' = 본인 미응시 시험 N개 (마감 지난 건 제외). 마감 임박(7일 이내) 있으면 강조.
    var now = Date.now();
    var dayMs = 86400000;
    var todoTests = assignments.filter(function(a){
      if (a.mode !== 'test') return false;
      if (a.due_at && new Date(a.due_at).getTime() < now) return false;
      return !attemptedIds[a.id];
    });
    var todoCount = todoTests.length;
    var urgentInTodo = todoTests.filter(function(a){
      if (!a.due_at) return false;
      var due = new Date(a.due_at).getTime();
      return due >= now && due <= now + 7 * dayMs;
    }).length;

    var sections = [
      { id: 'study', label: 'STUDY', desc: '받은 학습 풀기', color: '#1d4ed8' },
      { id: 'test', label: 'TEST', desc: '받은 시험 풀기', color: THEME.primary },
      { id: 'report', label: 'REPORT', desc: '내 시험 결과', color: '#c87000' },
      { id: 'ranking', label: 'RANKING', desc: '반별 순위', color: '#006241' },
    ];

    return React.createElement('div', { style: S.page },
      React.createElement('div', { style: { padding: '18px 16px 24px', maxWidth: '720px', margin: '0 auto' } },
        React.createElement('h1', { style: { fontSize: '22px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font, margin: 0, marginBottom: '6px' } }, '단어장'),
        React.createElement('p', { style: { fontSize: '13px', color: THEME.textMid, fontFamily: THEME.font, marginBottom: '14px' } }, '학습·시험·결과·순위를 여기서 확인하세요'),

        // 오늘 할 일 배지 — 미응시 시험 카운트(마감 지난 건 제외). 마감 임박 있으면 강조.
        todoCount > 0 && React.createElement('button', { onClick: function(){ setView('test'); },
          style: { background: '#fef3c7', border: '1.5px solid #fbbf24', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: THEME.font, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '11px', color: '#92400e', fontWeight: '800', letterSpacing: '0.04em' } }, '오늘 할 일'),
            React.createElement('div', { style: { fontSize: '14px', color: '#1A1A1A', fontWeight: '800', marginTop: '2px' } },
              '미응시 시험 ' + todoCount + '개' + (urgentInTodo > 0 ? ' (마감 임박 ' + urgentInTodo + ')' : '')
            )
          ),
          React.createElement('span', { style: { fontSize: '18px', color: '#92400e', fontWeight: '800' } }, '›')
        ),

        // 4섹션 카드
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
          sections.map(function(sec){
            return React.createElement('button', { key: sec.id, onClick: function(){ setView(sec.id); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '14px', padding: '20px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: THEME.font, transition: 'all 0.15s', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '15px', fontWeight: '800', color: sec.color, marginBottom: '2px' } }, sec.label),
                React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid } }, sec.desc)
              )
            );
          })
        )
      )
    );
  }

  // ── 받은 연습/시험 풀기 — assignment 객체 받아서 4단계 학습 세트 player 호출 ─────
  function AssignmentRunner(props) {
    var sb = window.supabase;
    var a = props.assignment;
    var user = props.user || {};
    var [list, setList] = React.useState(null);
    var [words, setWords] = React.useState([]);
    var [loading, setLoading] = React.useState(true);

    React.useEffect(function(){
      (async function(){
        try {
          // list, words 둘 다 list_id에만 의존 → 병렬. unit_size 결합은 클라이언트에서.
          var pair = await Promise.all([
            sb.from('vocab_lists').select('*').eq('id', a.list_id).maybeSingle(),
            sb.from('vocab_words').select('*').eq('list_id', a.list_id).order('sort_order', { ascending: true }).order('created_at', { ascending: true })
          ]);
          var lst = pair[0] && pair[0].data;
          setList(lst);
          if (lst) {
            var us = lst.unit_size || 20;
            var allWords = (pair[1] && pair[1].data) || [];
            var startIdx = (a.unit_index - 1) * us;
            setWords(allWords.slice(startIdx, startIdx + us));
          }
        } catch (e) { console.error('단어장 로드 실패:', e); }
        setLoading(false);
      })();
    }, []);

    if (loading) return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '불러오는 중', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '잠시만요...')
    );
    if (!list) return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '오류', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '단어장을 찾을 수 없어요.')
    );

    return React.createElement(StudySet5Player, {
      list: list,
      unitIndex: a.unit_index,
      words: words,
      mode: 'study5',
      onBack: props.onBack,
      onDone: props.onBack,
      stagesFilter: a.stages,        // 체크한 단계만
      assignment: a,                  // 시험 모드면 응시 기록용
      user: user,
    });
  }

  // ── STUDY: 받은 단어장 자유학습 (시험·연습 무관) → UNIT → 학습 모드 ─────────
  function StudyMenu(props) {
    var sb = window.supabase;
    var assignments = props.assignments || [];
    // 받은 단어장의 list_id 집합 (mode 무관 — 시험만 받았어도 STUDY에서 자유 연습 가능)
    var receivedListIds = Array.from(new Set(assignments.map(function(a){ return a.list_id; }).filter(Boolean)));

    var [stage, setStage] = React.useState('list'); // list | units | modes | playing
    var [lists, setLists] = React.useState([]);
    var [selectedList, setSelectedList] = React.useState(null);
    var [unitWords, setUnitWords] = React.useState([]);
    var [selectedUnit, setSelectedUnit] = React.useState(null);
    var [selectedMode, setSelectedMode] = React.useState(null);
    var [loading, setLoading] = React.useState(true);

    React.useEffect(function(){ loadLists(); }, []);

    async function loadLists() {
      setLoading(true);
      try {
        if (receivedListIds.length === 0) { setLists([]); setLoading(false); return; }
        var res = await sb.from('vocab_lists').select('id, name, subject, grade, unit_size').in('id', receivedListIds).eq('is_active', true).order('created_at', { ascending: false });
        var rows = (res && res.data) || [];
        if (rows.length) {
          var ids = rows.map(function(r){ return r.id; });
          var cRes = await sb.rpc('vocab_word_counts', { list_ids: ids });
          var counts = {};
          (((cRes && cRes.data) || [])).forEach(function(x){ counts[x.list_id] = parseInt(x.cnt, 10) || 0; });
          rows.forEach(function(r){ r._wordCount = counts[r.id] || 0; r._unitCount = Math.ceil((r._wordCount || 0) / (r.unit_size || 20)); });
        }
        setLists(rows);
      } catch (e) {}
      setLoading(false);
    }

    async function pickList(L) {
      setSelectedList(L);
      setStage('units');
      var wRes = await sb.from('vocab_words').select('*').eq('list_id', L.id).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
      setUnitWords((wRes && wRes.data) || []);
    }
    function pickUnit(u) { setSelectedUnit(u); setStage('modes'); }
    function pickMode(m) { setSelectedMode(m); setStage('playing'); }

    function backStage() {
      if (stage === 'playing') { setSelectedMode(null); setStage('modes'); }
      else if (stage === 'modes') { setSelectedUnit(null); setStage('units'); }
      else if (stage === 'units') { setSelectedList(null); setUnitWords([]); setStage('list'); }
      else props.onBack();
    }

    if (stage === 'playing' && selectedList && selectedUnit && selectedMode) {
      var unitSize = selectedList.unit_size || 20;
      var startIdx = (selectedUnit - 1) * unitSize;
      var words = unitWords.slice(startIdx, startIdx + unitSize);
      return React.createElement(StudyPlayer, {
        list: selectedList,
        unitIndex: selectedUnit,
        words: words,
        mode: selectedMode,
        onBack: backStage,
        onDone: function(){ setStage('modes'); setSelectedMode(null); },
      });
    }

    var pageTitle = stage === 'list' ? '받은 단어장' : stage === 'units' ? selectedList.name + ' — UNIT 선택' : '학습 모드 선택';

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '학습 (STUDY)', subtitle: pageTitle, onBack: backStage }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        loading
          ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: '#9ca3af' } }, '불러오는 중...')
          : stage === 'list' ? (
            !lists.length
              ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) }, '아직 선생님이 보낸 단어장이 없어요.')
              : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                  lists.filter(function(L){ return L._wordCount > 0; }).map(function(L){
                    return React.createElement('button', { key: L.id, onClick: function(){ pickList(L); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '12px', padding: '16px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'left' } },
                      React.createElement('div', { style: { fontSize: '15px', fontWeight: '800', color: THEME.dark, marginBottom: '6px' } }, L.name),
                      React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid } },
                        [L.subject, L.grade, L._wordCount + '단어', 'UNIT ' + L._unitCount + '개'].filter(Boolean).join(' · ')
                      )
                    );
                  })
                )
          ) : stage === 'units' ? (
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' } },
              (function(){
                var us = selectedList.unit_size || 20;
                var uc = Math.ceil(unitWords.length / us);
                var arr = [];
                for (var u = 1; u <= uc; u++) {
                  var ws = unitWords.slice((u-1)*us, u*us);
                  arr.push({ unit: u, words: ws });
                }
                return arr;
              })().map(function(uo){
                return React.createElement('button', { key: uo.unit, onClick: function(){ pickUnit(uo.unit); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '12px', padding: '16px 12px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'center', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' } },
                  React.createElement('div', { style: { fontSize: '11px', fontWeight: '700', color: THEME.textLight } }, 'UNIT'),
                  React.createElement('div', { style: { fontSize: '24px', fontWeight: '800', color: THEME.primary } }, uo.unit),
                  React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid } }, uo.words.length + '단어')
                );
              })
            )
          ) : (
            React.createElement('div', null,
              React.createElement('div', { style: Object.assign({}, S.card, { marginBottom: '12px', background: THEME.primaryBg }) },
                React.createElement('div', { style: { fontSize: '11px', color: THEME.primary, fontWeight: '700', marginBottom: '4px' } }, '선택됨'),
                React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark } }, selectedList.name + ' · UNIT ' + selectedUnit)
              ),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' } },
                [
                  { id: 'study5', label: '4단계 학습 세트', desc: '단어 → 예문 해석 → 영작 → 어법 순서로 풀기', highlight: true },
                  { id: 'flashcard', label: 'Flash Card', desc: '단어를 보고 외우기 (자동 진행, 발음 자동)' },
                  { id: 'multiple_choice', label: '객관식', desc: '4지선다로 뜻 맞추기' },
                  { id: 'spelling', label: '스펠링 채우기', desc: '일부 빈칸을 채우기' },
                  { id: 'writing', label: '뜻 보고 쓰기', desc: '뜻을 보고 단어 쓰기' },
                  { id: 'listening', label: '듣고 쓰기', desc: '발음을 듣고 단어 쓰기' },
                ].map(function(m){
                  return React.createElement('button', { key: m.id, onClick: function(){ pickMode(m.id); }, style: { background: m.highlight ? THEME.primaryBg : '#fff', border: '1.5px solid ' + (m.highlight ? THEME.primary : THEME.border), borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'left' } },
                    React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: m.highlight ? THEME.primary : THEME.dark } }, m.label),
                    React.createElement('div', { style: { fontSize: '11px', color: m.highlight ? THEME.primary : THEME.textMid, marginTop: '2px' } }, m.desc)
                  );
                })
              )
            )
          )
      )
    );
  }

  // ── STUDY 학습 화면 (모드별 라우팅) ───────────────────
  function StudyPlayer(props) {
    if (props.mode === 'flashcard') return React.createElement(FlashCardPlayer, props);
    if (props.mode === 'study5') return React.createElement(StudySet5Player, props);
    return React.createElement(StudyQuizPlayer, props);
  }

  // ── Flash Card 학습 ─────────────────────────────────
  function FlashCardPlayer(props) {
    var [idx, setIdx] = React.useState(0);
    var [autoPlay, setAutoPlay] = React.useState(true); // 자동 진행 on/off
    var [started, setStarted] = React.useState(false); // iOS TTS 활성화용
    var SECONDS = 7; // Flash Card 카드당 시간 (3회 발음 + 학생 따라 읽기 시간 포함)

    var word = props.words[idx];
    var total = props.words.length;
    var progress = total > 0 ? ((idx + 1) / total) * 100 : 0;

    // 시작 / 카드 변경 시 발음 자동 재생 (한 카드당 3회)
    React.useEffect(function(){
      if (!started || !word) return;
      var schedule = [100, 2000, 4000]; // ms 시점에 각각 발음
      var timers = schedule.map(function(ms){
        return setTimeout(function(){ speak(word.word); }, ms);
      });
      return function(){ timers.forEach(clearTimeout); };
    }, [idx, started]);

    // 자동 진행
    React.useEffect(function(){
      if (!started || !autoPlay || !word) return;
      var t = setTimeout(function(){
        if (idx < total - 1) setIdx(idx + 1);
        else setAutoPlay(false); // 끝
      }, SECONDS * 1000);
      return function(){ clearTimeout(t); };
    }, [idx, autoPlay, started]);

    function next() {
      if (idx < total - 1) setIdx(idx + 1);
    }
    function prev() {
      if (idx > 0) setIdx(idx - 1);
    }

    if (!total) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: 'Flash Card', subtitle: '단어가 없습니다', onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px 16px', textAlign: 'center', color: THEME.textMid } }, '학습할 단어가 없습니다.')
      );
    }

    if (!started) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: 'Flash Card', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px 16px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' } },
          React.createElement('div', { style: Object.assign({}, S.card, { padding: '40px 20px' }) },
            React.createElement('div', { style: { fontSize: '17px', fontWeight: '800', color: THEME.dark, marginBottom: '8px' } }, '카드 ' + total + '장 학습 시작'),
            React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, marginBottom: '20px', lineHeight: '1.7' } }, '단어가 ' + SECONDS + '초씩 자동으로 넘어가며 발음이 자동 재생됩니다.\n중간에 멈추거나 이전/다음 카드로 이동할 수 있어요.'),
            React.createElement('button', { onClick: function(){ setStarted(true); }, style: S.btnPrimary }, '시작')
          )
        )
      );
    }

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: 'Flash Card', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),

      React.createElement('div', { style: { padding: '12px 16px', maxWidth: '600px', margin: '0 auto' } },
        // 진행률
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font } }, (idx + 1) + ' / ' + total),
          React.createElement('div', { style: { flex: 1, height: '6px', background: THEME.border, borderRadius: '3px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: progress + '%', height: '100%', background: THEME.primary, transition: 'width 0.3s' } })
          )
        ),

        // 카드 본체
        React.createElement('div', { style: Object.assign({}, S.card, { padding: '40px 20px', textAlign: 'center', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }) },
          React.createElement('div', { style: { fontSize: '36px', fontWeight: '800', color: THEME.dark, marginBottom: '14px', wordBreak: 'break-word' } }, word.word),
          React.createElement('button', { onClick: function(){ speak(word.word); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '8px 14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font, marginBottom: '24px', alignSelf: 'center' } }, '다시 듣기'),
          React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: THEME.text, marginBottom: '8px' } }, word.meaning)
        ),

        // 컨트롤
        React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' } },
          React.createElement('button', { onClick: prev, disabled: idx === 0, style: Object.assign({}, S.btnGhost, { flex: 1, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }) }, '← 이전'),
          React.createElement('button', { onClick: function(){ setAutoPlay(!autoPlay); }, style: Object.assign({}, S.btnGhost, { padding: '10px 14px', background: autoPlay ? THEME.primaryBg : '#fff', color: autoPlay ? THEME.primary : THEME.textMid, borderColor: autoPlay ? THEME.primary : THEME.border }) }, autoPlay ? '정지' : '재생'),
          idx < total - 1
            ? React.createElement('button', { onClick: next, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, '다음 →')
            : React.createElement('button', { onClick: props.onDone, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, '완료')
        )
      )
    );
  }

  // ── STUDY 4단계 학습 세트 (1단계 단어 → 2단계 해석 → 3단계 영작 → 어법) ─────
  // vocab_study_sets 행에 저장된 stage1/stage2/stage3/grammar 를 순서대로 푸는 학습 흐름.
  // 점수 저장 안 함 — 자유 학습.
  function StudySet5Player(props) {
    var sb = window.supabase;
    var assignment = props.assignment || null;
    var stagesFilter = (props.stagesFilter && props.stagesFilter.length) ? props.stagesFilter : null;
    var [studyData, setStudyData] = React.useState(null);
    var [loading, setLoading] = React.useState(true);
    // 첫 단계 — stagesFilter 가 있으면 그 안 첫 번째
    var FULL_ORDER = ['1', '2', '3', 'grammar'];
    var STAGE_ORDER = stagesFilter ? FULL_ORDER.filter(function(s){ return stagesFilter.indexOf(s) >= 0; }) : FULL_ORDER;
    var initialStage = STAGE_ORDER[0] || '1';
    var [stage, setStage] = React.useState(initialStage);
    var [idx, setIdx] = React.useState(0);
    var [phase, setPhase] = React.useState('answering'); // 'answering' | 'showing'
    var [answers, setAnswers] = React.useState({}); // { stage: { idx: userAns } }
    var [stageScores, setStageScores] = React.useState({}); // { stage: {correct, total} }
    var [startedAt] = React.useState(Date.now());
    var attemptSavedRef = React.useRef(false);

    React.useEffect(function(){
      (async function(){
        try {
          var res = await sb.from('vocab_study_sets').select('*').eq('list_id', props.list.id).eq('unit_index', props.unitIndex).maybeSingle();
          if (res && res.data) setStudyData(res.data);
        } catch (e) { console.error('학습 세트 로드 실패:', e); }
        setLoading(false);
      })();
    }, []);
    var STAGE_LABEL = { '1': '1단계 — 단어', '2': '2단계 — 예문 해석', '3': '3단계 — 영작 빈칸', 'grammar': '어법 — 문법 분석' };
    function getStageItems(s) {
      if (!studyData) return [];
      if (s === '1') return studyData.stage1 || [];
      if (s === '2') return studyData.stage2 || [];
      if (s === '3') return studyData.stage3 || [];
      if (s === 'grammar') return studyData.grammar || [];
      return [];
    }
    function nextStage(s) {
      var i = STAGE_ORDER.indexOf(s);
      return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
    }
    // 객관식 보기 셔플 — 문제별로 시드 고정해서 re-render 시 흔들리지 않게
    function seededShuffle(arr, seed) {
      var r = arr.slice();
      var s = seed;
      for (var i = r.length - 1; i > 0; i--) {
        s = (s * 9301 + 49297) % 233280;
        var j = Math.floor((s / 233280) * (i + 1));
        var t = r[i]; r[i] = r[j]; r[j] = t;
      }
      return r;
    }
    function stageIdxSeed(stageKey, idx) {
      var s = idx * 31 + 1;
      for (var c = 0; c < stageKey.length; c++) s = (s * 17 + stageKey.charCodeAt(c)) % 1000000;
      return s + 1;
    }
    function isCorrect(stageKey, item, userAns) {
      if (userAns == null || userAns === '') return false;
      if (stageKey === 'grammar') {
        // userAns는 선택한 옵션 텍스트. 정답은 1-based index → options[correct-1]
        var correctText = (item.options || [])[(item.correct || 1) - 1];
        return userAns === correctText;
      }
      if (stageKey === '3') {
        // 영작 — 빈칸 정답 배열을 ',' 로 모은 사용자 입력과 비교
        var got = String(userAns || '').split('|||').map(function(s){ return String(s||'').trim().toLowerCase(); });
        var want = (item.answers || []).map(function(s){ return String(s||'').trim().toLowerCase(); });
        if (got.length !== want.length) return false;
        for (var k = 0; k < want.length; k++) if (got[k] !== want[k]) return false;
        return true;
      }
      return String(userAns).trim() === String(item.correct || '').trim();
    }
    function recordAnswer(userAns) {
      if (phase !== 'answering') return;
      var sa = Object.assign({}, answers);
      if (!sa[stage]) sa[stage] = {};
      sa[stage] = Object.assign({}, sa[stage]);
      sa[stage][idx] = userAns;
      setAnswers(sa);
      setPhase('showing');
    }
    function goNext() {
      var items = getStageItems(stage);
      if (idx < items.length - 1) {
        setIdx(idx + 1);
        setPhase('answering');
      } else {
        // 단계 종료 — 점수 계산 + 다음 단계
        var sa = answers[stage] || {};
        var correct = 0;
        items.forEach(function(it, i){ if (isCorrect(stage, it, sa[i])) correct++; });
        setStageScores(function(p){ var o = Object.assign({}, p); o[stage] = { correct: correct, total: items.length }; return o; });
        var ns = nextStage(stage);
        if (ns && getStageItems(ns).length > 0) {
          setStage(ns); setIdx(0); setPhase('answering');
        } else {
          setStage('done');
        }
      }
    }
    function goPrev() {
      if (idx <= 0) return;
      setIdx(idx - 1);
      setPhase('showing');
    }

    if (loading) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '4단계 학습 세트', onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '학습 자료 불러오는 중...')
      );
    }
    if (!studyData) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '4단계 학습 세트', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px 20px', textAlign: 'center', color: THEME.textMid, fontFamily: THEME.font, lineHeight: '1.7' } },
          React.createElement('div', { style: { fontSize: '15px', fontWeight: '700', color: THEME.dark, marginBottom: '10px' } }, '이 유닛엔 아직 4단계 학습 세트가 없어요'),
          '선생님이 학습 세트를 등록하면 풀 수 있습니다.'
        )
      );
    }
    // 종료 화면 — 단계별 점수 + 종합
    if (stage === 'done') {
      var totalCorrect = 0, totalCount = 0;
      STAGE_ORDER.forEach(function(s){ var sc = stageScores[s]; if (sc) { totalCorrect += sc.correct; totalCount += sc.total; } });
      var pct = totalCount > 0 ? Math.round(totalCorrect * 100 / totalCount) : 0;
      // 시험(assignment.mode==='test')이면 응시 결과 기록 — 한 번만
      if (assignment && assignment.mode === 'test' && !attemptSavedRef.current && totalCount > 0) {
        attemptSavedRef.current = true;
        (async function(){
          try {
            // 응시 회차 = 기존 시도 수 + 1
            var prev = await sb.from('vocab_assignment_attempts').select('id').eq('assignment_id', assignment.id).eq('student_id', props.user.id);
            var attemptNumber = ((prev && prev.data) || []).length + 1;
            await sb.from('vocab_assignment_attempts').insert({
              assignment_id: assignment.id,
              student_id: props.user.id,
              student_name: props.user.name || null,
              stage_scores: stageScores,
              total_correct: totalCorrect,
              total_questions: totalCount,
              percentage: totalCount > 0 ? Math.round(totalCorrect * 1000 / totalCount) / 10 : 0,
              started_at: new Date(startedAt).toISOString(),
              submitted_at: new Date().toISOString(),
              time_taken_seconds: Math.floor((Date.now() - startedAt) / 1000),
              attempt_number: attemptNumber,
            });
            // 학부모·관리자 '성적' 화면에 단어시험 점수 반영 (학생 최고점 1행)
            if (window.B2Utils && window.B2Utils.syncVocabAssignmentScore) {
              try { await window.B2Utils.syncVocabAssignmentScore(assignment.id, props.user.id); } catch (e) {}
            }
          } catch (e) { console.error('응시 결과 저장 실패:', e); }
        })();
      }
      var assignmentBadge = assignment ? React.createElement('div', { style: { background: assignment.mode === 'test' ? '#fef3c7' : '#dbeafe', color: assignment.mode === 'test' ? '#92400e' : '#1d4ed8', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: '8px' } }, assignment.mode === 'test' ? '시험 응시 완료 — 결과 저장됨' : '연습 완료 — 점수 기록 안 함') : null;
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '4단계 학습 — 결과', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: function(){ props.onDone && props.onDone(); } }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '600px', margin: '0 auto' } },
          React.createElement('div', { style: Object.assign({}, S.card, { padding: '32px 20px', textAlign: 'center', marginBottom: '14px' }) },
            assignmentBadge,
            React.createElement('div', { style: { fontSize: '52px', fontWeight: '800', color: pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail } }, pct + '점'),
            React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginTop: '6px' } }, totalCorrect + ' / ' + totalCount + ' 정답')
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' } },
            STAGE_ORDER.filter(function(s){ return stageScores[s]; }).map(function(s){
              var sc = stageScores[s];
              var p = sc.total > 0 ? Math.round(sc.correct * 100 / sc.total) : 0;
              return React.createElement('div', { key: s, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#fff', border: '1px solid ' + THEME.border, borderRadius: '10px' } },
                React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark } }, STAGE_LABEL[s]),
                React.createElement('div', { style: { fontSize: '13px', fontWeight: '800', color: p >= 80 ? THEME.success : p >= 60 ? '#c87000' : THEME.fail } }, sc.correct + ' / ' + sc.total + ' (' + p + '%)')
              );
            })
          ),
          React.createElement('button', { onClick: function(){ props.onDone && props.onDone(); }, style: Object.assign({}, S.btnPrimary, { width: '100%' }) }, '학습 메뉴로')
        )
      );
    }

    // 현재 문제
    var items = getStageItems(stage);
    if (!items.length) {
      // 이 단계 비어있음 — 다음 단계로 자동 점프
      var ns = nextStage(stage);
      if (ns) {
        setTimeout(function(){ setStage(ns); setIdx(0); setPhase('answering'); }, 0);
      } else {
        setTimeout(function(){ setStage('done'); }, 0);
      }
      return null;
    }
    var current = items[idx];
    var userAns = (answers[stage] || {})[idx];
    var correctNow = isCorrect(stage, current, userAns);
    var stageItemsTotal = items.length;
    var stageProgress = ((idx + 1) / stageItemsTotal) * 100;
    var stageIdxInOrder = STAGE_ORDER.indexOf(stage);
    var overallProgress = Math.round(((stageIdxInOrder + (idx + 1) / stageItemsTotal) / STAGE_ORDER.length) * 100);

    function renderChoices(choices) {
      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' } },
        choices.map(function(c, i){
          var selected = userAns === c;
          var isCorrectChoice = (stage === 'grammar')
            ? c === (current.options || [])[(current.correct || 1) - 1]
            : c === current.correct;
          var bg = '#fff', border = THEME.border, color = THEME.dark;
          if (phase === 'showing') {
            if (isCorrectChoice) { bg = THEME.successBg; border = THEME.success; color = THEME.success; }
            else if (selected) { bg = THEME.failBg; border = THEME.fail; color = THEME.fail; }
          } else if (selected) {
            bg = THEME.primaryBg; border = THEME.primary; color = THEME.primary;
          }
          return React.createElement('button', { key: i, onClick: function(){ recordAnswer(c); }, disabled: phase === 'showing',
            style: { background: bg, border: '1.5px solid ' + border, borderRadius: '10px', padding: '12px 14px', textAlign: 'left', cursor: phase === 'showing' ? 'default' : 'pointer', color: color, fontSize: '14px', fontWeight: '600', fontFamily: THEME.font, whiteSpace: 'pre-wrap' } },
            (i + 1) + '. ' + c
          );
        })
      );
    }

    function shufChoices(item, stageKey) {
      var pool = stageKey === 'grammar' ? (item.options || []).slice() : [item.correct].concat(item.wrong || []);
      return seededShuffle(pool, stageIdxSeed(stageKey, idx));
    }

    function renderQuestion() {
      if (stage === '1') {
        return React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: THEME.textLight, marginBottom: '4px', fontFamily: THEME.font } }, '단어 보고 뜻 고르기'),
          React.createElement('div', { style: { fontSize: '32px', fontWeight: '800', color: THEME.dark, marginBottom: '6px', fontFamily: THEME.font, textAlign: 'center' } }, current.word),
          React.createElement('div', { style: { textAlign: 'center', marginBottom: '8px' } },
            React.createElement('button', { onClick: function(){ speak(current.word); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font } }, '발음 듣기')
          ),
          renderChoices(shufChoices(current, '1'))
        );
      }
      if (stage === '2') {
        return React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: THEME.textLight, marginBottom: '6px', fontFamily: THEME.font } }, '예문 해석 고르기'),
          React.createElement('div', { style: { fontSize: '15px', color: THEME.dark, lineHeight: '1.7', marginBottom: '8px', fontFamily: THEME.font, padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' } }, current.sentence),
          renderChoices(shufChoices(current, '2'))
        );
      }
      if (stage === '3') {
        return React.createElement(Stage3Question, {
          item: current,
          phase: phase,
          userAns: userAns,
          onAnswer: function(joined){ recordAnswer(joined); }
        });
      }
      if (stage === 'grammar') {
        return React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: THEME.textLight, marginBottom: '6px', fontFamily: THEME.font } }, '대괄호 [...] 부분의 문법 설명 고르기'),
          React.createElement('div', { style: { fontSize: '15px', color: THEME.dark, lineHeight: '1.7', marginBottom: '8px', fontFamily: THEME.font, padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', whiteSpace: 'pre-wrap' } }, current.sentence),
          renderChoices(shufChoices(current, 'grammar'))
        );
      }
      return null;
    }

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '4단계 학습 세트', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
      // 단계 + 진행률
      React.createElement('div', { style: { background: THEME.cardBg, borderBottom: '1px solid ' + THEME.border, padding: '10px 16px', position: 'sticky', top: 0, zIndex: 10 } },
        React.createElement('div', { style: { maxWidth: '600px', margin: '0 auto' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: '800', color: THEME.primary, fontFamily: THEME.font } }, STAGE_LABEL[stage]),
            React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: THEME.textMid, fontFamily: THEME.font } }, (idx + 1) + ' / ' + stageItemsTotal + ' · 전체 ' + overallProgress + '%')
          ),
          React.createElement('div', { style: { height: '6px', background: THEME.border, borderRadius: '3px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: stageProgress + '%', height: '100%', background: THEME.primary, transition: 'width 0.3s' } })
          )
        )
      ),
      // 본문
      React.createElement('div', { style: { padding: '20px 16px', maxWidth: '600px', margin: '0 auto' } },
        renderQuestion(),
        // 정답/오답 피드백 (영작은 Stage3Question 안에서 표시)
        phase === 'showing' && stage !== '3' && React.createElement('div', { style: { marginTop: '14px', padding: '12px 14px', background: correctNow ? THEME.successBg : THEME.failBg, borderRadius: '8px', borderLeft: '3px solid ' + (correctNow ? THEME.success : THEME.fail) } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: '800', color: correctNow ? THEME.success : THEME.fail } }, correctNow ? '정답!' : '오답'),
          !correctNow && React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '4px' } }, '정답: ' + (stage === 'grammar' ? ((current.correct || 1) + '. ' + (current.options || [])[(current.correct || 1) - 1]) : current.correct))
        ),
        // 이전 / 건너뛰기·다음
        React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '20px' } },
          React.createElement('button', { onClick: goPrev, disabled: idx === 0, style: Object.assign({}, S.btnGhost, { flex: 1, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }) }, '← 이전'),
          phase === 'answering'
            ? React.createElement('button', { onClick: function(){ recordAnswer(null); }, style: Object.assign({}, S.btnGhost, { flex: 1 }) }, '모름 / 건너뛰기 →')
            : React.createElement('button', { onClick: goNext, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, idx < stageItemsTotal - 1 ? '다음 →' : (nextStage(stage) ? '다음 단계 →' : '결과 보기 →'))
        )
      )
    );
  }

  // ── 3단계 영작 빈칸 (텍스트 입력) ─────────────
  function Stage3Question(props) {
    var item = props.item;
    var phase = props.phase;
    var userAns = props.userAns; // '|||' 로 연결된 사용자 입력
    // 영문 문장의 ___ 갯수에 맞춰 입력 박스 N개
    var parts = String(item.sentence || '').split(/___+/);
    var blankCount = Math.max(0, parts.length - 1);
    var [inputs, setInputs] = React.useState(function(){ return new Array(blankCount).fill(''); });
    React.useEffect(function(){ setInputs(new Array(blankCount).fill('')); }, [item]);
    function submit() {
      props.onAnswer(inputs.join('|||'));
    }
    var answers = (item.answers || []);
    return React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', color: THEME.textLight, marginBottom: '6px', fontFamily: THEME.font } }, '한국어 해석을 보고 빈칸 채우기'),
      React.createElement('div', { style: { fontSize: '14px', color: THEME.dark, lineHeight: '1.7', marginBottom: '10px', fontFamily: THEME.font, padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' } }, item.korean),
      // 영문 + 빈칸 입력
      React.createElement('div', { style: { fontSize: '15px', color: THEME.dark, lineHeight: '2.4', fontFamily: THEME.font, padding: '12px 14px', border: '1px solid ' + THEME.border, borderRadius: '8px' } },
        parts.map(function(part, i){
          var hasBlankAfter = i < parts.length - 1;
          return React.createElement(React.Fragment, { key: i },
            React.createElement('span', null, part),
            hasBlankAfter && React.createElement('input', {
              type: 'text', value: inputs[i] || '', disabled: phase === 'showing',
              onChange: function(e){ var v = e.target.value; setInputs(function(arr){ var n = arr.slice(); n[i] = v; return n; }); },
              style: { width: '110px', border: 'none', borderBottom: '2px solid ' + (phase === 'showing' && (String(inputs[i]||'').trim().toLowerCase() !== String((answers[i]||'')).trim().toLowerCase()) ? THEME.fail : THEME.primary), padding: '2px 4px', margin: '0 4px', fontSize: '15px', fontFamily: THEME.font, color: phase === 'showing' && (String(inputs[i]||'').trim().toLowerCase() !== String((answers[i]||'')).trim().toLowerCase()) ? THEME.fail : THEME.dark, outline: 'none', background: 'transparent', textAlign: 'center' }
            })
          );
        })
      ),
      // 정답 표시 (showing 단계)
      phase === 'showing' && React.createElement('div', { style: { marginTop: '12px', padding: '12px 14px', background: THEME.successBg, borderRadius: '8px', borderLeft: '3px solid ' + THEME.success } },
        React.createElement('div', { style: { fontSize: '12px', fontWeight: '800', color: THEME.success, marginBottom: '4px' } }, '정답'),
        React.createElement('div', { style: { fontSize: '13px', color: THEME.dark, fontFamily: THEME.font } }, answers.join(', '))
      ),
      // 제출 버튼
      phase === 'answering' && React.createElement('button', { onClick: submit, style: Object.assign({}, S.btnPrimary, { width: '100%', marginTop: '14px' }) }, '제출')
    );
  }

  // ── STUDY 자유 연습 (객관식 / 스펠링 채우기 / 뜻 보고 쓰기 / 듣고 쓰기) ─────
  // 시간 제한·점수 저장 없이 한 문제씩 풀고 바로 정답 확인. TEST 의 문제 엔진(buildOne / QuestionCard)을 재사용.
  function StudyQuizPlayer(props) {
    var mode = props.mode; // 'multiple_choice' | 'spelling' | 'writing' | 'listening'
    var words = props.words || [];
    var MODE_LABEL = { multiple_choice: '객관식 (뜻 고르기)', spelling: '스펠링 채우기', writing: '뜻 보고 쓰기', listening: '듣고 쓰기' };

    var [stage, setStage] = React.useState('setup'); // 'setup' | 'playing' | 'done'
    var [direction, setDirection] = React.useState('word_to_meaning'); // 객관식 전용
    var [blankRatio, setBlankRatio] = React.useState(0.5); // 스펠링 전용 (빈칸 비율)
    var [qs, setQs] = React.useState([]);
    var [idx, setIdx] = React.useState(0);
    var [phase, setPhase] = React.useState('answering'); // 'answering' | 'showing'
    var [answers, setAnswers] = React.useState({}); // { i: userAnswer }
    var [round, setRound] = React.useState(0); // '다시 풀기' 시 증가 → QuestionCard 리마운트용

    function buildSetFrom(srcWords) {
      var cfg = { choices_per_question: 4, question_direction: (mode === 'multiple_choice' ? direction : 'mixed'), spelling_blank_ratio: blankRatio };
      var pool = (srcWords || []).slice();
      for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      // 객관식 보기는 항상 유닛 전체 단어(words)에서 뽑아 보기가 풍부하게
      return pool.map(function(w){ return buildOne(w, mode, cfg, words); }).filter(Boolean);
    }
    function beginWith(srcWords) {
      setQs(buildSetFrom(srcWords)); setIdx(0); setPhase('answering'); setAnswers({}); setRound(function(r){ return r + 1; }); setStage('playing');
    }
    function begin() { beginWith(words); }

    var current = qs[idx];
    var total = qs.length;

    // 듣기 모드: 문제 진입 시 발음 자동 재생
    React.useEffect(function(){
      if (stage !== 'playing' || !current) return;
      if (mode === 'listening' && phase === 'answering') {
        var t = setTimeout(function(){ speak(current.correct); }, 250);
        return function(){ clearTimeout(t); };
      }
    }, [idx, stage, phase]);

    function handleAnswer(userAns) {
      if (phase !== 'answering') return;
      setAnswers(function(a){ var na = Object.assign({}, a); na[idx] = userAns; return na; });
      setPhase('showing');
    }
    function nextQ() {
      if (idx < total - 1) { setIdx(idx + 1); setPhase('answering'); }
      else { setStage('done'); }
    }

    // ─ 설정 화면 ─
    if (stage === 'setup') {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '자유 연습 — ' + (MODE_LABEL[mode] || ''), subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '500px', margin: '0 auto' } },
          React.createElement('div', { style: Object.assign({}, S.card, { padding: '24px 20px' }) },
            React.createElement('div', { style: { fontSize: '16px', fontWeight: '800', color: THEME.dark, marginBottom: '6px' } }, '단어 ' + words.length + '개 연습'),
            React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, lineHeight: '1.7', marginBottom: '18px' } }, '시간 제한 없이 한 문제씩 풀고 바로 정답을 확인합니다. 점수는 저장되지 않으니 마음껏 반복하세요.'),
            mode === 'multiple_choice' && React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('div', { style: S.label }, '문제 방향'),
              React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
                [['word_to_meaning','단어 → 뜻'],['meaning_to_word','뜻 → 단어'],['mixed','섞어서']].map(function(o){
                  var on = direction === o[0];
                  return React.createElement('button', { key: o[0], onClick: function(){ setDirection(o[0]); }, style: { background: on ? THEME.primary : '#fff', color: on ? '#fff' : THEME.textMid, border: '1.5px solid ' + (on ? THEME.primary : THEME.border), borderRadius: '999px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font } }, o[1]);
                })
              )
            ),
            mode === 'spelling' && React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('div', { style: S.label }, '난이도 — 빈칸 비율'),
              React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } },
                [[0.3,'Easy (30%)'],[0.5,'보통 (50%)'],[1.0,'Hard (전체)']].map(function(o){
                  var on = blankRatio === o[0];
                  return React.createElement('button', { key: String(o[0]), onClick: function(){ setBlankRatio(o[0]); }, style: { background: on ? THEME.primary : '#fff', color: on ? '#fff' : THEME.textMid, border: '1.5px solid ' + (on ? THEME.primary : THEME.border), borderRadius: '999px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font } }, o[1]);
                })
              )
            ),
            React.createElement('button', { onClick: begin, disabled: words.length === 0, style: Object.assign({}, S.btnPrimary, { width: '100%' }, words.length === 0 ? { background: '#9ca3af', cursor: 'not-allowed' } : null) }, words.length === 0 ? '단어가 없습니다' : '연습 시작')
          )
        )
      );
    }

    // ─ 결과 화면 ─
    if (stage === 'done') {
      var correctCount = 0;
      qs.forEach(function(q, i){ if (isAnswerCorrect(q, answers[i])) correctCount++; });
      var pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      var wrongs = qs.map(function(q, i){ return { q: q, i: i, ua: answers[i], ok: isAnswerCorrect(q, answers[i]) }; }).filter(function(x){ return !x.ok; });
      var wrongWords = wrongs.map(function(x){ var wid = x.q.word_id; return words.filter(function(w){ return w.id === wid; })[0]; }).filter(Boolean);
      function retryWrong() { if (wrongWords.length) beginWith(wrongWords); }
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '연습 결과 — ' + (MODE_LABEL[mode] || ''), subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '600px', margin: '0 auto' } },
          React.createElement('div', { style: Object.assign({}, S.card, { padding: '28px 20px', textAlign: 'center', marginBottom: '14px' }) },
            React.createElement('div', { style: { fontSize: '48px', fontWeight: '800', color: pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail } }, pct + '점'),
            React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginTop: '6px' } }, correctCount + ' / ' + total + ' 정답 · 연습 (점수 저장 안 됨)')
          ),
          wrongs.length > 0 && React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, marginBottom: '8px', fontFamily: THEME.font } }, '틀린 단어 ' + wrongs.length + '개'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' } },
              wrongs.map(function(x){
                return React.createElement('div', { key: x.i, style: { padding: '10px 14px', background: THEME.failBg, borderRadius: '8px', borderLeft: '3px solid ' + THEME.fail } },
                  React.createElement('div', { style: { fontSize: '14px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font } }, x.q.word + ' — ' + x.q.meaning),
                  React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, '내 답: ' + (x.ua == null || x.ua === '' ? '(미응답)' : x.ua) + ' · 정답: ' + x.q.correct)
                );
              })
            )
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            wrongWords.length > 0 && React.createElement('button', { onClick: retryWrong, style: Object.assign({}, S.btnPrimary, { width: '100%' }) }, '틀린 ' + wrongWords.length + '개만 다시 풀기'),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('button', { onClick: begin, style: Object.assign({}, (wrongWords.length > 0 ? S.btnGhost : S.btnPrimary), { flex: 1, padding: '14px 16px' }) }, '전체 다시 풀기'),
              React.createElement('button', { onClick: props.onDone, style: Object.assign({}, S.btnGhost, { flex: 1, padding: '14px 16px' }) }, '모드 선택으로')
            )
          )
        )
      );
    }

    // ─ 풀이 화면 ─
    if (!current) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '연습', onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '연습할 단어가 부족합니다.')
      );
    }
    var qNum = idx + 1;
    var progressPct = total > 0 ? (qNum / total) * 100 : 0;
    var ua = answers[idx];
    var isCorrect = phase === 'showing' ? isAnswerCorrect(current, ua) : null;
    return React.createElement('div', { style: S.page },
      React.createElement('div', { style: { background: THEME.cardBg, borderBottom: '1px solid ' + THEME.border, padding: '10px 16px', position: 'sticky', top: 0, zIndex: 10 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '600px', margin: '0 auto' } },
          React.createElement('button', { onClick: props.onBack, style: { background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer', fontSize: '13px', fontWeight: '800', fontFamily: THEME.font, padding: 0 } }, '나가기'),
          React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font, minWidth: '46px' } }, qNum + '/' + total),
          React.createElement('div', { style: { flex: 1, height: '8px', background: THEME.border, borderRadius: '4px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: progressPct + '%', height: '100%', background: THEME.primary, transition: 'width 0.3s' } })
          )
        )
      ),
      React.createElement('div', { style: { padding: '24px 16px', maxWidth: '600px', margin: '0 auto' } },
        React.createElement(QuestionCard, { key: 'sq-' + round + '-' + idx, question: current, phase: phase, userAnswer: ua, isCorrect: isCorrect, onAnswer: handleAnswer }),
        phase === 'showing' && React.createElement('div', { style: { marginTop: '16px' } },
          React.createElement('div', { style: { textAlign: 'center', fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: isCorrect ? THEME.success : THEME.fail } }, isCorrect ? '정답!' : '아쉬워요'),
          React.createElement('button', { onClick: nextQ, style: Object.assign({}, S.btnPrimary, { width: '100%' }) }, idx < total - 1 ? '다음 문제 →' : '결과 보기')
        )
      )
    );
  }

  // ── TEST: 부여된 단어장 그룹 → 받은 시험 카드 → AssignmentRunner ────────
  function TestMenu(props) {
    var assignments = (props.assignments || []).filter(function(a){ return a.mode === 'test'; });
    var [selectedListId, setSelectedListId] = React.useState(null);
    var now = Date.now();
    var dayMs = 86400000;

    // list_id로 그룹핑 + 마감 임박 카운트
    var groups = {};
    assignments.forEach(function(a){
      var lid = a.list_id;
      if (!groups[lid]) groups[lid] = { listId: lid, listName: (a.vocab_lists && a.vocab_lists.name) || '단어장', items: [], urgent: 0 };
      groups[lid].items.push(a);
      if (a.due_at) {
        var d = new Date(a.due_at).getTime();
        if (d >= now && d <= now + 7 * dayMs) groups[lid].urgent++;
      }
    });
    var groupArr = Object.keys(groups).map(function(k){ return groups[k]; });
    // 그룹 정렬: 마감 임박 많은 단어장 우선
    groupArr.sort(function(a, b){ return b.urgent - a.urgent; });
    // 그룹 안 항목 정렬: 마감 임박 우선(없으면 unit_index)
    groupArr.forEach(function(g){
      g.items.sort(function(a, b){
        var da = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        var db = b.due_at ? new Date(b.due_at).getTime() : Infinity;
        if (da !== db) return da - db;
        return (a.unit_index || 0) - (b.unit_index || 0);
      });
    });

    function backStage() {
      if (selectedListId) setSelectedListId(null);
      else props.onBack();
    }

    var selectedGroup = selectedListId ? groups[selectedListId] : null;
    var pageTitle = selectedGroup ? selectedGroup.listName : '받은 시험이 있는 단어장';

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '시험 (TEST)', subtitle: pageTitle, onBack: backStage }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        !selectedGroup
          ? (groupArr.length === 0
              ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) }, '받은 시험이 아직 없어요.')
              : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                  groupArr.map(function(g){
                    return React.createElement('button', { key: g.listId, onClick: function(){ setSelectedListId(g.listId); },
                      style: { background: '#fff', border: '1.5px solid ' + (g.urgent > 0 ? '#fbbf24' : THEME.border), borderRadius: '12px', padding: '16px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
                      React.createElement('div', null,
                        React.createElement('div', { style: { fontSize: '15px', fontWeight: '800', color: THEME.dark } }, g.listName),
                        React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '4px' } },
                          '받은 시험 ' + g.items.length + '개' + (g.urgent > 0 ? ' · 마감 임박 ' + g.urgent + '개' : '')
                        )
                      ),
                      React.createElement('span', { style: { fontSize: '20px', color: THEME.primary, fontWeight: '800' } }, '›')
                    );
                  })
                ))
          : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
              selectedGroup.items.map(function(a){
                var stages = (a.stages || []).map(function(s){ return ({ '1':'1단계','2':'2단계','3':'3단계','grammar':'어법' })[s] || (s==='25' ? null : s); }).filter(Boolean).join(' · ');
                var due = a.due_at ? new Date(a.due_at) : null;
                var dueMs = due ? due.getTime() : null;
                var isUrgent = dueMs !== null && dueMs >= now && dueMs <= now + 7 * dayMs;
                var isPast = dueMs !== null && dueMs < now;
                var dueStr = due ? (due.getFullYear() + '.' + (due.getMonth()+1) + '.' + due.getDate() + ' ' + String(due.getHours()).padStart(2,'0') + ':' + String(due.getMinutes()).padStart(2,'0')) : '';
                return React.createElement('button', { key: a.id, onClick: function(){ if (!isPast) props.onPickAssignment(a); },
                  disabled: isPast,
                  style: { background: '#fff', border: '2px solid ' + (isUrgent ? '#fbbf24' : isPast ? '#e5e7eb' : '#fcd5ce'), borderRadius: '12px', padding: '14px 16px', cursor: isPast ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: THEME.font, display: 'flex', alignItems: 'center', gap: '12px', opacity: isPast ? 0.5 : 1 } },
                  React.createElement('span', { style: { background: isUrgent ? '#fef3c7' : isPast ? '#f3f4f6' : '#fee2e2', color: isUrgent ? '#92400e' : isPast ? '#9ca3af' : THEME.primary, fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '999px', whiteSpace: 'nowrap' } }, isPast ? '마감' : isUrgent ? '임박' : '시험'),
                  React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                    React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark } }, a.title || ('UNIT ' + a.unit_index + ' 시험')),
                    stages && React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, stages),
                    dueStr && React.createElement('div', { style: { fontSize: '11px', color: isUrgent ? '#92400e' : THEME.textMid, marginTop: '2px', fontWeight: isUrgent ? '700' : '400' } }, '마감: ' + dueStr)
                  ),
                  !isPast && React.createElement('span', { style: { fontSize: '20px', color: THEME.primary, fontWeight: '800' } }, '›')
                );
              })
            )
      )
    );
  }

  // ── 출제 로직: 단어 → 문제 셋 ────────────────────────
  // 시험의 모드별 카운트와 출제 방향에 따라 questions 배열 생성
  // 각 question: { word_id, mode, prompt, correct, choices?, blank_indices?, direction }
  function buildQuestions(words, test) {
    var pool = words.slice();
    // 무작위 섞기
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var qs = [];
    var modes = [
      { id: 'multiple_choice', count: test.multiple_choice_count || 0 },
      { id: 'spelling', count: test.spelling_count || 0 },
      { id: 'writing', count: test.writing_count || 0 },
      { id: 'listening', count: test.listening_count || 0 },
    ];
    var poolIdx = 0;
    modes.forEach(function(m){
      for (var k = 0; k < m.count; k++) {
        if (poolIdx >= pool.length) break;
        var w = pool[poolIdx++];
        qs.push(buildOne(w, m.id, test, words));
      }
    });
    // 모드 섞기 (객관식만 몰리지 않게)
    for (var i2 = qs.length - 1; i2 > 0; i2--) {
      var j2 = Math.floor(Math.random() * (i2 + 1));
      var t2 = qs[i2]; qs[i2] = qs[j2]; qs[j2] = t2;
    }
    return qs;
  }

  function buildOne(word, mode, test, allWords) {
    var dir = pickDirection(test.question_direction || 'mixed');
    if (mode === 'multiple_choice') {
      // 보기: 정답 + 다른 단어 N-1개
      var n = test.choices_per_question || 4;
      var pool = allWords.filter(function(w){ return w.id !== word.id; });
      // 무작위 N-1개
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      var distractors = pool.slice(0, n - 1);
      var allChoices = [word].concat(distractors);
      // 보기 섞기
      for (var i2 = allChoices.length - 1; i2 > 0; i2--) {
        var j2 = Math.floor(Math.random() * (i2 + 1));
        var t2 = allChoices[i2]; allChoices[i2] = allChoices[j2]; allChoices[j2] = t2;
      }
      var prompt = dir === 'word_to_meaning' ? word.word : word.meaning;
      var correct = dir === 'word_to_meaning' ? word.meaning : word.word;
      var choices = allChoices.map(function(c){ return dir === 'word_to_meaning' ? c.meaning : c.word; });
      return { word_id: word.id, word: word.word, meaning: word.meaning, mode: 'multiple_choice', direction: dir, prompt: prompt, correct: correct, choices: choices };
    }
    if (mode === 'spelling') {
      // 빈칸 인덱스 (예: a_p_e → 인덱스 1, 3 빈칸)
      var ratio = test.spelling_blank_ratio != null ? test.spelling_blank_ratio : 0.5;
      var indices = [];
      var len = word.word.length;
      var blankCount = Math.max(1, Math.floor(len * ratio));
      var positions = [];
      for (var p = 0; p < len; p++) if (/[a-zA-Z]/.test(word.word[p])) positions.push(p);
      // 무작위
      for (var i3 = positions.length - 1; i3 > 0; i3--) {
        var j3 = Math.floor(Math.random() * (i3 + 1));
        var t3 = positions[i3]; positions[i3] = positions[j3]; positions[j3] = t3;
      }
      indices = positions.slice(0, Math.min(blankCount, positions.length)).sort(function(a,b){ return a-b; });
      return { word_id: word.id, word: word.word, meaning: word.meaning, mode: 'spelling', direction: dir, prompt: word.meaning, correct: word.word, blank_indices: indices };
    }
    if (mode === 'writing') {
      // 뜻 보고 단어 쓰기
      return { word_id: word.id, word: word.word, meaning: word.meaning, mode: 'writing', direction: 'meaning_to_word', prompt: word.meaning, correct: word.word };
    }
    if (mode === 'listening') {
      // 발음 듣고 단어 쓰기
      return { word_id: word.id, word: word.word, meaning: word.meaning, mode: 'listening', direction: 'audio_to_word', prompt: word.word, correct: word.word };
    }
  }

  function pickDirection(setting) {
    if (setting === 'word_to_meaning') return 'word_to_meaning';
    if (setting === 'meaning_to_word') return 'meaning_to_word';
    return Math.random() < 0.5 ? 'word_to_meaning' : 'meaning_to_word';
  }

  function normalizeAnswer(s) {
    return String(s || '').trim().toLowerCase();
  }
  function isAnswerCorrect(question, userAnswer) {
    if (question.mode === 'multiple_choice') return userAnswer === question.correct;
    if (question.mode === 'spelling') return normalizeAnswer(userAnswer) === normalizeAnswer(question.correct);
    if (question.mode === 'writing' || question.mode === 'listening') return normalizeAnswer(userAnswer) === normalizeAnswer(question.correct);
    return false;
  }

  // ── QuizRunner: 시험 응시 화면 (자동 진행) ─────────────
  function QuizRunner(props) {
    var sb = window.supabase;
    var test = props.test;
    var user = props.user || {};
    var [questions, setQuestions] = React.useState([]);
    var [loading, setLoading] = React.useState(true);
    var [started, setStarted] = React.useState(false); // iOS TTS 활성화 + 시험 시작 시각 기록
    var [startedAt, setStartedAt] = React.useState(null);
    var [idx, setIdx] = React.useState(0);
    var [answers, setAnswers] = React.useState({}); // { qIdx: userAnswer }
    var [phase, setPhase] = React.useState('answering'); // 'answering' | 'showing' | 'done'
    var [timeLeft, setTimeLeft] = React.useState(0);
    var [submitted, setSubmitted] = React.useState(false);
    var [finalScore, setFinalScore] = React.useState(null); // { score, total, attempt_number }
    var [maxIdx, setMaxIdx] = React.useState(0); // 가장 멀리 간 idx — 이보다 작은 idx로 가면 review (자동 진행 안 함)

    // 단어 로드 + 문제 출제
    React.useEffect(function(){
      (async function(){
        try {
          var lRes = await sb.from('vocab_lists').select('unit_size').eq('id', test.list_id).maybeSingle();
          var us = (lRes && lRes.data && lRes.data.unit_size) || 20;
          var wRes = await sb.from('vocab_words').select('*').eq('list_id', test.list_id).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
          var allWords = (wRes && wRes.data) || [];
          var startIdx = (test.unit_index - 1) * us;
          var unitWords = allWords.slice(startIdx, startIdx + us);
          var qs = buildQuestions(unitWords, test);
          setQuestions(qs);
        } catch (e) { console.error('문제 출제 실패:', e); }
        setLoading(false);
      })();
    }, []);

    var current = questions[idx];
    var total = questions.length;

    // 타이머
    React.useEffect(function(){
      if (!started || phase !== 'answering' || !current) return;
      setTimeLeft(test.seconds_per_question || 30);
      var endAt = Date.now() + (test.seconds_per_question || 30) * 1000;
      var timer = setInterval(function(){
        var left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setTimeLeft(left);
        if (left <= 0) {
          clearInterval(timer);
          // 시간 만료 → 정답 표시 단계로
          handleAnswer(null, true);
        }
      }, 200);
      return function(){ clearInterval(timer); };
    }, [idx, started, phase]);

    // 자동 발음 — 답 누설이 없는 곳에서는 자동 재생, 쓰기 모드는 정답 공개 후에만
    React.useEffect(function(){
      if (!started || !current) return;
      var shouldSpeak = false;
      if (phase === 'answering') {
        shouldSpeak = (
          current.mode === 'listening' ||
          current.mode === 'spelling' ||
          (current.mode === 'multiple_choice' && current.direction === 'word_to_meaning')
        );
      } else if (phase === 'showing') {
        shouldSpeak = (current.mode === 'writing');
      }
      if (!shouldSpeak) return;
      var t = setTimeout(function(){ speak(current.word); }, 200);
      return function(){ clearTimeout(t); };
    }, [idx, started, phase]);

    // 정답 표시 후 자동 진행 — show_answer_seconds 후. review(이전 문제 보는 중)면 자동 진행 안 함.
    React.useEffect(function(){
      if (!started || phase !== 'showing') return;
      if (idx < maxIdx) return; // 이전 문제 다시 보는 중 — 자동 진행 금지
      var ms = (test.show_answer_seconds || 2) * 1000;
      var timer = setTimeout(function(){ goNext(answers); }, ms);
      return function(){ clearTimeout(timer); };
    }, [phase, idx, maxIdx, started]);

    function goNext(answersObj) {
      var ao = answersObj || answers;
      if (idx < total - 1) {
        var ni = idx + 1;
        setIdx(ni);
        if (ni > maxIdx) setMaxIdx(ni);
        setPhase(ao[ni] !== undefined ? 'showing' : 'answering');
      } else {
        setPhase('done');
        submitFinal(ao);
      }
    }
    function goPrev() {
      if (idx <= 0) return;
      setIdx(idx - 1);
      setPhase('showing'); // 이전 문제는 이미 답했거나 건너뛴 상태 — 정답이 보이는 review 모드
    }

    function handleAnswer(userAns, fromTimeout) {
      if (phase !== 'answering') return;
      var nextAnswers = Object.assign({}, answers);
      nextAnswers[idx] = userAns;
      setAnswers(nextAnswers);
      setPhase('showing');
      // useEffect 가 show_answer_seconds 후 자동 진행 처리
    }
    function handleSkip() {
      // 모름·답 없이 즉시 다음
      if (phase !== 'answering') return;
      var nextAnswers = Object.assign({}, answers);
      nextAnswers[idx] = null;
      setAnswers(nextAnswers);
      goNext(nextAnswers);
    }
    function handleNextNow() {
      // 정답 표시 중에 즉시 다음 (2초 안 기다림)
      goNext(answers);
    }

    async function submitFinal(answersOverride) {
      if (submitted) return;
      setSubmitted(true);
      try {
        var finalAnswers = answersOverride || answers;
        // 채점
        var score = 0;
        questions.forEach(function(q, i){
          if (isAnswerCorrect(q, finalAnswers[i])) score++;
        });
        var attemptNumber = (props.existingAttempts || []).length + 1;
        var timeTaken = Math.floor((Date.now() - (startedAt || Date.now())) / 1000);
        var payload = {
          test_id: test.id,
          student_id: user.id,
          student_name: user.name || null,
          unit_index: test.unit_index,
          questions: questions.map(function(q){ return { word_id: q.word_id, word: q.word, meaning: q.meaning, mode: q.mode, direction: q.direction, prompt: q.prompt, correct: q.correct, choices: q.choices || null, blank_indices: q.blank_indices || null }; }),
          answers: finalAnswers,
          score: score,
          total: total,
          percentage: total > 0 ? Math.round((score / total) * 100 * 10) / 10 : 0,
          started_at: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTaken,
          attempt_number: attemptNumber,
        };
        await sb.from('vocab_test_attempts').insert(payload);
        setFinalScore({ score: score, total: total, attempt_number: attemptNumber });
      } catch (e) { console.error('응시 결과 저장 실패:', e); alert('결과 저장에 실패했습니다: ' + (e.message || e)); }
    }

    if (loading) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '시험 준비 중', onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '문제를 불러오는 중...')
      );
    }
    if (!questions.length) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: '시험', onBack: props.onBack }),
        React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textMid } }, '출제할 단어가 부족합니다.')
      );
    }
    // 시작 전 안내
    if (!started) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: test.title, onBack: props.onBack }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '500px', margin: '0 auto' } },
          React.createElement('div', { style: Object.assign({}, S.card, { padding: '28px 20px', textAlign: 'center' }) },
            React.createElement('div', { style: { fontSize: '17px', fontWeight: '800', color: THEME.dark, marginBottom: '14px' } }, '응시 안내'),
            React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, lineHeight: '1.8', marginBottom: '20px', textAlign: 'left' } },
              React.createElement('div', null, '• 총 ' + total + '문제 (단어당 ' + (test.seconds_per_question || 30) + '초)'),
              React.createElement('div', null, '• 답을 선택하면 정답이 ' + (test.show_answer_seconds || 2) + '초간 표시됩니다'),
              React.createElement('div', null, '• "모름/건너뛰기" 또는 "다음 →" 버튼으로 직접 넘길 수 있어요'),
              React.createElement('div', null, '• "← 이전" 으로 풀었던 문제 다시 볼 수도 있어요'),
              React.createElement('div', null, '• 영어 단어가 보이는 문제는 발음이 자동 재생됩니다 ("다시 듣기"로 재생 가능)')
            ),
            React.createElement('button', { onClick: function(){ setStarted(true); setStartedAt(Date.now()); }, style: S.btnPrimary }, '시작')
          )
        )
      );
    }
    // 결과 화면
    if (phase === 'done') {
      var pct = finalScore ? Math.round((finalScore.score / finalScore.total) * 100) : null;
      var cut = parseInt(test.pass_score, 10) || 0; // 커트라인(0=없음)
      var passed = (cut > 0 && finalScore) ? (pct >= cut) : null;
      var canRetake = test.attempts_allowed === -1 || (finalScore && finalScore.attempt_number < test.attempts_allowed);
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: test.title + ' — 결과', onBack: function(){ props.onDone(finalScore); } }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '600px', margin: '0 auto' } },
          finalScore == null
            ? React.createElement('div', { style: { padding: '40px', textAlign: 'center' } }, '결과 저장 중...')
            : React.createElement('div', null,
                React.createElement('div', { style: Object.assign({}, S.card, { padding: '32px 20px', textAlign: 'center', marginBottom: '14px' }, passed === true ? { border: '2px solid ' + THEME.success } : passed === false ? { border: '2px solid ' + THEME.fail } : null) },
                  React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginBottom: '8px' } }, '응시 ' + finalScore.attempt_number + '회차'),
                  React.createElement('div', { style: { fontSize: '52px', fontWeight: '800', color: pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail } }, pct + '점'),
                  React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginTop: '6px' } }, finalScore.score + ' / ' + finalScore.total + ' 정답'),
                  cut > 0 && React.createElement('div', { style: { marginTop: '14px' } },
                    React.createElement('span', { style: { display: 'inline-block', fontSize: '15px', fontWeight: '800', borderRadius: '999px', padding: '6px 18px', background: passed ? THEME.successBg : THEME.failBg, color: passed ? THEME.success : THEME.fail } }, passed ? '합격' : '불합격'),
                    React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '8px' } }, '커트라인 ' + cut + '점' + (passed ? '' : (canRetake ? ' — 다시 응시해서 통과해 보세요' : ' — 재응시 횟수가 끝났어요. 선생님께 문의하세요')))
                  )
                ),
                React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, marginBottom: '8px', fontFamily: THEME.font } }, '문제별 정답'),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                  questions.map(function(q, i){
                    var ua = answers[i];
                    var ok = isAnswerCorrect(q, ua);
                    return React.createElement('div', { key: i, style: { padding: '10px 14px', background: ok ? THEME.successBg : THEME.failBg, borderRadius: '8px', borderLeft: '3px solid ' + (ok ? THEME.success : THEME.fail), display: 'flex', alignItems: 'center', gap: '10px' } },
                      React.createElement('span', { style: { fontSize: '13px', fontWeight: '700', color: ok ? THEME.success : THEME.fail, minWidth: '20px' } }, ok ? '✓' : '✗'),
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { fontSize: '14px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font } }, q.word + ' — ' + q.meaning),
                        !ok && React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, '내 답: ' + (ua == null ? '(미응답)' : ua) + ' · 정답: ' + q.correct)
                      )
                    );
                  })
                ),
                React.createElement('button', { onClick: function(){ props.onDone(finalScore); }, style: Object.assign({}, S.btnPrimary, { width: '100%', marginTop: '20px' }) }, '시험 목록으로')
              )
        )
      );
    }

    // 응시 중
    var qNum = idx + 1;
    var progressPct = total > 0 ? (qNum / total) * 100 : 0;
    var userAnswer = answers[idx];
    var isCorrect = phase === 'showing' && current ? isAnswerCorrect(current, userAnswer) : null;

    return React.createElement('div', { style: S.page },
      // 상단 진행률 + 타이머
      React.createElement('div', { style: { background: THEME.cardBg, borderBottom: '1px solid ' + THEME.border, padding: '10px 16px', position: 'sticky', top: 0, zIndex: 10 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '600px', margin: '0 auto' } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font, minWidth: '50px' } }, qNum + '/' + total),
          React.createElement('div', { style: { flex: 1, height: '8px', background: THEME.border, borderRadius: '4px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: progressPct + '%', height: '100%', background: THEME.primary, transition: 'width 0.3s' } })
          ),
          React.createElement('div', { style: { fontSize: '13px', fontWeight: '800', color: timeLeft <= 5 ? THEME.fail : THEME.dark, fontFamily: THEME.font, minWidth: '34px', textAlign: 'right' } }, phase === 'answering' ? timeLeft + '초' : '')
        )
      ),

      // 문제 본체
      React.createElement('div', { style: { padding: '24px 16px', maxWidth: '600px', margin: '0 auto' } },
        React.createElement(QuestionCard, { question: current, phase: phase, userAnswer: userAnswer, isCorrect: isCorrect, onAnswer: handleAnswer }),
        // 영어 단어 자동 발음 후에도 다시 듣고 싶을 때 — 답 보일 때만 (답안 직전 발음 누설 방지)
        current && ((current.mode === 'listening') || (current.mode === 'multiple_choice' && current.direction === 'word_to_meaning')) && React.createElement('button', { onClick: function(){ speak(current.word); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font, marginTop: '14px' } }, '다시 듣기'),
        // 이전 · 건너뛰기/다음 버튼
        React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '20px' } },
          React.createElement('button', { onClick: goPrev, disabled: idx === 0, style: Object.assign({}, S.btnGhost, { flex: 1, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }) }, '← 이전'),
          phase === 'answering'
            ? React.createElement('button', { onClick: handleSkip, style: Object.assign({}, S.btnGhost, { flex: 1 }) }, '모름 / 건너뛰기 →')
            : React.createElement('button', { onClick: handleNextNow, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, idx < total - 1 ? '다음 →' : '결과 보기 →')
        )
      )
    );
  }

  // ── QuestionCard: 모드별 UI ─────────────────────────
  function QuestionCard(props) {
    var q = props.question;
    var phase = props.phase;
    if (!q) return null;

    if (q.mode === 'multiple_choice') return React.createElement(MCQuestion, props);
    if (q.mode === 'spelling') return React.createElement(SpellingQuestion, props);
    if (q.mode === 'writing') return React.createElement(WritingQuestion, props);
    if (q.mode === 'listening') return React.createElement(ListeningQuestion, props);
    return null;
  }

  // 객관식
  function MCQuestion(props) {
    var q = props.question;
    var phase = props.phase;
    var ua = props.userAnswer;
    var label = q.direction === 'word_to_meaning' ? '뜻을 고르세요' : '단어를 고르세요';
    return React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '8px', fontFamily: THEME.font, letterSpacing: '0.04em' } }, label),
      React.createElement('div', { style: Object.assign({}, S.card, { padding: '28px 18px', textAlign: 'center', marginBottom: '14px' }) },
        React.createElement('div', { style: { fontSize: q.direction === 'word_to_meaning' ? '32px' : '24px', fontWeight: '800', color: THEME.dark, wordBreak: 'break-word' } }, q.prompt),
        q.direction === 'word_to_meaning' && React.createElement('button', { onClick: function(){ speak(q.prompt); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '12px', fontFamily: THEME.font } }, '듣기')
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        q.choices.map(function(c, i){
          var isPicked = phase === 'showing' && ua === c;
          var isCorrect = c === q.correct;
          var bg = '#fff', bd = THEME.border, color = THEME.dark;
          if (phase === 'showing') {
            if (isCorrect) { bg = THEME.successBg; bd = THEME.success; color = THEME.success; }
            else if (isPicked) { bg = THEME.failBg; bd = THEME.fail; color = THEME.fail; }
          }
          return React.createElement('button', { key: i, disabled: phase !== 'answering', onClick: function(){ props.onAnswer(c); },
            style: { background: bg, border: '1.5px solid ' + bd, color: color, borderRadius: '10px', padding: '14px 16px', fontSize: '15px', fontWeight: '700', cursor: phase === 'answering' ? 'pointer' : 'default', fontFamily: THEME.font, textAlign: 'left', transition: 'all 0.15s', minHeight: '52px' }
          },
            React.createElement('span', { style: { color: THEME.textLight, marginRight: '10px', fontSize: '13px' } }, ['①','②','③','④','⑤','⑥'][i]),
            c
          );
        })
      )
    );
  }

  // 스펠링 (일부 빈칸)
  function SpellingQuestion(props) {
    var q = props.question;
    var phase = props.phase;
    var ua = props.userAnswer || '';
    var [val, setVal] = React.useState('');
    React.useEffect(function(){ setVal(''); }, [q]);
    // 빈칸 디스플레이: 정답에서 blank_indices 위치만 빈칸 (다른 위치는 정답 그대로 보여줌)
    var displayed = q.correct.split('').map(function(ch, i){ return q.blank_indices.indexOf(i) >= 0 ? '_' : ch; }).join('');
    function submit() {
      if (phase !== 'answering' || !val.trim()) return;
      props.onAnswer(val.trim());
    }
    return React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '8px', fontFamily: THEME.font } }, '빈칸을 채워 단어를 완성하세요'),
      React.createElement('div', { style: Object.assign({}, S.card, { padding: '24px 18px', textAlign: 'center', marginBottom: '14px' }) },
        React.createElement('div', { style: { fontSize: '20px', color: THEME.text, marginBottom: '8px' } }, q.meaning),
        React.createElement('div', { style: { fontSize: '34px', fontWeight: '800', color: THEME.dark, fontFamily: 'Menlo, Consolas, monospace', letterSpacing: '0.1em' } }, displayed),
        React.createElement('button', { onClick: function(){ speak(q.correct); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', fontFamily: THEME.font } }, '듣기')
      ),
      React.createElement('input', { type: 'text', value: phase === 'showing' ? (ua || '') : val, onChange: function(e){ setVal(e.target.value); }, onKeyDown: function(e){ if (e.key === 'Enter') submit(); }, autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, autoFocus: true, placeholder: '전체 단어를 입력하세요',
        style: { width: '100%', border: '2px solid ' + (phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.border), borderRadius: '10px', padding: '14px 16px', fontSize: '17px', fontWeight: '700', textAlign: 'center', fontFamily: 'Menlo, Consolas, monospace', boxSizing: 'border-box', marginBottom: '10px', background: phase === 'showing' ? (props.isCorrect ? THEME.successBg : THEME.failBg) : '#fff', color: phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.dark }, disabled: phase !== 'answering'
      }),
      phase === 'showing' && !props.isCorrect && React.createElement('div', { style: { fontSize: '13px', textAlign: 'center', color: THEME.textMid, marginBottom: '10px' } },
        '정답: ', React.createElement('strong', { style: { color: THEME.success } }, q.correct)
      ),
      phase === 'answering' && React.createElement('button', { onClick: submit, disabled: !val.trim(), style: Object.assign({}, S.btnPrimary, { width: '100%' }, !val.trim() ? { background: '#9ca3af', cursor: 'not-allowed' } : null) }, '제출')
    );
  }

  // 쓰기 (뜻 보고 단어 전체 입력)
  function WritingQuestion(props) {
    var q = props.question;
    var phase = props.phase;
    var ua = props.userAnswer || '';
    var [val, setVal] = React.useState('');
    React.useEffect(function(){ setVal(''); }, [q]);
    function submit() { if (phase !== 'answering' || !val.trim()) return; props.onAnswer(val.trim()); }
    return React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '8px', fontFamily: THEME.font } }, '뜻을 보고 단어를 입력하세요'),
      React.createElement('div', { style: Object.assign({}, S.card, { padding: '32px 18px', textAlign: 'center', marginBottom: '14px' }) },
        React.createElement('div', { style: { fontSize: '26px', fontWeight: '800', color: THEME.dark, wordBreak: 'break-word' } }, q.meaning),
        q.word_id && React.createElement('div', { style: { fontSize: '13px', color: THEME.textLight, marginTop: '8px' } }, '(영어 단어로 입력)')
      ),
      React.createElement('input', { type: 'text', value: phase === 'showing' ? (ua || '') : val, onChange: function(e){ setVal(e.target.value); }, onKeyDown: function(e){ if (e.key === 'Enter') submit(); }, autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, autoFocus: true, placeholder: 'apple',
        style: { width: '100%', border: '2px solid ' + (phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.border), borderRadius: '10px', padding: '14px 16px', fontSize: '20px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box', marginBottom: '10px', background: phase === 'showing' ? (props.isCorrect ? THEME.successBg : THEME.failBg) : '#fff', color: phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.dark }, disabled: phase !== 'answering'
      }),
      phase === 'showing' && !props.isCorrect && React.createElement('div', { style: { fontSize: '13px', textAlign: 'center', color: THEME.textMid, marginBottom: '10px' } },
        '정답: ', React.createElement('strong', { style: { color: THEME.success } }, q.correct)
      ),
      phase === 'answering' && React.createElement('button', { onClick: submit, disabled: !val.trim(), style: Object.assign({}, S.btnPrimary, { width: '100%' }, !val.trim() ? { background: '#9ca3af', cursor: 'not-allowed' } : null) }, '제출')
    );
  }

  // 듣기 (발음 자동 재생 + 단어 입력)
  function ListeningQuestion(props) {
    var q = props.question;
    var phase = props.phase;
    var ua = props.userAnswer || '';
    var [val, setVal] = React.useState('');
    React.useEffect(function(){ setVal(''); }, [q]);
    function submit() { if (phase !== 'answering' || !val.trim()) return; props.onAnswer(val.trim()); }
    return React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: THEME.textLight, marginBottom: '8px', fontFamily: THEME.font } }, '발음을 듣고 단어를 입력하세요'),
      React.createElement('div', { style: Object.assign({}, S.card, { padding: '40px 18px', textAlign: 'center', marginBottom: '14px' }) },
        React.createElement('button', { onClick: function(){ speak(q.correct); }, style: { background: THEME.primary, color: '#fff', border: 'none', borderRadius: '50%', width: '80px', height: '80px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' } }, '듣기'),
        React.createElement('div', { style: { fontSize: '13px', color: THEME.textLight, marginTop: '10px' } }, '버튼을 눌러 다시 들을 수 있어요')
      ),
      React.createElement('input', { type: 'text', value: phase === 'showing' ? (ua || '') : val, onChange: function(e){ setVal(e.target.value); }, onKeyDown: function(e){ if (e.key === 'Enter') submit(); }, autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, autoFocus: true, placeholder: '들은 단어를 입력',
        style: { width: '100%', border: '2px solid ' + (phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.border), borderRadius: '10px', padding: '14px 16px', fontSize: '20px', fontWeight: '700', textAlign: 'center', boxSizing: 'border-box', marginBottom: '10px', background: phase === 'showing' ? (props.isCorrect ? THEME.successBg : THEME.failBg) : '#fff', color: phase === 'showing' ? (props.isCorrect ? THEME.success : THEME.fail) : THEME.dark }, disabled: phase !== 'answering'
      }),
      phase === 'showing' && React.createElement('div', { style: { fontSize: '13px', textAlign: 'center', color: THEME.textMid, marginBottom: '10px' } },
        (props.isCorrect ? '정답: ' : '내 답: ' + (ua || '(미응답)') + ' · 정답: '),
        React.createElement('strong', { style: { color: THEME.success } }, q.correct),
        ' (' + q.meaning + ')'
      ),
      phase === 'answering' && React.createElement('button', { onClick: submit, disabled: !val.trim(), style: Object.assign({}, S.btnPrimary, { width: '100%' }, !val.trim() ? { background: '#9ca3af', cursor: 'not-allowed' } : null) }, '제출')
    );
  }

  // ── REPORT CARD: 본인 응시 결과 모아보기 ─────────────
  function ReportCard(props) {
    var sb = window.supabase;
    var user = props.user || {};
    var [attempts, setAttempts] = React.useState([]);
    var [loading, setLoading] = React.useState(true);
    var [selected, setSelected] = React.useState(null);

    React.useEffect(function(){
      if (!user.id) return;
      (async function(){
        try {
          var aRes = await sb.from('vocab_assignment_attempts')
            .select('*, vocab_assignments(id, title, unit_index, list_id, pass_score, vocab_lists(name))')
            .eq('student_id', user.id)
            .order('submitted_at', { ascending: false });
          setAttempts((aRes && aRes.data) || []);
        } catch (e) { console.error('내 응시 기록 로드 실패:', e); }
        setLoading(false);
      })();
    }, []);

    if (selected) return React.createElement(AttemptDetail, { attempt: selected, onBack: function(){ setSelected(null); } });

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '내 결과 (REPORT)', subtitle: '응시한 시험 ' + attempts.length + '회', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        loading
          ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textLight } }, '불러오는 중...')
          : !attempts.length
            ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) }, '아직 응시한 시험이 없습니다.')
            : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                attempts.map(function(a){
                  var asg = a.vocab_assignments || {};
                  var listInfo = asg.vocab_lists || {};
                  var pct = Math.round(a.percentage || 0);
                  var color = pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail;
                  var cut = parseInt(asg.pass_score, 10) || 0;
                  return React.createElement('div', { key: a.id, onClick: function(){ setSelected(a); }, style: Object.assign({}, S.card, { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }) },
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: '800', color: color, minWidth: '60px', textAlign: 'center' } }, pct + '점'),
                    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                      React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, asg.title || ('UNIT ' + asg.unit_index + ' 시험')),
                      React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '2px', fontFamily: THEME.font } },
                        [listInfo.name, 'UNIT ' + asg.unit_index, (a.total_correct || 0) + '/' + (a.total_questions || 0), '응시 ' + (a.attempt_number || 1) + '회차', cut > 0 ? '커트라인 ' + cut + '점' : null].filter(Boolean).join(' · ')
                      ),
                      React.createElement('div', { style: { fontSize: '11px', color: THEME.textLight, marginTop: '2px' } }, String(a.submitted_at || '').slice(0,16).replace('T',' '))
                    ),
                    cut > 0 && React.createElement('span', { style: { flexShrink: 0, fontSize: '11px', fontWeight: '800', borderRadius: '999px', padding: '3px 10px', background: pct >= cut ? THEME.successBg : THEME.failBg, color: pct >= cut ? THEME.success : THEME.fail } }, pct >= cut ? '합격' : '불합격'),
                    React.createElement('div', { style: { fontSize: '20px', color: THEME.textLight } }, '›')
                  );
                })
              )
      )
    );
  }

  // 응시 결과 상세 — 단계별 점수 표시 (4단계 학습 세트 기준)
  function AttemptDetail(props) {
    var a = props.attempt;
    var asg = a.vocab_assignments || {};
    var pct = Math.round(a.percentage || 0);
    var color = pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail;
    var cut = parseInt(asg.pass_score, 10) || 0;
    var stageScores = a.stage_scores || {};
    var STAGE_LABEL = { '1': '1단계 — 단어', '2': '2단계 — 예문 해석', '3': '3단계 — 영작', 'grammar': '어법' };
    var stageKeys = Object.keys(stageScores).filter(function(k){ return STAGE_LABEL[k]; }).sort(function(a, b){
      var order = { '1': 1, '2': 2, '3': 3, 'grammar': 4 };
      return (order[a] || 99) - (order[b] || 99);
    });
    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: asg.title || ('UNIT ' + asg.unit_index + ' 시험'), subtitle: '응시 ' + (a.attempt_number || 1) + '회차', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        React.createElement('div', { style: Object.assign({}, S.card, { padding: '24px', textAlign: 'center', marginBottom: '14px' }, cut > 0 ? { border: '2px solid ' + (pct >= cut ? THEME.success : THEME.fail) } : null) },
          React.createElement('div', { style: { fontSize: '46px', fontWeight: '800', color: color } }, pct + '점'),
          React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, marginTop: '4px' } }, (a.total_correct || 0) + ' / ' + (a.total_questions || 0) + ' 정답 · ' + (a.time_taken_seconds || 0) + '초 소요'),
          cut > 0 && React.createElement('div', { style: { marginTop: '10px' } },
            React.createElement('span', { style: { display: 'inline-block', fontSize: '13px', fontWeight: '800', borderRadius: '999px', padding: '4px 14px', background: pct >= cut ? THEME.successBg : THEME.failBg, color: pct >= cut ? THEME.success : THEME.fail } }, (pct >= cut ? '합격' : '불합격') + ' · 커트라인 ' + cut + '점')
          )
        ),
        stageKeys.length > 0 && React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, marginBottom: '8px', fontFamily: THEME.font } }, '단계별 점수'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
          stageKeys.map(function(k){
            var sc = stageScores[k] || {};
            var sPct = sc.total > 0 ? Math.round(sc.correct * 100 / sc.total) : 0;
            var sColor = sPct >= 80 ? THEME.success : sPct >= 60 ? '#c87000' : THEME.fail;
            return React.createElement('div', { key: k, style: { padding: '12px 14px', background: '#fff', borderRadius: '8px', border: '1px solid ' + THEME.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '14px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font } }, STAGE_LABEL[k]),
                React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, (sc.correct || 0) + ' / ' + (sc.total || 0) + ' 정답')
              ),
              React.createElement('div', { style: { fontSize: '20px', fontWeight: '800', color: sColor } }, sPct + '점')
            );
          })
        )
      )
    );
  }

  // ── RANKING: 시험별 반 순위 ─────────────────────────
  function Ranking(props) {
    var sb = window.supabase;
    var user = props.user || {};
    var [tests, setTests] = React.useState([]);
    var [selectedTest, setSelectedTest] = React.useState(null);
    var [ranking, setRanking] = React.useState([]);
    var [loading, setLoading] = React.useState(true);
    var [loadingRank, setLoadingRank] = React.useState(false);

    React.useEffect(function(){
      if (!user.id) return;
      (async function(){
        try {
          // 본인이 응시한 단어시험(vocab_assignments mode='test') 목록
          var aRes = await sb.from('vocab_assignment_attempts')
            .select('assignment_id, vocab_assignments(id, title, unit_index, list_id, pass_score, mode, vocab_lists(name))')
            .eq('student_id', user.id);
          var seen = {};
          var list = [];
          ((aRes && aRes.data) || []).forEach(function(a){
            var asg = a.vocab_assignments;
            if (asg && asg.mode === 'test' && !seen[a.assignment_id]) {
              seen[a.assignment_id] = true;
              list.push(asg);
            }
          });
          setTests(list);
        } catch (e) { console.error('랭킹 시험 목록 로드 실패:', e); }
        setLoading(false);
      })();
    }, []);

    async function loadRanking(test) {
      setSelectedTest(test);
      setLoadingRank(true);
      try {
        // 모든 응시자 — vocab_assignment_attempts에서 학생별 최고 percentage 1개만
        var aRes = await sb.from('vocab_assignment_attempts').select('student_id, student_name, percentage, total_correct, total_questions, attempt_number, time_taken_seconds, submitted_at').eq('assignment_id', test.id).order('percentage', { ascending: false }).order('time_taken_seconds', { ascending: true });
        var rows = (aRes && aRes.data) || [];
        // 학생당 최고만 추리기
        var best = {};
        rows.forEach(function(r){
          if (!best[r.student_id] || r.percentage > best[r.student_id].percentage || (r.percentage === best[r.student_id].percentage && r.time_taken_seconds < best[r.student_id].time_taken_seconds)) {
            best[r.student_id] = r;
          }
        });
        var ranked = Object.values(best).sort(function(a, b){
          if (b.percentage !== a.percentage) return b.percentage - a.percentage;
          return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
        });
        setRanking(ranked);
      } catch (e) {}
      setLoadingRank(false);
    }

    if (selectedTest) {
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: selectedTest.title || '순위', subtitle: 'UNIT ' + selectedTest.unit_index, onBack: function(){ setSelectedTest(null); setRanking([]); } }),
        React.createElement('div', { style: { padding: '16px', maxWidth: '600px', margin: '0 auto' } },
          loadingRank
            ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textLight } }, '순위 계산 중...')
            : !ranking.length
              ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) }, '아직 응시 결과가 없습니다.')
              : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                  ranking.map(function(r, i){
                    var rank = i + 1;
                    var isMe = r.student_id === user.id;
                    var medalBg = rank === 1 ? '#fef3c7' : rank === 2 ? '#e5e7eb' : rank === 3 ? '#fed7aa' : THEME.cardBg;
                    var rcut = parseInt(selectedTest.pass_score, 10) || 0;
                    return React.createElement('div', { key: r.student_id, style: Object.assign({}, S.card, { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: isMe ? THEME.primaryBg : medalBg, border: isMe ? '2px solid ' + THEME.primary : '1px solid ' + THEME.border }) },
                      React.createElement('div', { style: { fontSize: '15px', fontWeight: '800', color: isMe ? THEME.primary : THEME.dark, minWidth: '40px', textAlign: 'center' } }, rank + '위'),
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font } }, r.student_name + (isMe ? ' (나)' : '')),
                        React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, (r.time_taken_seconds || 0) + '초 · ' + r.attempt_number + '회차')
                      ),
                      rcut > 0 && React.createElement('span', { style: { flexShrink: 0, fontSize: '10px', fontWeight: '800', borderRadius: '999px', padding: '2px 8px', background: (r.percentage || 0) >= rcut ? THEME.successBg : THEME.failBg, color: (r.percentage || 0) >= rcut ? THEME.success : THEME.fail } }, (r.percentage || 0) >= rcut ? '합격' : '불합격'),
                      React.createElement('div', { style: { fontSize: '20px', fontWeight: '800', color: r.percentage >= 80 ? THEME.success : r.percentage >= 60 ? '#c87000' : THEME.fail } }, Math.round(r.percentage) + '점')
                    );
                  })
                )
        )
      );
    }

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '순위 (RANKING)', subtitle: '시험을 선택해 순위 확인', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        loading
          ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textLight } }, '불러오는 중...')
          : !tests.length
            ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) }, '응시한 시험이 없습니다. 시험에 한 번 응시해야 순위가 보입니다.')
            : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                tests.map(function(t){
                  var listInfo = (t.vocab_lists) || {};
                  return React.createElement('button', { key: t.id, onClick: function(){ loadRanking(t); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'left' } },
                    React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark } }, t.title),
                    React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '2px' } }, [listInfo.name, 'UNIT ' + t.unit_index].filter(Boolean).join(' · '))
                  );
                })
              )
      )
    );
  }

  // ── 공용 헤더 ─────────────────────────────────────
  function StudentHeader(props) {
    return React.createElement('div', { style: { background: THEME.cardBg, borderBottom: '1px solid ' + THEME.border, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' } },
      React.createElement('button', { onClick: props.onBack, style: { background: 'none', border: 'none', color: THEME.primary, cursor: 'pointer', fontSize: '13px', fontWeight: '800', fontFamily: THEME.font, padding: 0 } }, '← 뒤로'),
      React.createElement('div', { style: { width: '1px', height: '16px', background: THEME.border } }),
      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
        React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, props.title),
        props.subtitle && React.createElement('div', { style: { fontSize: '11px', color: THEME.textLight, fontFamily: THEME.font, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, props.subtitle)
      )
    );
  }

  // 전역 노출
  window.VocabPlayer = VocabPlayer;

})();
