// AdminPanel.jsx — Admin login + full management panel

const GRADES = ['중1','중2','중3','고1','고2','고3'];
const SUBJECTS = ['국어','영어','수학','과학'];
const COURSE_LEVELS = ['초등','중등','고등'];
const COURSE_GRADES_BY_LEVEL = {
'초등': ['1학년','2학년','3학년','4학년','5학년','6학년'],
'중등': ['중1','중2','중3'],
'고등': ['고1','고2','고3'],
};
const SCHOOLS = ['전체','은지초','검암초','간재울초','검암중','간재울중','백석중','대인고','서인천고','백석고'];
const TEACHER_LEVELS = ['초등','중등','고등'];
const TEACHER_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const TEACHER_ASSIGN_LEVELS = ['초등','중등','고등'];
const TEACHER_ASSIGN_GRADES = ['1학년','2학년','3학년','4학년','5학년','6학년'];
const SCHOOL_LEVELS = {
'초등': { schools:['은지초','검암초','간재울초'], grades:['1학년','2학년','3학년','4학년','5학년','6학년'] },
'중등': { schools:['검암중','간재울중','백석중'], grades:['중1','중2','중3'] },
'고등': { schools:['대인고','서인천고','백석고'], grades:['고1','고2','고3'] },
};

// ── 성적 분석 헬퍼 (관리자/선생님 공유 로직과 동일 규칙) ──
function adminGradeBucket(score) { var s = Number(score); if (isNaN(s)) return null; if (s>=90) return 1; if (s>=80) return 2; if (s>=70) return 3; return 0; }
function adminDistBucket(score) { var s = Number(score); if (isNaN(s)) return null; if (s>=90) return '90-100'; if (s>=80) return '80-89'; if (s>=70) return '70-79'; if (s>=60) return '60-69'; return '0-59'; }
function adminColorForScore(score) { var s = Number(score); if (isNaN(s)) return '#9ca3af'; if (s>=90) return '#006241'; if (s>=70) return '#cba258'; return '#c82014'; }
function adminGenerateComment(args) {
  var name = args.studentName || '학생';
  var score = Number(args.score);
  var prev = args.prevScore != null ? Number(args.prevScore) : null;
  var classAvg = args.classAvg != null ? Number(args.classAvg) : null;
  var trend3 = Array.isArray(args.recentTrend) ? args.recentTrend.slice(-3).map(Number).filter(function(v){return !isNaN(v);}) : [];
  var subject = args.subject || '';
  var testName = args.testName || '시험';
  var lines = [];
  if (!isNaN(score)) lines.push(name + ' 학생은 이번 ' + testName + '에서 ' + score + '점을 받았습니다.');
  if (prev != null && !isNaN(prev)) {
    var diff = score - prev;
    if (diff > 0) lines.push('지난 시험(' + prev + '점) 대비 ' + diff + '점 향상되어 꾸준한 성장을 보이고 있습니다.');
    else if (diff < 0) lines.push('지난 시험(' + prev + '점) 대비 ' + Math.abs(diff) + '점 하락하여 학습 점검이 필요합니다.');
    else lines.push('지난 시험(' + prev + '점)과 동일한 점수를 유지하고 있습니다.');
  }
  if (trend3.length >= 3) {
    var allDown = trend3[0] > trend3[1] && trend3[1] > trend3[2];
    var allUp = trend3[0] < trend3[1] && trend3[1] < trend3[2];
    if (allDown) lines.push('최근 3회 시험에서 점수가 연속 하락하고 있어 집중적인 관리가 필요한 시점입니다.');
    else if (allUp) lines.push('최근 3회 연속 점수가 상승하며 학습 흐름이 매우 긍정적입니다.');
  }
  if (classAvg != null && !isNaN(classAvg)) {
    var gap = score - classAvg;
    if (gap >= 5) lines.push('반 평균(' + classAvg.toFixed(1) + '점) 대비 ' + gap.toFixed(1) + '점 높아 상위권을 유지하고 있습니다.');
    else if (gap <= -5) lines.push('반 평균(' + classAvg.toFixed(1) + '점) 대비 ' + Math.abs(gap).toFixed(1) + '점 낮아 기초 보강이 필요합니다.');
    else lines.push('반 평균(' + classAvg.toFixed(1) + '점)에 근접한 점수로 안정적인 흐름을 유지하고 있습니다.');
  }
  if (!isNaN(score)) {
    if (score >= 90) lines.push('현재 우수한 흐름을 유지하고 있으니 심화 문제와 기출 위주의 학습을 권장드립니다.');
    else if (score >= 70) lines.push((subject || '해당 과목') + ' 약점 단원을 정리하고, 주 2회 추가 연습을 권장드립니다.');
    else lines.push('기본 개념 정리를 우선하여 주 3회 이상 복습 및 반복 풀이를 권장드립니다.');
  }
  return lines.join(' ');
}
function adminFormatKakao(args) {
  var lines = [];
  lines.push('[B2빅뱅학원] 성적 안내'); lines.push('');
  lines.push((args.studentName || '학생') + ' 학생 성적 안내드립니다.'); lines.push('');
  lines.push('▶ 시험명: ' + (args.testName || '-'));
  lines.push('▶ 응시일: ' + (args.testDate || '-'));
  lines.push('▶ 점수: ' + (args.score != null ? args.score + '점' : '-'));
  if (args.prevScore != null) { var diff = Number(args.score) - Number(args.prevScore); lines.push('▶ 전회 대비: ' + (diff >= 0 ? '+' : '') + diff + '점'); }
  else lines.push('▶ 전회 대비: -');
  lines.push('');
  var summary = String(args.comment || '').split('. ').slice(0,2).join('. ');
  if (summary && !summary.endsWith('.')) summary += '.';
  lines.push(summary || '자세한 내용은 학원으로 문의해 주세요.'); lines.push('');
  lines.push('자세한 내용은 학원으로 문의해 주세요.'); lines.push('☎ 학원 연락처');
  return lines.join('\n');
}

