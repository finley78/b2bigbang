// analyze-exam — 시험지(+답안지·해설) PDF/이미지를 Claude에게 보내 문항별 분석을 받아 exams.analysis에 저장.
// 배포: Supabase Studio / MCP. 이 파일은 버전관리용 사본 — 실제 배포본과 어긋나면 deployed 쪽이 진실.
// 입력: { exam_id }. exams.image_paths(시험지)·answer_paths(답안지/해설)·analyze_page_range·selected_questions·analyze_model('opus'|'sonnet')
// 출력: exams.analysis = { total_questions, page_count, subject_guess, summary, questions:[{number,page,type,choices_count,pick_count,answer,topic,subtopic,difficulty,intent,choice_explanations:[{choice,role,why}]}], analyzed_at, model, requested_pages, requested_questions }
//        + answer_key/question_count/objective_total/text_question_count/allow_text_answer/choices_per_question 자동 채움
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SONNET_MODEL = Deno.env.get("ANALYZE_MODEL_SONNET") || "claude-sonnet-4-6";
const OPUS_MODEL = Deno.env.get("ANALYZE_MODEL_OPUS") || "claude-opus-4-7";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}

function parseRange(str: unknown): number[] | null {
  if (str == null) return null;
  if (Array.isArray(str)) {
    const arr = str.map((x) => parseInt(String(x), 10)).filter((n) => !isNaN(n) && n > 0);
    return arr.length ? Array.from(new Set(arr)).sort((a, b) => a - b) : null;
  }
  const s = String(str).trim();
  if (!s) return null;
  const out: number[] = [];
  s.split(",").forEach((part) => {
    part = part.trim();
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { const a = parseInt(m[1], 10), b = parseInt(m[2], 10); if (a <= b) for (let i = a; i <= b; i++) out.push(i); }
    else if (/^\d+$/.test(part)) out.push(parseInt(part, 10));
  });
  return out.length ? Array.from(new Set(out)).sort((a, b) => a - b) : null;
}

async function extractPdfPages(pdfBytes: Uint8Array, pages1based: number[]): Promise<Uint8Array> {
  try {
    const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    const indices = pages1based.map((n) => n - 1).filter((i) => i >= 0 && i < total);
    if (indices.length === 0 || indices.length === total) return pdfBytes;
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    return await out.save();
  } catch (_e) { return pdfBytes; }
}

