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
          : React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' } },
              lists.map(function(L){
                return React.createElement('div', { key:L.id, style:Object.assign({}, STYLES.card, { cursor:'pointer', transition:'all 0.15s' }), onClick:function(){ setSelectedListId(L.id); } },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px', marginBottom:'8px' } },
                    React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', flex:1 } }, L.name),
                    React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' } },
                      React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'6px', padding:'2px 8px', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, L._wordCount + '단어'),
                      L._wordCount > 0 && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'600', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, '유닛 ' + Math.ceil(L._wordCount / (L.unit_size || 20)) + '개 (' + (L.unit_size || 20) + '/유닛)')
                    )
                  ),
                  React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' } },
                    L.subject && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, L.subject),
                    L.grade && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, '· ' + L.grade)
                  ),
                  L.description && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', marginBottom:'10px', lineHeight:'1.5', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' } }, L.description),
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px', paddingTop:'10px', borderTop:'1px solid rgba(0,0,0,0.06)' } },
                    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, (L.creator_name || '알 수 없음') + ' · ' + String(L.created_at || '').slice(0,10)),
                    React.createElement('div', { style:{ display:'flex', gap:'6px' } },
                      React.createElement('button', { onClick:function(e){ e.stopPropagation(); setEditingList(L); }, style:Object.assign({}, STYLES.btnGhost, { padding:'4px 10px', fontSize:'11px' }) }, '편집'),
                      React.createElement('button', { onClick:function(e){ e.stopPropagation(); deleteList(L); }, style:Object.assign({}, STYLES.btnDanger, { padding:'4px 10px', fontSize:'11px' }) }, '삭제')
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
    var initial = props.list || { name:'', description:'', subject:'', grade:'', unit_size: 20 };
    var [draft, setDraft] = React.useState(initial);
    var [saving, setSaving] = React.useState(false);

    function set(k, v) { setDraft(function(d){ var n = Object.assign({}, d); n[k] = v; return n; }); }

    async function save() {
      if (!draft.name || !draft.name.trim()) { alert('단어장 이름을 입력해 주세요.'); return; }
      var unitSize = parseInt(draft.unit_size, 10);
      if (isNaN(unitSize) || unitSize < 1 || unitSize > 200) { alert('유닛 사이즈는 1~200 사이로 입력해 주세요.'); return; }
      setSaving(true);
      try {
        if (props.list && props.list.id) {
          // 편집
          var { error } = await sb.from('vocab_lists').update({
            name: draft.name.trim(),
            description: draft.description || null,
            subject: draft.subject || null,
            grade: draft.grade || null,
            unit_size: unitSize,
            updated_at: new Date().toISOString(),
          }).eq('id', props.list.id);
          if (error) throw error;
        } else {
          // 새로 만들기
          var creator = props.user || {};
          var { error: e2 } = await sb.from('vocab_lists').insert({
            name: draft.name.trim(),
            description: draft.description || null,
            subject: draft.subject || null,
            grade: draft.grade || null,
            unit_size: unitSize,
            created_by: creator.id || null,
            creator_name: creator.name || null,
          });
          if (e2) throw e2;
        }
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:STYLES.modalCard, onClick:function(e){ e.stopPropagation(); } },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 18px', fontFamily:'Manrope, sans-serif' } }, props.list ? '단어장 편집' : '새 단어장 만들기'),

        React.createElement('div', { style:{ marginBottom:'12px' } },
          React.createElement('div', { style:STYLES.label }, '이름 *'),
          React.createElement('input', { type:'text', value:draft.name||'', onChange:function(e){ set('name', e.target.value); }, placeholder:'예: 중2 5월 단어장', style:STYLES.input })
        ),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'12px' } },
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '과목'),
            React.createElement('input', { type:'text', value:draft.subject||'', onChange:function(e){ set('subject', e.target.value); }, placeholder:'영어', style:STYLES.input })
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '학년'),
            React.createElement('input', { type:'text', value:draft.grade||'', onChange:function(e){ set('grade', e.target.value); }, placeholder:'중2', style:STYLES.input })
          ),
          React.createElement('div', null,
            React.createElement('div', { style:STYLES.label }, '유닛 단위'),
            React.createElement('input', { type:'number', min:1, max:200, value:draft.unit_size, onChange:function(e){ set('unit_size', e.target.value); }, placeholder:'20', style:STYLES.input })
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
    var [autoFilling, setAutoFilling] = React.useState(false);
    var [autoFillProgress, setAutoFillProgress] = React.useState({ current: 0, total: 0 });
    var isMobile = window.B2Utils.useIsMobile();

    // 무료 사전 API로 단어 1개 품사 조회
    async function fetchPartOfSpeech(word) {
      try {
        var res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
        if (!res.ok) return null;
        var data = await res.json();
        if (Array.isArray(data) && data[0] && data[0].meanings && data[0].meanings[0]) {
          return data[0].meanings[0].partOfSpeech || null;
        }
      } catch (e) {}
      return null;
    }

    // 빈 품사를 자동 채우기 (5개씩 병렬, Free Dictionary API)
    async function autoFillPartOfSpeech() {
      var emptyWords = words.filter(function(w){ return !w.part_of_speech || !String(w.part_of_speech).trim(); });
      if (emptyWords.length === 0) { alert('이미 모든 단어에 품사가 있습니다.'); return; }
      var msg = emptyWords.length + '개 단어에 품사를 자동으로 채울까요?\n무료 사전 API(영어 단어만)로 조회합니다. 단어 수에 따라 몇 초~몇 분 걸릴 수 있어요.';
      if (!confirm(msg)) return;

      setAutoFilling(true);
      setAutoFillProgress({ current: 0, total: emptyWords.length });
      var success = 0;
      var failed = 0;
      var chunkSize = 5;
      try {
        for (var i = 0; i < emptyWords.length; i += chunkSize) {
          var chunk = emptyWords.slice(i, i + chunkSize);
          var results = await Promise.all(chunk.map(function(w){
            return fetchPartOfSpeech(w.word).then(function(pos){ return { word: w, pos: pos }; });
          }));
          for (var k = 0; k < results.length; k++) {
            var r = results[k];
            if (r.pos) {
              try {
                await sb.from('vocab_words').update({ part_of_speech: r.pos }).eq('id', r.word.id);
                success++;
              } catch (e) { failed++; }
            } else {
              failed++;
            }
          }
          setAutoFillProgress({ current: Math.min(i + chunkSize, emptyWords.length), total: emptyWords.length });
        }
        alert(success + '개 채움, ' + failed + '개 실패 (영단어 아니거나 사전에 없는 경우).');
      } catch (e) { alert('자동 채우기 실패: ' + (e.message || e)); }
      setAutoFilling(false);
      load();
    }

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
      } catch (e) { console.error('단어장 상세 로드 실패:', e); }
      setLoading(false);
    }

    async function deleteWord(word) {
      if (!confirm('"' + word.word + '"을(를) 삭제할까요?')) return;
      var { error } = await sb.from('vocab_words').delete().eq('id', word.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      load();
    }

    if (loading) return React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '불러오는 중...');
    if (!list) return React.createElement('div', { style:{ padding:'40px', textAlign:'center', color:'#9ca3af' } }, '단어장을 찾을 수 없습니다.');

    var unitSize = list.unit_size || 20;
    var unitCount = Math.ceil(words.length / unitSize);
    // 유닛별 단어 그룹화
    var unitsArray = [];
    for (var u = 1; u <= unitCount; u++) {
      var unitWords = words.slice((u-1) * unitSize, u * unitSize);
      var unitTests = tests.filter(function(t){ return t.unit_index === u; });
      unitsArray.push({ unit_index: u, words: unitWords, tests: unitTests });
    }

    return React.createElement('div', null,
      // 헤더 (뒤로가기 + 단어장 정보)
      React.createElement('button', { onClick:props.onBack, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', marginBottom:'12px', padding:0 } }, '← 단어장 목록'),
      React.createElement('div', { style:Object.assign({}, STYLES.card, { marginBottom:'14px' }) },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, list.name),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'4px' } },
              [list.subject, list.grade, words.length + '단어', words.length > 0 ? '유닛 ' + unitCount + '개 (' + unitSize + '/유닛)' : null].filter(Boolean).join(' · ')
            )
          ),
          activeTab === 'words' && React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
            words.length > 0 && React.createElement('button', { onClick: autoFillPartOfSpeech, disabled: autoFilling, title:'영어 사전에서 빈 품사를 자동 조회', style: Object.assign({}, STYLES.btnGhost, autoFilling ? { background:'#f3f4f6', cursor:'not-allowed' } : null) },
              autoFilling ? ('처리 중 ' + autoFillProgress.current + '/' + autoFillProgress.total) : '🔄 품사 자동 채우기'
            ),
            React.createElement('button', { onClick:function(){ setShowImport(true); }, style:STYLES.btnPrimary }, '+ 단어 추가')
          )
        )
      ),

      // 탭
      React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'14px', borderBottom:'1px solid rgba(0,0,0,0.08)' } },
        [['words','단어 (' + words.length + ')'], ['tests','시험 (' + tests.length + ')']].map(function(t){
          return React.createElement('button', { key:t[0], onClick:function(){ setActiveTab(t[0]); }, style:{ background:'none', border:'none', padding:'10px 18px', fontSize:'14px', fontWeight:'700', cursor:'pointer', color: activeTab===t[0] ? '#E60012' : 'rgba(0,0,0,0.55)', borderBottom: activeTab===t[0] ? '2px solid #E60012' : '2px solid transparent', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, t[1]);
        })
      ),

      // 단어 탭
      activeTab === 'words' && (
        !words.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '아직 단어가 없습니다. "+ 단어 추가" 버튼으로 엑셀 업로드 또는 붙여넣기로 한 번에 등록할 수 있어요.')
          : React.createElement('div', { style:STYLES.card },
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr 70px' : '40px 1fr 1fr 100px 1.5fr 100px', gap:'8px', padding:'8px 4px', borderBottom:'2px solid #1A1A1A', fontSize:'11px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } },
                !isMobile && React.createElement('div', null, '#'),
                React.createElement('div', null, '단어'),
                React.createElement('div', null, '뜻'),
                !isMobile && React.createElement('div', null, '품사'),
                !isMobile && React.createElement('div', null, '예문'),
                React.createElement('div', { style:{ textAlign:'right' } }, '관리')
              ),
              words.map(function(w, i){
                var thisUnit = Math.floor(i / unitSize) + 1;
                var isUnitStart = i % unitSize === 0;
                return React.createElement(React.Fragment, { key:w.id },
                  isUnitStart && React.createElement('div', { style:{ gridColumn:'1 / -1', padding:'10px 4px 4px', fontSize:'11px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em', borderTop: i > 0 ? '1px dashed rgba(0,0,0,0.1)' : 'none', marginTop: i > 0 ? '6px' : 0 } }, '── 유닛 ' + thisUnit + ' ──'),
                  React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr 70px' : '40px 1fr 1fr 100px 1.5fr 100px', gap:'8px', padding:'10px 4px', borderBottom:'1px solid rgba(0,0,0,0.06)', fontSize:'13px', fontFamily:'Manrope, sans-serif', alignItems:'center' } },
                    !isMobile && React.createElement('div', { style:{ color:'rgba(0,0,0,0.4)', fontSize:'12px' } }, (i+1)),
                    React.createElement('div', { style:{ fontWeight:'700', color:'#1A1A1A', overflow:'hidden', textOverflow:'ellipsis' } }, w.word),
                    React.createElement('div', { style:{ color:'rgba(0,0,0,0.75)', overflow:'hidden', textOverflow:'ellipsis' } }, w.meaning),
                    !isMobile && React.createElement('div', { style:{ color:'rgba(0,0,0,0.45)', fontSize:'12px' } }, window.B2Utils.localizePartOfSpeech(w.part_of_speech) || '-'),
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

      // 시험 탭
      activeTab === 'tests' && (
        !words.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '먼저 단어를 추가해야 시험을 만들 수 있어요.')
          : React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap:'12px' } },
              unitsArray.map(function(unit){
                return React.createElement('div', { key:unit.unit_index, style:STYLES.card },
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
                    React.createElement('div', null,
                      React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, '유닛 ' + unit.unit_index),
                      React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } },
                        unit.words.length + '단어 · ' + (unit.words[0] && unit.words[0].word) + (unit.words.length > 1 ? ' ~ ' + unit.words[unit.words.length-1].word : '')
                      )
                    ),
                    React.createElement('button', { onClick:function(){ setShowTestCreate(unit.unit_index); }, style:Object.assign({}, STYLES.btnPrimary, { fontSize:'12px', padding:'7px 12px' }) }, '+ 시험')
                  ),
                  unit.tests.length === 0
                    ? React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', padding:'12px 0', textAlign:'center', fontFamily:'Manrope, sans-serif', borderTop:'1px solid rgba(0,0,0,0.06)' } }, '아직 만든 시험이 없습니다.')
                    : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', borderTop:'1px solid rgba(0,0,0,0.06)', paddingTop:'10px' } },
                        unit.tests.map(function(t){
                          var modes = [];
                          if (t.multiple_choice_count) modes.push('객관식 ' + t.multiple_choice_count);
                          if (t.spelling_count) modes.push('스펠링 ' + t.spelling_count);
                          if (t.writing_count) modes.push('쓰기 ' + t.writing_count);
                          if (t.listening_count) modes.push('듣기 ' + t.listening_count);
                          var statusBg = t.status === 'open' ? '#d4e9e2' : t.status === 'closed' ? '#f3f4f6' : '#fef3c7';
                          var statusColor = t.status === 'open' ? '#006241' : t.status === 'closed' ? '#6b7280' : '#92400e';
                          var statusLabel = t.status === 'open' ? '진행중' : t.status === 'closed' ? '마감' : '준비중';
                          return React.createElement('div', { key:t.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#f8fafc', borderRadius:'8px' } },
                            React.createElement('div', { style:{ flex:1, minWidth:0 } },
                              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, t.title),
                              React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, modes.join(' · ') || '문제 없음')
                            ),
                            React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:statusBg, color:statusColor, borderRadius:'4px', padding:'2px 6px', fontFamily:'Manrope, sans-serif', flexShrink:0, marginLeft:'8px' } }, statusLabel),
                            React.createElement('button', { onClick:function(){ setEditingTest(t); }, style:Object.assign({}, STYLES.btnGhost, { padding:'3px 8px', fontSize:'11px', marginLeft:'6px' }) }, '편집')
                          );
                        })
                      )
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
      })
    );
  }

  // ── 단어 추가 모달 (엑셀 업로드 + 붙여넣기 + 직접 입력) ───────────────────
  function VocabImportModal(props) {
    var sb = window.supabase;
    var [mode, setMode] = React.useState('paste'); // 'paste' / 'excel' / 'single'
    var [pasteText, setPasteText] = React.useState('');
    var [parsed, setParsed] = React.useState([]); // [{word, meaning, part_of_speech, example}, ...]
    var [singleDraft, setSingleDraft] = React.useState({ word:'', meaning:'', part_of_speech:'', example:'' });
    var [saving, setSaving] = React.useState(false);

    // 텍스트 파싱: 줄별 → 탭 또는 다중 공백으로 분리
    function parsePasted(text) {
      var lines = String(text || '').split(/\r?\n/);
      var rows = [];
      lines.forEach(function(line){
        var trimmed = line.trim();
        if (!trimmed) return;
        // 탭이 있으면 탭 분리, 없으면 다중 공백 (2+) 분리
        var parts = trimmed.indexOf('\t') >= 0 ? trimmed.split('\t') : trimmed.split(/\s{2,}|,\s*/);
        var w = (parts[0] || '').trim();
        var m = (parts[1] || '').trim();
        var p = (parts[2] || '').trim();
        var e = (parts[3] || '').trim();
        if (w && m) rows.push({ word:w, meaning:m, part_of_speech:p || null, example:e || null });
      });
      return rows;
    }

    React.useEffect(function(){
      if (mode === 'paste') setParsed(parsePasted(pasteText));
    }, [pasteText, mode]);

    async function handleExcel(file) {
      if (!file) return;
      if (!window.XLSX) { alert('엑셀 라이브러리가 로드되지 않았습니다.'); return; }
      try {
        var buf = await file.arrayBuffer();
        var wb = window.XLSX.read(buf, { type:'array' });
        var sheet = wb.Sheets[wb.SheetNames[0]];
        var rows = window.XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });
        // 첫 줄이 헤더("단어/뜻" 같은 한글)면 스킵
        var startIdx = 0;
        if (rows.length && rows[0].length >= 2) {
          var first = String(rows[0][0] || '').trim();
          if (/단어|word|영단|어휘/i.test(first)) startIdx = 1;
        }
        var out = [];
        for (var i = startIdx; i < rows.length; i++) {
          var r = rows[i];
          if (!r || !r[0]) continue;
          var w = String(r[0] || '').trim();
          var m = String(r[1] || '').trim();
          if (!w || !m) continue;
          out.push({
            word: w, meaning: m,
            part_of_speech: String(r[2] || '').trim() || null,
            example: String(r[3] || '').trim() || null,
          });
        }
        setParsed(out);
        setMode('paste'); // 미리보기 화면 공유
        setPasteText(out.map(function(r){ return [r.word, r.meaning, r.part_of_speech||'', r.example||''].join('\t'); }).join('\n'));
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
          part_of_speech: r.part_of_speech || null,
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
          part_of_speech: singleDraft.part_of_speech || null,
          example: singleDraft.example || null,
          sort_order: (props.existingWords || []).length,
        });
        if (error) throw error;
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(720px, calc(100% - 32px))' }), onClick:function(e){ e.stopPropagation(); } },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 14px', fontFamily:'Manrope, sans-serif' } }, '단어 추가'),

        // 모드 선택 탭
        React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'14px', borderBottom:'1px solid rgba(0,0,0,0.08)' } },
          [['paste','붙여넣기'], ['excel','엑셀 업로드'], ['single','한 개 직접 입력']].map(function(m){
            return React.createElement('button', { key:m[0], onClick:function(){ setMode(m[0]); }, style:{ background:'none', border:'none', padding:'8px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', color: mode===m[0] ? '#E60012' : 'rgba(0,0,0,0.55)', borderBottom: mode===m[0] ? '2px solid #E60012' : '2px solid transparent', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, m[1]);
          })
        ),

        mode === 'paste' && React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'8px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
            '엑셀에서 두 칸(단어/뜻) 또는 네 칸(+품사/예문)을 복사해서 아래에 붙여넣으세요. 줄바꿈으로 구분, 칸 사이는 탭으로 자동 인식됩니다. 품사는 \'명사\' \'동사\' 같이 한글로 적어 주세요 (영어 약어 noun/v 등도 자동으로 한글로 변환됩니다).'
          ),
          React.createElement('textarea', {
            value: pasteText,
            onChange: function(e){ setPasteText(e.target.value); },
            placeholder: 'apple\t사과\nbanana\t바나나\ncat\t고양이',
            rows: 10,
            style: Object.assign({}, STYLES.input, { fontFamily:'Menlo, Consolas, monospace', resize:'vertical', minHeight:'160px' })
          }),
          parsed.length > 0 && React.createElement('div', { style:{ marginTop:'10px', fontSize:'12px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif' } },
            React.createElement('strong', { style:{ color:'#1A1A1A' } }, parsed.length + '개 단어 인식됨'),
            ' — 첫 5개 미리보기:',
            React.createElement('ul', { style:{ marginTop:'6px', paddingLeft:'18px', fontSize:'12px', lineHeight:'1.7' } },
              parsed.slice(0,5).map(function(r, i){
                return React.createElement('li', { key:i }, r.word + ' — ' + r.meaning + (r.part_of_speech ? ' (' + r.part_of_speech + ')' : '') + (r.example ? ' · ' + r.example : ''));
              })
            )
          )
        ),

        mode === 'excel' && React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
            '엑셀 파일(.xlsx, .xls)을 업로드하세요. 1열=단어, 2열=뜻 (3열=품사, 4열=예문은 선택). 품사는 한글(\'명사\'/\'동사\'/\'형용사\' 등)로 적으시는 게 좋아요. 첫 줄에 헤더("단어"/"뜻")가 있으면 자동으로 건너뜁니다.'
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
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'10px', marginBottom:'10px' } },
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '품사 (선택)'),
              React.createElement('input', { type:'text', value:singleDraft.part_of_speech, onChange:function(e){ setSingleDraft(Object.assign({}, singleDraft, { part_of_speech:e.target.value })); }, placeholder:'명사 / 동사 / 형용사 등', style:STYLES.input })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '예문 (선택)'),
              React.createElement('input', { type:'text', value:singleDraft.example, onChange:function(e){ setSingleDraft(Object.assign({}, singleDraft, { example:e.target.value })); }, placeholder:'I ate an apple.', style:STYLES.input })
            )
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
          part_of_speech: draft.part_of_speech || null,
          example: draft.example || null,
        }).eq('id', props.word.id);
        if (error) throw error;
        props.onSaved();
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      setSaving(false);
    }

    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:STYLES.modalCard, onClick:function(e){ e.stopPropagation(); } },
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
        React.createElement('div', { style:{ marginBottom:'10px' } },
          React.createElement('div', { style:STYLES.label }, '품사 (선택)'),
          React.createElement('input', { type:'text', value:draft.part_of_speech||'', onChange:function(e){ set('part_of_speech', e.target.value); }, placeholder:'명사 / 동사 / 형용사 등', style:STYLES.input })
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
      title: '유닛 ' + props.unitIndex + ' 시험',
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
      status: 'draft',
      due_at: null,
    };
    var [draft, setDraft] = React.useState(initial);
    var [classes, setClasses] = React.useState([]);
    var [students, setStudents] = React.useState([]);
    var [selectedClassIds, setSelectedClassIds] = React.useState([]);
    var [selectedStudentIds, setSelectedStudentIds] = React.useState([]);
    var [presetTargetClassIds, setPresetTargetClassIds] = React.useState([]);
    var [studentSearch, setStudentSearch] = React.useState('');
    var [saving, setSaving] = React.useState(false);
    var [section, setSection] = React.useState('settings'); // 'settings' | 'deploy'

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

    // 클래스 카드 클릭 — 토글 + preset 있으면 불러오기 제안
    function togglePresetClass(c) {
      var idx = presetTargetClassIds.indexOf(c.id);
      if (idx >= 0) {
        // 비선택
        setPresetTargetClassIds(presetTargetClassIds.filter(function(x){ return x !== c.id; }));
        return;
      }
      // 선택 — preset이 있으면 불러오기 확인
      if (c.vocab_test_preset && Object.keys(c.vocab_test_preset).length > 0) {
        if (confirm('"' + (c.class_name || c.name) + '"의 저장된 시험 형식을 폼에 불러올까요?\n(취소해도 저장 대상으로는 선택됩니다)')) {
          setDraft(function(d){ return Object.assign({}, d, c.vocab_test_preset); });
        }
      }
      setPresetTargetClassIds(presetTargetClassIds.concat([c.id]));
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
    function toggleClass(id) {
      setSelectedClassIds(function(arr) { return arr.indexOf(id) >= 0 ? arr.filter(function(x){ return x !== id; }) : arr.concat([id]); });
    }
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
      if (selectedClassIds.length === 0 && selectedStudentIds.length === 0 && draft.status === 'open') {
        if (!confirm('배포 대상이 비어 있습니다. 그래도 "진행중"으로 저장할까요?\n(아무도 응시할 수 없습니다)')) return;
      }

      setSaving(true);
      try {
        var payload = {
          list_id: props.listId,
          title: draft.title.trim(),
          unit_index: props.unitIndex,
          teacher_id: (props.user && props.user.id) || null,
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
        selectedStudentIds.forEach(function(sid) { assignments.push({ test_id: testId, student_id: sid }); });
        if (assignments.length > 0) {
          var ai = await sb.from('vocab_test_assignments').insert(assignments);
          if (ai.error) throw ai.error;
        }

        // 클래스 기본 설정으로 저장 (선택된 클래스들의 vocab_test_preset 업데이트)
        if (presetTargetClassIds.length > 0) {
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
          };
          for (var pi = 0; pi < presetTargetClassIds.length; pi++) {
            try {
              await sb.from('classes').update({ vocab_test_preset: presetPayload }).eq('id', presetTargetClassIds[pi]);
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

    var filteredStudents = studentSearch
      ? students.filter(function(s){ return (s.name || '').toLowerCase().indexOf(studentSearch.toLowerCase()) >= 0; })
      : students;

    return React.createElement('div', { style:STYLES.modalBackdrop, onClick:props.onClose },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(640px, calc(100% - 32px))' }), onClick:function(e){ e.stopPropagation(); } },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 14px', fontFamily:'Manrope, sans-serif' } }, isEdit ? '시험 편집' : '시험 만들기'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '유닛 ' + props.unitIndex + ' · 단어 ' + props.unitWordCount + '개'),

        // 섹션 탭
        React.createElement('div', { style:{ display:'flex', gap:'4px', marginBottom:'14px', borderBottom:'1px solid rgba(0,0,0,0.08)' } },
          [['settings','시험 설정'], ['deploy','배포 대상 (' + (selectedClassIds.length + selectedStudentIds.length) + ')']].map(function(s){
            return React.createElement('button', { key:s[0], onClick:function(){ setSection(s[0]); }, style:{ background:'none', border:'none', padding:'8px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', color: section===s[0] ? '#E60012' : 'rgba(0,0,0,0.55)', borderBottom: section===s[0] ? '2px solid #E60012' : '2px solid transparent', fontFamily:'Manrope, sans-serif', marginBottom:'-1px' } }, s[1]);
          })
        ),

        // 시험 설정
        section === 'settings' && React.createElement('div', null,
          // 클래스 기본 설정 (선택) — 카드 클릭 시 불러오기 + 저장 대상 표시
          classes.length > 0 && React.createElement('div', { style:{ marginBottom:'14px', padding:'12px', background:'#f8fafc', borderRadius:'10px', border:'1px dashed #d6dbde' } },
            React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'6px' }) }, '📋 클래스 기본 설정'),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'8px', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } },
              '클래스를 클릭하면 ① 그 반의 저장된 형식을 폼에 불러오고 ② 시험 저장 시 현재 형식을 그 반의 기본으로 저장합니다. ', React.createElement('span', { style:{ color:'#E60012', fontWeight:'700' } }, '●'), ' = 저장된 형식 있음'
            ),
            React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'6px' } },
              classes.map(function(c){
                var on = presetTargetClassIds.indexOf(c.id) >= 0;
                var hasPreset = !!(c.vocab_test_preset && Object.keys(c.vocab_test_preset).length > 0);
                return React.createElement('button', { key:c.id, onClick: function(){ togglePresetClass(c); }, style:{ position:'relative', background: on ? '#FFEBED' : '#fff', color: '#1A1A1A', border: '1.5px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'8px', padding:'8px 22px 8px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', textAlign:'left', fontFamily:'Manrope, sans-serif' } },
                  React.createElement('div', null, c.class_name || c.name),
                  c.grade && React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.5)', marginTop:'2px', fontWeight:'600' } }, c.grade),
                  hasPreset && React.createElement('span', { style:{ position:'absolute', top:'6px', right:'8px', color:'#E60012', fontSize:'10px', fontWeight:'800' } }, '●')
                );
              })
            )
          ),

          React.createElement('div', { style:{ marginBottom:'12px' } },
            React.createElement('div', { style:STYLES.label }, '시험 이름 *'),
            React.createElement('input', { type:'text', value:draft.title || '', onChange:function(e){ set('title', e.target.value); }, style:STYLES.input })
          ),

          React.createElement('div', { style:Object.assign({}, STYLES.label, { marginTop:'14px', marginBottom:'8px' }) }, '모드별 문제 수'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' } },
            [['multiple_choice_count','객관식'], ['spelling_count','스펠링 채우기'], ['writing_count','뜻 보고 쓰기'], ['listening_count','듣고 쓰기']].map(function(m){
              return React.createElement('div', { key:m[0], style:{ display:'flex', alignItems:'center', gap:'8px' } },
                React.createElement('label', { style:{ flex:1, fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.7)', fontFamily:'Manrope, sans-serif' } }, m[1]),
                React.createElement('input', { type:'number', min:0, max:props.unitWordCount, value:draft[m[0]] || 0, onChange:function(e){ set(m[0], e.target.value); }, style:Object.assign({}, STYLES.input, { width:'70px' }) })
              );
            })
          ),
          React.createElement('div', { style:{ fontSize:'11px', color: totalQ > props.unitWordCount ? '#c82014' : 'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } },
            '총 ' + totalQ + '문제 / 유닛 ' + props.unitWordCount + '단어' + (totalQ > props.unitWordCount ? ' — 단어 수보다 많이 출제할 수 없어요' : '')
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
              React.createElement('input', { type:'number', min:5, max:120, value:draft.seconds_per_question || 30, onChange:function(e){ set('seconds_per_question', e.target.value); }, style:STYLES.input })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:STYLES.label }, '정답 표시 시간 (초)'),
              React.createElement('input', { type:'number', min:0, max:10, value:draft.show_answer_seconds || 2, onChange:function(e){ set('show_answer_seconds', e.target.value); }, style:STYLES.input })
            )
          ),
          totalQ > 0 && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'14px', padding:'8px 10px', background:'#f8fafc', borderRadius:'6px' } },
            '⏱ 예상 시험 시간: 약 ' + (minutes > 0 ? minutes + '분 ' : '') + secs + '초'
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

        // 배포 대상
        section === 'deploy' && React.createElement('div', null,
          React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'8px' }) }, '반 (' + selectedClassIds.length + '개 선택)'),
          classes.length === 0
            ? React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '등록된 반이 없습니다.')
            : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'6px', marginBottom:'18px' } },
                classes.map(function(c){
                  var on = selectedClassIds.indexOf(c.id) >= 0;
                  return React.createElement('button', { key:c.id, onClick:function(){ toggleClass(c.id); }, style:{ background: on ? '#E60012' : '#fff', color: on ? '#fff' : '#1A1A1A', border: '1px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'8px', padding:'8px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', textAlign:'left' } },
                    React.createElement('div', null, c.class_name || c.name),
                    c.grade && React.createElement('div', { style:{ fontSize:'10px', opacity:0.7, marginTop:'2px' } }, c.grade)
                  );
                })
              ),

          React.createElement('div', { style:Object.assign({}, STYLES.label, { marginBottom:'8px' }) }, '개별 학생 (' + selectedStudentIds.length + '명 선택)'),
          React.createElement('input', { type:'text', value:studentSearch, onChange:function(e){ setStudentSearch(e.target.value); }, placeholder:'학생 이름으로 검색', style:Object.assign({}, STYLES.input, { marginBottom:'8px' }) }),
          React.createElement('div', { style:{ maxHeight:'240px', overflowY:'auto', border:'1px solid #d6dbde', borderRadius:'6px', padding:'4px' } },
            filteredStudents.length === 0
              ? React.createElement('div', { style:{ padding:'14px', textAlign:'center', color:'#9ca3af', fontSize:'12px', fontFamily:'Manrope, sans-serif' } }, '학생이 없습니다.')
              : filteredStudents.map(function(s){
                  var on = selectedStudentIds.indexOf(s.id) >= 0;
                  return React.createElement('div', { key:s.id, onClick:function(){ toggleStudent(s.id); }, style:{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 8px', cursor:'pointer', borderRadius:'4px', background: on ? '#FFEBED' : 'transparent' } },
                    React.createElement('div', { style:{ width:'16px', height:'16px', border:'1.5px solid ' + (on ? '#E60012' : '#d6dbde'), background: on ? '#E60012' : '#fff', borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } }, on && React.createElement('span', { style:{ color:'#fff', fontSize:'11px', fontWeight:'800' } }, '✓')),
                    React.createElement('span', { style:{ fontSize:'13px', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', flex:1 } }, s.name),
                    s.grade && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, s.grade)
                  );
                })
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

  // 전역 노출
  window.VocabManager = VocabManager;

})();
