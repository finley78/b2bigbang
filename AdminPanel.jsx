// AdminPanel.jsx — Admin login + full management panel

const GRADES = ['중1','중2','중3','고1','고2','고3'];
const SUBJECTS = ['국어','영어','수학','과학'];
const COURSE_LEVELS = ['초등','중등','고등'];
const COURSE_GRADES_BY_LEVEL = {
'초등': ['1학년','2학년','3학년','4학년','5학년','6학년'],
'중등': ['중1','중2','중3'],
'고등': ['고1','고2','고3'],
};
const SCHOOLS = ['전체','은지초','검암초','간재울초','검암중','간재울중','백석중','서곶중','마전중','대인고','서인천고','백석고'];
const TEACHER_LEVELS = ['초등','중등','고등'];
const TEACHER_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const TEACHER_ASSIGN_LEVELS = ['초등','중등','고등'];
const TEACHER_ASSIGN_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const SCHOOL_LEVELS = {
'초등': { schools:['은지초','검암초','간재울초'], grades:['1학년','2학년','3학년','4학년','5학년','6학년'] },
'중등': { schools:['검암중','간재울중','백석중','서곶중','마전중'], grades:['중1','중2','중3'] },
'고등': { schools:['대인고','서인천고','백석고'], grades:['고1','고2','고3'] },
};
// ── 학년/성적 헬퍼는 B2Utils로 통합 ──
var levelFromGrade = window.B2Utils.levelFromGrade;
var adminGradeBucket = window.B2Utils.scoreGradeBucket;
var adminDistBucket = window.B2Utils.scoreDistBucket;
var adminColorForScore = window.B2Utils.scoreColor;

/* ── Admin Login ────────────────────────────── */
// AdminLogin — Supabase Auth 이전 후 단순 안내 화면.
// 관리자 권한은 students.role='admin' + auth.users 매칭으로 결정됨.
// 로그인 안 한 상태로 /admin 진입 시 노출되며, 메인 로그인 모달로 유도.
function AdminLogin({ onLoginClick }) {
return React.createElement('div', { style:{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f0eb', padding:'20px' } },
React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'40px', width:'400px', maxWidth:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.1)', textAlign:'center' } },
React.createElement('h1', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:'0 0 12px' } }, '관리자 권한이 필요합니다'),
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.6)', fontFamily:'Manrope, sans-serif', lineHeight:'1.7', margin:'0 0 24px' } }, '관리자 계정으로 로그인 후 이용해 주세요.'),
React.createElement('button', {
  onClick: function(){ if (typeof onLoginClick === 'function') onLoginClick(); },
  style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '로그인 화면으로')
)
);
}

/* ── Admin Panel ────────────────────────────── */
function AdminPanel({ state, setState, onLogout, adminAuthed, setAdminAuthed, user, onLoginClick }) {
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
const [courseFilterSubject, setCourseFilterSubject] = React.useState('전체');
const [courseFilterLevel, setCourseFilterLevel] = React.useState('전체');
const [courseFilterGrade, setCourseFilterGrade] = React.useState('전체');
const [courseFilterTeacher, setCourseFilterTeacher] = React.useState('전체');
const [courseFilterSearch, setCourseFilterSearch] = React.useState('');
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
const [pendingEnrollments, setPendingEnrollments] = React.useState([]); // 학생 자가 수강신청 — 승인 대기
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
const [clsMgmtDraft, setClsMgmtDraft] = React.useState({ teacher_id:'', name:'', levels:[], grades:[], subjects:[] }); // 클래스 관리 탭 — 새 반 추가 폼
const [clsMgmtTeacherFilter, setClsMgmtTeacherFilter] = React.useState('전체'); // 클래스 관리 탭 — 선생님 필터
const [adminAnalysis, setAdminAnalysis] = React.useState([]);
const [adminAttendance, setAdminAttendance] = React.useState([]);
const [analysisClassId, setAnalysisClassId] = React.useState('');
const [analysisSubject, setAnalysisSubject] = React.useState('전체');
const [analysisTestName, setAnalysisTestName] = React.useState('전체');
const [analysisTeacherId, setAnalysisTeacherId] = React.useState('전체');
const [analysisSearch, setAnalysisSearch] = React.useState('');
const [analysisStudentId, setAnalysisStudentId] = React.useState('');
// 성적분석 최상위 모드: 'class'(반별) | 'student'(학생별 — 전체 학생 검색)
const [analysisMode, setAnalysisMode] = React.useState('class');
// 반별 모드 안의 서브탭: 'overview'(차트·요약) | 'students'(반 학생 아코디언)
const [analysisSubTab, setAnalysisSubTab] = React.useState('overview');
// 반별 모드 차트 범위: 'all'(이 반 학생들의 모든 시험) | 'standard'(이 반 표준 시험만)
const [analysisChartScope, setAnalysisChartScope] = React.useState('all');
// 학생별 모드 학년 필터
const [analysisStudentGrade, setAnalysisStudentGrade] = React.useState('전체');
// 학생별 아코디언 펼침 상태 — 한 번에 하나만 열림
const [expandedAnalysisStudentId, setExpandedAnalysisStudentId] = React.useState('');
const [reportStudentId, setReportStudentId] = React.useState('');
const [kakaoTarget, setKakaoTarget] = React.useState(null);
const [adminNotificationLogs, setAdminNotificationLogs] = React.useState([]);
const [adminAttachments, setAdminAttachments] = React.useState([]);
const [adminAttachLoading, setAdminAttachLoading] = React.useState(false);
const [adminScrList, setAdminScrList] = React.useState([]);
const [adminScrLoading, setAdminScrLoading] = React.useState(false);
const [adminScrTeacherFilter, setAdminScrTeacherFilter] = React.useState('전체');
// 학원 일정 탭을 마지막으로 본 시각 — 이후 들어온 신청만 홈 카드 배지에 카운트(탭 열면 배지 사라짐)
const [scrSeenAt, setScrSeenAt] = React.useState(function(){ try { return localStorage.getItem('b2_admin_scr_seen') || ''; } catch (e) { return ''; } });
function markScheduleSeen() {
  var now = new Date().toISOString();
  try { localStorage.setItem('b2_admin_scr_seen', now); } catch (e) {}
  setScrSeenAt(now);
}
React.useEffect(function(){ if (tab === 'schedule') markScheduleSeen(); }, [tab]);
// 레벨테스트
const [adminLevelTests, setAdminLevelTests] = React.useState([]);
const [adminTestKindFilter, setAdminTestKindFilter] = React.useState('all');
const [adminTestSubjectFilter, setAdminTestSubjectFilter] = React.useState('all');
const [adminTestLevelFilter, setAdminTestLevelFilter] = React.useState('all');
const [adminTestSearch, setAdminTestSearch] = React.useState('');
const [adminTestAnalyzedOnly, setAdminTestAnalyzedOnly] = React.useState(false);
const [aboutDraft, setAboutDraft] = React.useState(null);
const [aboutSaving, setAboutSaving] = React.useState(false);
const [programsDraft, setProgramsDraft] = React.useState(null);
const [programsSaving, setProgramsSaving] = React.useState(false);
const [eventBtnDraft, setEventBtnDraft] = React.useState(null);
const [eventBtnSaving, setEventBtnSaving] = React.useState(false);
const [featureSaving, setFeatureSaving] = React.useState(false);
const [footerDraft, setFooterDraft] = React.useState(null);
const [footerSaving, setFooterSaving] = React.useState(false);
// 차량 위치 관리
const [vehiclesList, setVehiclesList] = React.useState([]);
const [vehicleDraft, setVehicleDraft] = React.useState({ name:'', driver_name:'', driver_phone:'', route:'' });
const [vehicleEditingId, setVehicleEditingId] = React.useState(null);
const [kakaoKeyInput, setKakaoKeyInput] = React.useState('');
const [kakaoKeyHasSaved, setKakaoKeyHasSaved] = React.useState(false);
const [vehicleSaving, setVehicleSaving] = React.useState(false);
const [adminLevelTestRequests, setAdminLevelTestRequests] = React.useState({}); // { exam_id: [requests] }
const [adminLevelTestSubs, setAdminLevelTestSubs] = React.useState({}); // { exam_id: [submissions] }
const [adminLevelTestLoading, setAdminLevelTestLoading] = React.useState(false);
const [adminLtFormOpen, setAdminLtFormOpen] = React.useState(false);
const [analyzingExamId, setAnalyzingExamId] = React.useState(null);
const [analysisOpenId, setAnalysisOpenId] = React.useState(null);
const [analyzingStudentId, setAnalyzingStudentId] = React.useState(null);
// 자료실 — 분석 자료 도서관 (시험·숙제 만들기용; kind='material' exams)
const MATERIAL_DRAFT_INIT = { title:'', subject:'', school_level:'', target_grade:'', target_semester:'', description:'', material_type:'exam', files:[], answer_files:[], existing_paths:[], answer_existing_paths:[], analyze_page_range:'', selected_questions_text:'', precise:false, precise_student:false, analysis:null };
const [materials, setMaterials] = React.useState([]);
const [materialLoading, setMaterialLoading] = React.useState(false);
const [materialUploading, setMaterialUploading] = React.useState(false);
const [materialDraft, setMaterialDraft] = React.useState(MATERIAL_DRAFT_INIT);
const [materialEditId, setMaterialEditId] = React.useState(null);
const [analyzingMaterialId, setAnalyzingMaterialId] = React.useState(null);
const [materialAnalysisOpenId, setMaterialAnalysisOpenId] = React.useState(null);
const [materialFilters, setMaterialFilters] = React.useState({ search:'', subject:'', level:'', grade:'', view:'all' });
function gradeOptsForLevel(lvl) {
  if (lvl === '초등') return ['1학년','2학년','3학년','4학년','5학년','6학년'];
  if (lvl === '중등') return ['중1','중2','중3'];
  if (lvl === '고등') return ['고1','고2','고3'];
  return ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'];
}
const [materialFormOpen, setMaterialFormOpen] = React.useState(false);
const [materialPickerOpen, setMaterialPickerOpen] = React.useState(false);

// ── 모바일 뒤로가기: 관리자 탭/모달 단계별 복귀 (PWA 종료 방지) ──
React.useEffect(function(){
  if (typeof window === 'undefined') return;
  function onPop(e) {
    if (materialPickerOpen) {
      e.stopImmediatePropagation();
      setMaterialPickerOpen(false);
      try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
      return;
    }
    if (materialFormOpen) {
      e.stopImmediatePropagation();
      setMaterialFormOpen(false); setMaterialEditId(null);
      try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
      return;
    }
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
}, [tab, adminLtFormOpen, materialFormOpen, materialPickerOpen]);

// 관리자 탭/모달 진입 시 history에 한 단계 push
React.useEffect(function(){
  if (typeof window === 'undefined') return;
  var deep = (tab !== 'home') || adminLtFormOpen || materialFormOpen || materialPickerOpen;
  if (!deep) return;
  var st = window.history.state || {};
  if (!st.b2Inner) {
    try { window.history.pushState({ page:'admin', b2Inner:true }, ''); } catch (err) {}
  }
}, [tab, adminLtFormOpen, materialFormOpen, materialPickerOpen]);
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
days: c.days || 0, duration: c.duration || 0, teacher: c.teacher || '', teacher_id: c.teacher_id || null,
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

const { data: allMembers } = await sb.from('students').select('*, enrollments(course_id, is_active)').in('role', ['student','parent','teacher']).eq('is_active', true);
if (allMembers) {
setDbMembers(allMembers.map(m => ({
id: m.id, name: m.name, email: m.email, provider: m.login_provider,
role: m.role, grade: m.grade || '', school: m.school || '',
phone: m.phone || '', address: m.address || '', createdAt: m.created_at,
parentId: m.parent_id || null,
// 승인된(is_active) 수강이 1개라도 있어야 '수강생' — 신청만 한(pending=is_active false) 상태는 아직 일반회원
isEnrollee: (m.enrollments || []).some(function(e){ return e.is_active; }),
})));
}

// 수강 신청 대기 (학생 자가 신청, 관리자 승인 대기)
const { data: pendEnr } = await sb.from('enrollments').select('id, student_id, course_id, enrolled_at').eq('status', 'pending').order('enrolled_at', { ascending: false });
if (pendEnr) setPendingEnrollments(pendEnr); else setPendingEnrollments([]);

// 강의일정 변경 신청 (홈 카드 배지용 — 자세한 건 학원 일정 탭)
loadAdminScheduleRequests();

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

const { data: attRows, error: attError } = await sb.from('attendance').select('id, student_id, date, status');
if (attError) console.error('attendance load error:', attError.message || attError);
if (attRows) setAdminAttendance(attRows);
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
function renderFileList(paths, label, unitWord) {
  if (!paths || paths.length === 0) return null;
  var w = unitWord || '페이지';
  return React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'6px' } },
    paths.map(function(p, i){
      var url = adminAttachmentPublicUrl(p);
      var ext = (String(p).split('.').pop() || '').toLowerCase();
      return React.createElement('a', { key:i, href:url, target:'_blank', rel:'noopener noreferrer', style:{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'11px', fontFamily:'Manrope, sans-serif', background:'#fff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'4px 9px', color:'#1d4ed8', fontWeight:'700', textDecoration:'none' } },
        label + ' ' + (i+1) + w + (ext ? ' (.' + ext + ')' : ''),
        React.createElement('span', { style:{ color:'#0f766e', textDecoration:'underline' } }, '열기')
      );
    })
  );
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

async function loadVehiclesData() {
  try {
    var vRes = await sb.from('vehicles').select('*').order('created_at');
    setVehiclesList((vRes && vRes.data) || []);
    var kRes = await window.B2Utils.loadSiteContent('kakao_map_key');
    var saved = (kRes && (kRes.appkey || kRes.key)) || '';
    setKakaoKeyInput(saved);
    setKakaoKeyHasSaved(!!saved);
  } catch (e) { console.error('차량 데이터 로드 실패:', e); }
}
async function saveKakaoKey() {
  var key = (kakaoKeyInput || '').trim();
  if (!key) { alert('카카오 JavaScript 키를 입력해 주세요.'); return; }
  setVehicleSaving(true);
  try {
    var { error } = await window.B2Utils.saveSiteContent('kakao_map_key', { appkey: key });
    if (error) throw error;
    setKakaoKeyHasSaved(true);
    alert('카카오 지도 키가 저장되었습니다. 차량 위치 페이지를 새로고침하면 반영됩니다.');
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setVehicleSaving(false); }
}
async function saveVehicle() {
  var d = vehicleDraft;
  if (!d.name || !d.name.trim()) { alert('차량 이름을 입력해 주세요. (예: 1호차)'); return; }
  setVehicleSaving(true);
  try {
    var payload = {
      name: d.name.trim(),
      driver_name: (d.driver_name || '').trim() || null,
      driver_phone: (d.driver_phone || '').trim() || null,
      route: (d.route || '').trim() || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    if (vehicleEditingId) {
      var u = await sb.from('vehicles').update(payload).eq('id', vehicleEditingId);
      if (u.error) throw u.error;
    } else {
      var ins = await sb.from('vehicles').insert(payload);
      if (ins.error) throw ins.error;
    }
    setVehicleDraft({ name:'', driver_name:'', driver_phone:'', route:'' });
    setVehicleEditingId(null);
    await loadVehiclesData();
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
  finally { setVehicleSaving(false); }
}
function editVehicle(v) {
  setVehicleEditingId(v.id);
  setVehicleDraft({ name: v.name || '', driver_name: v.driver_name || '', driver_phone: v.driver_phone || '', route: v.route || '' });
}
function cancelVehicleEdit() {
  setVehicleEditingId(null);
  setVehicleDraft({ name:'', driver_name:'', driver_phone:'', route:'' });
}
async function toggleVehicleActive(v) {
  try {
    await sb.from('vehicles').update({ is_active: !v.is_active, updated_at: new Date().toISOString() }).eq('id', v.id);
    await loadVehiclesData();
  } catch (e) { alert('변경 실패: ' + (e.message || e)); }
}
async function deleteVehicle(v) {
  if (!confirm('차량 "' + v.name + '"을(를) 삭제할까요? (위치 기록도 함께 삭제됩니다)')) return;
  try {
    await sb.from('vehicle_locations').delete().eq('vehicle_id', v.id);
    await sb.from('vehicles').delete().eq('id', v.id);
    await loadVehiclesData();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
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
  if (!materials.length) loadMaterials();
  setAdminLtDraft({ id:null, kind:'level', existing_paths:[], answer_existing_paths:[], answer_files:[], title:'', subject:'', school_level:'중', target_grade:'', target_semester:'', min_score:'0', max_score:'100', description:'', files:[], question_count:'0', choices_per_question:'5', text_question_count:'0', time_limit_minutes:'0', answer_key:{}, allow_audio_answer:false, analyze_page_range:'', selected_questions_text:'', precise:false, precise_student:false, hide_paper:false, material_id:null, material_title:'', analysis:null });
  setAdminLtFormOpen(true);
}
function adminOpenLtEditForm(t) {
  if (!materials.length) loadMaterials();
  setAdminLtDraft({
    id: t.id,
    kind: t.kind || 'level',
    existing_paths: Array.isArray(t.image_paths) ? t.image_paths : [],
    answer_existing_paths: Array.isArray(t.answer_paths) ? t.answer_paths : [],
    answer_files: [],
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
    analyze_page_range: t.analyze_page_range || '',
    selected_questions_text: Array.isArray(t.selected_questions) ? t.selected_questions.join(',') : '',
    analysis: t.analysis || null,
    precise: t.analyze_model === 'opus',
    precise_student: t.analyze_student_model === 'opus',
    hide_paper: !!t.hide_paper_for_students,
    material_id: t.material_id || null,
    material_title: t.material_id ? (((materials || []).find(function(m){ return String(m.id) === String(t.material_id); }) || {}).title || '') : '',
  });
  setAdminLtFormOpen(true);
}
function adminCloseLtForm() { setAdminLtFormOpen(false); }
async function removeExamFilesAdmin(which) {
  if (!adminLtDraft || !adminLtDraft.id) { alert('아직 발행 전이라 삭제할 파일이 없습니다. (파일 선택을 비워두면 됩니다)'); return; }
  var key = which === 'answer' ? 'answer_existing_paths' : 'existing_paths';
  var col = which === 'answer' ? 'answer_paths' : 'image_paths';
  var label = which === 'answer' ? '답안지·해설' : '시험지';
  var paths = (adminLtDraft[key] || []).slice();
  if (paths.length === 0) { alert('삭제할 ' + label + ' 파일이 없습니다.'); return; }
  if (!confirm('등록된 ' + label + ' 파일 ' + paths.length + '개를 모두 삭제할까요?')) return;
  try { await sb.storage.from('attachments').remove(paths); } catch (e) {}
  var upd = {}; upd[col] = [];
  var { error } = await sb.from('exams').update(upd).eq('id', adminLtDraft.id);
  if (error) { alert('삭제 실패: ' + error.message); return; }
  setAdminLtDraft(function(p){ var o = Object.assign({}, p); o[key] = []; return o; });
  await loadAdminLevelTests();
  alert(label + ' 파일을 삭제했습니다.');
}

async function adminSubmitLevelTest(thenAnalyze) {
  var sb = window.supabase;
  var d = adminLtDraft;
  var isEdit = !!d.id;
  var doAnalyze = thenAnalyze === true;
  if (doAnalyze && isEdit && d.analysis) {
    doAnalyze = confirm('이미 문항 분석이 된 시험입니다.\n[확인] = 저장하고 다시 분석 (Claude 요금 다시 발생)\n[취소] = 저장만');
  }
  if (!d.title.trim()) { alert('제목을 입력해 주세요.'); return; }
  var existingPaths = Array.isArray(d.existing_paths) ? d.existing_paths : [];
  if ((!d.files || d.files.length === 0) && existingPaths.length === 0) { alert('시험지 이미지를 1장 이상 올리거나 자료실에서 불러와 주세요.'); return; }
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
    // 답안지(해설 포함) 업로드 — 시험지와 동일한 패턴
    var answerExisting = Array.isArray(d.answer_existing_paths) ? d.answer_existing_paths : [];
    var answerPaths = answerExisting.slice();
    if (d.answer_files && d.answer_files.length > 0) {
      if (isEdit && answerExisting.length > 0) {
        try { await sb.storage.from('attachments').remove(answerExisting); } catch(e) {}
      }
      answerPaths = [];
      for (var ai = 0; ai < d.answer_files.length; ai++) {
        var af = d.answer_files[ai];
        var aext = (af.name.split('.').pop() || 'png').toLowerCase();
        var apath = 'exams/level/answers/' + Date.now() + '_' + ai + '_' + Math.random().toString(36).slice(2,8) + '.' + aext;
        var aup = await sb.storage.from('attachments').upload(apath, af, { cacheControl:'3600', upsert:false });
        if (aup.error) throw aup.error;
        answerPaths.push(apath);
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
      answer_paths: answerPaths,
      analysis: d.analysis || null,
      material_id: d.material_id || null,
      analyze_page_range: (d.analyze_page_range || '').trim() || null,
      selected_questions: window.B2Utils.parseNumberRange(d.selected_questions_text),
      analyze_model: d.precise ? 'opus' : 'sonnet',
      analyze_student_model: d.precise_student ? 'opus' : 'sonnet',
      hide_paper_for_students: !!d.hide_paper,
      question_count: qc,
      choices_per_question: cpq,
      text_question_count: tqc,
      allow_text_answer: tqc > 0,
      time_limit_minutes: tlm,
      allow_audio_answer: !!d.allow_audio_answer && kindVal === 'homework',
    };
    var kindLabel = kindVal === 'weekly' ? '주간 테스트' : (kindVal === 'monthly' ? '월말 테스트' : (kindVal === 'homework' ? '숙제' : '레벨테스트'));
    var savedId = null;
    if (isEdit) {
      var { error } = await sb.from('exams').update(row).eq('id', d.id);
      if (error) throw error;
      savedId = d.id;
      if (!doAnalyze) alert(kindLabel + '이(가) 수정되었습니다.');
    } else {
      row.class_id = null;
      row.teacher_id = null;
      row.teacher_name = '관리자';
      row.status = 'open';
      var ins = await sb.from('exams').insert(row).select('id').single();
      if (ins.error) throw ins.error;
      savedId = ins.data && ins.data.id;
      if (!doAnalyze) alert(kindLabel + '이(가) 발행되었습니다.');
    }
    if (!doAnalyze) adminCloseLtForm();
    await loadAdminLevelTests();
    if (doAnalyze && savedId) {
      setAdminLtDraft(function(p){ return Object.assign({}, p, { id: savedId }); });
      setAnalyzingExamId(savedId);
      try {
        var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: savedId });
        if (!r.ok || (r.data && r.data.error)) { alert('저장은 됐지만 문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); }
        else {
          await loadAdminLevelTests();
          setAnalysisOpenId(savedId);
          var u = (r.data && r.data.usage) || {};
          setAdminLtDraft(function(p){ return Object.assign({}, p, { id: savedId, analysis: (r.data && r.data.analysis) || p.analysis }); });
          // 자료실 자동 수집: 새로 업로드+분석한 경우 자료실에도 같은 자료로 row 추가하고 material_id 로 연결
          if (!d.material_id) {
            try {
              var mIns = await sb.from('exams').insert({
                kind: 'material', class_id: null,
                material_type: 'exam',
                teacher_id: null, teacher_name: '관리자',
                title: d.title.trim(),
                subject: (d.subject||'').trim() || null,
                school_level: d.school_level || null,
                target_grade: d.target_grade || null,
                target_semester: d.target_semester || null,
                description: (d.description||'').trim() || null,
                image_paths: row.image_paths, answer_paths: row.answer_paths,
                analyze_page_range: row.analyze_page_range,
                selected_questions: row.selected_questions,
                analyze_model: row.analyze_model,
                analyze_student_model: row.analyze_student_model,
                analysis: (r.data && r.data.analysis) || null,
                answer_key: row.answer_key || {},
                question_count: row.question_count, text_question_count: row.text_question_count, choices_per_question: row.choices_per_question,
                status: 'open',
              }).select('id').single();
              if (mIns && mIns.data && mIns.data.id) {
                await sb.from('exams').update({ material_id: mIns.data.id }).eq('id', savedId);
              }
              await loadMaterials();
            } catch (mErr) { console.warn('자료실 자동 수집 실패:', mErr); }
          }
          alert('문항 분석 완료!' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' / 출력 ' + (u.output_tokens||0) + ' 토큰)' : '') + '\n— 자료실에도 같이 보관됐어요.');
        }
      } catch (ee) { alert('저장은 됐지만 문항 분석 실패: ' + (ee.message || ee)); }
      finally { setAnalyzingExamId(null); }
    }
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
    try { var sr = await sb.from('exam_submissions').select('exam_id').eq('id', submissionId).single(); if (sr && sr.data && sr.data.exam_id) await window.B2Utils.syncExamScore(sr.data.exam_id, submissionId); } catch (e2) {}
    alert('채점이 저장되었습니다.');
    await loadAdminLevelTests();
  } catch (e) { alert('저장 실패: ' + (e.message || e)); }
}

async function runExamAnalysis(t) {
  var hasFiles = (Array.isArray(t.image_paths) && t.image_paths.length > 0) || (Array.isArray(t.answer_paths) && t.answer_paths.length > 0);
  if (!hasFiles) { alert('먼저 시험지 또는 답안지 파일을 업로드한 뒤(시험 수정에서) 분석해 주세요.'); return; }
  if (t.analysis && !confirm('이미 분석된 시험입니다. 다시 분석할까요?\n(Claude API 요금이 다시 발생합니다)')) return;
  setAnalyzingExamId(t.id);
  try {
    var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: t.id });
    if (!r.ok || (r.data && r.data.error)) { alert('문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
    await loadAdminLevelTests();
    setAnalysisOpenId(t.id);
    var u = (r.data && r.data.usage) || {};
    alert('문항 분석이 완료되었습니다.' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' 토큰 / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
  } catch (e) { alert('문항 분석 실패: ' + (e.message || e)); }
  finally { setAnalyzingExamId(null); }
}

async function runStudentAnalysis(submissionId, hasExisting) {
  if (!submissionId) return;
  if (hasExisting && !confirm('이 학생은 이미 AI 약점 분석이 되어 있습니다.\n다시 분석하면 Claude 요금이 다시 발생합니다 (약 50원).\n다시 분석할까요?')) return;
  setAnalyzingStudentId(submissionId);
  try {
    var r = await window.B2Utils.callEdgeFn('analyze-student', { submission_id: submissionId });
    if (!r.ok || (r.data && r.data.error)) { alert('학생 약점 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
    try { var sr = await window.supabase.from('exam_submissions').select('exam_id').eq('id', submissionId).single(); if (sr && sr.data && sr.data.exam_id) await window.B2Utils.syncExamScore(sr.data.exam_id, submissionId); } catch (e2) {}
    await loadAdminLevelTests();
    var u = (r.data && r.data.usage) || {};
    alert('학생 약점 분석 완료!' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
  } catch (e) { alert('학생 약점 분석 실패: ' + (e.message || e)); }
  finally { setAnalyzingStudentId(null); }
}
function renderStudentAnalysis(a) {
  if (!a) return null;
  return React.createElement('div', { style:{ marginTop:'6px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px', fontSize:'11px', fontFamily:'Manrope, sans-serif', lineHeight:'1.6' } },
    React.createElement('div', { style:{ fontWeight:'800', color:'#15803d', marginBottom:'4px' } }, 'AI 약점 분석' + (a.score != null ? ' — ' + a.score + '/' + (a.total != null ? a.total : '?') + (a.percentage != null ? ' (' + a.percentage + '%)' : '') : '') + (a.analyzed_at ? ' · ' + String(a.analyzed_at).slice(0,16).replace('T',' ') : '')),
    a.summary && React.createElement('div', { style:{ color:'#374151', marginBottom:'4px', whiteSpace:'pre-line' } }, a.summary),
    Array.isArray(a.weak_topics) && a.weak_topics.length > 0 && React.createElement('div', { style:{ color:'#c82014', marginBottom:'2px', fontWeight:'700' } }, '약점: ' + a.weak_topics.join(', ')),
    Array.isArray(a.strengths) && a.strengths.length > 0 && React.createElement('div', { style:{ color:'#15803d', marginBottom:'2px' } }, '강점: ' + a.strengths.join(', ')),
    a.mistake_pattern && React.createElement('div', { style:{ color:'#c87000', marginBottom:'2px' } }, '실수 패턴: ' + a.mistake_pattern),
    Array.isArray(a.wrong_questions) && a.wrong_questions.length > 0 && React.createElement('div', { style:{ color:'#6b7280', marginBottom:'2px' } }, '틀린 문항: ' + a.wrong_questions.join(', ') + '번'),
    Array.isArray(a.by_topic) && a.by_topic.length > 0 && React.createElement('div', { style:{ color:'#374151', marginBottom:'2px' } }, '단원별: ' + a.by_topic.map(function(t){ return t.topic + ' ' + t.correct + '/' + t.total; }).join(' · ')),
    a.text_feedback && React.createElement('div', { style:{ color:'#7c3aed', marginTop:'4px', whiteSpace:'pre-line' } }, '서술형 평가: ' + a.text_feedback),
    a.recommendation && React.createElement('div', { style:{ color:'#1d4ed8', marginTop:'4px', whiteSpace:'pre-line', fontWeight:'600' } }, '추천 학습: ' + a.recommendation)
  );
}
function renderExamAnalysis(a) {
  if (!a) return null;
  var qs = Array.isArray(a.questions) ? a.questions : [];
  function diffColor(d){ return d==='상' ? '#c82014' : (d==='중' ? '#c87000' : '#16a34a'); }
  return React.createElement('div', { style:{ marginTop:'10px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px' } },
    React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#111827', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '분석 내용'),
    React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'400px', overflowY:'auto' } },
      qs.map(function(q, i){
        return React.createElement('div', { key:i, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'6px', padding:'7px 10px', fontSize:'11px', fontFamily:'Manrope, sans-serif' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'2px' } },
            React.createElement('span', { style:{ fontWeight:'800', color:'#111827' } }, (q.number != null ? q.number : (i+1)) + '번'),
            React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background: q.type==='mc' ? '#dbeafe' : '#fef3c7', color: q.type==='mc' ? '#1d4ed8' : '#92400e', borderRadius:'3px', padding:'1px 5px' } }, q.type==='mc' ? ('객관식' + (q.choices_count ? (' ' + q.choices_count + '지') : '')) : '서술형'),
            q.difficulty && React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', color: diffColor(q.difficulty) } }, '난이도 ' + q.difficulty),
            (q.page != null) && React.createElement('span', { style:{ fontSize:'10px', color:'#9ca3af' } }, q.page + 'p'),
            React.createElement('span', { style:{ fontWeight:'700', color:'#E60012' } }, '정답: ' + (q.answer || '-'))
          ),
          (q.topic || q.subtopic) && React.createElement('div', { style:{ color:'#374151', marginBottom:'1px' } }, [q.topic, q.subtopic].filter(Boolean).join(' · ')),
          q.intent && React.createElement('div', { style:{ color:'#6b7280' } }, q.intent)
        );
      })
    )
  );
}

