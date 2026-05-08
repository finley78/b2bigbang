// AdminPanel.jsx — Admin login + full management panel

const GRADES = ['중1','중2','중3','고1','고2','고3'];
const SUBJECTS = ['국어','영어','수학','과학'];
const COURSE_LEVELS = ['초등','중등','고등'];
const COURSE_GRADES_BY_LEVEL = {
'초등': ['1학년','2학년','3학년','4학년','5학년','6학년'],
'중등': ['중1','중2','중3'],
'고등': ['고1','고2','고3'],
};
const SCHOOLS = ['전체','은지초','검암초','간재울초','검암중','간재울중','백석중','서곶중','대인고','서인천고','백석고'];
const TEACHER_LEVELS = ['초등','중등','고등'];
const TEACHER_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const TEACHER_ASSIGN_LEVELS = ['초등','중등','고등'];
const TEACHER_ASSIGN_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const SCHOOL_LEVELS = {
'초등': { schools:['은지초','검암초','간재울초'], grades:['1학년','2학년','3학년','4학년','5학년','6학년'] },
'중등': { schools:['검암중','간재울중','백석중','서곶중'], grades:['중1','중2','중3'] },
'고등': { schools:['대인고','서인천고','백석고'], grades:['고1','고2','고3'] },
};
// ── 학년/성적 헬퍼는 B2Utils로 통합 ──
var levelFromGrade = window.B2Utils.levelFromGrade;
var adminGradeBucket = window.B2Utils.scoreGradeBucket;
var adminDistBucket = window.B2Utils.scoreDistBucket;
var adminColorForScore = window.B2Utils.scoreColor;

