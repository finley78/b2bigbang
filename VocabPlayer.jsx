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
      u.rate = (opts && opts.rate) || 0.85; // 학생용: 약간 느리게 발음
      u.pitch = (opts && opts.pitch) || 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ── 메인 (4섹션 메뉴) ─────────────────────────────────
  function VocabPlayer(props) {
    var [view, setView] = React.useState('home'); // 'home' | 'study' | 'test' | 'report' | 'ranking'

    function back() { setView('home'); }

    if (view === 'study') return React.createElement(StudyMenu, { user: props.user, onBack: back });
    if (view === 'test') return React.createElement(TestMenu, { user: props.user, onBack: back });
    if (view === 'report') return React.createElement(ReportCard, { user: props.user, onBack: back });
    if (view === 'ranking') return React.createElement(Ranking, { user: props.user, onBack: back });

    // 홈: 4섹션 카드
    var sections = [
      { id: 'study', label: 'STUDY', desc: '단어 자유 학습', emoji: '📚', color: '#1d4ed8' },
      { id: 'test', label: 'TEST', desc: '시험 응시', emoji: '✏️', color: THEME.primary },
      { id: 'report', label: 'REPORT', desc: '내 시험 결과', emoji: '📊', color: '#c87000' },
      { id: 'ranking', label: 'RANKING', desc: '반별 순위', emoji: '🏆', color: '#006241' },
    ];

    return React.createElement('div', { style: S.page },
      React.createElement('div', { style: { padding: '18px 16px 24px', maxWidth: '720px', margin: '0 auto' } },
        React.createElement('h1', { style: { fontSize: '22px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font, margin: 0, marginBottom: '6px' } }, '단어 시험'),
        React.createElement('p', { style: { fontSize: '13px', color: THEME.textMid, fontFamily: THEME.font, marginBottom: '20px' } }, '학습부터 시험·결과·순위까지'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
          sections.map(function(sec){
            return React.createElement('button', { key: sec.id, onClick: function(){ setView(sec.id); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '14px', padding: '20px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: THEME.font, transition: 'all 0.15s', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } },
              React.createElement('div', { style: { fontSize: '32px', marginBottom: '4px' } }, sec.emoji),
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

  // ── STUDY: 단어장 → UNIT → 모드 선택 → 학습 ─────────
  function StudyMenu(props) {
    var sb = window.supabase;
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
        var res = await sb.from('vocab_lists').select('id, name, subject, grade, unit_size').eq('is_active', true).order('created_at', { ascending: false });
        var rows = (res && res.data) || [];
        if (rows.length) {
          var ids = rows.map(function(r){ return r.id; });
          var wRes = await sb.from('vocab_words').select('list_id').in('list_id', ids);
          var counts = {};
          ((wRes && wRes.data) || []).forEach(function(w){ counts[w.list_id] = (counts[w.list_id] || 0) + 1; });
          rows.forEach(function(r){ r._wordCount = counts[r.id] || 0; r._unitCount = Math.ceil((r._wordCount || 0) / (r.unit_size || 20)); });
        }
        setLists(rows);
      } catch (e) {}
      setLoading(false);
    }

    async function pickList(L) {
      setSelectedList(L);
      setStage('units');
      // 단어 전체 로드
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

    var pageTitle = stage === 'list' ? '학습할 단어장 선택' : stage === 'units' ? selectedList.name + ' — UNIT 선택' : '학습 모드 선택';

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '학습 (STUDY)', subtitle: pageTitle, onBack: backStage }),

      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        loading
          ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: '#9ca3af' } }, '불러오는 중...')
          : stage === 'list' ? (
            !lists.length
              ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: '#9ca3af' }) }, '아직 등록된 단어장이 없습니다.')
              : React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' } },
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
          ) : ( // modes
            React.createElement('div', null,
              React.createElement('div', { style: Object.assign({}, S.card, { marginBottom: '12px', background: THEME.primaryBg }) },
                React.createElement('div', { style: { fontSize: '11px', color: THEME.primary, fontWeight: '700', marginBottom: '4px' } }, '선택됨'),
                React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark } }, selectedList.name + ' · UNIT ' + selectedUnit)
              ),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' } },
                [
                  { id: 'flashcard', label: 'Flash Card', desc: '단어를 보고 외우기 (자동 진행, 발음 자동)', emoji: '🎴' },
                  { id: 'multiple_choice', label: '객관식', desc: '4지선다로 뜻 맞추기', emoji: '☑️' },
                  { id: 'spelling', label: '스펠링 채우기', desc: '일부 빈칸을 채우기', emoji: '_a_' },
                  { id: 'writing', label: '뜻 보고 쓰기', desc: '뜻을 보고 단어 쓰기', emoji: '✍️' },
                  { id: 'listening', label: '듣고 쓰기', desc: '발음을 듣고 단어 쓰기', emoji: '🔊' },
                ].map(function(m){
                  return React.createElement('button', { key: m.id, onClick: function(){ pickMode(m.id); }, style: { background: '#fff', border: '1.5px solid ' + THEME.border, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', fontFamily: THEME.font, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' } },
                    React.createElement('div', { style: { fontSize: '24px', width: '40px', textAlign: 'center' } }, m.emoji),
                    React.createElement('div', { style: { flex: 1 } },
                      React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark } }, m.label),
                      React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, m.desc)
                    )
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
    // 다른 모드는 추후 구현 — 일단 안내
    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '학습', subtitle: props.list.name + ' · UNIT ' + props.unitIndex, onBack: props.onBack }),
      React.createElement('div', { style: { padding: '40px 16px', textAlign: 'center', maxWidth: '720px', margin: '0 auto' } },
        React.createElement('div', { style: Object.assign({}, S.card, { padding: '40px 20px', color: THEME.textMid }) },
          React.createElement('div', { style: { fontSize: '40px', marginBottom: '12px' } }, '🚧'),
          React.createElement('div', { style: { fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: THEME.dark } }, '곧 만나요'),
          React.createElement('div', { style: { fontSize: '13px' } }, '이 모드는 다음 업데이트에서 추가됩니다.'),
          React.createElement('button', { onClick: props.onBack, style: Object.assign({}, S.btnGhost, { marginTop: '20px' }) }, '돌아가기')
        )
      )
    );
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
            React.createElement('div', { style: { fontSize: '48px', marginBottom: '14px' } }, '🎴'),
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
          React.createElement('button', { onClick: function(){ speak(word.word); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '8px 14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: THEME.font, marginBottom: '24px', alignSelf: 'center' } }, '🔊 다시 듣기'),
          React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: THEME.text, marginBottom: '8px' } }, word.meaning)
        ),

        // 컨트롤
        React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' } },
          React.createElement('button', { onClick: prev, disabled: idx === 0, style: Object.assign({}, S.btnGhost, { flex: 1, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }) }, '← 이전'),
          React.createElement('button', { onClick: function(){ setAutoPlay(!autoPlay); }, style: Object.assign({}, S.btnGhost, { padding: '10px 14px', background: autoPlay ? THEME.primaryBg : '#fff', color: autoPlay ? THEME.primary : THEME.textMid, borderColor: autoPlay ? THEME.primary : THEME.border }) }, autoPlay ? '⏸ 정지' : '▶ 재생'),
          idx < total - 1
            ? React.createElement('button', { onClick: next, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, '다음 →')
            : React.createElement('button', { onClick: props.onDone, style: Object.assign({}, S.btnPrimary, { flex: 1, padding: '10px 16px', fontSize: '14px' }) }, '완료')
        )
      )
    );
  }

  // ── TEST: 배포된 시험 목록 + 응시 ────────────────────
  function TestMenu(props) {
    var sb = window.supabase;
    var user = props.user || {};
    var [tests, setTests] = React.useState([]);
    var [attempts, setAttempts] = React.useState({}); // { test_id: [attempt, ...] }
    var [loading, setLoading] = React.useState(true);
    var [activeTest, setActiveTest] = React.useState(null); // 응시 중인 시험

    React.useEffect(function(){ load(); }, []);

    async function load() {
      if (!user.id) return;
      setLoading(true);
      try {
        // 본인이 받은 시험: assignments 테이블에서 본인 또는 본인 반에 배포된 것
        var classIds = (user.classIds || []);
        var orParts = ['student_id.eq.' + user.id];
        if (classIds.length > 0) orParts.push('class_id.in.(' + classIds.join(',') + ')');
        var aRes = await sb.from('vocab_test_assignments').select('test_id').or(orParts.join(','));
        var testIds = Array.from(new Set(((aRes && aRes.data) || []).map(function(a){ return a.test_id; })));
        if (testIds.length === 0) { setTests([]); setLoading(false); return; }
        var tRes = await sb.from('vocab_tests').select('*, vocab_lists(name, subject, grade, unit_size)').in('id', testIds).eq('is_active', true).eq('status', 'open');
        var testList = (tRes && tRes.data) || [];
        // due_at 지난 것 제외
        var now = Date.now();
        testList = testList.filter(function(t){ return !t.due_at || new Date(t.due_at).getTime() > now; });
        setTests(testList);
        // 응시 횟수 조회
        if (testList.length > 0) {
          var atRes = await sb.from('vocab_test_attempts').select('*').eq('student_id', user.id).in('test_id', testList.map(function(t){ return t.id; })).order('attempt_number', { ascending: true });
          var byTest = {};
          ((atRes && atRes.data) || []).forEach(function(a){ if (!byTest[a.test_id]) byTest[a.test_id] = []; byTest[a.test_id].push(a); });
          setAttempts(byTest);
        }
      } catch (e) { console.error('시험 로드 실패:', e); }
      setLoading(false);
    }

    function startTest(test) {
      setActiveTest(test);
    }
    function endTest(savedAttempt) {
      setActiveTest(null);
      load();
    }

    if (activeTest) {
      return React.createElement(QuizRunner, {
        test: activeTest,
        user: user,
        existingAttempts: attempts[activeTest.id] || [],
        onBack: function(){ if (confirm('응시를 중단하시겠습니까? 입력한 답안은 저장되지 않습니다.')) setActiveTest(null); },
        onDone: endTest,
      });
    }

    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: '시험 (TEST)', subtitle: '배포된 시험에 응시합니다', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        loading
          ? React.createElement('div', { style: { padding: '40px', textAlign: 'center', color: THEME.textLight } }, '불러오는 중...')
          : tests.length === 0
            ? React.createElement('div', { style: Object.assign({}, S.card, { textAlign: 'center', padding: '40px', color: THEME.textMid }) },
                React.createElement('div', { style: { fontSize: '34px', marginBottom: '10px' } }, '📭'),
                React.createElement('div', null, '받은 시험이 없습니다.')
              )
            : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                tests.map(function(t){
                  var done = (attempts[t.id] || []).length;
                  var max = t.attempts_allowed === -1 ? '무제한' : t.attempts_allowed;
                  var canStart = t.attempts_allowed === -1 || done < t.attempts_allowed;
                  var modes = [];
                  if (t.multiple_choice_count) modes.push('객관식 ' + t.multiple_choice_count);
                  if (t.spelling_count) modes.push('스펠링 ' + t.spelling_count);
                  if (t.writing_count) modes.push('쓰기 ' + t.writing_count);
                  if (t.listening_count) modes.push('듣기 ' + t.listening_count);
                  var listInfo = t.vocab_lists || {};
                  return React.createElement('div', { key: t.id, style: S.card },
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' } },
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { fontSize: '15px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font } }, t.title),
                        React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '4px', fontFamily: THEME.font } },
                          [listInfo.name, 'UNIT ' + t.unit_index, modes.join(' · ')].filter(Boolean).join(' · ')
                        )
                      )
                    ),
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid ' + THEME.border } },
                      React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, fontFamily: THEME.font } },
                        '응시 ' + done + '/' + max + (t.due_at ? ' · 마감 ' + String(t.due_at).slice(5,16).replace('T',' ') : '')
                      ),
                      React.createElement('button', { onClick: function(){ startTest(t); }, disabled: !canStart, style: Object.assign({}, S.btnPrimary, { padding: '8px 16px', fontSize: '13px' }, !canStart ? { background: '#9ca3af', cursor: 'not-allowed' } : null) }, canStart ? (done > 0 ? '다시 응시' : '응시 시작') : '응시 횟수 마감')
                    )
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

    // 듣기 모드 자동 발음
    React.useEffect(function(){
      if (!started || !current) return;
      if (current.mode === 'listening' && phase === 'answering') {
        var t = setTimeout(function(){ speak(current.word); }, 200);
        return function(){ clearTimeout(t); };
      }
    }, [idx, started, phase]);

    function handleAnswer(userAns, fromTimeout) {
      if (phase !== 'answering') return;
      // 마지막 답안을 state 업데이트와 별개로 직접 보관 → submitFinal에 정확히 전달
      var nextAnswers = Object.assign({}, answers);
      nextAnswers[idx] = userAns;
      setAnswers(nextAnswers);
      setPhase('showing');
      // 정답 표시 시간 후 다음 문제
      var ms = (test.show_answer_seconds || 2) * 1000;
      setTimeout(function(){
        if (idx < total - 1) {
          setIdx(idx + 1);
          setPhase('answering');
        } else {
          setPhase('done');
          submitFinal(nextAnswers);  // 마지막 답안 포함된 객체 직접 전달
        }
      }, ms);
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
            React.createElement('div', { style: { fontSize: '40px', marginBottom: '12px' } }, '✏️'),
            React.createElement('div', { style: { fontSize: '17px', fontWeight: '800', color: THEME.dark, marginBottom: '14px' } }, '응시 안내'),
            React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, lineHeight: '1.8', marginBottom: '20px', textAlign: 'left' } },
              React.createElement('div', null, '• 총 ' + total + '문제 (단어당 ' + (test.seconds_per_question || 30) + '초)'),
              React.createElement('div', null, '• 답을 선택하면 정답이 ' + (test.show_answer_seconds || 2) + '초간 표시됩니다'),
              React.createElement('div', null, '• 시간이 다 되면 자동으로 다음 문제로 넘어갑니다'),
              React.createElement('div', null, '• 듣기 문제는 발음을 듣고 단어를 입력하세요')
            ),
            React.createElement('button', { onClick: function(){ setStarted(true); setStartedAt(Date.now()); }, style: S.btnPrimary }, '시작')
          )
        )
      );
    }
    // 결과 화면
    if (phase === 'done') {
      var pct = finalScore ? Math.round((finalScore.score / finalScore.total) * 100) : null;
      return React.createElement('div', { style: S.page },
        React.createElement(StudentHeader, { title: test.title + ' — 결과', onBack: function(){ props.onDone(finalScore); } }),
        React.createElement('div', { style: { padding: '20px 16px', maxWidth: '600px', margin: '0 auto' } },
          finalScore == null
            ? React.createElement('div', { style: { padding: '40px', textAlign: 'center' } }, '결과 저장 중...')
            : React.createElement('div', null,
                React.createElement('div', { style: Object.assign({}, S.card, { padding: '32px 20px', textAlign: 'center', marginBottom: '14px' }) },
                  React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginBottom: '8px' } }, '응시 ' + finalScore.attempt_number + '회차'),
                  React.createElement('div', { style: { fontSize: '52px', fontWeight: '800', color: pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail } }, pct + '점'),
                  React.createElement('div', { style: { fontSize: '14px', color: THEME.textMid, marginTop: '6px' } }, finalScore.score + ' / ' + finalScore.total + ' 정답')
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
        React.createElement(QuestionCard, { question: current, phase: phase, userAnswer: userAnswer, isCorrect: isCorrect, onAnswer: handleAnswer })
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
        q.direction === 'word_to_meaning' && React.createElement('button', { onClick: function(){ speak(q.prompt); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '12px', fontFamily: THEME.font } }, '🔊 듣기')
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
        React.createElement('button', { onClick: function(){ speak(q.correct); }, style: { background: THEME.primaryBg, color: THEME.primary, border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', fontFamily: THEME.font } }, '🔊 듣기')
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
        React.createElement('button', { onClick: function(){ speak(q.correct); }, style: { background: THEME.primary, color: '#fff', border: 'none', borderRadius: '50%', width: '80px', height: '80px', fontSize: '32px', cursor: 'pointer' } }, '🔊'),
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
          var aRes = await sb.from('vocab_test_attempts').select('*, vocab_tests(title, list_id, vocab_lists(name))').eq('student_id', user.id).order('submitted_at', { ascending: false });
          setAttempts((aRes && aRes.data) || []);
        } catch (e) {}
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
                  var t = a.vocab_tests || {};
                  var listInfo = t.vocab_lists || {};
                  var pct = a.percentage || (a.total > 0 ? Math.round((a.score / a.total) * 100) : 0);
                  var color = pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail;
                  return React.createElement('div', { key: a.id, onClick: function(){ setSelected(a); }, style: Object.assign({}, S.card, { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }) },
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: '800', color: color, minWidth: '60px', textAlign: 'center' } }, pct + '점'),
                    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                      React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, t.title || '시험'),
                      React.createElement('div', { style: { fontSize: '12px', color: THEME.textMid, marginTop: '2px', fontFamily: THEME.font } },
                        [listInfo.name, 'UNIT ' + a.unit_index, a.score + '/' + a.total, '응시 ' + a.attempt_number + '회차'].filter(Boolean).join(' · ')
                      ),
                      React.createElement('div', { style: { fontSize: '11px', color: THEME.textLight, marginTop: '2px' } }, String(a.submitted_at || '').slice(0,16).replace('T',' '))
                    ),
                    React.createElement('div', { style: { fontSize: '20px', color: THEME.textLight } }, '›')
                  );
                })
              )
      )
    );
  }

  function AttemptDetail(props) {
    var a = props.attempt;
    var t = a.vocab_tests || {};
    var pct = a.percentage || (a.total > 0 ? Math.round((a.score / a.total) * 100) : 0);
    var color = pct >= 80 ? THEME.success : pct >= 60 ? '#c87000' : THEME.fail;
    var qs = a.questions || [];
    var ans = a.answers || {};
    return React.createElement('div', { style: S.page },
      React.createElement(StudentHeader, { title: t.title || '시험 결과', subtitle: '응시 ' + a.attempt_number + '회차', onBack: props.onBack }),
      React.createElement('div', { style: { padding: '16px', maxWidth: '720px', margin: '0 auto' } },
        React.createElement('div', { style: Object.assign({}, S.card, { padding: '24px', textAlign: 'center', marginBottom: '14px' }) },
          React.createElement('div', { style: { fontSize: '46px', fontWeight: '800', color: color } }, pct + '점'),
          React.createElement('div', { style: { fontSize: '13px', color: THEME.textMid, marginTop: '4px' } }, a.score + ' / ' + a.total + ' 정답 · ' + (a.time_taken_seconds || 0) + '초 소요')
        ),
        React.createElement('div', { style: { fontSize: '13px', fontWeight: '700', color: THEME.dark, marginBottom: '8px', fontFamily: THEME.font } }, '문제별'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
          qs.map(function(q, i){
            var ua = ans[i];
            var ok = isAnswerCorrect(q, ua);
            return React.createElement('div', { key: i, style: { padding: '10px 14px', background: ok ? THEME.successBg : THEME.failBg, borderRadius: '8px', borderLeft: '3px solid ' + (ok ? THEME.success : THEME.fail), display: 'flex', alignItems: 'center', gap: '10px' } },
              React.createElement('span', { style: { fontSize: '13px', fontWeight: '700', color: ok ? THEME.success : THEME.fail, minWidth: '20px' } }, ok ? '✓' : '✗'),
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', { style: { fontSize: '14px', fontWeight: '700', color: THEME.dark, fontFamily: THEME.font } }, q.word + ' — ' + q.meaning),
                !ok && React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, '내 답: ' + (ua == null ? '(미응답)' : ua) + ' · 정답: ' + q.correct)
              )
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
          // 본인이 응시한 시험 목록
          var aRes = await sb.from('vocab_test_attempts').select('test_id, vocab_tests(id, title, unit_index, list_id, vocab_lists(name))').eq('student_id', user.id);
          var seen = {};
          var list = [];
          ((aRes && aRes.data) || []).forEach(function(a){
            if (a.vocab_tests && !seen[a.test_id]) {
              seen[a.test_id] = true;
              list.push(a.vocab_tests);
            }
          });
          setTests(list);
        } catch (e) {}
        setLoading(false);
      })();
    }, []);

    async function loadRanking(test) {
      setSelectedTest(test);
      setLoadingRank(true);
      try {
        // 모든 응시자 — 학생별 최고 점수 1개만 (attempt_number 가장 높은 것 또는 최고 percentage)
        var aRes = await sb.from('vocab_test_attempts').select('student_id, student_name, score, total, percentage, attempt_number, time_taken_seconds, submitted_at').eq('test_id', test.id).order('percentage', { ascending: false }).order('time_taken_seconds', { ascending: true });
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
                    var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                    return React.createElement('div', { key: r.student_id, style: Object.assign({}, S.card, { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: isMe ? THEME.primaryBg : medalBg, border: isMe ? '2px solid ' + THEME.primary : '1px solid ' + THEME.border }) },
                      React.createElement('div', { style: { fontSize: medal ? '22px' : '15px', fontWeight: '800', color: isMe ? THEME.primary : THEME.dark, minWidth: '40px', textAlign: 'center' } }, medal || (rank + '위')),
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { fontSize: '14px', fontWeight: '800', color: THEME.dark, fontFamily: THEME.font } }, r.student_name + (isMe ? ' (나)' : '')),
                        React.createElement('div', { style: { fontSize: '11px', color: THEME.textMid, marginTop: '2px' } }, (r.time_taken_seconds || 0) + '초 · ' + r.attempt_number + '회차')
                      ),
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
