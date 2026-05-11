// analyze-student — 학생 한 명의 시험 제출(exam_submissions)을 채점·분석. 객관식은 서버에서 정확 채점, 서술형은 Claude가 채점.
// exams.analysis(analyze-exam 결과)가 선행 필요. 모델은 항상 Sonnet(env ANALYZE_STUDENT_MODEL).
// 배포: Supabase Studio / MCP. 이 파일은 버전관리용 사본 — 실제 배포본과 어긋나면 deployed 쪽이 진실.
// 입력: { submission_id }. 출력: exam_submissions.ai_analysis = { score,total,percentage, mc_*, text_*, wrong_questions, wrong_details:[{number,topic,subtopic,student_answer,correct_answer,role,why,correct_why,intent}], diagnosis:{pattern:'trap'|'concept'|'careless'|'mixed',label,text,trap_count,concept_count,careless_count}, by_topic, weak_topics, strengths, mistake_pattern, summary, recommendation, text_feedback, text_results, analyzed_at, model } (+ text_scores)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MODEL = Deno.env.get("ANALYZE_STUDENT_MODEL") || "claude-sonnet-4-6";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}
function normAns(v: unknown): string {
  return String(v == null ? "" : v).split(",").map((x) => x.trim()).filter(Boolean).sort().join(",");
}

// choice role(전 과목 공용) → 학생 진단 분류
const TRAP_ROLES = ["매력적인 오답", "부분만 맞음", "범위·정도 오류"];        // 함정형 — 핵심에 근접
const CONCEPT_ROLES = ["흔한 오개념", "반대·모순", "무관·엉뚱", "기타 오답"];  // 개념부족형
const CARELESS_ROLES = ["계산·적용 실수"];                                    // 실수형
const DIAG_TEXT: Record<string, { label: string; text: string }> = {
  trap: { label: "함정형 — 핵심에 근접", text: "틀린 문항 대부분이 매력적인 오답에 걸린 것입니다. 개념·내용의 큰 줄기는 잡았으나 마지막 변별에서 실점하고 있습니다. 오답 선지를 정답과 비교하며 '왜 이건 안 되는가'를 따지는 훈련이 효과적입니다." },
  concept: { label: "개념부족형 — 기본기 보강 필요", text: "틀린 문항 대부분이 개념·내용을 잘못 알고 있거나 문제와 무관한 선지를 고른 것입니다. 변별 훈련보다 해당 단원·개념의 기본기를 다지는 게 먼저입니다." },
  careless: { label: "실수형 — 개념은 알지만 실행 실수", text: "틀린 문항 대부분이 계산·부호·단위·조건 적용 등 실행 단계의 실수입니다. 개념 자체는 잡혀 있으니, 풀이 과정을 또박또박 쓰고 검산하는 습관이 핵심입니다." },
  mixed: { label: "혼합형", text: "함정에 걸린 문항, 개념이 부족한 문항, 실수한 문항이 골고루 섞여 있습니다. 원인이 문항마다 다르니 아래 문항별 해설을 참고하세요." },
};