/* ── Admin Login ────────────────────────────── */
function AdminLogin({ onLogin }) {
const [pw, setPw] = React.useState('');
const [error, setError] = React.useState(false);

function attempt() {
if (pw === 'b2admin') { onLogin(); }
else { setError(true); setTimeout(() => setError(false), 2000); }
}

return React.createElement('div', { style:{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb' } },
React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'40px', width:'360px', boxShadow:'0 4px 24px rgba(0,0,0,0.1)' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' } },
React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '관리자 로그인')
),
React.createElement('div', { style:{ position:'relative', background:'#f9f9f9', borderRadius:'4px', border:`1px solid ${error?'#c82014':'#d6dbde'}`, padding:'14px 12px 10px', marginBottom:'16px' } },
React.createElement('div', { style:{ position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color: error?'#c82014':'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, error?'비밀번호 오류':'비밀번호'),
React.createElement('input', { type:'password', name:'admin-password', autoComplete:'current-password', value:pw, onChange:e=>setPw(e.target.value), onKeyDown:e=>e.key==='Enter'&&attempt(), placeholder:'관리자 비밀번호', style:{ width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' } })
),
React.createElement('button', { onClick:attempt, style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, '로그인'),
React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.35)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif' } }, '데모 비밀번호: b2admin')
)
);
}

/* ── Admin Panel ────────────────────────────── */
function AdminPanel({ state, setState, onLogout, adminAuthed, setAdminAuthed, user }) {
const authed = adminAuthed;
const setAuthed = setAdminAuthed;
const [tab, setTab] = React.useState('home');
const [tabGroup, setTabGroup] = React.useState('webapp');
const [adminIsMobile, setAdminIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 1024);
React.useEffect(function(){
  function h(){ setAdminIsMobile(window.innerWidth < 1024); }
  window.addEventListener('resize', h);
  return function(){ window.removeEventListener('resize', h); };
}, []);
const [editingBanner, setEditingBanner] = React.useState(null);
const [editingNotice, setEditingNotice] = React.useState(null);
const [editingCourse, setEditingCourse] = React.useState(null);
const [expandedStudent, setExpandedStudent] = React.useState(null);
const [saveToast, setSaveToast] = React.useState(false);
const saveToastTimer = React.useRef(null);
const showSaved = React.useCallback(function() {
  setSaveToast(true);
  if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
  saveToastTimer.current = setTimeout(function(){ setSaveToast(false); }, 1800);
}, []);
const [expandedTeacher, setExpandedTeacher] = React.useState(null);
const [expandedMember, setExpandedMember] = React.useState(null);
const [memberFilter, setMemberFilter] = React.useState('전체');
const [memberSearch, setMemberSearch] = React.useState('');
const [memberSearchMode, setMemberSearchMode] = React.useState('search'); // 'search' | 'filter'
const [mfLevel, setMfLevel] = React.useState('전체');
const [mfGrade, setMfGrade] = React.useState('전체');
const [mfSchool, setMfSchool] = React.useState('전체');
const [mfTeacher, setMfTeacher] = React.useState('전체');
const [editingMember, setEditingMember] = React.useState(null);
const [filterSchool, setFilterSchool] = React.useState('전체');
const [filterLevel, setFilterLevel] = React.useState('전체');
const [filterGrade, setFilterGrade] = React.useState('전체');
const [filterTeacher, setFilterTeacher] = React.useState('전체');
const [studentNameSearch, setStudentNameSearch] = React.useState('');
const [sortStudentBy, setSortStudentBy] = React.useState('created_desc');
const [selectedIds, setSelectedIds] = React.useState([]);
const [bulkLevel, setBulkLevel] = React.useState('');
const [bulkGrade, setBulkGrade] = React.useState('');
const [bulkSchool, setBulkSchool] = React.useState('');
const [bulkSchoolCustom, setBulkSchoolCustom] = React.useState('');
const [bulkSubjects, setBulkSubjects] = React.useState([]);
const [bulkTeacherId, setBulkTeacherId] = React.useState('');
const [bulkClassId, setBulkClassId] = React.useState('');
const [teacherPicker, setTeacherPicker] = React.useState(null); // { studentId, subject } 팝업 열기 전용
const [dbStudents, setDbStudents] = React.useState([]);
const [dbWithdrawnStudents, setDbWithdrawnStudents] = React.useState([]);
const [studentViewMode, setStudentViewMode] = React.useState('active'); // 'active' | 'withdrawn'
const [dbMembers, setDbMembers] = React.useState([]);
const [dbTeachers, setDbTeachers] = React.useState([]);
const [dbTeacherProfiles, setDbTeacherProfiles] = React.useState([]);
const [teacherClasses, setTeacherClasses] = React.useState([]);
const [dbPending, setDbPending] = React.useState([]);
const [saving, setSaving] = React.useState(false);
const [teacherAssignDrafts, setTeacherAssignDrafts] = React.useState({});
const [addCourseStudentId, setAddCourseStudentId] = React.useState(null);
const [acSubject, setAcSubject] = React.useState('전체');
const [acLevel, setAcLevel] = React.useState('전체');
const [acGrade, setAcGrade] = React.useState('전체');
const [acTeacher, setAcTeacher] = React.useState('전체');
const [acName, setAcName] = React.useState('');
const [viewsLevel, setViewsLevel] = React.useState('전체');
const [viewsGrade, setViewsGrade] = React.useState('전체');
const [viewsCourse, setViewsCourse] = React.useState('전체');
const [viewsSearch, setViewsSearch] = React.useState('');
const [viewsExpandedId, setViewsExpandedId] = React.useState(null);
const [viewsDataMap, setViewsDataMap] = React.useState({});
const [adminRecords, setAdminRecords] = React.useState([]);
const [recordsTeacherFilter, setRecordsTeacherFilter] = React.useState('전체');
const [recordsTypeFilter, setRecordsTypeFilter] = React.useState('전체');
const [recordsSearch, setRecordsSearch] = React.useState('');
const [classStudents, setClassStudents] = React.useState({}); // { class_id: [student_id, ...] }
const [adminAnalysis, setAdminAnalysis] = React.useState([]);
const [analysisClassId, setAnalysisClassId] = React.useState('');
const [analysisSubject, setAnalysisSubject] = React.useState('전체');
const [analysisTestName, setAnalysisTestName] = React.useState('전체');
const [analysisTeacherId, setAnalysisTeacherId] = React.useState('전체');
const [analysisSearch, setAnalysisSearch] = React.useState('');
const [analysisStudentId, setAnalysisStudentId] = React.useState('');
const [reportStudentId, setReportStudentId] = React.useState('');
const [kakaoTarget, setKakaoTarget] = React.useState(null);
const [adminNotificationLogs, setAdminNotificationLogs] = React.useState([]);
const [adminAttachments, setAdminAttachments] = React.useState([]);
const [adminAttachLoading, setAdminAttachLoading] = React.useState(false);
const [adminScrList, setAdminScrList] = React.useState([]);
const [adminScrLoading, setAdminScrLoading] = React.useState(false);
const [adminScrTeacherFilter, setAdminScrTeacherFilter] = React.useState('전체');
// 레벨테스트
const [adminLevelTests, setAdminLevelTests] = React.useState([]);
const [adminTestKindFilter, setAdminTestKindFilter] = React.useState('all');
const [aboutDraft, setAboutDraft] = React.useState(null);
const [aboutSaving, setAboutSaving] = React.useState(false);
const [programsDraft, setProgramsDraft] = React.useState(null);
const [programsSaving, setProgramsSaving] = React.useState(false);
const [eventBtnDraft, setEventBtnDraft] = React.useState(null);
const [eventBtnSaving, setEventBtnSaving] = React.useState(false);
const [featureSaving, setFeatureSaving] = React.useState(false);
const [footerDraft, setFooterDraft] = React.useState(null);
const [footerSaving, setFooterSaving] = React.useState(false);
const [adminLevelTestRequests, setAdminLevelTestRequests] = React.useState({}); // { exam_id: [requests] }
const [adminLevelTestSubs, setAdminLevelTestSubs] = React.useState({}); // { exam_id: [submissions] }
const [adminLevelTestLoading, setAdminLevelTestLoading] = React.useState(false);
const [adminLtFormOpen, setAdminLtFormOpen] = React.useState(false);

// ── 모바일 뒤로가기: 관리자 탭/모달 단계별 복귀 (PWA 종료 방지) ──
React.useEffect(function(){
  if (typeof window === 'undefined') return;
  function onPop(e) {
    if (adminLtFormOpen) {
      e.stopImmediatePropagation();
      setAdminLtFormOpen(false);
      try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
      return;
    }
    if (tab !== 'home') {
      e.stopImmediatePropagation();
      setTab('home');
      try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
      return;
    }
    // 관리자 홈이면 통과 → page='home'으로 복귀
  }
  window.addEventListener('popstate', onPop, true);
  return function(){ window.removeEventListener('popstate', onPop, true); };
}, [tab, adminLtFormOpen]);

// 관리자 탭/모달 진입 시 history에 한 단계 push
React.useEffect(function(){
  if (typeof window === 'undefined') return;
  var deep = (tab !== 'home') || adminLtFormOpen;
  if (!deep) return;
  var st = window.history.state || {};
  if (!st.b2Inner) {
    try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
  }
}, [tab, adminLtFormOpen]);
const [adminLtDraft, setAdminLtDraft] = React.useState({ title:'', subject:'', school_level:'중', target_grade:'', target_semester:'', min_score:'0', max_score:'100', description:'', files:[], question_count:'10', choices_per_question:'5', text_question_count:'0', time_limit_minutes:'0', answer_key:{} });
const [adminLtUploading, setAdminLtUploading] = React.useState(false);
const [adminScrMode, setAdminScrMode] = React.useState('change'); // 'change' | 'academic'
const [adminAcademicList, setAdminAcademicList] = React.useState([]);
const [adminAcademicLoading, setAdminAcademicLoading] = React.useState(false);
const [adminAcademicCategoryFilter, setAdminAcademicCategoryFilter] = React.useState('전체');
const [classManageDrafts, setClassManageDrafts] = React.useState({}); // { teacher_id: { name, grade, subject, level } }
const [expandedClassId, setExpandedClassId] = React.useState(null);
const [classStudentSearch, setClassStudentSearch] = React.useState('');

const sb = window.supabase;

React.useEffect(() => {
if (!authed) return;
loadAllData();
}, [authed]);

async function loadAllData() {
const { data: banners } = await sb.from('banners').select('*').order('sort_order');
if (banners && banners.length > 0) setState(s => ({ ...s, banners }));

const { data: notices } = await sb.from('notices').select('*').order('created_at', { ascending: false });
if (notices) setState(s => ({ ...s, notices }));

const { data: announcements } = await sb.from('announcements').select('*').order('created_at', { ascending: false });
if (announcements) setState(s => ({ ...s, announcements }));

const { data: courses } = await sb.from('courses').select(`*, subjects(name,color), videos(*)`).order('sort_order');
if (courses && courses.length > 0) {
const mapped = courses.map(c => ({
id: c.id, subject: c.subjects?.name || '', color: c.subjects?.color || '#E60012',
name: c.title, description: c.description, grade: c.grade || '', level: c.level || '', class_id: c.class_id || '',
days: c.days || 0, duration: c.duration || 0, teacher: c.teacher || '',
price: c.price || '', badge: c.badge || null, intro: c.intro || '',
target: c.target || '', curriculum: c.curriculum || '', teacherDesc: c.teacher_desc || '',
youtube: c.youtube || '',
lectures: (c.videos || []).sort((a,b) => a.sort_order - b.sort_order).map(v => ({
id: v.id, title: v.title, videoUrl: B2Utils.lectureVideoUrl(v), youtubeId: v.youtube_id || '',
})),
}));
setState(s => ({ ...s, courses: mapped }));
}

const { data: students } = await sb.from('students').select('*, enrollments(course_id)').eq('is_active', true).eq('role', 'student');
if (students) {
const mapped = students.map(st => ({
id: st.id, name: st.name, email: st.email, provider: st.login_provider,
grade: st.grade || '', school: st.school || '', subjects: st.subjects || [],
enrolledCourses: (st.enrollments || []).map(e => e.course_id),
phone: st.phone || '', parent_phone: st.parent_phone || '', parent_id: st.parent_id || null,
address: st.address || '',
created_at: st.created_at || '', withdrawn_at: st.withdrawn_at || '',
role: 'student',
}));
setDbStudents(mapped);
}

const { data: withdrawnStudents } = await sb.from('students').select('*, enrollments(course_id)').eq('is_active', false).eq('role', 'student');
if (withdrawnStudents) {
const mappedW = withdrawnStudents.map(st => ({
id: st.id, name: st.name, email: st.email, provider: st.login_provider,
grade: st.grade || '', school: st.school || '', subjects: st.subjects || [],
enrolledCourses: (st.enrollments || []).map(e => e.course_id),
phone: st.phone || '', parent_phone: st.parent_phone || '', parent_id: st.parent_id || null,
address: st.address || '',
created_at: st.created_at || '', withdrawn_at: st.withdrawn_at || '',
role: 'student',
}));
setDbWithdrawnStudents(mappedW);
}

const { data: allMembers } = await sb.from('students').select('*, enrollments(course_id)').in('role', ['student','parent','teacher']).eq('is_active', true);
if (allMembers) {
setDbMembers(allMembers.map(m => ({
id: m.id, name: m.name, email: m.email, provider: m.login_provider,
role: m.role, grade: m.grade || '', school: m.school || '',
phone: m.phone || '', address: m.address || '', createdAt: m.created_at,
parentId: m.parent_id || null,
isEnrollee: (m.enrollments || []).length > 0,
})));
}

const { data: teachers } = await sb.from('students').select('*').in('role', ['teacher','pending_teacher']);
if (teachers) {
setDbTeachers(teachers.map(t => ({
id: t.id, name: t.name, email: t.email, role: t.role,
subjects: t.subjects || [], grade: t.grade || '', school: t.school || '', createdAt: t.created_at,
})));
}

const { data: teacherProfiles } = await sb.from('teachers').select('*');
if (teacherProfiles) setDbTeacherProfiles(teacherProfiles);

const { data: classRows } = await sb.from('classes').select('*').order('name', { ascending:true });
if (classRows) setTeacherClasses(classRows);

const { data: pending } = await sb.from('students').select('*').in('role', ['pending_student','pending_parent','pending_teacher']);
if (pending) setDbPending(pending.map(p => ({ id: p.id, name: p.name, phone: p.phone, role: p.role, grade: p.grade, school: p.school })));

const { data: notes } = await sb.from('teacher_notes')
.select('*, students(name, grade), teachers(name)')
.order('note_date', { ascending: false });
if (notes) setAdminRecords(notes);

const { data: clsStudents } = await sb.from('class_students').select('*');
if (clsStudents) {
  var grouped = {};
  clsStudents.forEach(function(row){
    if (!grouped[row.class_id]) grouped[row.class_id] = [];
    grouped[row.class_id].push(row.student_id);
  });
  setClassStudents(grouped);
}

const { data: scores, error: scoresError } = await sb.from('test_scores')
  .select('*, students!test_scores_student_id_fkey(name, grade), teachers!test_scores_teacher_id_fkey(name)')
  .order('test_date', { ascending: false });
if (scoresError) console.error('test_scores load error:', scoresError.message || scoresError);
if (scores) setAdminAnalysis(scores);
}

async function loadAdminAttachments() {
  setAdminAttachLoading(true);
  var sb = window.supabase;
  var { data } = await sb.from('attachments').select('*').order('created_at', { ascending:false });
  setAdminAttachments(data || []);
  setAdminAttachLoading(false);
}
function adminAttachmentPublicUrl(path) {
  var sb = window.supabase;
  var { data } = sb.storage.from('attachments').getPublicUrl(path);
  return data.publicUrl;
}
function adminFormatBytes(n) {
  var v = Number(n) || 0;
  if (v < 1024) return v + ' B';
  if (v < 1024*1024) return (v/1024).toFixed(1) + ' KB';
  return (v/1024/1024).toFixed(1) + ' MB';
}
async function deleteAdminAttachment(att) {
  if (!confirm('이 자료를 삭제하시겠습니까?')) return;
  var sb = window.supabase;
  try {
    await sb.storage.from('attachments').remove([att.file_path]);
    await sb.from('attachments').delete().eq('id', att.id);
    await loadAdminAttachments();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
}

async function loadAboutContent() {
  try {
    var v = await window.B2Utils.loadSiteContent('about');
    setAboutDraft(v || {});
  } catch (e) { console.error('학원안내 로드 실패:', e); setAboutDraft({}); }
}
async function loadFooterContent() {
  try {
    var v = await window.B2Utils.loadSiteContent('footer');
    setFooterDraft(v || { company_name:'', ceo:'', biz_no:'', address:'', phone:'', email:'', hours:'', copyright:'' });
  } catch (e) { setFooterDraft({}); }
}
async function saveFooterContent() {
  if (!footerDraft) return;
  setFooterSaving(true);
  try {
    var { error } = await window.B2Utils.saveSiteContent('footer', footerDraft);
    if (error) throw error;
    alert('푸터 정보가 저장되었습니다.');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setFooterSaving(false); }
}

async function saveFeatureContent() {
  setFeatureSaving(true);
  try {
    var fields = ['featureEyebrow','featureTitle','featureBody','featureCta1','featureCta2','heroTitle','featureBgColor','featureTextColor'];
    var payload = {};
    fields.forEach(function(f){ if (state.content && state.content[f] != null) payload[f] = state.content[f]; });
    var { error } = await window.B2Utils.saveSiteContent('feature', payload);
    if (error) throw error;
    alert('섹션 편집 변경사항이 저장되었습니다.');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setFeatureSaving(false); }
}

async function loadEventBtn() {
  try {
    var v = await window.B2Utils.loadSiteContent('event_button');
    setEventBtnDraft(v || { enabled:true, badge:'EVENT', text:'무료 레벨테스트', target_page:'leveltest' });
  } catch (e) { console.error('이벤트 버튼 로드 실패:', e); setEventBtnDraft({ enabled:true, badge:'EVENT', text:'무료 레벨테스트', target_page:'leveltest' }); }
}
async function saveEventBtn() {
  if (!eventBtnDraft) return;
  setEventBtnSaving(true);
  try {
    var { error } = await window.B2Utils.saveSiteContent('event_button', eventBtnDraft);
    if (error) throw error;
    alert('이벤트 버튼이 저장되었습니다. (메인 페이지 새로고침 시 반영)');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setEventBtnSaving(false); }
}

async function loadProgramsContent() {
  try {
    var v = await window.B2Utils.loadSiteContent('programs');
    setProgramsDraft(v || {});
  } catch (e) { console.error('프로그램 로드 실패:', e); setProgramsDraft({}); }
}
async function saveProgramsContent() {
  if (!programsDraft) return;
  setProgramsSaving(true);
  try {
    var { error } = await window.B2Utils.saveSiteContent('programs', programsDraft);
    if (error) throw error;
    alert('프로그램 콘텐츠가 저장되었습니다.');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setProgramsSaving(false); }
}
async function uploadProgramsImage(file, key) {
  if (!file) return null;
  var sb = window.supabase;
  var ext = (file.name.split('.').pop() || 'png').toLowerCase();
  var path = 'programs/' + key + '_' + Date.now() + '.' + ext;
  var up = await sb.storage.from('attachments').upload(path, file, { cacheControl:'3600', upsert:false });
  if (up.error) throw up.error;
  var { data } = sb.storage.from('attachments').getPublicUrl(path);
  return data && data.publicUrl ? data.publicUrl : null;
}

async function uploadAboutImage(file, key) {
  if (!file) return null;
  var sb = window.supabase;
  var ext = (file.name.split('.').pop() || 'png').toLowerCase();
  var path = 'about/' + key + '_' + Date.now() + '.' + ext;
  var up = await sb.storage.from('attachments').upload(path, file, { cacheControl:'3600', upsert:false });
  if (up.error) throw up.error;
  var { data } = sb.storage.from('attachments').getPublicUrl(path);
  return data && data.publicUrl ? data.publicUrl : null;
}
async function saveAboutContent() {
  if (!aboutDraft) return;
  setAboutSaving(true);
  try {
    var { error } = await window.B2Utils.saveSiteContent('about', aboutDraft);
    if (error) throw error;
    alert('학원안내 콘텐츠가 저장되었습니다.');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setAboutSaving(false); }
}

async function loadAdminLevelTests() {
  setAdminLevelTestLoading(true);
  var sb = window.supabase;
  try {
    var { data: tests } = await sb.from('exams').select('*').in('kind', ['level','weekly','monthly','homework']).order('created_at', { ascending: false });
    setAdminLevelTests(tests || []);
    if (tests && tests.length > 0) {
      var ids = tests.map(function(t){ return t.id; });
      var { data: reqs } = await sb.from('level_test_requests').select('*').in('exam_id', ids);
      var rg = {};
      (reqs || []).forEach(function(r){ (rg[r.exam_id] = rg[r.exam_id] || []).push(r); });
      setAdminLevelTestRequests(rg);
      var { data: subs } = await sb.from('exam_submissions').select('*').in('exam_id', ids);
      var sg = {};
      (subs || []).forEach(function(s){ (sg[s.exam_id] = sg[s.exam_id] || []).push(s); });
      setAdminLevelTestSubs(sg);
    } else {
      setAdminLevelTestRequests({}); setAdminLevelTestSubs({});
    }
  } catch (e) {
    console.error('레벨테스트 로드 실패:', e);
    setAdminLevelTests([]); setAdminLevelTestRequests({}); setAdminLevelTestSubs({});
  } finally {
    setAdminLevelTestLoading(false);
  }
}
function adminOpenLtForm() {
  setAdminLtDraft({ id:null, kind:'level', existing_paths:[], title:'', subject:'', school_level:'중', target_grade:'', target_semester:'', min_score:'0', max_score:'100', description:'', files:[], question_count:'10', choices_per_question:'5', text_question_count:'0', time_limit_minutes:'0', answer_key:{}, allow_audio_answer:false });
  setAdminLtFormOpen(true);
}
function adminOpenLtEditForm(t) {
  setAdminLtDraft({
    id: t.id,
    kind: t.kind || 'level',
    existing_paths: Array.isArray(t.image_paths) ? t.image_paths : [],
    title: t.title || '',
    subject: t.subject || '',
    school_level: t.school_level || '중',
    target_grade: t.target_grade || '',
    target_semester: t.target_semester || '',
    min_score: t.min_score != null ? String(t.min_score) : '0',
    max_score: t.max_score != null ? String(t.max_score) : '100',
    description: t.description || '',
    files: [],
    question_count: t.question_count != null ? String(t.question_count) : '0',
    choices_per_question: t.choices_per_question != null ? String(t.choices_per_question) : '5',
    text_question_count: t.text_question_count != null ? String(t.text_question_count) : '0',
    time_limit_minutes: t.time_limit_minutes != null ? String(t.time_limit_minutes) : '0',
    answer_key: (t.answer_key && typeof t.answer_key === 'object') ? Object.assign({}, t.answer_key) : {},
    allow_audio_answer: !!t.allow_audio_answer,
  });
  setAdminLtFormOpen(true);
}
function adminCloseLtForm() { setAdminLtFormOpen(false); }
async function adminSubmitLevelTest() {
  var sb = window.supabase;
  var d = adminLtDraft;
  var isEdit = !!d.id;
  if (!d.title.trim()) { alert('제목을 입력해 주세요.'); return; }
  var existingPaths = Array.isArray(d.existing_paths) ? d.existing_paths : [];
  if (!isEdit && (!d.files || d.files.length === 0)) { alert('시험지 이미지를 1장 이상 업로드해 주세요.'); return; }
  if (isEdit && (!d.files || d.files.length === 0) && existingPaths.length === 0) { alert('시험지 이미지를 1장 이상 업로드해 주세요.'); return; }
  var qc = parseInt(d.question_count, 10); if (isNaN(qc) || qc < 0) qc = 0;
  var cpq = parseInt(d.choices_per_question, 10); if (isNaN(cpq) || cpq < 2) cpq = 5; if (cpq > 9) cpq = 9;
  var tqc = parseInt(d.text_question_count, 10); if (isNaN(tqc) || tqc < 0) tqc = 0;
  var isHw = d.kind === 'homework';
  if (qc === 0 && tqc === 0 && !(isHw && d.allow_audio_answer)) {
    alert(isHw ? '객관식 / 서술형 / 녹음 중 최소 한 가지 답안 종류를 선택해 주세요.' : '객관식 또는 서술형 문제 수 중 하나는 1 이상이어야 합니다.');
    return;
  }
  var tlm = parseInt(d.time_limit_minutes, 10); if (isNaN(tlm) || tlm < 0) tlm = 0;
  if (!d.school_level) { alert('학교급을 선택해 주세요.'); return; }
  if (!d.target_grade) { alert('대상 학년을 선택해 주세요.'); return; }
  var minS = parseInt(d.min_score, 10); if (isNaN(minS)) minS = 0;
  var maxS = parseInt(d.max_score, 10); if (isNaN(maxS)) maxS = 100;
  if (minS < 0) minS = 0; if (maxS > 100) maxS = 100;
  if (minS > maxS) { alert('최소 점수가 최대 점수보다 클 수 없습니다.'); return; }
  setAdminLtUploading(true);
  try {
    var paths = existingPaths.slice();
    if (d.files && d.files.length > 0) {
      // 새 이미지 업로드 시 기존 이미지 모두 교체
      if (isEdit && existingPaths.length > 0) {
        try { await sb.storage.from('attachments').remove(existingPaths); } catch(e) {}
      }
      paths = [];
      for (var i = 0; i < d.files.length; i++) {
        var f = d.files[i];
        var ext = (f.name.split('.').pop() || 'png').toLowerCase();
        var path = 'exams/level/' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        var up = await sb.storage.from('attachments').upload(path, f, { cacheControl:'3600', upsert:false });
        if (up.error) throw up.error;
        paths.push(path);
      }
    }
    var kindVal = (d.kind === 'weekly' || d.kind === 'monthly' || d.kind === 'homework') ? d.kind : 'level';
    var row = {
      kind: kindVal,
      title: d.title.trim(),
      subject: d.subject.trim() || null,
      school_level: d.school_level,
      target_grade: d.target_grade,
      target_semester: d.target_semester || null,
      min_score: minS,
      max_score: maxS,
      answer_key: d.answer_key || {},
      objective_total: qc,
      description: d.description.trim() || null,
      image_paths: paths,
      question_count: qc,
      choices_per_question: cpq,
      text_question_count: tqc,
      allow_text_answer: tqc > 0,
      time_limit_minutes: tlm,
      allow_audio_answer: !!d.allow_audio_answer && kindVal === 'homework',
    };
    var kindLabel = kindVal === 'weekly' ? '주간 테스트' : (kindVal === 'monthly' ? '월말 테스트' : (kindVal === 'homework' ? '숙제' : '레벨테스트'));
    if (isEdit) {
      var { error } = await sb.from('exams').update(row).eq('id', d.id);
      if (error) throw error;
      alert(kindLabel + '이(가) 수정되었습니다.');
    } else {
      row.class_id = null;
      row.teacher_id = null;
      row.teacher_name = '관리자';
      row.status = 'open';
      var { error: e2 } = await sb.from('exams').insert(row);
      if (e2) throw e2;
      alert(kindLabel + '이(가) 발행되었습니다.');
    }
    adminCloseLtForm();
    await loadAdminLevelTests();
  } catch (e) {
    alert((isEdit ? '수정' : '발행') + ' 실패: ' + (e.message || e));
  } finally {
    setAdminLtUploading(false);
  }
}
async function adminToggleLtStatus(t) {
  var nextStatus = t.status === 'open' ? 'closed' : 'open';
  if (!confirm(nextStatus === 'closed' ? '이 레벨테스트를 마감하시겠습니까?' : '다시 응시 가능 상태로 변경하시겠습니까?')) return;
  var sb = window.supabase;
  try {
    await sb.from('exams').update({ status: nextStatus }).eq('id', t.id);
    await loadAdminLevelTests();
  } catch (e) { alert('변경 실패: ' + (e.message || e)); }
}
async function adminSaveGrading(submissionId, payload) {
  var sb = window.supabase;
  try {
    payload.graded_at = new Date().toISOString();
    var { error } = await sb.from('exam_submissions').update(payload).eq('id', submissionId);
    if (error) throw error;
    alert('채점이 저장되었습니다.');
    await loadAdminLevelTests();
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
}

async function adminDeleteLevelTest(t) {
  var label = t.kind === 'weekly' ? '주간 테스트' : (t.kind === 'monthly' ? '월말 테스트' : (t.kind === 'homework' ? '숙제' : '레벨테스트'));
  if (!confirm('이 ' + label + '을(를) 삭제하시겠습니까? 제출 내역과 답안도 함께 삭제됩니다.')) return;
  var sb = window.supabase;
  try {
    var paths = Array.isArray(t.image_paths) ? t.image_paths : [];
    if (paths.length > 0) { try { await sb.storage.from('attachments').remove(paths); } catch(e) {} }
    await sb.from('exams').delete().eq('id', t.id);
    await loadAdminLevelTests();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
}

async function loadAdminScheduleRequests() {
  setAdminScrLoading(true);
  var sb = window.supabase;
  try {
    var { data } = await sb.from('schedule_change_requests').select('*').order('created_at', { ascending:false });
    setAdminScrList(data || []);
  } catch (e) {
    console.error('일정 신청 로드 실패:', e);
    setAdminScrList([]);
  } finally {
    setAdminScrLoading(false);
  }
}
async function loadAdminAcademicSchedules() {
  setAdminAcademicLoading(true);
  var sb = window.supabase;
  try {
    var { data } = await sb.from('academic_schedules').select('*').order('start_date', { ascending:false });
    setAdminAcademicList(data || []);
  } catch (e) {
    console.error('학사일정 로드 실패:', e);
    setAdminAcademicList([]);
  } finally {
    setAdminAcademicLoading(false);
  }
}
async function deleteAdminAcademicSchedule(item) {
  if (!confirm('이 학사일정을 삭제하시겠습니까?')) return;
  var sb = window.supabase;
  try {
    await sb.from('academic_schedules').delete().eq('id', item.id);
    await loadAdminAcademicSchedules();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
}
function adminAcademicCategoryLabel(c) {
  if (c === 'vacation') return '방학';
  if (c === 'exam') return '시험';
  return '기타';
}
function adminAcademicCategoryColor(c) {
  if (c === 'vacation') return '#1d4ed8';
  if (c === 'exam') return '#c87000';
  return '#6b7280';
}

async function createTeacherClass(teacher, draft) {
if (!draft.name || !draft.name.trim()) { alert('반 이름을 입력해 주세요.'); return; }
if (!draft.grade) { alert('학년을 선택해 주세요.'); return; }
var profile = await ensureTeacherProfile(teacher);
if (!profile) return;
var payload = { teacher_id: profile.id, name: draft.name.trim(), grade: draft.grade, subject: draft.subject || '', class_name: draft.name.trim() };
var { data, error } = await sb.from('classes').insert(payload).select('*').single();
if (error) { alert('반 생성 실패: ' + error.message); return; }
setTeacherClasses(function(prev){ return [...(prev||[]), data]; });
setClassManageDrafts(function(prev){ var n = Object.assign({}, prev); delete n[teacher.id]; return n; });
}

async function deleteTeacherClass(classId) {
if (!confirm('이 반을 삭제할까요? 배정된 학생도 함께 제거됩니다.')) return;
await sb.from('class_students').delete().eq('class_id', classId);
var { error } = await sb.from('classes').delete().eq('id', classId);
if (error) { alert('반 삭제 실패: ' + error.message); return; }
setTeacherClasses(function(prev){ return (prev||[]).filter(function(c){ return c.id !== classId; }); });
setClassStudents(function(prev){ var n = Object.assign({}, prev); delete n[classId]; return n; });
if (expandedClassId === classId) setExpandedClassId(null);
}

async function addStudentToClass(classId, studentId) {
var current = classStudents[classId] || [];
if (current.includes(studentId)) return;
var { error } = await sb.from('class_students').insert({ class_id: classId, student_id: studentId });
if (error) { alert('학생 배정 실패: ' + error.message); return; }
setClassStudents(function(prev){ var n = Object.assign({}, prev); n[classId] = (n[classId]||[]).concat(studentId); return n; });
}

async function removeStudentFromClass(classId, studentId) {
var { error } = await sb.from('class_students').delete().eq('class_id', classId).eq('student_id', studentId);
if (error) { alert('학생 해제 실패: ' + error.message); return; }
setClassStudents(function(prev){ var n = Object.assign({}, prev); n[classId] = (n[classId]||[]).filter(function(id){ return id !== studentId; }); return n; });
}

function getRealClassesForTeacher(teacher) {
var profile = getTeacherProfileByEmail(teacher);
var teacherId = profile ? profile.id : teacher.id;
return (teacherClasses || []).filter(function(cls){
  return String(cls.teacher_id) === String(teacherId) && cls.grade;
});
}

/* ── 수강생 엑셀 가져오기/내보내기 ─────────────────── */
// 가져오기/템플릿: 기본 6개 필드 (이름·학생전화·학부모전화·주소·최초 등원일·퇴원일)
const STUDENT_IMPORT_HEADERS = ['이름','학생전화','학부모전화','주소','최초 등원일','퇴원일'];
const STUDENT_IMPORT_COLS = [{wch:10},{wch:16},{wch:16},{wch:30},{wch:14},{wch:14}];
// 내보내기: 기본 6개 + 배정 정보 (학교급·학년·학교·수강 과목·담당 선생님(반))
const STUDENT_EXPORT_HEADERS = ['이름','학생전화','학부모전화','주소','학교급','학년','학교','수강 과목','담당 선생님(반)','최초 등원일','퇴원일'];
const STUDENT_EXPORT_COLS = [{wch:10},{wch:16},{wch:16},{wch:30},{wch:8},{wch:8},{wch:14},{wch:30},{wch:30},{wch:14},{wch:14}];

// 다양한 헤더 변형을 한 값으로 통일 — 사용자가 다른 학원 시스템에서 받은 엑셀도 인식
function pickField(row /*, ...candidates */) {
  for (var i = 1; i < arguments.length; i++) {
    var k = arguments[i];
    var v = row[k];
    if (v !== undefined && v !== '' && v !== null) return v;
  }
  return '';
}

function ensureXlsxLoaded() {
  if (window.XLSX) return true;
  alert('엑셀 라이브러리가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
  return false;
}

function fmtExcelDate(ts) {
  if (!ts) return '';
  return String(ts).slice(0, 10); // YYYY-MM-DD
}

function exportStudentsExcel(list, viewMode) {
  if (!ensureXlsxLoaded()) return;
  // 학생별 (선생님-반) 라벨 매핑 사전 구축
  var teacherClassByStudent = {};
  Object.keys(classStudents || {}).forEach(function(classId) {
    var members = (classStudents[classId] || []);
    var cls = (teacherClasses || []).find(function(c) { return String(c.id) === String(classId); });
    if (!cls) return;
    var teacher = (dbTeachers || []).find(function(t) { return String(t.id) === String(cls.teacher_id); });
    var teacherName = teacher ? (teacher.name || '선생님') : '';
    var clsName = cls.name || '반';
    var label = (teacherName ? teacherName + '-' : '') + clsName;
    members.forEach(function(sid) {
      if (!teacherClassByStudent[sid]) teacherClassByStudent[sid] = [];
      teacherClassByStudent[sid].push(label);
    });
  });
  var rows = list.map(function(s) {
    return {
      '이름': s.name || '',
      '학생전화': s.phone || '',
      '학부모전화': s.parent_phone || '',
      '주소': s.address || '',
      '학교급': levelFromGrade(s.grade),
      '학년': s.grade || '',
      '학교': s.school || '',
      '수강 과목': (s.subjects || []).join(', '),
      '담당 선생님(반)': (teacherClassByStudent[s.id] || []).join(', '),
      '최초 등원일': fmtExcelDate(s.created_at),
      '퇴원일': fmtExcelDate(s.withdrawn_at),
    };
  });
  var ws = window.XLSX.utils.json_to_sheet(rows.length ? rows : [{}], { header: STUDENT_EXPORT_HEADERS });
  ws['!cols'] = STUDENT_EXPORT_COLS;
  var wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, '수강생');
  var ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
  var prefix = viewMode === 'withdrawn' ? '퇴원생_' : '수강생_';
  window.XLSX.writeFile(wb, prefix + ts + '.xlsx');
}

function downloadStudentTemplate() {
  if (!ensureXlsxLoaded()) return;
  var sample = [{
    '이름':'홍길동',
    '학생전화':'01012345678',
    '학부모전화':'01098765432',
    '주소':'인천 서구 ...',
    '최초 등원일':'2025-03-15',
    '퇴원일':''
  }];
  var ws = window.XLSX.utils.json_to_sheet(sample, { header: STUDENT_IMPORT_HEADERS });
  ws['!cols'] = STUDENT_IMPORT_COLS;
  var wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, '수강생');
  window.XLSX.writeFile(wb, '수강생_템플릿.xlsx');
}

function normPhoneDigits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }

function parseSubjectsCell(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(function(x){ return String(x).trim(); }).filter(Boolean);
  return String(v).split(/[,/·\s]+/).map(function(s){ return s.trim(); }).filter(Boolean);
}

// '2025-03-15' / '2025/3/15' / Date 객체 / Excel 시리얼 숫자 모두 ISO 문자열로 변환. 비어있으면 null.
function parseDateCell(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  var s = String(v).trim();
  if (!s) return null;
  var m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (m) {
    var y = m[1];
    var mo = String(parseInt(m[2],10)).padStart(2,'0');
    var d = String(parseInt(m[3],10)).padStart(2,'0');
    return y + '-' + mo + '-' + d + 'T00:00:00.000Z';
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    // Excel 시리얼: 1899-12-30 기준 일수
    var serial = parseFloat(s);
    var ms = (serial - 25569) * 86400 * 1000;
    var dt = new Date(ms);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }
  return null;
}

async function importStudentsExcel(file) {
  if (!ensureXlsxLoaded()) return;
  try {
    var buf = await file.arrayBuffer();
    var wb = window.XLSX.read(buf, { type:'array', cellDates: true });
    var ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) { alert('엑셀에 시트가 없습니다.'); return; }
    var rows = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) { alert('엑셀에 데이터가 없습니다.'); return; }

    var errors = [];
    var valid = [];
    rows.forEach(function(r, i) {
      var rowNum = i + 2; // 헤더가 1행
      var name = String(pickField(r, '이름', '학생이름', '학생 이름')||'').trim();
      // 학생 전화: 학생전화 / 학생 연락처 / 학생 전화 / 전화번호 / 연락처
      var phone = normPhoneDigits(pickField(r, '학생전화', '학생 전화', '학생 연락처', '학생연락처', '전화번호', '연락처'));
      // 학부모 전화: 학부모전화 / 학부모 전화 / 학부모 연락처 / 학부모 전화번호 / 보호자전화 / 휴대전화1
      var parentPhone = normPhoneDigits(pickField(r, '학부모전화', '학부모 전화', '학부모 연락처', '학부모연락처', '학부모 전화번호', '보호자전화', '보호자 전화', '휴대전화1', '휴대전화'));
      // 필수: 이름
      if (!name) { errors.push(rowNum + '행: 이름 누락'); return; }
      var rawCreated = pickField(r, '최초 등원일', '최초등원일', '최초등록일', '등원일', '등록일');
      var rawWithdrawn = pickField(r, '퇴원일', '퇴원 일');
      var createdAt = parseDateCell(rawCreated);
      var withdrawnAt = parseDateCell(rawWithdrawn);
      var hasCreatedInput = rawCreated !== '' && rawCreated != null && rawCreated !== undefined;
      var hasWithdrawnInput = rawWithdrawn !== '' && rawWithdrawn != null && rawWithdrawn !== undefined;
      if (hasCreatedInput && !createdAt) errors.push(rowNum + '행: 최초 등원일 형식 오류 (예: 2025-03-15)');
      if (hasWithdrawnInput && !withdrawnAt) errors.push(rowNum + '행: 퇴원일 형식 오류 (예: 2025-03-15)');
      valid.push({
        name: name,
        phone: phone,
        address: String(pickField(r, '주소', '자택주소', '거주지', '집주소')||'').trim(),
        parent_phone: parentPhone,
        created_at: createdAt,
        withdrawn_at: withdrawnAt,
        has_withdrawn_input: hasWithdrawnInput,
        has_created_input: hasCreatedInput,
      });
    });

    var preview = '총 ' + rows.length + '행 중 ' + valid.length + '명 처리 가능';
    if (errors.length) {
      preview += '\n\n오류 ' + errors.length + '건:\n  ' + errors.slice(0,8).join('\n  ');
      if (errors.length > 8) preview += '\n  ... 외 ' + (errors.length - 8) + '건';
    }
    preview += '\n\n· 전화번호가 같은 기존 학생은 업데이트';
    preview += '\n· 전화번호가 없으면 항상 신규 추가 (중복 주의)';
    preview += '\n\n진행할까요?';
    if (!confirm(preview)) return;

    var phones = valid.map(function(v){ return v.phone; }).filter(Boolean);
    var existing = [];
    if (phones.length) {
      var res = await sb.from('students').select('id, phone, role').in('phone', phones);
      existing = res.data || [];
    }
    var existingByPhone = {};
    existing.forEach(function(e) { existingByPhone[normPhoneDigits(e.phone)] = e; });

    var added = 0, updated = 0, fails = 0, failMsgs = [];
    for (var i = 0; i < valid.length; i++) {
      var v = valid[i];
      // 전화번호가 있을 때만 기존 학생 매칭. 없으면 무조건 신규.
      var match = v.phone ? existingByPhone[v.phone] : null;
      var payload = {
        name: v.name, phone: v.phone,
        address: v.address, parent_phone: v.parent_phone,
      };
      // 최초등록일: 입력된 값이 있고 파싱 성공한 경우만 덮어씀
      if (v.has_created_input && v.created_at) payload.created_at = v.created_at;
      // 퇴원일: 입력 시 → withdrawn_at + is_active=false. 빈칸 → 기존값 유지(건드리지 않음).
      if (v.has_withdrawn_input && v.withdrawn_at) {
        payload.withdrawn_at = v.withdrawn_at;
        payload.is_active = false;
      }
      try {
        if (match) {
          var u = await sb.from('students').update(payload).eq('id', match.id);
          if (u.error) { fails++; failMsgs.push(v.name + ': ' + u.error.message); } else { updated++; }
        } else {
          payload.role = 'student';
          if (payload.is_active == null) payload.is_active = true;
          payload.privacy_agreed = true;
          payload.agreed_at = new Date().toISOString();
          if (!payload.created_at) payload.created_at = new Date().toISOString();
          var ins = await sb.from('students').insert(payload);
          if (ins.error) { fails++; failMsgs.push(v.name + ': ' + ins.error.message); } else { added++; }
        }
      } catch (e) {
        fails++; failMsgs.push(v.name + ': ' + (e && e.message ? e.message : '오류'));
      }
    }

    var done = '가져오기 완료\n신규 ' + added + '명 / 업데이트 ' + updated + '명' + (fails ? ' / 실패 ' + fails + '건' : '');
    if (failMsgs.length) done += '\n\n' + failMsgs.slice(0,5).join('\n') + (failMsgs.length>5?'\n... 외 '+(failMsgs.length-5)+'건':'');
    alert(done);
    await loadAllData();
  } catch (e) {
    alert('가져오기 실패: ' + (e && e.message ? e.message : '알 수 없는 오류'));
  }
}

async function loadStudentViews(studentId) {
if (viewsDataMap[studentId]) return;
const { data } = await sb.from('video_views')
.select('*, videos(title, course_id), courses(title, subjects(name))')
.eq('student_id', studentId)
.order('last_watched_at', { ascending: false });
setViewsDataMap(function(prev){ var n = Object.assign({}, prev); n[studentId] = data || []; return n; });
}

async function updateStudentGrade(studentId, grade) {
await sb.from('students').update({ grade }).eq('id', studentId);
setDbStudents(s => s.map(st => st.id === studentId ? { ...st, grade } : st));
showSaved();
}

async function toggleSubject(studentId, subject) {
const st = dbStudents.find(s => s.id === studentId);
const subjects = st.subjects || [];
const updated = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
await sb.from('students').update({ subjects: updated }).eq('id', studentId);
setDbStudents(s => s.map(st => st.id === studentId ? { ...st, subjects: updated } : st));
showSaved();
}

async function toggleEnroll(studentId, courseId) {
const st = dbStudents.find(s => s.id === studentId);
const enrolled = st.enrolledCourses.includes(courseId);
if (enrolled) {
await sb.from('enrollments').delete().eq('student_id', studentId).eq('course_id', courseId);
} else {
await sb.from('enrollments').insert({ student_id: studentId, course_id: courseId });
}
setDbStudents(s => s.map(st => {
if (st.id !== studentId) return st;
const ec = enrolled ? st.enrolledCourses.filter(c => c !== courseId) : [...st.enrolledCourses, courseId];
return { ...st, enrolledCourses: ec };
}));
showSaved();
}

async function approveTeacher(teacherId) {
const target = dbTeachers.find(t => t.id === teacherId);
await sb.from('students').update({ role: 'teacher', is_active: true }).eq('id', teacherId);
setDbTeachers(ts => ts.map(t => t.id === teacherId ? { ...t, role: 'teacher' } : t));
if (target) await ensureTeacherProfile({ ...target, role:'teacher' });
}

async function rejectTeacher(teacherId) {
if (!confirm('이 선생님 계정을 삭제할까요?')) return;
await sb.from('students').delete().eq('id', teacherId);
setDbTeachers(ts => ts.filter(t => t.id !== teacherId));
}

async function toggleTeacherSubject(teacherId, subject) {
const t = dbTeachers.find(x => x.id === teacherId);
const subjects = t.subjects || [];
const updated = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
await sb.from('students').update({ subjects: updated }).eq('id', teacherId);
setDbTeachers(ts => ts.map(x => x.id === teacherId ? { ...x, subjects: updated } : x));
}

function splitAdminList(value) {
if (Array.isArray(value)) return value.filter(Boolean).map(function(v) { return String(v).trim(); }).filter(Boolean);
return String(value || '').split(',').map(function(v) { return v.trim(); }).filter(Boolean);
}

function joinAdminList(list) {
return Array.from(new Set((list || []).filter(Boolean).map(function(v) { return String(v).trim(); }).filter(Boolean))).join(',');
}

function getTeacherGradeAssignments(teacher) {
var grades = splitAdminList(teacher && teacher.grade);
var paired = grades.filter(function(item) {
return TEACHER_ASSIGN_LEVELS.some(function(level) {
return String(item).indexOf(level + ' ') === 0;
});
});
return paired.length > 0 ? paired : grades;
}

function getTeacherAssignDraft(teacherId) {
return teacherAssignDrafts[teacherId] || { level:'초등', grades:[] };
}

function updateTeacherAssignDraft(teacherId, patch) {
setTeacherAssignDrafts(function(prev) {
var current = prev[teacherId] || { level:'초등', grades:[] };
return Object.assign({}, prev, { [teacherId]: Object.assign({}, current, patch) });
});
}

function levelsFromGradeAssignments(assignments) {
var levels = [];
(assignments || []).forEach(function(item) {
TEACHER_ASSIGN_LEVELS.forEach(function(level) {
if (String(item).indexOf(level + ' ') === 0 && !levels.includes(level)) levels.push(level);
});
});
return levels;
}

async function saveTeacherGradeAssignment(teacherId) {
var teacher = dbTeachers.find(function(x) { return x.id === teacherId; });
if (!teacher) return;
var draft = getTeacherAssignDraft(teacherId);
var level = draft.level || '초등';
var grades = Array.isArray(draft.grades) ? draft.grades : [];
if (grades.length === 0) { alert('배정할 학년을 1개 이상 선택해 주세요.'); return; }
var newAssignments = grades.map(function(grade) { return level + ' ' + grade; });
var current = getTeacherGradeAssignments(teacher);
var updatedAssignments = joinAdminList(current.concat(newAssignments)).split(',').filter(Boolean);
var updatedGrade = joinAdminList(updatedAssignments);
var updatedSchool = joinAdminList(levelsFromGradeAssignments(updatedAssignments));
await sb.from('students').update({ school: updatedSchool, grade: updatedGrade }).eq('id', teacherId);
setDbTeachers(function(ts) {
return ts.map(function(x) {
return x.id === teacherId ? Object.assign({}, x, { school: updatedSchool, grade: updatedGrade }) : x;
});
});
updateTeacherAssignDraft(teacherId, { grades:[] });
}

async function removeTeacherGradeAssignment(teacherId, assignment) {
var teacher = dbTeachers.find(function(x) { return x.id === teacherId; });
if (!teacher) return;
var updatedAssignments = getTeacherGradeAssignments(teacher).filter(function(item) { return item !== assignment; });
var updatedGrade = joinAdminList(updatedAssignments);
var updatedSchool = joinAdminList(levelsFromGradeAssignments(updatedAssignments));
await sb.from('students').update({ school: updatedSchool, grade: updatedGrade }).eq('id', teacherId);
setDbTeachers(function(ts) {
return ts.map(function(x) {
return x.id === teacherId ? Object.assign({}, x, { school: updatedSchool, grade: updatedGrade }) : x;
});
});
}

async function toggleTeacherLevel(teacherId, level) {
updateTeacherAssignDraft(teacherId, { level: level });
}

async function toggleTeacherGrade(teacherId, grade) {
var draft = getTeacherAssignDraft(teacherId);
var grades = Array.isArray(draft.grades) ? draft.grades : [];
var updatedGrades = grades.includes(grade)
? grades.filter(function(item) { return item !== grade; })
: grades.concat(grade);
updateTeacherAssignDraft(teacherId, { grades: updatedGrades });
}

async function updateTeacherLevel(teacherId, level) { return toggleTeacherLevel(teacherId, level); }
async function updateTeacherGrade(teacherId, grade) { return toggleTeacherGrade(teacherId, grade); }

function cleanAdminValue(value) { return String(value || '').trim().toLowerCase(); }

function getTeacherProfileByEmail(teacher) {
return (dbTeacherProfiles || []).find(function(profile) {
return cleanAdminValue(profile.email) === cleanAdminValue(teacher && teacher.email);
});
}

async function ensureTeacherProfile(teacher) {
var existing = getTeacherProfileByEmail(teacher);
if (existing) return existing;
var insertPayload = { name: teacher.name || '선생님', email: teacher.email || '' };
var result = await sb.from('teachers').insert(insertPayload).select('*').single();
if (result.error) { alert('선생님 포털 정보 생성 실패: ' + JSON.stringify(result.error)); return null; }
setDbTeacherProfiles(function(prev) { return [ ...(prev || []), result.data ]; });
return result.data;
}

function getTeacherClassId(teacher) {
var profile = getTeacherProfileByEmail(teacher);
return profile ? profile.id : teacher.id;
}

function getAssignedClassesForTeacher(teacher) {
var teacherClassId = getTeacherClassId(teacher);
return (teacherClasses || []).filter(function(cls) {
return String(cls.teacher_id) === String(teacherClassId);
});
}

function isCourseAssignedToTeacher(teacher, course) {
var assigned = getAssignedClassesForTeacher(teacher);
// 1차: 강좌가 class_id로 직접 묶인 경우 (정상 케이스)
if (course && course.class_id) {
  if (assigned.some(function(cls){ return String(cls.id) === String(course.class_id); })) return true;
}
// 2차: class_id가 없는 구버전 강좌는 이름·과목 매칭으로 폴백
return assigned.some(function(cls) {
var sameName = cleanAdminValue(cls.name) === cleanAdminValue(course.name);
var sameSubject = !cls.subject || !course.subject || cleanAdminValue(cls.subject) === cleanAdminValue(course.subject);
return sameName && sameSubject;
});
}

function getAssignedCourseIdsForTeacher(teacher) {
return (state.courses || []).filter(function(course) {
return isCourseAssignedToTeacher(teacher, course);
}).map(function(course) { return course.id; });
}

async function assignCourseToTeacher(teacher, course) {
var profile = await ensureTeacherProfile(teacher);
if (!profile) return;
if (isCourseAssignedToTeacher(teacher, course)) return;
var payload = { teacher_id: profile.id, name: course.name || '담당 강좌', subject: course.subject || '' };
var result = await sb.from('classes').insert(payload).select('*').single();
if (result.error) { alert('담당 강좌 배정 실패: ' + JSON.stringify(result.error)); return; }
setTeacherClasses(function(prev) { return [ ...(prev || []), result.data ]; });
}

async function unassignCourseFromTeacher(teacher, course) {
var assigned = getAssignedClassesForTeacher(teacher).filter(function(cls) {
var sameName = cleanAdminValue(cls.name) === cleanAdminValue(course.name);
var sameSubject = !cls.subject || !course.subject || cleanAdminValue(cls.subject) === cleanAdminValue(course.subject);
return sameName && sameSubject;
});
if (assigned.length === 0) return;
if (!confirm(teacher.name + ' 선생님의 담당 강좌에서 [' + course.name + ']을 해제할까요?')) return;
var ids = assigned.map(function(cls) { return cls.id; });
var result = await sb.from('classes').delete().in('id', ids);
if (result.error) { alert('담당 강좌 해제 실패: ' + JSON.stringify(result.error)); return; }
setTeacherClasses(function(prev) { return (prev || []).filter(function(cls) { return !ids.includes(cls.id); }); });
}

async function toggleTeacherCourse(teacher, course) {
if (isCourseAssignedToTeacher(teacher, course)) {
await unassignCourseFromTeacher(teacher, course);
} else {
await assignCourseToTeacher(teacher, course);
}
}

if (!authed) return React.createElement(AdminLogin, { onLogin:()=>setAuthed(true) });

const tabs = [
{ id:'banner',  label:'배너 관리' },
{ id:'notice',  label:'공지사항' },
{ id:'course',  label:'강좌 관리' },
{ id:'enrollee',label:'수강생 관리' },
{ id:'member',  label:'회원 정보' },
{ id:'teacher', label:'선생님 관리' },
{ id:'records', label:'선생님 기록' },
{ id:'analysis',label:'성적 분석' },
{ id:'views',   label:'학습 현황' },
{ id:'files',   label:'자료실' },
{ id:'schedule',label:'학원 일정' },
{ id:'leveltest',label:'시험 관리' },
{ id:'vocab',   label:'단어장' },
{ id:'feature', label:'섹션 편집' },
{ id:'about',   label:'학원안내 편집' },
{ id:'programs',label:'프로그램 편집' },
{ id:'eventbtn',label:'이벤트 버튼' },
{ id:'footer',  label:'푸터(사업자정보)' },
];

const tabGroups = [
{ id:'webapp',   label:'웹앱 관리', tabs:['banner','notice','feature','about','programs','eventbtn','footer'] },
{ id:'teachers', label:'강사',      tabs:['teacher','course','records'] },
{ id:'students', label:'수강생',    tabs:['enrollee','views','analysis'] },
{ id:'academy',  label:'학원 관리', tabs:['leveltest','vocab','member','schedule','files'] },
];

const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box' };
const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px', display:'block' };
const cardS = { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', marginBottom:'12px' };
const btnS = (color='#E60012') => ({ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' });
const btnOutS = { background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' };

const ROLE_LABEL = { student:'학생', parent:'학부모', teacher:'선생님' };


async function updateBanner(id, field, val) {
setState(s => ({ ...s, banners: s.banners.map(b => b.id===id ? {...b,[field]:val} : b) }));
await sb.from('banners').update({ [field]: val }).eq('id', id);
}
async function addBanner() {
const newB = { bg:'#E60012', subtitle:'새 배너 부제목', title:'새 배너 제목', label:'개강 예정', badge:'새로운', active:true, cta:'자세히 보기', link_to:'contact', sort_order: state.banners.length+1 };
const { data } = await sb.from('banners').insert(newB).select().single();
if (data) setState(s => ({ ...s, banners: [...s.banners, data] }));
}
async function deleteBanner(id) {
await sb.from('banners').delete().eq('id', id);
setState(s => ({ ...s, banners: s.banners.filter(b => b.id!==id) }));
if (editingBanner?.id===id) setEditingBanner(null);
}

async function uploadBannerVideo(banner, file) {
if (!file) return;
var ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
var path = 'banners/' + banner.id + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
var up = await sb.storage.from('attachments').upload(path, file, { cacheControl:'3600', upsert:false });
if (up.error) { alert('업로드 실패: ' + up.error.message); return; }
var pub = sb.storage.from('attachments').getPublicUrl(path);
var url = pub?.data?.publicUrl || '';
await updateBanner(banner.id, 'video_url', url);
}
async function removeBannerVideo(banner) {
if (!confirm('이 배너의 영상을 제거하시겠습니까?')) return;
await updateBanner(banner.id, 'video_url', '');
}
async function uploadBannerImage(banner, file) {
if (!file) return;
var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
var path = 'banners/' + banner.id + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
var up = await sb.storage.from('attachments').upload(path, file, { cacheControl:'3600', upsert:false });
if (up.error) { alert('업로드 실패: ' + up.error.message); return; }
var pub = sb.storage.from('attachments').getPublicUrl(path);
var url = pub?.data?.publicUrl || '';
await updateBanner(banner.id, 'image', url);
}
async function removeBannerImage(banner) {
if (!confirm('이 배너의 이미지를 제거하시겠습니까?')) return;
await updateBanner(banner.id, 'image', '');
}

async function addNotice() {
const today = new Date().toISOString().slice(0,10).replace(/-/g,'.');
const { data } = await sb.from('notices').insert({ type:'공지', text:'새 공지사항 제목', date: today }).select().single();
if (data) setState(s => ({ ...s, notices: [data, ...s.notices] }));
}
async function deleteNotice(id) {
await sb.from('notices').delete().eq('id', id);
setState(s => ({ ...s, notices: s.notices.filter(n => n.id!==id) }));
}
async function addAnnouncement() {
const today = new Date().toISOString().slice(0,10).replace(/-/g,'.');
const { data } = await sb.from('announcements').insert({ title:'새 공지사항', date: today }).select().single();
if (data) setState(s => ({ ...s, announcements: [data, ...s.announcements] }));
}
async function deleteAnnouncement(id) {
await sb.from('announcements').delete().eq('id', id);
setState(s => ({ ...s, announcements: s.announcements.filter(a => a.id!==id) }));
}

return React.createElement('div', { style:{ background:'#f2f0eb', minHeight:'80vh' } },

saveToast && React.createElement('div', { style:{ position:'fixed', bottom:'24px', right:'24px', background:'#1f7a3d', color:'#fff', padding:'12px 20px', borderRadius:'10px', fontSize:'14px', fontWeight:'700', fontFamily:'Manrope, sans-serif', boxShadow:'0 6px 16px rgba(0,0,0,0.18)', zIndex:99999, display:'flex', alignItems:'center', gap:'8px', pointerEvents:'none' } },
  React.createElement('span', { style:{ fontSize:'16px' } }, '✓'),
  React.createElement('span', null, '저장됨')
),

React.createElement('div', { style:{ background:'#1A1A1A', padding:'24px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, 'B2빅뱅학원 관리자'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.5)', fontFamily:'Manrope, sans-serif' } }, '관리자 전용 페이지')
)
),
React.createElement('button', { onClick:onLogout, style:{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그아웃')
),

// 홈이 아닐 때 상단에 '← 관리자 홈으로' 버튼
tab !== 'home' && React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding: adminIsMobile ? '12px 16px' : '14px 40px', display:'flex', alignItems:'center', gap:'12px' } },
  React.createElement('button', { onClick:function(){ setTab('home'); }, style:{ background:'none', border:'none', color:'#E60012', cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif' } }, '← 관리자 홈'),
  React.createElement('span', { style:{ fontSize:'13px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '·'),
  React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, (tabs.find(function(x){ return x.id === tab; }) || {}).label || '')
),

React.createElement('div', { style:{ maxWidth: adminIsMobile ? '960px' : '1280px', margin:'0 auto', padding: adminIsMobile ? '20px 16px' : '32px 40px' } },

// 홈 카드 그리드 (그룹별 섹션)
tab === 'home' && React.createElement('div', null,
  tabGroups.map(function(g){
    var groupColor = g.id === 'webapp' ? '#1A1A1A' : g.id === 'teachers' ? '#1d4ed8' : g.id === 'students' ? '#E60012' : g.id === 'academy' ? '#c87000' : '#6b7280';
    return React.createElement('div', { key:g.id, style:{ marginBottom: adminIsMobile ? '24px' : '36px' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' } },
        React.createElement('div', { style:{ width:'4px', height:'18px', background: groupColor, borderRadius:'2px' } }),
        React.createElement('h2', { style:{ fontSize: adminIsMobile ? '16px' : '18px', fontWeight:'800', color:'#1A1A1A', margin:0, fontFamily:'Manrope, sans-serif', letterSpacing:'-0.01em' } }, g.label),
        React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, g.tabs.length + '개')
      ),
      React.createElement('div', { style: adminIsMobile ? { display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px' } : { display:'flex', flexWrap:'wrap', gap:'8px' } },
        g.tabs.map(function(tid){
          var t = tabs.find(function(x){ return x.id === tid; });
          if (!t) return null;
          var pcStyle = { padding:'16px 18px', fontSize:'15px', display:'inline-flex', alignItems:'center', minHeight:'52px' };
          var mobileStyle = { padding:'14px', fontSize:'14px', display:'block', textAlign:'center' };
          return React.createElement('button', { key:tid, onClick:function(){ setTab(tid); setTabGroup(g.id); if (tid === 'files') loadAdminAttachments(); if (tid === 'schedule') { loadAdminScheduleRequests(); loadAdminAcademicSchedules(); } if (tid === 'leveltest') loadAdminLevelTests(); if (tid === 'about') loadAboutContent(); if (tid === 'programs') loadProgramsContent(); if (tid === 'eventbtn') loadEventBtn(); if (tid === 'footer') loadFooterContent(); }, style: Object.assign({
            background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px',
            cursor:'pointer', fontFamily:'Manrope, sans-serif',
            fontWeight:'700', color:'#111827',
            letterSpacing:'-0.01em', transition:'border-color 0.15s, box-shadow 0.15s',
            boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'
          }, adminIsMobile ? mobileStyle : pcStyle), onMouseEnter:function(e){ e.currentTarget.style.borderColor = groupColor; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }, onMouseLeave:function(e){ e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'; } }, t.label);
        })
      )
    );
  })
),

/* ── BANNER TAB ── */
tab==='banner' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '히어로 배너'),
React.createElement('button', { onClick:addBanner, style:btnS() }, '+ 배너 추가')
),
// 이미지/영상 권장 사이즈 안내
React.createElement('div', { style:{ background:'#eef6f1', border:'1px solid #FFEBED', borderRadius:'10px', padding:'12px 14px', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } },
React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#E60012', marginBottom:'6px' } }, '배너 이미지/영상 권장 사이즈'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.7)', lineHeight:'1.7' } },
React.createElement('div', null, '• 비율: 가로 : 세로 = 2 : 3 (세로가 가로보다 1.5배 길게)'),
React.createElement('div', null, '• 권장 크기: 1080 × 1620 px (또는 720 × 1080 px)'),
React.createElement('div', null, '• 카드에는 사진/영상만 보이고 글자 영역이 없으니 ', React.createElement('strong', null, '제목·뱃지·설명은 사진 안에 직접 디자인'), '해서 올려주세요.'),
React.createElement('div', { style:{ marginTop:'4px', color:'rgba(0,0,0,0.5)' } }, '※ 영상은 가로 1080 × 세로 1620 (2:3 비율)로 만들어 올리시면 깔끔합니다.')
)
),
state.banners.map(b =>
React.createElement('div', { key:b.id, style:cardS },
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: editingBanner?.id===b.id?'12px':0 } },
React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
React.createElement('div', { style:{ width:'28px', height:'28px', borderRadius:'6px', background:b.bg, flexShrink:0 } }),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, b.title),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, b.subtitle)
),
React.createElement('div', { style:{ background: b.active?'#FFEBED':'#f2f0eb', color: b.active?'#E60012':'rgba(0,0,0,0.45)', borderRadius:'8px', padding:'2px 10px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, b.active?'노출중':'숨김')
),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
React.createElement('button', { onClick:()=>setEditingBanner(editingBanner?.id===b.id?null:b), style:btnS('#3A3A3A') }, editingBanner?.id===b.id?'닫기':'편집'),
React.createElement('button', { onClick:()=>deleteBanner(b.id), style:btnOutS }, '삭제')
)
),
editingBanner?.id===b.id && React.createElement('div', { style:{ paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' } },
[{f:'title',l:'제목'},{f:'subtitle',l:'부제목'},{f:'badge',l:'뱃지'},{f:'label',l:'라벨'},{f:'cta',l:'버튼 텍스트'},{f:'bg',l:'배경색 (#hex)'},{f:'youtube',l:'유튜브 링크 (선택)'}].map(({f,l})=>
React.createElement('div', {key:f},
React.createElement('label',{style:labelS},l),
React.createElement('input',{value:b[f]||'',onChange:e=>updateBanner(b.id,f,e.target.value),style:inputS})
)
),
React.createElement('div', {key:'active'},
React.createElement('label',{style:labelS},'노출 여부'),
React.createElement('select',{value:b.active?'true':'false',onChange:e=>updateBanner(b.id,'active',e.target.value==='true'),style:inputS},
React.createElement('option',{value:'true'},'노출'),
React.createElement('option',{value:'false'},'숨김')
)
),
React.createElement('div', {key:'link_to', style:{ gridColumn:'span 2' }},
React.createElement('label',{style:labelS},'CTA 버튼 이동 위치'),
React.createElement('select', {
  value: (function(){
    var v = b.link_to || '';
    if (!v) return '';
    var known = ['home','service','contact','about','recruit','signup'];
    return known.indexOf(v) >= 0 ? v : '__custom__';
  })(),
  onChange: function(e) {
    var v = e.target.value;
    if (v === '__custom__') updateBanner(b.id,'link_to', b.link_to && /^https?:\/\//i.test(b.link_to) ? b.link_to : 'https://');
    else updateBanner(b.id,'link_to', v);
  },
  style: inputS
},
  React.createElement('option', {value:''}, '(없음 - 문의 페이지로 이동)'),
  React.createElement('option', {value:'home'}, '홈'),
  React.createElement('option', {value:'service'}, '강좌(프로그램)'),
  React.createElement('option', {value:'contact'}, '문의/연락처'),
  React.createElement('option', {value:'about'}, '회사 소개'),
  React.createElement('option', {value:'recruit'}, '채용/모집'),
  React.createElement('option', {value:'signup'}, '회원가입'),
  React.createElement('option', {value:'__custom__'}, '외부 URL (직접 입력)')
),
b.link_to && /^https?:\/\//i.test(b.link_to) && React.createElement('input', { value: b.link_to, onChange: function(e){ updateBanner(b.id,'link_to', e.target.value); }, placeholder:'https://...', style:{ ...inputS, marginTop:'6px' } })
),
React.createElement('div', {key:'description', style:{ gridColumn:'span 3' }},
React.createElement('label',{style:labelS},'상세 설명 (배너 클릭 시 상세 페이지에 표시)'),
React.createElement('textarea', { value: b.description || '', onChange: function(e){ updateBanner(b.id,'description', e.target.value); }, rows:3, style:{ ...inputS, resize:'vertical', minHeight:'70px', fontFamily:'Manrope, sans-serif' }, placeholder:'자세한 안내, 일정, 혜택 등을 자유롭게 적어주세요. 줄바꿈도 그대로 표시됩니다.' })
)
),
// 배경 이미지 업로드
React.createElement('div', { style:{ marginTop:'14px', padding:'12px', background:'#f8fafc', borderRadius:'10px' } },
React.createElement('label', { style:{ ...labelS, marginBottom:'8px', display:'block' } }, '배경 이미지 (사진 직접 업로드)'),
b.image
? React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
    React.createElement('img', { src: b.image, alt:'', style:{ width:'140px', height:'80px', objectFit:'cover', borderRadius:'6px', background:'#000', display:'block' } }),
    React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, b.image),
    React.createElement('button', { onClick:()=>removeBannerImage(b), style:btnOutS }, '이미지 제거')
  )
: React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
    React.createElement('input', {
      type:'file', accept:'image/*',
      onChange: function(e) {
        var f = e.target.files && e.target.files[0];
        if (f) uploadBannerImage(b, f);
        e.target.value = '';
      },
      style:{ fontSize:'12px', fontFamily:'Manrope, sans-serif' }
    }),
    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '※ JPG/PNG 권장, 권장 1080×1620 (2:3)')
  )
),

// 배경 동영상 업로드 (MP4 등) — 자동 재생되는 배경 영상 (사용자가 클릭해서 보는 게 아님)
React.createElement('div', { style:{ marginTop:'14px', padding:'12px', background:'#f8fafc', borderRadius:'10px' } },
React.createElement('label', { style:{ ...labelS, marginBottom:'8px', display:'block' } }, '배경 동영상 (자동 재생 · 음소거 · 무한 반복 — 유튜브/이미지보다 우선)'),
b.video_url
? React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
    React.createElement('video', { src: b.video_url, style:{ width:'140px', height:'80px', objectFit:'cover', borderRadius:'6px', background:'#000' }, autoPlay:true, muted:true, loop:true, playsInline:true }),
    React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, b.video_url),
    React.createElement('button', { onClick:()=>removeBannerVideo(b), style:btnOutS }, '영상 제거')
  )
: React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
    React.createElement('input', {
      type:'file', accept:'video/*',
      onChange: function(e) {
        var f = e.target.files && e.target.files[0];
        if (f) uploadBannerVideo(b, f);
        e.target.value = '';
      },
      style:{ fontSize:'12px', fontFamily:'Manrope, sans-serif' }
    }),
    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '※ MP4 권장, 너무 큰 파일은 로딩이 느려요')
  )
)
)
)
)
),

/* ── NOTICE TAB ── */
tab==='notice' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지사항 관리'),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
React.createElement('button', { onClick:addNotice, style:btnS() }, '+ 공지 추가'),
React.createElement('button', { onClick:addAnnouncement, style:btnS('#3A3A3A') }, '+ 발표 추가')
)
),
editingNotice
? React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' } },
React.createElement('button', { onClick:()=>setEditingNotice(null), style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '← 목록으로'),
React.createElement('div', { style:{ fontSize:'16px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '공지 편집')
),
React.createElement('div', { style:{ ...cardS, display:'flex', flexDirection:'column', gap:'14px' } },
React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
editingNotice.type !== undefined && React.createElement('select', { value:editingNotice.type, onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,type:v})); setState(s=>({...s,notices:s.notices.map(x=>x.id===editingNotice.id?{...x,type:v}:x)})); }, style:{ ...inputS, width:'80px', flexShrink:0 } },
['강좌','이벤트','공지','모집'].map(t=>React.createElement('option',{key:t,value:t},t))
),
React.createElement('input', { value:editingNotice.text||editingNotice.title||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,text:v,title:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,text:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,title:v}:x) })); }, placeholder:'제목', style:{ ...inputS, flex:1 } }),
React.createElement('input', { value:editingNotice.date||'', onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,date:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,date:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,date:v}:x) })); }, style:{ ...inputS, width:'110px', flexShrink:0 } })
),
React.createElement('div', null,
React.createElement('label',{style:labelS},'본문 내용'),
React.createElement('textarea',{value:editingNotice.content||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,content:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,content:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,content:v}:x) })); },placeholder:'공지 내용을 입력하세요',rows:6,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})
),
React.createElement('div', null,
React.createElement('label',{style:labelS},'유튜브 링크 (선택)'),
React.createElement('input',{value:editingNotice.youtube||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,youtube:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,youtube:v}:x) })); },placeholder:'https://youtube.com/watch?v=...',style:inputS})
),
React.createElement('div', null,
React.createElement('label',{style:labelS},'외부 링크 (선택)'),
React.createElement('input',{value:editingNotice.link||'',onChange:e=>{ const v=e.target.value; setEditingNotice(n=>({...n,link:v})); setState(s=>({ ...s, notices:s.notices.map(x=>x.id===editingNotice.id?{...x,link:v}:x), announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,link:v}:x) })); },placeholder:'https://blog.naver.com/...',style:inputS})
),
// 공지사항(announcements)일 때만 CTA 버튼 설정
editingNotice.type === undefined && React.createElement('div', { style:{ background:'#f8fafc', padding:'12px', borderRadius:'10px' } },
React.createElement('label',{style:{...labelS, display:'block', marginBottom:'8px'}},'CTA 버튼 (상세 페이지에 표시되는 행동 유도 버튼)'),
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' } },
React.createElement('div', null,
React.createElement('label',{style:{ ...labelS, fontSize:'11px', marginBottom:'4px' }},'버튼 텍스트'),
React.createElement('input', { value: editingNotice.cta||'', onChange: function(e){
var v = e.target.value;
setEditingNotice(n=>({...n,cta:v}));
setState(s=>({...s, announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,cta:v}:x)}));
}, placeholder:'예: 신청하기 / 상담받기 / 자세히 보기', style: inputS })
),
React.createElement('div', null,
React.createElement('label',{style:{ ...labelS, fontSize:'11px', marginBottom:'4px' }},'이동 위치'),
React.createElement('select', {
value: (function(){
var v = editingNotice.link_to || '';
if (!v) return '';
var known = ['home','service','contact','about','recruit','signup'];
return known.indexOf(v) >= 0 ? v : '__custom__';
})(),
onChange: function(e) {
var v = e.target.value;
var newVal = v === '__custom__' ? (editingNotice.link_to && /^https?:\/\//i.test(editingNotice.link_to) ? editingNotice.link_to : 'https://') : v;
setEditingNotice(n=>({...n,link_to:newVal}));
setState(s=>({...s, announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,link_to:newVal}:x)}));
},
style: inputS
},
React.createElement('option', {value:''}, '(없음)'),
React.createElement('option', {value:'home'}, '홈'),
React.createElement('option', {value:'service'}, '강좌(프로그램)'),
React.createElement('option', {value:'contact'}, '문의/연락처'),
React.createElement('option', {value:'about'}, '회사 소개'),
React.createElement('option', {value:'recruit'}, '채용/모집'),
React.createElement('option', {value:'signup'}, '회원가입'),
React.createElement('option', {value:'__custom__'}, '외부 URL (직접 입력)')
)
)
),
editingNotice.link_to && /^https?:\/\//i.test(editingNotice.link_to) && React.createElement('input', {
value: editingNotice.link_to, placeholder:'https://...',
onChange: function(e) {
var v = e.target.value;
setEditingNotice(n=>({...n,link_to:v}));
setState(s=>({...s, announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,link_to:v}:x)}));
},
style:{ ...inputS, marginTop:'8px' }
}),
React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', marginTop:'6px', fontFamily:'Manrope, sans-serif' } },
'※ 버튼 텍스트가 비어있으면 CTA 버튼이 표시되지 않습니다.'
)
),
// 공지사항(announcements)일 때만 카드 이미지 업로드
editingNotice.type === undefined && React.createElement('div', { style:{ background:'#f8fafc', padding:'12px', borderRadius:'10px' } },
React.createElement('label',{style:{...labelS, display:'block', marginBottom:'8px'}},'카드 배경 이미지 (메인 화면 2x2 카드에 사용)'),
editingNotice.image
? React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' } },
    React.createElement('img', { src: editingNotice.image, style:{ width:'100px', height:'100px', objectFit:'cover', borderRadius:'8px' } }),
    React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, editingNotice.image),
    React.createElement('button', { onClick: async()=>{
      if (!confirm('이미지를 제거하시겠습니까?')) return;
      setEditingNotice(n=>({...n,image:''}));
      setState(s=>({...s, announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,image:''}:x)}));
      await sb.from('announcements').update({ image: null }).eq('id', editingNotice.id);
    }, style: btnOutS }, '이미지 제거'),
    React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#E60012', background:'#FFEBED', padding:'5px 10px', borderRadius:'6px', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, '권장 1000×1200 px (10:12)')
  )