function adminExtractYoutubeId(value) {
var raw = String(value || '').trim();
if (!raw) return '';
var match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
if (match && match[1]) return match[1];
if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return raw;
return raw;
}

function adminLectureVideoUrl(v) {
var raw = String((v && (v.video_url || v.youtube_id)) || '').trim();
if (!raw) return '';
if (/youtube\.com|youtu\.be/i.test(raw)) return raw;
if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return 'https://www.youtube.com/watch?v=' + raw;
return raw;
}


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
React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#cba258', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '관'),
React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '관리자 로그인')
),
React.createElement('div', { style:{ position:'relative', background:'#f9f9f9', borderRadius:'4px', border:`1px solid ${error?'#c82014':'#d6dbde'}`, padding:'14px 12px 10px', marginBottom:'16px' } },
React.createElement('div', { style:{ position:'absolute', top:'-9px', left:'10px', background:'#f9f9f9', padding:'0 4px', fontSize:'10px', fontWeight:'700', color: error?'#c82014':'rgba(0,0,0,0.87)', letterSpacing:'0.04em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif' } }, error?'비밀번호 오류':'비밀번호'),
React.createElement('input', { type:'password', value:pw, onChange:e=>setPw(e.target.value), onKeyDown:e=>e.key==='Enter'&&attempt(), placeholder:'관리자 비밀번호', style:{ width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', boxSizing:'border-box' } })
),
React.createElement('button', { onClick:attempt, style:{ width:'100%', background:'#1E3932', color:'#fff', border:'none', borderRadius:'8px', padding:'14px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' },
onMouseDown:e=>e.currentTarget.style.transform='scale(0.98)', onMouseUp:e=>e.currentTarget.style.transform='scale(1)' }, '로그인'),
React.createElement('p', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.35)', textAlign:'center', marginTop:'12px', fontFamily:'Manrope, sans-serif' } }, '데모 비밀번호: b2admin')
)
);
}

/* ── Admin Panel ────────────────────────────── */
function AdminPanel({ state, setState, onLogout, adminAuthed, setAdminAuthed }) {
const authed = adminAuthed;
const setAuthed = setAdminAuthed;
const [tab, setTab] = React.useState('banner');
const [editingBanner, setEditingBanner] = React.useState(null);
const [editingNotice, setEditingNotice] = React.useState(null);
const [editingCourse, setEditingCourse] = React.useState(null);
const [expandedStudent, setExpandedStudent] = React.useState(null);
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
const [selectedIds, setSelectedIds] = React.useState([]);
const [bulkGrade, setBulkGrade] = React.useState('');
const [bulkSchool, setBulkSchool] = React.useState('');
const [dbStudents, setDbStudents] = React.useState([]);
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
id: c.id, subject: c.subjects?.name || '', color: c.subjects?.color || '#006241',
name: c.title, description: c.description, grade: c.grade || '', level: c.level || '', class_id: c.class_id || '',
days: c.days || 0, duration: c.duration || 0, teacher: c.teacher || '',
price: c.price || '', badge: c.badge || null, intro: c.intro || '',
target: c.target || '', curriculum: c.curriculum || '', teacherDesc: c.teacher_desc || '',
youtube: c.youtube || '',
lectures: (c.videos || []).sort((a,b) => a.sort_order - b.sort_order).map(v => ({
id: v.id, title: v.title, videoUrl: adminLectureVideoUrl(v), youtubeId: v.youtube_id || '',
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
role: 'student',
}));
setDbStudents(mapped);
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
}

async function toggleSubject(studentId, subject) {
const st = dbStudents.find(s => s.id === studentId);
const subjects = st.subjects || [];
const updated = subjects.includes(subject) ? subjects.filter(s => s !== subject) : [...subjects, subject];
await sb.from('students').update({ subjects: updated }).eq('id', studentId);
setDbStudents(s => s.map(st => st.id === studentId ? { ...st, subjects: updated } : st));
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
{ id:'feature', label:'섹션 편집' },
];

