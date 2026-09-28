import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2394 from "@/views/Frame2394";
import { debtCount, history, profile, startTask, today } from "@/api/drill";
import { listPlans } from "@/api/plan";
import type { PlanView } from "@/api/plan";
import { readActivePlanId } from "@/lib/activePlan";
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
  const [plans, setPlans] = useState<PlanView[]>([]);
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

  // 方向列表：拿不到就留空 → 知识点清单整卡不渲染
  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const progress = concepts.length ? Math.round((mastered / concepts.length) * 100) : 0;

  /** 当前方向：readActivePlanId 命中列表，否则取第一个 */
  const activeId = readActivePlanId();
  const dirPlan = plans.find((p) => p.id === activeId) ?? plans[0] ?? null;
  /** 按方向过滤任务；方向对不上时全量兜底（防止方向不匹配时首页空掉） */
  const hitId = dirPlan && tasks.some((t) => t.planId === dirPlan.id) ? dirPlan.id : null;
  const shownTasks = hitId === null ? tasks : tasks.filter((t) => t.planId === hitId);
  /** 知识点清单：当前方向全部层级；方向拿不到就不传，整卡不渲染 */
  const points = dirPlan?.concepts.length
    ? dirPlan.concepts.map((c) => ({ layer: c.layer, name: c.name, masteryLevel: c.masteryLevel }))
    : undefined;

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

  /** 卡内「开始练习」：直接开这张卡的题 */
  const onStartTask = (id: number) => {
    void openTask(id);
  };

  /** 卡片主体 /「先听讲解 →」：带概念、子点与任务进讲解页 */
  const onLesson = (conceptId: number, subPoint: string | null, taskId: number) => {
    navigate("/lesson", { state: { conceptId, subPoint: subPoint ?? undefined, taskId } });
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

  const taskSummary = `${shownTasks.length} 项 · 约 ${shownTasks.length * 8} 分钟`;

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
        direction={dirPlan?.title || tasks[0]?.planTitle || "Go 后端工程师"}
        mastered={mastered}
        inProgress={inProgress}
        notMastered={notMastered}
        total={concepts.length}
        unlockHint="L1 达标 50% 解锁 L2"
        progress={progress}
        taskSummary={taskSummary}
        tasks={shownTasks.map((t) => ({
          id: t.id,
          kind: t.kind,
          // 卡片标题用概念名（题干是整段 markdown，会把卡片撑成文字墙）
          title: cardTitle(t.conceptName, t.stem),
          status: t.status,
          conceptId: t.conceptId,
          subPoint: t.subPoint,
        }))}
        points={points}
        debtText={debt > 0 ? `${debt} 条未闭环作答等待收尾` : "暂无未闭环作答"}
        onStartTask={onStartTask}
        onLesson={onLesson}
      />
    </>
  );
};

export default HomeScreen;