: React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' } },
    React.createElement('input', { type:'file', accept:'image/*', onChange: async (e)=>{
      var f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      var ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      var path = 'announcements/' + editingNotice.id + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
      var up = await sb.storage.from('attachments').upload(path, f, { cacheControl:'3600', upsert:false });
      if (up.error) { alert('업로드 실패: ' + up.error.message); return; }
      var url = sb.storage.from('attachments').getPublicUrl(path)?.data?.publicUrl || '';
      setEditingNotice(n=>({...n,image:url}));
      setState(s=>({...s, announcements:s.announcements.map(x=>x.id===editingNotice.id?{...x,image:url}:x)}));
      await sb.from('announcements').update({ image: url }).eq('id', editingNotice.id);
    }, style:{ fontSize:'12px', fontFamily:'Manrope, sans-serif' } }),
    React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#E60012', background:'#FFEBED', padding:'5px 10px', borderRadius:'6px', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, '권장 1000×1200 px (10:12)')
  )
),
React.createElement('button', { onClick: async ()=>{
if (editingNotice.type !== undefined) {
await window.supabase.from('notices').update({ type:editingNotice.type, text:editingNotice.text, date:editingNotice.date }).eq('id', editingNotice.id);
} else {
await window.supabase.from('announcements').update({ title:editingNotice.title, date:editingNotice.date, image: editingNotice.image || null, cta: editingNotice.cta || null, link_to: editingNotice.link_to || null }).eq('id', editingNotice.id);
}
setEditingNotice(null);
}, style:{ ...btnS(), alignSelf:'flex-start' } }, '✓ 저장 완료')
)
)
: React.createElement('div', null,
React.createElement('h3', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'8px', letterSpacing:'0.05em', textTransform:'uppercase' } }, '강좌/이벤트 공지'),
state.notices.map(n =>
React.createElement('div', { key:n.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }, onClick:()=>setEditingNotice(n) },
React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.type),
React.createElement('span', { style:{ fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flex:1 } }, n.text),
React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.date),
React.createElement('button', { onClick:e=>{ e.stopPropagation(); deleteNotice(n.id); }, style:{ ...btnOutS, flexShrink:0 } }, '삭제')
)
),
React.createElement('h3', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', margin:'16px 0 8px', letterSpacing:'0.05em', textTransform:'uppercase' } }, '공지사항 발표'),
state.announcements.map(a =>
React.createElement('div', { key:a.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }, onClick:()=>setEditingNotice(a) },
React.createElement('span', { style:{ fontSize:'14px', fontWeight:'600', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flex:1 } }, a.title),
React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, a.date),
React.createElement('button', { onClick:e=>{ e.stopPropagation(); deleteAnnouncement(a.id); }, style:{ ...btnOutS, flexShrink:0 } }, '삭제')
)
)
)
),

/* ── COURSE TAB ── */
tab==='course' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', gap:'12px' } },
React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, '전체 강좌/영상 관리'),
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', margin:0 } }, '강좌 생성은 선생님 페이지에서 담당 학년과 영상 링크를 입력해 등록합니다. 관리자는 전체 강좌 수정·삭제와 학생별 수강 권한 조정만 관리합니다.')
)
),
state.courses.map(c =>
React.createElement('div', { key:c.id, style:cardS },
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:editingCourse===c.id?'12px':0 } },
React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif' } }, c.subject),
React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name),
React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, (function(){
var className = c.class_id ? ((teacherClasses||[]).find(x=>String(x.id)===String(c.class_id))||{}).name : '';
var parts = [c.teacher, c.level, c.grade, className].filter(Boolean);
return parts.length > 0 ? parts.join(' · ') : '선생님 등록 강좌';
})())
),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
editingCourse===c.id && React.createElement('button', { onClick: async ()=>{
const subj = c.subject ? await window.supabase.from('subjects').select('id').eq('name', c.subject).single() : { data:null };
const updates = {
title: c.name,
description: c.description,
subject_id: subj.data?.id || null,
level: c.level || null,
grade: c.grade || null,
class_id: c.class_id || null,
};
const { error } = await window.supabase.from('courses').update(updates).eq('id', c.id);
if (error) { alert('저장 실패: ' + error.message); return; }
alert('저장되었습니다!');
}, style:btnS('#F8B500') }, '저장'),
React.createElement('button', { onClick:()=>setEditingCourse(editingCourse===c.id?null:c.id), style:btnS('#3A3A3A') }, editingCourse===c.id?'닫기':'편집'),
React.createElement('button', { onClick: async ()=>{ if(!confirm('정말 삭제할까요?')) return; await window.supabase.from('courses').delete().eq('id',c.id); setState(s=>({...s,courses:s.courses.filter(x=>x.id!==c.id)})); setEditingCourse(null); }, style:btnOutS }, '삭제')
)
),
editingCourse===c.id && React.createElement('div', { style:{ paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' } },
[{f:'name',l:'강좌명'},{f:'badge',l:'뱃지'}].map(({f,l})=>
React.createElement('div', {key:f},
React.createElement('label',{style:labelS},l),
React.createElement('input',{value:c[f]||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,[f]:e.target.value}:x)})),style:inputS})
)
),
React.createElement('div', {key:'subject'},
React.createElement('label',{style:labelS},'과목'),
React.createElement('select',{value:c.subject||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,subject:e.target.value}:x)})),style:inputS},
React.createElement('option',{value:''},'선택'),
SUBJECTS.map(sub=>React.createElement('option',{key:sub,value:sub},sub))
)
),
React.createElement('div', {key:'level'},
React.createElement('label',{style:labelS},'초중고'),
React.createElement('select',{value:c.level||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,level:e.target.value,grade:''}:x)})),style:inputS},
React.createElement('option',{value:''},'선택'),
COURSE_LEVELS.map(l=>React.createElement('option',{key:l,value:l},l))
)
),
React.createElement('div', {key:'grade'},
React.createElement('label',{style:labelS},'학년'),
React.createElement('select',{value:c.grade||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,grade:e.target.value}:x)})),style:inputS,disabled:!c.level},
React.createElement('option',{value:''},'선택'),
(COURSE_GRADES_BY_LEVEL[c.level]||[]).map(g=>React.createElement('option',{key:g,value:g},g))
)
),
React.createElement('div', {key:'class'},
React.createElement('label',{style:labelS},'클래스'),
React.createElement('select',{value:c.class_id||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,class_id:e.target.value}:x)})),style:inputS},
React.createElement('option',{value:''},'없음 (학년 공통)'),
(teacherClasses||[]).filter(cls=>cls.grade).map(cls=>React.createElement('option',{key:cls.id,value:cls.id},cls.name))
)
)
),
React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
React.createElement('div', null, React.createElement('label',{style:labelS},'강좌 소개'), React.createElement('textarea',{value:c.intro||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,intro:e.target.value}:x)})),placeholder:'이 강좌에 대한 상세 소개를 입력하세요',rows:4,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
React.createElement('div', null, React.createElement('label',{style:labelS},'수강 대상'), React.createElement('textarea',{value:c.target||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,target:e.target.value}:x)})),placeholder:'어떤 학생에게 맞는 강좌인지 입력하세요',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
React.createElement('div', null, React.createElement('label',{style:labelS},'커리큘럼 (줄바꿈으로 구분)'), React.createElement('textarea',{value:c.curriculum||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,curriculum:e.target.value}:x)})),placeholder:'1. 수열의 개념\n2. 극한의 이해',rows:5,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
React.createElement('div', null, React.createElement('label',{style:labelS},'강사 소개'), React.createElement('textarea',{value:c.teacherDesc||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,teacherDesc:e.target.value}:x)})),placeholder:'강사 경력, 특징 등',rows:3,style:{...inputS,resize:'vertical',lineHeight:'1.6'}})),
React.createElement('div', null, React.createElement('label',{style:labelS},'미리보기 유튜브 링크 (선택)'), React.createElement('input',{value:c.youtube||'',onChange:e=>setState(s=>({...s,courses:s.courses.map(x=>x.id===c.id?{...x,youtube:e.target.value}:x)})),placeholder:'https://youtube.com/watch?v=...',style:inputS})),
React.createElement('div', { style:{ borderTop:'2px solid #FFEBED', paddingTop:'14px', marginTop:'4px' } },
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
React.createElement('label', { style:{ fontSize:'13px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, '온라인 강의 목록'),
React.createElement('button', { onClick: async function() {
var newTitle = (((c.lectures||[]).length)+1) + '강: 새 강의';
var { data } = await window.supabase.from('videos').insert({ course_id:c.id, title:newTitle, youtube_id:'', sort_order:(c.lectures||[]).length+1 }).select().single();
if (data) setState(function(s) { return {...s, courses:s.courses.map(function(x) { return x.id===c.id ? {...x, lectures:[...(x.lectures||[]),{id:data.id,title:data.title,videoUrl:'',youtubeId:''}]} : x; })}; });
}, style:btnS() }, '+ 강의 추가')
),
(c.lectures||[]).length === 0
? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '아직 강의가 없습니다.')
: (c.lectures||[]).map(function(lec, idx) {
return React.createElement('div', { key:lec.id, style:{ background:'#f9f9f9', borderRadius:'8px', padding:'10px 12px', marginBottom:'8px', display:'flex', flexDirection:'column', gap:'6px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (idx+1)+'강'),
React.createElement('input', { value:lec.title||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,title:val}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({title:e.target.value}).eq('id',lec.id); }, placeholder:'강의 제목', style:{...inputS,marginBottom:0,flex:1} }),
React.createElement('button', { onClick:async function(){ await window.supabase.from('videos').delete().eq('id',lec.id); setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.filter(function(l){ return l.id!==lec.id; })}:x; })}; }); }, style:{...btnOutS,padding:'4px 10px',fontSize:'12px'} }, '삭제')
),
React.createElement('input', { value:lec.youtubeId||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,youtubeId:val,videoUrl:B2Utils.lectureVideoUrl({ youtube_id: val })}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({youtube_id:B2Utils.extractYoutubeId(e.target.value)}).eq('id',lec.id); }, placeholder:'YouTube 링크/ID 또는 시놀로지 영상 URL', style:{...inputS,marginBottom:0,fontSize:'12px'} })
);
})
)
)
)
)
)
),

/* ── 수강생 관리 TAB ── */
tab==='enrollee' && (function() {
var studentSource = studentViewMode === 'withdrawn' ? dbWithdrawnStudents : dbStudents;
return React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginRight:'8px', flexShrink:0 } },
studentViewMode === 'withdrawn' ? `퇴원 학생 (${dbWithdrawnStudents.length}명)` : `수강생 관리 (${dbStudents.length}명)`),