const ANALYZE_TOOL = {
  name: "report_exam_analysis",
  description: "분석한 시험지 문항 정보를 구조화해서 보고한다.",
  input_schema: {
    type: "object",
    properties: {
      total_questions: { type: "integer", description: "분석한 문항 수" },
      page_count: { type: "integer", description: "받은 시험지 페이지 수" },
      subject_guess: { type: "string", description: "추정 과목 (국어/영어/수학/과학/사회 등)" },
      summary: { type: "string", description: "시험지 요약 — 어떤 단원 중심인지, 난이도 분포 등. 한국어 2~3문장." },
      questions: {
        type: "array", description: "모든 문항을 번호 순서대로",
        items: {
          type: "object",
          properties: {
            number: { type: "integer", description: "문항 번호 (시험지에 적힌 실제 번호)" },
            page: { type: "integer", description: "이 문항이 있는 시험지 페이지 번호 (실제 번호). 모르면 1." },
            type: { type: "string", enum: ["mc", "text"], description: "mc=객관식(선택형), text=서술형/주관식" },
            choices_count: { type: "integer", description: "객관식이면 선지 개수(보통 4 또는 5). 서술형이면 0." },
            pick_count: { type: "integer", description: "객관식에서 고르는 답의 개수. 보통 1. '두 개 고르시오' 같으면 2, '세 개' 이면 3. 서술형이면 0." },
            answer: { type: "string", description: "정답. 객관식 단일이면 번호만(예: '3'). 객관식 복수 정답이면 콤마로 구분(예: '3,5'). 서술형이면 모범답안 또는 핵심 채점 포인트. 한국어. 확신 없으면 '확인 필요'." },
            topic: { type: "string", description: "단원/대단원. 한국어." },
            subtopic: { type: "string", description: "세부 개념. 한국어. 없으면 빈 문자열." },
            difficulty: { type: "string", enum: ["하", "중", "상"], description: "체감 난이도" },
            intent: { type: "string", description: "출제 의도 — 무엇을 평가하려는지. 한국어 한 문장." },
            choice_explanations: {
              type: "array",
              description: "객관식 문항의 선지별 해설. 1번 선지부터 순서대로 모든 선지를 포함. 서술형이면 빈 배열 []. 정답 선지는 왜 정답인지, 오답 선지는 학생이 왜·어떻게 그 선지를 고르게 되는지(어떤 착각·실수·오개념인지)를 설명한다. 과목·문제 유형 무관하게 작성한다.",
              items: {
                type: "object",
                properties: {
                  choice: { type: "integer", description: "선지 번호 (1부터)" },
                  role: {
                    type: "string",
                    enum: ["정답", "매력적인 오답", "흔한 오개념", "부분만 맞음", "범위·정도 오류", "반대·모순", "무관·엉뚱", "계산·적용 실수", "기타 오답"],
                    description: "이 선지의 성격(전 과목 공용). '정답'=맞는 선지. '매력적인 오답'=얼핏 그럴듯해 가장 많이 고르는 함정 — 핵심에 거의 닿았으나 결정적 한 끗을 놓치면 고름. '흔한 오개념'=그 개념·문법·공식을 잘못 알고 있으면 고르게 되는 선지. '부분만 맞음'=일부는 맞으나 핵심·전체가 틀림(독해의 지엽적 선지, 수학의 일부 단계만 맞은 값, 어법의 일부 항목만 옳은 경우 등). '범위·정도 오류'=대상의 범위보다 너무 넓거나 좁거나, 너무 강하거나 약하게 진술(과잉 일반화 포함). '반대·모순'=본문·사실과 반대되거나 모순됨. '무관·엉뚱'=문제·본문과 관련 없는 엉뚱한 내용(지문 자체를 거의 못 읽었거나 문제를 잘못 이해해야 고름). '계산·적용 실수'=(주로 수학·과학) 개념·식은 맞으나 계산·부호·단위·대입 등 실행에서 실수하면 나오는 값. '기타 오답'=위에 해당 안 됨. 서술형 채점에는 쓰지 않음."
                  },
                  why: { type: "string", description: "이 선지가 왜 정답/오답인지, 학생이 어떤 착각·실수·오개념으로 고르게 되는지 한국어 1~2문장으로 구체적으로. 어법·문법·구문 문항이면 그 선지가 어떤 문법 항목이고 어법상 맞는지/틀린지, 고쳐야 한다면 올바른 형태가 무엇인지를 담을 것. 답안지·해설이 제공되면 그 근거를 활용." }
                },
                required: ["choice", "role", "why"]
              }
            }
          },
          required: ["number", "page", "type", "choices_count", "pick_count", "answer", "topic", "subtopic", "difficulty", "intent", "choice_explanations"],
        },
      },
    },
    required: ["total_questions", "page_count", "subject_guess", "summary", "questions"],
  },
};

