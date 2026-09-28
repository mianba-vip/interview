import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2394 from "@/views/Frame2394";
import { debtCount, history, profile, startTask, today } from "@/api/drill";
import { userApi } from "@/api/user";
import type { DailyTaskView, RunSummaryView, TopicProfile } from "@/api/types";

/** 连续学习天数：按 history().answeredAt 的日期倒推（今天没练则从昨天起算）。 */
function streakOf(list: RunSummaryView[]): number {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const days = new Set<string>();
  for (const it of list) {
    const d = new Date(it.answeredAt);
    if (!Number.isNaN(d.getTime())) days.add(dayKey(d));
  }
  if (!days.size) return 0;
  const cur = new Date();
  if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cur))) {
    n += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

/** 卡片标题：概念名优先；兜底取题干首个非空行（去 markdown 记号、截 40 字），绝不整段上卡。 */
function cardTitle(conceptName: string, stem: string | null): string {
  if (conceptName) return conceptName;
  const first = (stem || "")
    .replace(/[#*>`~]/g, "")
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s);
  return first ? first.slice(0, 40) : "未命名任务";
}

/** 首页：模板 Frame2394 视觉 + 今日任务/掌握度/连续天数等真实数据。 */
const HomeScreen = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTaskView[]>([]);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [name, setName] = useState("");
  const [debt, setDebt] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tip, setTip] = useState("");

  useEffect(() => {
    Promise.all([today(), profile(), userApi.profile(), debtCount(), history()])
      .then(([t, p, u, d, h]) => {
        setTasks(t);
        setTopics(p);
        setDebt(d);
        setName(u.nickname || u.username || "同学");
        setStreak(streakOf(h));
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const progress = concepts.length ? Math.round((mastered / concepts.length) * 100) : 0;

  /** 开题 → 练习页 */
  const openTask = async (taskId: number) => {
    setTip("");
    try {
      const q = await startTask(taskId);
      navigate(`/run/${q.runId}`);
    } catch (e) {
      setTip(e instanceof Error ? e.message : "开题失败，请重试");
    }
  };

  /** 卡片点击：点哪个开哪个；任务列表为空兜底去练习 Tab */
  const onTaskClick = (id: number) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) {
      navigate("/practice");
      return;
    }
    void openTask(t.id);
  };

  /** 「开始练习」主按钮：开第一个可开始的任务，无可开任务就去练习 Tab */
  const onStart = () => {
    const target = tasks.find((t) => t.status === "READY") ?? tasks.find((t) => t.status !== "DONE");
    if (!target) {
      navigate("/practice");
      return;
    }
    void openTask(target.id);
  };

  /** 卡片「先听讲解 →」：带概念与子点进讲解页 */
  const onLesson = (conceptId: number, subPoint: string | null) => {
    navigate("/lesson", { state: { conceptId, subPoint: subPoint ?? undefined } });
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />;
  }
  if (err) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-cream)",
          color: "var(--color-brand-coral)",
          padding: "80px 24px",
          fontSize: 14,
        }}
      >
        {err}
      </div>
    );
  }

  const taskSummary = `${tasks.length} 项 · 约 ${tasks.length * 8} 分钟`;

  return (
    <>
      {tip && (
        <div
          onClick={() => setTip("")}
          style={{
            position: "fixed",
            top: 72,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "var(--color-brand-coral)",
            fontSize: 13,
            zIndex: 30,
          }}
        >
          {tip}
        </div>
      )}
      <Frame2394
        name={name}
        streakDays={streak}
        direction={tasks[0]?.planTitle || "Go 后端工程师"}
        mastered={mastered}
        inProgress={inProgress}
        notMastered={notMastered}
        total={concepts.length}
        unlockHint="L1 达标 50% 解锁 L2"
        progress={progress}
        taskSummary={taskSummary}
        tasks={tasks.map((t) => ({
          id: t.id,
          kind: t.kind,
          // 卡片标题用概念名（题干是整段 markdown，会把卡片撑成文字墙）
          title: cardTitle(t.conceptName, t.stem),
          status: t.status,
          conceptId: t.conceptId,
          subPoint: t.subPoint,
        }))}
        debtText={debt > 0 ? `${debt} 条未闭环作答等待收尾` : "暂无未闭环作答"}
        onTaskClick={onTaskClick}
        onStart={onStart}
        onLesson={onLesson}
      />
    </>
  );
};

export default HomeScreen;