/* 활성/퇴원 토글 */
React.createElement('div', { style:{ display:'inline-flex', background:'#f2f0eb', borderRadius:'8px', padding:'3px', gap:'2px' } },
React.createElement('button', {
onClick: function(){ setStudentViewMode('active'); setSelectedIds([]); setExpandedStudent(null); },
style:{ background: studentViewMode==='active'?'#1A1A1A':'transparent', color: studentViewMode==='active'?'#fff':'rgba(0,0,0,0.55)', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '재원생 ' + dbStudents.length),
React.createElement('button', {
onClick: function(){ setStudentViewMode('withdrawn'); setSelectedIds([]); setExpandedStudent(null); },
style:{ background: studentViewMode==='withdrawn'?'#1A1A1A':'transparent', color: studentViewMode==='withdrawn'?'#fff':'rgba(0,0,0,0.55)', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '퇴원생 ' + dbWithdrawnStudents.length)
),

React.createElement('select', {
value: filterLevel,
onChange: function(e) { setFilterLevel(e.target.value); setFilterGrade('전체'); setFilterSchool('전체'); setSelectedIds([]); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'전체' }, '초중고'),
React.createElement('option', { value:'초등' }, '초등'),
React.createElement('option', { value:'중등' }, '중등'),
React.createElement('option', { value:'고등' }, '고등')
),

React.createElement('select', {
value: filterGrade,
onChange: function(e) { setFilterGrade(e.target.value); setSelectedIds([]); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'전체' }, '학년'),
filterLevel === '전체'
? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
: SCHOOL_LEVELS[filterLevel].grades.map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),

React.createElement('select', {
value: filterSchool,
onChange: function(e) { setFilterSchool(e.target.value); setSelectedIds([]); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'전체' }, '학교'),
(filterLevel === '전체'
? SCHOOLS.filter(function(s){ return s !== '전체'; })
: SCHOOL_LEVELS[filterLevel].schools
).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
),

React.createElement('select', {
value: filterTeacher,
onChange: function(e) { setFilterTeacher(e.target.value); setSelectedIds([]); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'전체' }, '담당 선생님'),
dbTeachers.filter(function(t){ return t.role === 'teacher'; }).map(function(t){
return React.createElement('option', { key:t.id, value:String(t.id) }, t.name || t.email || '선생님');
})
),

React.createElement('input', {
type:'text',
value: studentNameSearch,
onChange: function(e){ setStudentNameSearch(e.target.value); setSelectedIds([]); },
placeholder:'이름 검색',
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'160px' }
}),

React.createElement('select', {
value: sortStudentBy,
onChange: function(e) { setSortStudentBy(e.target.value); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer', marginLeft:'auto' }
},
React.createElement('option', { value:'created_desc' }, '↓ 등록일 최신순'),
React.createElement('option', { value:'created_asc' }, '↑ 등록일 오래된순'),
React.createElement('option', { value:'name_asc' }, '↓ 이름 가나다순'),
React.createElement('option', { value:'name_desc' }, '↑ 이름 가나다 역순'),
React.createElement('option', { value:'grade_asc' }, '↑ 학년 낮은순'),
React.createElement('option', { value:'grade_desc' }, '↓ 학년 높은순'),
React.createElement('option', { value:'subject_asc' }, '↓ 과목순 (국·영·수·과)')
)
),

/* 엑셀 가져오기/내보내기 */
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' } },
React.createElement('button', {
onClick: function(){ downloadStudentTemplate(); },
style:{ background:'#fff', color:'#374151', border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '엑셀 템플릿'),
React.createElement('button', {
onClick: function(){ exportStudentsExcel(studentSource, studentViewMode); },
style:{ background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '⬇ 엑셀 내보내기 (' + studentSource.length + '명' + (studentViewMode==='withdrawn'?' · 퇴원생':'') + ')'),
React.createElement('label', {
style:{ background:'#E60012', color:'#fff', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', display:'inline-flex', alignItems:'center', gap:'4px' }
},
'⬆ 엑셀 가져오기',
React.createElement('input', {
type:'file', accept:'.xlsx,.xls,.csv',
style:{ display:'none' },
onChange: async function(e) {
var f = e.target.files && e.target.files[0];
e.target.value = '';
if (f) await importStudentsExcel(f);
}
})
),
React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } },
'※ 필수: 이름만 / 학생전화 있으면 기존 학생 업데이트, 없으면 신규'
)
),

// PC 전용: 일괄 배정 패널 (모바일에서는 학생 카드 안의 과목 → 선생님 팝업으로 처리)
selectedIds.length > 0 && !adminIsMobile && (function() {
var bulkLabelS = { fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.6)', fontFamily:'Manrope, sans-serif', minWidth:'70px' };
var bulkSelectS = { border:'none', borderRadius:'6px', padding:'7px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', cursor:'pointer' };
var bulkInputS = Object.assign({}, bulkSelectS, { cursor:'text', minWidth:'140px' });
var availableGrades = bulkLevel ? (SCHOOL_LEVELS[bulkLevel].grades) : [];
var availableSchools = bulkLevel ? (SCHOOL_LEVELS[bulkLevel].schools) : [];
var teacherClassList = bulkTeacherId
  ? (teacherClasses || []).filter(function(c){ return String(c.teacher_id) === String(bulkTeacherId); })
  : [];
var resetBulk = function() {
  setBulkLevel(''); setBulkGrade(''); setBulkSchool(''); setBulkSchoolCustom('');
  setBulkSubjects([]); setBulkTeacherId(''); setBulkClassId('');
};
return React.createElement('div', { style:{ background:'#1A1A1A', borderRadius:'10px', padding:'14px 16px', marginBottom:'14px', display:'flex', flexDirection:'column', gap:'10px' } },
  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
    React.createElement('span', { style:{ fontSize:'13px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, selectedIds.length + '명 선택됨'),
    React.createElement('span', { style:{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontFamily:'Manrope, sans-serif' } }, '· 학교급/학년/학교/과목/담당 선생님 일괄 배정')
  ),

  /* 1행: 학교급 → 학년 / 학교 */
  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
    React.createElement('span', { style:bulkLabelS }, '학교급'),
    React.createElement('select', {
      value: bulkLevel,
      onChange: function(e) {
        var v = e.target.value;
        setBulkLevel(v);
        setBulkGrade(''); setBulkSchool(''); setBulkSchoolCustom('');
      },
      style: bulkSelectS
    },
      React.createElement('option', { value:'' }, '선택 안 함'),
      ['초등','중등','고등'].map(function(l){ return React.createElement('option', { key:l, value:l }, l); })
    ),
    React.createElement('span', { style: Object.assign({}, bulkLabelS, { minWidth:'40px' }) }, '학년'),
    React.createElement('select', {
      value: bulkGrade,
      onChange: function(e){ setBulkGrade(e.target.value); },
      disabled: !bulkLevel,
      style: Object.assign({}, bulkSelectS, { opacity: bulkLevel ? 1 : 0.4 })
    },
      React.createElement('option', { value:'' }, bulkLevel ? '선택 안 함' : '학교급 먼저'),
      availableGrades.map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
    ),
    React.createElement('span', { style: Object.assign({}, bulkLabelS, { minWidth:'40px' }) }, '학교'),
    React.createElement('select', {
      value: bulkSchool,
      onChange: function(e){
        var v = e.target.value;
        setBulkSchool(v);
        if (v !== '__custom__') setBulkSchoolCustom('');
      },
      disabled: !bulkLevel,
      style: Object.assign({}, bulkSelectS, { opacity: bulkLevel ? 1 : 0.4 })
    },
      React.createElement('option', { value:'' }, bulkLevel ? '선택 안 함' : '학교급 먼저'),
      availableSchools.map(function(s){ return React.createElement('option', { key:s, value:s }, s); }),
      React.createElement('option', { value:'__custom__' }, '+ 직접 입력')
    ),
    bulkSchool === '__custom__' && React.createElement('input', {
      value: bulkSchoolCustom,
      onChange: function(e){ setBulkSchoolCustom(e.target.value); },
      placeholder: '학교명 입력',
      style: bulkInputS
    })
  ),

  /* 2행: 수강 과목 */
  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
    React.createElement('span', { style:bulkLabelS }, '수강 과목'),
    SUBJECTS.map(function(sub) {
      var on = bulkSubjects.includes(sub);
      return React.createElement('button', {
        key: sub,
        onClick: function() {
          setBulkSubjects(function(prev){ return prev.includes(sub) ? prev.filter(function(x){ return x !== sub; }) : prev.concat(sub); });
        },
        style: { background: on ? '#E60012' : 'rgba(255,255,255,0.15)', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, sub);
    })
  ),

  /* 3행: 담당 선생님 → 반 */
  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
    React.createElement('span', { style:bulkLabelS }, '담당 선생님'),
    React.createElement('select', {
      value: bulkTeacherId,
      onChange: function(e){ setBulkTeacherId(e.target.value); setBulkClassId(''); },
      style: bulkSelectS
    },
      React.createElement('option', { value:'' }, '선택 안 함'),
      (dbTeachers || []).filter(function(t){ return t.role === 'teacher'; }).map(function(t){
        // 반(classes.teacher_id)은 teachers 테이블 ID로 묶이므로 students.id가 아닌 teachers.id를 dropdown value로 사용
        return React.createElement('option', { key:t.id, value:String(getTeacherClassId(t)) }, t.name || t.email || '선생님');
      })
    ),
    React.createElement('span', { style: Object.assign({}, bulkLabelS, { minWidth:'40px' }) }, '반'),
    React.createElement('select', {
      value: bulkClassId,
      onChange: function(e){ setBulkClassId(e.target.value); },
      disabled: !bulkTeacherId,
      style: Object.assign({}, bulkSelectS, { opacity: bulkTeacherId ? 1 : 0.4 })
    },
      React.createElement('option', { value:'' }, bulkTeacherId ? (teacherClassList.length ? '선택 안 함' : '이 선생님의 반 없음') : '선생님 먼저'),
      teacherClassList.map(function(c){ return React.createElement('option', { key:c.id, value:String(c.id) }, (c.name || '반') + (c.grade ? ' · ' + c.grade : '')); })
    )
  ),

  /* 4행: 적용 / 삭제 / 취소 */
  React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'10px' } },
    React.createElement('button', {
      onClick: async function() {
        var schoolValue = bulkSchool === '__custom__' ? bulkSchoolCustom.trim() : bulkSchool;
        if (bulkSchool === '__custom__' && !schoolValue) { alert('학교명을 입력해 주세요.'); return; }
        var hasUpdate = bulkGrade || schoolValue || (bulkSubjects.length > 0) || bulkClassId;
        if (!hasUpdate) { alert('변경/배정할 항목을 하나 이상 선택해 주세요.'); return; }

        var updates = {};
        if (bulkGrade) updates.grade = bulkGrade;
        if (schoolValue) updates.school = schoolValue;
        if (bulkSubjects.length > 0) updates.subjects = bulkSubjects;

        for (var i = 0; i < selectedIds.length; i++) {
          if (Object.keys(updates).length > 0) {
            await sb.from('students').update(updates).eq('id', selectedIds[i]);
          }
          if (bulkClassId) {
            var current = classStudents[bulkClassId] || [];
            if (current.indexOf(selectedIds[i]) === -1) {
              await sb.from('class_students').insert({ class_id: bulkClassId, student_id: selectedIds[i] });
            }
          }
        }

        setDbStudents(function(prev) {
          return prev.map(function(s) {
            if (!selectedIds.includes(s.id)) return s;
            var n = Object.assign({}, s);
            if (updates.grade != null) n.grade = updates.grade;
            if (updates.school != null) n.school = updates.school;
            if (updates.subjects != null) n.subjects = updates.subjects;
            return n;
          });
        });
        if (bulkClassId) {
          var savedClassId = bulkClassId;
          var newMembers = selectedIds.slice();
          setClassStudents(function(prev) {
            var existing = (prev[savedClassId] || []).slice();
            newMembers.forEach(function(sid) { if (existing.indexOf(sid) === -1) existing.push(sid); });
            var next = Object.assign({}, prev);
            next[savedClassId] = existing;
            return next;
          });
        }

        resetBulk();
        setSelectedIds([]);
        alert('일괄 적용 완료!');
      },
      style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 18px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
    }, '일괄 적용'),
    studentViewMode === 'active' && React.createElement('button', {
      onClick: async function() {
        if (!confirm('선택한 ' + selectedIds.length + '명을 퇴원 처리할까요?\n(엑셀 내보내기·검색은 퇴원생 탭에서 가능)')) return;
        var nowIso = new Date().toISOString();
        var movedIds = selectedIds.slice();
        for (var i = 0; i < movedIds.length; i++) {
          await sb.from('students').update({ is_active: false, withdrawn_at: nowIso }).eq('id', movedIds[i]);
        }
        var moving = dbStudents.filter(function(s){ return movedIds.includes(s.id); }).map(function(s){ return Object.assign({}, s, { withdrawn_at: nowIso }); });
        setDbStudents(function(prev) { return prev.filter(function(s){ return !movedIds.includes(s.id); }); });
        setDbWithdrawnStudents(function(prev) { return prev.concat(moving); });
        setDbMembers(function(prev) { return prev.filter(function(m){ return !movedIds.includes(m.id); }); });
        resetBulk();
        setSelectedIds([]);
        alert('퇴원 처리 완료');
      },
      style:{ background:'#7a7a7a', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
    }, '퇴원 처리'),
    studentViewMode === 'withdrawn' && React.createElement('button', {
      onClick: async function() {
        if (!confirm('선택한 ' + selectedIds.length + '명을 재원 처리할까요?')) return;
        var movedIds = selectedIds.slice();
        for (var i = 0; i < movedIds.length; i++) {
          await sb.from('students').update({ is_active: true, withdrawn_at: null }).eq('id', movedIds[i]);
        }
        var moving = dbWithdrawnStudents.filter(function(s){ return movedIds.includes(s.id); }).map(function(s){ return Object.assign({}, s, { withdrawn_at: '' }); });
        setDbWithdrawnStudents(function(prev) { return prev.filter(function(s){ return !movedIds.includes(s.id); }); });
        setDbStudents(function(prev) { return prev.concat(moving); });
        resetBulk();
        setSelectedIds([]);
        alert('재원 처리 완료');
      },
      style:{ background:'#1f7a3d', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
    }, '재원 처리'),
    React.createElement('button', {
      onClick: async function() {
        if (!confirm('선택한 ' + selectedIds.length + '명을 삭제할까요?')) return;
        for (var i = 0; i < selectedIds.length; i++) {
          await sb.from('students').delete().eq('id', selectedIds[i]);
        }
        setDbStudents(function(prev) { return prev.filter(function(s){ return !selectedIds.includes(s.id); }); });
        setDbWithdrawnStudents(function(prev) { return prev.filter(function(s){ return !selectedIds.includes(s.id); }); });
        setDbMembers(function(prev) { return prev.filter(function(m){ return !selectedIds.includes(m.id); }); });
        resetBulk();
        setSelectedIds([]);
      },
      style:{ background:'#c82014', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
    }, '삭제'),
    React.createElement('button', {
      onClick: function() { resetBulk(); setSelectedIds([]); },
      style:{ background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', padding:'7px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif', marginLeft:'auto' }
    }, '취소')
  )
);
})(),

(function() {
var nameQ = (studentNameSearch || '').trim().toLowerCase();
var filtered = studentSource.filter(function(st) {
if (nameQ && !(st.name || '').toLowerCase().includes(nameQ)) return false;
if (filterLevel !== '전체') {
var lvGrades = SCHOOL_LEVELS[filterLevel].grades;
if (!lvGrades.includes(st.grade)) return false;
}
if (filterSchool !== '전체' && st.school !== filterSchool) return false;
if (filterGrade !== '전체' && st.grade !== filterGrade) return false;
if (filterTeacher !== '전체') {
var teacher = dbTeachers.find(function(t) { return String(t.id) === String(filterTeacher); });
var assignedCourseIds = teacher ? getAssignedCourseIdsForTeacher(teacher) : [];
var studentCourseIds = st.enrolledCourses || [];
var hasTeacherCourse = assignedCourseIds.some(function(courseId) { return studentCourseIds.includes(courseId); });
if (!hasTeacherCourse) return false;
}
return true;
});

var GRADE_RANK = { '1학년':1,'2학년':2,'3학년':3,'4학년':4,'5학년':5,'6학년':6,'중1':7,'중2':8,'중3':9,'고1':10,'고2':11,'고3':12 };
var SUBJECT_RANK = { '국어':1,'영어':2,'수학':3,'과학':4 };
filtered = filtered.slice().sort(function(a, b) {
if (sortStudentBy === 'name_asc') return (a.name || '').localeCompare(b.name || '', 'ko');
if (sortStudentBy === 'name_desc') return (b.name || '').localeCompare(a.name || '', 'ko');
if (sortStudentBy === 'grade_asc' || sortStudentBy === 'grade_desc') {
var aR = GRADE_RANK[a.grade] || 99;
var bR = GRADE_RANK[b.grade] || 99;
if (aR !== bR) return sortStudentBy === 'grade_asc' ? aR - bR : bR - aR;
return (a.name || '').localeCompare(b.name || '', 'ko');
}
if (sortStudentBy === 'subject_asc') {
var aS = (a.subjects && a.subjects[0]) ? (SUBJECT_RANK[a.subjects[0]] || 99) : 99;
var bS = (b.subjects && b.subjects[0]) ? (SUBJECT_RANK[b.subjects[0]] || 99) : 99;
if (aS !== bS) return aS - bS;
return (a.name || '').localeCompare(b.name || '', 'ko');
}
var aDate = a.created_at || '';
var bDate = b.created_at || '';
if (sortStudentBy === 'created_asc') {
if (!aDate && !bDate) return 0;
if (!aDate) return 1;
if (!bDate) return -1;
return aDate.localeCompare(bDate);
}
if (!aDate && !bDate) return 0;
if (!aDate) return 1;
if (!bDate) return -1;
return bDate.localeCompare(aDate);
});

if (filtered.length === 0) return React.createElement('div', { style:{ ...cardS, textAlign:'center', padding:'48px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '해당하는 수강생이 없습니다');

var allSelected = filtered.length > 0 && filtered.every(function(s){ return selectedIds.includes(s.id); });

return React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 18px', marginBottom:'4px' } },
React.createElement('div', {
onClick: function() {
var ids = filtered.map(function(s){ return s.id; });
if (allSelected) setSelectedIds(function(prev){ return prev.filter(function(id){ return !ids.includes(id); }); });
else setSelectedIds(function(prev){ return Array.from(new Set(prev.concat(ids))); });
},
style:{ width:'18px', height:'18px', borderRadius:'4px', border: allSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: allSelected?'#1A1A1A':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
},
allSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
)
),
React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, `전체 선택 (${filtered.length}명)`)
),
React.createElement('div', { id:'student-grid-top', style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px', scrollMarginTop:'80px' } },
filtered.map(function(st) {
var isSelected = selectedIds.includes(st.id);
var isWithdrawn = studentViewMode === 'withdrawn';
return React.createElement('div', { key:st.id, style:{ ...cardS, marginBottom:0, border: isSelected?'2px solid #1A1A1A':'2px solid transparent', transition:'border 0.15s', opacity: isWithdrawn ? 0.78 : 1, alignSelf:'start', gridColumn: expandedStudent===st.id ? '1 / -1' : 'auto', order: expandedStudent===st.id ? -1 : 0 } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
React.createElement('div', {
onClick: function() { setSelectedIds(function(prev){ return isSelected?prev.filter(function(i){ return i!==st.id; }):[...prev,st.id]; }); },
style:{ width:'18px', height:'18px', borderRadius:'4px', border: isSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: isSelected?'#1A1A1A':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
},
isSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
)
),
React.createElement('div', { style:{ flex:1, minWidth:0, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }, onClick:function(){ var __nx = expandedStudent===st.id?null:st.id; setExpandedStudent(__nx); if (__nx) { setTimeout(function(){ var el = document.getElementById('student-grid-top'); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 60); } } },
st.grade && React.createElement('span', { style:{ background:'#1A1A1A', color:'#fff', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', textDecoration: isWithdrawn?'line-through':'none' } }, st.name),
(st.subjects||[]).map(function(sub){ return React.createElement('span', { key:sub, style:{ background:'#FFEBED', color:'#E60012', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub); }),
isWithdrawn && st.withdrawn_at && React.createElement('span', { style:{ background:'#f0f0f0', color:'#5a5a5a', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '퇴원 ' + String(st.withdrawn_at).slice(0,10))
),
React.createElement('span', {
onClick: function() { var __nx = expandedStudent===st.id?null:st.id; setExpandedStudent(__nx); if (__nx) { setTimeout(function(){ var el = document.getElementById('student-grid-top'); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 60); } },
style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', cursor:'pointer', transition:'transform 0.2s', transform: expandedStudent===st.id?'rotate(180deg)':'none', flexShrink:0 }
}, '▾')
),
expandedStudent===st.id && React.createElement('div', { style:{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid rgba(0,0,0,0.08)', display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'18px' } },
React.createElement('div', { style:{ minWidth:0 } },
React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center', marginBottom:'8px' } },
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학년'),
React.createElement('select', {
value: st.grade || '',
onChange: function(e) { updateStudentGrade(st.id, e.target.value || null); },
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'4px 8px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '선택'),
['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학교'),
React.createElement('select', {
value: st.school || '',
onChange: async function(e) {
var school = e.target.value;
await sb.from('students').update({ school }).eq('id', st.id);
setDbStudents(function(prev){ return prev.map(function(s){ return s.id===st.id?Object.assign({},s,{school}):s; }); });
showSaved();
},
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'4px 8px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '선택'),
SCHOOLS.filter(function(s){ return s!=='전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
)
),
React.createElement('div', { style:{ display:'flex', gap:'18px', flexWrap:'wrap', alignItems:'center', marginBottom:'8px', padding:'6px 10px', background:'#f9f9f9', borderRadius:'6px', fontSize:'12px', fontFamily:'Manrope, sans-serif' } },
React.createElement('span', null,
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.45)', marginRight:'6px' } }, '학생'),
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, st.phone || '미입력')
),
React.createElement('span', null,
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.45)', marginRight:'6px' } }, '학부모'),
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, st.parent_phone || '미입력')
)
),
React.createElement('div', { style:{ marginBottom:'8px' } },
React.createElement('label', { style:{ ...labelS, marginBottom:'4px' } }, '수강 과목'),
React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' } },
SUBJECTS.map(function(sub) {
return React.createElement('button', { key:sub, onClick:function(){ toggleSubject(st.id, sub); },
style:{ background:(st.subjects||[]).includes(sub)?'#E60012':'#f2f0eb', color:(st.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.7)', border:(st.subjects||[]).includes(sub)?'2px solid #E60012':'2px solid transparent', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub);
}),
React.createElement('button', {
onClick: function(){ setAddCourseStudentId(addCourseStudentId===st.id ? null : st.id); setAcSubject('전체'); setAcLevel('전체'); setAcGrade('전체'); setAcTeacher('전체'); setAcName(''); },
style:{ background: addCourseStudentId===st.id?'#1A1A1A':'#E60012', color:'#fff', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' }
}, addCourseStudentId===st.id ? '강좌 닫기' : '+ 개별 강좌 추가')
)
),
// 담당 선생님 — 과목별 모든 배정 표시 (여러 선생님 동시 가능) + 클릭 시 추가/변경 팝업
(st.subjects || []).length > 0 && React.createElement('div', { style:{ marginBottom:'8px' } },
React.createElement('label', { style:{ ...labelS, marginBottom:'4px' } }, '담당 선생님 (과목 클릭 시 추가)'),
React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
(st.subjects || []).map(function(sub) {
var myClasses = (teacherClasses || []).filter(function(c){ return c.subject === sub && (classStudents[c.id] || []).includes(st.id); });
return React.createElement('button', {
  key: sub,
  onClick: function(){ setTeacherPicker({ studentId: st.id, subject: sub }); },
  style:{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.85)', cursor:'pointer', fontFamily:'Manrope, sans-serif', textAlign:'left', gap:'8px' }
},
  React.createElement('span', { style:{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', flex:1, minWidth:0 } },
    React.createElement('span', { style:{ background:'#FFEBED', color:'#E60012', borderRadius:'5px', padding:'1px 6px', fontSize:'11px', fontWeight:'800', flexShrink:0 } }, sub),
    myClasses.length === 0
      ? React.createElement('span', { style:{ color:'rgba(0,0,0,0.4)', fontWeight:500 } }, '미배정')
      : myClasses.map(function(c){
          var prof = (dbTeacherProfiles || []).find(function(p){ return String(p.id) === String(c.teacher_id); });
          return React.createElement('span', { key:c.id, style:{ background:'#f3f4f6', color:'#1A1A1A', borderRadius:'5px', padding:'1px 6px', fontSize:'11px', fontWeight:700 } }, (prof ? prof.name : '선생님') + ' · ' + (c.name || '반'));
        })
  ),
  React.createElement('span', { style:{ color:'rgba(0,0,0,0.35)', fontSize:'11px', flexShrink:0 } }, '+ 추가/변경 ›')
);
})
)
),
React.createElement('div', null,
React.createElement('label', { style:{ ...labelS, marginBottom:'4px' } }, '수강 강좌'),
st.enrolledCourses.length === 0
? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '배정된 강좌 없음')
: React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' } },
    st.enrolledCourses.map(function(cid) {
      var course = state.courses.find(function(c){ return c.id===cid; });
      if (!course) return null;
      return React.createElement('div', { key:cid, style:{ display:'flex', alignItems:'center', gap:'5px', background:'#FFEBED', borderRadius:'20px', padding:'4px 10px 4px 12px' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, course.name + (course.grade?' ('+course.grade+')':'')),
        React.createElement('button', { onClick:function(){ toggleEnroll(st.id, cid); }, style:{ background:'none', border:'none', cursor:'pointer', color:'#E60012', fontSize:'14px', lineHeight:1, padding:'0 2px', fontWeight:'700' } }, '×')
      );
    })
  ),

// 추가 강좌 검색 패널
addCourseStudentId===st.id && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px', marginTop:'4px' } },
  React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', marginBottom:'10px', letterSpacing:'0.04em', textTransform:'uppercase' } }, '강좌 검색'),
  React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' } },
    // 과목
    React.createElement('select', { value:acSubject, onChange:function(e){ setAcSubject(e.target.value); },
      style:{ border:'1px solid #d6dbde', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' } },
      React.createElement('option',{value:'전체'},'과목'),
      SUBJECTS.map(function(s){ return React.createElement('option',{key:s,value:s},s); })
    ),
    // 초중고
    React.createElement('select', { value:acLevel, onChange:function(e){ setAcLevel(e.target.value); setAcGrade('전체'); },
      style:{ border:'1px solid #d6dbde', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' } },
      React.createElement('option',{value:'전체'},'초중고'),
      React.createElement('option',{value:'초등'},'초등'),
      React.createElement('option',{value:'중등'},'중등'),
      React.createElement('option',{value:'고등'},'고등')
    ),
    // 학년
    React.createElement('select', { value:acGrade, onChange:function(e){ setAcGrade(e.target.value); },
      style:{ border:'1px solid #d6dbde', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' } },
      React.createElement('option',{value:'전체'},'학년'),
      (acLevel==='전체'
        ? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3']
        : SCHOOL_LEVELS[acLevel]?.grades || []
      ).map(function(g){ return React.createElement('option',{key:g,value:g},g); })
    ),
    // 담당 선생님
    React.createElement('select', { value:acTeacher, onChange:function(e){ setAcTeacher(e.target.value); },
      style:{ border:'1px solid #d6dbde', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' } },
      React.createElement('option',{value:'전체'},'담당 선생님'),
      dbTeachers.filter(function(t){ return t.role==='teacher'; }).map(function(t){
        return React.createElement('option',{key:t.id,value:String(t.id)}, t.name||t.email||'선생님');
      })
    ),
    // 강좌명 검색
    React.createElement('input', { value:acName, onChange:function(e){ setAcName(e.target.value); }, placeholder:'강좌명 검색',
      style:{ border:'1px solid #d6dbde', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', outline:'none', background:'#fff', minWidth:'120px' } })
  ),
  // 검색 결과
  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'220px', overflowY:'auto' } },
    (function(){
      // 필터를 하나도 안 골랐을 때는 강좌를 노출하지 않음 (학원 내 강좌가 많아질 때 긴 목록 방지)
      var anyFilter = acSubject!=='전체' || acLevel!=='전체' || acGrade!=='전체' || acTeacher!=='전체' || acName.trim() !== '';
      if (!anyFilter) {
        return React.createElement('div',{style:{fontSize:'12px',color:'rgba(0,0,0,0.45)',fontFamily:'Manrope, sans-serif', padding:'12px', textAlign:'center', background:'#f9fafb', borderRadius:'8px'}}, '과목·초중고·학년·담당 선생님 중 하나 이상 선택하거나 강좌명을 입력하면 결과가 표시됩니다.');
      }
      var results = state.courses.filter(function(c){
        if (acSubject!=='전체' && c.subject!==acSubject) return false;
        if (acLevel!=='전체' && !(SCHOOL_LEVELS[acLevel]?.grades||[]).includes(c.grade)) return false;
        if (acGrade!=='전체' && c.grade!==acGrade) return false;
        if (acTeacher!=='전체') {
          var teacher = dbTeachers.find(function(t){ return String(t.id)===String(acTeacher); });
          var assignedCourseIds = teacher ? getAssignedCourseIdsForTeacher(teacher) : [];
          if (!assignedCourseIds.includes(c.id)) return false;
        }
        if (acName.trim() && !c.name.toLowerCase().includes(acName.toLowerCase())) return false;
        return true;
      });
      if (results.length===0) return React.createElement('div',{style:{fontSize:'12px',color:'rgba(0,0,0,0.4)',fontFamily:'Manrope, sans-serif', padding:'8px'}},'검색 결과가 없습니다');
      return results.map(function(c){
        var enrolled = st.enrolledCourses.includes(c.id);
        return React.createElement('div', { key:c.id, style:{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:'8px', padding:'8px 12px', border: enrolled?'1.5px solid #E60012':'1px solid #e5e7eb' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [c.subject, c.grade, c.teacher].filter(Boolean).join(' · '))
          ),
          React.createElement('button', {
            onClick: function(){ toggleEnroll(st.id, c.id); },
            style:{ background: enrolled?'#c82014':'#E60012', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, enrolled?'배정 해제':'배정')
        );
      });
    })()
  )
)
)
),
React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'14px', minWidth:0 } },
React.createElement('div', null,
React.createElement('label', { style:labelS }, '특이사항·메모'),
(function(){
  var notes = (adminRecords || []).filter(function(n){ return String(n.student_id) === String(st.id); });
  if (notes.length === 0) return React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', padding:'10px 12px', background:'#f9f9f9', borderRadius:'8px', fontFamily:'Manrope, sans-serif' } }, '등록된 메모 없음');
  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'200px', overflowY:'auto' } },
    notes.slice(0, 10).map(function(n){
      return React.createElement('div', { key:n.id, style:{ background:'#f9f9f9', borderRadius:'8px', padding:'8px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'6px', marginBottom:'3px' } },
          React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', color:'#1A1A1A' } }, n.kind || '메모'),
          React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)' } }, (n.note_date || '').slice(0,10))
        ),
        React.createElement('div', { style:{ color:'rgba(0,0,0,0.78)', whiteSpace:'pre-wrap', lineHeight:1.45 } }, n.content || '')
      );
    })
  );
})()
),
React.createElement('div', null,
React.createElement('label', { style:labelS }, '최근 시험 성적'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', padding:'10px 12px', background:'#f9f9f9', borderRadius:'8px', fontFamily:'Manrope, sans-serif' } }, '시험 성적은 곧 표시됩니다')
),
React.createElement('div', null,
React.createElement('label', { style:labelS }, '출결'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', padding:'10px 12px', background:'#f9f9f9', borderRadius:'8px', fontFamily:'Manrope, sans-serif' } }, '출결은 곧 표시됩니다')
)
)
),
expandedStudent===st.id && React.createElement('div', {
  style:{ marginTop:'10px', paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }
},
  studentViewMode === 'active' && React.createElement('button', {
    onClick: async function() {
      if (!confirm(st.name + ' 학생을 퇴원 처리할까요?\n(엑셀 내보내기·검색은 퇴원생 탭에서 가능)')) return;
      var nowIso = new Date().toISOString();
      await sb.from('students').update({ is_active: false, withdrawn_at: nowIso }).eq('id', st.id);
      var moving = Object.assign({}, st, { withdrawn_at: nowIso });
      setDbStudents(function(prev){ return prev.filter(function(s){ return s.id !== st.id; }); });
      setDbWithdrawnStudents(function(prev){ return prev.concat([moving]); });
      setDbMembers(function(prev){ return prev.filter(function(m){ return m.id !== st.id; }); });
      setExpandedStudent(null);
    },
    style:{ background:'#7a7a7a', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
  }, '퇴원 처리'),
  studentViewMode === 'withdrawn' && React.createElement('button', {
    onClick: async function() {
      if (!confirm(st.name + ' 학생을 재원 처리할까요?')) return;
      await sb.from('students').update({ is_active: true, withdrawn_at: null }).eq('id', st.id);
      var moving = Object.assign({}, st, { withdrawn_at: '' });
      setDbWithdrawnStudents(function(prev){ return prev.filter(function(s){ return s.id !== st.id; }); });
      setDbStudents(function(prev){ return prev.concat([moving]); });
      setExpandedStudent(null);
    },
    style:{ background:'#1f7a3d', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
  }, '재원 처리'),
  studentViewMode === 'withdrawn' && st.withdrawn_at && React.createElement('span', {
    style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif' }
  }, '퇴원일 ' + String(st.withdrawn_at).slice(0,10))
)
);
})
)
);
})()
);
})(),

/* ── 회원 정보 TAB ── */
tab==='member' && React.createElement('div', null,

// 헤더 + 검색/필터 토글
React.createElement('div', { style:{ marginBottom:'16px' } },
React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'12px', flexWrap:'wrap' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '회원 정보'),
// 모드 토글
React.createElement('div', { style:{ display:'flex', background:'#f2f0eb', borderRadius:'8px', padding:'3px', gap:'3px' } },
React.createElement('button', {
  onClick: function(){ setMemberSearchMode('search'); },
  style:{ background: memberSearchMode==='search'?'#fff':'transparent', color: memberSearchMode==='search'?'rgba(0,0,0,0.87)':'rgba(0,0,0,0.45)', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' }
}, '검색'),
React.createElement('button', {
  onClick: function(){ setMemberSearchMode('filter'); },
  style:{ background: memberSearchMode==='filter'?'#fff':'transparent', color: memberSearchMode==='filter'?'rgba(0,0,0,0.87)':'rgba(0,0,0,0.45)', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' }
}, '필터'),
),
// 구분 드롭다운 (항상 표시)
React.createElement('select', {
value: memberFilter,
onChange: function(e) { setMemberFilter(e.target.value); setExpandedMember(null); setEditingMember(null); },
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', background:'#fff', cursor:'pointer', outline:'none' }
},
React.createElement('option', { value:'전체' }, '전체 ' + dbMembers.length + '명'),
React.createElement('option', { value:'수강생' }, '수강생 ' + dbMembers.filter(function(m){ return m.role==='student'&&m.isEnrollee; }).length + '명'),
React.createElement('option', { value:'일반회원' }, '일반회원 ' + dbMembers.filter(function(m){ return m.role==='student'&&!m.isEnrollee; }).length + '명'),
React.createElement('option', { value:'학부모' }, '학부모 ' + dbMembers.filter(function(m){ return m.role==='parent'; }).length + '명'),
React.createElement('option', { value:'선생님' }, '선생님 ' + dbMembers.filter(function(m){ return m.role==='teacher'; }).length + '명')
)
),

// 검색 모드
memberSearchMode === 'search' && React.createElement('input', {
value: memberSearch,
onChange: function(e) { setMemberSearch(e.target.value); setExpandedMember(null); },
placeholder: '이름 또는 전화번호 검색',
style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'9px 14px', fontSize:'13px', fontFamily:'Manrope, sans-serif', outline:'none', background:'#fff', boxSizing:'border-box' }
}),

// 필터 모드
memberSearchMode === 'filter' && React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
// 초중고
React.createElement('select', {
  value: mfLevel,
  onChange: function(e){ setMfLevel(e.target.value); setMfGrade('전체'); setMfSchool('전체'); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option',{value:'전체'},'전체'),
  React.createElement('option',{value:'초등'},'초등'),
  React.createElement('option',{value:'중등'},'중등'),
  React.createElement('option',{value:'고등'},'고등')
),
// 학년
React.createElement('select', {
  value: mfGrade,
  onChange: function(e){ setMfGrade(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option',{value:'전체'},'학년'),
  (mfLevel==='전체'
    ? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3']
    : SCHOOL_LEVELS[mfLevel]?.grades || []
  ).map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),
// 학교
React.createElement('select', {
  value: mfSchool,
  onChange: function(e){ setMfSchool(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option',{value:'전체'},'학교'),
  (mfLevel==='전체'
    ? SCHOOLS.filter(function(s){ return s!=='전체'; })
    : SCHOOL_LEVELS[mfLevel]?.schools || []
  ).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
),
// 담당 선생님
React.createElement('select', {
  value: mfTeacher,
  onChange: function(e){ setMfTeacher(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option',{value:'전체'},'담당 선생님'),
  dbTeachers.filter(function(t){ return t.role==='teacher'; }).map(function(t){
    return React.createElement('option',{key:t.id,value:String(t.id)}, t.name||t.email||'선생님');
  })
),
// 필터 초기화
React.createElement('button', {
  onClick: function(){ setMfLevel('전체'); setMfGrade('전체'); setMfSchool('전체'); setMfTeacher('전체'); },
  style:{ background:'#f2f0eb', color:'rgba(0,0,0,0.6)', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '초기화')
)
),

(function() {
// 필터링 로직 (검색/필터 모드 통합)
var filtered = dbMembers.filter(function(m) {
if (memberFilter === '수강생'   && !(m.role==='student' && m.isEnrollee))  return false;
if (memberFilter === '일반회원' && !(m.role==='student' && !m.isEnrollee)) return false;
if (memberFilter === '학부모'   && m.role !== 'parent')  return false;
if (memberFilter === '선생님'   && m.role !== 'teacher') return false;

if (memberSearchMode === 'search' && memberSearch.trim()) {
  var q = memberSearch.trim().toLowerCase();
  if (!(m.name||'').toLowerCase().includes(q) && !(m.phone||'').includes(q)) return false;
}

if (memberSearchMode === 'filter') {
  // 초중고 필터
  if (mfLevel !== '전체') {
    var lvGrades = SCHOOL_LEVELS[mfLevel]?.grades || [];
    if (!lvGrades.includes(m.grade)) return false;
  }
  // 학년 필터
  if (mfGrade !== '전체' && m.grade !== mfGrade) return false;
  // 학교 필터
  if (mfSchool !== '전체' && m.school !== mfSchool) return false;
  // 담당 선생님 필터
  if (mfTeacher !== '전체') {
    var teacher = dbTeachers.find(function(t){ return String(t.id)===String(mfTeacher); });
    var teacherGrades = teacher ? (teacher.grade||'').split(',').filter(Boolean) : [];
    var inTeacherRange = teacherGrades.some(function(tg){
      var parts = tg.split('-');
      var gradeVal = parts[parts.length-1].replace(/^\w+ /, '');
      return gradeVal === m.grade;
    });
    if (!inTeacherRange) return false;
  }
}
return true;
});
if (filtered.length === 0) return [React.createElement('div', { key:'empty', style:{ ...cardS, textAlign:'center', padding:'48px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '해당 회원이 없습니다')];
return filtered.map(function(m) {
var linkedParent = m.role==='student' && m.parentId ? dbMembers.find(function(x){ return x.id===m.parentId; }) : null;
var linkedChildren = m.role==='parent' ? dbMembers.filter(function(x){ return x.role==='student' && (x.parentId===m.id); }) : [];
var roleBg    = m.role==='teacher'?'#FFEBED': m.role==='parent'?'#fff3cd': m.isEnrollee?'#e8f4fd':'#f2f0eb';
var roleColor = m.role==='teacher'?'#E60012': m.role==='parent'?'#856404': m.isEnrollee?'#0066cc':'rgba(0,0,0,0.45)';
var isEnrolleeParent = m.role==='parent' && dbMembers.some(function(s){ return s.role==='student'&&s.isEnrollee&&s.parentId===m.id; });
var roleLabel = m.role==='teacher'?'선생님': m.role==='parent'?(isEnrolleeParent?'수강생 학부모':'학부모'): m.isEnrollee?'수강생':'일반회원';
var isEditing = editingMember === m.id;
return React.createElement('div', { key:m.id, style:{ ...cardS, padding:'12px 16px', border: isEditing?'2px solid #E60012':'2px solid transparent', transition:'border 0.15s' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0, cursor:'pointer' }, onClick:function(){ setExpandedMember(expandedMember===m.id?null:m.id); setEditingMember(null); } },
React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:roleBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:roleColor, fontFamily:'Manrope, sans-serif', flexShrink:0 } }, m.name[0]),
React.createElement('div', { style:{ minWidth:0, flex:1 } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' } },
React.createElement('span', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, m.name),
React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:roleBg, color:roleColor, borderRadius:'4px', padding:'1px 6px', fontFamily:'Manrope, sans-serif' } }, roleLabel),
linkedParent && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '학부모: ' + linkedParent.name),
linkedChildren.length > 0 && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '자녀: ' + linkedChildren.map(function(c){ return c.name; }).join(', '))
),
React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
[m.phone, m.grade, m.school].filter(Boolean).join(' · ') || m.email || '—'
)
)
),
React.createElement('div', { style:{ display:'flex', gap:'4px', flexShrink:0, alignItems:'center' } },
React.createElement('button', {
onClick: function() { setEditingMember(isEditing?null:m.id); setExpandedMember(m.id); },
style:{ background: isEditing?'#E60012':'transparent', color: isEditing?'#fff':'rgba(0,0,0,0.4)', border:'1px solid '+(isEditing?'#E60012':'rgba(0,0,0,0.15)'), borderRadius:'5px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, isEditing ? '닫기' : '수정'),
React.createElement('button', {
onClick: async function() {
if (!confirm(m.name + '님을 삭제할까요?')) return;
await sb.from('students').delete().eq('id', m.id);
setDbMembers(function(prev){ return prev.filter(function(x){ return x.id!==m.id; }); });
setDbStudents(function(prev){ return prev.filter(function(x){ return x.id!==m.id; }); });
},
style:{ background:'transparent', color:'rgba(0,0,0,0.3)', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'5px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '삭제'),
React.createElement('span', { style:{ fontSize:'14px', color:'rgba(0,0,0,0.2)', cursor:'pointer', marginLeft:'2px' }, onClick:function(){ setExpandedMember(expandedMember===m.id?null:m.id); } }, expandedMember===m.id?'▴':'▾')
)
),
expandedMember===m.id && isEditing && React.createElement('div', { style:{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' } },
[
{ key:'name', label:'이름', type:'text' },
{ key:'phone', label:'전화번호', type:'tel' },
{ key:'email', label:'이메일', type:'email' },
{ key:'address', label:'주소', type:'text' },
].map(function(f) {
return React.createElement('div', { key:f.key },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, f.label),
React.createElement('input', {
value: m[f.key] || '',
onChange: function(e) {
var val = e.target.value;
setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id ? Object.assign({},x,{[f.key]:val}) : x; }); });
},
style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'6px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', outline:'none', boxSizing:'border-box', background:'#fafafa' }
})
);
})
),
m.role === 'student' && React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'12px' } },
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학년'),
React.createElement('select', {
value: m.grade || '',
onChange: function(e) { var val=e.target.value; setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{grade:val}):x; }); }); },
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '선택'),
['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학교'),
React.createElement('select', {
value: m.school || '',
onChange: function(e) { var val=e.target.value; setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{school:val}):x; }); }); },
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '선택'),
SCHOOLS.filter(function(s){ return s!=='전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
)
),
React.createElement('button', {
onClick: async function() {
var updates = { name:m.name, phone:m.phone, email:m.email, address:m.address };
if (m.role==='student') { updates.grade=m.grade; updates.school=m.school; }
await sb.from('students').update(updates).eq('id', m.id);
if (m.role==='student') {
setDbStudents(function(prev){ return prev.map(function(s){ return s.id===m.id?Object.assign({},s,updates):s; }); });
}
setEditingMember(null);
alert('저장 완료!');
},
style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '저장')
),
expandedMember===m.id && !isEditing && React.createElement('div', { style:{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom: (m.role==='student'||m.role==='parent')?'14px':'0' } },
[
{ label:'이름', value:m.name },
{ label:'구분', value:roleLabel },
{ label:'전화번호', value:m.phone||'—' },
{ label:'이메일', value:m.email||'—' },
{ label:'주소', value:m.address||'—' },
{ label:'학교', value:m.school||'—' },
{ label:'학년', value:m.grade||'—' },
{ label:'가입일', value:m.createdAt?m.createdAt.slice(0,10):'—' },
].map(function(item) {
return React.createElement('div', { key:item.label },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } }, item.label),
React.createElement('div', { style:{ fontSize:'13px', fontWeight:'600', color:'rgba(0,0,0,0.75)', fontFamily:'Manrope, sans-serif' } }, item.value)
);
})
),
m.role==='student' && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px', marginBottom:'8px' } },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '학부모 연결'),
linkedParent
? React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:'#fff3cd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#856404', fontFamily:'Manrope, sans-serif' } }, linkedParent.name[0]),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, linkedParent.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, linkedParent.phone || linkedParent.email || '—')
)
),
React.createElement('button', {
onClick: async function() {
await sb.from('students').update({ parent_id: null }).eq('id', m.id);
setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{parentId:null}):x; }); });
},
style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '연결 해제')
)
: React.createElement('select', {
defaultValue: '',
onChange: async function(e) {
var parentId = e.target.value;
if (!parentId) return;
await sb.from('students').update({ parent_id: parentId }).eq('id', m.id);
setDbMembers(function(prev){ return prev.map(function(x){ return x.id===m.id?Object.assign({},x,{parentId}):x; }); });
},
style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', background:'#fff', outline:'none', width:'100%', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '학부모를 선택하세요'),
dbMembers.filter(function(x){ return x.role==='parent'; }).map(function(p){
return React.createElement('option', { key:p.id, value:p.id }, p.name + (p.phone?' ('+p.phone+')':''));
})
)
),
m.role==='parent' && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px' } },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '자녀 (' + linkedChildren.length + '명)'),
linkedChildren.length === 0
? React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '연결된 자녀가 없습니다')
: linkedChildren.map(function(child) {
return React.createElement('div', { key:child.id, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:'#e8f4fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#0066cc', fontFamily:'Manrope, sans-serif' } }, child.name[0]),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, child.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [child.grade, child.school].filter(Boolean).join(' · ') || '—')
)
);
})
)
)
);
});
})()
),

