import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Frame2720 from "@/views/Frame2720";
import Frame2807 from "@/views/Frame2807";
import { chatStream, conversation, finish as finishApi, history, runDetail, startTask } from "@/api/drill";
import type { SseStream } from "@/api/sse";
import type { ChatMsg, ConversationView, QuestionView, RunDetailView } from "@/api/types";
import { loadPrefs } from "@/lib/prefs";
import { useVoiceInput } from "@/lib/voiceInput";

/** 跳转状态：首页/练习开题时带 view 与已恢复的消息，深链则走 runDetail */
interface RunNavState {
  view?: QuestionView;
  messages?: ChatMsg[];
  /** 部分跳转方带 conversation：ConversationView 或已展开的 ChatMsg[] */
  conversation?: ConversationView | ChatMsg[];
}

/** 两帧共用的 props（单选帧无 times，开放题帧另有消息时间） */
interface RunBase {
  title: string;
  category: string;
  modeLabel: string;
  stem: string;
  timeText: string;
  revealed: boolean;
  msgs: ChatMsg[];
  streaming: boolean;
  input: string;
  placeholder: string;
  disabled: boolean;
  scrollRef?: RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onReveal: () => void;
  onFinish?: () => void;
  finishing?: boolean;
  onBack: () => void;
}

const PROBE_LABEL: Record<string, string> = {
  RECALL: "回忆",
  CLOZE: "挖空",
  REVERSE: "倒推",
  TRAP: "避坑",
  SCENARIO: "场景",
  CONTRAST: "对比",
  INTEGRATION: "串联",
};

const LOADING_BG = "var(--color-bg-cream)";