const STUDENT_TOOL = {
  name: "report_student_analysis",
  description: "한 학생의 서술형 채점과 분석 내용을 구조화해서 보고한다. (객관식 채점·점수·단원별 통계는 이미 확정되어 있으므로 제외)",
  input_schema: {
    type: "object",
    properties: {
      text_results: {
        type: "array", description: "서술형 문항별 채점 결과. 서술형이 없으면 빈 배열.",
        items: {
          type: "object",
          properties: {
            number: { type: "integer", description: "문항 번호" },
            correct: { type: "boolean", description: "모범답안의 핵심 내용을 담고 있으면 true(정답). 표현이 달라도 핵심이 맞으면 true. 절반만 맞거나 핵심이 틀리면 false. 모범답안을 알 수 없거나 판단 불가면 false." },
            reason: { type: "string", description: "정답/오답 판단 근거. 한국어 1~2문장." },
          },
          required: ["number", "correct", "reason"],
        },
      },
      weak_topics: { type: "array", description: "약한 단원/개념. 한국어.", items: { type: "string" } },
      strengths: { type: "array", description: "잘한 단원/개념. 한국어.", items: { type: "string" } },
      mistake_pattern: { type: "string", description: "실수 패턴. 오답 선지 분석(매력적인 오답·흔한 오개념·계산 실수 등)을 반영해 구체적으로. 한국어 1~3문장. 없으면 빈 문자열." },
      summary: { type: "string", description: "종합 평 (선생님 톤). 오답 선지 분석과 자동 진단을 반영해, 이 학생이 함정에 주로 걸리는지·개념 자체가 부족한지·실행 실수가 잦은지 등을 구체적으로. 한국어 2~4문장." },
      recommendation: { type: "string", description: "추천 학습 방향. 오답 유형에 맞춰 (함정 변별 훈련 / 개념·기본기 다지기 / 풀이·검산 습관 등). 한국어 2~3문장." },
      text_feedback: { type: "string", description: "서술형 답안 종합 평가 (문항별 간략히). 서술형이 없으면 빈 문자열. 한국어." },
    },
    required: ["text_results", "weak_topics", "strengths", "mistake_pattern", "summary", "recommendation", "text_feedback"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY 가 설정되지 않았습니다." }, 500);
  try {
    const body = await req.json().catch(() => ({}));
    const submission_id = body?.submission_id;
    if (!submission_id) return json({ error: "submission_id 가 필요합니다." }, 400);
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: sub, error: sErr } = await sb.from("exam_submissions").select("*").eq("id", submission_id).single();
    if (sErr || !sub) return json({ error: "제출 기록을 찾을 수 없습니다." }, 404);
    const { data: exam, error: eErr } = await sb.from("exams").select("*").eq("id", sub.exam_id).single();
    if (eErr || !exam) return json({ error: "시험을 찾을 수 없습니다." }, 404);
    const analysis = exam.analysis;
    if (!analysis || !Array.isArray(analysis.questions) || analysis.questions.length === 0) {
      return json({ error: "이 시험은 아직 문항 분석이 안 되어 있습니다. 먼저 '저장 및 문항 분석'을 실행해 주세요." }, 400);
    }
    const qs = analysis.questions as any[];
    const studentAnswers = (sub.answers && typeof sub.answers === "object") ? sub.answers as Record<string, unknown> : {};
    const studentTextAnswers = (sub.text_answers && typeof sub.text_answers === "object") ? sub.text_answers as Record<string, unknown> : {};
    const examAk = (exam.answer_key && typeof exam.answer_key === "object") ? exam.answer_key as Record<string, unknown> : {};

    // === 객관식: 서버에서 정확히 채점 ===
    let mcScore = 0, mcTotal = 0;
    const correctNums: number[] = [];
    const wrongNums: number[] = [];
    const topicAgg: Record<string, { total: number; correct: number }> = {};
    const mcLines: string[] = [];
    const textQs: any[] = [];
    qs.forEach((q) => {
      const num = (q && q.number != null && !isNaN(Number(q.number))) ? Number(q.number) : null;
      if (q && q.type === "mc" && num != null) {
        const keyAns = (examAk[String(num)] != null) ? examAk[String(num)] : (q.answer != null ? q.answer : "");
        const ka = normAns(keyAns);
        if (!ka || ka === "확인 필요") {
          mcLines.push(`${num}번 [객관식] 단원:${q.topic || ""} | 정답 확인 불가(채점 제외) | 학생답:${studentAnswers[String(num)] != null ? studentAnswers[String(num)] : "(미응답)"}`);
          return;
        }
        mcTotal += 1;
        const topic = String(q.topic || "기타");
        if (!topicAgg[topic]) topicAgg[topic] = { total: 0, correct: 0 };
        topicAgg[topic].total += 1;
        const myRaw = studentAnswers[String(num)] != null ? studentAnswers[String(num)] : studentAnswers[num as unknown as string];
        const my = normAns(myRaw);
        const ok = my !== "" && my === ka;
        if (ok) { mcScore += 1; correctNums.push(num); topicAgg[topic].correct += 1; }
        else { wrongNums.push(num); }
        mcLines.push(`${num}번 [객관식] 단원:${q.topic || ""}${q.subtopic ? " / " + q.subtopic : ""} | 정답:${ka} | 학생답:${myRaw != null ? myRaw : "(미응답)"} | 결과:${ok ? "정답" : "오답"}`);
      } else if (q && q.type === "text" && num != null) {
        textQs.push(q);
      }
    });

    // === 오답 선지 분석 (exam.analysis.questions[].choice_explanations 기반) ===
    const wrongDetails: any[] = [];
    let trapCnt = 0, conceptCnt = 0, carelessCnt = 0;
    qs.forEach((q) => {
      if (!q || q.type !== "mc") return;
      const num = (q.number != null && !isNaN(Number(q.number))) ? Number(q.number) : null;
      if (num == null || !wrongNums.includes(num)) return;
      const myRaw = studentAnswers[String(num)] != null ? studentAnswers[String(num)] : studentAnswers[num as unknown as string];
      const myStr = String(myRaw == null ? "" : myRaw).trim();
      const myChoices = myStr.split(",").map((x) => x.trim()).filter(Boolean);
      const ce: any[] = Array.isArray(q.choice_explanations) ? q.choice_explanations : [];
      const picked = ce.filter((c) => c && myChoices.includes(String(c.choice)));
      const correctAns = String((examAk[String(num)] != null ? examAk[String(num)] : (q.answer != null ? q.answer : ""))).trim();
      let role = "", why = "";
      if (picked.length) {
        role = picked.map((c) => c.role).filter(Boolean).join(", ");
        why = picked.map((c) => (c.why || "")).filter(Boolean).join(" ");
        picked.forEach((c) => {
          const r = String(c.role);
          if (TRAP_ROLES.indexOf(r) >= 0) trapCnt++;
          else if (CARELESS_ROLES.indexOf(r) >= 0) carelessCnt++;
          else if (CONCEPT_ROLES.indexOf(r) >= 0) conceptCnt++;
        });
      }
      // 정답 선지의 해설도 함께 (매칭 안 되면 q.intent 로 대체)
      let correctWhy = "";
      const correctChoices = correctAns.split(",").map((x) => x.trim()).filter(Boolean);
      const correctEntries = ce.filter((c) => c && correctChoices.indexOf(String(c.choice)) >= 0);
      if (correctEntries.length) correctWhy = correctEntries.map((c) => c.why || "").filter(Boolean).join(" ");
      wrongDetails.push({
        number: num,
        topic: q.topic || "", subtopic: q.subtopic || "",
        student_answer: myStr || "(미응답)",
        correct_answer: correctAns || (q.answer != null ? String(q.answer) : ""),
        role, why, correct_why: correctWhy, intent: q.intent || "",
      });
    });
    wrongDetails.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    let diagnosis: any = null;
    const clsTotal = trapCnt + conceptCnt + carelessCnt;
    if (clsTotal > 0) {
      const buckets: Array<[string, number]> = [["trap", trapCnt], ["concept", conceptCnt], ["careless", carelessCnt]];
      buckets.sort((a, b) => b[1] - a[1]);
      const topKey = (buckets[0][1] >= clsTotal * 0.6) ? buckets[0][0] : "mixed";
      const dt = DIAG_TEXT[topKey] || DIAG_TEXT.mixed;
      diagnosis = { pattern: topKey, label: dt.label, text: dt.text, trap_count: trapCnt, concept_count: conceptCnt, careless_count: carelessCnt };
    }

    // === 서술형: Claude에게 채점 요청 ===
    const textLines = textQs.map((q) => {
      const num = Number(q.number);
      const myT = studentTextAnswers[String(num)] != null ? studentTextAnswers[String(num)] : studentTextAnswers[num as unknown as string];
      return `${num}번 [서술형] 단원:${q.topic || ""}${q.subtopic ? " / " + q.subtopic : ""} | 출제의도:${q.intent || ""} | 모범답안:${q.answer != null ? q.answer : "?"} | 학생답:${String(myT != null ? myT : "(미응답)").slice(0, 800)}`;
    });
    const wrongDetailLines = wrongDetails.map((w) => {
      return `${w.number}번 [${w.topic}${w.subtopic ? " / " + w.subtopic : ""}] 정답:${w.correct_answer || "?"} | 학생답:${w.student_answer}${w.role ? " | 고른 선지 성격:" + w.role : ""}${w.why ? " | 오답 해설:" + w.why : ""}${w.correct_why ? " | 정답 해설:" + w.correct_why : ""}`;
    });

    const promptText = [
      `시험명: ${exam.title || ""} / 과목: ${analysis.subject_guess || exam.subject || ""}`,
      `=== 객관식 채점 결과 (이미 확정됨, 그대로 사용) ===`,
      `객관식 점수: ${mcScore} / ${mcTotal}`,
      `맞힌 객관식: ${correctNums.length ? correctNums.join(", ") : "없음"} / 틀린 객관식: ${wrongNums.length ? wrongNums.join(", ") : "없음"}`,
      ...mcLines,
      ``,
      wrongDetails.length ? `=== 오답 선지 분석 (이 학생이 틀린 객관식 — 시험 문항 분석 기반) ===` : `(오답 선지 세부 정보 없음)`,
      ...wrongDetailLines,
      diagnosis ? `→ 자동 진단: ${diagnosis.label} (함정형 ${trapCnt} / 개념부족형 ${conceptCnt} / 실수형 ${carelessCnt} 건). ${diagnosis.text}` : ``,
      ``,
      textQs.length ? `=== 서술형 문항 (네가 채점해야 한다) ===` : `=== 서술형 문항 없음 ===`,
      ...textLines,
      ``,
      `위는 한 학생의 시험 채점 결과이다. 객관식은 이미 정확히 채점되었으니 다시 계산하지 말라. 서술형 문항은 모범답안과 학생 답안을 비교해 핵심이 맞으면 정답(correct=true), 절반만 맞거나 틀리면 오답(false)로 text_results에 문항별로 판정하라(표현이 달라도 핵심이 먼저이면 정답으로 인정). 그리고 위 '오답 선지 분석'과 자동 진단을 참고해, 이 학생이 매력적인 오답·함정에 주로 걸리는지(핵심에 근접)·해당 개념 자체가 부족한지·계산이나 조건 적용 등 실행 실수가 잦은지를 판단해 summary·mistake_pattern·recommendation에 구체적으로 반영하라. 이 전체 결과를 바탕으로 약점(weak_topics)·강점(strengths)·실수패턴(mistake_pattern)·종합평(summary)·추천학습(recommendation)·서술형종합평가(text_feedback)를 작성하라. 모든 텍스트는 한국어. 반드시 report_student_analysis 도구를 호출해서만 답하라.`,
    ].join("\n");

    const aResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, tools: [STUDENT_TOOL], tool_choice: { type: "tool", name: "report_student_analysis" }, messages: [{ role: "user", content: promptText }] }),
    });
    const aJson = await aResp.json();
    if (!aResp.ok) return json({ error: "Claude API 오류", status: aResp.status, detail: aJson }, 502);
    const blocks = Array.isArray(aJson.content) ? aJson.content : [];
    const toolUse = blocks.find((b: { type?: string }) => b?.type === "tool_use");
    if (!toolUse || !toolUse.input) return json({ error: "분석 결과를 파싱하지 못했습니다.", raw: aJson }, 502);
    const inp = toolUse.input;

    // 서술형 채점 합산 + text_scores 구성
    const textResults: any[] = Array.isArray(inp.text_results) ? inp.text_results : [];
    let textScore = 0, textTotal = 0;
    const textScores: Record<string, number> = {};
    const wrongTextNums: number[] = [];
    const textDetailReasons: string[] = [];
    textQs.forEach((q) => {
      const num = Number(q.number);
      const tr = textResults.find((r) => Number(r && r.number) === num);
      textTotal += 1;
      const topic = String(q.topic || "서술형");
      if (!topicAgg[topic]) topicAgg[topic] = { total: 0, correct: 0 };
      topicAgg[topic].total += 1;
      const ok = !!(tr && tr.correct === true);
      if (ok) { textScore += 1; correctNums.push(num); topicAgg[topic].correct += 1; }
      else { wrongTextNums.push(num); }
      textScores[String(num)] = ok ? 1 : 0;
      if (tr && tr.reason) textDetailReasons.push(`${num}번(${ok ? "정답" : "오답"}): ${tr.reason}`);
    });
    const allWrong = wrongNums.concat(wrongTextNums).sort((a, b) => a - b);
    correctNums.sort((a, b) => a - b);
    const score = mcScore + textScore;
    const total = mcTotal + textTotal;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const byTopic = Object.keys(topicAgg).map((tp) => ({ topic: tp, total: topicAgg[tp].total, correct: topicAgg[tp].correct }));
    const textFeedbackCombined = [inp.text_feedback || "", textDetailReasons.length ? textDetailReasons.join("\n") : ""].filter(Boolean).join("\n");

    const result = {
      score, total, percentage,
      mc_score: mcScore, mc_total: mcTotal, text_score: textScore, text_total: textTotal,
      wrong_questions: allWrong,
      wrong_details: wrongDetails,
      diagnosis,
      by_topic: byTopic,
      weak_topics: Array.isArray(inp.weak_topics) ? inp.weak_topics : [],
      strengths: Array.isArray(inp.strengths) ? inp.strengths : [],
      mistake_pattern: inp.mistake_pattern || "",
      summary: inp.summary || "",
      recommendation: inp.recommendation || "",
      text_feedback: textFeedbackCombined,
      text_results: textResults,
      analyzed_at: new Date().toISOString(),
      model: aJson.model || MODEL,
    };
    const updatePayload: Record<string, unknown> = { ai_analysis: result };
    if (textTotal > 0) updatePayload.text_scores = textScores; // 선생님이 채점 폼에서 확인·수정 가능
    const { error: upErr } = await sb.from("exam_submissions").update(updatePayload).eq("id", submission_id);
    if (upErr) return json({ error: "저장 실패: " + upErr.message, ai_analysis: result }, 500);
    return json({ ok: true, ai_analysis: result, usage: aJson.usage || {} });
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e) }, 500);
  }
});