/* ── 선생님 관리 TAB ── */
tab==='teacher' && React.createElement('div', null,
dbPending.filter(p => p.role !== 'pending_teacher').length > 0 && React.createElement('div', { style:{ marginBottom:'28px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '학생/학부모 승인 대기'),
React.createElement('span', { style:{ background:'#c82014', color:'#fff', borderRadius:'20px', padding:'2px 10px', fontSize:'12px', fontWeight:'800', fontFamily:'Manrope, sans-serif' } }, dbPending.filter(p=>p.role!=='pending_teacher').length)
),
dbPending.filter(p => p.role !== 'pending_teacher').map(p =>
React.createElement('div', { key:p.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, p.role==='pending_student'?'학생':'학부모'),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, p.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, (p.role==='pending_student'?'학생':'학부모') + (p.school?' · '+p.school:'') + (p.grade?' '+p.grade:'')),
React.createElement('div', { style:{ display:'inline-block', background:'#fff3cd', color:'#856404', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '승인 대기 중')
)
),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
React.createElement('button', { onClick: async ()=>{
const newRole = p.role==='pending_student'?'student':'parent';
await sb.from('students').update({ role:newRole, is_active:true }).eq('id', p.id);
setDbPending(ps => ps.filter(x => x.id !== p.id));
setDbStudents(prev => [...prev, { id:p.id, name:p.name, phone:p.phone||'', grade:p.grade||'', subjects:[], enrolledCourses:[], role:newRole }]);
setDbMembers(prev => [...prev, { id:p.id, name:p.name, phone:p.phone||'', grade:p.grade||'', school:p.school||'', role:newRole }]);
}, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '승인'),
React.createElement('button', { onClick: async ()=>{
if (!confirm('이 신청을 거절할까요?')) return;
await sb.from('students').delete().eq('id', p.id);
setDbPending(ps => ps.filter(x => x.id !== p.id));
}, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '거절')
)
)
)
),
React.createElement('div', { style:{ marginBottom:'28px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '선생님 승인 대기'),
React.createElement('span', { style:{ background:'#c82014', color:'#fff', borderRadius:'20px', padding:'2px 10px', fontSize:'12px', fontWeight:'800', fontFamily:'Manrope, sans-serif' } }, dbTeachers.filter(t=>t.role==='pending_teacher').length)
),
dbTeachers.filter(t => t.role==='pending_teacher').length === 0
? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'24px', textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '대기 중인 선생님이 없습니다')
: dbTeachers.filter(t => t.role==='pending_teacher').map(t =>
React.createElement('div', { key:t.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#f2f0eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, '선생'),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, t.email),
React.createElement('div', { style:{ display:'inline-block', background:'#fff3cd', color:'#856404', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '승인 대기 중')
)
),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
React.createElement('button', { onClick:()=>approveTeacher(t.id), style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '승인'),
React.createElement('button', { onClick:()=>rejectTeacher(t.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '거절')
)
)
)
),
React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, `승인된 선생님 (${dbTeachers.filter(t=>t.role==='teacher').length}명)`),
dbTeachers.filter(t => t.role==='teacher').length === 0
? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'24px', textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '승인된 선생님이 없습니다')
: dbTeachers.filter(t => t.role==='teacher').map(t =>
React.createElement('div', { key:t.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:'10px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: expandedTeacher===t.id ? '14px' : '0', cursor:'pointer' }, onClick:()=>setExpandedTeacher(expandedTeacher===t.id ? null : t.id) },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', flex:1 } },
React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 } }, '선생'),
React.createElement('div', { style:{ flex:1, minWidth:0 } },
React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, t.email + (t.subjects && t.subjects.length > 0 ? ' · ' + t.subjects.join(', ') : ''))
),
React.createElement('div', { style:{ display:'inline-block', background:'#FFEBED', color:'#E60012', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '승인됨')
),
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 } },
expandedTeacher!==t.id && React.createElement('button', { onClick:(e)=>{ e.stopPropagation(); rejectTeacher(t.id); }, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '계정 삭제'),
React.createElement('span', { style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', transition:'transform 0.2s', transform: expandedTeacher===t.id?'rotate(180deg)':'none' } }, '▾')
)
),
expandedTeacher===t.id && React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', marginBottom:'10px' } },
React.createElement('button', { onClick:()=>rejectTeacher(t.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '계정 삭제')
),
expandedTeacher===t.id && React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '담당 과목 배정'),
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
SUBJECTS.map(sub =>
React.createElement('button', { key:sub, onClick:()=>toggleTeacherSubject(t.id, sub),
style:{ background: (t.subjects||[]).includes(sub)?'#E60012':'#f2f0eb', color: (t.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.55)', border: (t.subjects||[]).includes(sub)?'2px solid #E60012':'2px solid transparent', borderRadius:'8px', padding:'7px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub)
)
),

/* 과목별 학년 배정 — 각 담당 과목마다 별도 섹션 */
React.createElement('div', { style:{ marginTop:'16px', paddingTop:'14px', borderTop:'1px solid #edf0f2' } },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, '과목별 학교급 / 학년 배정'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '과목마다 별도로 학교급과 담당 학년을 설정하고 저장합니다.'),

(t.subjects && t.subjects.length > 0 ? t.subjects : ['(과목 미지정)']).map(function(sub) {
  var draftKey = t.id + '_' + sub;
  var draft = getTeacherAssignDraft(draftKey) || { level:'초등', grades:[] };
  var savedAssignments = getTeacherGradeAssignments(t).filter(function(a) {
    return String(a).indexOf(sub + '-') === 0;
  }).map(function(a) { return a.replace(sub + '-', ''); });

  return React.createElement('div', { key:sub, style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px 16px', marginBottom:'10px' } },
    // 과목 라벨
    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, sub),

    // 학교급 + 학년 선택 + 저장
    React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px' } },
      React.createElement('select', {
        value: draft.level,
        onChange: function(e) { updateTeacherAssignDraft(draftKey, { level: e.target.value }); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        TEACHER_ASSIGN_LEVELS.map(function(level) {
          return React.createElement('option', { key:level, value:level }, level);
        })
      ),
      React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap' } },
        TEACHER_ASSIGN_GRADES.map(function(grade) {
          var selected = (draft.grades || []).includes(grade);
          return React.createElement('button', {
            key:grade, type:'button',
            onClick: function() {
              var grades = draft.grades || [];
              var next = selected ? grades.filter(function(g){ return g!==grade; }) : grades.concat(grade);
              updateTeacherAssignDraft(draftKey, { grades: next });
            },
            style:{ background:selected?'#E60012':'#fff', color:selected?'#fff':'rgba(0,0,0,0.62)', border:selected?'2px solid #E60012':'1.5px solid #d6dbde', borderRadius:'999px', padding:'6px 11px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, grade);
        })
      ),
      React.createElement('button', {
        onClick: async function() {
          if ((draft.grades || []).length === 0) { alert('학년을 1개 이상 선택해 주세요.'); return; }
          var newTags = (draft.grades || []).map(function(g) { return sub + '-' + draft.level + ' ' + g; });
          var existing = getTeacherGradeAssignments(t).filter(function(a) { return String(a).indexOf(sub + '-') !== 0; });
          var merged = existing.concat(newTags);
          var gradeStr = Array.from(new Set(merged.filter(Boolean))).join(',');
          var schoolStr = '';
          await sb.from('students').update({ grade: gradeStr, school: schoolStr }).eq('id', t.id);
          setDbTeachers(function(ts) { return ts.map(function(x) { return x.id===t.id ? Object.assign({},x,{grade:gradeStr,school:schoolStr}) : x; }); });
          updateTeacherAssignDraft(draftKey, { grades:[] });
        },
        style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, '저장')
    ),

    // 현재 배정된 학년 태그
    savedAssignments.length === 0
      ? React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.35)', fontFamily:'Manrope, sans-serif' } }, '배정된 학년 없음')
      : React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
          savedAssignments.map(function(a) {
            return React.createElement('button', {
              key:a,
              onClick: async function() {
                var tagToRemove = sub + '-' + a;
                var updated = getTeacherGradeAssignments(t).filter(function(x) { return x !== tagToRemove; });
                var gradeStr = updated.join(',');
                await sb.from('students').update({ grade: gradeStr, school: '' }).eq('id', t.id);
                setDbTeachers(function(ts) { return ts.map(function(x) { return x.id===t.id ? Object.assign({},x,{grade:gradeStr}) : x; }); });
              },
              style:{ background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'999px', padding:'5px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
            }, a + ' ×');
          }),
          React.createElement('button', {
            onClick: async function() {
              if (!confirm(sub + ' 과목의 배정을 전체 초기화할까요?')) return;
              var updated = getTeacherGradeAssignments(t).filter(function(x) { return String(x).indexOf(sub + '-') !== 0; });
              var gradeStr = updated.join(',');
              await sb.from('students').update({ grade: gradeStr, school: '' }).eq('id', t.id);
              setDbTeachers(function(ts) { return ts.map(function(x) { return x.id===t.id ? Object.assign({},x,{grade:gradeStr}) : x; }); });
            },
            style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'999px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, '초기화')
        )
  );
}),

// 담당 반 관리
React.createElement('div', { style:{ marginTop:'16px', paddingTop:'14px', borderTop:'1px solid #edf0f2' } },
  React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, '담당 반 관리'),
  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '실제 운영 중인 반을 추가하고 학생을 배정합니다. 선생님 페이지의 담당 클래스에 표시됩니다.'),
  (function(){
    var draft = classManageDrafts[t.id] || { name:'', level:'초등', grade:'', subject:'' };
    return React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px', marginBottom:'12px', display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' } },
      React.createElement('input', {
        value: draft.name,
        onChange: function(e){ var v = e.target.value; setClassManageDrafts(function(prev){ var next = Object.assign({}, prev); next[t.id] = Object.assign({}, draft, { name: v }); return next; }); },
        placeholder: '반 이름 (예: 고1 영어 A반)',
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
      }),
      React.createElement('select', {
        value: draft.level,
        onChange: function(e){ var v = e.target.value; setClassManageDrafts(function(prev){ var next = Object.assign({}, prev); next[t.id] = Object.assign({}, draft, { level: v, grade: '' }); return next; }); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', {value:'초등'}, '초등'),
        React.createElement('option', {value:'중등'}, '중등'),
        React.createElement('option', {value:'고등'}, '고등')
      ),
      React.createElement('select', {
        value: draft.grade,
        onChange: function(e){ var v = e.target.value; setClassManageDrafts(function(prev){ var next = Object.assign({}, prev); next[t.id] = Object.assign({}, draft, { grade: v }); return next; }); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', {value:''}, '학년'),
        SCHOOL_LEVELS[draft.level].grades.map(function(g){ return React.createElement('option', {key:g, value:g}, g); })
      ),
      React.createElement('select', {
        value: draft.subject,
        onChange: function(e){ var v = e.target.value; setClassManageDrafts(function(prev){ var next = Object.assign({}, prev); next[t.id] = Object.assign({}, draft, { subject: v }); return next; }); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', {value:''}, '과목 (선택)'),
        SUBJECTS.map(function(s){ return React.createElement('option', {key:s, value:s}, s); })
      ),
      React.createElement('button', {
        onClick: function(){ createTeacherClass(t, draft); },
        style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, '+ 반 추가')
    );
  })(),
  (function(){
    var realClasses = getRealClassesForTeacher(t);
    if (realClasses.length === 0) {
      return React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', textAlign:'center', padding:'12px' } }, '아직 배정된 반이 없습니다');
    }
    return realClasses.map(function(cls){
      var clsStudents = classStudents[cls.id] || [];
      var isExpanded = expandedClassId === cls.id;
      return React.createElement('div', { key:cls.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', marginBottom:'8px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
          React.createElement('div', { style:{ flex:1, cursor:'pointer' }, onClick: function(){ setExpandedClassId(isExpanded?null:cls.id); setClassStudentSearch(''); } },
            React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, cls.name),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, [cls.grade, cls.subject].filter(Boolean).join(' · ') + ' · ' + clsStudents.length + '명')
          ),
          React.createElement('button', {
            onClick: function(){ deleteTeacherClass(cls.id); },
            style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, '삭제'),
          React.createElement('span', { onClick: function(){ setExpandedClassId(isExpanded?null:cls.id); setClassStudentSearch(''); }, style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', cursor:'pointer', transition:'transform 0.2s', transform: isExpanded?'rotate(180deg)':'none' } }, '▾')
        ),
        isExpanded && React.createElement('div', { style:{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #f3f4f6' } },
          clsStudents.length > 0 && React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' } },
            clsStudents.map(function(sid){
              var stu = dbStudents.find(function(x){ return x.id === sid; });
              if (!stu) return null;
              return React.createElement('div', { key:sid, style:{ background:'#FFEBED', borderRadius:'20px', padding:'4px 12px', display:'flex', alignItems:'center', gap:'6px' } },
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, stu.name + (stu.grade?' ('+stu.grade+')':'')),
                React.createElement('button', { onClick: function(){ removeStudentFromClass(cls.id, sid); }, style:{ background:'none', border:'none', cursor:'pointer', color:'#E60012', fontSize:'14px', lineHeight:1, fontWeight:'700' } }, '×')
              );
            })
          ),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } }, '학생 추가'),
            React.createElement('input', {
              value: classStudentSearch,
              onChange: function(e){ setClassStudentSearch(e.target.value); },
              placeholder: '학생명·학교 검색',
              style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', width:'100%', marginBottom:'8px', boxSizing:'border-box' }
            }),
            (function(){
              var q = classStudentSearch.trim().toLowerCase();
              if (!q) return React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '검색어를 입력하면 학생이 표시됩니다');
              var candidates = dbStudents.filter(function(stu){
                if (clsStudents.includes(stu.id)) return false;
                var hay = [stu.name, stu.school, stu.phone, stu.grade].filter(Boolean).join(' ').toLowerCase();
                return hay.indexOf(q) >= 0;
              }).slice(0, 8);
              if (candidates.length === 0) return React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '검색 결과가 없습니다');
              return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
                candidates.map(function(stu){
                  return React.createElement('button', { key:stu.id, onClick: function(){ addStudentToClass(cls.id, stu.id); }, style:{ background:'#f9f9f9', border:'1px solid #e5e7eb', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' } },
                    React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, stu.name),
                    React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', fontSize:'11px' } }, [stu.school, stu.grade, stu.phone].filter(Boolean).join(' · ')),
                    React.createElement('span', { style:{ marginLeft:'auto', color:'#E60012', fontWeight:'800' } }, '+ 추가')
                  );
                })
              );
            })()
          )
        )
      );
    });
  })()
),

// 전체 배정 현황
React.createElement('div', { style:{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #edf0f2', fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } },
  '온라인 강좌는 관리자가 강좌 관리에서 선생님에게 강좌를 배정한 후, 선생님이 직접 영상을 등록합니다.'
)
)
)
)
)
)
),

/* ── 선생님 기록 TAB ── */
tab==='records' && React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '선생님 기록'),
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '선생님이 등록한 학생 특이사항·상담 기록을 확인합니다.'),

React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' } },
React.createElement('select', {
  value: recordsTeacherFilter,
  onChange: function(e) { setRecordsTeacherFilter(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '선생님 전체'),
  dbTeacherProfiles.map(function(t){ return React.createElement('option', { key:t.id, value:String(t.id) }, t.name || t.email || '선생님'); })
),
React.createElement('select', {
  value: recordsTypeFilter,
  onChange: function(e) { setRecordsTypeFilter(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '유형 전체'),
  ['특이사항','학습태도','상담','과제','기타'].map(function(t){ return React.createElement('option', { key:t, value:t }, t); })
),
React.createElement('input', {
  value: recordsSearch,
  onChange: function(e) { setRecordsSearch(e.target.value); },
  placeholder: '학생명·내용 검색',
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'200px', flex:1 }
})
),

(function() {
  var q = recordsSearch.trim().toLowerCase();
  var filtered = (adminRecords || []).filter(function(r) {
    if (recordsTeacherFilter !== '전체' && String(r.teacher_id) !== String(recordsTeacherFilter)) return false;
    if (recordsTypeFilter !== '전체' && r.note_type !== recordsTypeFilter) return false;
    if (q) {
      var hay = [r.students?.name, r.teachers?.name, r.note_type, r.content].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '기록이 없습니다');
  }

  return React.createElement('div', null,
    React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', padding:'8px 18px', marginBottom:'4px' } }, filtered.length + '건'),
    filtered.map(function(r) {
      return React.createElement('div', { key:r.id, style:{ ...cardS, marginBottom:'10px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'8px' } },
          React.createElement('span', { style:{ fontSize:'12px', fontWeight:'800', background:'#ecfdf5', color:'#065f46', borderRadius:'6px', padding:'2px 10px', fontFamily:'Manrope, sans-serif' } }, r.note_type || '기록'),
          r.students?.name && React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, r.students.name + (r.students.grade?' ('+r.students.grade+')':'')),
          r.teachers?.name && React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '· ' + r.teachers.name + ' 선생님'),
          React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginLeft:'auto' } }, r.note_date || (r.created_at||'').slice(0,10))
        ),
        React.createElement('p', { style:{ margin:0, fontSize:'14px', color:'rgba(0,0,0,0.75)', lineHeight:'1.7', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif' } }, r.content || '')
      );
    })
  );
})()
),

/* ── 성적 분석 TAB ── */
tab==='analysis' && React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '성적 분석'),
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '선생님이 등록한 시험 성적을 통합해서 확인합니다.'),