const inputS = { width:'100%', border:'1px solid #d6dbde', borderRadius:'4px', padding:'8px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', color:'rgba(0,0,0,0.87)', outline:'none', boxSizing:'border-box' };
const labelS = { fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'4px', display:'block' };
const cardS = { background:'#fff', borderRadius:'12px', padding:'16px 18px', boxShadow:'0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)', marginBottom:'12px' };
const btnS = (color='#00754A') => ({ background:color, color:'#fff', border:'none', borderRadius:'8px', padding:'7px 16px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' });
const btnOutS = { background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' };

const ROLE_LABEL = { student:'학생', parent:'학부모', teacher:'선생님' };


async function updateBanner(id, field, val) {
setState(s => ({ ...s, banners: s.banners.map(b => b.id===id ? {...b,[field]:val} : b) }));
await sb.from('banners').update({ [field]: val }).eq('id', id);
}
async function addBanner() {
const newB = { bg:'#006241', subtitle:'새 배너 부제목', title:'새 배너 제목', label:'개강 예정', badge:'새로운', active:true, cta:'자세히 보기', sort_order: state.banners.length+1 };
const { data } = await sb.from('banners').insert(newB).select().single();
if (data) setState(s => ({ ...s, banners: [...s.banners, data] }));
}
async function deleteBanner(id) {
await sb.from('banners').delete().eq('id', id);
setState(s => ({ ...s, banners: s.banners.filter(b => b.id!==id) }));
if (editingBanner?.id===id) setEditingBanner(null);
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

React.createElement('div', { style:{ background:'#1E3932', padding:'24px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#cba258', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif' } }, '관'),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#fff', fontFamily:'Manrope, sans-serif', letterSpacing:'-0.16px' } }, 'B2빅뱅학원 관리자'),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.5)', fontFamily:'Manrope, sans-serif' } }, '관리자 전용 페이지')
)
),
React.createElement('button', { onClick:onLogout, style:{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '로그아웃')
),

React.createElement('div', { style:{ background:'#fff', borderBottom:'1px solid rgba(0,0,0,0.08)', padding:'0 40px', display:'flex', gap:'0', overflowX:'auto' } },
tabs.map(t =>
React.createElement('button', { key:t.id, onClick:()=>setTab(t.id), style:{ padding:'16px 20px', background:'none', border:'none', borderBottom: tab===t.id?'2px solid #006241':'2px solid transparent', fontSize:'14px', fontWeight:'700', color: tab===t.id?'#006241':'rgba(0,0,0,0.55)', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease', marginBottom:'-1px', whiteSpace:'nowrap' } }, t.label)
)
),

React.createElement('div', { style:{ maxWidth:'960px', margin:'0 auto', padding:'32px 40px' } },

/* ── BANNER TAB ── */
tab==='banner' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, '히어로 배너'),
React.createElement('button', { onClick:addBanner, style:btnS() }, '+ 배너 추가')
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
React.createElement('div', { style:{ background: b.active?'#d4e9e2':'#f2f0eb', color: b.active?'#006241':'rgba(0,0,0,0.45)', borderRadius:'8px', padding:'2px 10px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, b.active?'노출중':'숨김')
),
React.createElement('div', { style:{ display:'flex', gap:'8px' } },
React.createElement('button', { onClick:()=>setEditingBanner(editingBanner?.id===b.id?null:b), style:btnS('#2b5148') }, editingBanner?.id===b.id?'닫기':'편집'),
React.createElement('button', { onClick:()=>deleteBanner(b.id), style:btnOutS }, '삭제')
)
),
editingBanner?.id===b.id && React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', paddingTop:'12px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
[{f:'title',l:'제목'},{f:'subtitle',l:'부제목'},{f:'badge',l:'뱃지'},{f:'label',l:'라벨'},{f:'cta',l:'버튼 텍스트'},{f:'bg',l:'배경색 (#hex)'},{f:'image',l:'배경 이미지 URL'},{f:'youtube',l:'배경 유튜브 링크'}].map(({f,l})=>
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
React.createElement('button', { onClick:addAnnouncement, style:btnS('#2b5148') }, '+ 발표 추가')
)
),
editingNotice
? React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' } },
React.createElement('button', { onClick:()=>setEditingNotice(null), style:{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '← 목록으로'),
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
React.createElement('button', { onClick: async ()=>{
if (editingNotice.type !== undefined) {
await window.supabase.from('notices').update({ type:editingNotice.type, text:editingNotice.text, date:editingNotice.date }).eq('id', editingNotice.id);
} else {
await window.supabase.from('announcements').update({ title:editingNotice.title, date:editingNotice.date }).eq('id', editingNotice.id);
}
setEditingNotice(null);
}, style:{ ...btnS(), alignSelf:'flex-start' } }, '✓ 저장 완료')
)
)
: React.createElement('div', null,
React.createElement('h3', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'8px', letterSpacing:'0.05em', textTransform:'uppercase' } }, '강좌/이벤트 공지'),
state.notices.map(n =>
React.createElement('div', { key:n.id, style:{ ...cardS, display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }, onClick:()=>setEditingNotice(n) },
React.createElement('span', { style:{ fontSize:'10px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, n.type),
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
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', background:'#d4e9e2', color:'#006241', borderRadius:'4px', padding:'2px 8px', fontFamily:'Manrope, sans-serif' } }, c.subject),
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
}, style:btnS('#cba258') }, '저장'),
React.createElement('button', { onClick:()=>setEditingCourse(editingCourse===c.id?null:c.id), style:btnS('#2b5148') }, editingCourse===c.id?'닫기':'편집'),
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
React.createElement('div', { style:{ borderTop:'2px solid #d4e9e2', paddingTop:'14px', marginTop:'4px' } },
React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' } },
React.createElement('label', { style:{ fontSize:'13px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, '온라인 강의 목록'),
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
React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, (idx+1)+'강'),
React.createElement('input', { value:lec.title||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,title:val}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({title:e.target.value}).eq('id',lec.id); }, placeholder:'강의 제목', style:{...inputS,marginBottom:0,flex:1} }),
React.createElement('button', { onClick:async function(){ await window.supabase.from('videos').delete().eq('id',lec.id); setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.filter(function(l){ return l.id!==lec.id; })}:x; })}; }); }, style:{...btnOutS,padding:'4px 10px',fontSize:'12px'} }, '삭제')
),
React.createElement('input', { value:lec.youtubeId||'', onChange:function(e){ var val=e.target.value; setState(function(s){ return {...s,courses:s.courses.map(function(x){ return x.id===c.id?{...x,lectures:x.lectures.map(function(l){ return l.id===lec.id?{...l,youtubeId:val,videoUrl:adminLectureVideoUrl({ youtube_id: val })}:l; })}:x; })}; }); }, onBlur:async function(e){ await window.supabase.from('videos').update({youtube_id:adminExtractYoutubeId(e.target.value)}).eq('id',lec.id); }, placeholder:'YouTube 링크/ID 또는 시놀로지 영상 URL', style:{...inputS,marginBottom:0,fontSize:'12px'} })
);
})
)
)
)
)
)
),

