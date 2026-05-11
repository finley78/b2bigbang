// Utils.jsx — 공통 유틸 (window.B2Utils로 노출)
// TeacherPortal/AdminPanel/index.html에서 중복되던 함수들을 한 곳으로 통합

(function(){
  function extractYoutubeId(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    var match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    if (match && match[1]) return match[1];
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return raw;
    return raw;
  }

  function lectureVideoUrl(v) {
    var raw = String((v && (v.video_url || v.youtube_id)) || '').trim();
    if (!raw) return '';
    if (/youtube\.com|youtu\.be/i.test(raw)) return raw;
    if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) return 'https://www.youtube.com/watch?v=' + raw;
    return raw;
  }

  function generateComment(args) {
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

  function formatKakao(args) {
    var lines = [];
    lines.push('[B2빅뱅학원] 성적 안내'); lines.push('');
    lines.push((args.studentName || '학생') + ' 학생 성적 안내드립니다.'); lines.push('');
    lines.push('- 시험명: ' + (args.testName || '-'));
    lines.push('- 응시일: ' + (args.testDate || '-'));
    lines.push('- 점수: ' + (args.score != null ? args.score + '점' : '-'));
    if (args.prevScore != null) {
      var diff = Number(args.score) - Number(args.prevScore);
      lines.push('- 전회 대비: ' + (diff >= 0 ? '+' : '') + diff + '점');
    } else {
      lines.push('- 전회 대비: -');
    }
    lines.push('');
    var summary = String(args.comment || '').split('. ').slice(0,2).join('. ');
    if (summary && !summary.endsWith('.')) summary += '.';
    lines.push(summary || '자세한 내용은 학원으로 문의해 주세요.'); lines.push('');
    lines.push('자세한 내용은 학원으로 문의해 주세요.'); lines.push('☎ 학원 연락처');
    return lines.join('\n');
  }

  // ── 음성 답안 (학생 녹음 제출) ─────────────────────────────────
  // 모든 음성 업로드/재생 URL은 이 helper를 통과시킨다.
  // 나중에 시놀로지로 옮길 때 이 두 함수의 내부만 바꾸면 호출하는 코드는 한 줄도 안 바뀜.
  async function uploadAudioBlob(blob, examId, studentId) {
    var sb = window.supabase;
    if (!sb) return { path:null, error:new Error('supabase 미초기화') };
    if (!blob || !examId || !studentId) return { path:null, error:new Error('인자 누락') };
    var ext = (blob.type && blob.type.indexOf('mp4') >= 0) ? 'm4a' : 'webm';
    var path = 'exams/homework_audio/' + examId + '/' + studentId + '_' + Date.now() + '.' + ext;
    var up = await sb.storage.from('attachments').upload(path, blob, { cacheControl:'3600', upsert:false, contentType: blob.type || 'audio/webm' });
    if (up.error) return { path:null, error: up.error };
    return { path: path, error: null };
  }
  function audioPublicUrl(path) {
    if (!path) return '';
    var sb = window.supabase;
    if (!sb) return '';
    try {
      var res = sb.storage.from('attachments').getPublicUrl(path);
      return (res && res.data && res.data.publicUrl) || '';
    } catch (e) { return ''; }
  }
  async function deleteAudio(path) {
    if (!path) return { error:null };
    var sb = window.supabase;
    if (!sb) return { error:new Error('supabase 미초기화') };
    try { return await sb.storage.from('attachments').remove([path]); }
    catch (e) { return { error: e }; }
  }

  // 녹음 헬퍼 — MediaRecorder 지원 여부 확인
  function isAudioRecordingSupported() {
    return !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
  }

  // ── 학년 문자열 → 학교급 추출 ──────────────────────────────────
  // '5학년' → '초등' / '중2' → '중등' / '고1' → '고등'
  function levelFromGrade(g) {
    if (!g) return '';
    if (/^\d+학년$/.test(g)) return '초등';
    if (/^중\d$/.test(g)) return '중등';
    if (/^고\d$/.test(g)) return '고등';
    return '';
  }

  // ── 성적 분석 헬퍼 ────────────────────────────────────────────
  // 관리자/선생님이 동일한 색상·등급·구간 규칙을 사용
  function scoreGradeBucket(score) {
    var s = Number(score);
    if (isNaN(s)) return null;
    if (s >= 90) return 1; // 1등급
    if (s >= 80) return 2;
    if (s >= 70) return 3;
    return 0; // 미달
  }
  function scoreDistBucket(score) {
    var s = Number(score);
    if (isNaN(s)) return null;
    if (s >= 90) return '90-100';
    if (s >= 80) return '80-89';
    if (s >= 70) return '70-79';
    if (s >= 60) return '60-69';
    return '0-59';
  }
  function scoreColor(score) {
    var s = Number(score);
    if (isNaN(s)) return '#9ca3af';
    if (s >= 90) return '#E60012';
    if (s >= 70) return '#F8B500';
    return '#c82014';
  }

  // ── 수능 날짜 (D-day 계산용) ───────────────────────────────────
  // 입시 날짜 변경 시 이 한 곳만 갱신하면 index.html과 TopNav가 함께 따라옴
  var EXAM_DATE = '2026-11-12';

  // ── site_content 테이블 헬퍼 ──────────────────────────────────
  // key 한 개 로드/저장. select('value').eq('key',X).maybeSingle() + upsert 패턴 통합
  // 새 site_content 키가 추가될 때 호출 측이 같은 형태로 한 줄씩만 쓰면 됨
  async function loadSiteContent(key) {
    var sb = window.supabase;
    if (!sb || !key) return null;
    try {
      var { data } = await sb.from('site_content').select('value').eq('key', key).maybeSingle();
      return (data && data.value != null) ? data.value : null;
    } catch (e) {
      return null;
    }
  }
  async function saveSiteContent(key, value) {
    var sb = window.supabase;
    if (!sb || !key) return { error: new Error('supabase 미초기화 또는 key 누락') };
    return await sb.from('site_content').upsert({
      key: key,
      value: value,
      updated_at: new Date().toISOString(),
    });
  }

  // ── students row → 로그인 user 객체 ────────────────────────────
  // 이메일 로그인·OAuth 로그인 양쪽에서 동일한 enrollments + class_students 조회 후 user 객체 조립
  // 두 쿼리를 Promise.all로 병렬 실행
  async function buildUserFromStudentRow(row) {
    if (!row) return null;
    var sb = window.supabase;
    var enrollRes, classRes;
    try {
      var both = await Promise.all([
        sb.from('enrollments').select('course_id').eq('student_id', row.id).eq('is_active', true),
        sb.from('class_students').select('class_id').eq('student_id', row.id),
      ]);
      enrollRes = both[0]; classRes = both[1];
    } catch (e) { enrollRes = null; classRes = null; }
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      grade: row.grade || '',
      level: levelFromGrade(row.grade),
      subjects: row.subjects || [],
      enrolledCourses: ((enrollRes && enrollRes.data) || []).map(function(e){ return e.course_id; }),
      classIds: ((classRes && classRes.data) || []).map(function(r){ return r.class_id; }),
    };
  }

  // ── Supabase Edge Function 호출 헬퍼 ──────────────────────────
  // anonKey/Authorization 헤더 조립을 한 곳에 모음. POST + JSON body 고정.
  // 반환: { ok: boolean, status: number, data: any }
  async function callEdgeFn(name, body) {
    var sb = window.supabase;
    var anonKey = (sb && sb.supabaseKey) ? sb.supabaseKey : '';
    var base = (sb && sb.supabaseUrl) ? sb.supabaseUrl : 'https://ldsjysjavwssadheeiog.supabase.co';
    var url = base + '/functions/v1/' + name;
    var res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey },
      body: JSON.stringify(body || {}),
    });
    var data = null;
    try { data = await res.json(); } catch (e) { data = {}; }
    return { ok: res.ok, status: res.status, data: data || {} };
  }

  // ── 번호 범위 파싱: "3-5,8" -> [3,4,5,8]. 빈 문자열/잘못된 입력 -> null ──
  function parseNumberRange(str) {
    if (str == null) return null;
    if (Array.isArray(str)) {
      var arr0 = str.map(function(x){ return parseInt(String(x), 10); }).filter(function(n){ return !isNaN(n) && n > 0; });
      return arr0.length ? Array.from(new Set(arr0)).sort(function(a,b){ return a-b; }) : null;
    }
    var s = String(str).trim();
    if (!s) return null;
    var out = [];
    s.split(',').forEach(function(part){
      part = part.trim();
      var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) { var a = parseInt(m[1],10), b = parseInt(m[2],10); if (a <= b && (b - a) < 1000) for (var i=a;i<=b;i++) out.push(i); }
      else if (/^\d+$/.test(part)) out.push(parseInt(part,10));
    });
    return out.length ? Array.from(new Set(out)).sort(function(a,b){ return a-b; }) : null;
  }

  // ── 학생 약점 분석 리포트 HTML (인쇄/PDF용) ─────────────────────────────
  function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function buildStudentReportHtml(a, studentName, examTitle, opts) {
    opts = opts || {};
    var academy = opts.academy || 'B2빅뱅학원';
    var dateStr = (a && a.analyzed_at) ? String(a.analyzed_at).slice(0, 10) : new Date().toISOString().slice(0, 10);
    var score = (a && a.score != null) ? a.score : '';
    var total = (a && a.total != null) ? a.total : '';
    var pct = (a && a.percentage != null) ? a.percentage : (total ? Math.round((Number(score) / Number(total)) * 100) : '');
    var pctNum = Number(pct) || 0;
    var R = 50, CIRC = 2 * Math.PI * R;
    var dash = (Math.max(0, Math.min(100, pctNum)) / 100) * CIRC;
    var pctColor = pctNum >= 80 ? '#16a34a' : pctNum >= 60 ? '#c87000' : '#c82014';
    var byTopic = (a && Array.isArray(a.by_topic)) ? a.by_topic : [];
    var weak = (a && Array.isArray(a.weak_topics)) ? a.weak_topics : [];
    var strengths = (a && Array.isArray(a.strengths)) ? a.strengths : [];
    var wrongs = (a && Array.isArray(a.wrong_questions)) ? a.wrong_questions : [];
    var topicRows = byTopic.map(function (t) {
      var c = Number(t.correct) || 0, tt = Number(t.total) || 0;
      var r = tt ? Math.round((c / tt) * 100) : 0;
      var col = r >= 80 ? '#16a34a' : (r >= 50 ? '#c87000' : '#c82014');
      return '<tr>'
        + '<td style="padding:6px 8px;font-size:13px;color:#374151;border-bottom:1px solid #f0f0f0;">' + _esc(t.topic) + '</td>'
        + '<td style="padding:6px 8px;font-size:13px;color:#374151;white-space:nowrap;text-align:right;border-bottom:1px solid #f0f0f0;">' + c + ' / ' + tt + '</td>'
        + '<td style="padding:6px 8px;width:42%;border-bottom:1px solid #f0f0f0;"><div style="background:#e5e7eb;border-radius:4px;height:12px;overflow:hidden;"><div style="background:' + col + ';width:' + r + '%;height:12px;"></div></div></td>'
        + '<td style="padding:6px 8px;font-size:12px;color:' + col + ';font-weight:700;text-align:right;white-space:nowrap;border-bottom:1px solid #f0f0f0;">' + r + '%</td>'
        + '</tr>';
    }).join('');
    function chips(arr, bg, fg) { return arr.map(function (x) { return '<span style="display:inline-block;background:' + bg + ';color:' + fg + ';border-radius:14px;padding:3px 10px;font-size:12px;font-weight:700;margin:2px 4px 2px 0;">' + _esc(x) + '</span>'; }).join(''); }
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>학습 분석 리포트 - ' + _esc(studentName) + '</title>'
      + '<style>@page{margin:14mm;}body{font-family:"Manrope","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#1A1A1A;margin:0;padding:28px;}@media print{body{padding:0;}.noprint{display:none;}}.noprint button{font-family:inherit;}</style></head><body>'
      + '<div class="noprint" style="max-width:760px;margin:0 auto 14px;text-align:right;"><button onclick="window.print()" style="background:#1A1A1A;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;">인쇄 / PDF로 저장</button></div>'
      + '<div style="max-width:760px;margin:0 auto;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #1A1A1A;padding-bottom:12px;margin-bottom:20px;">'
        + '<div><div style="font-size:12px;color:#6b7280;font-weight:700;letter-spacing:0.1em;">' + _esc(academy) + '</div><div style="font-size:22px;font-weight:800;margin-top:4px;">학습 분석 리포트</div></div>'
        + '<div style="text-align:right;font-size:13px;color:#374151;"><div style="font-size:15px;"><strong>' + _esc(studentName || '-') + '</strong></div><div>' + _esc(examTitle || '') + '</div><div style="color:#9ca3af;">' + _esc(dateStr) + '</div></div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:28px;margin-bottom:22px;">'
        + '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#e5e7eb" stroke-width="14"/><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + pctColor + '" stroke-width="14" stroke-dasharray="' + dash.toFixed(1) + ' ' + CIRC.toFixed(1) + '" transform="rotate(-90 60 60)" stroke-linecap="round"/><text x="60" y="68" text-anchor="middle" font-size="24" font-weight="800" fill="#1A1A1A">' + (pct !== '' ? pct + '%' : '-') + '</text></svg>'
        + '<div><div style="font-size:13px;color:#6b7280;">객관식 자동 채점</div><div style="font-size:34px;font-weight:800;color:' + pctColor + ';margin-top:2px;">' + (score !== '' ? score : '-') + (total !== '' ? ' / ' + total : '') + '</div>' + (wrongs.length ? '<div style="font-size:12px;color:#6b7280;margin-top:6px;">틀린 문항: ' + wrongs.join(', ') + '번</div>' : '') + '</div>'
      + '</div>'
      + (a && a.summary ? '<div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-size:14px;line-height:1.7;color:#374151;white-space:pre-line;">' + _esc(a.summary) + '</div>' : '')
      + (topicRows ? '<div style="font-size:15px;font-weight:800;margin-bottom:8px;">단원·개념별 성취</div><table style="width:100%;border-collapse:collapse;margin-bottom:20px;">' + topicRows + '</table>' : '')
      + ((weak.length || strengths.length) ? '<div style="display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;">'
          + (weak.length ? '<div style="flex:1;min-width:240px;"><div style="font-size:13px;font-weight:800;color:#c82014;margin-bottom:6px;">보완이 필요한 부분</div>' + chips(weak, '#fee2e2', '#991b1b') + '</div>' : '')
          + (strengths.length ? '<div style="flex:1;min-width:240px;"><div style="font-size:13px;font-weight:800;color:#15803d;margin-bottom:6px;">잘하고 있는 부분</div>' + chips(strengths, '#dcfce7', '#166534') + '</div>' : '')
        + '</div>' : '')
      + (a && a.mistake_pattern ? '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;margin-bottom:20px;"><div style="font-size:13px;font-weight:800;color:#92400e;margin-bottom:4px;">실수 패턴</div><div style="font-size:13px;color:#92400e;line-height:1.6;white-space:pre-line;">' + _esc(a.mistake_pattern) + '</div></div>' : '')
      + (a && a.text_feedback ? '<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:12px 14px;margin-bottom:20px;"><div style="font-size:13px;font-weight:800;color:#6d28d9;margin-bottom:4px;">서술형 답안 평가</div><div style="font-size:13px;color:#5b21b6;line-height:1.6;white-space:pre-line;">' + _esc(a.text_feedback) + '</div></div>' : '')
      + (a && a.recommendation ? '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-bottom:20px;"><div style="font-size:14px;font-weight:800;color:#1e40af;margin-bottom:6px;">추천 학습 방향</div><div style="font-size:14px;color:#1e3a8a;line-height:1.7;white-space:pre-line;">' + _esc(a.recommendation) + '</div></div>' : '')
      + '<div style="font-size:11px;color:#9ca3af;text-align:center;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;">본 리포트는 AI가 학생의 답안과 시험 문항 분석을 바탕으로 자동 생성한 참고 자료입니다. · ' + _esc(academy) + '</div>'
      + '</div></body></html>';
  }
  function printStudentReport(a, studentName, examTitle, opts) {
    if (!a) { alert('분석 결과가 없습니다. 먼저 AI 약점 분석을 실행해 주세요.'); return; }
    var html = buildStudentReportHtml(a, studentName, examTitle, opts);
    var w = window.open('', '_blank');
    if (!w) { alert('팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러주세요.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  // ── 인증 스토리지 정리 ─────────────────────────────────────────
  // 로그아웃·탈퇴·세션 만료 등에서 동일하게 호출. b2_page는 페이지 상태라 sessionStorage 유지
  // 새 인증 키가 추가되면 여기 한 곳만 갱신하면 됨 (stale 세션 방지)
  function clearAuthStorage() {
    try {
      localStorage.removeItem('b2_user');
      localStorage.removeItem('b2_is_admin');
      localStorage.removeItem('b2_admin_authed');
      localStorage.removeItem('b2_hidden_at');
      sessionStorage.removeItem('b2_page');
      // Supabase auth 토큰까지 제거 — 안 그러면 페이지 reload 시
      // onAuthStateChange가 SIGNED_IN으로 자동 복원해 다시 로그인됨
      var sbKeys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0) sbKeys.push(k);
      }
      sbKeys.forEach(function(k){ try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
  }

  // ── 모바일 뷰포트 판정 ─────────────────────────────────────────
  // width < 768 OR PWA standalone 모드 → 모바일 디자인 사용
  // PWA가 가로 회전돼도(가로 폭이 768+) standalone이면 모바일 레이아웃을 유지
  function isMobileViewport() {
    if (typeof window === 'undefined') return false;
    try {
      if (window.innerWidth < 768) return true;
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone === true) return true;
    } catch (e) {}
    return false;
  }

  // React 훅 — 모든 컴포넌트가 동일한 isMobile 상태/리스너 boilerplate 대신 useIsMobile()을 호출
  // resize + display-mode 변화(PWA 설치/해제) 양쪽 모두 감지
  function useIsMobile() {
    var R = window.React;
    var s = R.useState(isMobileViewport());
    var v = s[0], setV = s[1];
    R.useEffect(function() {
      function on() { setV(isMobileViewport()); }
      window.addEventListener('resize', on);
      var mq = (window.matchMedia && window.matchMedia('(display-mode: standalone)')) || null;
      if (mq) {
        if (mq.addEventListener) mq.addEventListener('change', on);
        else if (mq.addListener) mq.addListener(on);
      }
      return function() {
        window.removeEventListener('resize', on);
        if (mq) {
          if (mq.removeEventListener) mq.removeEventListener('change', on);
          else if (mq.removeListener) mq.removeListener(on);
        }
      };
    }, []);
    return v;
  }

  // 숫자 입력칸에서 "0이 있던 자리에 10 입력" → "010" 되는 문제 방지: 뒤에 다른 숫자가 오는 앞 0들을 제거
  // 빈 문자열, "0" 단독은 그대로 둠. type="number" 입력의 onChange에 사용
  function stripLeadingZero(v) {
    var s = String(v == null ? '' : v);
    return s.replace(/^0+(\d)/, '$1');
  }

  // user.id가 UUID 형식이면 그대로, 아니면 null (관리자 로그인은 id='admin' 문자열이라 UUID 컬럼에 못 들어감)
  function safeUserId(u) {
    if (!u || !u.id) return null;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(u.id)) ? u.id : null;
  }

  // 전화번호 표시 형식 통일 (000-0000-0000)
  // 휴대폰 11자리는 3-4-4, 10자리는 3-3-4 또는 02-XXXX-XXXX, 그 외는 원본 그대로
  function formatPhone(v) {
    if (v == null || v === '') return '';
    var d = String(v).replace(/\D/g, '');
    if (d.length === 11) return d.slice(0,3) + '-' + d.slice(3,7) + '-' + d.slice(7);
    if (d.length === 10) {
      if (d.slice(0,2) === '02') return d.slice(0,2) + '-' + d.slice(2,6) + '-' + d.slice(6);
      return d.slice(0,3) + '-' + d.slice(3,6) + '-' + d.slice(6);
    }
    if (d.length === 9 && d.slice(0,2) === '02') return d.slice(0,2) + '-' + d.slice(2,5) + '-' + d.slice(5);
    if (d.length === 8) return d.slice(0,4) + '-' + d.slice(4);
    return String(v);
  }

  window.B2Utils = { extractYoutubeId, lectureVideoUrl, generateComment, formatKakao, uploadAudioBlob, audioPublicUrl, deleteAudio, isAudioRecordingSupported, isMobileViewport, useIsMobile, levelFromGrade, scoreGradeBucket, scoreDistBucket, scoreColor, clearAuthStorage, callEdgeFn, parseNumberRange, buildStudentReportHtml, printStudentReport, buildUserFromStudentRow, loadSiteContent, saveSiteContent, EXAM_DATE, stripLeadingZero, safeUserId, formatPhone };
})();
