// VocabManager.jsx — 단어장 관리 (관리자/선생님 공용)
// 학원 전체 공유: 모든 선생님·관리자가 모든 단어장 read+write

(function(){

  var STYLES = {
    card: { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)' },
    label: { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px', display:'block' },
    input: { width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box' },
    btnPrimary: { background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
    btnGhost: { background:'transparent', color:'rgba(0,0,0,0.55)', border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
    btnDanger: { background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' },
    modalBackdrop: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' },
    modalCard: { background:'#fff', borderRadius:'16px', width:'min(560px, calc(100% - 32px))', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', position:'relative', maxHeight:'90vh', overflowY:'auto' },
  };

  function VocabManager(props) {
    var user = props.user;
    var sb = window.supabase;
    var [lists, setLists] = React.useState([]);
    var [loading, setLoading] = React.useState(true);
    var [selectedListId, setSelectedListId] = React.useState(null);
    var [showNew, setShowNew] = React.useState(false);
    var [editingList, setEditingList] = React.useState(null); // {id, name, ...} 편집 모달
    var isMobile = window.B2Utils.useIsMobile();

    React.useEffect(function(){ loadLists(); }, []);

    async function loadLists() {
      setLoading(true);
      try {
        var res = await sb.from('vocab_lists')
          .select('id, name, description, subject, grade, unit_size, creator_name, created_at, updated_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        var rows = (res && res.data) || [];
        // 단어 수 별도 조회 (count 쿼리)
        var counts = {};
        if (rows.length) {
          var ids = rows.map(function(r){ return r.id; });
          var wRes = await sb.from('vocab_words').select('list_id').in('list_id', ids);
          ((wRes && wRes.data) || []).forEach(function(w){ counts[w.list_id] = (counts[w.list_id] || 0) + 1; });
        }
        rows.forEach(function(r){ r._wordCount = counts[r.id] || 0; });
        setLists(rows);
      } catch (e) { console.error('단어장 로드 실패:', e); setLists([]); }
      setLoading(false);
    }

    async function deleteList(list) {
      if (!confirm('"' + list.name + '" 단어장을 목록에서 숨길까요?\n\n안전 삭제: 단어·시험·응시 결과는 DB에 보관되며, 목록에서만 사라집니다. 필요 시 관리자에게 복구 요청 가능합니다.')) return;
      // soft delete: is_active=false (실제 데이터는 보관)
      var { error } = await sb.from('vocab_lists').update({ is_active:false }).eq('id', list.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      loadLists();
    }

    if (selectedListId) {
      return React.createElement(VocabListDetail, {
        listId: selectedListId,
        user: user,
        onBack: function(){ setSelectedListId(null); loadLists(); },
      });
    }

    return React.createElement('div', null,
      // 헤더
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' } },
        React.createElement('div', null,
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'#1A1A1A', margin:0, fontFamily:'Manrope, sans-serif' } }, '단어장 관리'),
          React.createElement('p', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '학원 전체 공유 — 모든 선생님이 모든 단어장을 사용할 수 있습니다.')
        ),
        React.createElement('button', { onClick:function(){ setShowNew(true); }, style:STYLES.btnPrimary }, '+ 새 단어장')
      ),

      loading
        ? React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '불러오는 중...')
        : !lists.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '아직 단어장이 없습니다. "+ 새 단어장" 버튼으로 만들어 주세요.')
          : React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px' } },
              lists.map(function(L){
                return React.createElement('div', { key:L.id, style:Object.assign({}, STYLES.card, { cursor:'pointer', transition:'all 0.15s', padding:'12px' }), onClick:function(){ setSelectedListId(L.id); } },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'6px', marginBottom:'6px' } },
                    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, L.name),
                    React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'1px 6px', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, L._wordCount + '단어')
                  ),
                  React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } },
                    [L.subject, L.grade, L._wordCount > 0 ? 'UNIT ' + Math.ceil(L._wordCount / (L.unit_size || 20)) + '개' : null].filter(Boolean).join(' · ')
                  ),
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'6px', paddingTop:'6px', borderTop:'1px solid rgba(0,0,0,0.06)', gap:'4px' } },
                    React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 } }, L.creator_name || '알 수 없음'),
                    React.createElement('div', { style:{ display:'flex', gap:'4px' } },
                      React.createElement('button', { onClick:function(e){ e.stopPropagation(); setEditingList(L); }, style:Object.assign({}, STYLES.btnGhost, { padding:'2px 6px', fontSize:'10px' }) }, '편집'),
                      React.createElement('button', { onClick:function(e){ e.stopPropagation(); deleteList(L); }, style:Object.assign({}, STYLES.btnDanger, { padding:'2px 6px', fontSize:'10px' }) }, '삭제')
                    )
                  )
                );
              })
            ),

      showNew && React.createElement(VocabListEditModal, {
        list: null,
        user: user,
        onClose: function(){ setShowNew(false); },
        onSaved: function(){ setShowNew(false); loadLists(); },
      }),
      editingList && React.createElement(VocabListEditModal, {
        list: editingList,
        user: user,
        onClose: function(){ setEditingList(null); },
        onSaved: function(){ setEditingList(null); loadLists(); },
      })
    );
  }

  // ── 단어장 만들기/편집 모달 ─────────────────────────
  function VocabListEditModal(props) {
    var sb = window.supabase;
    var initial = props.list || { name:'', description:'', subject:'', school_level:'', grade:'', class_id:'', unit_size: 20 };
    var [draft, setDraft] = React.useState(initial);
    var [saving, setSaving] = React.useState(false);
    var [classes, setClasses] = React.useState([]);

    React.useEffect(function(){
      (async function(){
        try {
          var c = await sb.from('classes').select('id, name, grade, subject').order('name');
          setClasses((c && c.data) || []);
        } catch (e) {}
      })();
    }, []);

    function set(k, v) { setDraft(function(d){ var n = Object.assign({}, d); n[k] = v; return n; }); }

    async function save() {
      if (!draft.name || !draft.name.trim()) { alert('단어장 이름을 입력해 주세요.'); return; }
      var unitSize = parseInt(draft.unit_size, 10);
      if (isNaN(unitSize) || unitSize < 1 || unitSize > 200) { alert('유닛 사이즈는 1~200 사이로 입력해 주세요.'); return; }
      setSaving(true);
      try {
        var row = {
          name: draft.name.trim(),
          description: draft.description || null,
          subject: draft.subject || null,
          school_level: draft.school_level || null,
          grade: draft.grade || null,
          class_id: draft.class_id || null,
          unit_size: unitSize,
          updated_at: new Date().toISOString(),
        };
        if (props.list && props.list.id) {
          var { error } = await sb.from('vocab_lists').update(row).eq('id', props.list.id);
          if (error) throw error;
        } else {
          var creator = props.user || {};
          row.created_by = window.B2Utils.safeUserId(creator);
          row.creator_name = creator.name || null;
          var { error: e2 } = await sb.from('vocab_lists').insert(row);
          if (e2) throw e2;
        }
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    var gradeOpts = draft.school_level === '초' ? ['1','2','3','4','5','6'] : (draft.school_level === '중' || draft.school_level === '고') ? ['1','2','3'] : [];
    // 입력 도중 실수로 배경 클릭 시 작성 내용이 사라지지 않도록 backdrop 클릭 닫기 비활성화 (X/취소 버튼으로만 닫기)
    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:STYLES.modalCard },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 18px', fontFamily:'Manrope, sans-serif' } }, props.list ? '단어장 편집' : '새 단어장 만들기'),

        React.createElement('div', { style:{ marginBottom:'12px' } },
          React.createElement('div', { style:STYLES.label }, '이름 *'),
          React.createElement('input', { type:'text', value:draft.name||'', onChange:function(e){ set('name', e.target.value); }, placeholder:'예: 워드마스터 수능 2000', style:STYLES.input })
        ),
        // 1행: 과목 · 초중고 · 학년 (모두 드롭다운, 선택사항)
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'12px' } },
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '과목'),
            React.createElement('select', { value:draft.subject||'', onChange:function(e){ set('subject', e.target.value); }, style:STYLES.input },
              React.createElement('option', { value:'' }, '선택 안 함'),
              ['국어','영어','수학','과학','사회','한국사','기타'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '초중고'),
            React.createElement('select', { value:draft.school_level||'', onChange:function(e){ set('school_level', e.target.value); set('grade', ''); }, style:STYLES.input },
              React.createElement('option', { value:'' }, '선택 안 함'),
              ['초','중','고'].map(function(L){ return React.createElement('option', { key:L, value:L }, L); })
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '학년'),
            React.createElement('select', { value:draft.grade||'', onChange:function(e){ set('grade', e.target.value); }, disabled: !draft.school_level, style:STYLES.input },
              React.createElement('option', { value:'' }, '선택 안 함'),
              gradeOpts.map(function(g){ return React.createElement('option', { key:g, value:g }, g + '학년'); })
            )
          )
        ),
        // 2행: 클래스 + 유닛 단위
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px', marginBottom:'12px' } },
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '클래스 (특정 반 전용으로 만들 때)'),
            React.createElement('select', { value:draft.class_id||'', onChange:function(e){ set('class_id', e.target.value); }, style:STYLES.input },
              React.createElement('option', { value:'' }, '학원 전체 공유 (모든 반)'),
              classes.map(function(c){ return React.createElement('option', { key:c.id, value:c.id }, c.name + (c.grade ? (' — ' + c.grade) : '')); })
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '유닛 단위'),
            React.createElement('input', { type:'number', min:1, max:200, value:draft.unit_size, onChange:function(e){ set('unit_size', window.B2Utils.stripLeadingZero(e.target.value)); }, placeholder:'20', style:STYLES.input })
          )
        ),
        React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', marginBottom:'12px', fontFamily:'Manrope, sans-serif', lineHeight:'1.5' } },
          '유닛 단위(기본 20): 단어 100개를 넣고 유닛 단위가 20이면 → 5개 유닛 자동 분할. 학생은 유닛별로 학습/시험합니다.'
        ),
        React.createElement('div', { style:{ marginBottom:'18px' } },
          React.createElement('div', { style:STYLES.label }, '설명 (선택)'),
          React.createElement('textarea', { value:draft.description||'', onChange:function(e){ set('description', e.target.value); }, placeholder:'단어장에 대한 메모 — 학생들에게는 보이지 않습니다.', rows:3, style:Object.assign({}, STYLES.input, { resize:'vertical', minHeight:'70px' }) })
        ),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          React.createElement('button', { onClick:save, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : '저장')
        )
      )
    );
  }

  // ── 단어장 상세 (단어 / 시험 탭) ─────────────────────
  function VocabListDetail(props) {
    var sb = window.supabase;
    var [list, setList] = React.useState(null);
    var [words, setWords] = React.useState([]);
    var [tests, setTests] = React.useState([]);
    var [activeTab, setActiveTab] = React.useState('words'); // 'words' | 'tests'
    var [loading, setLoading] = React.useState(true);
    var [showImport, setShowImport] = React.useState(false);
    var [editingWord, setEditingWord] = React.useState(null);
    var [showTestCreate, setShowTestCreate] = React.useState(null); // unit_index 또는 null
    var [editingTest, setEditingTest] = React.useState(null);
    var [resultsTest, setResultsTest] = React.useState(null);
    var [studySets, setStudySets] = React.useState([]); // [{unit_index, ...stages, title, ...}]
    var [studyUploadUnit, setStudyUploadUnit] = React.useState(null); // 업로드 모달 열 유닛 번호
    var [studyViewUnit, setStudyViewUnit] = React.useState(null); // 미리보기 모달 열 유닛 번호
    var [assignModalUnit, setAssignModalUnit] = React.useState(null); // 연습/시험 보내기 모달 열 유닛 번호
    var [assignments, setAssignments] = React.useState([]); // [{id, unit_index, mode, stages, ...}] — 그 단어장의 모든 배정
    var isMobile = window.B2Utils.useIsMobile();

    React.useEffect(function(){ load(); }, [props.listId]);

    async function load() {
      setLoading(true);
      try {
        var lRes = await sb.from('vocab_lists').select('*').eq('id', props.listId).maybeSingle();
        setList(lRes.data || null);
        var wRes = await sb.from('vocab_words').select('*').eq('list_id', props.listId).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
        setWords((wRes && wRes.data) || []);
        var tRes = await sb.from('vocab_tests').select('*').eq('list_id', props.listId).eq('is_active', true).order('unit_index', { ascending: true }).order('created_at', { ascending: false });
        setTests((tRes && tRes.data) || []);
        var sRes = await sb.from('vocab_study_sets').select('*').eq('list_id', props.listId).order('unit_index', { ascending: true });
        setStudySets((sRes && sRes.data) || []);
        var aRes = await sb.from('vocab_assignments').select('*').eq('list_id', props.listId).order('created_at', { ascending: false });
        setAssignments((aRes && aRes.data) || []);
      } catch (e) { console.error('단어장 상세 로드 실패:', e); }
      setLoading(false);
    }

    async function deleteWord(word) {
      if (!confirm('"' + word.word + '"을(를) 삭제할까요?')) return;
      var { error } = await sb.from('vocab_words').delete().eq('id', word.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      load();
    }

    // 시험이 없는 모든 유닛에 기본 시험을 한 번에 생성 (준비중 상태)
    async function createTestsForAllUnits() {
      var missing = unitsArray.filter(function(x){ return x.tests.length === 0 && x.words.length > 0; });
      if (missing.length === 0) { alert('모든 유닛에 이미 시험이 있습니다.'); return; }
      if (!confirm(missing.length + '개 유닛에 기본 시험을 만들까요?\n\n· 각 시험: 그 유닛 단어 전부, 객관식\n· 상태는 "준비중"으로 생성됩니다 — 각 시험의 "학생에게 내기"를 눌러 배포 대상(반/학년)을 정하고 시작해 주세요.')) return;
      var rows = missing.map(function(x){
        return {
          list_id: props.listId,
          title: 'UNIT ' + x.unit_index + ' 단어시험',
          unit_index: x.unit_index,
          teacher_id: window.B2Utils.safeUserId(props.user),
          teacher_name: (props.user && props.user.name) || null,
          multiple_choice_count: x.words.length,
          spelling_count: 0,
          writing_count: 0,
          listening_count: 0,
          choices_per_question: 4,
          question_direction: 'mixed',
          spelling_blank_ratio: 0.5,
          seconds_per_question: 30,
          show_answer_seconds: 2,
          attempts_allowed: 1,
          status: 'draft',
          due_at: null,
        };
      });
      var ins = await sb.from('vocab_tests').insert(rows);
      if (ins.error) { alert('생성 실패: ' + (ins.error.message || ins.error)); return; }
      alert(missing.length + '개 유닛 시험을 만들었어요. 각 시험의 "학생에게 내기"를 눌러 배포 대상을 정하고, 문제 형식(객관식·빈칸·쓰기 등)을 골라 시작해 주세요.');
      load();
    }

    if (loading) return React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '불러오는 중...');
    if (!list) return React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '단어장을 찾을 수 없습니다.');

    var unitSize = list.unit_size || 20;
    var maxWordUnit = Math.ceil(words.length / unitSize);
    var maxStudyUnit = studySets.reduce(function(m, s){ return Math.max(m, s.unit_index || 0); }, 0);
    // 채워진 유닛만 표시 — 다음 유닛은 상단의 '+ 5단계 학습 세트 업로드' 버튼이 자동 배치.
    // 단, 단어가 하나도 없으면 최소 UNIT 1은 보여주어 어디 시작할지 알게 함.
    var unitCount = Math.max(maxWordUnit, maxStudyUnit, 1);
    // 유닛별 단어 그룹화
    var unitsArray = [];
    for (var u = 1; u <= unitCount; u++) {
      var unitWords = words.slice((u-1) * unitSize, u * unitSize);
      var unitTests = tests.filter(function(t){ return t.unit_index === u; });
      var unitStudy = studySets.find(function(s){ return s.unit_index === u; }) || null;
      var unitAssignments = assignments.filter(function(a){ return a.unit_index === u; }).slice().sort(function(a, b){
        // 연습이 먼저, 시험이 뒤. 같은 종류는 최신순.
        if (a.mode !== b.mode) return a.mode === 'practice' ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      unitsArray.push({ unit_index: u, words: unitWords, tests: unitTests, study: unitStudy, assignments: unitAssignments });
    }

    return React.createElement('div', null,
      // 헤더 (뒤로가기 + 단어장 정보)
      React.createElement('button', { onClick:props.onBack, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', marginBottom:'12px', padding:0 } }, '← 단어장 목록'),
      React.createElement('div', { style:Object.assign({}, STYLES.card, { marginBottom:'14px' }) },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, list.name),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } },
              [list.subject, list.grade, words.length + '단어', words.length > 0 ? '유닛 ' + maxWordUnit + '개 (' + unitSize + '/유닛)' : null].filter(Boolean).join(' · ')
            )
          ),
          React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
            // 메인 버튼: 5단계 학습 세트 업로드 (다음 빈 유닛에 자동 등록)
            React.createElement('button', { onClick:function(){
              var nextUnit = Math.max(maxWordUnit, maxStudyUnit) + 1;
              setStudyUploadUnit(nextUnit);
            }, style:STYLES.btnPrimary }, '+ 5단계 학습 세트 업로드'),
            // 단어만 — 부가
            activeTab === 'words' && React.createElement('button', { onClick:function(){ setShowImport(true); }, style:STYLES.btnGhost }, '단어만 추가')
          )
        )
      ),

      // 탭
      React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'14px', borderBottom:'1px solid rgba(0,0,0,0.08)' } },
        [['words','단어 (' + words.length + ')'], ['tests','연습/시험 (' + assignments.length + ')']].map(function(t){
          return React.createElement('button', { key:t[0], onClick:function(){ setActiveTab(t[0]); }, style:{ background:'none', border:'none', padding:'10px 18px', fontSize:'14px', fontWeight:'700', cursor:'pointer', color: activeTab===t[0] ? '#E60012' : 'rgba(0,0,0,0.55)', borderBottom: activeTab===t[0] ? '2px solid #E60012' : '2px solid transparent', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, t[1]);
        })
      ),

      // 단어 탭
      activeTab === 'words' && (
        !words.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '아직 단어가 없습니다. 위의 "+ 5단계 학습 세트 업로드" 버튼으로 한 번에 등록하세요. (단어만 따로 넣으려면 "단어만 추가")')
          : React.createElement('div', { style:STYLES.card },
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr 70px' : '40px 1fr 1fr 1.5fr 100px', gap:'8px', padding:'8px 4px', borderBottom:'2px solid #1A1A1A', fontSize:'11px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } },
                !isMobile && React.createElement('div', null, '#'),
                React.createElement('div', null, '단어'),
                React.createElement('div', null, '뜻'),
                !isMobile && React.createElement('div', null, '예문'),
                React.createElement('div', { style:{ textAlign:'right' } }, '관리')
              ),
              words.map(function(w, i){
                var thisUnit = Math.floor(i / unitSize) + 1;
                var isUnitStart = i % unitSize === 0;
                return React.createElement(React.Fragment, { key:w.id },
                  isUnitStart && React.createElement('div', { style:{ gridColumn:'1 / -1', padding:'10px 4px 4px', fontSize:'11px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em', borderTop: i > 0 ? '1px dashed rgba(0,0,0,0.1)' : 'none', marginTop: i > 0 ? '6px' : 0 } }, '── UNIT ' + thisUnit + ' ──'),
                  React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr 70px' : '40px 1fr 1fr 1.5fr 100px', gap:'8px', padding:'10px 4px', borderBottom:'1px solid rgba(0,0,0,0.06)', fontSize:'13px', fontFamily:'Manrope, sans-serif', alignItems:'center' } },
                    !isMobile && React.createElement('div', { style:{ color:'rgba(0,0,0,0.4)', fontSize:'12px' } }, (i+1)),
                    React.createElement('div', { style:{ fontWeight:'700', color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis' } }, w.word),
                    React.createElement('div', { style:{ color:'rgba(0,0,0,0.75)', overflow:'hidden', textOverflow:'ellipsis' } }, w.meaning),
                    !isMobile && React.createElement('div', { style:{ color:'rgba(0,0,0,0.55)', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, w.example || '-'),
                    React.createElement('div', { style:{ display:'flex', gap:'4px', justifyContent:'flex-end' } },
                      React.createElement('button', { onClick:function(){ setEditingWord(w); }, style:Object.assign({}, STYLES.btnGhost, { padding:'3px 8px', fontSize:'11px' }) }, '편집'),
                      React.createElement('button', { onClick:function(){ deleteWord(w); }, style:Object.assign({}, STYLES.btnDanger, { padding:'3px 8px', fontSize:'11px' }) }, '×')
                    )
                  )
                );
              })
            )
      ),

      // 시험 탭 — 유닛별 섹션 + 시험 카드 그리드
      activeTab === 'tests' && (
        !words.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '먼저 단어를 추가해야 시험을 만들 수 있어요.')
          : React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap:'12px', alignItems:'start' } },
              unitsArray.map(function(unit){
                return React.createElement('div', { key:unit.unit_index, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px 12px' } },
                  // 유닛 헤더
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'5px', paddingBottom:'4px', borderBottom:'1px solid #1A1A1A', gap:'6px' } },
                    React.createElement('div', { style:{ minWidth:0, flex:1 } },
                      React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', color: unit.words.length===0 ? 'rgba(0,0,0,0.4)' : '#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } }, 'UNIT ' + unit.unit_index),
                      React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginLeft:'8px' } },
                        unit.words.length > 0
                          ? (unit.words.length + '단어 · ' + unit.words[0].word + (unit.words.length > 1 ? ' ~ ' + unit.words[unit.words.length-1].word : ''))
                          : '단어 없음 — 5단계 세트 업로드해서 시작'
                      )
                    ),
                    unit.words.length > 0 && unit.assignments.length > 0 && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.45)', fontWeight:'700', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, unit.assignments.length + '개 보냄')
                  ),
                  // 5단계 학습 세트 행: 업로드 상태 + 버튼
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px', fontSize:'10px', fontFamily:'Manrope, sans-serif' } },
                    unit.study
                      ? React.createElement(React.Fragment, null,
                          React.createElement('span', { style:{ background:'#d4e9e2', color:'#006241', fontWeight:'800', padding:'2px 6px', borderRadius:'3px', letterSpacing:'0.02em' } }, '5단계 세트 있음'),
                          React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, unit.study.title || ''),
                          React.createElement('button', { onClick:function(){ setStudyViewUnit(unit.unit_index); }, style:{ background:'transparent', color:'rgba(0,0,0,0.6)', border:'1px solid #d6dbde', borderRadius:'4px', padding:'2px 7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '보기'),
                          React.createElement('button', { onClick:function(){ setStudyUploadUnit(unit.unit_index); }, style:{ background:'transparent', color:'rgba(0,0,0,0.6)', border:'1px solid #d6dbde', borderRadius:'4px', padding:'2px 7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '교체')
                        )
                      : React.createElement(React.Fragment, null,
                          React.createElement('span', { style:{ color:'rgba(0,0,0,0.4)', flex:1 } }, '5단계 학습 세트 없음'),
                          React.createElement('button', { onClick:function(){ setStudyUploadUnit(unit.unit_index); }, style:{ background:'#FFEBED', color:'#E60012', border:'none', borderRadius:'4px', padding:'2px 8px', fontSize:'10px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 업로드')
                        )
                  ),
                  // 옛 vocab_tests 카드 표시는 제거 — 새 vocab_assignments 통합 흐름으로 대체.
                  // 보낸 연습/시험 목록 (vocab_assignments)
                  unit.assignments.length > 0 && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px', marginTop:'6px' } },
                    unit.assignments.map(function(a){
                      var stagesLabel = (a.stages || []).map(function(s){ return ({ '1':'1', '2':'2', '25':'2.5', '3':'3', 'grammar':'어' })[s] || s; }).join('·');
                      var modeBg = a.mode === 'test' ? '#fef3c7' : '#dbeafe';
                      var modeColor = a.mode === 'test' ? '#92400e' : '#1d4ed8';
                      var modeLabel = a.mode === 'test' ? '시험' : '연습';
                      return React.createElement('div', { key:a.id, style:{ background:'#fafbfc', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'6px 8px', fontSize:'10px', fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'6px' } },
                        React.createElement('span', { style:{ background: modeBg, color: modeColor, fontWeight:'800', padding:'1px 6px', borderRadius:'3px' } }, modeLabel),
                        React.createElement('span', { style:{ color:'rgba(0,0,0,0.7)' } }, '단계: ' + stagesLabel),
                        React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, a.title || (a.mode === 'test' ? '시험' : '연습'))
                      );
                    })
                  ),
                  // 연습/시험 보내기 버튼 — 5단계 세트 있고 단어가 있을 때만
                  unit.study && unit.words.length > 0 && React.createElement('button', { onClick:function(){ setAssignModalUnit(unit.unit_index); }, style:{ marginTop:'6px', width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'6px', padding:'7px', fontSize:'11px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 연습/시험 보내기')
                );
              })
            )
      ),

      showImport && React.createElement(VocabImportModal, {
        listId: props.listId,
        existingWords: words,
        onClose: function(){ setShowImport(false); },
        onSaved: function(){ setShowImport(false); load(); },
      }),
      editingWord && React.createElement(VocabWordEditModal, {
        word: editingWord,
        onClose: function(){ setEditingWord(null); },
        onSaved: function(){ setEditingWord(null); load(); },
      }),
      showTestCreate !== null && React.createElement(VocabTestEditModal, {
        listId: props.listId,
        unitIndex: showTestCreate,
        unitWordCount: (unitsArray.find(function(x){ return x.unit_index === showTestCreate; }) || { words:[] }).words.length,
        user: props.user,
        onClose: function(){ setShowTestCreate(null); },
        onSaved: function(){ setShowTestCreate(null); load(); },
      }),
      editingTest && React.createElement(VocabTestEditModal, {
        listId: props.listId,
        unitIndex: editingTest.unit_index,
        unitWordCount: (unitsArray.find(function(x){ return x.unit_index === editingTest.unit_index; }) || { words:[] }).words.length,
        user: props.user,
        test: editingTest,
        onClose: function(){ setEditingTest(null); },
        onSaved: function(){ setEditingTest(null); load(); },
      }),
      resultsTest && React.createElement(VocabTestResultsModal, {
        test: resultsTest,
        onClose: function(){ setResultsTest(null); },
      }),
      studyUploadUnit !== null && React.createElement(VocabStudySetUploadModal, {
        listId: props.listId,
        unitIndex: studyUploadUnit,
        unitSize: list.unit_size || 20,
        existingWords: words,
        existingStudy: studySets.find(function(s){ return s.unit_index === studyUploadUnit; }) || null,
        user: props.user,
        onClose: function(){ setStudyUploadUnit(null); },
        onSaved: function(){ setStudyUploadUnit(null); load(); },
      }),
      studyViewUnit !== null && React.createElement(VocabStudySetViewModal, {
        study: studySets.find(function(s){ return s.unit_index === studyViewUnit; }) || null,
        unitIndex: studyViewUnit,
        onClose: function(){ setStudyViewUnit(null); },
      }),
      assignModalUnit !== null && React.createElement(VocabAssignmentModal, {
        listId: props.listId,
        list: list,
        unitIndex: assignModalUnit,
        studyData: studySets.find(function(s){ return s.unit_index === assignModalUnit; }) || null,
        user: props.user,
        onClose: function(){ setAssignModalUnit(null); },
        onSaved: function(){ setAssignModalUnit(null); load(); },
      })
    );
  }

  // ── 단어 추가 모달 (엑셀 업로드 + 붙여넣기 + 직접 입력) ───────────────────
  function VocabImportModal(props) {
    var sb = window.supabase;
    var [mode, setMode] = React.useState('paste'); // 'paste' / 'excel' / 'single'
    var [pasteWords, setPasteWords] = React.useState('');     // 단어만
    var [pasteMeanings, setPasteMeanings] = React.useState(''); // 뜻만
    var [parsed, setParsed] = React.useState([]); // [{word, meaning, example}, ...]
    var [singleDraft, setSingleDraft] = React.useState({ word:'', meaning:'', example:'' });
    var [saving, setSaving] = React.useState(false);

    // 두 박스 줄별 매칭 — 단어 줄 N개와 뜻 줄 N개를 같은 줄 번호끼리 매칭
    function parsePasted(wordsText, meaningsText) {
      var wLines = String(wordsText || '').split(/\r?\n/).map(function(s){ return s.trim(); });
      var mLines = String(meaningsText || '').split(/\r?\n/).map(function(s){ return s.trim(); });
      var rows = [];
      var n = Math.max(wLines.length, mLines.length);
      for (var i = 0; i < n; i++) {
        var w = wLines[i] || '';
        var m = mLines[i] || '';
        if (!w && !m) continue; // 빈 줄 무시
        if (w && m) rows.push({ word: w, meaning: m, example: null });
      }
      return rows;
    }

    React.useEffect(function(){
      if (mode === 'paste') setParsed(parsePasted(pasteWords, pasteMeanings));
    }, [pasteWords, pasteMeanings, mode]);

    async function handleExcel(file) {
      if (!file) return;
      if (!window.XLSX) { alert('엑셀 라이브러리가 로드되지 않았습니다.'); return; }
      try {
        var buf = await file.arrayBuffer();
        var wb = window.XLSX.read(buf, { type:'array' });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var rows = window.XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });
        // 헤더 행 자동 감지 + 컬럼 위치 자동 결정
        // 케이스 1: "단어 / 뜻" (2열) — wordCol=0, meaningCol=1
        // 케이스 2: "번호 / 단어 / 뜻" (3열) — wordCol=1, meaningCol=2 (번호 컬럼 skip)
        // 케이스 3: 그 외 / 헤더 없음 — 기본 wordCol=0, meaningCol=1
        var wordCol = 0, meaningCol = 1, exampleCol = 2;
        var startIdx = 0;
        if (rows.length && Array.isArray(rows[0])) {
          var hr = rows[0].map(function(x){ return String(x||'').trim(); });
          var hasHeader = false;
          var wIdx = -1, mIdx = -1, eIdx = -1;
          for (var c = 0; c < hr.length; c++) {
            var h = hr[c];
            if (/단어|word|영단|어휘|vocabulary/i.test(h)) { if (wIdx < 0) wIdx = c; hasHeader = true; }
            else if (/^뜻$|^의미$|^한국어$|meaning|korean|definition/i.test(h)) { if (mIdx < 0) mIdx = c; hasHeader = true; }
            else if (/예문|문장|example|sentence/i.test(h)) { if (eIdx < 0) eIdx = c; hasHeader = true; }
            else if (/번호|순번|^no\.?$|^#$|^index$|^id$/i.test(h)) { hasHeader = true; }
          }
          if (hasHeader) {
            startIdx = 1;
            if (wIdx >= 0) wordCol = wIdx;
            if (mIdx >= 0) meaningCol = mIdx;
            if (eIdx >= 0) exampleCol = eIdx;
            // 단어/뜻 헤더가 명시 안 됐고 첫 컬럼이 "번호"면 한 칸씩 밀어서 추정
            if (wIdx < 0 && mIdx < 0 && /번호|순번|^no\.?$|^#$|^index$|^id$/i.test(hr[0])) {
              wordCol = 1; meaningCol = 2; exampleCol = 3;
            }
          }
        }
        var out = [];
        for (var i = startIdx; i < rows.length; i++) {
          var r = rows[i];
          if (!r) continue;
          var w = String(r[wordCol] || '').trim();
          var m = String(r[meaningCol] || '').trim();
          if (!w || !m) continue;
          out.push({
            word: w, meaning: m,
            example: String(r[exampleCol] || '').trim() || null,
          });
        }
        setParsed(out);
        setMode('paste'); // 미리보기 화면 공유
        setPasteWords(out.map(function(r){ return r.word; }).join('\n'));
        setPasteMeanings(out.map(function(r){ return r.meaning; }).join('\n'));
      } catch (e) { alert('엑셀 파싱 실패: ' + (e.message || e)); }
    }

    async function saveBulk() {
      if (!parsed.length) { alert('추가할 단어가 없습니다.'); return; }
      setSaving(true);
      try {
        // 중복 단어 경고 (기존 단어장 안 + 입력 안 모두)
        var existingWords = (props.existingWords || []).map(function(w){ return String(w.word).toLowerCase(); });
        var dupExisting = parsed.filter(function(r){ return existingWords.indexOf(String(r.word).toLowerCase()) >= 0; }).map(function(r){ return r.word; });
        if (dupExisting.length && !confirm(dupExisting.length + '개 단어가 이미 단어장에 있습니다. 중복 추가하시겠습니까?\n예시: ' + dupExisting.slice(0,5).join(', '))) { setSaving(false); return; }

        var rows = parsed.map(function(r, i){ return {
          list_id: props.listId,
          word: r.word, meaning: r.meaning,
          example: r.example || null,
          sort_order: i,
        }; });
        // Supabase 한 번에 insert (대량은 1000개 제한이지만 보통 그 이하)
        var chunkSize = 500;
        for (var i = 0; i < rows.length; i += chunkSize) {
          var chunk = rows.slice(i, i + chunkSize);
          var { error } = await sb.from('vocab_words').insert(chunk);
          if (error) throw error;
        }
        alert(parsed.length + '개 단어를 추가했습니다.');
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    async function saveSingle() {
      if (!singleDraft.word || !singleDraft.meaning) { alert('단어와 뜻을 입력해 주세요.'); return; }
      setSaving(true);
      try {
        var { error } = await sb.from('vocab_words').insert({
          list_id: props.listId,
          word: singleDraft.word.trim(),
          meaning: singleDraft.meaning.trim(),
          example: singleDraft.example || null,
          sort_order: (props.existingWords || []).length,
        });
        if (error) throw error;
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    // 입력 도중 실수로 배경 클릭 시 작성 내용이 사라지지 않도록 backdrop 클릭 닫기 비활성화 (X/취소 버튼으로만 닫기)
    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(720px, calc(100% - 32px))' }) },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 14px', fontFamily:'Manrope, sans-serif' } }, '단어 추가'),

        // 모드 선택 탭
        React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'14px', borderBottom:'1px solid rgba(0,0,0,0.08)' } },
          [['paste','붙여넣기'], ['excel','엑셀 업로드'], ['single','한 개 직접 입력']].map(function(m){
            return React.createElement('button', { key:m[0], onClick:function(){ setMode(m[0]); }, style:{ background:'none', border:'none', padding:'8px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', color: mode===m[0] ? '#E60012' : 'rgba(0,0,0,0.55)', borderBottom: mode===m[0] ? '2px solid #E60012' : '2px solid transparent', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, m[1]);
          })
        ),

        mode === 'paste' && React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
            '왼쪽에 단어, 오른쪽에 뜻을 한 줄씩 붙여넣으세요. 같은 줄 번호끼리 짝이 됩니다. 엑셀의 단어 칸과 뜻 칸을 따로 복사하면 편해요.'
          ),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' } },
            React.createElement('div', null,
              React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'4px' }) }, '단어 (영문)'),
              React.createElement('textarea', {
                value: pasteWords,
                onChange: function(e){ setPasteWords(e.target.value); },
                placeholder: 'apple\nbanana\ncat\ndog',
                rows: 10,
                style: Object.assign({}, STYLES.input, { fontFamily:'Menlo, Consolas, monospace', resize:'vertical', minHeight:'200px', whiteSpace:'pre' })
              })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'4px' }) }, '뜻 (한글)'),
              React.createElement('textarea', {
                value: pasteMeanings,
                onChange: function(e){ setPasteMeanings(e.target.value); },
                placeholder: '사과\n바나나\n고양이\n개',
                rows: 10,
                style: Object.assign({}, STYLES.input, { fontFamily:'Menlo, Consolas, monospace', resize:'vertical', minHeight:'200px', whiteSpace:'pre' })
              })
            )
          ),
          parsed.length > 0 && React.createElement('div', { style:{ marginTop:'10px', fontSize:'12px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif' } },
            React.createElement('strong', { style:{ color:'#1A1A1A' } }, parsed.length + '개 단어 인식됨'),
            ' — 첫 5개 미리보기:',
            React.createElement('ul', { style:{ marginTop:'6px', paddingLeft:'18px', fontSize:'12px', lineHeight:'1.7' } },
              parsed.slice(0,5).map(function(r, i){
                return React.createElement('li', { key:i }, r.word + ' — ' + r.meaning);
              })
            )
          )
        ),

        mode === 'excel' && React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
            '엑셀 파일(.xlsx, .xls)을 업로드하세요. 단어 + 뜻 (+ 예문 선택). 첫 줄에 헤더("번호"/"단어"/"뜻")가 있으면 자동으로 건너뛰고 컬럼 위치도 자동으로 맞춥니다 — 단어/뜻 2열, 번호/단어/뜻 3열 모두 OK.'
          ),
          React.createElement('input', {
            type:'file',
            accept:'.xlsx,.xls,.csv',
            onChange: function(e){ var f = e.target.files && e.target.files[0]; if (f) handleExcel(f); },
            style: Object.assign({}, STYLES.input, { padding:'12px', cursor:'pointer' })
          })
        ),

        mode === 'single' && React.createElement('div', null,
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '단어 *'),
              React.createElement('input', { type:'text', value:singleDraft.word, onChange:function(e){ setSingleDraft(Object.assign({}, singleDraft, { word:e.target.value })); }, placeholder:'apple', style:STYLES.input })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '뜻 *'),
              React.createElement('input', { type:'text', value:singleDraft.meaning, onChange:function(e){ setSingleDraft(Object.assign({}, singleDraft, { meaning:e.target.value })); }, placeholder:'사과', style:STYLES.input })
            )
          ),
          React.createElement('div', { style:{ marginBottom:'10px' } },
            React.createElement('div', { style:STYLES.label }, '예문 (선택)'),
            React.createElement('input', { type:'text', value:singleDraft.example, onChange:function(e){ setSingleDraft(Object.assign({}, singleDraft, { example:e.target.value })); }, placeholder:'I ate an apple.', style:STYLES.input })
          )
        ),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'18px' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          mode === 'single'
            ? React.createElement('button', { onClick:saveSingle, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : '추가')
            : React.createElement('button', { onClick:saveBulk, disabled:saving || !parsed.length, style:Object.assign({}, STYLES.btnPrimary, (saving || !parsed.length) ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : (parsed.length ? parsed.length + '개 단어 저장' : '단어를 입력해 주세요'))
        )
      )
    );
  }

  // ── 단어 한 개 편집 모달 ─────────────────────────
  function VocabWordEditModal(props) {
    var sb = window.supabase;
    var [draft, setDraft] = React.useState(Object.assign({}, props.word));
    var [saving, setSaving] = React.useState(false);

    function set(k, v) { setDraft(function(d){ var n = Object.assign({}, d); n[k] = v; return n; }); }

    async function save() {
      if (!draft.word || !draft.meaning) { alert('단어와 뜻을 입력해 주세요.'); return; }
      setSaving(true);
      try {
        var { error } = await sb.from('vocab_words').update({
          word: draft.word.trim(),
          meaning: draft.meaning.trim(),
          example: draft.example || null,
        }).eq('id', props.word.id);
        if (error) throw error;
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    // 입력 도중 실수로 배경 클릭 시 작성 내용이 사라지지 않도록 backdrop 클릭 닫기 비활성화 (X/취소 버튼으로만 닫기)
    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:STYLES.modalCard },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 18px', fontFamily:'Manrope, sans-serif' } }, '단어 편집'),

        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' } },
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '단어 *'),
            React.createElement('input', { type:'text', value:draft.word||'', onChange:function(e){ set('word', e.target.value); }, style:STYLES.input })
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '뜻 *'),
            React.createElement('input', { type:'text', value:draft.meaning||'', onChange:function(e){ set('meaning', e.target.value); }, style:STYLES.input })
          )
        ),
        React.createElement('div', { style:{ marginBottom:'18px' } },
          React.createElement('div', { style:STYLES.label }, '예문 (선택)'),
          React.createElement('input', { type:'text', value:draft.example||'', onChange:function(e){ set('example', e.target.value); }, style:STYLES.input })
        ),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          React.createElement('button', { onClick:save, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : '저장')
        )
      )
    );
  }

  // ── 시험 만들기/편집 모달 ─────────────────────────
  function VocabTestEditModal(props) {
    var sb = window.supabase;
    var isEdit = !!props.test;
    var initial = props.test || {
      title: 'UNIT ' + props.unitIndex + ' 시험',
      multiple_choice_count: 0,
      spelling_count: 0,
      writing_count: 0,
      listening_count: 0,
      choices_per_question: 4,
      question_direction: 'mixed',
      spelling_blank_ratio: 0.5,
      seconds_per_question: 30,
      show_answer_seconds: 2,
      attempts_allowed: 1,
      pass_score: 0,
      status: 'draft',
      due_at: null,
    };
    var [draft, setDraft] = React.useState(initial);
    var [classes, setClasses] = React.useState([]);
    var [students, setStudents] = React.useState([]);
    var [selectedClassIds, setSelectedClassIds] = React.useState([]);
    var [selectedStudentIds, setSelectedStudentIds] = React.useState([]);
    var [selectedGrades, setSelectedGrades] = React.useState([]); // 학년으로 배포 — 저장 시 그 학년 학생 전체로 펼쳐서 student_id 배정
    var [studentSearch, setStudentSearch] = React.useState('');
    var [stuLevel, setStuLevel] = React.useState(''); // 개별 학생 필터: '' | '초' | '중' | '고'
    var [stuGrade, setStuGrade] = React.useState(''); // 개별 학생 필터: 학년 (예: '중1')
    var [saving, setSaving] = React.useState(false);

    // 학년 문자열 → 학교급 ('중1'→'중', '고2'→'고', 'N학년'·기타→'초')
    function gradeLvl(g) { g = String(g || '').trim(); if (!g) return ''; if (g[0] === '중') return '중'; if (g[0] === '고') return '고'; return '초'; }

    React.useEffect(function() {
      loadClassesStudents();
      if (isEdit) loadAssignments();
    }, []);

    async function loadClassesStudents() {
      try {
        var both = await Promise.all([
          sb.from('classes').select('id, name, class_name, grade, vocab_test_preset').order('name', { ascending: true }),
          sb.from('students').select('id, name, grade').eq('is_active', true).in('role', ['student','학생']).order('name', { ascending: true }),
        ]);
        setClasses((both[0] && both[0].data) || []);
        setStudents((both[1] && both[1].data) || []);
      } catch (e) {}
    }

    // 클래스 카드 클릭 — 토글 + preset 있으면 불러오기 제안 (선택된 반 = 배포 대상 + 시험 형식 저장 대상)
    function toggleClass(c) {
      var idx = selectedClassIds.indexOf(c.id);
      if (idx >= 0) {
        setSelectedClassIds(selectedClassIds.filter(function(x){ return x !== c.id; }));
        return;
      }
      if (c.vocab_test_preset && Object.keys(c.vocab_test_preset).length > 0) {
        if (confirm('"' + (c.class_name || c.name) + '"의 저장된 시험 형식을 폼에 불러올까요?\n(취소해도 배포 대상으로는 선택됩니다)')) {
          setDraft(function(d){ return Object.assign({}, d, c.vocab_test_preset); });
        }
      }
      setSelectedClassIds(selectedClassIds.concat([c.id]));
    }
    async function loadAssignments() {
      try {
        var res = await sb.from('vocab_test_assignments').select('class_id, student_id').eq('test_id', props.test.id);
        var classIds = [], studentIds = [];
        ((res && res.data) || []).forEach(function(a) {
          if (a.class_id) classIds.push(a.class_id);
          if (a.student_id) studentIds.push(a.student_id);
        });
        setSelectedClassIds(classIds);
        setSelectedStudentIds(studentIds);
      } catch (e) {}
    }

    function set(k, v) { setDraft(function(d) { var n = Object.assign({}, d); n[k] = v; return n; }); }
    function toggleStudent(id) {
      setSelectedStudentIds(function(arr) { return arr.indexOf(id) >= 0 ? arr.filter(function(x){ return x !== id; }) : arr.concat([id]); });
    }

    var mc = parseInt(draft.multiple_choice_count, 10) || 0;
    var sp = parseInt(draft.spelling_count, 10) || 0;
    var wr = parseInt(draft.writing_count, 10) || 0;
    var li = parseInt(draft.listening_count, 10) || 0;
    var totalQ = mc + sp + wr + li;
    var totalSec = totalQ * ((parseInt(draft.seconds_per_question, 10) || 30) + (parseInt(draft.show_answer_seconds, 10) || 2));
    var minutes = Math.floor(totalSec / 60), secs = totalSec % 60;

    async function save() {
      if (!draft.title || !draft.title.trim()) { alert('시험 이름을 입력해 주세요.'); return; }
      if (totalQ === 0) { alert('최소 한 모드는 1문제 이상 출제해야 합니다.'); return; }
      if (totalQ > props.unitWordCount) { alert('이 유닛의 단어 수(' + props.unitWordCount + ')보다 많은 문제를 출제할 수 없습니다.'); return; }
      // 학년 선택 시 → 그 학년 학생 전체 id 로 펼쳐서 개별 학생과 합침
      var gradeStudentIds = [];
      if (selectedGrades.length > 0) {
        try {
          var grRes = await sb.from('students').select('id').eq('is_active', true).in('role', ['student','학생']).in('grade', selectedGrades);
          gradeStudentIds = ((grRes && grRes.data) || []).map(function(x){ return x.id; });
        } catch (e) {}
      }
      var allStudentIds = Array.from(new Set(selectedStudentIds.concat(gradeStudentIds)));
      if (selectedClassIds.length === 0 && allStudentIds.length === 0 && draft.status === 'open') {
        if (!confirm('배포 대상이 비어 있습니다. 그래도 "진행중"으로 저장할까요?\n(아무도 응시할 수 없습니다)')) return;
      }

      setSaving(true);
      try {
        var payload = {
          list_id: props.listId,
          title: draft.title.trim(),
          unit_index: props.unitIndex,
          teacher_id: window.B2Utils.safeUserId(props.user),
          teacher_name: (props.user && props.user.name) || null,
          multiple_choice_count: mc,
          spelling_count: sp,
          writing_count: wr,
          listening_count: li,
          choices_per_question: parseInt(draft.choices_per_question, 10) || 4,
          question_direction: draft.question_direction || 'mixed',
          spelling_blank_ratio: parseFloat(draft.spelling_blank_ratio) || 0.5,
          seconds_per_question: parseInt(draft.seconds_per_question, 10) || 30,
          show_answer_seconds: parseInt(draft.show_answer_seconds, 10) || 2,
          attempts_allowed: parseInt(draft.attempts_allowed, 10),
          pass_score: Math.max(0, Math.min(100, parseInt(draft.pass_score, 10) || 0)),
          status: draft.status || 'draft',
          due_at: draft.due_at || null,
          updated_at: new Date().toISOString(),
        };

        var testId;
        if (isEdit) {
          var u = await sb.from('vocab_tests').update(payload).eq('id', props.test.id);
          if (u.error) throw u.error;
          testId = props.test.id;
          await sb.from('vocab_test_assignments').delete().eq('test_id', testId);
        } else {
          var ins = await sb.from('vocab_tests').insert(payload).select().single();
          if (ins.error) throw ins.error;
          testId = ins.data.id;
        }

        // 배포 대상 등록
        var assignments = [];
        selectedClassIds.forEach(function(cid) { assignments.push({ test_id: testId, class_id: cid }); });
        allStudentIds.forEach(function(sid) { assignments.push({ test_id: testId, student_id: sid }); });
        if (assignments.length > 0) {
          var ai = await sb.from('vocab_test_assignments').insert(assignments);
          if (ai.error) throw ai.error;
        }

        // 선택된 반들의 시험 형식(vocab_test_preset) 자동 저장 — 다음에 또 같은 반에 시험 만들 때 자동 불러오기 용
        if (selectedClassIds.length > 0) {
          var presetPayload = {
            multiple_choice_count: mc,
            spelling_count: sp,
            writing_count: wr,
            listening_count: li,
            choices_per_question: parseInt(draft.choices_per_question, 10) || 4,
            question_direction: draft.question_direction || 'mixed',
            spelling_blank_ratio: parseFloat(draft.spelling_blank_ratio) || 0.5,
            seconds_per_question: parseInt(draft.seconds_per_question, 10) || 30,
            show_answer_seconds: parseInt(draft.show_answer_seconds, 10) || 2,
            attempts_allowed: parseInt(draft.attempts_allowed, 10),
            pass_score: Math.max(0, Math.min(100, parseInt(draft.pass_score, 10) || 0)),
          };
          for (var pi = 0; pi < selectedClassIds.length; pi++) {
            try {
              await sb.from('classes').update({ vocab_test_preset: presetPayload }).eq('id', selectedClassIds[pi]);
            } catch (e) { /* 일부 실패해도 시험 자체는 저장됨 */ }
          }
        }

        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    async function deleteTest() {
      if (!isEdit) return;
      if (!confirm('"' + props.test.title + '" 시험을 목록에서 숨길까요?\n\n안전 삭제: 응시 결과는 DB에 보관됩니다. 학생들에게는 더 이상 보이지 않습니다.')) return;
      try {
        var u = await sb.from('vocab_tests').update({ is_active: false }).eq('id', props.test.id);
        if (u.error) throw u.error;
        props.onSaved();
      } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
    }

    var filteredStudents = students.filter(function(s){
      if (stuLevel && gradeLvl(s.grade) !== stuLevel) return false;
      if (stuGrade && s.grade !== stuGrade) return false;
      if (studentSearch && (s.name || '').toLowerCase().indexOf(studentSearch.toLowerCase()) < 0) return false;
      return true;
    });
    var visibleStudentIds = filteredStudents.map(function(s){ return s.id; });
    var allVisibleSelected = visibleStudentIds.length > 0 && visibleStudentIds.every(function(id){ return selectedStudentIds.indexOf(id) >= 0; });

    // 입력 도중 실수로 배경 클릭 시 작성 내용이 사라지지 않도록 backdrop 클릭 닫기 비활성화 (X/취소 버튼으로만 닫기)
    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(640px, calc(100% - 32px))' }) },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 14px', fontFamily:'Manrope, sans-serif' } }, isEdit ? '시험 설정 — 배포 대상 · 문제 형식 · 상태' : '새 시험 만들기'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + props.unitIndex + ' · 단어 ' + props.unitWordCount + '개'),

        React.createElement('div', null,
          // 배포 대상 — 클래스 카드 (클릭 시 preset 불러오기 + 배포 대상 등록) + 개별 학생
          React.createElement('div', { style:{ marginBottom:'14px', padding:'12px', background:'#f8fafc', borderRadius:'10px', border:'1px dashed #d6dbde' } },
            React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'6px' }) }, '배포 대상 — 반 (' + selectedClassIds.length + '개)'),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'8px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
              '반을 클릭하면 ① 그 반에 저장된 시험 형식을 폼에 불러오고 ② 이 반에 시험을 배포합니다. 저장 시 현재 형식이 그 반의 기본 양식으로도 저장돼요. ', React.createElement('span', { style:{ color:'#E60012', fontWeight:'700' } }, '●'), ' = 저장된 형식 있음'
            ),
            classes.length === 0
              ? React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif' } }, '등록된 반이 없습니다.')
              : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'6px' } },
                  classes.map(function(c){
                    var on = selectedClassIds.indexOf(c.id) >= 0;
                    var hasPreset = !!(c.vocab_test_preset && Object.keys(c.vocab_test_preset).length > 0);
                    return React.createElement('button', { key:c.id, onClick: function(){ toggleClass(c); }, style:{ position:'relative', background: on ? '#FFEBED' : '#fff', color: '#1A1A1A', border: '1.5px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'8px', padding:'8px 22px 8px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', textAlign:'left', fontFamily:'Manrope, sans-serif' } },
                      React.createElement('div', null, c.class_name || c.name),
                      c.grade && React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', marginTop:'2px', fontWeight:'600' } }, c.grade),
                      hasPreset && React.createElement('span', { style:{ position:'absolute', top:'6px', right:'8px', color:'#E60012', fontSize:'10px', fontWeight:'800' } }, '●')
                    );
                  })
                ),
            // 개별 학생 (반과 별개로 추가 배포 가능) — 초중고·학년·이름 필터 + 3열(반응형) 그리드
            React.createElement('div', { style:Object.assign({}, STYLES.label, { marginTop:'14px', marginBottom:'6px' }) }, '👤 개별 학생 (선택 ' + selectedStudentIds.length + '명 / 검색결과 ' + filteredStudents.length + '명)'),
            React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center', marginBottom:'6px' } },
              [['','전체'],['초','초'],['중','중'],['고','고']].map(function(o){
                var on = stuLevel === o[0];
                return React.createElement('button', { key:o[0]||'all', type:'button', onClick:function(){ setStuLevel(o[0]); setStuGrade(''); }, style:{ background: on ? '#E60012' : '#fff', color: on ? '#fff' : 'rgba(0,0,0,0.62)', border:'1.5px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'999px', padding:'4px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, o[1]);
              }),
              React.createElement('select', { value:stuGrade, onChange:function(e){ setStuGrade(e.target.value); }, style:Object.assign({}, STYLES.input, { width:'auto', minWidth:'92px', padding:'5px 8px', marginBottom:0 }) },
                React.createElement('option', { value:'' }, '학년 전체'),
                (function(){
                  var ORDER = ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
                  var present = ORDER.filter(function(g){ return students.some(function(s){ return s.grade === g; }); });
                  var extras = Array.from(new Set(students.map(function(s){ return s.grade; }).filter(function(g){ return g && ORDER.indexOf(g) < 0; })));
                  var opts = present.concat(extras);
                  if (stuLevel) opts = opts.filter(function(g){ return gradeLvl(g) === stuLevel; });
                  return opts.map(function(g){ return React.createElement('option', { key:g, value:g }, g); });
                })()
              ),
              (stuLevel || stuGrade || studentSearch) && React.createElement('button', { type:'button', onClick:function(){ setStuLevel(''); setStuGrade(''); setStudentSearch(''); }, style:{ background:'transparent', color:'rgba(0,0,0,0.45)', border:'none', fontSize:'11px', fontWeight:'700', cursor:'pointer', textDecoration:'underline', fontFamily:'Manrope, sans-serif' } }, '필터 초기화')
            ),
            React.createElement('div', { style:{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'6px' } },
              React.createElement('input', { type:'text', value:studentSearch, onChange:function(e){ setStudentSearch(e.target.value); }, placeholder:'학생 이름으로 검색', style:Object.assign({}, STYLES.input, { flex:1, marginBottom:0 }) }),
              filteredStudents.length > 0 && React.createElement('button', { type:'button', onClick:function(){
                if (allVisibleSelected) { setSelectedStudentIds(selectedStudentIds.filter(function(id){ return visibleStudentIds.indexOf(id) < 0; })); }
                else { setSelectedStudentIds(Array.from(new Set(selectedStudentIds.concat(visibleStudentIds)))); }
              }, style:{ whiteSpace:'nowrap', background: allVisibleSelected ? '#FFEBED' : '#fff', color:'#E60012', border:'1.5px solid #E60012', borderRadius:'6px', padding:'7px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, allVisibleSelected ? '보이는 ' + filteredStudents.length + '명 해제' : '보이는 ' + filteredStudents.length + '명 선택')
            ),
            React.createElement('div', { style:{ maxHeight:'220px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'6px', padding:'5px', background:'#fff' } },
              filteredStudents.length === 0
                ? React.createElement('div', { style:{ padding:'10px', textAlign:'center', color:'#9ca3af', fontSize:'12px', fontFamily:'Manrope, sans-serif' } }, '조건에 맞는 학생이 없습니다.')
                : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(165px, 1fr))', gap:'4px' } },
                    filteredStudents.map(function(s){
                      var on = selectedStudentIds.indexOf(s.id) >= 0;
                      return React.createElement('div', { key:s.id, onClick:function(){ toggleStudent(s.id); }, title:(s.name || '') + (s.grade ? ' · ' + s.grade : ''), style:{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 7px', cursor:'pointer', borderRadius:'5px', background: on ? '#FFEBED' : '#f8fafc', border:'1px solid ' + (on ? '#E60012' : '#eef0f2') } },
                        React.createElement('div', { style:{ width:'14px', height:'14px', border:'1.5px solid ' + (on ? '#E60012' : '#cbd1d6'), background: on ? '#E60012' : '#fff', borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } }, on && React.createElement('span', { style:{ color:'#fff', fontSize:'9px', fontWeight:'800' } }, '✓')),
                        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, s.name),
                        s.grade && React.createElement('span', { style:{ fontSize:'9px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, s.grade)
                      );
                    })
                  )
            ),
            // 학년으로 배포 — 그 학년 학생 전체에게 (저장 시 student_id로 펼침)
            React.createElement('div', { style:Object.assign({}, STYLES.label, { marginTop:'14px', marginBottom:'6px' }) }, '학년으로 배포 ' + (selectedGrades.length ? '(' + selectedGrades.join(', ') + ' — 해당 학년 학생 전체)' : '(선택 안 함)')),
            React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap' } },
              (function(){
                var ORDER = ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
                var present = ORDER.filter(function(g){ return (students||[]).some(function(s){ return s.grade === g; }); });
                var extras = Array.from(new Set((students||[]).map(function(s){ return s.grade; }).filter(function(g){ return g && ORDER.indexOf(g) < 0; })));
                var opts = present.concat(extras);
                if (opts.length === 0) return React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '활성 학생이 없습니다.');
                return opts.map(function(g){
                  var cnt = (students||[]).filter(function(s){ return s.grade === g; }).length;
                  var on = selectedGrades.indexOf(g) >= 0;
                  return React.createElement('button', { key:g, type:'button', onClick:function(){ setSelectedGrades(function(arr){ return arr.indexOf(g) >= 0 ? arr.filter(function(x){ return x!==g; }) : arr.concat([g]); }); }, style:{ background: on ? '#E60012' : '#fff', color: on ? '#fff' : 'rgba(0,0,0,0.62)', border: on ? '2px solid #E60012' : '1.5px solid #d6dbde', borderRadius:'999px', padding:'5px 11px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, g + ' (' + cnt + ')');
                });
              })()
            )
          ),

          React.createElement('div', { style:{ marginBottom:'12px' } },
            React.createElement('div', { style:STYLES.label }, '시험 이름 *'),
            React.createElement('input', { type:'text', value:draft.title || '', onChange:function(e){ set('title', e.target.value); }, style:STYLES.input })
          ),

          React.createElement('div', { style:Object.assign({}, STYLES.label, { marginTop:'14px', marginBottom:'4px' }) }, '문제 형식 — 학생에게 낼 문제 수'),
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', lineHeight:'1.6', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } },
            '· 객관식 = 단어 보고 뜻 고르기 (또는 반대) — 아래 "출제 방향"으로 선택',
            React.createElement('br'),
            '· 스펠링 채우기 = 뜻 보고 빈칸 채우기 / 뜻 보고 쓰기 = 뜻 보고 단어 전체 쓰기 / 듣고 쓰기 = 발음 듣고 쓰기',
            React.createElement('br'),
            '안 낼 형식은 0으로 두세요. (이 유닛 단어 ', props.unitWordCount, '개 안에서 출제)'
          ),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' } },
            [['multiple_choice_count','객관식'], ['spelling_count','스펠링 채우기'], ['writing_count','뜻 보고 쓰기'], ['listening_count','듣고 쓰기']].map(function(m){
              return React.createElement('div', { key:m[0], style:{ display:'flex', alignItems:'center', gap:'8px' } },
                React.createElement('label', { style:{ flex:1, fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.7)', fontFamily:'Manrope, sans-serif' } }, m[1]),
                React.createElement('input', { type:'number', min:0, max:props.unitWordCount, value:draft[m[0]] || 0, onChange:function(e){ set(m[0], window.B2Utils.stripLeadingZero(e.target.value)); }, style:Object.assign({}, STYLES.input, { width:'70px' }) })
              );
            })
          ),
          React.createElement('div', { style:{ fontSize:'11px', color: totalQ > props.unitWordCount ? '#c82014' : 'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } },
            '총 ' + totalQ + '문제 / UNIT ' + props.unitWordCount + '단어' + (totalQ > props.unitWordCount ? ' — 단어 수보다 많이 출제할 수 없어요' : '')
          ),

          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '객관식 보기 수'),
              React.createElement('select', { value:draft.choices_per_question, onChange:function(e){ set('choices_per_question', e.target.value); }, style:STYLES.input },
                [3,4,5].map(function(n){ return React.createElement('option', { key:n, value:n }, n + '지선다'); })
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '출제 방향'),
              React.createElement('select', { value:draft.question_direction, onChange:function(e){ set('question_direction', e.target.value); }, style:STYLES.input },
                React.createElement('option', { value:'word_to_meaning' }, '단어 → 뜻'),
                React.createElement('option', { value:'meaning_to_word' }, '뜻 → 단어'),
                React.createElement('option', { value:'mixed' }, '섞어서')
              )
            )
          ),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '스펠링 빈칸 비율'),
              React.createElement('select', { value:draft.spelling_blank_ratio, onChange:function(e){ set('spelling_blank_ratio', e.target.value); }, style:STYLES.input },
                React.createElement('option', { value:0.3 }, '30% (Easy)'),
                React.createElement('option', { value:0.5 }, '50% (보통)'),
                React.createElement('option', { value:0.7 }, '70% (어려움)'),
                React.createElement('option', { value:1.0 }, '100% (Hard - 전체)')
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '재응시 횟수'),
              React.createElement('select', { value:draft.attempts_allowed, onChange:function(e){ set('attempts_allowed', e.target.value); }, style:STYLES.input },
                React.createElement('option', { value:1 }, '1회'),
                React.createElement('option', { value:3 }, '3회'),
                React.createElement('option', { value:5 }, '5회'),
                React.createElement('option', { value:-1 }, '무제한')
              )
            )
          ),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '단어당 시간 (초)'),
              React.createElement('input', { type:'number', min:5, max:120, value:draft.seconds_per_question || 30, onChange:function(e){ set('seconds_per_question', window.B2Utils.stripLeadingZero(e.target.value)); }, style:STYLES.input })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '정답 표시 시간 (초)'),
              React.createElement('input', { type:'number', min:0, max:10, value:draft.show_answer_seconds || 2, onChange:function(e){ set('show_answer_seconds', window.B2Utils.stripLeadingZero(e.target.value)); }, style:STYLES.input })
            )
          ),
          totalQ > 0 && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'14px', padding:'8px 10px', background:'#f8fafc', borderRadius:'6px' } },
            '⏱ 예상 시험 시간: 약 ' + (minutes > 0 ? minutes + '분 ' : '') + secs + '초'
          ),

          // 커트라인(합격) 점수 — 0이면 없음
          React.createElement('div', { style:{ marginBottom:'14px' } },
            React.createElement('div', { style:STYLES.label }, '커트라인(합격) 점수 — 0이면 없음'),
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
              React.createElement('input', { type:'number', min:0, max:100, value:draft.pass_score || 0, onChange:function(e){ var v = window.B2Utils.stripLeadingZero(e.target.value); set('pass_score', v === '' ? 0 : Math.max(0, Math.min(100, parseInt(v, 10) || 0))); }, style:Object.assign({}, STYLES.input, { width:'84px' }) }),
              React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, '점 이상이면 합격. 미만이면 학생 결과에 "불합격" 표시 + 재응시 권유. (앱 채점 % 기준)')
            )
          ),

          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '상태'),
              React.createElement('select', { value:draft.status, onChange:function(e){ set('status', e.target.value); }, style:STYLES.input },
                React.createElement('option', { value:'draft' }, '준비중 (학생에게 안 보임)'),
                React.createElement('option', { value:'open' }, '진행중 (응시 가능)'),
                React.createElement('option', { value:'closed' }, '마감')
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '마감일 (선택)'),
              React.createElement('input', { type:'datetime-local', value: draft.due_at ? String(draft.due_at).slice(0,16) : '', onChange:function(e){ set('due_at', e.target.value ? new Date(e.target.value).toISOString() : null); }, style:STYLES.input })
            )
          )
        ),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent: isEdit ? 'space-between' : 'flex-end', marginTop:'18px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
          isEdit && React.createElement('button', { onClick:deleteTest, style:STYLES.btnDanger }, '시험 삭제'),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
            React.createElement('button', { onClick:save, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : (isEdit ? '저장' : '시험 만들기'))
          )
        )
      )
    );
  }

  // ── 시험 응시 결과 모달 (선생님·관리자) ─────────────────
  function VocabTestResultsModal(props) {
    var sb = window.supabase;
    var test = props.test;
    var [attempts, setAttempts] = React.useState([]);
    var [loading, setLoading] = React.useState(true);
    var [selectedAttempt, setSelectedAttempt] = React.useState(null);

    React.useEffect(function(){ load(); }, []);

    async function load() {
      setLoading(true);
      try {
        var aRes = await sb.from('vocab_test_attempts').select('*').eq('test_id', test.id).order('submitted_at', { ascending: false });
        setAttempts((aRes && aRes.data) || []);
      } catch (e) { console.error('응시 결과 로드 실패:', e); }
      setLoading(false);
    }

    // 학생당 최고 점수만 추리기 (RANKING과 동일 정책)
    var bestByStudent = {};
    attempts.forEach(function(a){
      var prev = bestByStudent[a.student_id];
      if (!prev || (a.percentage || 0) > (prev.percentage || 0) || ((a.percentage || 0) === (prev.percentage || 0) && (a.time_taken_seconds || 0) < (prev.time_taken_seconds || 0))) {
        bestByStudent[a.student_id] = a;
      }
    });
    var bests = Object.values(bestByStudent).sort(function(a, b){
      if ((b.percentage || 0) !== (a.percentage || 0)) return (b.percentage || 0) - (a.percentage || 0);
      return (a.time_taken_seconds || 0) - (b.time_taken_seconds || 0);
    });

    // 통계
    var n = bests.length;
    var avg = n > 0 ? Math.round((bests.reduce(function(s, a){ return s + (a.percentage || 0); }, 0) / n) * 10) / 10 : 0;
    var hi = n > 0 ? Math.round(bests[0].percentage || 0) : 0;
    var lo = n > 0 ? Math.round(bests[bests.length-1].percentage || 0) : 0;
    var cut = parseInt(test.pass_score, 10) || 0; // 커트라인(0=없음)
    var passN = cut > 0 ? bests.filter(function(a){ return (a.percentage || 0) >= cut; }).length : null;
    var dist = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 };
    bests.forEach(function(a){
      var p = a.percentage || 0;
      if (p >= 90) dist['90+']++;
      else if (p >= 80) dist['80-89']++;
      else if (p >= 70) dist['70-79']++;
      else if (p >= 60) dist['60-69']++;
      else dist['0-59']++;
    });

    // 자주 틀린 단어 (모든 응시 기준 — 학생 최고 점수 응시만 사용)
    var wordWrongCount = {}; // { word_id: { word, meaning, wrong, total } }
    bests.forEach(function(a){
      var qs = a.questions || [];
      var ans = a.answers || {};
      qs.forEach(function(q, i){
        if (!q.word_id) return;
        if (!wordWrongCount[q.word_id]) wordWrongCount[q.word_id] = { word: q.word, meaning: q.meaning, wrong: 0, total: 0 };
        wordWrongCount[q.word_id].total++;
        var ua = ans[i];
        var ok = (q.mode === 'multiple_choice') ? (ua === q.correct) : (String(ua||'').trim().toLowerCase() === String(q.correct||'').trim().toLowerCase());
        if (!ok) wordWrongCount[q.word_id].wrong++;
      });
    });
    var topWrong = Object.values(wordWrongCount).filter(function(w){ return w.wrong > 0; }).sort(function(a,b){
      var aR = a.wrong / Math.max(1, a.total);
      var bR = b.wrong / Math.max(1, b.total);
      return bR - aR || b.wrong - a.wrong;
    }).slice(0, 10);

    if (selectedAttempt) {
      return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
        React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(640px, calc(100% - 32px))' }), onClick:function(e){ e.stopPropagation(); } },
          React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
          React.createElement('button', { onClick:function(){ setSelectedAttempt(null); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', padding:0, marginBottom:'12px' } }, '← 결과 목록'),
          React.createElement('h2', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:'0 0 6px', fontFamily:'Manrope, sans-serif' } }, (selectedAttempt.student_name || '학생') + ' — ' + Math.round(selectedAttempt.percentage || 0) + '점'),
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } },
            selectedAttempt.score + '/' + selectedAttempt.total + ' 정답 · ' + (selectedAttempt.time_taken_seconds || 0) + '초 소요 · ' + selectedAttempt.attempt_number + '회차 · ' + String(selectedAttempt.submitted_at || '').slice(0,16).replace('T',' ')
          ),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'60vh', overflowY:'auto' } },
            (selectedAttempt.questions || []).map(function(q, i){
              var ua = (selectedAttempt.answers || {})[i];
              var ok = (q.mode === 'multiple_choice') ? (ua === q.correct) : (String(ua||'').trim().toLowerCase() === String(q.correct||'').trim().toLowerCase());
              return React.createElement('div', { key:i, style:{ padding:'10px 14px', background: ok ? '#dcfce7' : '#fff5f5', borderRadius:'8px', borderLeft:'3px solid ' + (ok ? '#16a34a' : '#c82014') } },
                React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
                  React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color: ok ? '#16a34a' : '#c82014' } }, ok ? '✓' : '✗'),
                  React.createElement('div', { style:{ flex:1, minWidth:0 } },
                    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A' } }, q.word + ' — ' + q.meaning),
                    !ok && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginTop:'2px' } }, '내 답: ' + (ua == null ? '(미응답)' : ua) + ' · 정답: ' + q.correct)
                  )
                )
              );
            })
          )
        )
      );
    }

    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(720px, calc(100% - 32px))' }), onClick:function(e){ e.stopPropagation(); } },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px', fontFamily:'Manrope, sans-serif' } }, test.title + ' — 응시 결과'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + test.unit_index),

        loading
          ? React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '불러오는 중...')
          : n === 0
            ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '아직 응시한 학생이 없습니다.')
            : React.createElement('div', null,
                // 통계
                React.createElement('div', { style:Object.assign({}, STYLES.card, { marginBottom:'12px', padding:'14px' }) },
                  React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', textAlign:'center', marginBottom:'12px' } },
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', fontWeight:'700', letterSpacing:'0.04em' } }, '응시'),
                      React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#1A1A1A' } }, n + '명')
                    ),
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', fontWeight:'700', letterSpacing:'0.04em' } }, '평균'),
                      React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color: avg >= 80 ? '#16a34a' : avg >= 60 ? '#c87000' : '#c82014' } }, avg + '점')
                    ),
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', fontWeight:'700', letterSpacing:'0.04em' } }, '최고'),
                      React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#16a34a' } }, hi + '점')
                    ),
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', fontWeight:'700', letterSpacing:'0.04em' } }, '최저'),
                      React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#c82014' } }, lo + '점')
                    )
                  ),
                  cut > 0 && React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:'10px', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } },
                    React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', color:'#1A1A1A' } }, '커트라인 ' + cut + '점'),
                    React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', background:'#dcfce7', color:'#16a34a', borderRadius:'4px', padding:'2px 8px' } }, '합격 ' + passN + '명'),
                    React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', background:'#fff5f5', color:'#c82014', borderRadius:'4px', padding:'2px 8px' } }, '불합격 ' + (n - passN) + '명'),
                    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)' } }, '(' + (n > 0 ? Math.round((passN / n) * 100) : 0) + '% 합격)')
                  ),
                  React.createElement('div', { style:{ borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:'10px' } },
                    React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', marginBottom:'6px' } }, '점수 분포'),
                    [['90+', '#16a34a'], ['80-89', '#65a30d'], ['70-79', '#c87000'], ['60-69', '#dc6803'], ['0-59', '#c82014']].map(function(b){
                      var cnt = dist[b[0]] || 0;
                      var pct = n > 0 ? (cnt / n) * 100 : 0;
                      return React.createElement('div', { key:b[0], style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' } },
                        React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:b[1], minWidth:'48px' } }, b[0]),
                        React.createElement('div', { style:{ flex:1, height:'10px', background:'#f3f4f6', borderRadius:'5px', overflow:'hidden' } },
                          React.createElement('div', { style:{ width:pct+'%', height:'100%', background:b[1], transition:'width 0.3s' } })
                        ),
                        React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.7)', minWidth:'40px', textAlign:'right' } }, cnt + '명')
                      );
                    })
                  )
                ),

                // 자주 틀린 단어
                topWrong.length > 0 && React.createElement('div', { style:Object.assign({}, STYLES.card, { marginBottom:'12px', padding:'14px' }) },
                  React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '자주 틀린 단어'),
                  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
                    topWrong.map(function(w, i){
                      var rate = Math.round((w.wrong / Math.max(1, w.total)) * 100);
                      return React.createElement('div', { key:i, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'#fff5f5', borderRadius:'6px', fontSize:'13px', fontFamily:'Manrope, sans-serif' } },
                        React.createElement('div', { style:{ flex:1, minWidth:0 } },
                          React.createElement('span', { style:{ fontWeight:'700', color:'#1A1A1A' } }, w.word),
                          React.createElement('span', { style:{ color:'rgba(0,0,0,0.55)', marginLeft:'8px', fontSize:'12px' } }, w.meaning)
                        ),
                        React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#c82014', flexShrink:0 } }, w.wrong + '/' + w.total + ' 오답 (' + rate + '%)')
                      );
                    })
                  )
                ),

                // 학생별 결과 (점수순)
                React.createElement('div', { style:Object.assign({}, STYLES.card, { padding:'14px' }) },
                  React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '학생별 결과 (' + n + '명, 최고 점수 기준)'),
                  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'40vh', overflowY:'auto' } },
                    bests.map(function(a, i){
                      var pct = Math.round(a.percentage || 0);
                      var color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#c87000' : '#c82014';
                      var medalBg = i === 0 ? '#fef3c7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fed7aa' : 'transparent';
                      var medal = i < 3 ? (i + 1) + '위' : null;
                      return React.createElement('div', { key:a.id, onClick:function(){ setSelectedAttempt(a); }, style:{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', background:medalBg || '#f8fafc', borderRadius:'6px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
                        React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.6)', minWidth:'30px', textAlign:'center' } }, medal || (i+1) + '위'),
                        React.createElement('div', { style:{ flex:1, minWidth:0 } },
                          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, a.student_name || '(이름 없음)'),
                          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)' } }, (a.time_taken_seconds || 0) + '초 · ' + a.attempt_number + '회차')
                        ),
                        cut > 0 && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', borderRadius:'4px', padding:'2px 6px', flexShrink:0, background: pct >= cut ? '#dcfce7' : '#fff5f5', color: pct >= cut ? '#16a34a' : '#c82014' } }, pct >= cut ? '합격' : '불합격'),
                        React.createElement('div', { style:{ fontSize:'17px', fontWeight:'800', color:color, minWidth:'46px', textAlign:'right' } }, pct + '점'),
                        React.createElement('div', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.3)' } }, '›')
                      );
                    })
                  )
                )
              )
      )
    );
  }

  // ── 5단계 학습 세트 업로드 모달 (6시트 엑셀 파싱) ─────────────────
  // 시트 구조 (이름은 부분 일치로 찾음 — 사용자가 시트명 살짝 바꿔도 동작):
  //   "1단계" 또는 "단어"         → stage1 [{num,word,correct,wrong:[..]}]
  //   "2단계" 또는 "해석"          → stage2 [{num,sentence,correct,wrong:[..]}]
  //   "2_5" 또는 "2.5" 또는 "빈칸" → stage25 [{num,sentence,correct,wrong:[..]}]
  //   "3단계" 또는 "영작"          → stage3 [{num,korean,sentence,answers:[..]}]
  //   "어법"                       → grammar [{num,sentence,options:[..],correct:<숫자>}]
  //   "메타"                       → {title,description}
  function VocabStudySetUploadModal(props) {
    var sb = window.supabase;
    var [file, setFile] = React.useState(null);
    var [parsed, setParsed] = React.useState(null); // 파싱 결과 미리보기
    var [saving, setSaving] = React.useState(false);
    var [parseError, setParseError] = React.useState('');

    function findSheet(wb, keys) {
      for (var i = 0; i < wb.SheetNames.length; i++) {
        var nm = String(wb.SheetNames[i]);
        for (var k = 0; k < keys.length; k++) {
          if (nm.indexOf(keys[k]) >= 0) return wb.Sheets[nm];
        }
      }
      return null;
    }

    function rowsOf(sheet) {
      if (!sheet) return [];
      return window.XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });
    }

    function skipHeader(rows) {
      // 첫 줄이 한글 헤더("번호"/"단어"/"예문"/"항목" 등)면 스킵
      if (!rows.length) return rows;
      var f = String(rows[0][0] || '').trim();
      if (/번호|항목|단어|예문|문장|한국어/.test(f)) return rows.slice(1);
      return rows;
    }

    function parseStage1(sheet) {
      var rows = skipHeader(rowsOf(sheet));
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r[1]) continue;
        var num = r[0] === '' || r[0] == null ? (i+1) : r[0];
        var wrong = [r[3], r[4], r[5], r[6]].map(function(x){ return String(x||'').trim(); }).filter(Boolean);
        out.push({ num: num, word: String(r[1]||'').trim(), correct: String(r[2]||'').trim(), wrong: wrong });
      }
      return out;
    }

    function parseMcq(sheet) {
      // 헤더: 번호, 문장/예문, 정답, 오답1~4
      var rows = skipHeader(rowsOf(sheet));
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r[1]) continue;
        var num = r[0] === '' || r[0] == null ? (i+1) : r[0];
        var wrong = [r[3], r[4], r[5], r[6]].map(function(x){ return String(x||'').trim(); }).filter(Boolean);
        out.push({ num: num, sentence: String(r[1]||'').trim(), correct: String(r[2]||'').trim(), wrong: wrong });
      }
      return out;
    }

    function parseStage3(sheet) {
      // 헤더: 번호, 한국어, 영문(___), 정답들(쉼표)
      var rows = skipHeader(rowsOf(sheet));
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r[1] || !r[2]) continue;
        var num = r[0] === '' || r[0] == null ? (i+1) : r[0];
        var answers = String(r[3]||'').split(/[,，]/).map(function(s){ return s.trim(); }).filter(Boolean);
        out.push({ num: num, korean: String(r[1]||'').trim(), sentence: String(r[2]||'').trim(), answers: answers });
      }
      return out;
    }

    function parseGrammar(sheet) {
      // 헤더: 번호, 예문, 옵션1~5, 정답(숫자)
      var rows = skipHeader(rowsOf(sheet));
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r[1]) continue;
        var num = r[0] === '' || r[0] == null ? (i+1) : r[0];
        var options = [r[2], r[3], r[4], r[5], r[6]].map(function(x){ return String(x||'').trim(); }).filter(Boolean);
        var correct = parseInt(r[7], 10);
        if (isNaN(correct) || correct < 1 || correct > options.length) correct = 1;
        out.push({ num: num, sentence: String(r[1]||'').trim(), options: options, correct: correct });
      }
      return out;
    }

    function parseMeta(sheet) {
      var rows = skipHeader(rowsOf(sheet));
      var meta = { title:'', description:'' };
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (!r || !r[0]) continue;
        var k = String(r[0]||'').trim();
        var v = String(r[1]||'').trim();
        if (/세트명|제목/.test(k)) meta.title = v;
        else if (/설명/.test(k)) meta.description = v;
      }
      return meta;
    }

    async function handleFile(f) {
      setFile(f);
      setParsed(null);
      setParseError('');
      if (!f) return;
      if (!window.XLSX) { setParseError('엑셀 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해 주세요.'); return; }
      try {
        var buf = await f.arrayBuffer();
        var wb = window.XLSX.read(buf, { type:'array' });
        var s1 = findSheet(wb, ['1단계','단어 객']) || wb.Sheets[wb.SheetNames[0]];
        var s2 = findSheet(wb, ['2단계_해석','해석']);
        var s25 = findSheet(wb, ['2_5','2.5','빈칸']);
        var s3 = findSheet(wb, ['3단계','영작']);
        var sg = findSheet(wb, ['어법','문법']);
        var sm = findSheet(wb, ['메타']);
        var p = {
          stage1: parseStage1(s1),
          stage2: parseMcq(s2),
          stage25: parseMcq(s25),
          stage3: parseStage3(s3),
          grammar: parseGrammar(sg),
          meta: parseMeta(sm),
        };
        setParsed(p);
      } catch (e) {
        setParseError('파싱 실패: ' + (e.message || e));
      }
    }

    async function save() {
      if (!parsed) return;
      setSaving(true);
      try {
        // 1) 원본 xlsx 를 storage 에도 보관 — 자료실에서 검색·다운로드 가능하게.
        //    (file 이 있을 때만. 교체 업로드일 때는 새 파일이 있을 때만 새로 올림.)
        var sourcePath = null;
        if (file) {
          try {
            var ext = (file.name.split('.').pop() || 'xlsx').toLowerCase();
            sourcePath = 'materials/study_sets/' + props.listId + '_u' + props.unitIndex + '_' + Date.now() + '.' + ext;
            var up = await sb.storage.from('attachments').upload(sourcePath, file, { cacheControl:'3600', upsert:false });
            if (up.error) { console.warn('원본 파일 업로드 실패:', up.error); sourcePath = null; }
          } catch (e) { console.warn('원본 파일 업로드 예외:', e); sourcePath = null; }
        }

        var row = {
          list_id: props.listId,
          unit_index: props.unitIndex,
          title: (parsed.meta && parsed.meta.title) || null,
          description: (parsed.meta && parsed.meta.description) || null,
          stage1: parsed.stage1,
          stage2: parsed.stage2,
          stage25: parsed.stage25,
          stage3: parsed.stage3,
          grammar: parsed.grammar,
          source_file_name: file ? file.name : null,
          created_by: window.B2Utils.safeUserId(props.user),
          creator_name: (props.user && props.user.name) || null,
          updated_at: new Date().toISOString(),
        };
        var { error } = await sb.from('vocab_study_sets').upsert(row, { onConflict: 'list_id,unit_index' });
        if (error) throw error;

        // 2) 자료실(exams kind='material', material_type='vocab_study_set')에도 자동 등록 — 나중에 검색·다운로드용
        if (sourcePath) {
          try {
            var listName = (props.list && props.list.name) ? props.list.name : '단어장';
            var matTitle = listName + ' · UNIT ' + props.unitIndex + ((parsed.meta && parsed.meta.title) ? (' — ' + parsed.meta.title) : '');
            await sb.from('exams').insert({
              kind: 'material',
              material_type: 'vocab_study_set',
              class_id: null,
              teacher_id: window.B2Utils.safeUserId(props.user),
              teacher_name: (props.user && props.user.name) || null,
              title: matTitle,
              subject: (props.list && props.list.subject) || null,
              school_level: (props.list && props.list.school_level) || null,
              target_grade: (props.list && props.list.grade) || null,
              description: '5단계 학습 세트 원본 (자동 등록)' + (parsed.stage1 ? (' · 단어 ' + parsed.stage1.length + '개') : ''),
              image_paths: [sourcePath],
              answer_paths: [],
              answer_key: {},
              question_count: 0, text_question_count: 0, choices_per_question: 5,
              status: 'open',
            });
          } catch (e) { console.warn('자료실 자동 등록 실패:', e); }
        }

        // 3) 그 유닛에 단어가 비어 있으면 stage1에서 단어+뜻 자동 추출 → vocab_words에도 같이 등록
        var unitSize = props.unitSize || 20;
        var startSort = (props.unitIndex - 1) * unitSize;
        var endSort = startSort + unitSize - 1;
        var unitHasWords = (props.existingWords || []).some(function(w){ return w.sort_order >= startSort && w.sort_order <= endSort; });
        var addedWordCount = 0;
        if (!unitHasWords && parsed.stage1 && parsed.stage1.length) {
          var newWords = parsed.stage1
            .filter(function(s){ return s && s.word && s.correct; })
            .map(function(s, i){ return {
              list_id: props.listId,
              word: String(s.word).trim(),
              meaning: String(s.correct).trim(),
              sort_order: startSort + i,
            }; });
          if (newWords.length > 0) {
            var wRes = await sb.from('vocab_words').insert(newWords);
            if (wRes.error) throw wRes.error;
            addedWordCount = newWords.length;
          }
        }
        var msg = '5단계 학습 세트 저장 완료!';
        if (addedWordCount > 0) msg += '\n단어 ' + addedWordCount + '개 자동 등록.';
        if (sourcePath) msg += '\n원본 파일은 자료실에서 검색해서 찾을 수 있어요.';
        alert(msg);
        props.onSaved();
      } catch (e) {
        alert('저장 실패: ' + (e.message || e));
      }
      setSaving(false);
    }

    var existing = props.existingStudy;

    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(640px, calc(100% - 32px))' }) },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 6px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + props.unitIndex + ' — 5단계 학습 세트 ' + (existing ? '교체' : '업로드')),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } },
          '엑셀 파일 1개 (6시트: 1단계_단어 / 2단계_해석 / 2_5단계_빈칸 / 3단계_영작 / 어법 / 메타). 형식이 맞으면 자동 파싱돼서 미리보기 숫자가 보입니다.'
        ),

        React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('input', { type:'file', accept:'.xlsx,.xls', onChange:function(e){ handleFile(e.target.files[0]); }, style:{ fontSize:'13px', fontFamily:'Manrope, sans-serif' } })
        ),

        parseError && React.createElement('div', { style:{ background:'#FEF2F2', color:'#991B1B', padding:'10px 12px', borderRadius:'6px', fontSize:'12px', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, parseError),

        parsed && React.createElement('div', { style:{ background:'#F8FAFC', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px 14px', fontSize:'12px', fontFamily:'Manrope, sans-serif', marginBottom:'14px', lineHeight:'1.8' } },
          React.createElement('div', { style:{ fontWeight:'800', color:'#1A1A1A', marginBottom:'6px' } }, '미리보기'),
          React.createElement('div', null, '· 세트명: ', React.createElement('strong', null, (parsed.meta && parsed.meta.title) || '(메타 없음)')),
          React.createElement('div', null, '· 1단계 단어 객관식: ', React.createElement('strong', null, parsed.stage1.length), '문항'),
          React.createElement('div', null, '· 2단계 예문 해석: ', React.createElement('strong', null, parsed.stage2.length), '문항'),
          React.createElement('div', null, '· 2.5단계 빈칸 객관식: ', React.createElement('strong', null, parsed.stage25.length), '문항'),
          React.createElement('div', null, '· 3단계 영작 빈칸: ', React.createElement('strong', null, parsed.stage3.length), '문항'),
          React.createElement('div', null, '· 어법 객관식: ', React.createElement('strong', null, parsed.grammar.length), '문항')
        ),

        existing && React.createElement('div', { style:{ background:'#FEF3C7', color:'#92400E', padding:'10px 12px', borderRadius:'6px', fontSize:'12px', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } }, '이 유닛에 이미 학습 세트가 있습니다. 저장하면 덮어쓰입니다.'),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          React.createElement('button', { onClick:save, disabled:!parsed || saving, style:Object.assign({}, STYLES.btnPrimary, (!parsed || saving) ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : '저장')
        )
      )
    );
  }

  // ── 5단계 학습 세트 미리보기 모달 ─────────────────
  function VocabStudySetViewModal(props) {
    var s = props.study;
    if (!s) return null;
    function section(title, count, sample) {
      return React.createElement('div', { style:{ marginBottom:'12px', padding:'10px 12px', background:'#F8FAFC', border:'1px solid #e5e7eb', borderRadius:'8px' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#1A1A1A', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, title + ' — ' + count + '문항'),
        sample && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-wrap', overflow:'hidden', textOverflow:'ellipsis', maxHeight:'60px' } }, sample)
      );
    }
    function firstStage1(arr){ if (!arr || !arr.length) return ''; var x = arr[0]; return (x.num||'1') + '. ' + (x.word||'') + ' → ' + (x.correct||''); }
    function firstMcq(arr){ if (!arr || !arr.length) return ''; var x = arr[0]; return (x.num||'') + '. ' + (x.sentence||'').slice(0,80); }
    function firstStage3(arr){ if (!arr || !arr.length) return ''; var x = arr[0]; return (x.num||'') + '. ' + (x.korean||'').slice(0,60); }
    function firstGrammar(arr){ if (!arr || !arr.length) return ''; var x = arr[0]; return (x.num||'') + '. ' + (x.sentence||'').slice(0,80); }
    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(640px, calc(100% - 32px))' }), onClick:function(e){ e.stopPropagation(); } },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + props.unitIndex + ' — 5단계 학습 세트'),
        s.title && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, s.title),
        section('1단계 단어 객관식', (s.stage1||[]).length, firstStage1(s.stage1)),
        section('2단계 예문 해석', (s.stage2||[]).length, firstMcq(s.stage2)),
        section('2.5단계 빈칸 객관식', (s.stage25||[]).length, firstMcq(s.stage25)),
        section('3단계 영작 빈칸', (s.stage3||[]).length, firstStage3(s.stage3)),
        section('어법 객관식', (s.grammar||[]).length, firstGrammar(s.grammar)),
        s.source_file_name && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'8px' } }, '원본 파일: ' + s.source_file_name)
      )
    );
  }

  // ── 연습/시험 보내기 모달 (vocab_assignments) ──────────────────────
  // 한 팝업에서: 대상(초중고/학년/클래스/개별 학생) + 종류(연습/시험) + 어떤 단계(체크박스) + (시험만) 옵션
  function VocabAssignmentModal(props) {
    var sb = window.supabase;
    var [mode, setMode] = React.useState('practice'); // 'practice' | 'test'
    // 연습과 시험은 체크박스 상태를 따로 기억 — 모드 바꿔도 안 흔들림
    // 기본값: 연습 = 1단계만, 시험 = 5단계 다 (보통 시험은 전체 평가하니까)
    var [stagesByMode, setStagesByMode] = React.useState({
      practice: { '1': true,  '2': false, '25': false, '3': false, 'grammar': false },
      test:     { '1': true,  '2': true,  '25': true,  '3': true,  'grammar': true  },
    });
    var stages = stagesByMode[mode];
    // 대상
    var [targetLevel, setTargetLevel] = React.useState('');
    var [targetGrade, setTargetGrade] = React.useState('');
    var [targetClassId, setTargetClassId] = React.useState('');
    var [individualIds, setIndividualIds] = React.useState([]);
    var [studentSearch, setStudentSearch] = React.useState('');
    // 시험 옵션
    var [title, setTitle] = React.useState('UNIT ' + props.unitIndex + ' 시험');
    var [dueAt, setDueAt] = React.useState('');
    var [passScore, setPassScore] = React.useState('80');
    var [attempts, setAttempts] = React.useState('1'); // '-1' = 무제한
    // 자료
    var [classes, setClasses] = React.useState([]);
    var [students, setStudents] = React.useState([]);
    var [saving, setSaving] = React.useState(false);

    React.useEffect(function(){
      (async function(){
        try {
          var c = await sb.from('classes').select('id, name, grade, subject').order('name');
          setClasses((c && c.data) || []);
          var s = await sb.from('students').select('id, name, grade, school').eq('is_active', true).order('name');
          setStudents((s && s.data) || []);
        } catch (e) { console.error('대상 로드 실패:', e); }
      })();
    }, []);

    var studyData = props.studyData || {};
    var stageInfo = [
      { key: '1',       label: '1단계 단어 객관식', count: (studyData.stage1 || []).length },
      { key: '2',       label: '2단계 예문 해석',   count: (studyData.stage2 || []).length },
      { key: '25',      label: '2.5단계 빈칸',      count: (studyData.stage25 || []).length },
      { key: '3',       label: '3단계 영작',        count: (studyData.stage3 || []).length },
      { key: 'grammar', label: '어법',              count: (studyData.grammar || []).length },
    ];

    function toggleStage(k) {
      setStagesByMode(function(p){
        var o = Object.assign({}, p);
        o[mode] = Object.assign({}, p[mode]);
        o[mode][k] = !o[mode][k];
        return o;
      });
    }
    function toggleStudent(id) {
      setIndividualIds(function(p){ return p.indexOf(id) >= 0 ? p.filter(function(x){ return x !== id; }) : p.concat([id]); });
    }
    // 학생 필터: 학년 → grade 매칭, 초중고는 grade prefix(초·중·고)로 매칭
    function levelMatch(s) {
      if (!targetLevel) return true;
      var g = String(s.grade || '');
      if (targetLevel === '초') return g.indexOf('초') === 0 || /^[1-6]$/.test(g);
      if (targetLevel === '중') return g.indexOf('중') === 0;
      if (targetLevel === '고') return g.indexOf('고') === 0;
      return true;
    }
    var filteredStudents = students.filter(function(s){
      if (!levelMatch(s)) return false;
      if (targetGrade && String(s.grade) !== String(targetGrade)) return false;
      if (studentSearch) { var q = studentSearch.toLowerCase(); if (String(s.name||'').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });

    async function save() {
      var stagesArr = Object.keys(stages).filter(function(k){ return stages[k]; });
      if (stagesArr.length === 0) { alert('단계를 1개 이상 체크해주세요.'); return; }
      // 단계 데이터 검사 — 체크된 단계 중 데이터 없는 게 있으면 경고
      var noData = stagesArr.filter(function(k){ var info = stageInfo.find(function(i){ return i.key === k; }); return !info || info.count === 0; });
      if (noData.length > 0) { alert('선택한 단계 중 데이터가 없는 게 있어요. (5단계 학습 세트를 먼저 업로드해주세요)'); return; }
      var hasTarget = !!targetClassId || !!targetLevel || !!targetGrade || individualIds.length > 0;
      if (!hasTarget) { alert('대상을 1명 이상 지정해주세요 (반·학년·개별 학생 중 하나).'); return; }
      if (mode === 'test' && !title.trim()) { alert('시험 제목을 입력해주세요.'); return; }

      setSaving(true);
      try {
        var row = {
          list_id: props.listId,
          unit_index: props.unitIndex,
          mode: mode,
          stages: stagesArr,
          target_class_id: targetClassId || null,
          target_school_level: targetLevel || null,
          target_grade: targetGrade || null,
          title: mode === 'test' ? title.trim() : null,
          due_at: (mode === 'test' && dueAt) ? new Date(dueAt).toISOString() : null,
          pass_score: mode === 'test' ? (parseInt(passScore, 10) || 0) : 0,
          attempts_allowed: mode === 'test' ? (parseInt(attempts, 10) || 1) : 999999, // 연습은 사실상 무제한
          status: 'open',
          created_by: window.B2Utils.safeUserId(props.user),
          creator_name: (props.user && props.user.name) || null,
        };
        var ins = await sb.from('vocab_assignments').insert(row).select('id').single();
        if (ins.error) throw ins.error;
        if (individualIds.length > 0) {
          var rows = individualIds.map(function(sid){ return { assignment_id: ins.data.id, student_id: sid }; });
          var sIns = await sb.from('vocab_assignment_students').insert(rows);
          if (sIns.error) throw sIns.error;
        }
        alert((mode === 'test' ? '시험' : '연습') + '이(가) 학생에게 보내졌어요.');
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    var inputStyleS = Object.assign({}, STYLES.input, { padding:'7px 10px', fontSize:'13px' });
    var sectionLabel = { fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'8px', letterSpacing:'0.04em', fontFamily:'Manrope, sans-serif' };

    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(580px, calc(100% - 32px))' }) },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px', fontFamily:'Manrope, sans-serif' } }, '연습/시험 보내기'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } }, (props.list && props.list.name ? props.list.name + ' · ' : '') + 'UNIT ' + props.unitIndex + (studyData.title ? (' — ' + studyData.title) : '')),

        // 1) 종류
        React.createElement('div', { style:{ marginBottom:'16px' } },
          React.createElement('div', { style: sectionLabel }, '1. 종류'),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            [['practice','연습','점수 기록 안 함, 반복 가능'], ['test','시험','점수 기록, 마감일까지 응시']].map(function(o){
              var on = mode === o[0];
              return React.createElement('button', { key:o[0], onClick:function(){ setMode(o[0]); }, style:{ flex:1, background: on ? '#FFEBED' : '#fff', color: on ? '#E60012' : '#374151', border:'1.5px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'8px', padding:'10px 12px', cursor:'pointer', fontFamily:'Manrope, sans-serif', textAlign:'center' } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'2px' } }, o[1]),
                React.createElement('div', { style:{ fontSize:'10px', color: on ? '#E60012' : 'rgba(0,0,0,0.55)' } }, o[2])
              );
            })
          )
        ),

        // 2) 단계 체크
        React.createElement('div', { style:{ marginBottom:'16px' } },
          React.createElement('div', { style: sectionLabel }, '2. 어떤 단계로 (1개 이상)'),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
            stageInfo.map(function(si){
              var disabled = si.count === 0;
              var checked = !disabled && !!stages[si.key];
              return React.createElement('label', { key:si.key, style:{ display:'flex', alignItems:'center', gap:'10px', cursor: disabled ? 'not-allowed' : 'pointer', padding:'8px 12px', background: checked ? '#ecfdf5' : '#fff', border:'1px solid ' + (checked ? '#10b981' : '#e5e7eb'), borderRadius:'6px', opacity: disabled ? 0.5 : 1, fontFamily:'Manrope, sans-serif' } },
                React.createElement('input', { type:'checkbox', checked: checked, disabled: disabled, onChange:function(){ if (!disabled) toggleStage(si.key); }, style:{ width:'16px', height:'16px', cursor: disabled ? 'not-allowed' : 'pointer', accentColor:'#10b981' } }),
                React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', flex:1, color: disabled ? '#9ca3af' : '#1A1A1A' } }, si.label),
                React.createElement('span', { style:{ fontSize:'11px', color: disabled ? '#ef4444' : '#6b7280' } }, disabled ? '데이터 없음' : (si.count + '문항'))
              );
            })
          )
        ),

        // 3) 대상
        React.createElement('div', { style:{ marginBottom:'16px' } },
          React.createElement('div', { style: sectionLabel }, '3. 누구에게 (반·학년 또는 개별 학생)'),
          // 반 / 학년 / 초중고
          React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' } },
            React.createElement('select', { value: targetLevel, onChange:function(e){ setTargetLevel(e.target.value); setTargetGrade(''); }, style:Object.assign({}, inputStyleS, { flex:'1', minWidth:'80px' }) },
              React.createElement('option', { value:'' }, '초중고 전체'),
              ['초','중','고'].map(function(L){ return React.createElement('option', { key:L, value:L }, L); })
            ),
            React.createElement('select', { value: targetGrade, onChange:function(e){ setTargetGrade(e.target.value); }, style:Object.assign({}, inputStyleS, { flex:'1', minWidth:'80px' }) },
              React.createElement('option', { value:'' }, '학년 전체'),
              (targetLevel === '초' ? ['1','2','3','4','5','6'] : ['1','2','3']).map(function(g){ return React.createElement('option', { key:g, value:g }, g + '학년'); })
            ),
            React.createElement('select', { value: targetClassId, onChange:function(e){ setTargetClassId(e.target.value); }, style:Object.assign({}, inputStyleS, { flex:'1.4', minWidth:'120px' }) },
              React.createElement('option', { value:'' }, '클래스 (선택)'),
              classes.map(function(c){ return React.createElement('option', { key:c.id, value:c.id }, c.name + (c.grade ? (' — ' + c.grade) : '')); })
            )
          ),
          // 개별 학생 추가 — 리스트 항상 보임, 체크박스로 선택
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'4px', fontFamily:'Manrope, sans-serif', display:'flex', justifyContent:'space-between', alignItems:'center' } },
            React.createElement('span', null, '개별 학생 직접 지정 (선택)' + (individualIds.length > 0 ? ' — ' + individualIds.length + '명 선택' : '')),
            filteredStudents.length > 0 && React.createElement('button', { onClick: function(){
              var allFilteredPicked = filteredStudents.every(function(s){ return individualIds.indexOf(s.id) >= 0; });
              if (allFilteredPicked) setIndividualIds(individualIds.filter(function(id){ return !filteredStudents.find(function(s){ return s.id === id; }); }));
              else setIndividualIds(individualIds.concat(filteredStudents.map(function(s){ return s.id; }).filter(function(id){ return individualIds.indexOf(id) < 0; })));
            }, style:{ background:'transparent', color:'#E60012', border:'none', cursor:'pointer', fontSize:'11px', fontWeight:'700' } }, filteredStudents.every(function(s){ return individualIds.indexOf(s.id) >= 0; }) ? '전체 해제' : '보이는 학생 전체 선택')
          ),
          React.createElement('input', { type:'text', value: studentSearch, onChange:function(e){ setStudentSearch(e.target.value); }, placeholder:'학생 이름 검색 (초중고·학년으로도 자동 필터됨)', style:Object.assign({}, inputStyleS, { width:'100%', marginBottom:'6px' }) }),
          React.createElement('div', { style:{ maxHeight:'200px', overflowY:'auto', border:'1px solid #e5e7eb', borderRadius:'6px', marginBottom:'6px' } },
            filteredStudents.length === 0
              ? React.createElement('div', { style:{ padding:'12px', textAlign:'center', color:'#9ca3af', fontSize:'12px' } }, '보이는 학생이 없습니다')
              : filteredStudents.map(function(s){
                  var picked = individualIds.indexOf(s.id) >= 0;
                  return React.createElement('label', { key:s.id, style:{ padding:'7px 10px', cursor:'pointer', fontSize:'12px', borderBottom:'1px solid #f3f4f6', background: picked ? '#FFEBED' : '#fff', color: picked ? '#E60012' : '#1A1A1A', fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'8px' } },
                    React.createElement('input', { type:'checkbox', checked: picked, onChange:function(){ toggleStudent(s.id); }, style:{ width:'14px', height:'14px', cursor:'pointer', accentColor:'#E60012' } }),
                    React.createElement('span', { style:{ flex:1 } }, s.name),
                    React.createElement('span', { style:{ fontSize:'10px', color: picked ? '#E60012' : 'rgba(0,0,0,0.4)' } }, s.grade || '')
                  );
                })
          )
        ),

        // 4) 시험 옵션 (mode === 'test')
        mode === 'test' && React.createElement('div', { style:{ marginBottom:'16px', background:'#fef3c7', border:'1px solid #fbbf24', borderRadius:'8px', padding:'12px' } },
          React.createElement('div', { style: Object.assign({}, sectionLabel, { color:'#92400e', marginBottom:'10px' }) }, '4. 시험 옵션'),
          React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '시험 제목'),
          React.createElement('input', { type:'text', value: title, onChange:function(e){ setTitle(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%', marginBottom:'8px' }) }),
          React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
            React.createElement('div', { style:{ flex:1, minWidth:'130px' } },
              React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '마감일 (선택)'),
              React.createElement('input', { type:'datetime-local', value: dueAt, onChange:function(e){ setDueAt(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%' }) })
            ),
            React.createElement('div', { style:{ flex:1, minWidth:'90px' } },
              React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '커트라인 (%)'),
              React.createElement('input', { type:'number', min:'0', max:'100', value: passScore, onChange:function(e){ setPassScore(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%' }) })
            ),
            React.createElement('div', { style:{ flex:1, minWidth:'100px' } },
              React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '재응시 횟수'),
              React.createElement('select', { value: attempts, onChange:function(e){ setAttempts(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%' }) },
                React.createElement('option', { value:'1' }, '1회'),
                React.createElement('option', { value:'2' }, '2회'),
                React.createElement('option', { value:'3' }, '3회'),
                React.createElement('option', { value:'-1' }, '무제한')
              )
            )
          )
        ),

        // 액션
        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          React.createElement('button', { onClick:save, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '보내는 중...' : '보내기')
        )
      )
    );
  }

  // 전역 노출
  window.VocabManager = VocabManager;

})();