/* ── 수강생 관리 TAB ── */
tab==='enrollee' && React.createElement('div', null,
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'16px' } },
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginRight:'8px', flexShrink:0 } },
`수강생 관리 (${dbStudents.length}명)`),

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
)
),

selectedIds.length > 0 && React.createElement('div', { style:{ background:'#1E3932', borderRadius:'10px', padding:'12px 16px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' } },
React.createElement('span', { style:{ fontSize:'13px', fontWeight:'700', color:'#fff', fontFamily:'Manrope, sans-serif' } }, `${selectedIds.length}명 선택됨`),
React.createElement('select', {
value: bulkGrade,
onChange: function(e) { setBulkGrade(e.target.value); },
style:{ border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '학년 일괄 변경'),
['1학년','2학년','3학년','4학년','5학년','6학년','중1','중2','중3','고1','고2','고3'].map(function(g){ return React.createElement('option',{key:g,value:g},g); })
),
React.createElement('select', {
value: bulkSchool,
onChange: function(e) { setBulkSchool(e.target.value); },
style:{ border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', fontFamily:'Manrope, sans-serif', background:'rgba(255,255,255,0.15)', color:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '학교 일괄 변경'),
SCHOOLS.filter(function(s){ return s !== '전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
),
React.createElement('button', {
onClick: async function() {
if (!bulkGrade && !bulkSchool) { alert('변경할 학년 또는 학교를 선택하세요.'); return; }
var updates = {};
if (bulkGrade) updates.grade = bulkGrade;
if (bulkSchool) updates.school = bulkSchool;
for (var i = 0; i < selectedIds.length; i++) {
await sb.from('students').update(updates).eq('id', selectedIds[i]);
}
setDbStudents(function(prev) {
return prev.map(function(s) {
if (!selectedIds.includes(s.id)) return s;
return Object.assign({}, s, bulkGrade?{grade:bulkGrade}:{}, bulkSchool?{school:bulkSchool}:{});
});
});
setBulkGrade(''); setBulkSchool(''); setSelectedIds([]);
alert('저장 완료!');
},
style:{ background:'#00754A', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '일괄 저장'),
React.createElement('button', {
onClick: async function() {
if (!confirm(`선택한 ${selectedIds.length}명을 삭제할까요?`)) return;
for (var i = 0; i < selectedIds.length; i++) {
await sb.from('students').delete().eq('id', selectedIds[i]);
}
setDbStudents(function(prev) { return prev.filter(function(s){ return !selectedIds.includes(s.id); }); });
setDbMembers(function(prev) { return prev.filter(function(m){ return !selectedIds.includes(m.id); }); });
setSelectedIds([]);
},
style:{ background:'#c82014', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '삭제'),
React.createElement('button', {
onClick: function() { setSelectedIds([]); setBulkGrade(''); setBulkSchool(''); },
style:{ background:'transparent', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
}, '취소')
),

(function() {
var filtered = dbStudents.filter(function(st) {
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
style:{ width:'18px', height:'18px', borderRadius:'4px', border: allSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: allSelected?'#1E3932':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
},
allSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
)
),
React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, `전체 선택 (${filtered.length}명)`)
),
filtered.map(function(st) {
var isSelected = selectedIds.includes(st.id);
return React.createElement('div', { key:st.id, style:{ ...cardS, border: isSelected?'2px solid #1E3932':'2px solid transparent', transition:'border 0.15s' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
React.createElement('div', {
onClick: function() { setSelectedIds(function(prev){ return isSelected?prev.filter(function(i){ return i!==st.id; }):[...prev,st.id]; }); },
style:{ width:'18px', height:'18px', borderRadius:'4px', border: isSelected?'none':'1.5px solid rgba(0,0,0,0.25)', background: isSelected?'#1E3932':'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }
},
isSelected && React.createElement('svg', { width:'11', height:'11', viewBox:'0 0 12 12', fill:'none' },
React.createElement('path', { d:'M2 6l3 3 5-5', stroke:'#fff', strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' })
)
),
React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
React.createElement('div', { style:{ flex:1, minWidth:0, cursor:'pointer' }, onClick:function(){ setExpandedStudent(expandedStudent===st.id?null:st.id); } },
React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [st.school, st.grade, st.phone].filter(Boolean).join(' · ') || '정보 없음')
),
React.createElement('div', { style:{ display:'flex', gap:'5px', flexWrap:'wrap' } },
st.grade && React.createElement('span', { style:{ background:'#1E3932', color:'#fff', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
(st.subjects||[]).map(function(sub){ return React.createElement('span', { key:sub, style:{ background:'#d4e9e2', color:'#006241', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, sub); })
),
React.createElement('span', {
onClick: function() { setExpandedStudent(expandedStudent===st.id?null:st.id); },
style:{ fontSize:'18px', color:'rgba(0,0,0,0.3)', cursor:'pointer', transition:'transform 0.2s', transform: expandedStudent===st.id?'rotate(180deg)':'none', flexShrink:0 }
}, '▾')
),
expandedStudent===st.id && React.createElement('div', { style:{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(0,0,0,0.08)' } },
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' } },
React.createElement('span', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, '학년'),
React.createElement('select', {
value: st.grade || '',
onChange: function(e) { updateStudentGrade(st.id, e.target.value || null); },
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
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
},
style:{ border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', fontFamily:'Manrope, sans-serif', background:'#fff', outline:'none', cursor:'pointer' }
},
React.createElement('option', { value:'' }, '선택'),
SCHOOLS.filter(function(s){ return s!=='전체'; }).map(function(s){ return React.createElement('option',{key:s,value:s},s); })
)
),
React.createElement('div', { style:{ display:'flex', gap:'24px', flexWrap:'wrap', marginBottom:'14px', padding:'12px 14px', background:'#f9f9f9', borderRadius:'8px' } },
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'4px', letterSpacing:'0.04em', textTransform:'uppercase' } }, '학생 전화번호'),
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.phone || '미입력')
),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginBottom:'4px', letterSpacing:'0.04em', textTransform:'uppercase' } }, '학부모 전화번호'),
React.createElement('div', { style:{ fontSize:'14px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.parent_phone || '미입력')
)
),
React.createElement('div', { style:{ marginBottom:'14px' } },
React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 과목'),
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' } },
SUBJECTS.map(function(sub) {
return React.createElement('button', { key:sub, onClick:function(){ toggleSubject(st.id, sub); },
style:{ background:(st.subjects||[]).includes(sub)?'#006241':'#f2f0eb', color:(st.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.7)', border:(st.subjects||[]).includes(sub)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub);
}),
React.createElement('button', {
  onClick: function(){ setAddCourseStudentId(addCourseStudentId===st.id ? null : st.id); setAcSubject('전체'); setAcLevel('전체'); setAcGrade('전체'); setAcTeacher('전체'); setAcName(''); },
  style:{ background: addCourseStudentId===st.id?'#1E3932':'#f2f0eb', color: addCourseStudentId===st.id?'#fff':'rgba(0,0,0,0.6)', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' }
}, addCourseStudentId===st.id ? '강좌 닫기' : '+ 추가 강좌')
)
),
React.createElement('div', null,
// 현재 수강 중인 강좌 (칩 형태)
React.createElement('label', { style:{ ...labelS, marginBottom:'8px' } }, '수강 강좌'),
st.enrolledCourses.length === 0
? React.createElement('p', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.4)', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '배정된 강좌 없음')
: React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' } },
    st.enrolledCourses.map(function(cid) {
      var course = state.courses.find(function(c){ return c.id===cid; });
      if (!course) return null;
      return React.createElement('div', { key:cid, style:{ display:'flex', alignItems:'center', gap:'5px', background:'#d4e9e2', borderRadius:'20px', padding:'4px 10px 4px 12px' } },
        React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif' } }, course.name + (course.grade?' ('+course.grade+')':'')),
        React.createElement('button', { onClick:function(){ toggleEnroll(st.id, cid); }, style:{ background:'none', border:'none', cursor:'pointer', color:'#006241', fontSize:'14px', lineHeight:1, padding:'0 2px', fontWeight:'700' } }, '×')
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
        return React.createElement('div', { key:c.id, style:{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:'8px', padding:'8px 12px', border: enrolled?'1.5px solid #006241':'1px solid #e5e7eb' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, c.name),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [c.subject, c.grade, c.teacher].filter(Boolean).join(' · '))
          ),
          React.createElement('button', {
            onClick: function(){ toggleEnroll(st.id, c.id); },
            style:{ background: enrolled?'#c82014':'#006241', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
          }, enrolled?'배정 해제':'배정')
        );
      });
    })()
  )
)
)
)
);
})
);
})()
),

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
var roleBg    = m.role==='teacher'?'#d4e9e2': m.role==='parent'?'#fff3cd': m.isEnrollee?'#e8f4fd':'#f2f0eb';
var roleColor = m.role==='teacher'?'#006241': m.role==='parent'?'#856404': m.isEnrollee?'#0066cc':'rgba(0,0,0,0.45)';
var isEnrolleeParent = m.role==='parent' && dbMembers.some(function(s){ return s.role==='student'&&s.isEnrollee&&s.parentId===m.id; });
var roleLabel = m.role==='teacher'?'선생님': m.role==='parent'?(isEnrolleeParent?'수강생 학부모':'학부모'): m.isEnrollee?'수강생':'일반회원';
var isEditing = editingMember === m.id;
return React.createElement('div', { key:m.id, style:{ ...cardS, padding:'12px 16px', border: isEditing?'2px solid #006241':'2px solid transparent', transition:'border 0.15s' } },
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
style:{ background: isEditing?'#006241':'transparent', color: isEditing?'#fff':'rgba(0,0,0,0.4)', border:'1px solid '+(isEditing?'#006241':'rgba(0,0,0,0.15)'), borderRadius:'5px', padding:'3px 8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
}, style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '승인'),
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
React.createElement('button', { onClick:()=>approveTeacher(t.id), style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '승인'),
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
React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' } },
React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
React.createElement('div', { style:{ width:'42px', height:'42px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' } }, '선생'),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, t.name),
React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, t.email)
),
React.createElement('div', { style:{ display:'inline-block', background:'#d4e9e2', color:'#006241', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, '승인됨')
),
React.createElement('button', { onClick:()=>rejectTeacher(t.id), style:{ background:'transparent', color:'#c82014', border:'1px solid #c82014', borderRadius:'8px', padding:'5px 12px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '계정 삭제')
),
React.createElement('div', null,
React.createElement('div', { style:{ fontSize:'11px', fontWeight:'700', color:'rgba(0,0,0,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Manrope, sans-serif', marginBottom:'8px' } }, '담당 과목 배정'),
React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
SUBJECTS.map(sub =>
React.createElement('button', { key:sub, onClick:()=>toggleTeacherSubject(t.id, sub),
style:{ background: (t.subjects||[]).includes(sub)?'#006241':'#f2f0eb', color: (t.subjects||[]).includes(sub)?'#fff':'rgba(0,0,0,0.55)', border: (t.subjects||[]).includes(sub)?'2px solid #006241':'2px solid transparent', borderRadius:'8px', padding:'7px 18px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif', transition:'all 0.2s ease' } }, sub)
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
    React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', marginBottom:'10px' } }, sub),

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
            style:{ background:selected?'#006241':'#fff', color:selected?'#fff':'rgba(0,0,0,0.62)', border:selected?'2px solid #006241':'1.5px solid #d6dbde', borderRadius:'999px', padding:'6px 11px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
        style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
              style:{ background:'#1E3932', color:'#fff', border:'none', borderRadius:'999px', padding:'5px 10px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
        style:{ background:'#006241', color:'#fff', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer', fontFamily:'Manrope, sans-serif' }
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
              return React.createElement('div', { key:sid, style:{ background:'#d4e9e2', borderRadius:'20px', padding:'4px 12px', display:'flex', alignItems:'center', gap:'6px' } },
                React.createElement('span', { style:{ fontSize:'12px', fontWeight:'700', color:'#006241', fontFamily:'Manrope, sans-serif' } }, stu.name + (stu.grade?' ('+stu.grade+')':'')),
                React.createElement('button', { onClick: function(){ removeStudentFromClass(cls.id, sid); }, style:{ background:'none', border:'none', cursor:'pointer', color:'#006241', fontSize:'14px', lineHeight:1, fontWeight:'700' } }, '×')
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
                    React.createElement('span', { style:{ marginLeft:'auto', color:'#006241', fontWeight:'800' } }, '+ 추가')
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
  var cardVal = { fontSize:'18px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' };

  function summaryCards() {
    return React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', marginBottom:'14px' } },
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } },
        React.createElement('div', { style:cardVal }, lastAvg != null ? lastAvg.toFixed(1)+'점' : '-'),
        React.createElement('div', { style:cardLabel }, '이번 시험 평균'),
        avgChange != null && React.createElement('div', { style:{ fontSize:'11px', marginTop:'4px', fontWeight:'700', color: avgChange >= 0 ? '#006241' : '#c82014', fontFamily:'Manrope, sans-serif' } }, (avgChange >= 0 ? '▲ ' : '▼ ') + Math.abs(avgChange).toFixed(1) + '점 (전회 대비)')
      ),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, lastMax!=null ? lastMax+'점' : '-'), React.createElement('div',{style:cardLabel}, '이번 시험 최고점')),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, lastMin!=null ? lastMin+'점' : '-'), React.createElement('div',{style:cardLabel}, '이번 시험 최저점')),
      React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'14px', textAlign:'center' } }, React.createElement('div',{style:cardVal}, (lastTakers||'-')+'명'), React.createElement('div',{style:cardLabel}, '응시 인원'))
    );
  }
  function gradeBucketsRow() {
    var defs = [
      { label:'1등급(90+)', val: buckets.g1, color:'#006241' },
      { label:'2등급(80+)', val: buckets.g2, color:'#2b5148' },
      { label:'3등급(70+)', val: buckets.g3, color:'#cba258' },
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
            var color = l === '90-100' ? '#006241' : l === '80-89' ? '#2b5148' : l === '70-79' ? '#cba258' : l === '60-69' ? '#dd6b20' : '#c82014';
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
        React.createElement('path', { d:pathD, fill:'none', stroke:'#006241', strokeWidth:'2.5' }),
        ys.map(function(y, i){ return y == null ? null : React.createElement('g', { key:i },
          React.createElement('circle', { cx:xs[i], cy:y, r:'4', fill:'#006241' }),
          React.createElement('text', { x:xs[i], y:y-8, textAnchor:'middle', fontSize:'11', fontWeight:'700', fill:'#006241' }, avgs[i].toFixed(1)),
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
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#006241', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '📈 가장 많이 오른 학생 TOP 3'),
          topUp.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : topUp.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#006241',fontWeight:'700'}}, '+'+s.change.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#fef2f2', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#c82014', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '📉 가장 많이 떨어진 학생 TOP 3'),
          topDown.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : topDown.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#c82014',fontWeight:'700'}}, s.change.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#006241', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '⭐ 꾸준히 상위권'),
          stars.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : stars.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name + ' ', React.createElement('span',{style:{color:'#006241',fontWeight:'700'}}, '평균 '+s.avg.toFixed(1)+'점')); })
        ),
        React.createElement('div', { style:{ background:'#fff7ed', borderRadius:'10px', padding:'12px' } },
          React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#c2410c', marginBottom:'8px', fontFamily:'Manrope, sans-serif' } }, '⚠️ 최근 3회 연속 하락'),
          watch.length === 0 ? React.createElement('div',{style:{ fontSize:'12px', color:'#9ca3af' }}, '해당 없음') : watch.map(function(s){ return React.createElement('div', { key:s.id, style:{ fontSize:'12px', color:'#374151', marginBottom:'2px', fontFamily:'Manrope, sans-serif' } }, s.name); })
        )
      ),
      React.createElement('div', { style:{ marginTop:'10px' } },
        React.createElement('div', { style:{ fontSize:'12px', fontWeight:'800', color:'#374151', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '학생별 평균 누적 순위'),
        ranked.map(function(s, i){ return React.createElement('div', { key:s.id, style:{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', borderBottom: i < ranked.length-1 ? '1px solid #f3f4f6' : 'none' } },
          React.createElement('span', { style:{ width:'24px', fontSize:'12px', fontWeight:'700', color: i<3?'#006241':'#9ca3af', fontFamily:'Manrope, sans-serif' } }, (i+1)+'위'),
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
          React.createElement('path', { d:pathD, fill:'none', stroke:'#cba258', strokeWidth:'2.5' }),
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
      var aiComment = adminGenerateComment({
        studentName: r.name, score: lastScore, prevScore: prevScore, classAvg: lastAvg, recentTrend: trendVals,
        subject: r.last ? r.last.subject : '', testName: r.last ? r.last.test_name : ''
      });
      return React.createElement('div', { key:r.id, style:{ marginBottom:'12px', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden' } },
        React.createElement('div', { style:{ background:'#1E3932', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' } },
          React.createElement('div', null,
            React.createElement('span', { style:{ fontWeight:'800', color:'#fff', fontSize:'14px', fontFamily:'Manrope, sans-serif' } }, r.name),
            r.grade && React.createElement('span', { style:{ color:'rgba(255,255,255,0.6)', fontSize:'12px', marginLeft:'8px', fontFamily:'Manrope, sans-serif' } }, r.grade),
            React.createElement('span', { style:{ color:'rgba(255,255,255,0.85)', fontSize:'12px', marginLeft:'12px', fontFamily:'Manrope, sans-serif' } }, r.scores.length + '회 · 평균 ' + (r.avg != null ? r.avg.toFixed(1)+'점' : '-'))
          ),
          React.createElement('div', { style:{ display:'flex', gap:'6px' } },
            React.createElement('button', { onClick:function(){ setReportStudentId(r.id); }, style:{ background:'#fff', color:'#1E3932', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '📄 학부모 리포트'),
            React.createElement('button', { onClick:function(){ setKakaoTarget({ mode:'single', students:[{ id:r.id, name:r.name, last:r.last, prev:r.prev, parent_phone:r.parent_phone }] }); }, style:{ background:'#cba258', color:'#fff', border:'none', borderRadius:'6px', padding:'4px 10px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '📨 알림톡')
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
                React.createElement('div', { style:{ fontSize:'11px', fontWeight:'800', color:'#7a5c0e', marginBottom:'4px', fontFamily:'Manrope, sans-serif' } }, '🤖 AI 자동 코멘트 (학부모 전달용)'),
                React.createElement('div', { style:{ fontSize:'13px', color:'#374151', lineHeight:'1.6', fontFamily:'Manrope, sans-serif' } }, aiComment)
              )
            ]
        )
      );
    });
  }
  function paperPlaceholder() {
    return React.createElement('div', { style:{ marginTop:'24px', padding:'18px', background:'#f9fafb', border:'1px dashed #d6dbde', borderRadius:'12px', textAlign:'center' } },
      React.createElement('div', { style:{ fontSize:'14px', fontWeight:'800', color:'#374151', marginBottom:'6px', fontFamily:'Manrope, sans-serif' } }, '📋 시험지 분석'),
      React.createElement('div', { style:{ fontSize:'12px', color:'#6b7280', marginBottom:'10px', fontFamily:'Manrope, sans-serif' } }, '문제별 정답률 · 유형별 취약점 · 학생별 약점 개념 · 학습 우선순위 제안'),
      React.createElement('button', { disabled:true, style:{ background:'#e5e7eb', color:'#9ca3af', border:'none', borderRadius:'6px', padding:'8px 16px', fontSize:'12px', fontWeight:'700', cursor:'not-allowed', fontFamily:'Manrope, sans-serif' } }, '시험지 PDF 업로드 (준비 중)'),
      React.createElement('div', { style:{ fontSize:'11px', color:'#9ca3af', marginTop:'8px', fontFamily:'Manrope, sans-serif' } }, '시험지 분석 기능은 준비 중입니다.')
    );
  }
  function bulkButton() {
    return React.createElement('div', { style:{ display:'flex', justifyContent:'flex-end', gap:'8px', marginBottom:'12px' } },
      React.createElement('button', { onClick:function(){ setKakaoTarget({ mode:'bulk', students: rows.map(function(r){ return { id:r.id, name:r.name, last:r.last, prev:r.prev, parent_phone:r.parent_phone }; }) }); }, style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#1E3932', fontFamily:'Manrope, sans-serif' } }, '📨 전체 학부모 일괄 발송')
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

      return React.createElement('div', { key:st.id, style:{ ...cardS, border: isOpen?'2px solid #1E3932':'2px solid transparent', transition:'border 0.15s' } },
        React.createElement('div', {
          style:{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
          onClick: function(){
            if (isOpen) { setViewsExpandedId(null); }
            else { setViewsExpandedId(st.id); loadStudentViews(st.id); }
          }
        },
          React.createElement('div', { style:{ width:'36px', height:'36px', borderRadius:'50%', background:'#d4e9e2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif', flexShrink:0 } }, st.name[0]),
          React.createElement('div', { style:{ flex:1, minWidth:0 } },
            React.createElement('div', { style:{ fontSize:'15px', fontWeight:'700', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif' } }, st.name),
            React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif' } }, [st.school, st.grade, st.phone].filter(Boolean).join(' · ') || '정보 없음')
          ),
          st.grade && React.createElement('span', { style:{ background:'#1E3932', color:'#fff', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:'700', fontFamily:'Manrope, sans-serif' } }, st.grade),
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
                    React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, item.val),
                    React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)', fontFamily:'Manrope, sans-serif', marginTop:'3px' } }, item.label)
                  );
                })
              ),
              Object.values(byCourse).map(function(group, gi) {
                var groupCompleted = group.videos.filter(function(v){ return v.progress_pct >= 90; }).length;
                return React.createElement('div', { key:gi, style:{ marginBottom:'10px', border:'1px solid #e5e7eb', borderRadius:'10px', overflow:'hidden' } },
                  React.createElement('div', { style:{ background:'#1E3932', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' } },
                    React.createElement('span', { style:{ fontWeight:'800', color:'#fff', fontSize:'13px', fontFamily:'Manrope, sans-serif' } }, group.title + (group.subject ? ' · ' + group.subject : '')),
                    React.createElement('span', { style:{ color:'rgba(255,255,255,0.7)', fontSize:'11px', fontFamily:'Manrope, sans-serif' } }, groupCompleted + '/' + group.videos.length + '강 완료')
                  ),
                  React.createElement('div', { style:{ padding:'10px 14px' } },
                    group.videos.map(function(v, vi) {
                      var pct = v.progress_pct || 0;
                      var color = pct >= 90 ? '#006241' : pct >= 50 ? '#cba258' : '#e5e7eb';
                      var textColor = pct >= 90 ? '#006241' : pct >= 50 ? '#cba258' : 'rgba(0,0,0,0.3)';
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

/* ── 섹션 편집 TAB ── */
tab==='feature' && React.createElement('div', null,
React.createElement('h2', { style:{ fontSize:'18px', fontWeight:'800', color:'rgba(0,0,0,0.87)', fontFamily:'Manrope, sans-serif', marginBottom:'20px' } }, '홍보 섹션 편집'),
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
React.createElement('div', { style:{ marginTop:'20px', padding:'16px', background:'#d4e9e2', borderRadius:'8px' } },
React.createElement('p', { style:{ fontSize:'13px', color:'#006241', fontFamily:'Manrope, sans-serif', fontWeight:'600' } }, '✓ 변경사항은 자동으로 저장됩니다. 홈 화면에서 바로 확인하세요.')
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
  var aiC = adminGenerateComment({ studentName:name, score: last ? Number(last.score) : null, prevScore: prev ? Number(prev.score) : null, classAvg: null, recentTrend: vals, subject: last ? last.subject : '', testName: last ? last.test_name : '' });
  return React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' } },
    React.createElement('div', { style:{ background:'#fff', borderRadius:'12px', padding:'24px', maxWidth:'640px', width:'100%', maxHeight:'90vh', overflowY:'auto' } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' } },
        React.createElement('h2', { style:{ margin:0, fontFamily:'Manrope, sans-serif' } }, '학부모 전달용 리포트'),
        React.createElement('div', { style:{ display:'flex', gap:'6px' } },
          React.createElement('button', { onClick:function(){ window.print(); }, style:{ background:'#fff', color:'#1E3932', border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '🖨 인쇄/PDF'),
          React.createElement('button', { onClick:function(){ setReportStudentId(''); }, style:{ background:'#fff', color:'#1E3932', border:'1px solid #d6dbde', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '닫기')
        )
      ),
      React.createElement('div', { style:{ borderTop:'2px solid #006241', paddingTop:'14px' } },
        React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800', color:'#1E3932', fontFamily:'Manrope, sans-serif' } }, name + ' ', grade && React.createElement('span', { style:{ fontSize:'13px', color:'#6b7280', marginLeft:'8px' } }, grade)),
        React.createElement('div', { style:{ fontSize:'12px', color:'#9ca3af', marginBottom:'14px', fontFamily:'Manrope, sans-serif' } }, '발행일: ' + new Date().toISOString().slice(0,10) + ' · B2빅뱅학원'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' } },
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, last ? last.score+'점' : '-'),
            React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '최근 점수')
          ),
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, avgPersonal != null ? avgPersonal.toFixed(1)+'점' : '-'),
            React.createElement('div', { style:{ fontSize:'11px', color:'#6b7280', fontFamily:'Manrope, sans-serif' } }, '개인 평균')
          ),
          React.createElement('div', { style:{ background:'#f9fafb', borderRadius:'8px', padding:'10px', textAlign:'center' } },
            React.createElement('div', { style:{ fontSize:'16px', fontWeight:'800', color:'#006241', fontFamily:'Manrope, sans-serif' } }, allScoresForStudent.length+'회'),
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
    var comment = adminGenerateComment({ studentName: s.name || stu.name, score: lastScore, prevScore: prevScore, classAvg: null, recentTrend: allScores, subject: s.last ? s.last.subject : '', testName: s.last ? s.last.test_name : '' });
    var msg = adminFormatKakao({ studentName: s.name || stu.name, testName: s.last ? s.last.test_name : '-', testDate: s.last ? s.last.test_date : '-', score: lastScore, prevScore: prevScore, comment: comment });
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
        React.createElement('button', { onClick:function(){ setKakaoTarget(null); }, style:{ border:'1px solid #d6dbde', background:'#fff', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', color:'#1E3932', fontFamily:'Manrope, sans-serif' } }, '취소'),
        React.createElement('button', { onClick: async function(){
          var rows = items.map(function(it){ return { student_id: it.student_id || null, parent_phone: it.parent_phone || null, message_content: it.message_content || '', test_score_id: it.test_score_id || null, sent_by: null, sent_at: null, status: 'pending' }; });
          var { error } = await window.supabase.from('notification_logs').insert(rows);
          if (error) { alert('발송 이력 저장 실패: ' + error.message); return; }
          alert('알림톡 연동 준비 중입니다.\n발송 이력은 저장되었습니다 (상태: 미발송).');
          setKakaoTarget(null);
        }, style:{ background:'#cba258', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '📨 발송 이력 저장')
      )
    )
  );
})()

);
}

Object.assign(window, { AdminPanel });