React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' } },
React.createElement('select', {
  value: analysisClassId,
  onChange: function(e){ setAnalysisClassId(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'' }, '반 전체'),
  (teacherClasses || []).filter(function(c){ return c.grade; }).map(function(c){ return React.createElement('option', { key:c.id, value:String(c.id) }, c.name); })
),
React.createElement('select', {
  value: analysisTeacherId,
  onChange: function(e){ setAnalysisTeacherId(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '선생님 전체'),
  dbTeacherProfiles.map(function(t){ return React.createElement('option', { key:t.id, value:String(t.id) }, t.name || t.email || '선생님'); })
),
React.createElement('select', {
  value: analysisSubject,
  onChange: function(e){ setAnalysisSubject(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '과목 전체'),
  SUBJECTS.map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
),
React.createElement('select', {
  value: analysisTestName,
  onChange: function(e){ setAnalysisTestName(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '시험 전체'),
  ['주간평가','월말평가','1학기 중간','1학기 기말','2학기 중간','2학기 기말'].map(function(n){ return React.createElement('option', { key:n, value:n }, n); })
),
React.createElement('input', {
  value: analysisSearch,
  onChange: function(e){ setAnalysisSearch(e.target.value); },
  placeholder: '학생명·선생님명 검색',
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
})
),

(function(){
  if (!analysisClassId) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '반을 선택해 주세요');
  }
  var q = analysisSearch.trim().toLowerCase();
  var scoresFiltered = (adminAnalysis || []).filter(function(s){
    if (analysisTeacherId !== '전체' && String(s.teacher_id) !== String(analysisTeacherId)) return false;
    if (analysisSubject !== '전체' && s.subject !== analysisSubject) return false;
    if (analysisTestName !== '전체' && s.test_name !== analysisTestName) return false;
    return true;
  });
  var targetIds = (classStudents[analysisClassId] || []).map(String);
  var subjectActive = analysisSubject !== '전체';
  var testNameActive = analysisTestName !== '전체';
  var teacherActive = analysisTeacherId !== '전체';
  function scoreAnalysisFallback(sid) {
    var match = (adminAnalysis || []).find(function(s){ return String(s.student_id) === sid; });
    return match && match.students ? match.students : {};
  }
  var rows = targetIds.map(function(sid){
    var stu = dbStudents.find(function(x){ return String(x.id) === sid; });
    var fallbackStu = scoreAnalysisFallback(sid);
    var name = (stu && stu.name) || fallbackStu.name || '학생';
    var grade = (stu && stu.grade) || fallbackStu.grade || '';
    var myScores = scoresFiltered.filter(function(s){ return String(s.student_id) === sid; })
      .slice().sort(function(a,b){ return (a.test_date||'').localeCompare(b.test_date||''); });
    if ((subjectActive || testNameActive || teacherActive) && myScores.length === 0) return null;
    if (q && name.toLowerCase().indexOf(q) < 0) return null;
    var myVals = myScores.map(function(s){ return Number(s.score); }).filter(function(v){ return !isNaN(v); });
    var myAvg = myVals.length ? myVals.reduce(function(a,b){return a+b;},0)/myVals.length : null;
    var last = myScores[myScores.length-1] || null;
    var prev = myScores[myScores.length-2] || null;
    return { id:sid, name:name, grade:grade, scores: myScores, avg: myAvg, last: last, prev: prev, parent_phone: (stu && (stu.parent_phone||stu.phone))||null };
  }).filter(Boolean);

  if (rows.length === 0) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '표시할 학생이 없습니다');
  }

  // 시험 회차 계산
  var testKeys = Array.from(new Set(scoresFiltered.filter(function(s){ return targetIds.indexOf(String(s.student_id)) >= 0; }).map(function(s){ return (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||''); }))).filter(Boolean).sort();
  var lastKey = testKeys[testKeys.length-1] || null;
  var prevKey = testKeys[testKeys.length-2] || null;
  function avgForKey(key){ if(!key) return null; var arr = scoresFiltered.filter(function(s){ return ((s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'')) === key && targetIds.indexOf(String(s.student_id))>=0; }).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);}); return arr.length ? arr.reduce(function(a,b){return a+b;},0)/arr.length : null; }
  var lastAvg = avgForKey(lastKey);
  var prevAvg = avgForKey(prevKey);
  var avgChange = (lastAvg != null && prevAvg != null) ? lastAvg - prevAvg : null;
  var lastVals = lastKey ? scoresFiltered.filter(function(s){ return ((s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'')) === lastKey && targetIds.indexOf(String(s.student_id))>=0; }).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);}) : [];
  var lastMax = lastVals.length ? Math.max.apply(null, lastVals) : null;
  var lastMin = lastVals.length ? Math.min.apply(null, lastVals) : null;
  var lastTakers = lastVals.length;
  var buckets = { g1:0, g2:0, g3:0, fail:0 };
  lastVals.forEach(function(v){ var b = adminGradeBucket(v); if(b===1) buckets.g1++; else if(b===2) buckets.g2++; else if(b===3) buckets.g3++; else buckets.fail++; });
  var distLabels = ['0-59','60-69','70-79','80-89','90-100'];
  var dist = { '0-59':0,'60-69':0,'70-79':0,'80-89':0,'90-100':0 };
  lastVals.forEach(function(v){ var b = adminDistBucket(v); if(b) dist[b]++; });
  var distMax = Math.max.apply(null, [1].concat(distLabels.map(function(l){ return dist[l]; })));
  var lastStudentScores = lastKey ? rows.map(function(r){ var s = r.scores.find(function(x){ return ((x.test_date||'')+'|'+(x.test_name||'')+'|'+(x.subject||'')) === lastKey; }); return s ? { id:r.id, name:r.name, score: Number(s.score) } : null; }).filter(Boolean).sort(function(a,b){ return b.score - a.score; }) : [];
  var trendKeys = testKeys.slice(-5);
  var trend = trendKeys.map(function(k){ return { key:k, label: k.split('|')[0] || '-', avg: avgForKey(k) }; });
  var stuStats = rows.map(function(r){
    var firstHalf = r.scores.slice(0, Math.max(1, Math.floor(r.scores.length/2))).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);});
    var secondHalf = r.scores.slice(Math.floor(r.scores.length/2)).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);});
    var firstAvg = firstHalf.length ? firstHalf.reduce(function(a,b){return a+b;},0)/firstHalf.length : null;
    var secondAvg = secondHalf.length ? secondHalf.reduce(function(a,b){return a+b;},0)/secondHalf.length : null;
    var change = (firstAvg!=null && secondAvg!=null) ? secondAvg - firstAvg : null;
    var last3 = r.scores.slice(-3).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);});
    var consecutiveDrop = last3.length === 3 && last3[0] > last3[1] && last3[1] > last3[2];
    var allHigh = r.scores.length >= 2 && r.scores.every(function(s){ return Number(s.score) >= 80; });
    return { id:r.id, name:r.name, avg:r.avg, change:change, consecutiveDrop:consecutiveDrop, allHigh:allHigh };
  });
  var ranked = stuStats.slice().filter(function(s){return s.avg!=null;}).sort(function(a,b){return b.avg-a.avg;});
  var movers = stuStats.slice().filter(function(s){return s.change!=null;}).sort(function(a,b){return b.change-a.change;});
  var topUp = movers.slice(0,3).filter(function(s){return s.change>0;});
  var topDown = movers.slice(-3).filter(function(s){return s.change<0;}).reverse();
  var stars = stuStats.filter(function(s){return s.allHigh;});
  var watch = stuStats.filter(function(s){return s.consecutiveDrop;});
  var focusStudent = analysisStudentId ? rows.find(function(r){return String(r.id)===String(analysisStudentId);}) : null;
  var cardLabel = { fontSize:'12px', color:'#6b7280', marginTop:'4px', fontFamily:'Manrope, sans-serif' };
  var cardVal = { fontSize:'18px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' };

  function summaryCards() {
    return React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'14px' } },
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } },
        React.createElement('div', { style:cardVal }, lastAvg != null ? lastAvg.toFixed(1)+'점' : '-'),
        React.createElement('div', { style:cardLabel }, '이번 시험 평균'),
        avgChange != null && React.createElement('div', { style:{ fontSize:'11px', marginTop:'4px', fontWeight:'700', color: avgChange >= 0 ? '#E60012' : '#c82014', fontFamily:'Manrope, sans-serif' } }, (avgChange >= 0 ? '▲ ' : '▼ ') + Math.abs(avgChange).toFixed(1) + '점 (전회 대비)')
      ),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, lastMax!=null ? lastMax+'점' : '-'), React.createElement('div',{style:cardLabel}, '이번 시험 최고점')),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, lastMin!=null ? lastMin+'점' : '-'), React.createElement('div',{style:cardLabel}, '이번 시험 최저점')),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, (lastTakers||'-')+'명'), React.createElement('div',{style:cardLabel}, '응시 인원'))
    );
  }
  function gradeBucketsRow() {
    var defs = [
      { label:'1등급(90+)', val: buckets.g1, color:'#E60012' },
      { label:'2등급(80+)', val: buckets.g2, color:'#3A3A3A' },
      { label:'3등급(70+)', val: buckets.g3, color:'#F8B500' },
      { label:'미달(<70)', val: buckets.fail, color:'#c82014' },
    ];
    return React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'20px' } },
      defs.map(function(b){ return React.createElement('div', { key:b.label, style:{ background:'#fff', border:'1px solid '+b.color+'33', borderRadius:'10px', padding:'12px', textAlign:'center' } },
        React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:b.color, fontFamily:'Manrope, sans-serif' } }, b.val+'명'),
        React.createElement('div', { style:cardLabel }, b.label)
      ); })
    );
  }
  function distChart() {
    return React.createElement('div', { style:{ marginBottom:'20px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '점수 분포 (이번 시험)'),
      lastVals.length === 0 ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'12px' } }, '이번 시험 응시 데이터가 없습니다.')
        : React.createElement('div', { style:{ display:'flex', alignItems:'flex-end', gap:'10px', height:'140px', borderBottom:'2px solid #e5e7eb', padding:'0 8px' } },
          distLabels.map(function(l){
            var v = dist[l];
            var h = Math.round((v / distMax) * 120);
            var color = l === '90-100' ? '#E60012' : l === '80-89' ? '#3A3A3A' : l === '70-79' ? '#F8B500' : l === '60-69' ? '#dd6b20' : '#c82014';
            return React.createElement('div', { key:l, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' } },
              React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, v+'명'),
              React.createElement('div', { style:{ width:'100%', height:h+'px', background:color, borderRadius:'6px 6px 0 0' } }),
              React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'6px', fontFamily:'Manrope, sans-serif' } }, l)
            );
          })
        )
    );
  }
  function studentBars() {
    if (lastStudentScores.length === 0) return null;
    return React.createElement('div', { style:{ marginBottom:'20px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '학생별 점수 (이번 시험, 높은순)'),
      lastStudentScores.map(function(it){
        var pct = Math.max(0, Math.min(100, it.score));
        return React.createElement('div', { key:it.id, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' } },
          React.createElement('span', { style:{ width:'80px', fontSize:'12px', color:'#374151', fontWeight:'600', fontFamily:'Manrope, sans-serif' } }, it.name),
          React.createElement('div', { style:{ flex:1, height:'14px', background:'#f3f4f6', borderRadius:'7px', overflow:'hidden' } }, React.createElement('div', { style:{ width:pct+'%', height:'100%', background:adminColorForScore(it.score) } })),
          React.createElement('span', { style:{ width:'44px', fontSize:'12px', fontWeight:'700', color:adminColorForScore(it.score), textAlign:'right', fontFamily:'Manrope, sans-serif' } }, it.score+'점')
        );
      })
    );
  }
  function trendLine() {
    if (trend.length < 2) return null;
    var w = 600, h = 160, padL = 40, padR = 20, padT = 16, padB = 30;
    var n = trend.length;
    var avgs = trend.map(function(t){return t.avg;});
    var validAvgs = avgs.filter(function(v){return v!=null;});
    if (!validAvgs.length) return null;
    var minY = 0, maxY = 100;
    var xs = trend.map(function(_, i){ return n === 1 ? (w-padL-padR)/2 + padL : padL + i * ((w-padL-padR)/(n-1)); });
    var ys = avgs.map(function(v){ return v == null ? null : (h - padB - ((v - minY) / (maxY - minY)) * (h - padT - padB)); });
    var pathD = '';
    ys.forEach(function(y, i){ if (y != null) pathD += (pathD ? ' L ' : 'M ') + xs[i] + ',' + y; });
    return React.createElement('div', { style:{ marginBottom:'20px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '시험 회차별 평균 추이 (최근 ' + trend.length + '회)'),
      React.createElement('svg', { viewBox:'0 0 600 160', style:{ width:'100%', height:'160px', background:'#f9fafb', borderRadius:'10px' } },
        [0,25,50,75,100].map(function(g){ var y = h - padB - ((g - minY) / (maxY - minY)) * (h - padT - padB); return React.createElement('g', { key:g },
          React.createElement('line', { x1:padL, y1:y, x2:w-padR, y2:y, stroke:'#e5e7eb', strokeWidth:'1' }),
          React.createElement('text', { x:padL-4, y:y+4, textAnchor:'end', fontSize:'10', fill:'#9ca3af' }, g)
        ); }),
        React.createElement('path', { d:pathD, fill:'none', stroke:'#E60012', strokeWidth:'2.5' }),
        ys.map(function(y, i){ return y == null ? null : React.createElement('g', { key:i },
          React.createElement('circle', { cx:xs[i], cy:y, r:'4', fill:'#E60012' }),
          React.createElement('text', { x:xs[i], y:y-8, textAnchor:'middle', fontSize:'11', fontWeight:'700', fill:'#E60012' }, avgs[i].toFixed(1)),
          React.createElement('text', { x:xs[i], y:h-padB+16, textAnchor:'middle', fontSize:'10', fill:'#6b7280' }, trend[i].label)
        ); })
      )
    );
  }
  function cumulativeBlock() {
    return React.createElement('div', { style:{ marginBottom:'20px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '누적 분석 (전체 시험 기록 기반)'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' } },
        React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#E60012', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '가장 많이 오른 학생 TOP 3'),
          topUp.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : topUp.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#E60012',fontWeight:'700'}}, '+'+s.change.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#fef2f2', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#c82014', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '가장 많이 떨어진 학생 TOP 3'),
          topDown.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : topDown.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#c82014',fontWeight:'700'}}, s.change.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#E60012', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '꾸준히 상위권'),
          stars.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : stars.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#E60012',fontWeight:'700'}}, '평균 '+s.avg.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#fff7ed', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#c2410c', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '최근 3회 연속 하락'),
          watch.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : watch.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name); })
        )
      ),
      React.createElement('div', { style:{ marginTop:'10px' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '학생별 평균 누적 순위'),
        ranked.map(function(s, i){ return React.createElement('div', { key:s.id, style:{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', borderBottom: i < ranked.length-1 ? '1px solid #f3f4f6' : 'none' } },
          React.createElement('span', { style:{ width:'24px', fontSize:'12px', fontWeight:'700', color: i<3?'#E60012':'#9ca3af', fontFamily:'Manrope, sans-serif' } }, (i+1)+'위'),
          React.createElement('span', { style:{ flex:1, fontSize:'12px', color:'#374151', fontFamily:'Manrope, sans-serif' } }, s.name),
          React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color: adminColorForScore(s.avg), fontFamily:'Manrope, sans-serif' } }, s.avg.toFixed(1)+'점')
        ); })
      )
    );
  }
  function focusBlock() {
    return React.createElement('div', { style:{ marginBottom:'20px', background:'#f9fafb', borderRadius:'10px', padding:'14px' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
        React.createElement('span', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '학생 개인별 추이'),
        React.createElement('select', { value:analysisStudentId, onChange:function(e){ setAnalysisStudentId(e.target.value); }, style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff' } },
          React.createElement('option', { value:'' }, '학생 선택'),
          rows.map(function(r){ return React.createElement('option', { key:r.id, value:r.id }, r.name); })
        )
      ),
      !focusStudent ? React.createElement('div', { style:{ fontSize:'12px', color:'#9ca3af' } }, '학생을 선택하면 개인 추이가 표시됩니다.') : (function(){
        var w = 600, h = 160, padL = 40, padR = 20, padT = 16, padB = 30;
        var ss = focusStudent.scores;
        var n = ss.length;
        if (n === 0) return null;
        var v = ss.map(function(s){return Number(s.score);});
        var xs = ss.map(function(_, i){ return n === 1 ? (w-padL-padR)/2 + padL : padL + i * ((w-padL-padR)/(n-1)); });
        var ys = v.map(function(x){ return isNaN(x) ? null : (h - padB - (x / 100) * (h - padT - padB)); });
        var pathD = '';
        ys.forEach(function(y, i){ if (y != null) pathD += (pathD ? ' L ' : 'M ') + xs[i] + ',' + y; });
        return React.createElement('svg', { viewBox:'0 0 600 160', style:{ width:'100%', height:'160px', background:'#fff', borderRadius:'8px' } },
          [0,50,100].map(function(g){ var y = h - padB - (g / 100) * (h - padT - padB); return React.createElement('g', { key:g },
            React.createElement('line', { x1:padL, y1:y, x2:w-padR, y2:y, stroke:'#e5e7eb', strokeWidth:'1' }),
            React.createElement('text', { x:padL-4, y:y+4, textAnchor:'end', fontSize:'10', fill:'#9ca3af' }, g)
          ); }),
          React.createElement('path', { d:pathD, fill:'none', stroke:'#F8B500', strokeWidth:'2.5' }),
          ys.map(function(y, i){ return y == null ? null : React.createElement('g', { key:i },
            React.createElement('circle', { cx:xs[i], cy:y, r:'4', fill:adminColorForScore(v[i]) }),
            React.createElement('text', { x:xs[i], y:y-8, textAnchor:'middle', fontSize:'11', fontWeight:'700', fill:adminColorForScore(v[i]) }, v[i]),
            React.createElement('text', { x:xs[i], y:h-padB+16, textAnchor:'middle', fontSize:'10', fill:'#6b7280' }, ss[i].test_name || '-')
          ); })
        );
      })()
    );
  }
  function studentRows() {
    return rows.map(function(r){
      var lastScore = r.last ? Number(r.last.score) : null;
      var prevScore = r.prev ? Number(r.prev.score) : null;
      var trendVals = r.scores.map(function(s){return Number(s.score);}).filter(function(v){return !isNaN(v);});
      var aiComment = B2Utils.generateComment({
        studentName: r.name, score: lastScore, prevScore: prevScore, classAvg: lastAvg, recentTrend: trendVals,
        subject: r.last ? r.last.subject : '', testName: r.last ? r.last.test_name : ''
      });
      return React.createElement('div', { key:r.id, style:{ marginBottom:'12px', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden' } },
        React.createElement('div', { style:{ background:'#1A1A1A', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' } },
          React.createElement('div', null,
            React.createElement('span', { style:{ fontWeight:'800', color:'#fff', fontSize:'14px', fontFamily:'Manrope, sans-serif' } }, r.name),
            r.grade && React.createElement('span', { style:{ color:'rgba(255,255,255,0.6)', fontSize:'12px', marginLeft:'8px', fontFamily:'Manrope, sans-serif' } }, r.grade),
            React.createElement('span', { style:{ color:'rgba(255,255,255,0.85)', fontSize:'12px', marginLeft:'12px', fontFamily:'Manrope, sans-serif' } }, r.scores.length + '회 · 평균 ' + (r.avg != null ? r.avg.toFixed(1)+'점' : '-'))
          ),
          React.createElement('div', { style:{ display:'flex', gap:'6px' } },
            React.createElement('button', { onClick:function(){ setReportStudentId(r.id); }, style:{ background:'#fff', color:'#1A1A1A', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '학부모 리포트'),
            React.createElement('button', { onClick:function(){ setKakaoTarget({ mode:'single', students:[{ id:r.id, name:r.name, last:r.last, prev:r.prev, parent_phone:r.parent_phone }] }); }, style:{ background:'#F8B500', color:'#fff', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '알림톡')
          )
        ),
        React.createElement('div', { style:{ padding:'12px 16px' } },
          r.scores.length === 0 ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'13px', fontStyle:'italic', fontFamily:'Manrope, sans-serif' } }, '아직 등록된 성적이 없습니다 (미응시)')
            : [
              r.scores.slice().sort(function(a,b){ return (b.test_date||'').localeCompare(a.test_date||''); }).map(function(s, si){
                var pct = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
                return React.createElement('div', { key:si, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' } },
                  React.createElement('div', { style:{ width:'180px', flexShrink:0 } },
                    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'600', color:'#374151', fontFamily:'Manrope, sans-serif' } }, s.test_name || '(무제)'),
                    React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, [s.subject, s.test_date].filter(Boolean).join(' · '))
                  ),
                  React.createElement('span', { style:{ width:'90px', fontSize:'11px', color:'#9ca3af', flexShrink:0, fontFamily:'Manrope, sans-serif' } }, (s.teachers && s.teachers.name) ? s.teachers.name + ' 선생님' : ''),
                  React.createElement('div', { style:{ flex:1, height:'14px', background:'#f3f4f6', borderRadius:'7px', overflow:'hidden' } }, React.createElement('div', { style:{ width:pct+'%', height:'100%', background:adminColorForScore(s.score) } })),
                  React.createElement('span', { style:{ width:'44px', fontSize:'13px', fontWeight:'700', color:adminColorForScore(s.score), textAlign:'right', flexShrink:0, fontFamily:'Manrope, sans-serif' } }, s.score+'점')
                );
              }),
              React.createElement('div', { key:'aic', style:{ marginTop:'10px', padding:'10px 12px', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'8px' } },
                React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, 'AI 자동 코멘트 (학부모 전달용)'),
                React.createElement('div', { style:{ fontSize:'13px', color:'#374151', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } }, aiComment)
              )
            ]
        )
      );
    });
  }
  function paperPlaceholder() {
    return React.createElement('div', { style:{ marginTop:'24px', padding:'18px', background:'#f9fafb', border:'1px dashed #d6dbde', borderRadius:'12px', textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '시험지 분석'),
      React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '문제별 정답률 · 유형별 취약점 · 학생별 약점 개념 · 학습 우선순위 제안'),
      React.createElement('button', { disabled:true, style:{ background:'#e5e7eb', color:'#9ca3af', border:'none', borderRadius:'6px', padding:'8px 16px', fontSize:'12px', fontWeight:'700', cursor:'not-allowed', fontFamily:'Manrope, sans-serif' } }, '시험지 PDF 업로드 (준비 중)'),
      React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'8px', fontFamily:'Manrope, sans-serif' } }, '시험지 분석 기능은 준비 중입니다.')
    );
  }
  function bulkButton() {
    return React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', gap:'8px', marginBottom:'12px' } },
      React.createElement('button', { onClick:function(){ setKakaoTarget({ mode:'bulk', students: rows.map(function(r){ return { id:r.id, name:r.name, last:r.last, prev:r.prev, parent_phone:r.parent_phone }; }) }); }, style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, '전체 학부모 일괄 발송')
    );
  }

  return React.createElement('div', null, summaryCards(), gradeBucketsRow(), distChart(), studentBars(), trendLine(), cumulativeBlock(), focusBlock(), bulkButton(), studentRows(), paperPlaceholder());
})()
),

/* ── 학습 현황 TAB ── */
tab==='views' && React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '학습 현황'),
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '학생별 영상 시청 이력과 학습 진도를 확인합니다.'),

// 필터: 초중고 / 학년 / 강좌 / 검색
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' } },
React.createElement('select', {
  value: viewsLevel,
  onChange: function(e) { setViewsLevel(e.target.value); setViewsGrade('전체'); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '초중고'),
  React.createElement('option', { value:'초등' }, '초등'),
  React.createElement('option', { value:'중등' }, '중등'),
  React.createElement('option', { value:'고등' }, '고등')
),
React.createElement('select', {
  value: viewsGrade,
  onChange: function(e) { setViewsGrade(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '학년'),
  (viewsLevel === '전체'
    ? ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3']
    : SCHOOL_LEVELS[viewsLevel].grades
  ).map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),
React.createElement('select', {
  value: viewsCourse,
  onChange: function(e) { setViewsCourse(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '강좌'),
  state.courses.map(function(c){ return React.createElement('option', { key:c.id, value:String(c.id) }, c.name + (c.subject?' ('+c.subject+')':'')); })
),
React.createElement('input', {
  value: viewsSearch,
  onChange: function(e) { setViewsSearch(e.target.value); },
  placeholder: '학생명·학교·전화 검색',
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'200px', flex:1 }
})
),

// 학습 현황 표시: 필터된 학생 목록 + 펼치면 영상 시청 이력
(function() {
  var q = viewsSearch.trim().toLowerCase();
  var filtered = dbStudents.filter(function(st) {
    if (viewsLevel !== '전체') {
      var lvGrades = SCHOOL_LEVELS[viewsLevel].grades;
      if (!lvGrades.includes(st.grade)) return false;
    }
    if (viewsGrade !== '전체' && st.grade !== viewsGrade) return false;
    if (viewsCourse !== '전체') {
      if (!(st.enrolledCourses || []).map(String).includes(String(viewsCourse))) return false;
    }
    if (q) {
      var hay = [st.name, st.school, st.phone, st.parent_phone, st.grade].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '해당하는 학생이 없습니다');
  }

  return React.createElement('div', null,
    React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', padding:'8px 18px', marginBottom:'4px' } }, filtered.length + '명'),
    filtered.map(function(st) {
      var isOpen = viewsExpandedId === st.id;
      var data = (viewsDataMap[st.id] || []).filter(function(v) {
        if (viewsCourse !== '전체' && String(v.course_id) !== String(viewsCourse)) return false;
        return true;
      });

      return React.createElement('div', { key:st.id, style:{ ...cardS, border: isOpen?'2px solid #1A1A1A':'2px solid transparent', transition:'border 0.15s' } },
        React.createElement('div', {
          style:{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
          onClick: function(){
            if (isOpen) { setViewsExpandedId(null); }
            else { setViewsExpandedId(st.id); loadStudentViews(st.id); }
          }
        },
          React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [st.school, st.grade, st.phone].filter(Boolean).join(' · ') || '정보 없음')
          ),
          st.grade && React.createElement('span', { style:{ background:'#1A1A1A', color:'#fff', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
          React.createElement('span', { style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', transition:'transform 0.2s', transform: isOpen?'rotate(180deg)':'none', flexShrink:0 } }, '▾')
        ),

        isOpen && React.createElement('div', { style:{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
          (function() {
            if (!viewsDataMap[st.id]) {
              return React.createElement('div', { style:{ textAlign:'center', color:'rgba(0,0,0,0.4)', fontSize:'13px', fontFamily:'Manrope, sans-serif', padding:'14px' } }, '불러오는 중...');
            }
            if (data.length === 0) {
              return React.createElement('div', { style:{ textAlign:'center', color:'rgba(0,0,0,0.4)', fontSize:'13px', fontFamily:'Manrope, sans-serif', padding:'14px' } }, '학습 이력이 없습니다');
            }

            var byCourse = {};
            data.forEach(function(v) {
              var key = String(v.course_id);
              if (!byCourse[key]) byCourse[key] = { title: v.courses?.title || '알 수 없는 강좌', subject: v.courses?.subjects?.name || '', videos: [] };
              byCourse[key].videos.push(v);
            });
            var totalVideos = data.length;
            var completed = data.filter(function(v){ return v.progress_pct >= 90; }).length;
            var avgProgress = totalVideos > 0 ? Math.round(data.reduce(function(a,v){ return a + (v.progress_pct||0); }, 0) / totalVideos) : 0;

            return React.createElement('div', null,
              React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'14px' } },
                [
                  { label:'시청 강의', val: totalVideos + '개' },
                  { label:'완료 (90%+)', val: completed + '개' },
                  { label:'평균 진도', val: avgProgress + '%' },
                  { label:'완료율', val: (totalVideos > 0 ? Math.round(completed/totalVideos*100) : 0) + '%' },
                ].map(function(item) {
                  return React.createElement('div', { key:item.label, style:{ background:'#f9f9f9', borderRadius:'10px', padding:'12px', textAlign:'center' } },
                    React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, item.val),
                    React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'3px' } }, item.label)
                  );
                })
              ),
              Object.values(byCourse).map(function(group, gi) {
                var groupCompleted = group.videos.filter(function(v){ return v.progress_pct >= 90; }).length;
                return React.createElement('div', { key:gi, style:{ marginBottom:'10px', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden' } },
                  React.createElement('div', { style:{ background:'#1A1A1A', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' } },
                    React.createElement('span', { style:{ fontWeight:'800', color:'#fff', fontSize:'13px', fontFamily:'Manrope, sans-serif' } }, group.title + (group.subject ? ' · ' + group.subject : '')),
                    React.createElement('span', { style:{ color:'rgba(255,255,255,0.7)', fontSize:'11px', fontFamily:'Manrope, sans-serif' } }, groupCompleted + '/' + group.videos.length + '강 완료')
                  ),
                  React.createElement('div', { style:{ padding:'10px 14px' } },
                    group.videos.map(function(v, vi) {
                      var pct = v.progress_pct || 0;
                      var color = pct >= 90 ? '#E60012' : pct >= 50 ? '#F8B500' : '#e5e7eb';
                      var textColor = pct >= 90 ? '#E60012' : pct >= 50 ? '#F8B500' : 'rgba(0,0,0,0.3)';
                      var lastWatched = v.last_watched_at ? v.last_watched_at.slice(0,10) : '—';
                      return React.createElement('div', { key:vi, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', padding:'5px 0', borderBottom: vi < group.videos.length-1 ? '1px solid #f3f4f6' : 'none' } },
                        React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, v.videos?.title || '강의'),
                        React.createElement('div', { style:{ width:'80px', height:'6px', background:'#f3f4f6', borderRadius:'3px', overflow:'hidden', flexShrink:0 } },
                          React.createElement('div', { style:{ width:pct+'%', height:'100%', background:color, borderRadius:'3px' } })
                        ),
                        React.createElement('span', { style:{ width:'32px', fontSize:'11px', fontWeight:'700', color:textColor, textAlign:'right', flexShrink:0, fontFamily:'Manrope, sans-serif' } }, pct+'%'),
                        React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.3)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, lastWatched)
                      );
                    })
                  )
                );
              })
            );
          })()
        )
      );
    })
  );
})()
),

/* ── 자료실 TAB ── */
tab==='files' && React.createElement('div', null,
  React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '자료실'),
  React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '선생님들이 업로드한 학습 자료 전체를 확인하고 필요 시 삭제할 수 있습니다.'),
  adminAttachLoading ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
  adminAttachments.length === 0 ? React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '업로드된 자료가 없습니다.') :
  adminAttachments.map(function(att){
    var clsName = att.class_id ? ((teacherClasses||[]).find(function(c){ return String(c.id) === String(att.class_id); })||{}).name : '';
    var uploader = (dbTeacherProfiles||[]).find(function(t){ return String(t.id) === String(att.uploaded_by); });
    return React.createElement('div', { key:att.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' } },
      React.createElement('div', { style:{ flex:1, minWidth:'200px' } },
        React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, att.title),
        att.description && React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, att.description),
        React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, [(uploader && uploader.name ? uploader.name + ' 선생님' : ''), att.scope === 'class' ? '클래스: ' + (clsName || '-') : '개별 학생', att.file_name, adminFormatBytes(att.file_size), String(att.created_at||'').slice(0,10)].filter(Boolean).join(' · '))
      ),
      React.createElement('a', { href: adminAttachmentPublicUrl(att.file_path), target:'_blank', rel:'noopener', style:{ background:'#fff', color:'#E60012', border:'1px solid #E60012', textDecoration:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '⬇ 다운로드'),
      React.createElement('button', { onClick:function(){ deleteAdminAttachment(att); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '삭제')
    );
  })
),

/* ── 학원 일정 TAB ── */
tab==='schedule' && React.createElement('div', null,
  React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '학원 일정'),
  React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '선생님들의 강의일정 변경 신청과 학사일정을 조회할 수 있습니다.'),

  /* 서브 탭 토글 */
  React.createElement('div', { style:{ display:'flex', gap:0, borderBottom:'1px solid #e5e7eb', marginBottom:'16px' } },
    [{ id:'change', label:'강의일정 변경 신청' }, { id:'academic', label:'학사일정' }].map(function(sm){
      return React.createElement('button', { key:sm.id, onClick:function(){ setAdminScrMode(sm.id); }, style:{
        padding:'12px 20px', background:'none', border:'none',
        borderBottom: adminScrMode===sm.id ? '2px solid #E60012' : '2px solid transparent',
        fontSize:'14px', fontWeight:'700',
        color: adminScrMode===sm.id ? '#E60012' : 'rgba(0,0,0,0.55)',
        cursor:'pointer', fontFamily:'Manrope, sans-serif', marginBottom:'-1px'
      } }, sm.label);
    })
  ),

  /* 강의일정 변경 신청 모드 */
  adminScrMode === 'change' && (function(){
    var teacherOptions = ['전체'].concat(Array.from(new Set(adminScrList.map(function(r){ return r.teacher_name; }).filter(Boolean))));
    var filtered = adminScrTeacherFilter === '전체' ? adminScrList : adminScrList.filter(function(r){ return r.teacher_name === adminScrTeacherFilter; });
    return React.createElement('div', null,
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', flexWrap:'wrap' } },
        React.createElement('label', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '선생님 필터:'),
        React.createElement('select', { value:adminScrTeacherFilter, onChange:function(e){ setAdminScrTeacherFilter(e.target.value); }, style:{ ...inputS, width:'auto', minWidth:'140px' } },
          teacherOptions.map(function(t){ return React.createElement('option', { key:t, value:t }, t); })
        ),
        React.createElement('div', { style:{ marginLeft:'auto', fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '총 ' + filtered.length + '건')
      ),
      adminScrLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...') :
      filtered.length === 0 ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'40px', textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '신청 내역이 없습니다.') :
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
        filtered.map(function(r){
          return React.createElement('div', { key:r.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'14px' } },
            React.createElement('div', { style:{ minWidth:'92px', flexShrink:0 } },
              React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' } }, String(r.target_date||'')),
              React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, r.teacher_name || '-')
            ),
            React.createElement('div', { style:{ flex:1, minWidth:0 } },
              React.createElement('div', { style:{ fontSize:'13px', color:'#374151', fontFamily:'Manrope, sans-serif', whiteSpace:'pre-line', lineHeight:'1.6' } }, r.reason),
              r.file_path && React.createElement('div', { style:{ marginTop:'6px' } },
                React.createElement('a', { href: adminAttachmentPublicUrl(r.file_path), target:'_blank', rel:'noopener', style:{ fontSize:'12px', color:'#E60012', fontWeight:'700', textDecoration:'underline', fontFamily:'Manrope, sans-serif' } }, '첨부 ' + (r.file_name || '파일') + ' (' + adminFormatBytes(r.file_size) + ')')
              ),
              React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif', marginTop:'4px' } }, '신청일: ' + String(r.created_at||'').slice(0,16).replace('T',' '))
            )
          );
        })
      )
    );
  })(),

  /* 학사일정 모드 */
  adminScrMode === 'academic' && (function(){
    var filtered = adminAcademicCategoryFilter === '전체' ? adminAcademicList : adminAcademicList.filter(function(a){ return a.category === adminAcademicCategoryFilter; });
    return React.createElement('div', null,
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', flexWrap:'wrap' } },
        React.createElement('label', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '분류 필터:'),
        React.createElement('select', { value:adminAcademicCategoryFilter, onChange:function(e){ setAdminAcademicCategoryFilter(e.target.value); }, style:{ ...inputS, width:'auto', minWidth:'120px' } },
          ['전체','vacation','exam','other'].map(function(c){ return React.createElement('option', { key:c, value:c }, c==='전체'?'전체':adminAcademicCategoryLabel(c)); })
        ),
        React.createElement('div', { style:{ marginLeft:'auto', fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '총 ' + filtered.length + '건')
      ),
      adminAcademicLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...') :
      filtered.length === 0 ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'40px', textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '등록된 학사일정이 없습니다.') :
      React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
        filtered.map(function(a){
          return React.createElement('div', { key:a.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'14px' } },
            React.createElement('div', { style:{ flex:1, minWidth:0 } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' } },
                React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background: adminAcademicCategoryColor(a.category), color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, adminAcademicCategoryLabel(a.category)),
                a.school && React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, a.school),
                React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' } }, a.title)
              ),
              React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, String(a.start_date||'') + ' ~ ' + String(a.end_date||'')),
              a.description && React.createElement('div', { style:{ fontSize:'13px', color:'#374151', marginTop:'4px', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif' } }, a.description),
              React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'4px', fontFamily:'Manrope, sans-serif' } }, '등록: ' + (a.creator_name || '-') + ' · ' + String(a.created_at||'').slice(0,10))
            ),
            React.createElement('button', { onClick:function(){ deleteAdminAcademicSchedule(a); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '삭제')
          );
        })
      )
    );
  })()
),

