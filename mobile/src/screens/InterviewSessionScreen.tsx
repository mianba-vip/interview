import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Frame21180, { type SessionMsg, type SessionSettle } from "@/views/Frame21180";
import { rehearsalAnswer, rehearsalEnd } from "@/api/drill";
import type { RehearsalView } from "@/api/types";

/** 会话入参：由面试列表 navigate state 带入 */
interface SessionState {
  runId: number;
  stem: string;
  maxRound: number;
  round: number;
}

/** 单场倒计时：模板默认 15 分钟（列表默认时长档） */
const TOTAL_SECONDS = 15 * 60;

type Phase = "waiting" | "thinking" | "explaining";

const fmtClock = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const toSettle = (v: RehearsalView): SessionSettle => ({
  allPassed: v.allPassed ?? false,
  score: v.score ?? 0,
  grade: v.grade ?? "—",
  scores: v.roundScores,
});

const statusOf = (finished: boolean, phase: Phase): string => {
  if (finished) return "本场已结算，可返回列表";
  if (phase === "explaining") return "AI 面试官正在讲解…";
  if (phase === "thinking") return "AI 面试官正在思考…";
  return "面试官正在等待你的回答…";
};

const backBox = (onBack: () => void) => (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--color-bg-cream)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
    }}
  >
    <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" }}>
      面试会话已失效，请重新开始
    </p>
    <div
      onClick={onBack}
      style={{
        padding: "10px 26px",
        borderRadius: 14,
        background: "var(--color-brand-sky)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      返回面试列表
    </div>
  </div>
);

/** 面试中：题干/轮次来自 location.state，作答走 SSE（result→下一问或结算，随后逐 token 讲解）。 */
const InterviewSessionScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: SessionState | null };

  const [stem, setStem] = useState(state?.stem ?? "");
  const [maxRound] = useState(state?.maxRound ?? 0);
  const [currentRound, setCurrentRound] = useState(state?.round ?? 0);
  const [answered, setAnswered] = useState(0);
  const [finished, setFinished] = useState(false);
  const [settle, setSettle] = useState<SessionSettle | null>(null);
  const [messages, setMessages] = useState<SessionMsg[]>([]);
  const [explain, setExplain] = useState("");
  const [phase, setPhase] = useState<Phase>("waiting");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [left, setLeft] = useState(TOTAL_SECONDS);

  const finishedRef = useRef(false);
  const streamRef = useRef<{ cancel: () => void } | null>(null);

  // 本地倒计时（结算后冻结在当前值）
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (finishedRef.current) return;
      setLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // 离开页面掐断 SSE
  useEffect(() => () => streamRef.current?.cancel(), []);

  const submit = () => {
    const text = input.trim();
    if (!state || !text || finishedRef.current || phase !== "waiting") return;
    setInput("");
    setExplain("");
    setError("");
    setMessages((m) => [...m, { id: m.length + 1, text, timeText: fmtClock(left) }]);
    setPhase("thinking");
    streamRef.current = rehearsalAnswer(state.runId, text, {
      onResult: (v) => {
        setAnswered((n) => n + 1);
        if (v.finished) {
          finishedRef.current = true;
          setFinished(true);
          setSettle(toSettle(v));
          setPhase("waiting");
        } else {
          // 后端推进轮返回的 round=刚作答轮，下一问 = round+1；stem 为空则沿用原题干
          setCurrentRound(v.round + 1);
          if (v.stem && v.stem.trim()) setStem(v.stem);
        }
      },
      onToken: (t) => {
        setExplain((x) => x + t);
        setPhase("explaining");
      },
      onDone: () => {
        setPhase("waiting");
        // 讲解结束才切到下一问：清空本问消息（结算场保留最后一答与结算卡）
        if (!finishedRef.current) setMessages([]);
      },
      onError: (_status, msg) => {
        setPhase("waiting");
        setError(msg ?? "回复失败，请重试");
      },
    });
  };

  const end = async () => {
    if (!state || finishedRef.current || phase !== "waiting") return;
    try {
      const v = await rehearsalEnd(state.runId);
      finishedRef.current = true;
      setFinished(true);
      setSettle(toSettle(v));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "结算失败，请重试");
    }
  };

  if (!state?.runId) return backBox(() => navigate("/interview"));

  const roundNo = currentRound + 1;
  const progressPct = finished
    ? 100
    : Math.min(100, Math.round((roundNo / Math.max(maxRound, 1)) * 100));

  return (
    <Frame21180
      titleText={`模拟面试 · 共 ${maxRound} 问`}
      roundText={
        finished
          ? `已答 ${answered} / ${maxRound} 问`
          : `第 ${roundNo} 问 / 共 ${maxRound} 问`
      }
      roundChip={`第 ${roundNo} 问`}
      progressPct={progressPct}
      clockText={fmtClock(left)}
      stemText={stem}
      messages={messages}
      explain={explain}
      statusText={statusOf(finished, phase)}
      inputText={input}
      counterText={
        finished
          ? "本场面试已结束 · 可返回列表"
          : `已输入 ${input.length} 字 · 建议 200 字以上再提交`
      }
      finished={finished}
      settle={settle}
      error={error}
      onBack={() => navigate("/interview")}
      onInput={setInput}
      onSubmit={submit}
      onEnd={() => void end()}
    />
  );
};

export default InterviewSessionScreen;
