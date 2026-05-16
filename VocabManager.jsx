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
          // 1000행 한도 우회 — count 머리(head)만 받아서 정확한 개수만 조회
          for (var ci = 0; ci < ids.length; ci++) {
            var cRes = await sb.from('vocab_words').select('id', { count:'exact', head:true }).eq('list_id', ids[ci]);
            counts[ids[ci]] = (cRes && typeof cRes.count === 'number') ? cRes.count : 0;
          }
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
    var [wordPage, setWordPage] = React.useState(1); // 단어 목록 페이지 (200개씩)
    var [showTestCreate, setShowTestCreate] = React.useState(null); // unit_index 또는 null
    var [editingTest, setEditingTest] = React.useState(null);
    var [resultsTest, setResultsTest] = React.useState(null);
    var [studySets, setStudySets] = React.useState([]); // [{unit_index, ...stages, title, ...}]
    var [studyUploadUnit, setStudyUploadUnit] = React.useState(null); // 업로드 모달 열 유닛 번호
    var [studyMultiOpen, setStudyMultiOpen] = React.useState(false); // 여러 유닛 일괄 업로드 모달
    var [studyViewUnit, setStudyViewUnit] = React.useState(null); // 미리보기 모달 열 유닛 번호
    var [assignModalUnit, setAssignModalUnit] = React.useState(null); // 연습/시험 보내기 모달 열 유닛 번호
    var [bulkAssignOpen, setBulkAssignOpen] = React.useState(false); // 모든 유닛 한 번에 보내기
    var [assignments, setAssignments] = React.useState([]); // [{id, unit_index, mode, stages, ...}] — 그 단어장의 모든 배정
    var [classes, setClasses] = React.useState([]); // 반 목록 (대상 라벨용)
    var [assignmentStudentCounts, setAssignmentStudentCounts] = React.useState({}); // { assignment_id: 개별학생수 }
    var [selectedAssignmentIds, setSelectedAssignmentIds] = React.useState({}); // 선택한 발행 id들 (일괄 취소용)
    var [selectedUnitIndexes, setSelectedUnitIndexes] = React.useState({}); // 선택한 유닛 번호들 (일괄 발행용)
    var isMobile = window.B2Utils.useIsMobile();

    React.useEffect(function(){ load(); }, [props.listId]);

    async function load() {
      setLoading(true);
      try {
        var lRes = await sb.from('vocab_lists').select('*').eq('id', props.listId).maybeSingle();
        setList(lRes.data || null);
        // Supabase PostgREST 기본 1000행 한도를 우회 — .range()로 페이지네이션해서 모두 가져옴
        var allWords = [];
        var pageSize = 1000;
        for (var p = 0; ; p++) {
          var wRes = await sb.from('vocab_words').select('*').eq('list_id', props.listId)
            .order('sort_order', { ascending: true }).order('created_at', { ascending: true })
            .range(p * pageSize, p * pageSize + pageSize - 1);
          var batch = (wRes && wRes.data) || [];
          if (!batch.length) break;
          allWords = allWords.concat(batch);
          if (batch.length < pageSize) break;
        }
        setWords(allWords);
        var tRes = await sb.from('vocab_tests').select('*').eq('list_id', props.listId).eq('is_active', true).order('unit_index', { ascending: true }).order('created_at', { ascending: false });
        setTests((tRes && tRes.data) || []);
        var sRes = await sb.from('vocab_study_sets').select('*').eq('list_id', props.listId).order('unit_index', { ascending: true });
        setStudySets((sRes && sRes.data) || []);
        var aRes = await sb.from('vocab_assignments').select('*').eq('list_id', props.listId).order('created_at', { ascending: false });
        var aData = (aRes && aRes.data) || [];
        setAssignments(aData);
        // 대상 라벨용: 반 목록 + 개별 학생 카운트
        var cRes = await sb.from('classes').select('id, name');
        setClasses((cRes && cRes.data) || []);
        if (aData.length > 0) {
          var asStud = await sb.from('vocab_assignment_students').select('assignment_id').in('assignment_id', aData.map(function(a){ return a.id; }));
          var counts = {};
          (((asStud && asStud.data) || [])).forEach(function(r){ counts[r.assignment_id] = (counts[r.assignment_id] || 0) + 1; });
          setAssignmentStudentCounts(counts);
        } else {
          setAssignmentStudentCounts({});
        }
      } catch (e) { console.error('단어장 상세 로드 실패:', e); }
      setLoading(false);
    }

    // assignment 대상 라벨 — 반/학교급+학년/개별학생수 조합
    function assignmentTargetLabel(a) {
      var parts = [];
      if (a.target_class_id) {
        var c = classes.find(function(x){ return x.id === a.target_class_id; });
        parts.push(c ? c.name : '반');
      }
      var lvlGrade = [a.target_school_level, a.target_grade].filter(Boolean).join(' ');
      if (lvlGrade) parts.push(lvlGrade);
      var indCount = assignmentStudentCounts[a.id] || 0;
      if (indCount > 0) parts.push('개별 ' + indCount + '명');
      return parts.length ? parts.join(' · ') : '대상 미지정';
    }

    async function deleteWord(word) {
      if (!confirm('"' + word.word + '"을(를) 삭제할까요?')) return;
      var { error } = await sb.from('vocab_words').delete().eq('id', word.id);
      if (error) { alert('삭제 실패: ' + error.message); return; }
      load();
    }

    // 보낸 연습/시험 발행 취소(삭제) — 학생 응시 기록도 함께 정리
    async function deleteAssignment(a) {
      var name = a.title || (a.mode === 'test' ? '시험' : '연습');
      if (!confirm('"' + name + '" 발행을 취소(삭제)할까요?\n학생 응시 기록이 있으면 같이 사라집니다.')) return;
      try {
        await sb.from('vocab_assignment_attempts').delete().eq('assignment_id', a.id);
        var d = await sb.from('vocab_assignments').delete().eq('id', a.id);
        if (d.error) throw d.error;
        load();
      } catch (e) {
        alert('삭제 실패: ' + (e.message || e));
      }
    }

    // 일괄 발행 묶음 취소 — 같은 시점·같은 설정으로 발행된 N개 한 번에 삭제
    async function deleteAssignmentBatch(ids, label) {
      if (!ids || !ids.length) return;
      if (!confirm((label || ('발행 묶음 ' + ids.length + '개')) + '을 한 번에 취소(삭제)할까요?\n학생 응시 기록과 개별 학생 지정도 같이 사라집니다.')) return;
      try {
        await sb.from('vocab_assignment_attempts').delete().in('assignment_id', ids);
        await sb.from('vocab_assignment_students').delete().in('assignment_id', ids);
        var d = await sb.from('vocab_assignments').delete().in('id', ids);
        if (d.error) throw d.error;
        load();
      } catch (e) {
        alert('일괄 취소 실패: ' + (e.message || e));
      }
    }

    // 선택한 발행 id들을 한 번에 취소
    async function deleteSelectedAssignments() {
      var ids = Object.keys(selectedAssignmentIds).filter(function(id){ return selectedAssignmentIds[id]; });
      if (!ids.length) { alert('취소할 발행을 먼저 체크하세요.'); return; }
      if (!confirm('선택한 ' + ids.length + '개 발행을 취소(삭제)할까요?\n학생 응시 기록과 개별 학생 지정도 같이 사라집니다.')) return;
      try {
        await sb.from('vocab_assignment_attempts').delete().in('assignment_id', ids);
        await sb.from('vocab_assignment_students').delete().in('assignment_id', ids);
        var d = await sb.from('vocab_assignments').delete().in('id', ids);
        if (d.error) throw d.error;
        setSelectedAssignmentIds({});
        load();
      } catch (e) {
        alert('일괄 취소 실패: ' + (e.message || e));
      }
    }
    // 이 단어장의 모든 발행을 한 번에 취소
    async function deleteAllAssignments() {
      if (!assignments.length) { alert('취소할 발행이 없습니다.'); return; }
      if (!confirm('이 단어장의 보낸 연습/시험 ' + assignments.length + '개를 모두 취소(삭제)할까요?\n학생 응시 기록과 개별 학생 지정도 같이 사라집니다. 되돌릴 수 없습니다.')) return;
      var ids = assignments.map(function(a){ return a.id; });
      try {
        await sb.from('vocab_assignment_attempts').delete().in('assignment_id', ids);
        await sb.from('vocab_assignment_students').delete().in('assignment_id', ids);
        var d = await sb.from('vocab_assignments').delete().in('id', ids);
        if (d.error) throw d.error;
        setSelectedAssignmentIds({});
        load();
      } catch (e) {
        alert('전체 취소 실패: ' + (e.message || e));
      }
    }
    function toggleAssignmentSelected(id) {
      setSelectedAssignmentIds(function(p){ var o = Object.assign({}, p); o[id] = !o[id]; if (!o[id]) delete o[id]; return o; });
    }
    function toggleUnitSelected(idx) {
      setSelectedUnitIndexes(function(p){ var o = Object.assign({}, p); o[idx] = !o[idx]; if (!o[idx]) delete o[idx]; return o; });
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
    // 채워진 유닛만 표시 — 다음 유닛은 상단의 '+ 4단계 학습 세트 업로드' 버튼이 자동 배치.
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
            // 메인 버튼: 4단계 학습 세트 업로드 (다음 빈 유닛에 자동 등록)
            React.createElement('button', { onClick:function(){
              var nextUnit = Math.max(maxWordUnit, maxStudyUnit) + 1;
              setStudyUploadUnit(nextUnit);
            }, style:STYLES.btnPrimary }, '+ 4단계 학습 세트 업로드'),
            // 여러 유닛 한꺼번에 (파일명에서 UNIT 번호 자동 추출)
            React.createElement('button', { onClick:function(){ setStudyMultiOpen(true); }, style:STYLES.btnGhost }, '+ 여러 유닛 한꺼번에'),
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
      activeTab === 'words' && (function(){
        if (!words.length) return React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '아직 단어가 없습니다. 위의 "+ 4단계 학습 세트 업로드" 버튼으로 한 번에 등록하세요. (단어만 따로 넣으려면 "단어만 추가")');
        var PER_PAGE = 200;
        var totalPages = Math.max(1, Math.ceil(words.length / PER_PAGE));
        var safePage = Math.min(Math.max(1, wordPage), totalPages);
        var pageStart = (safePage - 1) * PER_PAGE;
        var pageWords = words.slice(pageStart, pageStart + PER_PAGE);
        function PageNav(key) {
          if (totalPages <= 1) return null;
          return React.createElement('div', { key:key, style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px 4px', flexWrap:'wrap', fontFamily:'Manrope, sans-serif' } },
            React.createElement('button', { onClick:function(){ setWordPage(1); }, disabled: safePage===1, style:Object.assign({}, STYLES.btnGhost, { padding:'4px 10px', fontSize:'12px', opacity: safePage===1 ? 0.4 : 1 }) }, '«'),
            React.createElement('button', { onClick:function(){ setWordPage(safePage-1); }, disabled: safePage===1, style:Object.assign({}, STYLES.btnGhost, { padding:'4px 10px', fontSize:'12px', opacity: safePage===1 ? 0.4 : 1 }) }, '‹ 이전'),
            React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A', padding:'0 8px' } }, safePage + ' / ' + totalPages + ' 페이지'),
            React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)' } }, '(' + (pageStart+1) + '~' + Math.min(pageStart+PER_PAGE, words.length) + ' / 총 ' + words.length + '개)'),
            React.createElement('button', { onClick:function(){ setWordPage(safePage+1); }, disabled: safePage===totalPages, style:Object.assign({}, STYLES.btnGhost, { padding:'4px 10px', fontSize:'12px', opacity: safePage===totalPages ? 0.4 : 1 }) }, '다음 ›'),
            React.createElement('button', { onClick:function(){ setWordPage(totalPages); }, disabled: safePage===totalPages, style:Object.assign({}, STYLES.btnGhost, { padding:'4px 10px', fontSize:'12px', opacity: safePage===totalPages ? 0.4 : 1 }) }, '»')
          );
        }
        return React.createElement('div', { style:STYLES.card },
          PageNav('nav-top'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr 70px' : '40px 1fr 1fr 1.5fr 100px', gap:'8px', padding:'8px 4px', borderBottom:'2px solid #1A1A1A', fontSize:'11px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } },
            !isMobile && React.createElement('div', null, '#'),
            React.createElement('div', null, '단어'),
            React.createElement('div', null, '뜻'),
            !isMobile && React.createElement('div', null, '예문'),
            React.createElement('div', { style:{ textAlign:'right' } }, '관리')
          ),
          pageWords.map(function(w, idx){
            var i = pageStart + idx; // 전역 인덱스
            var thisUnit = Math.floor(i / unitSize) + 1;
            var isUnitStart = i % unitSize === 0;
            return React.createElement(React.Fragment, { key:w.id },
              isUnitStart && React.createElement('div', { style:{ gridColumn:'1 / -1', padding:'10px 4px 4px', fontSize:'11px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em', borderTop: idx > 0 ? '1px dashed rgba(0,0,0,0.1)' : 'none', marginTop: idx > 0 ? '6px' : 0 } }, '── UNIT ' + thisUnit + ' ──'),
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
          }),
          PageNav('nav-bottom')
        );
      })(),

      // 시험 탭 — 유닛별 섹션 + 시험 카드 그리드
      activeTab === 'tests' && (
        !words.length
          ? React.createElement('div', { style:Object.assign({}, STYLES.card, { textAlign:'center', padding:'40px', color:'#9ca3af' }) }, '먼저 단어를 추가해야 시험을 만들 수 있어요.')
          : React.createElement(React.Fragment, null,
              // 발행/취소 통합 컨트롤 박스
              (function(){
                var eligible = unitsArray.filter(function(u){ return u.words.length > 0 && u.study; });
                if (eligible.length < 2 && assignments.length === 0) return null;
                var selUnitCount = Object.keys(selectedUnitIndexes).filter(function(k){ return selectedUnitIndexes[k]; }).length;
                var selAssignCount = Object.keys(selectedAssignmentIds).filter(function(k){ return selectedAssignmentIds[k]; }).length;
                var btnPri = { background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'7px', padding:'8px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' };
                var btnDanger = { background:'#fff', color:'#c82014', border:'1px solid #f3c5c0', borderRadius:'7px', padding:'8px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' };
                var btnDisabled = { background:'#f3f4f6', color:'#9ca3af', cursor:'not-allowed' };
                return React.createElement('div', { style:{ marginBottom:'12px', padding:'12px 14px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', fontFamily:'Manrope, sans-serif' } },
                  // 발행 행
                  eligible.length >= 1 && React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom: assignments.length > 0 ? '8px' : 0 } },
                    React.createElement('div', { style:{ flex:1, minWidth:'180px', fontSize:'12px', color:'rgba(0,0,0,0.7)' } },
                      React.createElement('strong', { style:{ color:'#1A1A1A' } }, '발행'),
                      React.createElement('span', { style:{ marginLeft:'8px', fontSize:'11px', color:'rgba(0,0,0,0.5)' } }, '선택한 유닛 ' + selUnitCount + '개 / 전체 가능 ' + eligible.length + '개')
                    ),
                    React.createElement('button', { onClick:function(){
                      var picked = eligible.filter(function(u){ return selectedUnitIndexes[u.unit_index]; });
                      if (picked.length === 0) { alert('유닛을 1개 이상 체크해주세요.'); return; }
                      setBulkAssignOpen({ scope: 'selected', units: picked });
                    }, disabled: selUnitCount === 0, style: selUnitCount === 0 ? Object.assign({}, btnPri, btnDisabled) : btnPri }, '+ 선택 발행 (' + selUnitCount + ')'),
                    React.createElement('button', { onClick:function(){ setBulkAssignOpen({ scope: 'all', units: eligible }); }, disabled: eligible.length < 2, style: eligible.length < 2 ? Object.assign({}, btnPri, btnDisabled) : btnPri }, '+ 전체 발행 (' + eligible.length + ')')
                  ),
                  // 취소 행
                  assignments.length > 0 && React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
                    React.createElement('div', { style:{ flex:1, minWidth:'180px', fontSize:'12px', color:'rgba(0,0,0,0.7)' } },
                      React.createElement('strong', { style:{ color:'#1A1A1A' } }, '취소'),
                      React.createElement('span', { style:{ marginLeft:'8px', fontSize:'11px', color:'rgba(0,0,0,0.5)' } }, '선택한 발행 ' + selAssignCount + '개 / 보낸 발행 ' + assignments.length + '개')
                    ),
                    React.createElement('button', { onClick:deleteSelectedAssignments, disabled: selAssignCount === 0, style: selAssignCount === 0 ? Object.assign({}, btnDanger, btnDisabled) : btnDanger }, '× 선택 취소 (' + selAssignCount + ')'),
                    React.createElement('button', { onClick:deleteAllAssignments, style:btnDanger }, '× 전체 취소 (' + assignments.length + ')')
                  )
                );
              })(),
              (function(){
                var unitsWithStudy = unitsArray.filter(function(u){ return !!u.study; });
                var unitsNoStudy   = unitsArray.filter(function(u){ return !u.study && u.words.length > 0; });
                return React.createElement(React.Fragment, null,
                  React.createElement('div', { style:{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap:'12px', alignItems:'start' } },
                    unitsWithStudy.map(function(unit){
                      return React.createElement('div', { key:unit.unit_index, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px 12px' } },
                  // 유닛 헤더
                  React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px', paddingBottom:'4px', borderBottom:'1px solid #1A1A1A', gap:'6px' } },
                    React.createElement('div', { style:{ minWidth:0, flex:1, display:'flex', alignItems:'center', gap:'6px' } },
                      unit.study && unit.words.length > 0 && React.createElement('input', { type:'checkbox', checked: !!selectedUnitIndexes[unit.unit_index], onChange:function(){ toggleUnitSelected(unit.unit_index); }, title:'이 유닛 선택', style:{ width:'14px', height:'14px', cursor:'pointer', accentColor:'#E60012', flexShrink:0 } }),
                      React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', color: unit.words.length===0 ? 'rgba(0,0,0,0.4)' : '#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } }, 'UNIT ' + unit.unit_index),
                      unit.words.length === 0 && React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginLeft:'8px' } }, '단어 없음 — 4단계 세트 업로드해서 시작')
                    ),
                    unit.words.length > 0 && unit.assignments.length > 0 && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.45)', fontWeight:'700', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, unit.assignments.length + '개 보냄')
                  ),
                  // 4단계 학습 세트 행: 업로드 상태 + 버튼
                  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px', fontSize:'10px', fontFamily:'Manrope, sans-serif' } },
                    unit.study
                      ? React.createElement(React.Fragment, null,
                          React.createElement('span', { style:{ flex:1 } }),
                          React.createElement('button', { onClick:function(){ setStudyViewUnit(unit.unit_index); }, style:{ background:'transparent', color:'rgba(0,0,0,0.6)', border:'1px solid #d6dbde', borderRadius:'4px', padding:'2px 7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '보기'),
                          React.createElement('button', { onClick:function(){ setStudyUploadUnit(unit.unit_index); }, style:{ background:'transparent', color:'rgba(0,0,0,0.6)', border:'1px solid #d6dbde', borderRadius:'4px', padding:'2px 7px', fontSize:'10px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '교체')
                        )
                      : React.createElement(React.Fragment, null,
                          React.createElement('span', { style:{ color:'rgba(0,0,0,0.4)', flex:1 } }, '4단계 학습 세트 없음'),
                          React.createElement('button', { onClick:function(){ setStudyUploadUnit(unit.unit_index); }, style:{ background:'#FFEBED', color:'#E60012', border:'none', borderRadius:'4px', padding:'2px 8px', fontSize:'10px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 업로드')
                        )
                  ),
                  // 옛 vocab_tests 카드 표시는 제거 — 새 vocab_assignments 통합 흐름으로 대체.
                  // 보낸 연습/시험 목록 (vocab_assignments)
                  unit.assignments.length > 0 && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px', marginTop:'6px' } },
                    unit.assignments.map(function(a){
                      var modeBg = a.mode === 'test' ? '#fef3c7' : '#dbeafe';
                      var modeColor = a.mode === 'test' ? '#92400e' : '#1d4ed8';
                      var modeLabel = a.mode === 'test' ? '시험' : '연습';
                      return React.createElement('div', { key:a.id, style:{ background: selectedAssignmentIds[a.id] ? '#fef2f2' : '#fafbfc', border:'1px solid ' + (selectedAssignmentIds[a.id] ? '#f3c5c0' : '#e5e7eb'), borderRadius:'6px', padding:'6px 8px', fontSize:'10px', fontFamily:'Manrope, sans-serif', display:'flex', flexDirection:'column', gap:'2px' } },
                        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px' } },
                          React.createElement('input', { type:'checkbox', checked: !!selectedAssignmentIds[a.id], onChange:function(){ toggleAssignmentSelected(a.id); }, title:'이 발행 선택', style:{ width:'13px', height:'13px', cursor:'pointer', accentColor:'#c82014', flexShrink:0 } }),
                          React.createElement('span', { style:{ background: modeBg, color: modeColor, fontWeight:'800', padding:'1px 6px', borderRadius:'3px' } }, modeLabel),
                          React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, a.title || (a.mode === 'test' ? '시험' : '연습')),
                          React.createElement('button', { onClick:function(){ deleteAssignment(a); }, title:'발행 취소', style:{ background:'#fff', color:'#c82014', border:'1px solid #f3c5c0', borderRadius:'4px', padding:'1px 6px', fontSize:'10px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, '× 취소')
                        ),
                        React.createElement('div', { style:{ color:'#0f766e', fontWeight:'700', fontSize:'10px', paddingLeft:'20px' } }, '→ ' + assignmentTargetLabel(a))
                      );
                    })
                  ),
                  // 연습/시험 보내기 버튼 — 5단계 세트 있고 단어가 있을 때만
                  unit.study && unit.words.length > 0 && React.createElement('button', { onClick:function(){ setAssignModalUnit(unit.unit_index); }, style:{ marginTop:'6px', width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'6px', padding:'7px', fontSize:'11px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 연습/시험 보내기')
                );
              })
            ),
            // 4단계 학습 세트 없는 유닛은 한 박스로 묶어 표시 (단어는 있는 유닛)
            unitsNoStudy.length > 0 && React.createElement('div', { style:{ marginTop:'14px', background:'#fafbfc', border:'1px dashed #d6dbde', borderRadius:'10px', padding:'12px 14px', fontFamily:'Manrope, sans-serif' } },
              React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#1A1A1A', marginBottom:'4px' } }, '4단계 학습 세트가 없는 유닛 ' + unitsNoStudy.length + '개'),
              React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'8px', lineHeight:'1.6' } }, 'UNIT ' + unitsNoStudy.map(function(u){ return u.unit_index; }).join(', ')),
              React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', marginBottom:'10px' } }, '단어는 채워져 있지만 학습 세트가 아직 없어요. 위쪽 \'+ 4단계 학습 세트 업로드\' 또는 \'+ 여러 유닛 한꺼번에\'로 등록하면 시험을 보낼 수 있습니다.'),
              React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
                React.createElement('button', { onClick:function(){ setStudyUploadUnit(unitsNoStudy[0].unit_index); }, style:Object.assign({}, STYLES.btnPrimary, { padding:'7px 12px', fontSize:'12px' }) }, '+ UNIT ' + unitsNoStudy[0].unit_index + '부터 업로드'),
                React.createElement('button', { onClick:function(){ setStudyMultiOpen(true); }, style:Object.assign({}, STYLES.btnGhost, { padding:'7px 12px', fontSize:'12px' }) }, '+ 여러 유닛 한꺼번에')
              )
            )
          );
          })()
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
        list: list,
        onClose: function(){ setStudyUploadUnit(null); },
        onSaved: function(){ setStudyUploadUnit(null); load(); },
      }),
      studyMultiOpen && React.createElement(VocabStudySetMultiUploadModal, {
        listId: props.listId,
        list: list,
        unitSize: list.unit_size || 20,
        existingWords: words,
        existingStudy: studySets,
        user: props.user,
        onClose: function(){ setStudyMultiOpen(false); },
        onSaved: function(){ setStudyMultiOpen(false); load(); },
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
      }),
      bulkAssignOpen && React.createElement(VocabAssignmentModal, {
        listId: props.listId,
        list: list,
        bulkMode: true,
        // 선택 발행이면 사용자가 체크한 유닛만, 전체 발행이면 5단계 세트 있는 모든 유닛
        bulkUnits: (bulkAssignOpen && bulkAssignOpen.units) ? bulkAssignOpen.units : unitsArray.filter(function(u){ return u.words.length > 0 && u.study; }),
        // 첫 유닛의 studyData를 디폴트 stage 개수 표시용으로 전달
        studyData: (function(){
          var list2 = (bulkAssignOpen && bulkAssignOpen.units) ? bulkAssignOpen.units : unitsArray;
          var first = list2.find ? list2.find(function(u){ return u.words.length > 0 && u.study; }) : null;
          return first ? first.study : null;
        })(),
        // bulk에서는 unitIndex 안 씀 — 빈 값 방지용
        unitIndex: 0,
        user: props.user,
        onClose: function(){ setBulkAssignOpen(false); },
        onSaved: function(){ setBulkAssignOpen(false); setSelectedUnitIndexes({}); load(); },
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

    async function parseOneExcel(file) {
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
      return out;
    }

    async function handleExcels(files) {
      var list = Array.from(files || []);
      if (!list.length) return;
      if (!window.XLSX) { alert('엑셀 라이브러리가 로드되지 않았습니다.'); return; }
      var all = [];
      var fileSummary = [];
      var errors = [];
      for (var k = 0; k < list.length; k++) {
        try {
          var rows = await parseOneExcel(list[k]);
          all = all.concat(rows);
          fileSummary.push(list[k].name + ' (' + rows.length + '개)');
        } catch (e) {
          errors.push(list[k].name + ': ' + (e.message || e));
        }
      }
      if (errors.length) alert('일부 파일 파싱 실패:\n' + errors.join('\n'));
      if (!all.length) return;
      setParsed(all);
      setMode('paste'); // 미리보기 화면 공유
      setPasteWords(all.map(function(r){ return r.word; }).join('\n'));
      setPasteMeanings(all.map(function(r){ return r.meaning; }).join('\n'));
      if (list.length > 1) alert(list.length + '개 파일 합쳐서 ' + all.length + '개 단어 인식:\n' + fileSummary.join('\n'));
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
            '엑셀 파일(.xlsx, .xls)을 한 개 또는 여러 개 한 번에 업로드하세요. 여러 파일은 모두 합쳐서 이 단어장에 추가됩니다. 단어 + 뜻 (+ 예문 선택). 첫 줄에 헤더("번호"/"단어"/"뜻")가 있으면 자동으로 건너뛰고 컬럼 위치도 자동으로 맞춥니다 — 단어/뜻 2열, 번호/단어/뜻 3열 모두 OK.'
          ),
          React.createElement('input', {
            type:'file',
            accept:'.xlsx,.xls,.csv',
            multiple: true,
            onChange: function(e){ if (e.target.files && e.target.files.length) handleExcels(e.target.files); },
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

  // ── 4단계 학습 세트 업로드 모달 (5시트 엑셀 파싱) ─────────────────
  // 시트 구조 (이름은 부분 일치로 찾음 — 사용자가 시트명 살짝 바꿔도 동작):
  //   "1단계" 또는 "단어"         → stage1 [{num,word,correct,wrong:[..]}]
  //   "2단계" 또는 "해석"          → stage2 [{num,sentence,correct,wrong:[..]}]
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
        var s3 = findSheet(wb, ['3단계','영작']);
        var sg = findSheet(wb, ['어법','문법']);
        var sm = findSheet(wb, ['메타']);
        var p = {
          stage1: parseStage1(s1),
          stage2: parseMcq(s2),
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
              description: '4단계 학습 세트 원본 (자동 등록)' + (parsed.stage1 ? (' · 단어 ' + parsed.stage1.length + '개') : ''),
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
        var msg = '4단계 학습 세트 저장 완료!';
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
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 6px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + props.unitIndex + ' — 4단계 학습 세트 ' + (existing ? '교체' : '업로드')),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'14px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } },
          '엑셀 파일 1개 (5시트: 1단계_단어 / 2단계_해석 / 3단계_영작 / 어법 / 메타). 형식이 맞으면 자동 파싱돼서 미리보기 숫자가 보입니다.'
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

  // ── 4단계 학습 세트 일괄 업로드 모달 (여러 유닛 한꺼번에) ─────────────────
  // 파일명에서 UNIT/Day/단원/유닛 + 숫자 패턴을 자동 추출해서 유닛별로 매핑.
  // 추출 실패 시 사용자가 수동으로 유닛 번호 입력 가능.
  function VocabStudySetMultiUploadModal(props) {
    var sb = window.supabase;
    var [items, setItems] = React.useState([]); // [{ name, file, unit, parsed, error }]
    var [parsing, setParsing] = React.useState(false);
    var [saving, setSaving] = React.useState(false);
    var [progress, setProgress] = React.useState(null); // { done, total }

    function extractUnitFromName(name) {
      var n = String(name || '').replace(/\.(xlsx|xls|csv)$/i, '');
      var patterns = [
        /(?:UNIT|Unit|unit)[\s_\-]*(\d+)/,
        /(?:DAY|Day|day)[\s_\-]*(\d+)/,
        /(?:단원|유닛|차시)[\s_\-]*(\d+)/,
        /(\d+)[\s_\-]*(?:단원|유닛|차시|일차)/,
        /\b[uU][\s_\-]*(\d+)\b/,
      ];
      for (var i = 0; i < patterns.length; i++) {
        var m = n.match(patterns[i]);
        if (m) {
          var v = parseInt(m[1], 10);
          if (v >= 1 && v <= 999) return v;
        }
      }
      return null;
    }

    function findSheetX(wb, keys) {
      for (var i = 0; i < wb.SheetNames.length; i++) {
        var nm = String(wb.SheetNames[i]);
        for (var k = 0; k < keys.length; k++) if (nm.indexOf(keys[k]) >= 0) return wb.Sheets[nm];
      }
      return null;
    }
    function rowsOfX(sheet) { if (!sheet) return []; return window.XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' }); }
    function skipHeaderX(rows) {
      if (!rows.length) return rows;
      var f = String(rows[0][0] || '').trim();
      if (/번호|항목|단어|예문|문장|한국어/.test(f)) return rows.slice(1);
      return rows;
    }
    function parseStage1X(sheet) {
      var rows = skipHeaderX(rowsOfX(sheet));
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
    function parseMcqX(sheet) {
      var rows = skipHeaderX(rowsOfX(sheet));
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
    function parseStage3X(sheet) {
      var rows = skipHeaderX(rowsOfX(sheet));
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
    function parseGrammarX(sheet) {
      var rows = skipHeaderX(rowsOfX(sheet));
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
    function parseMetaX(sheet) {
      var rows = skipHeaderX(rowsOfX(sheet));
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

    async function handleFiles(fileList) {
      var arr = Array.from(fileList || []);
      if (!arr.length) return;
      if (!window.XLSX) { alert('엑셀 라이브러리가 로드되지 않았습니다.'); return; }
      setParsing(true);
      var nextItems = [];
      for (var k = 0; k < arr.length; k++) {
        var f = arr[k];
        var row = { name: f.name, file: f, unit: extractUnitFromName(f.name), parsed: null, error: '' };
        try {
          var buf = await f.arrayBuffer();
          var wb = window.XLSX.read(buf, { type:'array' });
          var s1 = findSheetX(wb, ['1단계','단어 객']) || wb.Sheets[wb.SheetNames[0]];
          var s2 = findSheetX(wb, ['2단계_해석','해석']);
          var s3 = findSheetX(wb, ['3단계','영작']);
          var sg = findSheetX(wb, ['어법','문법']);
          var sm = findSheetX(wb, ['메타']);
          row.parsed = {
            stage1: parseStage1X(s1),
            stage2: parseMcqX(s2),
            stage3: parseStage3X(s3),
            grammar: parseGrammarX(sg),
            meta: parseMetaX(sm),
          };
        } catch (e) {
          row.error = '파싱 실패: ' + (e.message || e);
        }
        nextItems.push(row);
      }
      // 기존 항목 뒤에 누적
      setItems(function(prev){ return prev.concat(nextItems); });
      setParsing(false);
    }

    function updateUnit(idx, val) {
      var v = parseInt(val, 10);
      setItems(function(prev){
        return prev.map(function(it, i){ return i === idx ? Object.assign({}, it, { unit: (isNaN(v) || v < 1) ? null : v }) : it; });
      });
    }
    function removeItem(idx) {
      setItems(function(prev){ return prev.filter(function(_, i){ return i !== idx; }); });
    }

    async function saveOne(it) {
      // 한 항목 저장 — 기존 단일 모달의 save() 로직과 동일
      var sourcePath = null;
      if (it.file) {
        try {
          var ext = (it.file.name.split('.').pop() || 'xlsx').toLowerCase();
          sourcePath = 'materials/study_sets/' + props.listId + '_u' + it.unit + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7) + '.' + ext;
          var up = await sb.storage.from('attachments').upload(sourcePath, it.file, { cacheControl:'3600', upsert:false });
          if (up.error) { console.warn('원본 파일 업로드 실패:', up.error); sourcePath = null; }
        } catch (e) { console.warn('원본 파일 업로드 예외:', e); sourcePath = null; }
      }
      var row = {
        list_id: props.listId,
        unit_index: it.unit,
        title: (it.parsed.meta && it.parsed.meta.title) || null,
        description: (it.parsed.meta && it.parsed.meta.description) || null,
        stage1: it.parsed.stage1,
        stage2: it.parsed.stage2,
        stage3: it.parsed.stage3,
        grammar: it.parsed.grammar,
        source_file_name: it.file ? it.file.name : null,
        created_by: window.B2Utils.safeUserId(props.user),
        creator_name: (props.user && props.user.name) || null,
        updated_at: new Date().toISOString(),
      };
      var upsert = await sb.from('vocab_study_sets').upsert(row, { onConflict: 'list_id,unit_index' });
      if (upsert.error) throw upsert.error;

      if (sourcePath) {
        try {
          var listName = (props.list && props.list.name) ? props.list.name : '단어장';
          var matTitle = listName + ' · UNIT ' + it.unit + ((it.parsed.meta && it.parsed.meta.title) ? (' — ' + it.parsed.meta.title) : '');
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
            description: '4단계 학습 세트 원본 (자동 등록)' + (it.parsed.stage1 ? (' · 단어 ' + it.parsed.stage1.length + '개') : ''),
            image_paths: [sourcePath],
            answer_paths: [],
            answer_key: {},
            question_count: 0, text_question_count: 0, choices_per_question: 5,
            status: 'open',
          });
        } catch (e) { console.warn('자료실 자동 등록 실패:', e); }
      }

      // 단어 자동 등록 — 그 유닛이 비었을 때만
      var unitSize = props.unitSize || 20;
      var startSort = (it.unit - 1) * unitSize;
      var endSort = startSort + unitSize - 1;
      var unitHasWords = (props.existingWords || []).some(function(w){ return w.sort_order >= startSort && w.sort_order <= endSort; });
      var addedWordCount = 0;
      if (!unitHasWords && it.parsed.stage1 && it.parsed.stage1.length) {
        var newWords = it.parsed.stage1
          .filter(function(s){ return s && s.word && s.correct; })
          .map(function(s, i){ return {
            list_id: props.listId,
            word: String(s.word).trim(),
            meaning: String(s.correct).trim(),
            sort_order: startSort + i,
          }; });
        if (newWords.length > 0) {
          var wRes = await sb.from('vocab_words').insert(newWords);
          if (!wRes.error) addedWordCount = newWords.length;
        }
      }
      return { addedWordCount: addedWordCount };
    }

    async function saveAll() {
      // 검증: unit 번호 없는 항목 / 중복 unit
      var valid = items.filter(function(it){ return it.parsed && it.unit; });
      var invalid = items.filter(function(it){ return !it.parsed || !it.unit; });
      if (!valid.length) { alert('저장할 수 있는 항목이 없습니다. 파일 추가 또는 유닛 번호를 입력해 주세요.'); return; }
      var unitSeen = {};
      var dups = [];
      valid.forEach(function(it){ if (unitSeen[it.unit]) dups.push(it.unit); unitSeen[it.unit] = true; });
      if (dups.length) { alert('같은 유닛 번호가 여러 파일에 중복됩니다: UNIT ' + dups.join(', ') + '\n각 파일의 유닛 번호를 다르게 지정해 주세요.'); return; }

      // 덮어쓰기 경고
      var existingUnits = (props.existingStudy || []).map(function(s){ return s.unit_index; });
      var overwriteUnits = valid.map(function(it){ return it.unit; }).filter(function(u){ return existingUnits.indexOf(u) >= 0; });
      if (overwriteUnits.length && !confirm(overwriteUnits.length + '개 유닛에 이미 학습 세트가 있어요. 덮어쓸까요?\nUNIT: ' + overwriteUnits.join(', '))) return;
      if (invalid.length && !confirm(invalid.length + '개 파일은 유닛 번호 없음/파싱 실패로 건너뜁니다. 나머지 ' + valid.length + '개를 저장할까요?')) return;

      setSaving(true);
      setProgress({ done: 0, total: valid.length });
      var totalWords = 0;
      var errors = [];
      for (var k = 0; k < valid.length; k++) {
        try {
          var r = await saveOne(valid[k]);
          totalWords += r.addedWordCount;
        } catch (e) {
          errors.push('UNIT ' + valid[k].unit + ' (' + valid[k].name + '): ' + (e.message || e));
        }
        setProgress({ done: k + 1, total: valid.length });
      }
      setSaving(false);
      var msg = (valid.length - errors.length) + '개 유닛 저장 완료';
      if (totalWords > 0) msg += '\n단어 ' + totalWords + '개 자동 등록';
      if (errors.length) msg += '\n\n실패 ' + errors.length + '건:\n' + errors.join('\n');
      alert(msg);
      props.onSaved();
    }

    var validCount = items.filter(function(it){ return it.parsed && it.unit; }).length;

    return React.createElement('div', { style:STYLES.modalBackdrop },
      React.createElement('div', { style:Object.assign({}, STYLES.modalCard, { width:'min(820px, calc(100% - 32px))', maxHeight:'90vh', overflow:'auto' }) },
        React.createElement('button', { onClick:props.onClose, style:{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.4)', lineHeight:1 } }, '×'),
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 6px', fontFamily:'Manrope, sans-serif' } }, '여러 유닛 5단계 세트 한꺼번에 업로드'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.6)', marginBottom:'14px', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } },
          '엑셀 파일을 여러 개 선택하면 파일명에서 ', React.createElement('strong', null, 'UNIT/Day/단원/유닛 + 숫자'),
          ' 패턴을 자동으로 찾아 유닛에 배치합니다. 예) UNIT_01.xlsx, Day1.xlsx, 1단원.xlsx. 자동 추출 실패한 행은 빨갛게 표시되며 유닛 번호를 직접 입력하면 됩니다.'
        ),

        React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('input', { type:'file', accept:'.xlsx,.xls', multiple:true, disabled:parsing||saving, onChange:function(e){
            handleFiles(e.target.files);
            e.target.value = ''; // 같은 파일 다시 선택 가능하게
          }, style:{ fontSize:'13px', fontFamily:'Manrope, sans-serif' } }),
          parsing && React.createElement('span', { style:{ marginLeft:'10px', fontSize:'12px', color:'rgba(0,0,0,0.55)' } }, '파싱 중...')
        ),

        items.length > 0 && React.createElement('div', { style:{ border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden', marginBottom:'14px' } },
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'80px 1fr 90px 70px 60px', gap:'8px', padding:'10px 12px', background:'#F8FAFC', borderBottom:'1px solid #e5e7eb', fontSize:'11px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', letterSpacing:'0.04em' } },
            React.createElement('div', null, 'UNIT'),
            React.createElement('div', null, '파일명'),
            React.createElement('div', null, '문항 합계'),
            React.createElement('div', null, '상태'),
            React.createElement('div', null, '')
          ),
          items.map(function(it, idx){
            var hasUnit = !!it.unit;
            var ok = it.parsed && hasUnit;
            var total = it.parsed ? (it.parsed.stage1.length + it.parsed.stage2.length + it.parsed.stage3.length + it.parsed.grammar.length) : 0;
            return React.createElement('div', { key:idx, style:{ display:'grid', gridTemplateColumns:'80px 1fr 90px 70px 60px', gap:'8px', padding:'10px 12px', borderBottom: idx === items.length-1 ? 'none' : '1px solid #f3f4f6', fontSize:'12px', fontFamily:'Manrope, sans-serif', alignItems:'center', background: ok ? 'white' : '#FFF7F7' } },
              React.createElement('input', { type:'number', min:'1', max:'999', value: hasUnit ? it.unit : '', placeholder:'?', onChange:function(e){ updateUnit(idx, e.target.value); }, style:{ width:'70px', padding:'4px 6px', border:'1px solid ' + (hasUnit ? '#d6dbde' : '#FCA5A5'), borderRadius:'4px', fontSize:'12px', fontFamily:'Manrope, sans-serif' } }),
              React.createElement('div', { style:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(0,0,0,0.75)' }, title:it.name }, it.name),
              React.createElement('div', { style:{ color:'rgba(0,0,0,0.6)' } }, it.error ? '—' : (total + '문항')),
              React.createElement('div', null,
                it.error
                  ? React.createElement('span', { style:{ color:'#991B1B', fontSize:'11px', fontWeight:'700' }, title:it.error }, '오류')
                  : ok
                    ? React.createElement('span', { style:{ color:'#047857', fontSize:'11px', fontWeight:'700' } }, 'OK')
                    : React.createElement('span', { style:{ color:'#B45309', fontSize:'11px', fontWeight:'700' } }, '유닛?')
              ),
              React.createElement('button', { onClick:function(){ removeItem(idx); }, disabled:saving, style:{ background:'transparent', color:'rgba(0,0,0,0.5)', border:'1px solid #d6dbde', borderRadius:'4px', padding:'3px 8px', fontSize:'11px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '제거')
            );
          })
        ),

        progress && React.createElement('div', { style:{ background:'#EFF6FF', color:'#1E40AF', padding:'10px 12px', borderRadius:'6px', fontSize:'12px', fontFamily:'Manrope, sans-serif', marginBottom:'12px' } },
          '저장 중... ' + progress.done + ' / ' + progress.total
        ),

        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'space-between', alignItems:'center' } },
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } },
            items.length > 0 ? ('총 ' + items.length + '개 파일 · 저장 가능 ' + validCount + '개') : '파일을 선택해 주세요.'
          ),
          React.createElement('div', { style:{ display:'flex', gap:'8px' } },
            React.createElement('button', { onClick:props.onClose, disabled:saving, style:STYLES.btnGhost }, '닫기'),
            React.createElement('button', { onClick:saveAll, disabled:!validCount || saving || parsing, style:Object.assign({}, STYLES.btnPrimary, (!validCount || saving || parsing) ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '저장 중...' : ('저장 (' + validCount + '개)'))
          )
        )
      )
    );
  }

  // ── 4단계 학습 세트 미리보기 모달 ─────────────────
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
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px', fontFamily:'Manrope, sans-serif' } }, 'UNIT ' + props.unitIndex + ' — 4단계 학습 세트'),
        s.title && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', marginBottom:'12px', fontFamily:'Manrope, sans-serif' } }, s.title),
        section('1단계 단어 객관식', (s.stage1||[]).length, firstStage1(s.stage1)),
        section('2단계 예문 해석', (s.stage2||[]).length, firstMcq(s.stage2)),
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
    // 기본값: 연습 = 1단계만, 시험 = 4단계 다 (보통 시험은 전체 평가하니까)
    var [stagesByMode, setStagesByMode] = React.useState({
      practice: { '1': true,  '2': false, '3': false, 'grammar': false },
      test:     { '1': true,  '2': true,  '3': true,  'grammar': true  },
    });
    var stages = stagesByMode[mode];
    // 대상
    var [targetLevel, setTargetLevel] = React.useState('');
    var [targetGrade, setTargetGrade] = React.useState('');
    var [targetClassId, setTargetClassId] = React.useState('');
    var [individualIds, setIndividualIds] = React.useState([]);
    var [studentSearch, setStudentSearch] = React.useState('');
    // 일괄 모드: 여러 유닛을 한 번에 발행
    var isBulk = !!props.bulkMode;
    var bulkUnits = (props.bulkUnits || []); // [{ unit_index, study, words }, ...]
    // 시험 옵션
    var [title, setTitle] = React.useState(isBulk ? 'UNIT {N} 시험' : ('UNIT ' + props.unitIndex + ' 시험'));
    var [dueAt, setDueAt] = React.useState('');
    var [intervalDays, setIntervalDays] = React.useState('7'); // bulk only — 유닛 간격(일)
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
      var hasTarget = !!targetClassId || !!targetLevel || !!targetGrade || individualIds.length > 0;
      if (!hasTarget) { alert('대상을 1명 이상 지정해주세요 (반·학년·개별 학생 중 하나).'); return; }
      if (mode === 'test' && !title.trim()) { alert('시험 제목을 입력해주세요.'); return; }

      if (isBulk) {
        // 일괄 모드: 단계 데이터 검사를 유닛별로
        var validUnits = bulkUnits.filter(function(u){
          if (!u.words || u.words.length === 0) return false;
          if (!u.study) return false;
          for (var i=0; i<stagesArr.length; i++) {
            var k = stagesArr[i];
            var arr = (k==='1') ? u.study.stage1 : (k==='2') ? u.study.stage2 : (k==='3') ? u.study.stage3 : (k==='grammar') ? u.study.grammar : [];
            if (!arr || arr.length === 0) return false;
          }
          return true;
        });
        if (validUnits.length === 0) { alert('선택한 단계의 데이터가 있는 유닛이 없습니다. 4단계 학습 세트를 먼저 업로드해주세요.'); return; }
        if (individualIds.length > 0) { alert('일괄 발행은 개별 학생 지정을 지원하지 않습니다. 반/학년으로 지정해주세요.'); return; }
        var msg = validUnits.length + '개 유닛에 ' + (mode==='test'?'시험':'연습') + '을(를) 한 번에 보냅니다.';
        if (mode === 'test' && dueAt) { msg += '\n첫 마감일: ' + dueAt + '\n간격: ' + intervalDays + '일'; }
        if (!confirm(msg + '\n\n계속할까요?')) return;
        setSaving(true);
        try {
          var iv = Math.max(0, parseInt(intervalDays, 10) || 0);
          var firstMs = (mode === 'test' && dueAt) ? new Date(dueAt).getTime() : null;
          // unit_index 오름차순으로 정렬해서 빠른 유닛이 먼저 마감되게
          var sortedUnits = validUnits.slice().sort(function(a,b){ return a.unit_index - b.unit_index; });
          var rows = sortedUnits.map(function(u, idx){
            var thisDueIso = null;
            if (firstMs !== null) {
              var ms = firstMs + idx * iv * 24 * 60 * 60 * 1000;
              thisDueIso = new Date(ms).toISOString();
            }
            var thisTitle = mode === 'test' ? title.trim().replace(/\{N\}/g, String(u.unit_index)) : null;
            return {
              list_id: props.listId,
              unit_index: u.unit_index,
              mode: mode,
              stages: stagesArr,
              target_class_id: targetClassId || null,
              target_school_level: targetLevel || null,
              target_grade: targetGrade || null,
              title: thisTitle,
              due_at: thisDueIso,
              pass_score: mode === 'test' ? (parseInt(passScore, 10) || 0) : 0,
              attempts_allowed: mode === 'test' ? (parseInt(attempts, 10) || 1) : 999999,
              status: 'open',
              created_by: window.B2Utils.safeUserId(props.user),
              creator_name: (props.user && props.user.name) || null,
            };
          });
          var insAll = await sb.from('vocab_assignments').insert(rows);
          if (insAll.error) throw insAll.error;
          alert(validUnits.length + '개 유닛 ' + (mode === 'test' ? '시험' : '연습') + '을(를) 모두 보냈어요.');
          props.onSaved();
        } catch (e) { alert('저장 실패: ' + (e.message || e)); }
        setSaving(false);
        return;
      }

      // 단일 유닛 모드
      var noData = stagesArr.filter(function(k){ var info = stageInfo.find(function(i){ return i.key === k; }); return !info || info.count === 0; });
      if (noData.length > 0) { alert('선택한 단계 중 데이터가 없는 게 있어요. (4단계 학습 세트를 먼저 업로드해주세요)'); return; }

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
        React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'#111827', margin:'0 0 4px', fontFamily:'Manrope, sans-serif' } }, isBulk ? ('모든 유닛 한 번에 보내기 (' + bulkUnits.length + '개)') : '연습/시험 보내기'),
        React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'16px' } },
          isBulk
            ? ((props.list && props.list.name ? props.list.name + ' · ' : '') + 'UNIT ' + (bulkUnits[0] ? bulkUnits[0].unit_index : '?') + ' ~ ' + (bulkUnits[bulkUnits.length-1] ? bulkUnits[bulkUnits.length-1].unit_index : '?') + ' — 같은 설정으로 ' + bulkUnits.length + '개 유닛 일괄 발행')
            : ((props.list && props.list.name ? props.list.name + ' · ' : '') + 'UNIT ' + props.unitIndex + (studyData.title ? (' — ' + studyData.title) : ''))
        ),

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
          // 개별 학생 추가 — 일괄 모드에서는 숨김 (반/학년만 지원)
          !isBulk && React.createElement(React.Fragment, null,
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
          isBulk && React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontStyle:'italic', padding:'8px 12px', background:'#f9fafb', borderRadius:'6px', fontFamily:'Manrope, sans-serif' } }, '일괄 발행은 반·학년만 지정할 수 있어요. (개별 학생 지정은 유닛별로 따로)')
        ),

        // 4) 시험 옵션 (mode === 'test')
        mode === 'test' && React.createElement('div', { style:{ marginBottom:'16px', background:'#fef3c7', border:'1px solid #fbbf24', borderRadius:'8px', padding:'12px' } },
          React.createElement('div', { style: Object.assign({}, sectionLabel, { color:'#92400e', marginBottom:'10px' }) }, '4. 시험 옵션'),
          React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '시험 제목' + (isBulk ? ' — {N} 자리에 유닛 번호가 자동 들어가요' : '')),
          React.createElement('input', { type:'text', value: title, onChange:function(e){ setTitle(e.target.value); }, placeholder: isBulk ? '예: UNIT {N} 시험' : '', style:Object.assign({}, inputStyleS, { width:'100%', marginBottom:'8px' }) }),
          React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
            React.createElement('div', { style:{ flex:1, minWidth:'130px' } },
              React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, isBulk ? '첫 유닛 마감일' : '마감일 (선택)'),
              React.createElement('input', { type:'datetime-local', value: dueAt, onChange:function(e){ setDueAt(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%' }) })
            ),
            isBulk && React.createElement('div', { style:{ flex:1, minWidth:'110px' } },
              React.createElement('label', { style:{ fontSize:'11px', fontWeight:'700', color:'#92400e', display:'block', marginBottom:'2px' } }, '유닛 간격 (일)'),
              React.createElement('input', { type:'number', min:'0', max:'365', value: intervalDays, onChange:function(e){ setIntervalDays(e.target.value); }, style:Object.assign({}, inputStyleS, { width:'100%' }) })
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
          ),
          isBulk && dueAt && React.createElement('div', { style:{ fontSize:'11px', color:'#78350f', marginTop:'8px', fontFamily:'Manrope, sans-serif', background:'#fff', padding:'6px 10px', borderRadius:'4px' } },
            '예시: UNIT 1 ' + dueAt.replace('T',' ') + ' · UNIT 2 ' + (function(){ try { var iv = Math.max(0, parseInt(intervalDays,10)||0); var d = new Date(dueAt); d.setTime(d.getTime() + iv*86400000); return d.toISOString().slice(0,16).replace('T',' '); } catch(e){ return '?'; } })() + ' · ...'
          )
        ),

        // 일괄 모드: stageInfo가 (props.studyData 한 유닛 기준이라) 의미 없음 — 안내문 표시
        isBulk && React.createElement('div', { style:{ marginBottom:'12px', fontSize:'11px', color:'#6b7280', fontStyle:'italic', padding:'8px 12px', background:'#f9fafb', borderRadius:'6px', fontFamily:'Manrope, sans-serif' } },
          '※ 단계별 문항 수는 위에 보인 게 첫 유닛 기준이에요. 일부 유닛에 데이터가 부족하면 그 유닛은 자동으로 건너뜁니다.'
        ),

        // 액션
        React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
          React.createElement('button', { onClick:props.onClose, style:STYLES.btnGhost }, '취소'),
          React.createElement('button', { onClick:save, disabled:saving, style:Object.assign({}, STYLES.btnPrimary, saving ? { background:'#9ca3af', cursor:'not-allowed' } : null) }, saving ? '보내는 중...' : (isBulk ? ('일괄 발행 (' + bulkUnits.length + '개)') : '보내기'))
        )
      )
    );
  }

  // 전역 노출
  window.VocabManager = VocabManager;

})();