async function adminDeleteLevelTest(t) {
  var label = t.kind === 'weekly' ? '주간 테스트' : (t.kind === 'monthly' ? '월말 테스트' : (t.kind === 'homework' ? '숙제' : '레벨테스트'));
  if (!confirm('이 ' + label + '을(를) 삭제하시겠습니까? 제출 내역과 답안도 함께 삭제됩니다.')) return;
  var sb = window.supabase;
  try {
    // 자료실 자료에서 만든 시험이면 시험지 파일은 자료가 계속 쓰므로 지우지 않음
    if (!t.material_id) {
      var paths = Array.isArray(t.image_paths) ? t.image_paths : [];
      var ansPaths = Array.isArray(t.answer_paths) ? t.answer_paths : [];
      var allPaths = paths.concat(ansPaths);
      if (allPaths.length > 0) { try { await sb.storage.from('attachments').remove(allPaths); } catch(e) {} }
    }
    try { await window.B2Utils.removeExamScores(t.id); } catch (e2) {}
    await sb.from('exams').delete().eq('id', t.id);
    await loadAdminLevelTests();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
}

// ── 자료실: 분석 자료 도서관 (시험·숙제 만들기용) ──
async function loadMaterials() {
  setMaterialLoading(true);
  var sb = window.supabase;
  try {
    var { data } = await sb.from('exams').select('*').eq('kind', 'material').order('created_at', { ascending:false });
    setMaterials(data || []);
  } catch (e) { setMaterials([]); }
  finally { setMaterialLoading(false); }
}
function openMaterialForm() {
  setMaterialEditId(null);
  setMaterialDraft(Object.assign({}, MATERIAL_DRAFT_INIT));
  setMaterialFormOpen(true);
}
function openMaterialFormForEdit(m) {
  setMaterialEditId(m.id);
  setMaterialDraft({
    title: m.title || '', subject: m.subject || '', school_level: m.school_level || '', target_grade: m.target_grade || '', target_semester: m.target_semester || '',
    description: m.description || '',
    material_type: m.material_type || 'exam',
    files: [], answer_files: [],
    existing_paths: Array.isArray(m.image_paths) ? m.image_paths : [],
    answer_existing_paths: Array.isArray(m.answer_paths) ? m.answer_paths : [],
    analyze_page_range: m.analyze_page_range || '',
    selected_questions_text: Array.isArray(m.selected_questions) ? m.selected_questions.join(',') : '',
    precise: m.analyze_model === 'opus',
    precise_student: m.analyze_student_model === 'opus',
    analysis: m.analysis || null,
  });
  setMaterialFormOpen(true);
}
function closeMaterialForm() { setMaterialFormOpen(false); setMaterialEditId(null); }
async function submitMaterial(thenAnalyze) {
  var sb = window.supabase;
  var d = materialDraft;
  if (!d.title.trim()) { alert('자료 제목을 입력해 주세요.'); return; }
  var hasNewFiles = (d.files && d.files.length) || (d.answer_files && d.answer_files.length);
  var hasExisting = ((d.existing_paths||[]).length) || ((d.answer_existing_paths||[]).length);
  if (!hasNewFiles && !hasExisting) { alert('시험지 또는 답안지·해설 파일을 1개 이상 올려주세요.'); return; }
  var doAnalyze = thenAnalyze === true;
  if (doAnalyze && materialEditId && d.analysis) {
    doAnalyze = confirm('이미 문항 분석이 된 자료입니다.\n[확인] = 저장하고 다시 분석 (Claude 요금 다시 발생)\n[취소] = 저장만');
  }
  setMaterialUploading(true);
  try {
    var prefix = 'materials/' + ((user && user.id) ? user.id : 'admin');
    var paths = (d.existing_paths && d.existing_paths.length) ? d.existing_paths.slice() : [];
    if (d.files && d.files.length > 0) {
      paths = [];
      for (var i = 0; i < d.files.length; i++) {
        var f = d.files[i]; var ext = (f.name.split('.').pop() || 'png').toLowerCase();
        var p = prefix + '/' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
        var up = await sb.storage.from('attachments').upload(p, f, { cacheControl:'3600', upsert:false });
        if (up.error) throw up.error; paths.push(p);
      }
    }
    var ansPaths = (d.answer_existing_paths && d.answer_existing_paths.length) ? d.answer_existing_paths.slice() : [];
    if (d.answer_files && d.answer_files.length > 0) {
      ansPaths = [];
      for (var ai = 0; ai < d.answer_files.length; ai++) {
        var af = d.answer_files[ai]; var aext = (af.name.split('.').pop() || 'png').toLowerCase();
        var ap = prefix + '/answers/' + Date.now() + '_' + ai + '_' + Math.random().toString(36).slice(2,8) + '.' + aext;
        var aup = await sb.storage.from('attachments').upload(ap, af, { cacheControl:'3600', upsert:false });
        if (aup.error) throw aup.error; ansPaths.push(ap);
      }
    }
    var row = {
      title: d.title.trim(),
      subject: (d.subject||'').trim() || null,
      school_level: (d.school_level||'').trim() || null,
      target_grade: (d.target_grade||'').trim() || null,
      target_semester: (d.target_semester||'').trim() || null,
      description: (d.description||'').trim() || null,
      material_type: d.material_type || 'exam',
      image_paths: paths,
      answer_paths: ansPaths,
      analyze_page_range: (d.analyze_page_range || '').trim() || null,
      selected_questions: window.B2Utils.parseNumberRange(d.selected_questions_text),
      analyze_model: d.precise ? 'opus' : 'sonnet',
      analyze_student_model: d.precise_student ? 'opus' : 'sonnet',
    };
    var savedId = null;
    if (materialEditId) {
      var u = await sb.from('exams').update(row).eq('id', materialEditId);
      if (u.error) throw u.error; savedId = materialEditId;
      if (!doAnalyze) alert('자료가 수정되었습니다.');
    } else {
      var insertRow = Object.assign({
        kind: 'material', class_id: null, teacher_id: null, teacher_name: '관리자',
        status: 'open', question_count: 0, text_question_count: 0, allow_text_answer: false, answer_key: {},
      }, row);
      var ins = await sb.from('exams').insert(insertRow).select('id').single();
      if (ins.error) throw ins.error; savedId = ins.data && ins.data.id;
      if (!doAnalyze) alert('자료가 저장되었습니다.');
    }
    await loadMaterials();
    if (!doAnalyze) { closeMaterialForm(); }
    if (doAnalyze && savedId) {
      setMaterialEditId(savedId);
      setMaterialDraft(function(p){ return Object.assign({}, p, { existing_paths: row.image_paths, answer_existing_paths: row.answer_paths, files:[], answer_files:[] }); });
      setAnalyzingMaterialId(savedId);
      try {
        var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: savedId });
        if (!r.ok || (r.data && r.data.error)) { alert('저장은 됐지만 문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); }
        else {
          await loadMaterials();
          setMaterialAnalysisOpenId(savedId);
          var us = (r.data && r.data.usage) || {};
          setMaterialDraft(function(p){ return Object.assign({}, p, { analysis: (r.data && r.data.analysis) || p.analysis }); });
          alert('문항 분석 완료!' + (us.input_tokens ? '\n(입력 ' + us.input_tokens + ' / 출력 ' + (us.output_tokens||0) + ' 토큰)' : ''));
        }
      } catch (ee) { alert('저장은 됐지만 문항 분석 실패: ' + (ee.message || ee)); }
      finally { setAnalyzingMaterialId(null); }
    }
  } catch (e) {
    alert((materialEditId ? '수정' : '저장') + ' 실패: ' + (e.message || e));
  } finally {
    setMaterialUploading(false);
  }
}
async function reanalyzeMaterial(m) {
  var hasFiles = (Array.isArray(m.image_paths) && m.image_paths.length) || (Array.isArray(m.answer_paths) && m.answer_paths.length);
  if (!hasFiles) { alert('이 자료에 시험지/답안지 파일이 없습니다. "수정"에서 파일을 올린 뒤 분석해 주세요.'); return; }
  if (m.analysis && !confirm('이미 분석된 자료입니다. 다시 분석할까요?\n(Claude API 요금이 다시 발생합니다)')) return;
  setAnalyzingMaterialId(m.id);
  try {
    var r = await window.B2Utils.callEdgeFn('analyze-exam', { exam_id: m.id });
    if (!r.ok || (r.data && r.data.error)) { alert('문항 분석 실패: ' + ((r.data && r.data.error) || ('HTTP ' + r.status))); return; }
    await loadMaterials();
    setMaterialAnalysisOpenId(m.id);
    var u = (r.data && r.data.usage) || {};
    alert('문항 분석 완료!' + (u.input_tokens ? '\n(입력 ' + u.input_tokens + ' / 출력 ' + (u.output_tokens||0) + ' 토큰)' : ''));
  } catch (e) { alert('문항 분석 실패: ' + (e.message || e)); }
  finally { setAnalyzingMaterialId(null); }
}
async function deleteMaterial(m) {
  var sb = window.supabase;
  var dependents = [];
  try { var { data: dep } = await sb.from('exams').select('id').eq('material_id', m.id); dependents = dep || []; } catch (e) {}
  var n = dependents.length;
  var msg = n > 0
    ? '이 자료로 만든 시험·숙제가 ' + n + '개 있습니다.\n자료 기록만 지우고, 그 시험·숙제들과 시험지 파일은 그대로 둡니다. 계속할까요?'
    : '이 자료를 삭제하시겠습니까?';
  if (!confirm(msg)) return;
  try {
    if (n === 0) {
      var allPaths = (Array.isArray(m.image_paths)?m.image_paths:[]).concat(Array.isArray(m.answer_paths)?m.answer_paths:[]);
      if (allPaths.length) { try { await sb.storage.from('attachments').remove(allPaths); } catch(e){} }
    }
    await sb.from('exams').delete().eq('id', m.id);
    await loadMaterials();
  } catch (e) { alert('삭제 실패: ' + (e.message || e)); }
}
// 시험 발행 폼에 자료 불러오기
function loadMaterialIntoExam(m) {
  setAdminLtDraft(function(p){
    return Object.assign({}, p, {
      subject: m.subject || p.subject || '',
      files: [], answer_files: [],
      existing_paths: Array.isArray(m.image_paths) ? m.image_paths.slice() : [],
      answer_existing_paths: Array.isArray(m.answer_paths) ? m.answer_paths.slice() : [],
      analysis: m.analysis || null,
      answer_key: (m.answer_key && typeof m.answer_key === 'object') ? Object.assign({}, m.answer_key) : {},
      question_count: String(m.question_count || 0),
      choices_per_question: String(m.choices_per_question || 5),
      text_question_count: String(m.text_question_count || 0),
      analyze_page_range: m.analyze_page_range || '',
      selected_questions_text: Array.isArray(m.selected_questions) ? m.selected_questions.join(',') : '',
      precise: m.analyze_model === 'opus',
      precise_student: m.analyze_student_model === 'opus',
      material_id: m.id,
      material_title: m.title || '',
    });
  });
  setMaterialPickerOpen(false);
}
function unlinkMaterialFromExam() {
  setAdminLtDraft(function(p){ return Object.assign({}, p, { material_id: null, material_title: '', existing_paths: [], answer_existing_paths: [], analysis: null, answer_key: {}, question_count: '0', text_question_count: '0', choices_per_question: '5', analyze_page_range: '', selected_questions_text: '', precise: false, precise_student: false }); });
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
  if (c === 'exam') return '시험기간';
  return '기타';
}
function adminAcademicCategoryColor(c) {
  if (c === 'vacation') return '#1d4ed8';
  if (c === 'exam') return '#c87000';
  return '#6b7280';
}

async function createTeacherClass(teacher, draft) {
var _grades = (draft && draft.grades) || [];
var _subjects = (draft && draft.subjects) || [];
if (_grades.length === 0) { alert('학교급과 학년을 선택해 주세요.'); return; }
var profile = await ensureTeacherProfile(teacher);
if (!profile) return;
var _subjStr = _subjects.join(', ');
var _nameBase = (draft.name || '').trim();
function _levelOfGrade(g) {
  var lv = '';
  ['초등','중등','고등'].forEach(function(L){ if (SCHOOL_LEVELS[L].grades.indexOf(g) >= 0) lv = L; });
  return lv || '초등';
}
// 1) 고른 학년마다 반 1개씩 생성
var _created = [];
for (var _i = 0; _i < _grades.length; _i++) {
  var _g = _grades[_i];
  var _clsName = [_g, _subjStr, _nameBase].filter(Boolean).join(' ');
  var _payload = { teacher_id: profile.id, name: _clsName, grade: _g, subject: _subjStr, class_name: _clsName };
  var _res = await sb.from('classes').insert(_payload).select('*').single();
  if (_res.error) { alert('반 생성 실패(' + _g + '): ' + _res.error.message); }
  else if (_res.data) _created.push(_res.data);
}
if (_created.length > 0) setTeacherClasses(function(prev){ return (prev||[]).concat(_created); });
setClassManageDrafts(function(prev){ var n = Object.assign({}, prev); delete n[teacher.id]; return n; });

// 2) 담당 반의 학교급/학년/과목을 선생님의 '담당 과목·학년 배정'에도 자동 반영 (이중 입력 방지)
try {
  var _upd = {};
  // 과목 자동 추가
  var _curSubjects = Array.isArray(teacher.subjects) ? teacher.subjects.slice() : [];
  var _subjChanged = false;
  _subjects.forEach(function(sj){ if (sj && _curSubjects.indexOf(sj) < 0) { _curSubjects.push(sj); _subjChanged = true; } });
  if (_subjChanged) _upd.subjects = _curSubjects;
  // 학년 태그 자동 추가 — 형식: '과목-학교급 학년' (과목 없으면 '학교급 학년'), '과목별 학교급/학년 배정' 섹션과 동일
  var _curGrades = splitAdminList(teacher && teacher.grade);
  var _gChanged = false;
  _grades.forEach(function(g){
    var lv = _levelOfGrade(g);
    if (_subjects.length > 0) {
      _subjects.forEach(function(sj){ var tag = sj + '-' + lv + ' ' + g; if (_curGrades.indexOf(tag) < 0) { _curGrades.push(tag); _gChanged = true; } });
    } else {
      var tag = lv + ' ' + g; if (_curGrades.indexOf(tag) < 0) { _curGrades.push(tag); _gChanged = true; }
    }
  });
  if (_gChanged) _upd.grade = joinAdminList(_curGrades);
  if (_upd.subjects || _upd.grade) {
    await sb.from('students').update(_upd).eq('id', teacher.id);
    setDbTeachers(function(ts){ return ts.map(function(x){ return x.id === teacher.id ? Object.assign({}, x, _upd) : x; }); });
  }
} catch (e) { /* 자동 반영 실패해도 반 생성은 유지 */ }
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

async function toggleAttendance(studentId, status) {
const today = new Date().toISOString().slice(0, 10);
const existing = adminAttendance.find(a => String(a.student_id) === String(studentId) && a.date === today);
if (existing && existing.status === status) {
await sb.from('attendance').delete().eq('id', existing.id);
setAdminAttendance(prev => prev.filter(a => a.id !== existing.id));
} else if (existing) {
await sb.from('attendance').update({ status }).eq('id', existing.id);
setAdminAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, status } : a));
} else {
const { data, error } = await sb.from('attendance').insert({ student_id: studentId, date: today, status }).select().single();
if (!error && data) setAdminAttendance(prev => prev.concat([{ id: data.id, student_id: studentId, date: today, status }]));
}
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