const BASE_INSTRUCTION = [
  "위 자료는 한 학원의 시험지(또는 숙제지)와, 있다면 그 답안지·해설이다. 과목은 영어·국어·수학·과학·사회·한국사 등 무엇이든 될 수 있고, 어떤 유형의 문제든 동일한 기준으로 분석한다.",
  "받은 시험지의 모든 문항을 빠짐없이 분석해서 report_exam_analysis 도구로 보고하라.",
  "- 답안지·해설이 함께 제공되면 그것을 근거로 정답·출제 의도·선지 해설을 정확히 파악하라. 없으면 시험지만 보고 최선을 다해 추정하되, 정답을 확신할 수 없으면 answer를 '확인 필요'로 둬라.",
  "- 객관식/서술형은 문제 형식으로 판단하라 (①②③④⑤·ㄱㄴㄷ 보기·네모 안 선택 등 선지가 있으면 mc, 직접 서술/계산 과정/단답 작성이면 text).",
  "- topic·subtopic에는 그 문항이 평가하는 정확한 단원·개념·문법항목·구문을 적어라 (예: '관계대명사와 관계부사 구별', '분사구문의 시제·태', '이차함수의 최댓값·최솟값', '삼투압과 농도', '조선 후기 신분제', '주제 추론'). 두루뭉술하게 쓰지 말 것.",
  "- 객관식 문항은 choice_explanations에 모든 선지(1번부터 끝까지)를 넣어라. 정답 선지는 role='정답'으로 두고 왜 정답인지 why에 쓰고, 오답 선지는 아래 분류 중 가장 알맞은 role로 정하고 학생이 왜·어떻게 그 선지를 고르게 되는지(어떤 착각·실수·오개념인지)를 why에 한두 문장으로 구체적으로 써라:",
  "  · '매력적인 오답' = 얼핏 그럴듯해 가장 많이 고르는 함정. 핵심에 거의 닿았으나 결정적 한 끗을 놓치면 고르게 됨.",
  "  · '흔한 오개념' = 그 개념·문법·공식·사실을 잘못 알고 있으면 고르게 되는 선지(어떤 오개념인지 정확히 짚어라).",
  "  · '부분만 맞음' = 일부는 맞으나 핵심·전체가 틀림(독해의 지엽적 선지, 수학의 일부 단계만 맞은 값, 어법의 일부 항목만 옳은 경우 등).",
  "  · '범위·정도 오류' = 대상의 범위보다 너무 넓거나 좁거나, 너무 강하거나 약하게 진술(과잉 일반화 포함).",
  "  · '반대·모순' = 본문·사실과 반대되거나 모순됨.",
  "  · '무관·엉뚱' = 문제·본문과 관련 없는 엉뚱한 내용(지문 자체를 거의 못 읽었거나 문제를 잘못 이해해야 고르게 됨).",
  "  · '계산·적용 실수' = (주로 수학·과학) 개념·식은 맞으나 계산·부호·단위·대입 등 실행에서 실수하면 나오는 값.",
  "  · '기타 오답' = 위에 해당 안 되는 오답.",
  "- 어법·문법·구문 문항(밑줄 친 것 중 어법상 틀린/맞는 것 고르기, 네모 안 선택, 어순·구문 배열 등): 정답(=틀린/고쳐야 할, 또는 어법상 옳은 선지)에는 왜 그런지와 올바른 형태가 무엇인지를 why에 쓰고, 나머지 선지에는 그 부분이 어떤 문법 항목인지·어법상 맞는지/틀린지와, 학생이 그걸 잘못 지목한다면 어떤 오개념 때문인지를 why에 써라. role은 정답 외엔 '흔한 오개념'(특정 문법을 잘못 알면 그 선지를 골라 고치려 듦)이나 '기타 오답'으로 둔다.",
  "- 수학·과학 등 계산형 문항: 각 오답 선지가 어떤 풀이 단계·공식 적용·부호·단위 실수에서 나오는 값인지 가능한 한 짚어라(role='계산·적용 실수' 또는 개념을 잘못 알면 나오는 값이면 '흔한 오개념').",
  "- 서술형 문항은 choice_explanations를 빈 배열 []로 둬라.",
  "- 문제에 '두 개를 고르시오', '모두 고르시오', '옳은 것을 모두' 등 복수 정답을 요구하는 문항은 pick_count를 그 개수로 설정하고 answer에 정답들을 콤마로 연결해 적어라(예: '2,4'). 단일 정답 문항은 pick_count=1.",
  "- 한국 초·중·고 교육과정 기준으로 단원/개념을 분류하라.",
  "- 모든 텍스트 필드는 한국어로 작성하라.",
  "- 반드시 도구를 호출해서만 답하라.",
].join("\n");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY 가 설정되지 않았습니다. Supabase Edge Function Secrets 에 추가해 주세요." }, 500);
  try {
    const body = await req.json().catch(() => ({}));
    const exam_id = body?.exam_id;
    if (!exam_id) return json({ error: "exam_id 가 필요합니다." }, 400);
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: exam, error: exErr } = await sb.from("exams").select("*").eq("id", exam_id).single();
    if (exErr || !exam) return json({ error: "시험을 찾을 수 없습니다." }, 404);
    const examPaths: string[] = Array.isArray(exam.image_paths) ? exam.image_paths : [];
    const answerPaths: string[] = Array.isArray(exam.answer_paths) ? exam.answer_paths : [];
    if (examPaths.length === 0 && answerPaths.length === 0) return json({ error: "시험지 또는 답안지 파일이 없습니다." }, 400);
    const pageRange = parseRange(exam.analyze_page_range);
    let selQ: number[] | null = null;
    if (Array.isArray(exam.selected_questions)) selQ = parseRange(exam.selected_questions);
    else if (typeof exam.selected_questions === "string") selQ = parseRange(exam.selected_questions);
    const MODEL = (exam.analyze_model === "opus") ? OPUS_MODEL : SONNET_MODEL;

    const content: unknown[] = [];
    async function pushImage(path: string, label: string) {
      const { data: blob } = await sb.storage.from("attachments").download(path);
      if (!blob) { content.push({ type: "text", text: `(${label}: 파일을 불러올 수 없음)` }); return; }
      const buf = new Uint8Array(await blob.arrayBuffer());
      const b64 = encodeBase64(buf);
      const ext = (path.split(".").pop() || "").toLowerCase();
      const mt = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
      content.push({ type: "text", text: `--- ${label} ---` });
      content.push({ type: "image", source: { type: "base64", media_type: mt, data: b64 } });
    }
    async function pushPdf(path: string, label: string, applyRange: boolean) {
      const { data: blob } = await sb.storage.from("attachments").download(path);
      if (!blob) { content.push({ type: "text", text: `(${label}: 파일을 불러올 수 없음)` }); return; }
      let buf = new Uint8Array(await blob.arrayBuffer());
      let note = "";
      if (applyRange && pageRange) { buf = await extractPdfPages(buf, pageRange); note = ` (지정 페이지: ${pageRange.join(",")})`; }
      const b64 = encodeBase64(buf);
      content.push({ type: "text", text: `--- ${label}${note} (PDF) ---` });
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
    }
    function isPdf(p: string) { return (p.split(".").pop() || "").toLowerCase() === "pdf"; }

    if (examPaths.length === 1) {
      if (isPdf(examPaths[0])) await pushPdf(examPaths[0], "시험지", true);
      else await pushImage(examPaths[0], "시험지 1페이지");
    } else {
      for (let i = 0; i < examPaths.length; i++) {
        if (pageRange && !pageRange.includes(i + 1)) continue;
        if (isPdf(examPaths[i])) await pushPdf(examPaths[i], `시험지 ${i + 1}`, true);
        else await pushImage(examPaths[i], `시험지 ${i + 1}페이지`);
      }
    }
    for (let i = 0; i < answerPaths.length; i++) {
      if (isPdf(answerPaths[i])) await pushPdf(answerPaths[i], `답안지·해설 ${i + 1}`, false);
      else await pushImage(answerPaths[i], `답안지·해설 ${i + 1}`);
    }

    let instruction = BASE_INSTRUCTION;
    if (selQ && selQ.length) instruction += `\n- 특히 ${selQ.join(", ")}번 문항을 반드시 명확히 분석하라. (그 외의 문항도 보이면 함께 분석해도 된다.)`;
    if (pageRange) instruction += `\n- 지금 받은 시험지는 원본의 ${pageRange.join(", ")}페이지 부분이다. page 필드에는 그 실제 페이지 번호를 적어라.`;
    content.push({ type: "text", text: instruction });

    const aResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 32000, tools: [ANALYZE_TOOL], tool_choice: { type: "tool", name: "report_exam_analysis" }, messages: [{ role: "user", content }] }),
    });
    const aJson = await aResp.json();
    if (!aResp.ok) return json({ error: "Claude API 오류", status: aResp.status, detail: aJson }, 502);
    const blocks = Array.isArray(aJson.content) ? aJson.content : [];
    const toolUse = blocks.find((b: { type?: string }) => b?.type === "tool_use");
    if (!toolUse || !toolUse.input) return json({ error: "분석 결과를 파싱하지 못했습니다.", raw: aJson }, 502);
    const analysis = { ...toolUse.input, analyzed_at: new Date().toISOString(), model: aJson.model || MODEL, requested_pages: pageRange || null, requested_questions: selQ || null };

    // 분석 결과로 시험 답안지를 자동 구성
    const allQs: any[] = Array.isArray(analysis.questions) ? analysis.questions : [];
    const useQs = (selQ && selQ.length) ? allQs.filter((q) => selQ!.includes(Number(q && q.number))) : allQs;
    const mcQs = useQs.filter((q) => q && q.type === "mc").slice().sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    const textQs = useQs.filter((q) => q && q.type === "text");
    const answerKey: Record<string, string> = {};
    mcQs.forEach((q, idx) => {
      const num = (q && q.number != null && !isNaN(Number(q.number))) ? Number(q.number) : (idx + 1);
      let ans = (q && q.answer != null) ? String(q.answer).trim() : "";
      // 복수 정답은 정렬해 저장 (채점 일관성)
      if (ans.indexOf(",") >= 0) ans = ans.split(",").map((x) => x.trim()).filter(Boolean).sort().join(",");
      if (ans && ans !== "확인 필요") answerKey[String(num)] = ans;
    });
    const cpqVals = mcQs.map((q) => parseInt(String(q && q.choices_count), 10)).filter((n) => !isNaN(n) && n >= 2 && n <= 9);
    const cpq = cpqVals.length ? Math.max(...cpqVals) : 5;
    const updatePayload: Record<string, unknown> = {
      analysis,
      question_count: mcQs.length,
      objective_total: mcQs.length,
      text_question_count: textQs.length,
      allow_text_answer: textQs.length > 0,
      choices_per_question: cpq,
      answer_key: answerKey,
    };
    const { error: upErr } = await sb.from("exams").update(updatePayload).eq("id", exam_id);
    if (upErr) return json({ error: "저장 실패: " + upErr.message, analysis }, 500);
    return json({ ok: true, analysis, applied: { question_count: mcQs.length, text_question_count: textQs.length, choices_per_question: cpq, answer_key_count: Object.keys(answerKey).length }, usage: aJson.usage || {}, model_used: MODEL });
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e) }, 500);
  }
});
