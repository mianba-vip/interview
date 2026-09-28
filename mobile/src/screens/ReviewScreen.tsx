import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Frame2877 from "@/views/Frame2877";
import type { ReviewRow } from "@/views/Frame2877";
import { conversation, review, runDetail, sedimentToCard } from "@/api/drill";
import type { GradeView, ReviewView, RunDetailView } from "@/api/types";

/** 路由状态：finish 判分后带来的 GradeView 与本次作答用时（秒），拿不到就走 runDetail 兜底 */
interface ReviewNavState {
  grade?: GradeView;
  elapsed?: number;
}

interface ByConceptGroup {
  pointResults?: { point?: string; verdict?: string }[];
}

/** byConceptJson → 评分点明细行（结构异常静默为空，卡片显示兜底文案） */
function parseRows(json: string | null | undefined): ReviewRow[] {
  try {
    const groups = JSON.parse(json ?? "[]") as ByConceptGroup[];
    return groups.flatMap((g) =>
      (g.pointResults ?? []).map((p) => ({
        point: p.point ?? "",
        verdict: (p.verdict ?? "MISS").toUpperCase(),
      })),
    );
  } catch {
    return [];
  }
}

/** 用时文案：优先 finish 跳转带过来的本地计时，推导不出给兜底 */
function timeTextOf(elapsed?: number): string {
  if (typeof elapsed !== "number" || !Number.isFinite(elapsed) || elapsed <= 0) return "用时 —";
  return elapsed >= 60
    ? `用时 ${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`
    : `用时 ${elapsed} 秒`;
}

const LOADING_BG = "var(--color-bg-cream)";

/** 复盘页：数据层（评级 + AI 复盘 + 对话线次数）→ 视觉层 Frame2877。 */
const ReviewScreen = () => {
  const { runId: runIdParam } = useParams();
  const runId = Number(runIdParam);
  const navigate = useNavigate();
  const { state } = useLocation() as { state: ReviewNavState | null };

  const [grade, setGrade] = useState<GradeView | null>(state?.grade ?? null);
  const [rv, setRv] = useState<ReviewView | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [loading, setLoading] = useState(!state?.grade);
  const [err, setErr] = useState("");
  const [rvErr, setRvErr] = useState("");
  const [sedimented, setSedimented] = useState(false);
  const [sedimenting, setSedimenting] = useState(false);

  // 取数：GradeView（finish 带过来）优先，否则 runDetail；AI 复盘并行拉但不阻塞首屏（LLM 慢）
  useEffect(() => {
    if (!Number.isFinite(runId) || runId <= 0) {
      setErr("无效的作答 ID");
      setLoading(false);
      return;
    }
    let alive = true;
    const gradeP: Promise<GradeView> = state?.grade
      ? Promise.resolve(state.grade)
      : runDetail(runId).then((d: RunDetailView) => ({
          runId: d.runId,
          questionId: d.questionId,
          rawScore: d.rawScore,
          grade: d.grade ?? "",
          byConceptJson: d.byConceptJson ?? "[]",
        }));
    review(runId)
      .then((r) => {
        if (alive) setRv(r);
      })
      .catch((e) => {
        if (alive) setRvErr(e instanceof Error ? e.message : "AI 复盘生成失败");
      });
    gradeP
      .then(async (g) => {
        if (!alive) return;
        setGrade(g);
        setLoading(false);
        // 第 N 次作答：本 run 在对话线里的序号
        try {
          const c = await conversation(g.questionId);
          if (!alive) return;
          const idx = c.runs.findIndex((x) => x.runId === runId);
          if (idx >= 0) setAttempt(idx + 1);
        } catch {
          /* 对话线拿不到 → 兜底第 1 次 */
        }
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : "加载失败");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [runId, state?.grade]);

  // 沉淀为知识卡：按钮态防重复点击
  const sediment = async () => {
    if (sedimenting || sedimented) return;
    setSedimenting(true);
    setErr("");
    try {
      await sedimentToCard(runId);
      setSedimented(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "沉淀失败，请重试");
    } finally {
      setSedimenting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", background: LOADING_BG }} />;
  }

  if (err && !grade) {
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

  const rows = parseRows(grade?.byConceptJson);
  const warn = err || rvErr || (grade ? "" : "评分数据缺失");
  const pending = "AI 复盘生成中…";

  return (
    <>
      {warn && (
        <div
          style={{
            position: "fixed",
            top: 56,
            left: 16,
            right: 16,
            zIndex: 40,
            background: "var(--color-brand-coralsoft)",
            color: "var(--color-brand-coral)",
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 13,
          }}
        >
          {warn}
        </div>
      )}
      <Frame2877
        grade={grade?.grade || "—"}
        score={String(Math.round(grade?.rawScore ?? 0))}
        timeText={timeTextOf(state?.elapsed)}
        attemptText={`第 ${attempt} 次作答`}
        rows={rows}
        weak={rv?.weakPoints ?? []}
        approach={rv ? rv.approach ?? "暂无解题思路" : pending}
        mnemonic={rv ? rv.mnemonic ?? "暂无记忆口诀" : pending}
        cardText={sedimented ? "已沉淀" : sedimenting ? "沉淀中…" : "沉淀为知识卡"}
        cardDisabled={sedimenting || sedimented}
        onBack={() => navigate(-1)}
        onCard={() => void sediment()}
      />
    </>
  );
};

export default ReviewScreen;
