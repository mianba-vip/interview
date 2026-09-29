import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2579 from "@/views/Frame2579";
import { conversation, history, historyPage } from "@/api/drill";
import type { ChatMsg, ConversationView, RunSummaryView } from "@/api/types";

const PAGE = 20;

/** 本周（周一 00:00 起）已作答题数，喂给头部「本周 N 题 · 目标 15 题」。 */
function weekCountOf(list: RunSummaryView[]): number {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return list.filter((x) => {
    const t = new Date(x.answeredAt).getTime();
    return !Number.isNaN(t) && t >= monday.getTime();
  }).length;
}

/** 进行中已持续分钟数（至少 1 分钟）。 */
function minutesOf(r: RunSummaryView): number {
  const t = new Date(r.answeredAt).getTime();
  if (Number.isNaN(t)) return 1;
  return Math.max(1, Math.round((Date.now() - t) / 60000));
}

/** 练习页：模板 Frame2579 视觉 + 历史分页懒加载（最新在前）。 */
const PracticeScreen = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<RunSummaryView[]>([]); // 分页累加
  const [all, setAll] = useState<RunSummaryView[]>([]); // 全量 history（周计数/总数）
  const [convs, setConvs] = useState<Record<number, ConversationView | null>>({});
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState(""); // 历史模糊搜索关键词
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    try {
      const page = await historyPage(offsetRef.current, PAGE);
      offsetRef.current += page.length;
      if (page.length < PAGE) hasMoreRef.current = false;
      setItems((prev) => [...prev, ...page]);
    } catch (e) {
      hasMoreRef.current = false; // 出错即停，避免触底死循环
      setErr(e instanceof Error ? e.message : "加载失败");
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // 首屏：全量 history + 第一页；哨兵进入视口 200px 内续拉下一页
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        history().then(setAll).catch((e) => setErr(e instanceof Error ? e.message : "加载失败")),
        loadMore(),
      ]);
      setReady(true);
    };
    void init();

    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const ongoing = items.filter((x) => x.status === "ANSWERING" || x.status === "READY");
  const graded = items.filter((x) => x.status === "GRADED");
  /** 历史模糊搜索：去掉 markdown 记号后按题干子串匹配（大小写不敏感），作用于已加载页并可继续触底加载 */
  const needle = q.trim().toLowerCase().replace(/[#*>`_~]/g, "");
  const gradedShown = needle
    ? graded.filter((r) => r.stem.replace(/[#*>`_~]/g, "").toLowerCase().includes(needle))
    : graded;

  // 进行中条目补拉会话，用于「第 N 轮对话中 / 对话轮次」
  useEffect(() => {
    for (const r of ongoing) {
      if (r.runId in convs) continue;
      conversation(r.questionId)
        .then((c) => setConvs((m) => ({ ...m, [r.runId]: c })))
        .catch(() => setConvs((m) => ({ ...m, [r.runId]: null })));
    }
  }, [ongoing, convs]);

  const roundOf = (r: RunSummaryView): number => {
    const c = convs[r.runId];
    if (!c) return 1;
    const run = c.runs.find((x) => x.runId === r.runId) ?? c.runs[c.runs.length - 1];
    return Math.max(1, run?.turns.length ?? 1);
  };

  /** 点击语义：进行中回 /run/:runId（带已产生的对话），已判分去 /review/:runId */
  const open = async (runId: number) => {
    if (busy) return;
    const r = items.find((x) => x.runId === runId);
    if (!r) return;
    setBusy(true);
    setErr("");
    try {
      if (r.status === "ANSWERING" || r.status === "READY") {
        const c = convs[r.runId] ?? (await conversation(r.questionId));
        const run = c.runs.find((x) => x.runId === r.runId) ?? c.runs[c.runs.length - 1];
        const messages: ChatMsg[] = [];
        let id = 0;
        for (const turn of run?.turns ?? []) {
          if (turn.rawAnswer) messages.push({ id: ++id, role: "me", text: turn.rawAnswer });
          if (turn.tutorText) messages.push({ id: ++id, role: "ai", text: turn.tutorText });
        }
        navigate(`/run/${r.runId}`, {
          state: {
            view: {
              runId: r.runId,
              questionId: r.questionId,
              stem: c.stem,
              responseFormat: c.responseFormat,
            },
            messages,
          },
        });
      } else {
        navigate(`/review/${r.runId}`, { state: { stem: r.stem } });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "打开失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />;
  }
  if (err && items.length === 0) {
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

  return (
    <>
      {err && (
        <div
          onClick={() => setErr("")}
          style={{
            position: "fixed",
            bottom: 110,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "var(--color-brand-coral)",
            fontSize: 13,
            zIndex: 30,
          }}
        >
          {err}
        </div>
      )}
      <Frame2579
        weekCount={weekCountOf(all)}
        total={gradedShown.length}
        searchText={q}
        onSearchText={setQ}
        ongoing={ongoing.map((r) => ({
          runId: r.runId,
          title: r.stem,
          round: roundOf(r),
          minutes: minutesOf(r),
        }))}
        history={gradedShown.map((r) => ({
          runId: r.runId,
          stem: r.stem,
          answeredAt: r.answeredAt,
          grade: r.grade ?? "—",
        }))}
        onOngoingClick={(id) => void open(id)}
        onHistoryClick={(id) => void open(id)}
        sentinelRef={sentinelRef}
      />
    </>
  );
};

export default PracticeScreen;