/* ── 시험 관리 TAB ── */
tab==='leveltest' && (function(){
  var KIND_LABELS = { level:'레벨테스트', weekly:'주간 테스트', monthly:'월말 테스트', homework:'숙제' };
  var KIND_COLORS = { level:'#E60012', weekly:'#1d4ed8', monthly:'#7c3aed', homework:'#f59e0b' };
  var visibleTests = adminTestKindFilter === 'all' ? adminLevelTests : adminLevelTests.filter(function(t){ return (t.kind||'level') === adminTestKindFilter; });
  return React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '시험 관리'),
    React.createElement('button', { onClick: adminOpenLtForm, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 새 시험 발행')
  ),
  React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '레벨테스트 / 주간 · 월말 테스트 / 숙제를 발행하고 답안을 자동 채점합니다.'),

  /* 종류 필터 */
  React.createElement('div', { style:{ display:'inline-flex', background:'#f2f0eb', borderRadius:'8px', padding:'3px', gap:'2px', marginBottom:'14px' } },
    [{v:'all',l:'전체'},{v:'level',l:'레벨'},{v:'weekly',l:'주간'},{v:'monthly',l:'월말'},{v:'homework',l:'숙제'}].map(function(o){
      var on = adminTestKindFilter === o.v;
      var count = o.v === 'all' ? adminLevelTests.length : adminLevelTests.filter(function(t){ return (t.kind||'level') === o.v; }).length;
      return React.createElement('button', { key:o.v, onClick:function(){ setAdminTestKindFilter(o.v); }, style:{ background: on?'#1A1A1A':'transparent', color: on?'#fff':'rgba(0,0,0,0.55)', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, o.l + ' ' + count);
    })
  ),

  adminLevelTestLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...') :
  visibleTests.length === 0 ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'40px', textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '발행된 시험이 없습니다.') :
  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'10px' } },
    visibleTests.map(function(t){
      var reqs = adminLevelTestRequests[t.id] || [];
      var subs = adminLevelTestSubs[t.id] || [];
      var imgs = Array.isArray(t.image_paths) ? t.image_paths : [];
      return React.createElement('div', { key:t.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px 16px' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'flex-start', gap:'12px' } },
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' } },
              React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background: KIND_COLORS[t.kind||'level']||'#E60012', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, KIND_LABELS[t.kind||'level']||'레벨테스트'),
              React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background: t.status==='open' ? '#16a34a' : '#6b7280', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, t.status==='open' ? (t.kind==='level' ? '신청 가능' : (t.kind==='homework' ? '제출 가능' : '응시 가능')) : '마감'),
              t.subject && React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, t.subject),
              (t.school_level || t.target_grade) && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#1d4ed8', fontFamily:'Manrope, sans-serif' } }, '대상: ' + [t.school_level, t.target_grade ? t.target_grade + '학년' : null, t.target_semester ? t.target_semester + '학기' : null].filter(Boolean).join(' ')),
              (t.min_score != null && t.max_score != null) && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#c87000', fontFamily:'Manrope, sans-serif' } }, t.min_score + '~' + t.max_score + '점'),
              React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827', fontFamily:'Manrope, sans-serif' } }, t.title)
            ),
            React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } },
              '이미지 ' + imgs.length + '장 · 객관식 ' + (t.question_count||0) + '문항(' + (t.choices_per_question||5) + '지선다)' + ((t.text_question_count||0) > 0 ? ' · 서술형 ' + t.text_question_count + '문항' : '') + (t.time_limit_minutes > 0 ? ' · 제한 ' + t.time_limit_minutes + '분' : '')
            ),
            React.createElement('div', { style:{ fontSize:'12px', color:'#374151', marginTop:'4px', fontFamily:'Manrope, sans-serif' } },
              '신청 ', React.createElement('strong', { style:{ color:'#1d4ed8' } }, reqs.length), '명 · 응시 ', React.createElement('strong', { style:{ color:'#E60012' } }, subs.length), '명',
              (function(){
                if (subs.length === 0) return null;
                var sorted = subs.slice().sort(function(a,b){ return String(b.submitted_at||'').localeCompare(String(a.submitted_at||'')); });
                var latest = sorted[0];
                return React.createElement('span', { style:{ marginLeft:'8px', color:'#6b7280', fontWeight:'500' } }, '최근 응시: ' + (latest.student_name || '-') + ' (' + String(latest.submitted_at||'').slice(0,16).replace('T',' ') + ')');
              })()
            ),
            t.description && React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginTop:'4px', whiteSpace:'pre-line', fontFamily:'Manrope, sans-serif' } }, t.description)
          ),
          React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 } },
            React.createElement('button', { onClick:function(){ adminOpenLtEditForm(t); }, style:{ background:'#1d4ed8', color:'#fff', border:'1px solid #1d4ed8', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '수정'),
            React.createElement('button', { onClick:function(){ adminToggleLtStatus(t); }, style:{ background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, t.status==='open' ? '마감' : '재오픈'),
            React.createElement('button', { onClick:function(){ adminDeleteLevelTest(t); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '삭제')
          )
        ),
        (reqs.length > 0 || subs.length > 0) && React.createElement('details', { style:{ marginTop:'10px' } },
          React.createElement('summary', { style:{ cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '신청자 / 응시자 보기'),
          React.createElement('div', { style:{ marginTop:'8px', display:'flex', flexDirection:'column', gap:'6px' } },
            reqs.map(function(r){
              var matched = subs.find(function(s){ return s.student_id === r.student_id; });
              return React.createElement('div', { key:r.id, style:{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'8px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif' } },
                React.createElement('div', { style:{ fontWeight:'700', color:'#111827' } },
                  r.student_name || '-',
                  React.createElement('span', { style:{ marginLeft:'8px', fontSize:'10px', fontWeight:'800', background: matched ? '#16a34a' : '#9ca3af', color:'#fff', borderRadius:'4px', padding:'2px 6px' } }, matched ? '응시 완료' : '미응시')
                ),
                React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'4px 12px', color:'#6b7280', fontSize:'11px', marginTop:'4px' } },
                  React.createElement('div', null, React.createElement('span', { style:{ color:'#9ca3af' } }, '신청: '), React.createElement('strong', { style:{ color:'#374151' } }, String(r.requested_at||'').slice(0,16).replace('T',' '))),
                  matched && matched.started_at && React.createElement('div', null, React.createElement('span', { style:{ color:'#9ca3af' } }, '응시 시작: '), React.createElement('strong', { style:{ color:'#1d4ed8' } }, String(matched.started_at).slice(0,16).replace('T',' '))),
                  matched && React.createElement('div', null, React.createElement('span', { style:{ color:'#9ca3af' } }, '제출: '), React.createElement('strong', { style:{ color:'#16a34a' } }, String(matched.submitted_at||'').slice(0,16).replace('T',' '))),
                  matched && matched.graded_at && React.createElement('div', null, React.createElement('span', { style:{ color:'#9ca3af' } }, '채점: '), React.createElement('strong', { style:{ color:'#E60012' } }, String(matched.graded_at).slice(0,16).replace('T',' ')))
                ),
                (r.school_level || r.grade || r.semester || r.subject || r.score != null) && React.createElement('div', { style:{ marginTop:'4px', color:'#1d4ed8', fontWeight:'700', fontSize:'11px' } }, '응시 정보: ' + [r.school_level, r.grade ? r.grade + '학년' : null, r.semester ? r.semester + '학기' : null, r.subject, r.score != null ? r.score + '점' : null].filter(Boolean).join(' / ')),
                matched && (t.question_count||0) > 0 && matched.answers && Object.keys(matched.answers).length > 0 && (function(){
                  var ak = (t.answer_key && typeof t.answer_key === 'object') ? t.answer_key : {};
                  var hasKey = Object.keys(ak).length > 0;
                  var qc = t.question_count || 0;
                  var correct = 0;
                  if (hasKey) {
                    for (var i = 1; i <= qc; i++) {
                      if (ak[i] != null && String(matched.answers[i] || '') === String(ak[i])) correct++;
                    }
                  }
                  return React.createElement('div', { style:{ marginTop:'4px', color:'#374151', fontSize:'11px' } },
                    '객관식: ' + Object.keys(matched.answers).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){
                      var my = matched.answers[k];
                      if (!hasKey) return k + '. ' + my;
                      var ok = String(my) === String(ak[k]);
                      return k + '. ' + my + (ok ? ' ✓' : ' ✗(' + ak[k] + ')');
                    }).join(' / '),
                    hasKey && React.createElement('span', { style:{ marginLeft:'8px', fontWeight:'800', color:'#E60012' } }, '자동채점: ' + correct + '/' + qc)
                  );
                })(),
                matched && matched.text_answers && Object.keys(matched.text_answers).length > 0 && Object.keys(matched.text_answers).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){
                  return React.createElement('div', { key:k, style:{ marginTop:'4px', color:'#374151', fontSize:'11px', whiteSpace:'pre-line' } }, '서술형 ' + k + '. ' + matched.text_answers[k]);
                }),
                /* 채점 폼 */
                matched && React.createElement(GradingForm, { exam: t, submission: matched, onSave: adminSaveGrading })
              );
            })
          )
        )
      );
    })
  ),

  /* 발행 모달 */
  adminLtFormOpen && React.createElement('div', { onClick:adminCloseLtForm, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' } },
        React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 } }, adminLtDraft.id ? '시험 수정' : '새 시험 발행'),
        React.createElement('button', { onClick:adminCloseLtForm, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' } }, '×')
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '시험 종류 *'),
      React.createElement('select', { value: adminLtDraft.kind || 'level', onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { kind:e.target.value })); }, style:Object.assign({}, inputS, { marginBottom:'14px', width:'100%', cursor:'pointer' }) },
        React.createElement('option', { value:'level' }, '레벨테스트 (회원이 신청 후 응시)'),
        React.createElement('option', { value:'weekly' }, '주간 테스트 (학원 학생 모두 응시 가능)'),
        React.createElement('option', { value:'monthly' }, '월말 테스트 (학원 학생 모두 응시 가능)'),
        React.createElement('option', { value:'homework' }, '숙제 (학원 학생 모두 제출 가능)')
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '제목 *'),
      React.createElement('input', { value: adminLtDraft.title, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { title:e.target.value })); }, placeholder: adminLtDraft.kind==='weekly' ? '예: 수학 주간 테스트 (중1, 5월 1주차)' : (adminLtDraft.kind==='monthly' ? '예: 수학 월말 테스트 (중1, 5월)' : '예: 수학 레벨테스트 (중1)'), style:Object.assign({}, inputS, { marginBottom:'14px', width:'100%' }) }),
      React.createElement('div', { style:{ display:'flex', gap:'10px', marginBottom:'14px' } },
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '과목 (선택)'),
          React.createElement('select', { value:adminLtDraft.subject, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { subject:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, '과목 선택'),
            ['국어','영어','수학','과학','사회'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
          )
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학교급 *'),
          React.createElement('select', { value:adminLtDraft.school_level, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { school_level:e.target.value, target_grade:'' })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            ['초','중','고'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
          )
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '대상 학년 *'),
          React.createElement('select', { value:adminLtDraft.target_grade, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { target_grade:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, '학년 선택'),
            (adminLtDraft.school_level === '초' ? ['1','2','3','4','5','6'] : ['1','2','3']).map(function(g){ return React.createElement('option', { key:g, value:g }, g + '학년'); })
          )
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '대상 학기 (선택)'),
          React.createElement('select', { value:adminLtDraft.target_semester, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { target_semester:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, '학기 무관'),
            ['1','2'].map(function(s){ return React.createElement('option', { key:s, value:s }, s + '학기'); })
          )
        )
      ),
      React.createElement('div', { style:{ display:'flex', gap:'10px', marginBottom:'14px', alignItems:'flex-end' } },
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '내신 점수 범위 (대상)'),
          React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
            React.createElement('input', { type:'number', min:'0', max:'100', value:adminLtDraft.min_score, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { min_score:window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'80px' }) }),
            React.createElement('span', { style:{ color:'#6b7280', fontSize:'13px' } }, '점 ~'),
            React.createElement('input', { type:'number', min:'0', max:'100', value:adminLtDraft.max_score, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { max_score:window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'80px' }) }),
            React.createElement('span', { style:{ color:'#6b7280', fontSize:'13px' } }, '점')
          ),
          React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' } }, '학생이 입력한 내신 점수가 이 범위에 들면 매칭됩니다.')
        )
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '안내사항 (선택)'),
      React.createElement('textarea', { value:adminLtDraft.description, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { description:e.target.value })); }, rows:2, placeholder:'예: 시험 시간 50분, 객관식 + 서술형', style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'14px' }) }),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '시험지 이미지' + (adminLtDraft.id ? ' (수정 시: 새 파일 선택하면 기존 이미지 교체, 비워두면 기존 유지)' : ' * (여러 장 가능)')),
      adminLtDraft.id && adminLtDraft.existing_paths && adminLtDraft.existing_paths.length > 0 && React.createElement('div', { style:{ fontSize:'11px', color:'#1d4ed8', fontWeight:'700', marginBottom:'4px' } }, '기존 이미지 ' + adminLtDraft.existing_paths.length + '장 등록됨'),
      React.createElement('input', { type:'file', accept:'image/*', multiple:true, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { files: Array.from(e.target.files || []) })); }, style:{ width:'100%', fontSize:'13px', marginBottom:'4px' } }),
      adminLtDraft.files && adminLtDraft.files.length > 0 && React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginBottom:'14px' } }, adminLtDraft.files.length + '장 선택됨'),
      /* 일반 시험: 기존 입력 그대로 */
      adminLtDraft.kind !== 'homework' && React.createElement('div', { style:{ display:'flex', gap:'10px', marginBottom:'10px' } },
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '객관식 문제 수'),
          React.createElement('input', { type:'number', min:'0', value:adminLtDraft.question_count, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { question_count:window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'100%' }) })
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '보기 수'),
          React.createElement('select', { value:adminLtDraft.choices_per_question, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { choices_per_question:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            ['3','4','5'].map(function(n){ return React.createElement('option', { key:n, value:n }, n + '지선다'); })
          )
        )
      ),
      adminLtDraft.kind !== 'homework' && React.createElement('div', { style:{ display:'flex', gap:'10px', marginBottom:'14px' } },
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '서술형 문제 수'),
          React.createElement('input', { type:'number', min:'0', value:adminLtDraft.text_question_count, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { text_question_count:window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'100%' }) })
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '시간 제한 (분, 0=무제한)'),
          React.createElement('input', { type:'number', min:'0', value:adminLtDraft.time_limit_minutes, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { time_limit_minutes:window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'100%' }) })
        )
      ),

      /* 숙제: 답안 종류 통합 카드 */
      adminLtDraft.kind === 'homework' && React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', marginBottom:'14px' } },
        React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#374151', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '답안 종류 — 받을 항목을 골라주세요 (1개 이상)'),

        /* 객관식 */
        (function(){
          var on = parseInt(adminLtDraft.question_count, 10) > 0;
          return React.createElement('div', { style:{ marginBottom:'10px' } },
            React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
              React.createElement('input', { type:'checkbox', checked:on, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { question_count: e.target.checked ? '5' : '0', answer_key: e.target.checked ? (adminLtDraft.answer_key || {}) : {} })); }, style:{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' } }),
              React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827' } }, '객관식')
            ),
            on && React.createElement('div', { style:{ display:'flex', gap:'10px', marginTop:'8px', paddingLeft:'26px' } },
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('label', { style:{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' } }, '문항 수'),
                React.createElement('input', { type:'number', min:'1', value: adminLtDraft.question_count, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { question_count: window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'100%' }) })
              ),
              React.createElement('div', { style:{ flex:1 } },
                React.createElement('label', { style:{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' } }, '보기 수'),
                React.createElement('select', { value: adminLtDraft.choices_per_question, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { choices_per_question: e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
                  ['3','4','5'].map(function(n){ return React.createElement('option', { key:n, value:n }, n + '지선다'); })
                )
              )
            )
          );
        })(),

        /* 서술형 */
        (function(){
          var on = parseInt(adminLtDraft.text_question_count, 10) > 0;
          return React.createElement('div', { style:{ marginBottom:'10px' } },
            React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
              React.createElement('input', { type:'checkbox', checked:on, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { text_question_count: e.target.checked ? '1' : '0' })); }, style:{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' } }),
              React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827' } }, '서술형')
            ),
            on && React.createElement('div', { style:{ marginTop:'8px', paddingLeft:'26px' } },
              React.createElement('label', { style:{ fontSize:'11px', color:'#6b7280', display:'block', marginBottom:'2px' } }, '문항 수'),
              React.createElement('input', { type:'number', min:'1', value: adminLtDraft.text_question_count, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { text_question_count: window.B2Utils.stripLeadingZero(e.target.value) })); }, style:Object.assign({}, inputS, { width:'120px' }) })
            )
          );
        })(),

        /* 녹음 */
        React.createElement('div', null,
          React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
            React.createElement('input', { type:'checkbox', checked: !!adminLtDraft.allow_audio_answer, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { allow_audio_answer:e.target.checked })); }, style:{ width:'18px', height:'18px', cursor:'pointer', accentColor:'#E60012' } }),
            React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827' } }, '녹음 (학생 마이크 답안)')
          ),
          !!adminLtDraft.allow_audio_answer && React.createElement('div', { style:{ marginTop:'4px', paddingLeft:'26px', fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '학생이 마이크로 녹음하여 제출 (최대 5분).')
        )
      ),

      /* 객관식 정답 입력 (직접 기입) */
      (function(){
        var qc = parseInt(adminLtDraft.question_count, 10) || 0;
        if (qc <= 0) return null;
        return React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '객관식 정답 (직접 기입, 비워두면 자동 채점 X)'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px, 1fr))', gap:'6px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px' } },
            Array.from({ length: qc }).map(function(_, i){
              var num = i + 1;
              return React.createElement('div', { key:num, style:{ display:'flex', alignItems:'center', gap:'4px' } },
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#6b7280', minWidth:'22px', textAlign:'right' } }, num + '.'),
                React.createElement('input', { type:'text', value:(adminLtDraft.answer_key && adminLtDraft.answer_key[num]) || '', onChange:function(e){
                  var v = e.target.value;
                  setAdminLtDraft(function(p){
                    var ak = Object.assign({}, p.answer_key || {});
                    if (v) ak[num] = v; else delete ak[num];
                    return Object.assign({}, p, { answer_key: ak });
                  });
                }, placeholder:'예: 3', style:{ flex:1, border:'1px solid #d6dbde', borderRadius:'6px', padding:'5px 6px', fontSize:'12px', fontFamily:'Manrope, sans-serif', textAlign:'center', boxSizing:'border-box' } })
              );
            })
          )
        );
      })(),
      React.createElement('div', { style:{ display:'flex', gap:'8px', marginTop:'8px' } },
        React.createElement('button', { onClick:adminCloseLtForm, style:{ flex:1, background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer' } }, '취소'),
        React.createElement('button', { onClick:adminSubmitLevelTest, disabled:adminLtUploading, style:{ flex:1, background:'#E60012', color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: adminLtUploading?'not-allowed':'pointer', opacity: adminLtUploading ? 0.6 : 1 } }, adminLtUploading ? (adminLtDraft.id ? '저장 중...' : '발행 중...') : (adminLtDraft.id ? '수정 저장' : '발행'))
      )
    )
  )
);
})(),

/* ── 단어장 관리 TAB ── */
tab==='vocab' && window.VocabManager && React.createElement(window.VocabManager, { user: user || { id: null, name: '관리자', role: 'admin' }, isAdmin: true }),

/* ── 학원안내 편집 TAB ── */
tab==='about' && React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '학원안내 페이지 편집'),
    React.createElement('button', { onClick: saveAboutContent, disabled: aboutSaving || !aboutDraft, style:{ background: aboutSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor: aboutSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, aboutSaving ? '저장 중...' : '변경사항 저장')
  ),
  React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, '학원안내 페이지 콘텐츠를 직접 수정합니다. 저장 후 학원안내 페이지를 새로고침하면 반영됩니다.'),
  !aboutDraft ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'18px' } },
    /* 히어로 섹션 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '1. HERO 섹션 (메인 헤더)'),
      ['hero_eyebrow:상단 영문 라벨', 'hero_title_1:타이틀 1행', 'hero_title_2:타이틀 강조 부분', 'hero_title_3:타이틀 끝부분', 'hero_subtitle:부제'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('input', { value: aboutDraft[f] || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
        );
      }),
      React.createElement('label', { style:labelS }, '키워드 (한 줄에 하나씩)'),
      React.createElement('textarea', { value: (aboutDraft.keywords || []).join('\n'), onChange: function(e){ var v = e.target.value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean); setAboutDraft(function(p){ return Object.assign({}, p, { keywords: v }); }); }, rows:4, style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'10px' }) }),
      React.createElement('label', { style:labelS }, '히어로 배경 이미지 (선택)'),
      aboutDraft.hero_image && React.createElement('img', { src: aboutDraft.hero_image, alt:'', style:{ width:'160px', height:'90px', objectFit:'cover', borderRadius:'6px', marginBottom:'6px', display:'block' } }),
      React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadAboutImage(f, 'hero'); if (url) setAboutDraft(function(p){ return Object.assign({}, p, { hero_image: url }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'12px' } }),
      aboutDraft.hero_image && React.createElement('button', { onClick: function(){ setAboutDraft(function(p){ return Object.assign({}, p, { hero_image:'' }); }); }, style:{ marginLeft:'8px', background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer' } }, '이미지 제거')
    ),
    /* 미션 섹션 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '2. MISSION 섹션 (학원 소개)'),
      ['mission_eyebrow:상단 영문 라벨', 'mission_title:큰 타이틀 (줄바꿈 \\n 사용)'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('input', { value: aboutDraft[f] || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
        );
      }),
      ['mission_body_1:본문 1단락', 'mission_body_2:본문 2단락'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('textarea', { value: aboutDraft[f] || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, rows:3, style:Object.assign({}, inputS, { width:'100%', resize:'vertical' }) })
        );
      }),
      React.createElement('label', { style:labelS }, '미션 본문 위 이미지 (선택)'),
      aboutDraft.mission_image && React.createElement('img', { src: aboutDraft.mission_image, alt:'', style:{ width:'160px', height:'90px', objectFit:'cover', borderRadius:'6px', marginBottom:'6px', display:'block' } }),
      React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadAboutImage(f, 'mission'); if (url) setAboutDraft(function(p){ return Object.assign({}, p, { mission_image: url }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'12px' } }),
      aboutDraft.mission_image && React.createElement('button', { onClick: function(){ setAboutDraft(function(p){ return Object.assign({}, p, { mission_image:'' }); }); }, style:{ marginLeft:'8px', background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer' } }, '이미지 제거')
    ),
    /* 약속 섹션 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '3. PROMISE 섹션 (우리의 약속)'),
      React.createElement('div', { style:{ marginBottom:'10px' } },
        React.createElement('label', { style:labelS }, '섹션 타이틀'),
        React.createElement('input', { value: aboutDraft.promise_title || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { promise_title: v }); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
      ),
      (aboutDraft.promise_items || []).map(function(item, idx){
        return React.createElement('div', { key:idx, style:{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px', marginBottom:'8px' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#6b7280', marginBottom:'8px' } }, '약속 ' + (idx+1)),
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'6px' } },
            React.createElement('input', { value:item.num || '', placeholder:'번호 (예: 01)', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.promise_items || []).slice(); items[idx] = Object.assign({}, items[idx], { num:v }); return Object.assign({}, p, { promise_items: items }); }); }, style:Object.assign({}, inputS, { width:'80px' }) }),
            React.createElement('input', { value:item.title || '', placeholder:'제목', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.promise_items || []).slice(); items[idx] = Object.assign({}, items[idx], { title:v }); return Object.assign({}, p, { promise_items: items }); }); }, style:Object.assign({}, inputS, { flex:1 }) })
          ),
          React.createElement('textarea', { value:item.desc || '', placeholder:'설명', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.promise_items || []).slice(); items[idx] = Object.assign({}, items[idx], { desc:v }); return Object.assign({}, p, { promise_items: items }); }); }, rows:2, style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'6px' }) }),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
            item.image && React.createElement('img', { src:item.image, alt:'', style:{ width:'80px', height:'48px', objectFit:'cover', borderRadius:'4px' } }),
            React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadAboutImage(f, 'promise_' + (idx+1)); if (url) setAboutDraft(function(p){ var items = (p.promise_items || []).slice(); items[idx] = Object.assign({}, items[idx], { image: url }); return Object.assign({}, p, { promise_items: items }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'11px', flex:1 } }),
            item.image && React.createElement('button', { onClick: function(){ setAboutDraft(function(p){ var items = (p.promise_items || []).slice(); items[idx] = Object.assign({}, items[idx], { image:'' }); return Object.assign({}, p, { promise_items: items }); }); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'4px', padding:'3px 8px', fontSize:'10px', fontWeight:'700', cursor:'pointer' } }, '제거')
          )
        );
      })
    ),
    /* 과목 섹션 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '4. SUBJECTS 섹션 (개설 과목)'),
      React.createElement('div', { style:{ marginBottom:'10px' } },
        React.createElement('label', { style:labelS }, '섹션 타이틀'),
        React.createElement('input', { value: aboutDraft.subjects_title || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { subjects_title: v }); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
      ),
      (aboutDraft.subjects || []).map(function(item, idx){
        return React.createElement('div', { key:idx, style:{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px', marginBottom:'8px' } },
          React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#6b7280', marginBottom:'8px' } }, '과목 ' + (idx+1)),
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'6px' } },
            React.createElement('input', { value:item.name || '', placeholder:'한글명', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { name:v }); return Object.assign({}, p, { subjects: items }); }); }, style:Object.assign({}, inputS, { width:'90px' }) }),
            React.createElement('input', { value:item.sub || '', placeholder:'영문', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { sub:v }); return Object.assign({}, p, { subjects: items }); }); }, style:Object.assign({}, inputS, { width:'110px' }) }),
            React.createElement('input', { type:'color', value:item.color || '#1A1A1A', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { color:v }); return Object.assign({}, p, { subjects: items }); }); }, style:{ width:'48px', height:'34px', border:'1px solid #d6dbde', borderRadius:'4px', cursor:'pointer' } })
          ),
          React.createElement('textarea', { value:item.desc || '', placeholder:'설명', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { desc:v }); return Object.assign({}, p, { subjects: items }); }); }, rows:2, style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'6px' }) }),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
            item.image && React.createElement('img', { src:item.image, alt:'', style:{ width:'80px', height:'48px', objectFit:'cover', borderRadius:'4px' } }),
            React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadAboutImage(f, 'subject_' + (idx+1)); if (url) setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { image: url }); return Object.assign({}, p, { subjects: items }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'11px', flex:1 } }),
            item.image && React.createElement('button', { onClick: function(){ setAboutDraft(function(p){ var items = (p.subjects || []).slice(); items[idx] = Object.assign({}, items[idx], { image:'' }); return Object.assign({}, p, { subjects: items }); }); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'4px', padding:'3px 8px', fontSize:'10px', fontWeight:'700', cursor:'pointer' } }, '제거')
          )
        );
      })
    ),
    /* CTA 섹션 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '5. CTA 섹션 (하단 액션)'),
      ['cta_eyebrow:상단 영문 라벨', 'cta_title:타이틀'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('input', { value: aboutDraft[f] || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
        );
      }),
      React.createElement('div', { style:{ marginBottom:'10px' } },
        React.createElement('label', { style:labelS }, '본문'),
        React.createElement('textarea', { value: aboutDraft.cta_body || '', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { cta_body: v }); }); }, rows:2, style:Object.assign({}, inputS, { width:'100%', resize:'vertical' }) })
      ),
      React.createElement('div', { style:{ display:'flex', gap:'14px', flexWrap:'wrap', marginTop:'8px' } },
        React.createElement('div', null,
          React.createElement('label', { style:labelS }, '배경색'),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
            React.createElement('input', { type:'color', value: aboutDraft.cta_bg_color || '#FFEBED', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { cta_bg_color: v }); }); }, style:{ width:'48px', height:'34px', border:'1px solid #d6dbde', borderRadius:'4px', cursor:'pointer' } }),
            React.createElement('input', { type:'text', value: aboutDraft.cta_bg_color || '#FFEBED', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { cta_bg_color: v }); }); }, style:Object.assign({}, inputS, { width:'120px' }) })
          )
        ),
        React.createElement('div', null,
          React.createElement('label', { style:labelS }, '텍스트 색상'),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
            React.createElement('input', { type:'color', value: aboutDraft.cta_text_color || '#1A1A1A', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { cta_text_color: v }); }); }, style:{ width:'48px', height:'34px', border:'1px solid #d6dbde', borderRadius:'4px', cursor:'pointer' } }),
            React.createElement('input', { type:'text', value: aboutDraft.cta_text_color || '#1A1A1A', onChange: function(e){ var v = e.target.value; setAboutDraft(function(p){ return Object.assign({}, p, { cta_text_color: v }); }); }, style:Object.assign({}, inputS, { width:'120px' }) })
          )
        )
      )
    ),
    React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', gap:'8px' } },
      React.createElement('button', { onClick: saveAboutContent, disabled: aboutSaving, style:{ background: aboutSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'800', cursor: aboutSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, aboutSaving ? '저장 중...' : '변경사항 저장')
    )
  )
),

/* ── 이벤트 버튼 편집 TAB ── */
tab==='eventbtn' && React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '이벤트 floating 버튼'),
    React.createElement('button', { onClick: saveEventBtn, disabled: eventBtnSaving || !eventBtnDraft, style:{ background: eventBtnSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor: eventBtnSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, eventBtnSaving ? '저장 중...' : '변경사항 저장')
  ),
  React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, '메인/모든 페이지 우하단에 떠 있는 빨간 floating 버튼을 편집합니다. 표시 여부, 배지 라벨, 텍스트, 이동 페이지를 변경할 수 있습니다.'),
  !eventBtnDraft ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
  React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px', display:'flex', flexDirection:'column', gap:'14px' } },
    React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' } },
      React.createElement('input', { type:'checkbox', checked: !!eventBtnDraft.enabled, onChange: function(e){ var v = e.target.checked; setEventBtnDraft(function(p){ return Object.assign({}, p, { enabled:v }); }); } }),
      React.createElement('span', { style:{ fontSize:'14px', fontWeight:'700', color:'#374151', fontFamily:'Manrope, sans-serif' } }, '버튼 표시')
    ),
    React.createElement('div', null,
      React.createElement('label', { style:labelS }, '배지 텍스트 (예: EVENT)'),
      React.createElement('input', { value: eventBtnDraft.badge || '', onChange: function(e){ var v = e.target.value; setEventBtnDraft(function(p){ return Object.assign({}, p, { badge:v }); }); }, placeholder:'EVENT', style:Object.assign({}, inputS, { width:'100%' }) }),
      React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' } }, '비워두면 배지 미표시')
    ),
    React.createElement('div', null,
      React.createElement('label', { style:labelS }, '버튼 텍스트'),
      React.createElement('input', { value: eventBtnDraft.text || '', onChange: function(e){ var v = e.target.value; setEventBtnDraft(function(p){ return Object.assign({}, p, { text:v }); }); }, placeholder:'무료 레벨테스트', style:Object.assign({}, inputS, { width:'100%' }) })
    ),
    React.createElement('div', null,
      React.createElement('label', { style:labelS }, '이동 페이지'),
      React.createElement('select', { value: eventBtnDraft.target_page || 'leveltest', onChange: function(e){ var v = e.target.value; setEventBtnDraft(function(p){ return Object.assign({}, p, { target_page:v }); }); }, style:Object.assign({}, inputS, { width:'100%' }) },
        [
          { v:'leveltest', l:'레벨테스트' },
          { v:'about',     l:'학원안내' },
          { v:'service',   l:'프로그램' },
          { v:'recruit',   l:'모집안내' },
          { v:'contact',   l:'문의하기' },
          { v:'portal',    l:'강의실' }
        ].map(function(p){ return React.createElement('option', { key:p.v, value:p.v }, p.l); })
      )
    ),
    /* 미리보기 */
    React.createElement('div', { style:{ marginTop:'8px', padding:'16px', background:'#f9fafb', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px' } },
      React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#6b7280' } }, '미리보기:'),
      React.createElement('div', { style:{ background:'linear-gradient(135deg, #E60012 0%, #B8000F 100%)', color:'#fff', borderRadius:'999px', padding:'10px 18px', fontSize:'13px', fontWeight:'800', display:'inline-flex', alignItems:'center', gap:'8px', boxShadow:'0 6px 14px rgba(0,0,0,0.15)' } },
        eventBtnDraft.badge && React.createElement('span', { style:{ fontSize:'9px', fontWeight:'800', background:'#fff', color:'#E60012', borderRadius:'999px', padding:'2px 7px' } }, eventBtnDraft.badge),
        eventBtnDraft.text || '무료 레벨테스트'
      )
    )
  )
),

