import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame21051, { type HistoryItem } from "@/views/Frame21051";
import { historyPage, rehearsalStart, rehearsalSummary, type RehearsalSummary } from "@/api/drill";
import type { RunSummaryView } from "@/api/types";

/** 模板默认文案兜底（0 场时 avgScore 为 null） */
const SUMMARY_FALLBACK = "已面 6 场 · 平均 78 分";

const LOADING = (
  <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />
);

const failBox = (text: string) => (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--color-bg-cream)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}
  >
    <span style={{ fontSize: 14, color: "var(--color-text-secondary)", textAlign: "center" }}>
      {text}
    </span>
  </div>
);

/** 「10 月 26 日」：服务端 answeredAt 为 ISO 串。 */
const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};

/** RunSummaryView → 历史卡片（未结算场次给「进行中 / 待结算」）。 */
const toItem = (r: RunSummaryView): HistoryItem => ({
  runId: r.runId,
  title: r.stem,
  dateText: fmtDate(r.answeredAt),
  scoreText: r.status === "GRADED" ? `${Math.round(r.rawScore)} 分` : "进行中",
  gradeText: r.grade ?? "待结算",
  tone: r.grade === "GOOD" || r.grade === "EASY" ? "good" : r.grade ? "bad" : "plain",
});

/** 面试列表：统计 + 历史场次取数 → Frame21051；开场拿到 runId 后进面试中。 */
const InterviewScreen = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<RehearsalSummary | null>(null);
  const [runs, setRuns] = useState<RunSummaryView[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startErr, setStartErr] = useState("");
  const busyRef = useRef(false);

  useEffect(() => {
    let alive = true;
    rehearsalSummary()
      .then((s) => {
        if (alive) setSummary(s);
      })
      .catch((e) => {
        if (alive) setLoadErr(e instanceof Error ? e.message : "统计加载失败");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    // 历史场次失败不阻塞整页：留空由视图给兜底文案
    historyPage(0, 3)
      .then((list) => {
        if (alive) setRuns(list);
      })
      .catch(() => {
        if (alive) setRuns([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const start = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStartErr("");
    try {
      const v = await rehearsalStart();
      navigate("/interview/session", {
        state: { runId: v.runId, stem: v.stem, maxRound: v.maxRound, round: v.round },
      });
    } catch (e) {
      setStartErr(e instanceof Error ? e.message : "开场失败，请重试");
      setBusy(false);
      busyRef.current = false;
    }
  };

  if (!ready) return LOADING;
  if (!summary) return failBox(loadErr || "加载失败，请稍后重试");

  const summaryText =
    summary.avgScore == null
      ? SUMMARY_FALLBACK
      : `已面 ${summary.total} 场 · 平均 ${summary.avgScore} 分`;

  return (
    <Frame21051
      summaryText={summaryText}
      totalText={`全部 ${summary.total} 场`}
      runs={(runs ?? []).map(toItem)}
      busy={busy}
      error={startErr}
      onStart={() => void start()}
    />
  );
};

export default InterviewScreen;