// 학생 자가 수강신청 승인 → 수강 가능 (is_active=true)
async function approveEnrollment(id) {
const pe = pendingEnrollments.find(p => p.id === id);
const { error } = await sb.from('enrollments').update({ status: 'approved', is_active: true }).eq('id', id);
if (error) { alert('승인 실패: ' + error.message); return; }
setPendingEnrollments(prev => prev.filter(p => p.id !== id));
if (pe) {
  setDbMembers(prev => prev.map(m => m.id === pe.student_id ? { ...m, isEnrollee: true } : m));
  setDbStudents(prev => prev.map(s => s.id === pe.student_id ? { ...s, enrolledCourses: (s.enrolledCourses || []).indexOf(pe.course_id) >= 0 ? s.enrolledCourses : [...(s.enrolledCourses || []), pe.course_id] } : s));
}
showSaved();
}
// 수강신청 거절 → 거절 처리 (is_active=false 유지)
async function rejectEnrollment(id) {
if (!confirm('이 수강 신청을 거절할까요?')) return;
const { error } = await sb.from('enrollments').update({ status: 'rejected', is_active: false }).eq('id', id);
if (error) { alert('거절 실패: ' + error.message); return; }
setPendingEnrollments(prev => prev.filter(p => p.id !== id));
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
// 선생님 grade 컬럼에 저장된 태그 전체를 그대로 반환 ('과목-학교급 학년', '학교급 학년' 등 형식 혼재 가능 — 각 호출처에서 필터)
return splitAdminList(teacher && teacher.grade);
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

if (!authed) return React.createElement(AdminLogin, { onLoginClick });

const tabs = [
{ id:'banner',  label:'배너 관리' },
{ id:'notice',  label:'공지사항' },
{ id:'course',  label:'강좌 관리' },
{ id:'enrollee',label:'수강생 관리' },
{ id:'classmgmt',label:'클래스 관리' },
{ id:'member',  label:'회원 정보' },
{ id:'teacher', label:'선생님 관리' },
{ id:'records', label:'업무일지 및 특이사항' },
{ id:'analysis',label:'성적 분석' },
{ id:'views',   label:'학습 현황' },
{ id:'files',   label:'자료실' },
{ id:'schedule',label:'학원 일정' },
{ id:'leveltest',label:'시험 관리' },
{ id:'vocab',   label:'단어장' },
{ id:'vehicles',label:'차량 위치' },
{ id:'feature', label:'섹션 편집' },
{ id:'about',   label:'학원안내 편집' },
{ id:'programs',label:'프로그램 편집' },
{ id:'eventbtn',label:'이벤트 버튼' },
{ id:'footer',  label:'푸터(사업자정보)' },
];

const tabGroups = [
{ id:'webapp',   label:'웹앱 관리', tabs:['banner','notice','feature','about','programs','eventbtn','footer'] },
{ id:'teachers', label:'강사',      tabs:['teacher','course','records'] },
{ id:'students', label:'수강생',    tabs:['enrollee','classmgmt','views','analysis'] },
{ id:'academy',  label:'학원 관리', tabs:['leveltest','vocab','member','schedule','files','vehicles'] },
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
          return React.createElement('button', { key:tid, onClick:function(){ setTab(tid); setTabGroup(g.id); if (tid === 'files') loadMaterials(); if (tid === 'schedule') { loadAdminScheduleRequests(); loadAdminAcademicSchedules(); } if (tid === 'leveltest') { loadAdminLevelTests(); loadMaterials(); } if (tid === 'about') loadAboutContent(); if (tid === 'programs') loadProgramsContent(); if (tid === 'eventbtn') loadEventBtn(); if (tid === 'footer') loadFooterContent(); if (tid === 'vehicles') loadVehiclesData(); }, style: Object.assign({
            background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px',
            cursor:'pointer', fontFamily:'Manrope, sans-serif',
            fontWeight:'700', color:'#111827',
            letterSpacing:'-0.01em', transition:'border-color 0.15s, box-shadow 0.15s',
            boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'
          }, adminIsMobile ? mobileStyle : pcStyle), onMouseEnter:function(e){ e.currentTarget.style.borderColor = groupColor; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'; }, onMouseLeave:function(e){ e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)'; } },
            t.label,
            (function(){
              // 처리 대기 건수 배지 — 선생님 관리: 가입 승인 대기(학생/학부모+선생님), 수강생 관리: 수강 신청 대기, 학원 일정: 아직 안 본 강의일정 변경 신청(학원 일정 탭 열면 0이 됨)
              var _scrSeenMs = scrSeenAt ? new Date(scrSeenAt).getTime() : 0;
              var cnt = tid === 'teacher'
                ? ((dbPending || []).filter(function(p){ return p.role !== 'pending_teacher'; }).length + (dbTeachers || []).filter(function(t2){ return t2.role === 'pending_teacher'; }).length)
                : tid === 'enrollee' ? (pendingEnrollments || []).length
                : tid === 'schedule' ? (adminScrList || []).filter(function(r){ var ms = new Date(r.created_at).getTime(); return !isNaN(ms) && ms > _scrSeenMs; }).length
                : 0;
              return cnt > 0 ? React.createElement('span', { style:{ marginLeft:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'18px', height:'18px', padding:'0 5px', borderRadius:'999px', background:'#E60012', color:'#fff', fontSize:'11px', fontWeight:'800', fontFamily:'Manrope, sans-serif', verticalAlign:'middle' } }, String(cnt)) : null;
            })()
          );
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
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' } },
React.createElement('input', {
  value: courseFilterSearch,
  onChange: function(e){ setCourseFilterSearch(e.target.value); },
  placeholder: '강좌명·선생님 검색',
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
}),
React.createElement('select', {
  value: courseFilterSubject,
  onChange: function(e){ setCourseFilterSubject(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '과목 전체'),
  SUBJECTS.map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
),
React.createElement('select', {
  value: courseFilterLevel,
  onChange: function(e){ setCourseFilterLevel(e.target.value); setCourseFilterGrade('전체'); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '학교급 전체'),
  COURSE_LEVELS.map(function(l){ return React.createElement('option', { key:l, value:l }, l); })
),
React.createElement('select', {
  value: courseFilterGrade,
  onChange: function(e){ setCourseFilterGrade(e.target.value); },
  disabled: courseFilterLevel==='전체',
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background: courseFilterLevel==='전체'?'#f5f5f5':'#fff', outline:'none', cursor: courseFilterLevel==='전체'?'not-allowed':'pointer' }
},
  React.createElement('option', { value:'전체' }, '학년 전체'),
  (courseFilterLevel!=='전체' ? (SCHOOL_LEVELS[courseFilterLevel]||{grades:[]}).grades : []).map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
),
React.createElement('select', {
  value: courseFilterTeacher,
  onChange: function(e){ setCourseFilterTeacher(e.target.value); },
  style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
  React.createElement('option', { value:'전체' }, '선생님 전체'),
  (dbTeacherProfiles || []).map(function(t){ return React.createElement('option', { key:t.id, value:String(t.id) }, t.name || t.email || '선생님'); })
),
(courseFilterSubject!=='전체' || courseFilterLevel!=='전체' || courseFilterGrade!=='전체' || courseFilterTeacher!=='전체' || courseFilterSearch.trim()) && React.createElement('button', {
  onClick: function(){ setCourseFilterSubject('전체'); setCourseFilterLevel('전체'); setCourseFilterGrade('전체'); setCourseFilterTeacher('전체'); setCourseFilterSearch(''); },
  style:{ background:'transparent', color:'rgba(0,0,0,0.55)', border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '초기화')
),
(function(){
var q = courseFilterSearch.trim().toLowerCase();
// class_id로 연결된 강좌는 grade/level/teacher_id를 클래스에서 fallback으로 가져옴
var classMap = {};
(teacherClasses || []).forEach(function(cls){ classMap[String(cls.id)] = cls; });
function effectiveGrade(c){ return c.grade || (c.class_id ? (classMap[String(c.class_id)]||{}).grade : '') || ''; }
function effectiveLevel(c){ return c.level || (c.class_id ? (classMap[String(c.class_id)]||{}).level : '') || ''; }
function effectiveTeacherId(c){ return String(c.teacher_id || (c.class_id ? (classMap[String(c.class_id)]||{}).teacher_id : '') || ''); }
var filtered = state.courses.filter(function(c){
  if (courseFilterSubject !== '전체' && c.subject !== courseFilterSubject) return false;
  if (courseFilterLevel !== '전체' && effectiveLevel(c) !== courseFilterLevel) return false;
  if (courseFilterGrade !== '전체' && effectiveGrade(c) !== courseFilterGrade) return false;
  if (courseFilterTeacher !== '전체' && effectiveTeacherId(c) !== courseFilterTeacher) return false;
  if (q) {
    var hay = [c.name, c.teacher, c.subject, c.grade].filter(Boolean).join(' ').toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
});
if (filtered.length === 0) {
  return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, state.courses.length===0?'등록된 강좌가 없습니다':'필터 조건에 맞는 강좌가 없습니다');
}
return React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, filtered.length + '개 강좌'),
React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'12px' } },
filtered.map(c =>
React.createElement('div', { key:c.id, style:{ ...cardS, marginBottom:0, alignSelf:'start', gridColumn: editingCourse===c.id ? '1 / -1' : 'auto', order: editingCourse===c.id ? -1 : 0 } },
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:editingCourse===c.id?'12px':0 } },
React.createElement('div', { style:{ display:'flex', gap:'10px', alignItems:'center' } },
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#FFEBED', color:'#E60012', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif' } }, c.subject),
React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name),
React.createElement('span', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, (function(){
var className = c.class_id ? ((teacherClasses||[]).find(x=>String(x.id)===String(c.class_id))||{}).name : '';
var tid = effectiveTeacherId(c);
var prof = tid ? (dbTeacherProfiles||[]).find(x=>String(x.id)===tid) : null;
var tname = (prof && prof.name) || c.teacher || '';
var parts = [tname, c.level || effectiveLevel(c), c.grade || effectiveGrade(c), className].filter(Boolean);
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
)
);
})()
),

/* ── 수강생 관리 TAB ── */
tab==='enrollee' && (function() {
var studentSource = studentViewMode === 'withdrawn' ? dbWithdrawnStudents : dbStudents;
return React.createElement('div', null,

// 수강 신청 대기 (학생이 프로그램 페이지에서 직접 신청 → 승인 필요)
React.createElement('div', { style:{ marginBottom:'20px' } },
  React.createElement('h2', { style:{ fontSize:'15px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '수강 신청 대기' + (pendingEnrollments.length > 0 ? ' (' + pendingEnrollments.length + '건)' : '')),
  pendingEnrollments.length === 0
    ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'14px 16px', fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '현재 대기 중인 수강 신청이 없습니다.')
    : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
        pendingEnrollments.map(function(pe){
          var stu = (dbMembers || []).find(function(m){ return m.id === pe.student_id; }) || (dbStudents || []).find(function(s){ return s.id === pe.student_id; }) || (dbWithdrawnStudents || []).find(function(s){ return s.id === pe.student_id; });
          var crs = (state.courses || []).find(function(c){ return String(c.id) === String(pe.course_id); });
          return React.createElement('div', { key:pe.id, style:{ background:'#fff', border:'1px solid #f0d97a', borderLeft:'4px solid #E60012', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' } },
            React.createElement('div', { style:{ flex:1, minWidth:'180px' } },
              React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif' } }, (stu && stu.name) || '(학생 정보 없음)'),
              React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, ((crs && (crs.name || crs.title)) || '(강좌 정보 없음)') + (crs && crs.subject ? ' · ' + crs.subject : '') + (pe.enrolled_at ? ' · ' + String(pe.enrolled_at).slice(0,10) + ' 신청' : ''))
            ),
            React.createElement('button', { onClick:function(){ approveEnrollment(pe.id); }, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 16px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '승인'),
            React.createElement('button', { onClick:function(){ rejectEnrollment(pe.id); }, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '거절')
          );
        })
      )
),

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
type:'file', accept:'.xlsx,.xls,.csv', multiple: true,
style:{ display:'none' },
onChange: async function(e) {
var files = Array.from(e.target.files || []);
e.target.value = '';
if (!files.length) return;
for (var i = 0; i < files.length; i++) {
await importStudentsExcel(files[i]);
}
}
})
),
React.createElement('span', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } },
'※ 필수: 이름만 / 학생전화 있으면 기존 학생 업데이트, 없으면 신규 · 여러 파일 한꺼번에 선택 가능(파일별로 미리보기·확인)'
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
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, B2Utils.formatPhone(st.phone) || '미입력')
),
React.createElement('span', null,
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.45)', marginRight:'6px' } }, '학부모'),
React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, B2Utils.formatPhone(st.parent_phone) || '미입력')
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
(function(){
  var scoresForStudent = (adminAnalysis || []).filter(function(s){ return String(s.student_id) === String(st.id); }).slice(0, 5);
  if (scoresForStudent.length === 0) return React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', padding:'10px 12px', background:'#f9f9f9', borderRadius:'8px', fontFamily:'Manrope, sans-serif' } }, '등록된 시험 성적 없음');
  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
    scoresForStudent.map(function(s){
      var total = Number(s.total) || 100;
      var pct = total ? Math.round((Number(s.score) / total) * 100) : Number(s.score);
      var color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#c87000' : '#c82014';
      return React.createElement('div', { key:s.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'#f9f9f9', borderRadius:'6px', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ flex:1, minWidth:0 } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, s.test_name || s.test_type || '시험'),
          React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.45)', marginTop:'1px' } }, [s.subject, s.test_date].filter(Boolean).join(' · '))
        ),
        React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:color, marginLeft:'8px', flexShrink:0 } }, s.score + (s.total ? '/' + s.total : ''))
      );
    })
  );
})()
),
React.createElement('div', null,
React.createElement('label', { style:labelS }, '출결'),
(function(){
  var today = new Date().toISOString().slice(0,10);
  var ym = today.slice(0,7);
  var thisMonth = (adminAttendance || []).filter(function(a){ return String(a.student_id) === String(st.id) && (a.date || '').slice(0,7) === ym; });
  var tally = { present:0, late:0, absent:0, excused:0 };
  thisMonth.forEach(function(a){ if (tally[a.status] != null) tally[a.status]++; });
  var todayRow = (adminAttendance || []).find(function(a){ return String(a.student_id) === String(st.id) && a.date === today; });
  var todayStatus = todayRow ? todayRow.status : null;
  var BTNS = [['present','출석','#16a34a'], ['late','지각','#c87000'], ['absent','결석','#c82014'], ['excused','사유','#6b7280']];
  return React.createElement('div', null,
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'6px', marginBottom:'8px' } },
      BTNS.map(function(b){
        var k = b[0], label = b[1], color = b[2];
        return React.createElement('div', { key:k, style:{ padding:'6px 4px', background:'#f9f9f9', borderRadius:'6px', textAlign:'center', fontFamily:'Manrope, sans-serif' } },
          React.createElement('div', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.45)', fontWeight:'700' } }, label),
          React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:color, marginTop:'2px' } }, tally[k] || 0)
        );
      })
    ),
    React.createElement('div', { style:{ fontSize:'10px', fontWeight:'700', color:'rgba(0,0,0,0.45)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '오늘 출결'),
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'6px' } },
      BTNS.map(function(b){
        var k = b[0], label = b[1], color = b[2];
        var on = todayStatus === k;
        return React.createElement('button', {
          key:k,
          onClick: function(){ toggleAttendance(st.id, k); },
          style:{ background: on ? color : '#fff', color: on ? '#fff' : color, border: '1.5px solid ' + color, borderRadius:'6px', padding:'6px 4px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' }
        }, label);
      })
    )
  );
})()
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

