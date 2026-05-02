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

  window.B2Utils = { extractYoutubeId, lectureVideoUrl, generateComment, formatKakao };
})();