/* ── 푸터 편집 TAB ── */
tab==='footer' && React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '푸터 (사업자 정보)'),
    React.createElement('button', { onClick: saveFooterContent, disabled: footerSaving || !footerDraft, style:{ background: footerSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor: footerSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, footerSaving ? '저장 중...' : '변경사항 저장')
  ),
  React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, '모든 페이지 하단에 표시되는 사업자 정보입니다. 비워두면 해당 항목은 표시되지 않습니다.'),
  !footerDraft ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
  React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px', display:'flex', flexDirection:'column', gap:'12px' } },
    [
      { f:'company_name', l:'학원명/회사명' },
      { f:'ceo',          l:'대표자' },
      { f:'biz_no',       l:'사업자등록번호' },
      { f:'address',      l:'주소' },
      { f:'phone',        l:'전화번호' },
      { f:'email',        l:'이메일' },
      { f:'hours',        l:'운영 시간' },
      { f:'copyright',    l:'카피라이트 (예: © 2026 학원명)' },
    ].map(function(it){
      return React.createElement('div', { key:it.f },
        React.createElement('label', { style:labelS }, it.l),
        React.createElement('input', { value: footerDraft[it.f] || '', onChange: function(e){ var v = e.target.value; setFooterDraft(function(p){ return Object.assign({}, p, (function(o){ o[it.f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
      );
    }),
    React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', marginTop:'8px' } },
      React.createElement('button', { onClick: saveFooterContent, disabled: footerSaving, style:{ background: footerSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'800', cursor: footerSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, footerSaving ? '저장 중...' : '변경사항 저장')
    )
  )
),

/* ── 프로그램 편집 TAB ── */
tab==='programs' && React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '프로그램 페이지 편집'),
    React.createElement('button', { onClick: saveProgramsContent, disabled: programsSaving || !programsDraft, style:{ background: programsSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor: programsSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, programsSaving ? '저장 중...' : '변경사항 저장')
  ),
  React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif' } }, '프로그램 페이지의 헤더와 안내 텍스트를 수정합니다. 강좌 목록은 \'강좌 관리\' 탭에서 별도 관리됩니다.'),
  !programsDraft ? React.createElement('div', { style:{ color:'#9ca3af' } }, '불러오는 중...') :
  React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'18px' } },
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '헤더'),
      ['header_eyebrow:상단 영문 라벨', 'header_title:타이틀 (줄바꿈 \\n 사용)', 'header_subtitle:부제'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('input', { value: programsDraft[f] || '', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
        );
      }),
      React.createElement('label', { style:labelS }, '헤더 배경 이미지 (선택)'),
      programsDraft.header_image && React.createElement('img', { src: programsDraft.header_image, alt:'', style:{ width:'160px', height:'90px', objectFit:'cover', borderRadius:'6px', marginBottom:'6px', display:'block' } }),
      React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadProgramsImage(f, 'header'); if (url) setProgramsDraft(function(p){ return Object.assign({}, p, { header_image: url }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'12px' } }),
      programsDraft.header_image && React.createElement('button', { onClick: function(){ setProgramsDraft(function(p){ return Object.assign({}, p, { header_image:'' }); }); }, style:{ marginLeft:'8px', background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer' } }, '이미지 제거')
    ),
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, '강좌 목록 영역'),
      ['list_title:강좌 목록 섹션 타이틀', 'empty_text:강좌 없을 때 안내 문구'].map(function(spec){
        var parts = spec.split(':'); var f = parts[0]; var l = parts[1];
        return React.createElement('div', { key:f, style:{ marginBottom:'10px' } },
          React.createElement('label', { style:labelS }, l),
          React.createElement('input', { value: programsDraft[f] || '', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ return Object.assign({}, p, (function(o){ o[f]=v; return o; })({})); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
        );
      }),
      React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' } }, '※ 개별 강좌(이름·과목·가격 등)는 \'강좌 관리\' 탭에서 관리합니다.')
    ),
    /* 강사진 */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' } },
        React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', color:'#1A1A1A', margin:0 } }, '강사진'),
        React.createElement('button', { onClick:function(){ setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr.push({ name:'', subject:'', career:'', badge:'', image:'' }); return Object.assign({}, p, { teachers: arr }); }); }, style:{ background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 강사 추가')
      ),
      React.createElement('div', { style:{ marginBottom:'10px' } },
        React.createElement('label', { style:labelS }, '섹션 타이틀'),
        React.createElement('input', { value: programsDraft.teachers_title || '', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ return Object.assign({}, p, { teachers_title:v }); }); }, style:Object.assign({}, inputS, { width:'100%' }) })
      ),
      (programsDraft.teachers || []).map(function(item, idx){
        return React.createElement('div', { key:idx, style:{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px', marginBottom:'8px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' } },
            React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#6b7280' } }, '강사 ' + (idx+1)),
            React.createElement('button', { onClick:function(){ setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr.splice(idx, 1); return Object.assign({}, p, { teachers: arr }); }); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'4px', padding:'2px 8px', fontSize:'10px', fontWeight:'700', cursor:'pointer' } }, '삭제')
          ),
          React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'6px' } },
            React.createElement('input', { value:item.name || '', placeholder:'이름', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { name:v }); return Object.assign({}, p, { teachers: arr }); }); }, style:Object.assign({}, inputS, { flex:1 }) }),
            React.createElement('input', { value:item.subject || '', placeholder:'과목', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { subject:v }); return Object.assign({}, p, { teachers: arr }); }); }, style:Object.assign({}, inputS, { flex:1 }) })
          ),
          React.createElement('input', { value:item.badge || '', placeholder:'배지 (예: 수학 대표 강사)', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { badge:v }); return Object.assign({}, p, { teachers: arr }); }); }, style:Object.assign({}, inputS, { width:'100%', marginBottom:'6px' }) }),
          React.createElement('textarea', { value:item.career || '', placeholder:'경력', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { career:v }); return Object.assign({}, p, { teachers: arr }); }); }, rows:2, style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'6px' }) }),
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
            item.image && React.createElement('img', { src:item.image, alt:'', style:{ width:'48px', height:'48px', objectFit:'cover', borderRadius:'50%' } }),
            React.createElement('input', { type:'file', accept:'image/*', onChange: async function(e){ var f = e.target.files && e.target.files[0]; if (!f) return; try { var url = await uploadProgramsImage(f, 'teacher_' + (idx+1)); if (url) setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { image: url }); return Object.assign({}, p, { teachers: arr }); }); } catch(err){ alert('업로드 실패: ' + (err.message||err)); } }, style:{ fontSize:'11px', flex:1 } }),
            item.image && React.createElement('button', { onClick: function(){ setProgramsDraft(function(p){ var arr = (p.teachers || []).slice(); arr[idx] = Object.assign({}, arr[idx], { image:'' }); return Object.assign({}, p, { teachers: arr }); }); }, style:{ background:'none', color:'#c82014', border:'1px solid #c82014', borderRadius:'4px', padding:'3px 8px', fontSize:'10px', fontWeight:'700', cursor:'pointer' } }, '제거')
          )
        );
      })
    ),
    /* CTA */
    React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
      React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'12px', color:'#1A1A1A' } }, 'CTA 버튼 (하단)'),
      React.createElement('label', { style:labelS }, '버튼 텍스트'),
      React.createElement('input', { value: programsDraft.cta_button || '', onChange: function(e){ var v = e.target.value; setProgramsDraft(function(p){ return Object.assign({}, p, { cta_button:v }); }); }, placeholder:'무료 상담 신청하기', style:Object.assign({}, inputS, { width:'100%' }) })
    ),
    React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end' } },
      React.createElement('button', { onClick: saveProgramsContent, disabled: programsSaving, style:{ background: programsSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'800', cursor: programsSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, programsSaving ? '저장 중...' : '변경사항 저장')
    )
  )
),

/* ── 섹션 편집 TAB ── */
tab==='feature' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' } },
  React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '홍보 섹션 편집'),
  React.createElement('button', { onClick: saveFeatureContent, disabled: featureSaving, style:{ background: featureSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor: featureSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, featureSaving ? '저장 중...' : '변경사항 저장')
),
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' } },
[{f:'featureEyebrow',l:'눈길끄는 문구 (작은 글자)'},{f:'featureTitle',l:'메인 제목 (큰 글자)'},{f:'featureBody',l:'본문 설명'},{f:'featureCta1',l:'버튼 1 텍스트'},{f:'featureCta2',l:'버튼 2 텍스트'},{f:'heroTitle',l:'메인 배너 큰 제목'}].map(({f,l})=>
React.createElement('div', {key:f},
React.createElement('label',{style:labelS},l),
React.createElement('input',{value:state.siteInfo?.[f]||state.content?.[f]||'',placeholder:l,onChange:e=>{
if(['featureEyebrow','featureTitle','featureBody','featureCta1','featureCta2'].includes(f))
setState(s=>({...s,content:{...(s.content||{}),[f]:e.target.value}}));
else
setState(s=>({...s,siteInfo:{...s.siteInfo,[f]:e.target.value}}));
},style:inputS})
)
)
),
React.createElement('div', { style:{ marginTop:'20px', padding:'16px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px' } },
React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '배경/텍스트 색상'),
React.createElement('div', { style:{ display:'flex', gap:'14px', flexWrap:'wrap' } },
  React.createElement('div', null,
    React.createElement('label', { style:labelS }, '배경색'),
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
      React.createElement('input', { type:'color', value: state.content?.featureBgColor || '#FFEBED', onChange: function(e){ var v = e.target.value; setState(function(s){ return Object.assign({}, s, { content: Object.assign({}, s.content || {}, { featureBgColor: v }) }); }); }, style:{ width:'48px', height:'34px', border:'1px solid #d6dbde', borderRadius:'4px', cursor:'pointer' } }),
      React.createElement('input', { type:'text', value: state.content?.featureBgColor || '#FFEBED', onChange: function(e){ var v = e.target.value; setState(function(s){ return Object.assign({}, s, { content: Object.assign({}, s.content || {}, { featureBgColor: v }) }); }); }, style:Object.assign({}, inputS, { width:'120px' }) })
    )
  ),
  React.createElement('div', null,
    React.createElement('label', { style:labelS }, '텍스트 색상'),
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px' } },
      React.createElement('input', { type:'color', value: state.content?.featureTextColor || '#1A1A1A', onChange: function(e){ var v = e.target.value; setState(function(s){ return Object.assign({}, s, { content: Object.assign({}, s.content || {}, { featureTextColor: v }) }); }); }, style:{ width:'48px', height:'34px', border:'1px solid #d6dbde', borderRadius:'4px', cursor:'pointer' } }),
      React.createElement('input', { type:'text', value: state.content?.featureTextColor || '#1A1A1A', onChange: function(e){ var v = e.target.value; setState(function(s){ return Object.assign({}, s, { content: Object.assign({}, s.content || {}, { featureTextColor: v }) }); }); }, style:Object.assign({}, inputS, { width:'120px' }) })
    )
  )
)
),
React.createElement('div', { style:{ marginTop:'18px', display:'flex', justifyContent:'flex-end' } },
React.createElement('button', { onClick: saveFeatureContent, disabled: featureSaving, style:{ background: featureSaving ? '#9ca3af' : '#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'800', cursor: featureSaving ? 'not-allowed' : 'pointer', fontFamily:'Manrope, sans-serif' } }, featureSaving ? '저장 중...' : '변경사항 저장')
)
)

),

/* ── 학부모 리포트 모달 ── */
reportStudentId && (function(){
  var sid = String(reportStudentId);
  var stu = dbStudents.find(function(x){ return String(x.id) === sid; }) || {};
  var name = stu.name || '학생';
  var grade = stu.grade || '';
  var allScoresForStudent = (adminAnalysis || []).filter(function(s){ return String(s.student_id) === sid; }).slice().sort(function(a,b){ return (a.test_date||'').localeCompare(b.test_date||''); });
  var last = allScoresForStudent[allScoresForStudent.length-1];
  var prev = allScoresForStudent[allScoresForStudent.length-2];
  var vals = allScoresForStudent.map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);});
  var avgPersonal = vals.length ? vals.reduce(function(a,b){return a+b;},0)/vals.length : null;
  var aiC = B2Utils.generateComment({ studentName:name, score: last ? Number(last.score) : null, prevScore: prev ? Number(prev.score) : null, classAvg: null, recentTrend: vals, subject: last ? last.subject : '', testName: last ? last.test_name : '' });
  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', maxWidth:'640px', width:'100%', maxHeight:'90vh', overflowY:'auto' } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' } },
        React.createElement('h2', { style:{ margin:0, fontFamily:'Manrope, sans-serif' } }, '학부모 전달용 리포트'),
        React.createElement('div', { style:{ display:'flex', gap:'6px' } },
          React.createElement('button', { onClick:function(){ window.print(); }, style:{ background:'#fff', color:'#1A1A1A', border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '🖨 인쇄/PDF'),
          React.createElement('button', { onClick:function(){ setReportStudentId(''); }, style:{ background:'#fff', color:'#1A1A1A', border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '닫기')
        )
      ),
      React.createElement('div', { style:{ borderTop:'2px solid #E60012', paddingTop:'14px' } },
        React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, name + ' ', grade && React.createElement('span', { style:{ fontSize:'13px', color:'#6b7280', marginLeft:'8px' } }, grade)),
        React.createElement('div', { style:{ fontSize:'12px', color:'#9ca3af', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '발행일: ' + new Date().toISOString().slice(0,10) + ' · B2빅뱅학원'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' } },
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, last ? last.score+'점' : '-'),
            React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '최근 점수')
          ),
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, avgPersonal != null ? avgPersonal.toFixed(1)+'점' : '-'),
            React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '개인 평균')
          ),
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, allScoresForStudent.length+'회'),
            React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '응시 횟수')
          )
        ),
        React.createElement('div', { style:{ padding:'12px', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'8px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '담당 선생님 코멘트'),
          React.createElement('div', { style:{ fontSize:'13px', color:'#374151', lineHeight:'1.7', fontFamily:'Manrope, sans-serif' } }, aiC)
        ),
        React.createElement('div', { style:{ marginTop:'14px', fontSize:'11px', color:'#9ca3af', textAlign:'center', fontFamily:'Manrope, sans-serif' } }, '본 리포트는 학습 지도 참고용입니다. 자세한 상담은 학원으로 문의해 주세요.')
      )
    )
  );
})(),

/* ── 알림톡 발송 미리보기 모달 ── */
kakaoTarget && (function(){
  var items = (kakaoTarget.students || []).map(function(s){
    var sid = String(s.id);
    var stu = dbStudents.find(function(x){ return String(x.id) === sid; }) || {};
    var lastScore = s.last ? Number(s.last.score) : null;
    var prevScore = s.prev ? Number(s.prev.score) : null;
    var allScores = (adminAnalysis || []).filter(function(x){ return String(x.student_id) === sid; }).map(function(x){ return Number(x.score); }).filter(function(v){return !isNaN(v);});
    var comment = B2Utils.generateComment({ studentName: s.name || stu.name, score: lastScore, prevScore: prevScore, classAvg: null, recentTrend: allScores, subject: s.last ? s.last.subject : '', testName: s.last ? s.last.test_name : '' });
    var msg = B2Utils.formatKakao({ studentName: s.name || stu.name, testName: s.last ? s.last.test_name : '-', testDate: s.last ? s.last.test_date : '-', score: lastScore, prevScore: prevScore, comment: comment });
    return { student_id: sid, parent_phone: s.parent_phone || stu.parent_phone || stu.phone || null, message_content: msg, test_score_id: s.last ? s.last.id : null };
  });
  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'20px', maxWidth:'520px', width:'100%', maxHeight:'90vh', overflowY:'auto' } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
        React.createElement('h3', { style:{ margin:0, fontSize:'15px', fontFamily:'Manrope, sans-serif' } }, '알림톡 발송 미리보기 (' + items.length + '명)'),
        React.createElement('button', { onClick:function(){ setKakaoTarget(null); }, style:{ background:'none', border:'none', fontSize:'18px', cursor:'pointer' } }, '×')
      ),
      React.createElement('div', { style:{ marginBottom:'10px', padding:'10px', background:'#fff7ed', borderRadius:'8px', fontSize:'12px', color:'#7a3e0c', fontFamily:'Manrope, sans-serif' } }, '실제 카카오 알림톡 API 연동은 추후 진행됩니다. 지금은 발송 이력만 저장됩니다.'),
      items.map(function(it, i){
        var stu = dbStudents.find(function(x){ return String(x.id) === it.student_id; }) || {};
        return React.createElement('div', { key:i, style:{ marginBottom:'10px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, (stu.name || '학생') + ' · ' + (it.parent_phone || '연락처 없음')),
          React.createElement('pre', { style:{ margin:0, fontSize:'12px', color:'#374151', whiteSpace:'pre-wrap', fontFamily:'Manrope, sans-serif', lineHeight:'1.6', background:'#fef7e0', padding:'10px', borderRadius:'6px' } }, it.message_content)
        );
      }),
      React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'10px' } },
        React.createElement('button', { onClick:function(){ setKakaoTarget(null); }, style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, '취소'),
        React.createElement('button', { onClick: async function(){
          var rows = items.map(function(it){ return { student_id: it.student_id || null, parent_phone: it.parent_phone || null, message_content: it.message_content || '', test_score_id: it.test_score_id || null, sent_by: null, sent_at: null, status: 'pending' }; });
          var { error } = await window.supabase.from('notification_logs').insert(rows);
          if (error) { alert('발송 이력 저장 실패: ' + error.message); return; }
          alert('알림톡 연동 준비 중입니다.\n발송 이력은 저장되었습니다 (상태: 미발송).');
          setKakaoTarget(null);
        }, style:{ background:'#F8B500', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '발송 이력 저장')
      )
    )
  );
})(),

// 담당 선생님 배정 팝업 (학생 카드 → 과목 클릭 시 열림)
teacherPicker && (function(){
  var stForPicker = dbStudents.find(function(s){ return String(s.id) === String(teacherPicker.studentId); });
  if (!stForPicker) return null;
  // 해당 과목으로 묶인 반들 → 선생님별로 그룹
  var classesForSubject = (teacherClasses || []).filter(function(c){ return c.subject === teacherPicker.subject; });
  var byTeacher = {};
  classesForSubject.forEach(function(c){
    var key = String(c.teacher_id);
    if (!byTeacher[key]) byTeacher[key] = { teacher: (dbTeacherProfiles || []).find(function(p){ return String(p.id) === key; }), classes: [] };
    byTeacher[key].classes.push(c);
  });
  var teacherKeys = Object.keys(byTeacher);

  async function assignToClass(cls) {
    var on = (classStudents[cls.id] || []).includes(stForPicker.id);
    if (on) {
      try { await removeStudentFromClass(cls.id, stForPicker.id); } catch(e) {}
    } else {
      await addStudentToClass(cls.id, stForPicker.id);
    }
    showSaved();
  }

  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }, onClick: function(){ setTeacherPicker(null); } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'20px', maxWidth:'440px', width:'100%', maxHeight:'82vh', overflowY:'auto' }, onClick: function(e){ e.stopPropagation(); } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' } },
        React.createElement('h3', { style:{ margin:0, fontSize:'15px', fontFamily:'Manrope, sans-serif', fontWeight:'800', color:'#1A1A1A' } }, stForPicker.name + ' · ' + teacherPicker.subject + ' 담당 선생님'),
        React.createElement('button', { onClick:function(){ setTeacherPicker(null); }, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'rgba(0,0,0,0.5)' } }, '×')
      ),
      React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', margin:'0 0 14px' } }, '여러 반에 동시 배정할 수 있어요. 클릭해서 추가/해제하세요.'),
      teacherKeys.length === 0
        ? React.createElement('div', { style:{ padding:'20px', background:'#f9fafb', borderRadius:'8px', fontSize:'13px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', textAlign:'center' } }, teacherPicker.subject + ' 과목의 반이 없습니다. 선생님 페이지에서 먼저 반을 만들어 주세요.')
        : teacherKeys.map(function(tkey){
            var grp = byTeacher[tkey];
            var t = grp.teacher;
            return React.createElement('div', { key: tkey, style:{ marginBottom:'12px', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px' } },
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, (t ? t.name : '선생님') + (t && t.email ? ' · ' + t.email : '')),
              React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'6px' } },
                grp.classes.map(function(cls){
                  var on = (classStudents[cls.id] || []).includes(stForPicker.id);
                  return React.createElement('button', {
                    key: cls.id,
                    onClick: function(){ assignToClass(cls); },
                    style:{ display:'flex', justifyContent:'space-between', alignItems:'center', background: on ? '#FFEBED' : '#fff', border:'1.5px solid ' + (on ? '#E60012' : '#d6dbde'), borderRadius:'8px', padding:'10px 12px', fontSize:'13px', fontWeight:'700', color:'#1A1A1A', cursor:'pointer', fontFamily:'Manrope, sans-serif', textAlign:'left' }
                  },
                    React.createElement('span', null, (cls.name || '반') + (cls.grade ? ' · ' + cls.grade : '')),
                    on ? React.createElement('span', { style:{ color:'#E60012', fontSize:'11px', fontWeight:'800' } }, '✓ 배정됨 (해제)') : React.createElement('span', { style:{ color:'rgba(0,0,0,0.4)', fontSize:'11px' } }, '+ 추가')
                  );
                })
              )
            );
          })
    )
  );
})()

);
}

/* ── 시험 채점 폼 (관리자/선생님 공용) ─────────── */
function GradingForm({ exam, submission, onSave }) {
  const tqc = exam.text_question_count || 0;
  const initialTextScores = (submission.text_scores && typeof submission.text_scores === 'object') ? submission.text_scores : {};
  const [textScores, setTextScores] = React.useState(initialTextScores);
  const [totalScore, setTotalScore] = React.useState(submission.score != null ? String(submission.score) : '');
  const [feedback, setFeedback] = React.useState(submission.feedback || '');
  const [saving, setSaving] = React.useState(false);

  // 객관식 자동 채점 점수
  const ak = (exam.answer_key && typeof exam.answer_key === 'object') ? exam.answer_key : {};
  const hasKey = Object.keys(ak).length > 0;
  const qc = exam.question_count || 0;
  let objAuto = null;
  if (hasKey && qc > 0) {
    let c = 0;
    for (let i = 1; i <= qc; i++) {
      if (ak[i] != null && String((submission.answers && submission.answers[i]) || '') === String(ak[i])) c++;
    }
    objAuto = c;
  }

  async function handleSave() {
    setSaving(true);
    var sc = totalScore.trim() === '' ? null : parseInt(totalScore, 10);
    if (sc != null && (isNaN(sc) || sc < 0)) { alert('총점을 0 이상의 숫자로 입력해 주세요.'); setSaving(false); return; }
    var payload = {
      score: sc,
      text_scores: textScores || {},
      feedback: feedback || null,
      objective_score: objAuto != null ? objAuto : submission.objective_score,
      objective_total: qc || submission.objective_total,
    };
    try {
      await onSave(submission.id, payload);
    } catch (e) {}
    setSaving(false);
  }

  var audioUrl = submission.audio_path && window.B2Utils ? window.B2Utils.audioPublicUrl(submission.audio_path) : '';

  return React.createElement('div', { style:{ marginTop:'10px', padding:'10px', background:'#fff', border:'1px dashed #d1d5db', borderRadius:'6px' } },
    React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#1d4ed8', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '채점' + (objAuto != null ? ' (자동 객관식 ' + objAuto + '/' + qc + ')' : '')),

    audioUrl && React.createElement('div', { style:{ marginBottom:'10px', padding:'8px 10px', background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'6px' } },
      React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#92400e', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '학생 녹음 답안'),
      React.createElement('audio', { controls:true, src: audioUrl, style:{ width:'100%' } })
    ),

    tqc > 0 && React.createElement('div', { style:{ marginBottom:'8px' } },
      React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '서술형 점수'),
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:'4px' } },
        Array.from({ length: tqc }).map(function(_, i){
          var num = i + 1;
          return React.createElement('div', { key:num, style:{ display:'flex', alignItems:'center', gap:'4px' } },
            React.createElement('span', { style:{ fontSize:'11px', minWidth:'30px', color:'#6b7280' } }, num + '번:'),
            React.createElement('input', { type:'number', min:'0', value: textScores[num] != null ? textScores[num] : '', onChange:function(e){ var v = e.target.value; setTextScores(function(p){ var n = Object.assign({}, p); if (v === '') delete n[num]; else n[num] = parseInt(v,10) || 0; return n; }); }, style:{ flex:1, border:'1px solid #d6dbde', borderRadius:'4px', padding:'4px 6px', fontSize:'11px', boxSizing:'border-box' } })
          );
        })
      )
    ),
    React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'8px' } },
      React.createElement('div', { style:{ flex:1 } },
        React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px' } }, '총점'),
        React.createElement('input', { type:'number', min:'0', value:totalScore, onChange:function(e){ setTotalScore(window.B2Utils.stripLeadingZero(e.target.value)); }, placeholder:'예: 85', style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'5px 8px', fontSize:'12px', boxSizing:'border-box' } })
      ),
      React.createElement('div', { style:{ flex:2 } },
        React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'4px' } }, '학생에게 보일 코멘트'),
        React.createElement('input', { type:'text', value:feedback, onChange:function(e){ setFeedback(e.target.value); }, placeholder:'예: 객관식 8문항 정답, 서술형 보강 필요', style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'5px 8px', fontSize:'12px', boxSizing:'border-box' } })
      )
    ),
    React.createElement('button', { onClick:handleSave, disabled:saving, style:{ background: saving?'#9ca3af':'#1d4ed8', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'800', cursor: saving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif' } }, saving ? '저장 중...' : '채점 저장'),
    submission.graded_at && React.createElement('span', { style:{ marginLeft:'10px', fontSize:'11px', color:'#16a34a', fontWeight:'700' } }, '채점 완료: ' + String(submission.graded_at).slice(0,16).replace('T',' '))
  );
}

Object.assign(window, { AdminPanel, GradingForm });