/* ── 클래스 관리 TAB ── */
tab==='classmgmt' && (function(){
  var allTeachers = (dbTeachers || []).filter(function(t){ return t.role === 'teacher'; });
  var teacherNameById = {};
  (dbTeacherProfiles || []).forEach(function(p){ teacherNameById[String(p.id)] = p.name; });
  function clsTeacherName(cls){ return teacherNameById[String(cls.teacher_id)] || '(담당 미지정)'; }
  var teacherFilterOptions = ['전체'].concat(allTeachers.map(function(t){ return t.name; }));
  var allClasses = (teacherClasses || []).slice().sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||'')); });
  var shownClasses = clsMgmtTeacherFilter === '전체' ? allClasses : allClasses.filter(function(c){ return clsTeacherName(c) === clsMgmtTeacherFilter; });
  var d = clsMgmtDraft;
  var dLevels = d.levels || [], dGrades = d.grades || [], dSubjects = d.subjects || [];
  var availGrades = [];
  ['초등','중등','고등'].forEach(function(lv){ if (dLevels.indexOf(lv) >= 0) availGrades = availGrades.concat(SCHOOL_LEVELS[lv].grades); });
  function setD(patch){ setClsMgmtDraft(Object.assign({}, d, patch)); }
  var pill = function(sel, color){ return { background: sel?color:'#fff', color: sel?'#fff':'rgba(0,0,0,0.62)', border: sel?('2px solid '+color):'1.5px solid #d6dbde', borderRadius:'999px', padding:'6px 12px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }; };
  var rowLabel = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' };
  async function addCls(){
    if (!d.teacher_id) { alert('담당 선생님을 선택해 주세요.'); return; }
    if ((d.grades||[]).length === 0) { alert('학교급과 학년을 선택해 주세요.'); return; }
    var teacher = allTeachers.find(function(t){ return String(t.id) === String(d.teacher_id); });
    if (!teacher) { alert('선생님 정보를 찾을 수 없습니다.'); return; }
    await createTeacherClass(teacher, { name: d.name, grades: d.grades, subjects: d.subjects });
    setClsMgmtDraft({ teacher_id:'', name:'', levels:[], grades:[], subjects:[] });
  }
  return React.createElement('div', null,
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' } }, '클래스 관리'),
    React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'18px' } }, '학원의 모든 반을 한 곳에서 관리합니다. 반을 만들고 담당 선생님·학생을 배정하세요. 선생님 페이지의 "담당 클래스"에 반영됩니다.'),
    React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'12px', padding:'16px', marginBottom:'18px' } },
      React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '+ 새 반 추가'),
      React.createElement('div', { style:rowLabel }, '담당 선생님'),
      React.createElement('select', { value:d.teacher_id, onChange:function(e){ setD({ teacher_id: e.target.value }); }, style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', marginBottom:'10px', boxSizing:'border-box' } },
        React.createElement('option', { value:'' }, '선생님 선택'),
        allTeachers.map(function(t){ return React.createElement('option', { key:t.id, value:String(t.id) }, t.name); })
      ),
      React.createElement('input', { value:d.name, onChange:function(e){ setD({ name: e.target.value }); }, placeholder:'반 이름 (선택 — 비우면 "학년 과목"으로 자동)', style:{ width:'100%', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', marginBottom:'10px', boxSizing:'border-box' } }),
      React.createElement('div', { style:rowLabel }, '학교급 (여러 개 선택 가능)'),
      React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px' } },
        ['초등','중등','고등'].map(function(lv){
          var sel = dLevels.indexOf(lv) >= 0;
          return React.createElement('button', { key:lv, type:'button', onClick:function(){
            var nextLevels = sel ? dLevels.filter(function(x){ return x!==lv; }) : dLevels.concat(lv);
            var keepGrades = dGrades.filter(function(g){ return nextLevels.some(function(L){ return SCHOOL_LEVELS[L].grades.indexOf(g) >= 0; }); });
            setD({ levels: nextLevels, grades: keepGrades });
          }, style: pill(sel, '#1A1A1A') }, lv);
        })
      ),
      dLevels.length > 0 && React.createElement('div', { key:'grRow' },
        React.createElement('div', { style:rowLabel }, '학년 (여러 개 선택 — 고른 학년마다 반 1개씩 생성)'),
        React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px' } },
          availGrades.map(function(g){
            var sel = dGrades.indexOf(g) >= 0;
            return React.createElement('button', { key:g, type:'button', onClick:function(){ setD({ grades: sel ? dGrades.filter(function(x){ return x!==g; }) : dGrades.concat(g) }); }, style: pill(sel, '#E60012') }, g);
          })
        )
      ),
      React.createElement('div', { style:rowLabel }, '과목 (여러 개 선택 가능, 안 골라도 됨)'),
      React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' } },
        SUBJECTS.map(function(s){
          var sel = dSubjects.indexOf(s) >= 0;
          return React.createElement('button', { key:s, type:'button', onClick:function(){ setD({ subjects: sel ? dSubjects.filter(function(x){ return x!==s; }) : dSubjects.concat(s) }); }, style: pill(sel, '#E60012') }, s);
        })
      ),
      React.createElement('button', { onClick: addCls, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 반 추가' + (dGrades.length > 1 ? ' (' + dGrades.length + '개)' : ''))
    ),
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', flexWrap:'wrap' } },
      React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', fontFamily:'Manrope, sans-serif' } }, '선생님 필터:'),
      React.createElement('select', { value: clsMgmtTeacherFilter, onChange:function(e){ setClsMgmtTeacherFilter(e.target.value); setExpandedClassId(null); }, style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' } },
        teacherFilterOptions.map(function(t){ return React.createElement('option', { key:t, value:t }, t); })
      ),
      React.createElement('span', { style:{ marginLeft:'auto', fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '총 ' + shownClasses.length + '개 반')
    ),
    shownClasses.length === 0
      ? React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'32px' } }, '반이 없습니다. 위에서 새 반을 추가하세요.')
      : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'8px' } },
        shownClasses.map(function(cls){
          var clsStu = classStudents[cls.id] || [];
          var isExp = expandedClassId === cls.id;
          return React.createElement('div', { key:cls.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', alignSelf:'start', gridColumn: isExp ? '1 / -1' : 'auto', order: isExp ? -1 : 0 } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
              React.createElement('div', { style:{ flex:1, cursor:'pointer', minWidth:0 }, onClick:function(){ setExpandedClassId(isExp?null:cls.id); setClassStudentSearch(''); } },
                React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, cls.name),
                React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'2px' } }, [cls.grade, cls.subject].filter(Boolean).join(' · ') + ' · ' + clsTeacherName(cls) + ' 선생님 · ' + clsStu.length + '명')
              ),
              React.createElement('button', { onClick:function(){ deleteTeacherClass(cls.id); }, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '삭제'),
              React.createElement('span', { onClick:function(){ setExpandedClassId(isExp?null:cls.id); setClassStudentSearch(''); }, style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', cursor:'pointer', transition:'transform 0.2s', transform: isExp?'rotate(180deg)':'none', flexShrink:0 } }, '▾')
            ),
            isExp && React.createElement('div', { style:{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #f3f4f6' } },
              clsStu.length > 0 && React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' } },
                clsStu.map(function(sid){
                  var stu = (dbStudents||[]).find(function(x){ return x.id === sid; }) || (dbWithdrawnStudents||[]).find(function(x){ return x.id === sid; });
                  return React.createElement('div', { key:sid, style:{ background:'#FFEBED', borderRadius:'20px', padding:'4px 12px', display:'flex', alignItems:'center', gap:'6px' } },
                    React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#E60012', fontFamily:'Manrope, sans-serif' } }, ((stu && stu.name) || '학생') + ((stu && stu.grade) ? ' ('+stu.grade+')' : '')),
                    React.createElement('button', { onClick:function(){ removeStudentFromClass(cls.id, sid); }, style:{ background:'none', border:'none', cursor:'pointer', color:'#E60012', fontSize:'14px', lineHeight:1, fontWeight:'700' } }, '×')
                  );
                })
              ),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'6px' } }, '학생 추가'),
                React.createElement('input', { value: classStudentSearch, onChange:function(e){ setClassStudentSearch(e.target.value); }, placeholder:'학생명·학교·전화 검색', style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', width:'100%', marginBottom:'8px', boxSizing:'border-box' } }),
                (function(){
                  var q = classStudentSearch.trim().toLowerCase();
                  if (!q) return React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '검색어를 입력하면 학생이 표시됩니다');
                  var cands = (dbStudents||[]).filter(function(stu){
                    if (clsStu.includes(stu.id)) return false;
                    var hay = [stu.name, stu.school, stu.phone, stu.grade].filter(Boolean).join(' ').toLowerCase();
                    return hay.indexOf(q) >= 0;
                  }).slice(0, 10);
                  if (cands.length === 0) return React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '검색 결과가 없습니다');
                  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'4px' } },
                    cands.map(function(stu){
                      return React.createElement('button', { key:stu.id, onClick:function(){ addStudentToClass(cls.id, stu.id); }, style:{ background:'#f9f9f9', border:'1px solid #e5e7eb', borderRadius:'7px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px' } },
                        React.createElement('span', { style:{ fontWeight:'700', color:'rgba(0,0,0,0.87)' } }, stu.name),
                        React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', fontSize:'11px' } }, [stu.school, stu.grade].filter(Boolean).join(' · ')),
                        React.createElement('span', { style:{ marginLeft:'auto', color:'#E60012', fontWeight:'800' } }, '+ 추가')
                      );
                    })
                  );
                })()
              )
            )
          );
        })
      )
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
React.createElement('option', { value:'전체' }, '전체 ' + dbMembers.filter(function(m){ return m.role!=='teacher'; }).length + '명'),
React.createElement('option', { value:'수강생' }, '수강생 ' + dbMembers.filter(function(m){ return m.role==='student'&&m.isEnrollee; }).length + '명'),
React.createElement('option', { value:'일반회원' }, '일반회원 ' + dbMembers.filter(function(m){ return m.role==='student'&&!m.isEnrollee; }).length + '명'),
React.createElement('option', { value:'학부모' }, '학부모 ' + dbMembers.filter(function(m){ return m.role==='parent'; }).length + '명')
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
if (m.role === 'teacher') return false;   // 선생님은 '선생님 관리'에서만 관리 — 회원정보 목록에는 표시 안 함
if (memberFilter === '수강생'   && !(m.role==='student' && m.isEnrollee))  return false;
if (memberFilter === '일반회원' && !(m.role==='student' && !m.isEnrollee)) return false;
if (memberFilter === '학부모'   && m.role !== 'parent')  return false;

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
return React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'10px', maxWidth:'1170px' } },
filtered.map(function(m) {
var linkedParent = m.role==='student' && m.parentId ? dbMembers.find(function(x){ return x.id===m.parentId; }) : null;
var linkedChildren = m.role==='parent' ? dbMembers.filter(function(x){ return x.role==='student' && (x.parentId===m.id); }) : [];
var roleBg    = m.role==='teacher'?'#FFEBED': m.role==='parent'?'#fff3cd': m.isEnrollee?'#e8f4fd':'#f2f0eb';
var roleColor = m.role==='teacher'?'#E60012': m.role==='parent'?'#856404': m.isEnrollee?'#0066cc':'rgba(0,0,0,0.45)';
var isEnrolleeParent = m.role==='parent' && dbMembers.some(function(s){ return s.role==='student'&&s.isEnrollee&&s.parentId===m.id; });
var roleLabel = m.role==='teacher'?'선생님': m.role==='parent'?(isEnrolleeParent?'수강생 학부모':'학부모'): m.isEnrollee?'수강생':'일반회원';
var isEditing = editingMember === m.id;
var isOpen = expandedMember === m.id || isEditing;
return React.createElement('div', { key:m.id, style:{ ...cardS, padding:'12px 14px', marginBottom:0, alignSelf:'start', border: isEditing?'2px solid #E60012':'2px solid transparent', transition:'border 0.15s', gridColumn: isOpen ? '1 / -1' : 'auto', order: isOpen ? -1 : 0 } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0, cursor:'pointer' }, onClick:function(){ setExpandedMember(expandedMember===m.id?null:m.id); setEditingMember(null); } },
React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:roleBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize: m.role==='student' && m.grade ? '11px' : '13px', fontWeight:'800', color:roleColor, fontFamily:'Manrope, sans-serif', flexShrink:0 } }, m.role==='student' && m.grade ? m.grade : m.name[0]),
React.createElement('div', { style:{ minWidth:0, flex:1 } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' } },
React.createElement('span', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, m.name),
React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:roleBg, color:roleColor, borderRadius:'4px', padding:'1px 6px', fontFamily:'Manrope, sans-serif' } }, roleLabel),
linkedParent && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '학부모: ' + linkedParent.name),
linkedChildren.length > 0 && React.createElement('span', { style:{ fontSize:'10px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '자녀: ' + linkedChildren.map(function(c){ return c.name; }).join(', '))
),
m.role !== 'student' && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
[B2Utils.formatPhone(m.phone), m.school].filter(Boolean).join(' · ') || m.email || '—'
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
{ label:'전화번호', value:B2Utils.formatPhone(m.phone)||'—' },
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
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, B2Utils.formatPhone(linkedParent.phone) || linkedParent.email || '—')
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
return React.createElement('option', { key:p.id, value:p.id }, p.name + (p.phone?' ('+B2Utils.formatPhone(p.phone)+')':''));
})
)
),
m.role==='parent' && React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px' } },
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '자녀 (' + linkedChildren.length + '명)'),
linkedChildren.length === 0
? React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif' } }, '연결된 자녀가 없습니다')
: linkedChildren.map(function(child) {
return React.createElement('div', { key:child.id, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
React.createElement('div', { style:{ width:'32px', height:'32px', borderRadius:'50%', background:'#e8f4fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize: child.grade ? '11px' : '13px', fontWeight:'800', color:'#0066cc', fontFamily:'Manrope, sans-serif' } }, child.grade || child.name[0]),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, child.name)
)
);
})
)
)
);
}));
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
: React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' } },
dbTeachers.filter(t => t.role==='teacher').map(t =>
React.createElement('div', { key:t.id, style:{ background:'#fff', borderRadius:'12px', padding:'16px 18px', marginBottom:0, boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)', alignSelf:'start', gridColumn: expandedTeacher===t.id ? '1 / -1' : 'auto', order: expandedTeacher===t.id ? -1 : 0 } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: expandedTeacher===t.id ? '14px' : '0', cursor:'pointer' }, onClick:()=>setExpandedTeacher(expandedTeacher===t.id ? null : t.id) },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'6px', flex:1, flexWrap:'wrap', minWidth:0 } },
React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
(t.subjects || []).map(function(sub){ return React.createElement('span', { key:sub, style:{ background:'#FFEBED', color:'#E60012', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub); })
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
          if (!draft.level) { alert('학교급을 선택해 주세요.'); return; }
          if ((draft.grades || []).length === 0) { alert('학년을 1개 이상 선택해 주세요.'); return; }
          var prefix = sub + '-' + draft.level + ' ';
          var newTags = (draft.grades || []).map(function(g) { return prefix + g; });
          // 같은 과목 + 같은 학교급 태그만 교체. 같은 과목의 다른 학교급(예: 영어-중등 ~)은 그대로 둠.
          var existing = getTeacherGradeAssignments(t).filter(function(a) { return String(a).indexOf(prefix) !== 0; });
          var merged = existing.concat(newTags);
          var gradeStr = Array.from(new Set(merged.filter(Boolean))).join(',');
          await sb.from('students').update({ grade: gradeStr, school: '' }).eq('id', t.id);
          setDbTeachers(function(ts) { return ts.map(function(x) { return x.id===t.id ? Object.assign({},x,{grade:gradeStr,school:''}) : x; }); });
          updateTeacherAssignDraft(draftKey, { grades:[] });
          if (typeof showSaved === 'function') showSaved();
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
  React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '실제 운영 중인 반을 추가하고 학생을 배정합니다. 학교급·학년·과목은 여러 개 선택할 수 있고, 고른 학년마다 반이 1개씩 만들어집니다. 추가하면 위의 담당 과목·학년 배정에도 자동 반영됩니다.'),
  (function(){
    var draft = classManageDrafts[t.id] || { name:'', levels:[], grades:[], subjects:[] };
    var dLevels = draft.levels || [];
    var dGrades = draft.grades || [];
    var dSubjects = draft.subjects || [];
    function setDraft(patch){ setClassManageDrafts(function(prev){ var next = Object.assign({}, prev); next[t.id] = Object.assign({}, draft, patch); return next; }); }
    var availGrades = [];
    ['초등','중등','고등'].forEach(function(lv){ if (dLevels.indexOf(lv) >= 0) availGrades = availGrades.concat(SCHOOL_LEVELS[lv].grades); });
    var pillBtn = function(sel, color){ return { background: sel?color:'#fff', color: sel?'#fff':'rgba(0,0,0,0.62)', border: sel?('2px solid '+color):'1.5px solid #d6dbde', borderRadius:'999px', padding:'6px 12px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }; };
    var rowLabel = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', marginBottom:'4px' };
    return React.createElement('div', { style:{ background:'#f9f9f9', borderRadius:'10px', padding:'14px', marginBottom:'12px' } },
      React.createElement('input', {
        value: draft.name || '',
        onChange: function(e){ var v = e.target.value; setDraft({ name: v }); },
        placeholder: '반 이름 (선택 — 비우면 "학년 과목"으로 자동 생성)',
        style:{ width:'100%', boxSizing:'border-box', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', marginBottom:'12px' }
      }),
      React.createElement('div', { style:rowLabel }, '학교급 (여러 개 선택 가능)'),
      React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' } },
        ['초등','중등','고등'].map(function(lv){
          var sel = dLevels.indexOf(lv) >= 0;
          return React.createElement('button', { key:lv, type:'button',
            onClick: function(){
              var nextLevels = sel ? dLevels.filter(function(x){ return x!==lv; }) : dLevels.concat(lv);
              var keepGrades = dGrades.filter(function(g){ return nextLevels.some(function(L){ return SCHOOL_LEVELS[L].grades.indexOf(g) >= 0; }); });
              setDraft({ levels: nextLevels, grades: keepGrades });
            },
            style: pillBtn(sel, '#1A1A1A')
          }, lv);
        })
      ),
      dLevels.length > 0 && React.createElement('div', { key:'gradeRow' },
        React.createElement('div', { style:rowLabel }, '학년 (여러 개 선택 — 고른 학년마다 반 1개씩 생성됩니다)'),
        React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' } },
          availGrades.map(function(g){
            var sel = dGrades.indexOf(g) >= 0;
            return React.createElement('button', { key:g, type:'button',
              onClick: function(){ setDraft({ grades: sel ? dGrades.filter(function(x){ return x!==g; }) : dGrades.concat(g) }); },
              style: pillBtn(sel, '#E60012')
            }, g);
          })
        )
      ),
      React.createElement('div', { style:rowLabel }, '과목 (여러 개 선택 가능, 안 골라도 됩니다)'),
      React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'14px' } },
        SUBJECTS.map(function(s){
          var sel = dSubjects.indexOf(s) >= 0;
          return React.createElement('button', { key:s, type:'button',
            onClick: function(){ setDraft({ subjects: sel ? dSubjects.filter(function(x){ return x!==s; }) : dSubjects.concat(s) }); },
            style: pillBtn(sel, '#E60012')
          }, s);
        })
      ),
      React.createElement('button', {
        onClick: function(){ createTeacherClass(t, draft); },
        style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, '+ 반 추가' + (dGrades.length > 1 ? ' (' + dGrades.length + '개)' : ''))
    );
  })(),
  (function(){
    var realClasses = getRealClassesForTeacher(t);
    if (realClasses.length === 0) {
      return React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', textAlign:'center', padding:'12px' } }, '아직 배정된 반이 없습니다');
    }
    return React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'8px' } },
    realClasses.map(function(cls){
      var clsStudents = classStudents[cls.id] || [];
      var isExpanded = expandedClassId === cls.id;
      return React.createElement('div', { key:cls.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'12px', marginBottom:0, alignSelf:'start', gridColumn: isExpanded ? '1 / -1' : 'auto', order: isExpanded ? -1 : 0 } },
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
                    React.createElement('span', { style:{ color:'rgba(0,0,0,0.45)', fontSize:'11px' } }, [stu.school, stu.grade, B2Utils.formatPhone(stu.phone)].filter(Boolean).join(' · ')),
                    React.createElement('span', { style:{ marginLeft:'auto', color:'#E60012', fontWeight:'800' } }, '+ 추가')
                  );
                })
              );
            })()
          )
        )
      );
    }));
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
)
),

