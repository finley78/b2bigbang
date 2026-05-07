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
    lines.push('▶ 시험명: ' + (args.testName || '-'));
    lines.push('▶ 응시일: ' + (args.testDate || '-'));
    lines.push('▶ 점수: ' + (args.score != null ? args.score + '점' : '-'));
    if (args.prevScore != null) {
      var diff = Number(args.score) - Number(args.prevScore);
      lines.push('▶ 전회 대비: ' + (diff >= 0 ? '+' : '') + diff + '점');
    } else {
      lines.push('▶ 전회 대비: -');
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

  // ── 비밀번호 해시 (브라우저 native crypto SHA-256) ─────────────────
  // 'sha256:' prefix로 새 형식과 옛 평문 형식을 구분 → 자동 마이그레이션 가능
  async function hashPassword(plain) {
    if (!plain) return '';
    var enc = new TextEncoder();
    var data = enc.encode(String(plain));
    var hashBuf = await crypto.subtle.digest('SHA-256', data);
    var hashArr = Array.from(new Uint8Array(hashBuf));
    var hex = hashArr.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
    return 'sha256:' + hex;
  }
  // 입력값(plain) ↔ DB의 stored 값 비교. 새/옛 형식 모두 처리.
  async function verifyPassword(plain, stored) {
    if (!stored) return false;
    var s = String(stored);
    if (s.indexOf('sha256:') === 0) {
      var h = await hashPassword(plain);
      return h === s;
    }
    // 옛 평문 — 직접 비교 (이번 로그인이 마이그레이션 트리거가 됨)
    return s === String(plain);
  }
  // 평문이면 해시로 마이그레이션. 이미 해시면 noop.
  async function migrateIfPlain(stored, plain, studentId) {
    if (!stored || !plain || !studentId) return;
    if (String(stored).indexOf('sha256:') === 0) return;
    try {
      var sb = window.supabase;
      var h = await hashPassword(plain);
      await sb.from('students').update({ password_hash: h }).eq('id', studentId);
    } catch (e) { console.warn('비밀번호 마이그레이션 실패:', e); }
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

  window.B2Utils = { extractYoutubeId, lectureVideoUrl, generateComment, formatKakao, uploadAudioBlob, audioPublicUrl, deleteAudio, isAudioRecordingSupported, hashPassword, verifyPassword, migrateIfPlain, isMobileViewport, useIsMobile, levelFromGrade, scoreGradeBucket, scoreDistBucket, scoreColor, clearAuthStorage, callEdgeFn };
})();