/** mm:ss 计时 */
function mmss(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** hh:mm 消息时间 */
function hhmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 认知动作 → 卡片首行分类（模板「场景题」） */
function probeLabel(probe: string): string {
  const label = PROBE_LABEL[(probe ?? "").toUpperCase()];
  return label ? `${label}题` : "练习题";
}

/** 顶栏题名：题干首个加粗短语 → 小标题 → 首行纯文本 */
function stemTitle(stem: string): string {
  const src = stem ?? "";
  const bold = /\*\*([^*\n]{1,30})\*\*/.exec(src)?.[1];
  const heading = /^#{1,6}\s*(.+)$/m.exec(src)?.[1];
  const firstLine = src.split("\n").find((l) => l.trim() && !l.trim().startsWith("```"));
  let t = (bold ?? heading ?? firstLine ?? "").trim();
  t = t.replace(/[*_`>#]/g, "").replace(/^题目\s*[：:]\s*/, "").replace(/\s+/g, " ").trim();
  if (!t) return "练习题";
  return t.length > 16 ? `${t.slice(0, 16)}…` : t;
}

function sanitize(list: ChatMsg[]): ChatMsg[] {
  return list.filter(
    (m) => m && (m.role === "me" || m.role === "ai") && typeof m.text === "string",
  );
}

/** 对话线 → 消息列表（当前 run 的轮次，缺省取该线最后一条 run） */
function msgsFromConv(c: ConversationView, runId: number): ChatMsg[] {
  const run = c.runs.find((r) => r.runId === runId) ?? c.runs[c.runs.length - 1];
  const out: ChatMsg[] = [];
  let id = 0;
  for (const t of run?.turns ?? []) {
    if (t.rawAnswer) out.push({ id: ++id, role: "me", text: t.rawAnswer });
    if (t.tutorText) out.push({ id: ++id, role: "ai", text: t.tutorText });
  }
  return out;
}

function initialMsgs(state: RunNavState | null): ChatMsg[] {
  if (!state) return [];
  if (Array.isArray(state.messages)) return sanitize(state.messages);
  if (Array.isArray(state.conversation)) return sanitize(state.conversation);
  const conv = state.conversation;
  if (conv && typeof conv === "object" && Array.isArray(conv.runs)) {
    return msgsFromConv(conv, conv.runs[conv.runs.length - 1]?.runId ?? -1);
  }
  return [];
}

/** 答题页：题干 + 苏格拉底对话（SSE 流式）→ 该问终结时判分并跳复盘。
 *  responseFormat=CHOICE 走 Frame2720（单选），其余走 Frame2807（开放题），共用同一套状态。 */
const RunScreen = () => {
  const { runId: runIdParam, taskId: taskIdParam } = useParams();
  const runId = Number(runIdParam);
  /** 任务入口（首页/讲解页）带 taskId：不等开题接口，先渲染题面壳，页内再 startTask。 */
  const bootTaskId = Number(taskIdParam ?? 0);
  const navigate = useNavigate();
  const { state } = useLocation() as { state: RunNavState | null };

  const stateMsgs = initialMsgs(state);
  const [view, setView] = useState<QuestionView | null>(state?.view ?? null);
  const [msgs, setMsgs] = useState<ChatMsg[]>(stateMsgs);
  const [times, setTimes] = useState<Record<number, string>>({});
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [revealN, setRevealN] = useState<number | null>(null); // 题干渐显进度（null=完整显示）
  const [err, setErr] = useState("");
  const [roundNo, setRoundNo] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  // 语音作答：设置页开关（进入答题页时读取），按住麦克风说话、松开填入输入框
  const [voiceOn] = useState(() => loadPrefs().voiceOn);
  const { listening: voiceListening, start: voiceStart, stop: voiceStop } = useVoiceInput(
    (text) => setInput((cur) => (cur ? cur.replace(/\s+$/, "") + " " + text : text)),
    (msg) => setErr(msg),
  );

  const idRef = useRef(stateMsgs.reduce((m, x) => Math.max(m, x.id), 0));
  const sseRef = useRef<SseStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const revealSentRef = useRef(false);
  const revealedRef = useRef(false);
  const finishingRef = useRef(false);
  const elapsedRef = useRef(0);
  const enteredGradedRef = useRef(false);

  // 计时：本地正计时 mm:ss（判分跳转时带给复盘页算用时）
  useEffect(() => {
    const t = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => () => sseRef.current?.cancel(), []);

  // 新消息（含流式 token）→ 内容区滚到底，保证回复可见
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  // 题干流式渐显：开题接口一次性回全量题干，进页后按块快速揭示（约半秒出完），
  // 让「先进页面、题目随后展开」的观感连续，不出现整页空白等待。
  useEffect(() => {
    if (!view || revealN === null) return;
    if (revealN >= view.stem.length) {
      setRevealN(null);
      return;
    }
    const step = Math.max(24, Math.ceil(view.stem.length / 15));
    const t = window.setTimeout(() => setRevealN((n) => (n ?? 0) + step), 30);
    return () => window.clearTimeout(t);
  }, [view, revealN]);

  // 取数：taskId 入口先秒进页面、页内开题（PENDING 题会现场生成，绝不能卡在上一页）；
  // run 入口 location.state 优先，否则 runDetail（未判分 run 无详情 → 历史对话线兜底）
  useEffect(() => {
    if (bootTaskId > 0) {
      let alive = true;
      startTask(bootTaskId)
        .then((q) => {
          if (!alive) return;
          setView(q);
          if (q.stem && q.stem.length > 40) setRevealN(0);
        })
        .catch((e) => {
          if (alive) setErr(e instanceof Error ? e.message : "开题失败，请重试");
        });
      return () => {
        alive = false;
      };
    }
    if (!Number.isFinite(runId) || runId <= 0) {
      setErr("无效的作答 ID");
      return;
    }
    let alive = true;
    const hadMsgs = stateMsgs.length > 0;
    (async () => {
      try {
        let v: QuestionView | null = state?.view ?? null;
        if (!v) {
          try {
            const d: RunDetailView = await runDetail(runId);
            v = {
              runId: d.runId,
              questionId: d.questionId,
              stem: d.stem,
              probeType: d.probeType,
              responseFormat: d.responseFormat,
            };
          } catch {
            const hit = (await history()).find((x) => x.runId === runId);
            if (!hit) throw new Error("作答记录不存在或尚未判分");
            v = {
              runId,
              questionId: hit.questionId,
              stem: hit.stem,
              probeType: "",
              responseFormat: "",
            };
          }
        }
        const loaded = v;
        // 对话线：恢复消息 + 第 N 题 + 进入时是否已判分
        const c = await conversation(loaded.questionId).catch(() => null);
        if (!alive) return;
        let merged = loaded;
        if (c) {
          merged = {
            runId: loaded.runId,
            questionId: loaded.questionId,
            stem: loaded.stem || c.stem,
            probeType: loaded.probeType || c.probeType,
            responseFormat: loaded.responseFormat || c.responseFormat,
          };
          const idx = c.runs.findIndex((r) => r.runId === runId);
          if (idx >= 0) setRoundNo(idx + 1);
          const cur = c.runs.find((r) => r.runId === runId) ?? c.runs[c.runs.length - 1];
          if (cur?.status === "GRADED") enteredGradedRef.current = true;
          if (!hadMsgs) {
            const restored = msgsFromConv(c, runId);
            if (restored.length > 0) {
              setMsgs(restored);
              idRef.current = Math.max(idRef.current, ...restored.map((m) => m.id));
            }
          }
        }
        setView(merged);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, bootTaskId]);

  // 判分并跳复盘（幂等：后端已 GRADED 时返回既有评分）
  const doFinish = async () => {
    const v = view;
    if (!v || finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setErr("");
    try {
      const grade = await finishApi(v.runId);
      navigate(`/review/${v.runId}`, { state: { grade, elapsed: elapsedRef.current } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "评分失败，请重试");
      finishingRef.current = false;
      setFinishing(false);
    }
  };

  // 一轮回复结束：看答案/已揭示 → 该问终结；服务端可能已判分（引导达标）→ 对话线状态兜底
  const afterDone = async () => {
    const v = view;
    if (!v || finishingRef.current) return;
    if (revealSentRef.current || revealedRef.current) {
      await doFinish();
      return;
    }
    const c = await conversation(v.questionId).catch(() => null);
    if (!c || finishingRef.current) return;
    const cur = c.runs.find((r) => r.runId === v.runId);
    if (cur?.status === "GRADED" && !enteredGradedRef.current) await doFinish();
  };

  // 发送：输入作答 / 看答案（reveal=true，服务端记录揭示边界）
  const send = (reveal = false) => {
    const text = reveal ? "我想直接看答案" : input.trim();
    const v = view;
    if (!text || !v || streaming || finishing) return;
    setErr("");
    setInput("");
    revealSentRef.current = reveal;
    const meId = ++idRef.current;
    setMsgs((m) => [...m, { id: meId, role: "me", text }]);
    setTimes((t) => ({ ...t, [meId]: hhmm() }));
    setStreaming(true);
    const aiId = ++idRef.current;
    let created = false;
    const ensureAi = () => {
      if (created) return;
      created = true;
      setMsgs((m) => [...m, { id: aiId, role: "ai", text: "", reasoning: "" }]);
    };
    sseRef.current = chatStream(v.runId, text, reveal, {
      onToken: (t) => {
        ensureAi();
        setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, text: x.text + t } : x)));
      },
      onReasoning: (t) => {
        ensureAi();
        setMsgs((m) =>
          m.map((x) => (x.id === aiId ? { ...x, reasoning: (x.reasoning ?? "") + t } : x)),
        );
      },
      onReveal: () => {
        revealedRef.current = true;
        setRevealed(true);
      },
      onDone: () => {
        sseRef.current = null;
        setStreaming(false);
        void afterDone();
      },
      onError: (_status, message) => {
        sseRef.current = null;
        setStreaming(false);
        setErr(message || "回复失败");
        setMsgs((m) =>
          m.map((x) => (x.id === aiId ? { ...x, text: x.text || "（回复失败）" } : x)),
        );
      },
    });
  };

  if (!view) {
    // 出错 → 提示；否则（开题/加载中）→ 先渲染题面壳，秒进不白屏
    if (err) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: LOADING_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            color: "var(--color-brand-coral)",
            fontSize: 14,
          }}
        >
          {err}
        </div>
      );
    }
    const shell: RunBase = {
      title: "练习题",
      category: "练习题",
      modeLabel: "准备中…",
      stem: bootTaskId > 0 ? "**正在为你准备题目…**" : "**加载中…**",
      timeText: mmss(elapsed),
      revealed: false,
      msgs: [],
      streaming: false,
      input,
      placeholder: "输入你的回答…",
      disabled: true,
      scrollRef,
      onInputChange: () => undefined,
      onSend: () => undefined,
      onReveal: () => undefined,
      onBack: () => navigate(-1),
    };
    return <Frame2720 {...shell} />;
  }

  const isChoice = (view.responseFormat || "").toUpperCase() === "CHOICE";
  const stemText =
    revealN !== null ? view.stem.slice(0, revealN) : view.stem || "";
  const base: RunBase = {
    title: stemTitle(view.stem),
    category: probeLabel(view.probeType),
    modeLabel: `${isChoice ? "单选" : "简答"} · 第 ${roundNo} 题`,
    stem: stemText,
    timeText: mmss(elapsed),
    revealed,
    msgs,
    streaming,
    input,
    placeholder: isChoice ? "请直接回复所选选项的字母" : "输入你的回答…",
    disabled: streaming || finishing,
    scrollRef,
    onInputChange: setInput,
    onSend: () => send(false),
    onReveal: () => send(true),
    onFinish: () => void doFinish(),
    finishing,
    onBack: () => navigate(-1),
  };

  return (
    <>
      {(err || finishing) && (
        <div
          style={{
            position: "fixed",
            bottom: 108,
            left: 16,
            right: 16,
            zIndex: 40,
            background: finishing ? "var(--color-brand-purplesoft)" : "var(--color-brand-coralsoft)",
            color: finishing ? "var(--color-brand-purple)" : "var(--color-brand-coral)",
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {finishing ? "判分中…" : err}
        </div>
      )}
      {isChoice ? (
        <Frame2720 {...base} />
      ) : (
        <Frame2807
          {...base}
          times={times}
          voiceEnabled={voiceOn}
          listening={voiceListening}
          onVoiceStart={() => void voiceStart()}
          onVoiceEnd={() => void voiceStop()}
          voiceHint={voiceListening ? "正在聆听…松开填入输入框" : undefined}
        />
      )}
    </>
  );
};

export default RunScreen;