/* ── 선생님 기록 TAB ── */
tab==='records' && React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '업무일지 및 특이사항'),
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
React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '반별 또는 학생별로 시험 성적을 확인합니다.'),

// 최상위 모드 토글 — 반별 / 학생별
React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'14px' } },
  ['class','student'].map(function(m){
    var active = analysisMode === m;
    var label = m === 'class' ? '반별 분석' : '학생별 분석';
    return React.createElement('button', {
      key: m,
      onClick: function(){ setAnalysisMode(m); setExpandedAnalysisStudentId(''); },
      style:{ flex:1, background: active ? '#E60012' : '#fff', color: active ? '#fff' : '#374151', border:'1px solid '+(active?'#E60012':'#d6dbde'), borderRadius:'10px', padding:'12px 16px', fontSize:'14px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.15s' }
    }, label);
  })
),

// 모드별 필터 영역
analysisMode === 'class'
  ? React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' } },
      React.createElement('select', {
        value: analysisClassId,
        onChange: function(e){ setAnalysisClassId(e.target.value); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'700', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer', color: analysisClassId ? '#1A1A1A' : '#E60012' }
      },
        React.createElement('option', { value:'' }, '반 선택'),
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
        placeholder: '반 안에서 학생 검색',
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
      })
    )
  : React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' } },
      // 학생별 모드: 학년 + 반 + 과목 + 검색
      React.createElement('select', {
        value: analysisStudentGrade,
        onChange: function(e){ setAnalysisStudentGrade(e.target.value); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', { value:'전체' }, '학년 전체'),
        ['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
      ),
      React.createElement('select', {
        value: analysisClassId,
        onChange: function(e){ setAnalysisClassId(e.target.value); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', { value:'' }, '반 전체'),
        (teacherClasses || []).filter(function(c){ return c.grade; }).map(function(c){ return React.createElement('option', { key:c.id, value:String(c.id) }, c.name); })
      ),
      React.createElement('select', {
        value: analysisSubject,
        onChange: function(e){ setAnalysisSubject(e.target.value); },
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
      },
        React.createElement('option', { value:'전체' }, '과목 전체'),
        SUBJECTS.map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
      ),
      React.createElement('input', {
        value: analysisSearch,
        onChange: function(e){ setAnalysisSearch(e.target.value); },
        placeholder: '학생 이름 검색',
        style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
      })
    ),

(function(){
  // 반별 모드인데 반을 선택하지 않은 경우 — 안내
  if (analysisMode === 'class' && !analysisClassId) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.5)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'48px 20px' } },
      React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '🎯'),
      React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'#374151', marginBottom:'6px' } }, '분석할 반을 선택해 주세요'),
      React.createElement('div', { style:{ fontSize:'13px', color:'#9ca3af' } }, '위에서 반을 선택하면 그 반의 통계와 학생별 성적을 확인할 수 있습니다.')
    );
  }
  var q = analysisSearch.trim().toLowerCase();
  var scoresFiltered = (adminAnalysis || []).filter(function(s){
    if (analysisTeacherId !== '전체' && String(s.teacher_id) !== String(analysisTeacherId)) return false;
    if (analysisSubject !== '전체' && s.subject !== analysisSubject) return false;
    if (analysisTestName !== '전체' && s.test_name !== analysisTestName) return false;
    return true;
  });
  // targetIds — 모드별 분기
  var targetIds;
  if (analysisMode === 'class') {
    // 반별: 그 반에 등록된 학생만
    targetIds = (classStudents[analysisClassId] || []).map(String);
  } else {
    // 학생별: 학년·반 필터를 적용한 모든 학생
    var pool = dbStudents || [];
    if (analysisStudentGrade !== '전체') {
      pool = pool.filter(function(st){ return st.grade === analysisStudentGrade; });
    }
    if (analysisClassId) {
      var classMemberSet = {};
      (classStudents[analysisClassId] || []).forEach(function(id){ classMemberSet[String(id)] = true; });
      pool = pool.filter(function(st){ return classMemberSet[String(st.id)]; });
    }
    targetIds = pool.map(function(st){ return String(st.id); });
  }
  // 표준 시험 판정 (반별 모드만) — 그 반 학생의 30%+ 가 응시한 (test_name|test_date|subject) 조합
  // 30% 미만 응시면 "추가 응시" 시험으로 분류한다.
  var classMemberSet2 = {};
  if (analysisMode === 'class') {
    (classStudents[analysisClassId] || []).forEach(function(id){ classMemberSet2[String(id)] = true; });
  }
  var classSize = analysisMode === 'class' ? Object.keys(classMemberSet2).length : 0;
  var standardTestKeys = {};
  var extraTestKeys = {}; // 추가 응시 시험 → { key: [studentName, ...] }
  if (analysisMode === 'class' && classSize > 0) {
    var keyTakers = {}; // key → Set of student IDs (반 멤버만 카운트)
    (adminAnalysis || []).forEach(function(s){
      if (!classMemberSet2[String(s.student_id)]) return;
      var k = (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'');
      if (!keyTakers[k]) keyTakers[k] = {};
      keyTakers[k][String(s.student_id)] = true;
    });
    Object.keys(keyTakers).forEach(function(k){
      var n = Object.keys(keyTakers[k]).length;
      if (n / classSize >= 0.3) {
        standardTestKeys[k] = true;
      } else {
        extraTestKeys[k] = Object.keys(keyTakers[k]);
      }
    });
  }
  // 반별 모드의 차트 범위 토글: 'standard' 면 차트용 점수에서 추가 응시를 제외
  var scoresForChart = scoresFiltered;
  if (analysisMode === 'class' && analysisChartScope === 'standard') {
    scoresForChart = scoresFiltered.filter(function(s){
      var k = (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'');
      return standardTestKeys[k];
    });
  }
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
    // 반별 모드일 때만 추가 응시 횟수 계산
    var extraCount = 0;
    if (analysisMode === 'class' && classSize > 0) {
      myScores.forEach(function(s){
        var k = (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'');
        if (extraTestKeys[k]) extraCount++;
      });
    }
    return { id:sid, name:name, grade:grade, scores: myScores, avg: myAvg, last: last, prev: prev, parent_phone: (stu && (stu.parent_phone||stu.phone))||null, extraCount: extraCount };
  }).filter(Boolean);

  if (rows.length === 0) {
    return React.createElement('div', { style:{ ...cardS, textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px', padding:'40px' } }, '표시할 학생이 없습니다');
  }

  // 시험 회차 계산 — 차트용은 scoresForChart 사용 (반별 모드 + chartScope='standard'면 추가 응시 제외됨)
  var testKeys = Array.from(new Set(scoresForChart.filter(function(s){ return targetIds.indexOf(String(s.student_id)) >= 0; }).map(function(s){ return (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||''); }))).filter(Boolean).sort();
  var lastKey = testKeys[testKeys.length-1] || null;
  var prevKey = testKeys[testKeys.length-2] || null;
  function avgForKey(key){ if(!key) return null; var arr = scoresForChart.filter(function(s){ return ((s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'')) === key && targetIds.indexOf(String(s.student_id))>=0; }).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);}); return arr.length ? arr.reduce(function(a,b){return a+b;},0)/arr.length : null; }
  var lastAvg = avgForKey(lastKey);
  var prevAvg = avgForKey(prevKey);
  var avgChange = (lastAvg != null && prevAvg != null) ? lastAvg - prevAvg : null;
  var lastVals = lastKey ? scoresForChart.filter(function(s){ return ((s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'')) === lastKey && targetIds.indexOf(String(s.student_id))>=0; }).map(function(s){ return Number(s.score); }).filter(function(v){return !isNaN(v);}) : [];
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
  // 학생별 아코디언 — 헤더 한 줄(이름·평균·이번 점수·전회 대비 ▲▼)만 기본 표시,
  // 탭하면 시험 이력 + AI 코멘트 펼침. 한 번에 하나만 열림(setExpandedAnalysisStudentId 단일값).
  function studentRows() {
    return rows.map(function(r){
      var isOpen = String(expandedAnalysisStudentId) === String(r.id);
      var lastScore = r.last ? Number(r.last.score) : null;
      var prevScore = r.prev ? Number(r.prev.score) : null;
      var diff = (lastScore != null && prevScore != null && !isNaN(lastScore) && !isNaN(prevScore)) ? (lastScore - prevScore) : null;
      var trendVals = r.scores.map(function(s){return Number(s.score);}).filter(function(v){return !isNaN(v);});
      var aiComment = B2Utils.generateComment({
        studentName: r.name, score: lastScore, prevScore: prevScore, classAvg: lastAvg, recentTrend: trendVals,
        subject: r.last ? r.last.subject : '', testName: r.last ? r.last.test_name : ''
      });
      return React.createElement('div', { key:r.id, style:{ marginBottom:'8px', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden', background:'#fff' } },
        // 헤더 — 항상 보이는 한 줄 요약. 탭하면 펼침.
        React.createElement('div', {
          onClick: function(){ setExpandedAnalysisStudentId(isOpen ? '' : r.id); },
          style:{ background: isOpen ? '#1A1A1A' : '#fff', color: isOpen ? '#fff' : '#1A1A1A', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', userSelect:'none', transition:'background 0.15s' }
        },
          React.createElement('span', { style:{ fontSize:'12px', color: isOpen ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', width:'10px', flexShrink:0 } }, isOpen ? '▼' : '▶'),
          React.createElement('span', { style:{ fontWeight:'800', fontSize:'14px', fontFamily:'Manrope, sans-serif', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
            r.name,
            r.grade && React.createElement('span', { style:{ color: isOpen ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)', fontSize:'12px', marginLeft:'6px', fontWeight:'500' } }, r.grade)
          ),
          // 추가 응시 배지 (반별 모드만, extraCount > 0)
          r.extraCount > 0 && React.createElement('span', { title:'반 표준 외 시험 응시 횟수', style:{ fontSize:'11px', fontWeight:'800', fontFamily:'Manrope, sans-serif', color:'#7a5c0e', background: isOpen ? 'rgba(248,181,0,0.85)' : '#fef9ec', border: isOpen ? 'none' : '1px solid #f0e1ad', padding:'2px 6px', borderRadius:'4px', flexShrink:0 } }, '+'+r.extraCount+'회'),
          // 이번 시험 점수 + 전회 대비
          lastScore != null
            ? React.createElement('span', { style:{ fontSize:'13px', fontWeight:'800', fontFamily:'Manrope, sans-serif', color: isOpen ? '#fff' : adminColorForScore(lastScore), flexShrink:0 } }, lastScore+'점')
            : React.createElement('span', { style:{ fontSize:'12px', color: isOpen ? 'rgba(255,255,255,0.5)' : '#9ca3af', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '미응시'),
          diff != null && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif', color: diff >= 0 ? '#E60012' : '#c82014', background: isOpen ? 'rgba(255,255,255,0.15)' : (diff >= 0 ? '#fef2f2' : '#fef2f2'), padding:'2px 6px', borderRadius:'4px', flexShrink:0 } }, (diff >= 0 ? '▲' : '▼') + Math.abs(diff).toFixed(1)),
          React.createElement('span', { style:{ fontSize:'11px', color: isOpen ? 'rgba(255,255,255,0.7)' : '#6b7280', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, '평균 ' + (r.avg != null ? r.avg.toFixed(1) : '-'))
        ),
        // 본문 — 펼친 경우에만 렌더
        isOpen && React.createElement('div', { style:{ padding:'12px 14px', borderTop:'1px solid #e5e7eb' } },
          // 액션 버튼 — 헤더에서 본문으로 이동(헤더 탭과 충돌 방지)
          React.createElement('div', { style:{ display:'flex', gap:'6px', marginBottom:'12px' } },
            React.createElement('button', { onClick:function(e){ e.stopPropagation(); setReportStudentId(r.id); }, style:{ background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '학부모 리포트'),
            React.createElement('button', { onClick:function(e){ e.stopPropagation(); setKakaoTarget({ mode:'single', students:[{ id:r.id, name:r.name, last:r.last, prev:r.prev, parent_phone:r.parent_phone }] }); }, style:{ background:'#F8B500', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '알림톡')
          ),
          r.scores.length === 0 ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'13px', fontStyle:'italic', fontFamily:'Manrope, sans-serif' } }, '아직 등록된 성적이 없습니다 (미응시)')
            : [
              r.scores.slice().sort(function(a,b){ return (b.test_date||'').localeCompare(a.test_date||''); }).map(function(s, si){
                var pct = Math.max(0, Math.min(100, Math.round(Number(s.score) || 0)));
                var sk = (s.test_date||'')+'|'+(s.test_name||'')+'|'+(s.subject||'');
                var isExtra = analysisMode === 'class' && extraTestKeys[sk];
                return React.createElement('div', { key:si, style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' } },
                  React.createElement('div', { style:{ width:'140px', flexShrink:0 } },
                    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'600', color:'#374151', fontFamily:'Manrope, sans-serif', display:'flex', alignItems:'center', gap:'4px' } },
                      s.test_name || '(무제)',
                      isExtra && React.createElement('span', { style:{ fontSize:'9px', fontWeight:'800', color:'#7a5c0e', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'3px', padding:'1px 4px' } }, '추가')
                    ),
                    React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, [s.subject, s.test_date].filter(Boolean).join(' · '))
                  ),
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
  // 서브탭 바 — '개관' / '학생별' 토글
  function subTabBar() {
    var btn = function(key, label){
      var active = analysisSubTab === key;
      return React.createElement('button', {
        onClick: function(){ setAnalysisSubTab(key); },
        style:{ flex:1, background: active ? '#1A1A1A' : '#fff', color: active ? '#fff' : '#374151', border:'1px solid '+(active?'#1A1A1A':'#d6dbde'), borderRadius:'8px', padding:'10px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'background 0.15s' }
      }, label);
    };
    return React.createElement('div', { style:{ display:'flex', gap:'8px', marginBottom:'14px' } },
      btn('overview', '개관'),
      btn('students', '학생별 (' + rows.length + '명)')
    );
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
  // 차트 범위 토글 — 반별 모드 개관 상단
  function chartScopeToggle() {
    var btn = function(key, label){
      var active = analysisChartScope === key;
      return React.createElement('button', {
        onClick: function(){ setAnalysisChartScope(key); },
        style:{ background: active ? '#1A1A1A' : '#fff', color: active ? '#fff' : '#6b7280', border:'1px solid '+(active?'#1A1A1A':'#d6dbde'), borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
      }, label);
    };
    return React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', padding:'8px 10px', background:'#f9fafb', borderRadius:'8px' } },
      React.createElement('span', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif', fontWeight:'700' } }, '차트 범위:'),
      btn('all', '전체 시험'),
      btn('standard', '표준 시험만')
    );
  }
  // 추가 응시 시험 알림 — 반별 모드 개관 상단
  function extraTestsBanner() {
    var keys = Object.keys(extraTestKeys);
    if (keys.length === 0) return null;
    // 가장 최근 5개만 표시
    var sorted = keys.slice().sort().reverse().slice(0, 5);
    return React.createElement('div', { style:{ marginBottom:'14px', padding:'12px 14px', background:'#fef9ec', border:'1px solid #f0e1ad', borderRadius:'10px' } },
      React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#7a5c0e', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '⚠ 추가 응시 시험 ' + keys.length + '건'),
      React.createElement('div', { style:{ fontSize:'11px', color:'#6b5511', marginBottom:'8px', fontFamily:'Manrope, sans-serif', lineHeight:'1.5' } }, '반 학생 30% 미만이 응시한 시험입니다 (특강·다른 학년 시험 등). 반 통계엔 영향이 적지만 학생별 종합엔 포함됩니다.'),
      sorted.map(function(k){
        var parts = k.split('|');
        var date = parts[0], tname = parts[1], subj = parts[2];
        var takerIds = extraTestKeys[k] || [];
        var takerNames = takerIds.map(function(id){ var stu = dbStudents.find(function(x){return String(x.id)===String(id);}); return stu && stu.name; }).filter(Boolean).slice(0, 5);
        return React.createElement('div', { key:k, style:{ fontSize:'11px', color:'#374151', fontFamily:'Manrope, sans-serif', marginBottom:'2px' } },
          React.createElement('span', { style:{ fontWeight:'700' } }, (tname||'(무제)')),
          React.createElement('span', { style:{ color:'#9ca3af', marginLeft:'4px' } }, '· ' + (subj||'-') + ' · ' + (date||'-')),
          React.createElement('span', { style:{ marginLeft:'6px', color:'#7a5c0e', fontWeight:'700' } }, takerIds.length+'명'),
          takerNames.length > 0 && React.createElement('span', { style:{ marginLeft:'6px', color:'#6b7280' } }, '(' + takerNames.join(', ') + (takerIds.length > takerNames.length ? ' 외' : '') + ')')
        );
      }),
      keys.length > 5 && React.createElement('div', { style:{ fontSize:'10px', color:'#9ca3af', marginTop:'4px', fontFamily:'Manrope, sans-serif' } }, '… 외 ' + (keys.length - 5) + '건')
    );
  }

  // 모드별 렌더링 분기
  if (analysisMode === 'student') {
    // 학생별 분석: 학생 아코디언 + 일괄 발송 버튼만
    return React.createElement('div', null,
      React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '검색된 학생 ' + rows.length + '명 — 카드를 탭하면 시험 이력이 펼쳐집니다.'),
      bulkButton(),
      studentRows()
    );
  }
  // 반별 분석
  return React.createElement('div', null,
    subTabBar(),
    analysisSubTab === 'overview'
      ? React.createElement('div', null,
          extraTestsBanner(),
          chartScopeToggle(),
          summaryCards(), gradeBucketsRow(), distChart(), studentBars(), trendLine(), cumulativeBlock(), focusBlock(), paperPlaceholder()
        )
      : React.createElement('div', null,
          bulkButton(), studentRows()
        )
  );
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
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'10px', maxWidth:'1170px' } },
    filtered.map(function(st) {
      var isOpen = viewsExpandedId === st.id;
      var data = (viewsDataMap[st.id] || []).filter(function(v) {
        if (viewsCourse !== '전체' && String(v.course_id) !== String(viewsCourse)) return false;
        return true;
      });
      // 수강 과목 — enrolledCourses → courses.subject 매핑하여 유니크 추출
      var enrolledIds = (st.enrolledCourses || []).map(String);
      var subjSet = {};
      enrolledIds.forEach(function(cid){
        var c = (state.courses || []).find(function(x){ return String(x.id) === cid; });
        if (c && c.subject) subjSet[c.subject] = true;
      });
      var subjectList = Object.keys(subjSet);

      return React.createElement('div', { key:st.id, style:{ ...cardS, marginBottom:0, alignSelf:'start', border: isOpen?'2px solid #1A1A1A':'2px solid transparent', transition:'border 0.15s', gridColumn: isOpen ? '1 / -1' : 'auto', order: isOpen ? -1 : 0 } },
        React.createElement('div', {
          style:{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
          onClick: function(){
            if (isOpen) { setViewsExpandedId(null); }
            else { setViewsExpandedId(st.id); loadStudentViews(st.id); }
          }
        },
          React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#FFEBED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'800', color:'#E60012', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.grade || st.name[0]),
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ display:'flex', alignItems:'baseline', gap:'6px', minWidth:0 } },
              React.createElement('span', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name),
              subjectList.length > 0 && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'600', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 } }, subjectList.join('·'))
            )
          ),
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
  )
  );
})()
),

/* ── 자료실 TAB (원본 자료 / 분석본 도서관) ── */
tab==='files' && React.createElement('div', null,
  React.createElement('div', { style:Object.assign({}, cardS, { marginBottom:'24px' }) },
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px', marginBottom:'4px' } },
      React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', margin:0, fontFamily:'Manrope, sans-serif' } }, '자료실 — 원본 자료 / 분석본'),
      React.createElement('button', { onClick:openMaterialForm, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 원본 자료 업로드')
    ),
    React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', marginTop:0, marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '시험지·문제집(원본 자료)을 올리고 "분석" 버튼을 누르면 Claude가 문항별 정답·단원을 분석해 "분석본"으로 저장합니다. 시험·숙제는 [시험]·[숙제] 탭에서 여기 자료를 불러와 만듭니다. (모든 선생님·관리자가 함께 쓰는 도서관)'),
    React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px', alignItems:'center' } },
      [{ v:'all', l:'원본' }, { v:'analyzed', l:'분석본' }].map(function(o){
        return React.createElement('button', { key:o.v, onClick:function(){ setMaterialFilters(Object.assign({}, materialFilters, { view:o.v })); }, style:{ fontSize:'12px', fontWeight:'700', borderRadius:'8px', padding:'7px 14px', cursor:'pointer', fontFamily:'Manrope, sans-serif', border:'1px solid ' + (materialFilters.view===o.v ? '#0f766e' : '#d6dbde'), background: materialFilters.view===o.v ? '#0f766e' : '#fff', color: materialFilters.view===o.v ? '#fff' : '#374151' } }, o.l);
      }),
      React.createElement('select', { value:materialFilters.subject, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { subject:e.target.value })); }, style:Object.assign({}, inputS, { width:'95px' }) },
        React.createElement('option', { value:'' }, '과목'),
        ['국어','영어','수학','과학','사회','한국사','기타'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
      ),
      React.createElement('select', { value:materialFilters.level, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { level:e.target.value, grade:'' })); }, style:Object.assign({}, inputS, { width:'85px' }) },
        React.createElement('option', { value:'' }, '초중고'),
        ['초등','중등','고등'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
      ),
      React.createElement('select', { value:materialFilters.grade, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { grade:e.target.value })); }, style:Object.assign({}, inputS, { width:'90px' }) },
        React.createElement('option', { value:'' }, '학년'),
        gradeOptsForLevel(materialFilters.level).map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
      ),
      React.createElement('input', { value:materialFilters.search, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { search:e.target.value })); }, placeholder:'제목·설명 검색', style:Object.assign({}, inputS, { flex:1, minWidth:'130px' }) })
    ),
    materialLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'13px' } }, '불러오는 중...') : (function(){
      var list = (materials || []).filter(function(m){
        if (materialFilters.subject && m.subject !== materialFilters.subject) return false;
        if (materialFilters.level && m.school_level !== materialFilters.level) return false;
        if (materialFilters.grade && m.target_grade !== materialFilters.grade) return false;
        if (materialFilters.view === 'analyzed' && !m.analysis) return false;
        if (materialFilters.search) { var q = materialFilters.search.toLowerCase(); if (((m.title||'')+' '+(m.description||'')).toLowerCase().indexOf(q) < 0) return false; }
        return true;
      });
      if (list.length === 0) return React.createElement('div', { style:{ padding:'20px', textAlign:'center', color:'#9ca3af', fontSize:'13px', fontFamily:'Manrope, sans-serif' } }, (materials||[]).length === 0 ? '아직 등록된 분석 자료가 없습니다. "+ 새 자료 분석"으로 시험지를 올려보세요.' : '검색 결과가 없습니다.');
      var btnS = { fontSize:'11px', fontWeight:'700', borderRadius:'6px', padding:'3px 8px', cursor:'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap', border:'1px solid' };
      return React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '총 ' + list.length + '개'),
        React.createElement('div', { style:{ borderTop:'1px solid #eef2f7' } },
          list.map(function(m){
            var qc = m.question_count || 0; var tqc = m.text_question_count || 0;
            var imgs = Array.isArray(m.image_paths) ? m.image_paths : []; var ans = Array.isArray(m.answer_paths) ? m.answer_paths : [];
            var open = materialAnalysisOpenId === m.id; var busy = analyzingMaterialId === m.id;
            return React.createElement('div', { key:m.id, style:{ borderBottom:'1px solid #eef2f7', padding:'8px 2px', fontFamily:'Manrope, sans-serif' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
                React.createElement('span', { style: window.B2Utils.materialTypeBadgeStyle(m.material_type) }, window.B2Utils.materialTypeLabel(m.material_type)),
                m.analysis ? React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#dcfce7', color:'#15803d', borderRadius:'4px', padding:'1px 6px' } }, '분석완료') : React.createElement('span', { style:{ fontSize:'10px', fontWeight:'800', background:'#fef3c7', color:'#92400e', borderRadius:'4px', padding:'1px 6px' } }, '분석전'),
                m.subject && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151' } }, m.subject),
                (m.school_level || m.target_grade) && React.createElement('span', { style:{ fontSize:'11px', color:'#9ca3af' } }, [m.school_level, m.target_grade].filter(Boolean).join(' ')),
                React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'#111827', flex:1, minWidth:'110px' } }, m.title),
                React.createElement('span', { style:{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' } }, (m.analysis ? ('객' + qc + (tqc>0 ? (' 서' + tqc) : '')) : ('시험지 ' + imgs.length)) + (m.teacher_name ? (' · ' + m.teacher_name) : '') + (m.created_at ? (' · ' + String(m.created_at).slice(5,10)) : '')),
                React.createElement('span', { style:{ display:'flex', gap:'4px', flexShrink:0 } },
                  React.createElement('button', { onClick:function(){ setMaterialAnalysisOpenId(open ? null : m.id); }, style:Object.assign({}, btnS, { color:'#1d4ed8', borderColor:'#bfdbfe', background: open ? '#eff6ff' : '#fff' }) }, open ? '접기' : '자세히'),
                  React.createElement('button', { onClick:function(){ openMaterialFormForEdit(m); }, style:Object.assign({}, btnS, { color:'#E60012', borderColor:'#E60012', background:'#fff' }) }, '수정'),
                  React.createElement('button', { onClick:function(){ reanalyzeMaterial(m); }, disabled:busy, style:Object.assign({}, btnS, { color:'#fff', borderColor: busy ? '#9ca3af' : '#0f766e', background: busy ? '#9ca3af' : '#0f766e', cursor: busy ? 'wait' : 'pointer' }) }, busy ? '분석중' : (m.analysis ? '재분석' : '분석')),
                  React.createElement('button', { onClick:function(){ deleteMaterial(m); }, style:Object.assign({}, btnS, { color:'#c82014', borderColor:'#f3c5c0', background:'#fff' }) }, '삭제')
                )
              ),
              m.description && React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'2px', whiteSpace:'pre-line' } }, m.description),
              open && React.createElement('div', { style:{ marginTop:'6px' } },
                React.createElement('div', { style:{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 10px', marginBottom:'8px' } },
                  React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#1e40af', marginBottom:'4px' } }, '원본 파일 (눌러서 열기)'),
                  React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'2px' } }, '시험지 ' + imgs.length + '개' + (imgs.length===0?' (없음)':'')),
                  renderFileList(imgs, '시험지', ''),
                  ans.length > 0 && React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151', marginTop:'8px', marginBottom:'2px' } }, '답안지·해설 ' + ans.length + '개'),
                  ans.length > 0 && renderFileList(ans, '답안지·해설', '')
                ),
                m.analysis ? renderExamAnalysis(m.analysis) : React.createElement('div', { style:{ fontSize:'11px', color:'#92400e', background:'#fef3c7', borderRadius:'8px', padding:'8px 10px', fontFamily:'Manrope, sans-serif' } }, '아직 Claude 문항 분석이 안 됐어요. 오른쪽 "분석" 버튼을 누르면 분석합니다.')
              )
            );
          })
        )
      );
    })()
  ),
  /* 자료 분석 폼 모달 */
  materialFormOpen && React.createElement('div', { onClick:closeMaterialForm, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' } },
        React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'800', color:'#111827', margin:0 } }, materialEditId ? '원본 자료 수정' : '원본 자료 업로드'),
        React.createElement('button', { onClick:closeMaterialForm, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' } }, '×')
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '자료 제목 *'),
      React.createElement('input', { value:materialDraft.title, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { title:e.target.value })); }, placeholder:'예: 2024 9월 고2 영어 모의고사 / 능률 영어1 3과', style:Object.assign({}, inputS, { marginBottom:'14px', width:'100%' }) }),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '자료 종류'),
      React.createElement('select', { value:materialDraft.material_type || 'exam', onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { material_type:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%', marginBottom:'6px' }) },
        React.createElement('option', { value:'exam' }, '시험·문제집'),
        React.createElement('option', { value:'other' }, '기타')
      ),
      React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif', marginBottom:'14px' } }, '단어장·5단계 학습 세트는 이제 단어장 메뉴에서 직접 업로드하세요.'),
      React.createElement('div', { style:{ display:'flex', gap:'10px', marginBottom:'14px' } },
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '과목'),
          React.createElement('select', { value:materialDraft.subject, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { subject:e.target.value })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, '선택'),
            ['국어','영어','수학','과학','사회','한국사','기타'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
          )
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '초중고'),
          React.createElement('select', { value:materialDraft.school_level, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { school_level:e.target.value, target_grade:'' })); }, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, '선택'),
            ['초등','중등','고등'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
          )
        ),
        React.createElement('div', { style:{ flex:1 } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '학년 (선택)'),
          React.createElement('select', { value:materialDraft.target_grade, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { target_grade:e.target.value })); }, disabled:!materialDraft.school_level, style:Object.assign({}, inputS, { width:'100%' }) },
            React.createElement('option', { value:'' }, materialDraft.school_level ? '학년 선택' : '먼저 초중고 선택'),
            (materialDraft.school_level==='초등'?['1학년','2학년','3학년','4학년','5학년','6학년']:materialDraft.school_level==='중등'?['중1','중2','중3']:materialDraft.school_level==='고등'?['고1','고2','고3']:[]).map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
          )
        )
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '설명·출처 (선택)'),
      React.createElement('textarea', { value:materialDraft.description, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { description:e.target.value })); }, rows:2, placeholder:'예: 어법·빈칸 위주, 21~40번만', style:Object.assign({}, inputS, { width:'100%', resize:'vertical', marginBottom:'14px' }) }),
      (materialEditId || (materialDraft.existing_paths||[]).length > 0 || (materialDraft.answer_existing_paths||[]).length > 0) && React.createElement('div', { style:{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#1e40af', marginBottom:'6px' } }, '현재 등록된 파일 (클릭하면 새 탭에서 보기)'),
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color: (materialDraft.existing_paths||[]).length > 0 ? '#1e3a8a' : '#9ca3af' } }, '시험지 ' + ((materialDraft.existing_paths||[]).length) + '개' + ((materialDraft.existing_paths||[]).length === 0 ? ' (없음)' : '')),
        renderFileList(materialDraft.existing_paths, '시험지', ''),
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color: (materialDraft.answer_existing_paths||[]).length > 0 ? '#1e3a8a' : '#9ca3af', marginTop:'8px' } }, '답안지·해설 ' + ((materialDraft.answer_existing_paths||[]).length) + '개' + ((materialDraft.answer_existing_paths||[]).length === 0 ? ' (없음)' : '')),
        renderFileList(materialDraft.answer_existing_paths, '답안지·해설', '')
      ),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '시험지·문제집·자료 (이미지·PDF·엑셀, 여러 장 가능)' + (materialEditId ? ' — 새 파일 선택하면 기존 시험지를 교체합니다' : '')),
      React.createElement('input', { type:'file', accept:'image/*,application/pdf,.pdf,.xlsx,.xls,.csv', multiple:true, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { files: Array.from(e.target.files || []) })); }, style:{ width:'100%', fontSize:'13px', marginBottom:'4px' } }),
      materialDraft.files && materialDraft.files.length > 0 && React.createElement('div', { style:{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'12px' } }, '새 시험지 ' + materialDraft.files.length + '개 선택됨'),
      React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '답안지·해설 (선택 — 정답·해설 정확도 향상, PDF·엑셀 가능)' + (materialEditId ? ' — 새 파일 선택하면 기존 답안을 교체합니다' : '')),
      React.createElement('input', { type:'file', accept:'image/*,application/pdf,.pdf,.xlsx,.xls,.csv', multiple:true, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { answer_files: Array.from(e.target.files || []) })); }, style:{ width:'100%', fontSize:'13px', marginBottom:'4px' } }),
      materialDraft.answer_files && materialDraft.answer_files.length > 0 && React.createElement('div', { style:{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'12px' } }, '새 답안지 ' + materialDraft.answer_files.length + '개 선택됨'),
      React.createElement('div', { style:{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#0f766e', marginBottom:'8px' } }, '분석 범위 (선택 — 비워두면 전체 분석)'),
        React.createElement('div', { style:{ display:'flex', gap:'10px', flexWrap:'wrap' } },
          React.createElement('div', { style:{ flex:1, minWidth:'140px' } },
            React.createElement('label', { style:{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' } }, '분석할 페이지 (예: 3-5)'),
            React.createElement('input', { type:'text', value: materialDraft.analyze_page_range || '', onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { analyze_page_range: e.target.value })); }, placeholder:'비워두면 전체', style:Object.assign({}, inputS, { width:'100%' }) })
          ),
          React.createElement('div', { style:{ flex:1, minWidth:'140px' } },
            React.createElement('label', { style:{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' } }, '이 자료에서 쓸 문항 번호 (예: 21-40)'),
            React.createElement('input', { type:'text', value: materialDraft.selected_questions_text || '', onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { selected_questions_text: e.target.value })); }, placeholder:'비워두면 전체', style:Object.assign({}, inputS, { width:'100%' }) })
          )
        ),
        React.createElement('div', { style:{ fontSize:'10px', color:'#64748b', marginTop:'6px', lineHeight:'1.5' } }, '페이지를 지정하면 그 페이지만 Claude에 보내 비용을 줄입니다 (PDF·여러 장일 때). 답안지·해설은 항상 전체를 보냅니다.'),
        React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'10px', fontSize:'12px', color:'#0f766e', fontWeight:'700' } },
          React.createElement('input', { type:'checkbox', checked:!!materialDraft.precise, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { precise:e.target.checked })); }, style:{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#0f766e' } }),
          '문항 분석을 정밀하게 (고난도 모의고사 등 — 비용 약 5배)'
        ),
        React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'8px', fontSize:'12px', color:'#0f766e', fontWeight:'700' } },
          React.createElement('input', { type:'checkbox', checked:!!materialDraft.precise_student, onChange:function(e){ setMaterialDraft(Object.assign({}, materialDraft, { precise_student:e.target.checked })); }, style:{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#0f766e' } }),
          '이 자료로 만든 시험의 학생 답안 분석도 정밀하게'
        )
      ),
      React.createElement('button', { onClick:function(){ submitMaterial(true); }, disabled: materialUploading || !!analyzingMaterialId, style:{ width:'100%', background:(materialUploading||analyzingMaterialId)?'#9ca3af':'#0f766e', color:'#fff', border:'none', borderRadius:'9px', padding:'11px', fontSize:'14px', fontWeight:'800', cursor:(materialUploading||analyzingMaterialId)?'not-allowed':'pointer', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, analyzingMaterialId ? '분석 중... (1~2분)' : (materialUploading ? '업로드 중...' : '업로드하고 바로 분석')),
      React.createElement('button', { onClick:function(){ submitMaterial(false); }, disabled: materialUploading || !!analyzingMaterialId, style:{ width:'100%', background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'9px', fontSize:'13px', fontWeight:'700', marginBottom:'10px', cursor:(materialUploading||analyzingMaterialId)?'not-allowed':'pointer' } }, '업로드만 (분석은 나중에)'),
      materialDraft.analysis && renderExamAnalysis(materialDraft.analysis),
      React.createElement('div', { style:{ marginTop:'10px' } },
        React.createElement('button', { onClick:closeMaterialForm, disabled: materialUploading || !!analyzingMaterialId, style:{ width:'100%', background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'9px', fontSize:'13px', fontWeight:'700', cursor:(materialUploading||analyzingMaterialId)?'not-allowed':'pointer' } }, '닫기')
      )
    )
  )
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
    var _allTeacherNames = (dbTeachers || []).filter(function(t){ return t.role === 'teacher'; }).map(function(t){ return t.name; }).filter(Boolean);
    var _namesInList = adminScrList.map(function(r){ return r.teacher_name; }).filter(Boolean);
    var teacherOptions = ['전체'].concat(Array.from(new Set(_allTeacherNames.concat(_namesInList))).sort());
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
  // 단계적 필터: 종류 → 과목 → 학교급 → 학년 → 검색
  var afterKind = adminTestKindFilter === 'all' ? adminLevelTests : adminLevelTests.filter(function(t){ return (t.kind||'level') === adminTestKindFilter; });
  var visibleTests = afterKind.filter(function(t){
    if (adminTestAnalyzedOnly && !t.analysis) return false;
    if (adminTestSubjectFilter !== 'all' && (t.subject||'') !== adminTestSubjectFilter) return false;
    if (adminTestLevelFilter !== 'all' && (t.school_level||'') !== adminTestLevelFilter) return false;
    var q = adminTestSearch.trim().toLowerCase();
    if (q) {
      var hay = [t.title, t.subject, t.school_level, t.target_grade, t.description].filter(Boolean).join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  });
  // 종류 필터 안에서만 등장하는 과목·학교급 옵션을 동적으로 산출 (없는 옵션은 숨김)
  var subjectsInKind = Array.from(new Set(afterKind.map(function(t){ return t.subject; }).filter(Boolean))).sort();
  var levelsInKind = Array.from(new Set(afterKind.map(function(t){ return t.school_level; }).filter(Boolean)));
  var hasAnySubFilter = adminTestSubjectFilter !== 'all' || adminTestLevelFilter !== 'all' || adminTestSearch.trim() !== '';
  return React.createElement('div', null,
  React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' } },
    React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', margin:0 } }, '시험 관리'),
    React.createElement('button', { onClick: adminOpenLtForm, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '+ 새 시험 발행')
  ),
  React.createElement('p', { style:{ fontSize:'13px', color:'#6b7280', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '레벨테스트 / 주간 · 월말 테스트 / 숙제를 발행하고 답안을 자동 채점합니다.'),

  /* 종류 필터 (1차) */
  React.createElement('div', { style:{ display:'inline-flex', background:'#f2f0eb', borderRadius:'8px', padding:'3px', gap:'2px', marginBottom:'8px' } },
    [{v:'all',l:'전체'},{v:'level',l:'레벨'},{v:'weekly',l:'주간'},{v:'monthly',l:'월말'},{v:'homework',l:'숙제'}].map(function(o){
      var on = adminTestKindFilter === o.v;
      var count = o.v === 'all' ? adminLevelTests.length : adminLevelTests.filter(function(t){ return (t.kind||'level') === o.v; }).length;
      return React.createElement('button', { key:o.v, onClick:function(){ setAdminTestKindFilter(o.v); }, style:{ background: on?'#1A1A1A':'transparent', color: on?'#fff':'rgba(0,0,0,0.55)', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, o.l + ' ' + count);
    })
  ),

  /* 세부 필터 (2차): 과목 / 학교급 / 검색 / 초기화 */
  React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' } },
    React.createElement('select', {
      value: adminTestSubjectFilter,
      onChange: function(e){ setAdminTestSubjectFilter(e.target.value); },
      style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 10px', fontSize:'12px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
    },
      React.createElement('option', { value:'all' }, '과목 전체'),
      subjectsInKind.map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
    ),
    React.createElement('select', {
      value: adminTestLevelFilter,
      onChange: function(e){ setAdminTestLevelFilter(e.target.value); },
      style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 10px', fontSize:'12px', fontWeight:'600', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
    },
      React.createElement('option', { value:'all' }, '학교급 전체'),
      levelsInKind.map(function(l){ return React.createElement('option', { key:l, value:l }, l); })
    ),
    React.createElement('input', {
      value: adminTestSearch,
      onChange: function(e){ setAdminTestSearch(e.target.value); },
      placeholder: '시험 제목·내용 검색',
      style:{ border:'1px solid #d6dbde', borderRadius:'8px', padding:'7px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', minWidth:'180px', flex:1 }
    }),
    React.createElement('button', {
      onClick: function(){ setAdminTestAnalyzedOnly(function(v){ return !v; }); },
      style:{ border:'1px solid ' + (adminTestAnalyzedOnly ? '#15803d' : '#d6dbde'), background: adminTestAnalyzedOnly ? '#dcfce7' : '#fff', borderRadius:'8px', padding:'7px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', color: adminTestAnalyzedOnly ? '#15803d' : '#6b7280', fontFamily:'Manrope, sans-serif' }
    }, '분석 완료만 보기 (자료실)'),
    hasAnySubFilter && React.createElement('button', {
      onClick: function(){ setAdminTestSubjectFilter('all'); setAdminTestLevelFilter('all'); setAdminTestSearch(''); },
      style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'7px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', color:'#6b7280', fontFamily:'Manrope, sans-serif' }
    }, '필터 초기화'),
    React.createElement('span', { style:{ fontSize:'11px', color:'#9ca3af', fontFamily:'Manrope, sans-serif', marginLeft:'auto' } }, visibleTests.length + ' / ' + afterKind.length + '건')
  ),

  adminLevelTestLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontFamily:'Manrope, sans-serif' } }, '불러오는 중...') :
  visibleTests.length === 0 ? React.createElement('div', { style:{ background:'#fff', borderRadius:'10px', padding:'40px', textAlign:'center', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', fontSize:'14px' } }, '발행된 시험이 없습니다.') :
  React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'10px', maxWidth:'1660px' } },
    visibleTests.map(function(t){
      var reqs = adminLevelTestRequests[t.id] || [];
      var subs = adminLevelTestSubs[t.id] || [];
      var imgs = Array.isArray(t.image_paths) ? t.image_paths : [];
      return React.createElement('div', { key:t.id, style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'14px 16px', alignSelf:'start' } },
        React.createElement('div', { style:{ display:'flex', alignItems:'flex-start', gap:'12px' } },
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' } },
              React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background: KIND_COLORS[t.kind||'level']||'#E60012', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, KIND_LABELS[t.kind||'level']||'레벨테스트'),
              React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background: t.status==='open' ? '#16a34a' : '#6b7280', color:'#fff', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, t.status==='open' ? (t.kind==='level' ? '신청 가능' : (t.kind==='homework' ? '제출 가능' : '응시 가능')) : '마감'),
              t.analysis && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'800', background:'#dcfce7', color:'#15803d', borderRadius:'4px', padding:'2px 7px', fontFamily:'Manrope, sans-serif' } }, '분석 완료'),
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
                  var akKeys = Object.keys(ak);
                  var hasKey = akKeys.length > 0;
                  var norm = function(v){ return String(v == null ? '' : v).split(',').map(function(x){ return x.trim(); }).filter(Boolean).sort().join(','); };
                  var correct = 0;
                  if (hasKey) akKeys.forEach(function(k){ var na = norm(matched.answers[k]); if (na && na === norm(ak[k])) correct++; });
                  return React.createElement('div', { style:{ marginTop:'4px', color:'#374151', fontSize:'11px' } },
                    '객관식: ' + Object.keys(matched.answers).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){
                      var my = matched.answers[k];
                      if (!hasKey || ak[k] == null) return k + '. ' + my;
                      var ok = norm(my) === norm(ak[k]);
                      return k + '. ' + my + (ok ? ' (정답)' : ' (오답·정답' + ak[k] + ')');
                    }).join(' / '),
                    hasKey && React.createElement('span', { style:{ marginLeft:'8px', fontWeight:'800', color:'#E60012' } }, '자동채점: ' + correct + '/' + akKeys.length)
                  );
                })(),
                matched && matched.text_answers && Object.keys(matched.text_answers).length > 0 && Object.keys(matched.text_answers).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){
                  return React.createElement('div', { key:k, style:{ marginTop:'4px', color:'#374151', fontSize:'11px', whiteSpace:'pre-line' } }, '서술형 ' + k + '. ' + matched.text_answers[k]);
                }),
                /* AI 약점 분석 (시험 문항 분석이 된 경우만) */
                matched && t.analysis && React.createElement('div', { style:{ marginTop:'8px', display:'flex', gap:'6px', flexWrap:'wrap' } },
                  React.createElement('button', { onClick:function(){ runStudentAnalysis(matched.id, !!matched.ai_analysis); }, disabled: analyzingStudentId === matched.id, style:{ background: analyzingStudentId === matched.id ? '#9ca3af' : '#15803d', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:'700', cursor: analyzingStudentId === matched.id ? 'wait' : 'pointer', fontFamily:'Manrope, sans-serif' } }, analyzingStudentId === matched.id ? 'AI 분석 중... (수십 초 소요)' : (matched.ai_analysis ? 'AI 약점 재분석' : 'AI 약점 분석')),
                  matched.ai_analysis && React.createElement('button', { onClick:function(){ window.B2Utils.printStudentReport(matched.ai_analysis, matched.student_name, t.title); }, style:{ background:'#fff', color:'#15803d', border:'1px solid #15803d', borderRadius:'6px', padding:'5px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '리포트 인쇄·PDF')
                ),
                matched && matched.ai_analysis && renderStudentAnalysis(matched.ai_analysis),
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
      // 자료실에서 불러오기
      adminLtDraft.material_id
        ? React.createElement('div', { style:{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:'8px', padding:'10px 12px', marginBottom:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', fontFamily:'Manrope, sans-serif' } },
            React.createElement('div', { style:{ fontSize:'12px', color:'#065f46' } }, adminLtDraft.material_title ? ('자료실 자료 "' + adminLtDraft.material_title + '" 에서 불러옴 — 시험지·정답이 자동으로 채워졌습니다.') : '자료실 자료에서 만든 시험입니다 — 시험지·정답은 그 자료를 따릅니다.'),
            React.createElement('button', { onClick:unlinkMaterialFromExam, style:{ background:'#fff', color:'#065f46', border:'1px solid #065f46', borderRadius:'6px', padding:'3px 9px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '연결 해제')
          )
        : React.createElement('button', { onClick:function(){ if (!materials.length) loadMaterials(); setMaterialPickerOpen(true); }, style:{ width:'100%', background:'#fff', color:'#0f766e', border:'1px dashed #0f766e', borderRadius:'9px', padding:'10px', fontSize:'13px', fontWeight:'800', cursor:'pointer', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '자료실에서 불러오기 (분석해 둔 시험지·정답 가져오기)'),
      // 등록된 시험지 파일
      (adminLtDraft.id || adminLtDraft.material_id || (adminLtDraft.existing_paths||[]).length > 0 || (adminLtDraft.answer_existing_paths||[]).length > 0) && React.createElement('div', { style:{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#1e40af', marginBottom:'8px' } }, '등록된 시험지 파일 (클릭하면 새 탭에서 크게 보기)'),
        React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' } },
          React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color: (adminLtDraft.existing_paths||[]).length > 0 ? '#1e3a8a' : '#9ca3af' } }, '시험지 ' + ((adminLtDraft.existing_paths||[]).length) + '장' + ((adminLtDraft.existing_paths||[]).length === 0 ? ' (없음)' : '')),
          (adminLtDraft.id && !adminLtDraft.material_id && (adminLtDraft.existing_paths||[]).length > 0) && React.createElement('button', { onClick:function(){ removeExamFilesAdmin('exam'); }, style:{ background:'#fff', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', cursor:'pointer' } }, '시험지 모두 삭제')
        ),
        renderFileList(adminLtDraft.existing_paths, '시험지', '페이지'),
        (adminLtDraft.answer_existing_paths||[]).length > 0 && React.createElement('div', { style:{ marginTop:'10px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#1e3a8a' } }, '답안지·해설 ' + ((adminLtDraft.answer_existing_paths||[]).length) + '개'),
          renderFileList(adminLtDraft.answer_existing_paths, '답안지·해설', '')
        )
      ),
      !adminLtDraft.material_id && React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '시험지 직접 올리기 (이미지 또는 PDF)' + (adminLtDraft.id ? ' — 새 파일 선택하면 위 기존 시험지 전체가 교체됩니다' : ' (선택 — 자료실에서 안 불러올 때만)')),
      !adminLtDraft.material_id && React.createElement('input', { type:'file', accept:'image/*,application/pdf,.pdf', multiple:true, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { files: Array.from(e.target.files || []) })); }, style:{ width:'100%', fontSize:'13px', marginBottom:'4px' } }),
      (!adminLtDraft.material_id && adminLtDraft.files && adminLtDraft.files.length > 0) && React.createElement('div', { style:{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'14px' } }, '새 시험지 ' + adminLtDraft.files.length + '장 선택됨 (저장 시 교체)'),
      // 답안지·해설 입력 + 분석 범위 + 정밀 체크박스 — 자료실에서 안 불러왔을 때만
      !adminLtDraft.material_id && React.createElement(React.Fragment, null,
        React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '답안지·해설 (선택 — 자동 채점·해설 정확도 향상, PDF 가능)' + (adminLtDraft.id ? ' — 새 파일 선택하면 위 기존 답안을 교체합니다' : '')),
        React.createElement('input', { type:'file', accept:'image/*,application/pdf,.pdf', multiple:true, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { answer_files: Array.from(e.target.files || []) })); }, style:{ width:'100%', fontSize:'13px', marginBottom:'4px' } }),
        adminLtDraft.answer_files && adminLtDraft.answer_files.length > 0 && React.createElement('div', { style:{ fontSize:'11px', color:'#16a34a', fontWeight:'700', marginBottom:'14px' } }, '새 답안지 ' + adminLtDraft.answer_files.length + '개 선택됨 (저장 시 교체)'),

        React.createElement('div', { style:{ background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:'8px', padding:'12px', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#0f766e', marginBottom:'8px' } }, '분석 범위 (선택 — 비워두면 전체 분석)'),
          React.createElement('div', { style:{ display:'flex', gap:'10px', flexWrap:'wrap' } },
            React.createElement('div', { style:{ flex:1, minWidth:'140px' } },
              React.createElement('label', { style:{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' } }, '분석할 페이지 (예: 3-5)'),
              React.createElement('input', { type:'text', value: adminLtDraft.analyze_page_range || '', onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { analyze_page_range: e.target.value })); }, placeholder:'비워두면 전체', style:Object.assign({}, inputS, { width:'100%' }) })
            ),
            React.createElement('div', { style:{ flex:1, minWidth:'140px' } },
              React.createElement('label', { style:{ fontSize:'11px', color:'#475569', display:'block', marginBottom:'2px' } }, '학생에게 낼 문항 번호 (예: 21-40)'),
              React.createElement('input', { type:'text', value: adminLtDraft.selected_questions_text || '', onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { selected_questions_text: e.target.value })); }, placeholder:'비워두면 전체', style:Object.assign({}, inputS, { width:'100%' }) })
            )
          ),
          React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'10px', fontSize:'12px', color:'#0f766e', fontWeight:'700' } },
            React.createElement('input', { type:'checkbox', checked:!!adminLtDraft.precise, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { precise: e.target.checked })); }, style:{ width:'14px', height:'14px', cursor:'pointer', accentColor:'#0f766e' } }),
            React.createElement('span', null, '정밀 분석 (Opus — 비용 약 5배)')
          ),
          React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'4px', fontSize:'12px', color:'#0f766e', fontWeight:'700' } },
            React.createElement('input', { type:'checkbox', checked:!!adminLtDraft.precise_student, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { precise_student: e.target.checked })); }, style:{ width:'14px', height:'14px', cursor:'pointer', accentColor:'#0f766e' } }),
            React.createElement('span', null, '학생 답안 분석도 정밀하게 (Opus)')
          )
        )
      ),
      React.createElement('label', { style:{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginTop:'10px', marginBottom:'14px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'#374151', fontWeight:'700' } },
        React.createElement('input', { type:'checkbox', checked:!!adminLtDraft.hide_paper, onChange:function(e){ setAdminLtDraft(Object.assign({}, adminLtDraft, { hide_paper:e.target.checked })); }, style:{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#E60012' } }),
        React.createElement('span', null, '종이 시험지로 진행 — 학생 화면엔 OMR 답안만 표시 (시험지는 종이로 나눠줌)')
      ),
      // 분석 결과 (이미 분석된 경우 폼 안에 표시)
      adminLtDraft.analysis && renderExamAnalysis(adminLtDraft.analysis),
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

      /* 객관식 정답 입력 (분석으로 자동 채워짐, 수정 가능) */
      (function(){
        var qc = parseInt(adminLtDraft.question_count, 10) || 0;
        var ak0 = adminLtDraft.answer_key || {};
        var akNums = Object.keys(ak0).map(Number).filter(function(n){ return !isNaN(n) && n > 0; }).sort(function(a,b){ return a-b; });
        var nums = (akNums.length === qc && akNums.length > 0) ? akNums : Array.from({ length: qc }, function(_, i){ return i + 1; });
        if (nums.length === 0) return null;
        return React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', display:'block', marginBottom:'4px' } }, '객관식 정답' + (adminLtDraft.material_id ? ' (자료실에서 불러옴 · 필요하면 수정)' : ' (직접 기입, 비워두면 자동 채점 X)')),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px, 1fr))', gap:'6px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px' } },
            nums.map(function(num){
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
      // 시험지가 있고 자료실에서 안 불러왔으면 "저장 + Claude 분석" 옵션
      !adminLtDraft.material_id && ((adminLtDraft.existing_paths||[]).length > 0 || (adminLtDraft.files||[]).length > 0) && React.createElement('button', { onClick:function(){ adminSubmitLevelTest(true); }, disabled: adminLtUploading, style:{ width:'100%', background: adminLtUploading ? '#9ca3af' : '#0f766e', color:'#fff', border:'none', borderRadius:'9px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: adminLtUploading ? 'not-allowed' : 'pointer', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, adminLtUploading ? '저장+분석 중...' : '저장 + Claude 문항 분석'),
      React.createElement('button', { onClick:function(){ adminSubmitLevelTest(false); }, disabled: adminLtUploading, style:{ width:'100%', background: adminLtUploading ? '#9ca3af' : '#E60012', color:'#fff', border:'none', borderRadius:'9px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor: adminLtUploading ? 'not-allowed' : 'pointer', marginTop:'4px', fontFamily:'Manrope, sans-serif' } }, adminLtUploading ? '저장 중...' : (adminLtDraft.id ? '수정 저장' : (adminLtDraft.kind === 'homework' ? '숙제 발행' : (adminLtDraft.kind === 'weekly' ? '주간 테스트 발행' : (adminLtDraft.kind === 'monthly' ? '월말 테스트 발행' : '레벨테스트 발행'))))),
      React.createElement('div', { style:{ marginTop:'8px' } },
        React.createElement('button', { onClick:adminCloseLtForm, disabled: adminLtUploading, style:{ width:'100%', background:'#f3f4f6', color:'#111827', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'10px', fontSize:'13px', fontWeight:'700', cursor: adminLtUploading ? 'not-allowed' : 'pointer' } }, '닫기')
      )
    )
  ),
  // 자료실에서 자료 고르기 (시험 발행 폼에서)
  materialPickerOpen && React.createElement('div', { onClick:function(){ setMaterialPickerOpen(false); }, style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' } },
    React.createElement('div', { onClick:function(e){ e.stopPropagation(); }, style:{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'560px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'88vh', overflowY:'auto', fontFamily:'Manrope, sans-serif' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' } },
        React.createElement('h3', { style:{ fontSize:'16px', fontWeight:'800', color:'#111827', margin:0 } }, '자료실에서 불러오기'),
        React.createElement('button', { onClick:function(){ setMaterialPickerOpen(false); }, style:{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9ca3af' } }, '×')
      ),
      React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginTop:0, marginBottom:'12px' } }, '분석해 둔 시험지를 고르면 시험지·정답·문항 수가 자동으로 채워집니다. 자료가 없으면 "자료실" 탭에서 먼저 만들어 주세요.'),
      React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' } },
        React.createElement('select', { value:materialFilters.subject, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { subject:e.target.value })); }, style:Object.assign({}, inputS, { width:'95px' }) },
          React.createElement('option', { value:'' }, '과목'),
          ['국어','영어','수학','과학','사회','한국사','기타'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
        ),
        React.createElement('select', { value:materialFilters.level, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { level:e.target.value, grade:'' })); }, style:Object.assign({}, inputS, { width:'85px' }) },
          React.createElement('option', { value:'' }, '초중고'),
          ['초등','중등','고등'].map(function(s){ return React.createElement('option', { key:s, value:s }, s); })
        ),
        React.createElement('select', { value:materialFilters.grade, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { grade:e.target.value })); }, style:Object.assign({}, inputS, { width:'90px' }) },
          React.createElement('option', { value:'' }, '학년'),
          gradeOptsForLevel(materialFilters.level).map(function(g){ return React.createElement('option', { key:g, value:g }, g); })
        ),
        React.createElement('input', { value:materialFilters.search, onChange:function(e){ setMaterialFilters(Object.assign({}, materialFilters, { search:e.target.value })); }, placeholder:'제목·설명 검색', style:Object.assign({}, inputS, { flex:1, minWidth:'120px' }) })
      ),
      materialLoading ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'13px' } }, '불러오는 중...') : (function(){
        var list = (materials || []).filter(function(m){
          if (!m.analysis) return false;
          // 시험 발행용 picker: 시험·문제집(exam) 종류만 (단어 관련 자료는 단어장 메뉴에서 다룸)
          var mt = m.material_type || 'exam';
          if (mt !== 'exam') return false;
          if (materialFilters.subject && m.subject !== materialFilters.subject) return false;
          if (materialFilters.level && m.school_level !== materialFilters.level) return false;
          if (materialFilters.grade && m.target_grade !== materialFilters.grade) return false;
          if (materialFilters.search) { var q = materialFilters.search.toLowerCase(); if (((m.title||'')+' '+(m.description||'')).toLowerCase().indexOf(q) < 0) return false; }
          return true;
        });
        if (list.length === 0) return React.createElement('div', { style:{ padding:'18px', textAlign:'center', color:'#9ca3af', fontSize:'13px' } }, '불러올 수 있는 분석 자료가 없습니다.');
        return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
          list.map(function(m){
            var qc = m.question_count || 0; var tqc = m.text_question_count || 0;
            return React.createElement('button', { key:m.id, onClick:function(){ loadMaterialIntoExam(m); }, style:{ textAlign:'left', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px 12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
                React.createElement('span', { style: window.B2Utils.materialTypeBadgeStyle(m.material_type) }, window.B2Utils.materialTypeLabel(m.material_type)),
                m.subject && React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'#374151' } }, m.subject),
                (m.school_level || m.target_grade) && React.createElement('span', { style:{ fontSize:'11px', color:'#6b7280' } }, [m.school_level, m.target_grade].filter(Boolean).join(' ')),
                React.createElement('span', { style:{ fontSize:'14px', fontWeight:'800', color:'#111827' } }, m.title)
              ),
              React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', marginTop:'2px' } }, '객관식 ' + qc + '문항' + (tqc>0?(' · 서술형 '+tqc+'문항'):'') + (m.teacher_name?(' · '+m.teacher_name):'') + (m.created_at?(' · '+String(m.created_at).slice(0,10)):'')),
              m.description && React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'2px', whiteSpace:'pre-line' } }, m.description)
            );
          })
        );
      })()
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

/* ── 차량 위치 TAB ── */
tab==='vehicles' && React.createElement('div', null,
  React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, '학원 차량 위치'),
  React.createElement('p', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'18px', fontFamily:'Manrope, sans-serif', lineHeight:'1.7' } },
    '학원 차량을 등록하고 카카오 지도 키를 저장하면 로그인한 사용자들이 ', React.createElement('strong', null, '메뉴 > 차량 위치'),
    '에서 실시간 위치를 확인할 수 있습니다. 운행 중인 기사(관리자/선생님)가 페이지에서 ‘운행 시작’ 누르면 본인 휴대폰 GPS로 30초마다 자동 송신.'
  ),

  /* 카카오 지도 키 */
  React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px', marginBottom:'14px' } },
    React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'10px', color:'#1A1A1A' } }, '1. 카카오 지도 JavaScript 키'),
    React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', lineHeight:'1.7' } },
      'developers.kakao.com → 내 애플리케이션 → 앱 만들기 → ',
      React.createElement('strong', null, '앱 설정 > 플랫폼 > Web 플랫폼 등록'),
      '에 사이트 도메인(예: https://b2bigbang.com, https://finley78.github.io)을 등록한 뒤, ',
      React.createElement('strong', null, '요약 정보 > JavaScript 키'),
      '를 복사해 아래에 붙여넣고 저장하세요.'
    ),
    React.createElement('div', { style:{ display:'flex', gap:'8px', alignItems:'center' } },
      React.createElement('input', { type:'text', value: kakaoKeyInput, onChange: function(e){ setKakaoKeyInput(e.target.value); }, placeholder:'예: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p', style: Object.assign({}, inputS, { flex:1, fontFamily:'Menlo, Consolas, monospace' }) }),
      React.createElement('button', { onClick: saveKakaoKey, disabled: vehicleSaving, style:{ background: vehicleSaving?'#9ca3af':'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'800', cursor: vehicleSaving?'not-allowed':'pointer', fontFamily:'Manrope, sans-serif', whiteSpace:'nowrap' } }, vehicleSaving ? '저장 중...' : '키 저장')
    ),
    kakaoKeyHasSaved && React.createElement('div', { style:{ fontSize:'11px', color:'#15803d', fontWeight:'700', marginTop:'8px', fontFamily:'Manrope, sans-serif' } }, '✓ 저장된 키가 있습니다.')
  ),

  /* 차량 목록 + 등록 폼 */
  React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px', marginBottom:'14px' } },
    React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'10px', color:'#1A1A1A' } }, '2. 차량 ' + (vehicleEditingId ? '수정' : '등록')),
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' } },
      React.createElement('div', null,
        React.createElement('label', { style:labelS }, '차량 이름 *'),
        React.createElement('input', { value: vehicleDraft.name, onChange: function(e){ var v = e.target.value; setVehicleDraft(function(p){ return Object.assign({}, p, { name: v }); }); }, placeholder:'예: 1호차', style: inputS })
      ),
      React.createElement('div', null,
        React.createElement('label', { style:labelS }, '노선 (선택)'),
        React.createElement('input', { value: vehicleDraft.route, onChange: function(e){ var v = e.target.value; setVehicleDraft(function(p){ return Object.assign({}, p, { route: v }); }); }, placeholder:'예: 검암 → 학원', style: inputS })
      ),
      React.createElement('div', null,
        React.createElement('label', { style:labelS }, '기사 이름 (선택)'),
        React.createElement('input', { value: vehicleDraft.driver_name, onChange: function(e){ var v = e.target.value; setVehicleDraft(function(p){ return Object.assign({}, p, { driver_name: v }); }); }, placeholder:'예: 김기사', style: inputS })
      ),
      React.createElement('div', null,
        React.createElement('label', { style:labelS }, '기사 전화 (선택)'),
        React.createElement('input', { value: vehicleDraft.driver_phone, onChange: function(e){ var v = e.target.value; setVehicleDraft(function(p){ return Object.assign({}, p, { driver_phone: v }); }); }, placeholder:'예: 010-1234-5678', style: inputS })
      )
    ),
    React.createElement('div', { style:{ display:'flex', gap:'8px', justifyContent:'flex-end' } },
      vehicleEditingId && React.createElement('button', { onClick: cancelVehicleEdit, style: btnOutS }, '취소'),
      React.createElement('button', { onClick: saveVehicle, disabled: vehicleSaving || !vehicleDraft.name.trim(), style: btnS(vehicleSaving ? '#9ca3af' : '#E60012') }, vehicleSaving ? '저장 중...' : (vehicleEditingId ? '수정 저장' : '+ 차량 등록'))
    )
  ),

  /* 등록된 차량 목록 */
  React.createElement('section', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'18px' } },
    React.createElement('h3', { style:{ fontSize:'14px', fontWeight:'800', marginBottom:'10px', color:'#1A1A1A' } }, '등록된 차량 (' + vehiclesList.length + '대)'),
    React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '※ 현재 학생/학부모 화면은 ', React.createElement('strong', null, '활성 차량 중 가장 먼저 등록된 1대'), '를 표시합니다. 여러 대 운영 시 보여줄 차량만 활성으로 두세요.'),
    vehiclesList.length === 0
      ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'13px', padding:'14px 0', fontFamily:'Manrope, sans-serif' } }, '아직 등록된 차량이 없습니다.')
      : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
          vehiclesList.map(function(v){
            return React.createElement('div', { key:v.id, style:{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', background: v.is_active ? '#fff' : '#f9fafb', fontFamily:'Manrope, sans-serif' } },
              React.createElement('span', { style:{ background: v.is_active ? '#dcfce7' : '#f3f4f6', color: v.is_active ? '#15803d' : '#6b7280', fontSize:'11px', fontWeight:'800', padding:'4px 10px', borderRadius:'999px' } }, v.is_active ? '활성' : '비활성'),
              React.createElement('div', { style:{ flex:1, minWidth:0 } },
                React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A' } }, v.name + (v.route ? ' · ' + v.route : '')),
                (v.driver_name || v.driver_phone) && React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginTop:'2px' } }, [v.driver_name, v.driver_phone].filter(Boolean).join(' · '))
              ),
              React.createElement('button', { onClick: function(){ toggleVehicleActive(v); }, style:{ background:'transparent', color:'rgba(0,0,0,0.65)', border:'1px solid #d6dbde', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, v.is_active ? '비활성화' : '활성화'),
              React.createElement('button', { onClick: function(){ editVehicle(v); }, style:{ background:'transparent', color:'rgba(0,0,0,0.65)', border:'1px solid #d6dbde', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '수정'),
              React.createElement('button', { onClick: function(){ deleteVehicle(v); }, style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'6px', padding:'5px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '삭제')
            );
          })
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
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, (stu.name || '학생') + ' · ' + (B2Utils.formatPhone(it.parent_phone) || '연락처 없음')),
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

  // 객관식 자동 채점 점수 (복수 정답 문항 정규화 비교)
  const ak = (exam.answer_key && typeof exam.answer_key === 'object') ? exam.answer_key : {};
  const akKeys = Object.keys(ak);
  const hasKey = akKeys.length > 0;
  const qc = hasKey ? akKeys.length : (exam.question_count || 0);
  const normA = function(v){ return String(v == null ? '' : v).split(',').map(function(x){ return x.trim(); }).filter(Boolean).sort().join(','); };
  let objAuto = null;
  if (hasKey) {
    let c = 0;
    akKeys.forEach(function(k){ var na = normA(submission.answers && submission.answers[k]); if (na && na === normA(ak[k])) c++; });
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
