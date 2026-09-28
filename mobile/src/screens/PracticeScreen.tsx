import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { conversation, historyPage } from '../api/drill';
import type { ChatMsg, ConversationView, RunSummaryView } from '../api/types';

const BADGE_CLS: Record<string, string> = {
  GOOD: 'badge-good',
  EASY: 'badge-easy',
  HARD: 'badge-hard',
  MISSING: 'badge-miss',
  AGAIN: 'badge-miss',
};

const PAGE = 20;

/** 列表标题用纯文本：剥掉 **加粗**、`代码`、#、> 等 Markdown 记号（一行标题不需要 md 排版）。 */
function plainStem(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const day = 86400000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (that === today) return `今天 ${hm}`;
  if (today - that === day) return `昨天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 练习 Tab：进行中（可多条）+ 历史练习（懒加载分页，最新在前），照设计稿布局。 */
export default function PracticeScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RunSummaryView[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstDone, setFirstDone] = useState(false);
  const [turnsByRun, setTurnsByRun] = useState<Record<number, number>>({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await historyPage(offsetRef.current, PAGE);
      offsetRef.current += page.length;
      if (page.length < PAGE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
      setItems((prev) => [...prev, ...page]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加载失败');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setFirstDone(true);
    }
  }, []);

  // 首屏加载 + 底部哨兵懒加载（滚近底部 200px 自动拉下一页）
  useEffect(() => {
    void loadMore();
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 进行中的对话（READY/ANSWERING，可能多条）：拉会话取对话轮次
  const ongoing = items.filter((x) => x.status === 'ANSWERING' || x.status === 'READY');
  useEffect(() => {
    for (const r of ongoing) {
      if (turnsByRun[r.runId] !== undefined) continue;
      conversation(r.questionId)
        .then((c: ConversationView) => {
          const run = c.runs.find((x) => x.runId === r.runId) ?? c.runs[c.runs.length - 1];
          setTurnsByRun((m) => ({ ...m, [r.runId]: run?.turns.length ?? 1 }));
        })
        .catch(() => setTurnsByRun((m) => ({ ...m, [r.runId]: 1 })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const graded = items.filter((x) => x.status === 'GRADED');
  const weekStart = Date.now() - 7 * 86400000;
  const weekCount = graded.filter((x) => x.answeredAt && new Date(x.answeredAt).getTime() >= weekStart).length;

  const open = async (r: RunSummaryView) => {
    if (busy !== null) return;
    setBusy(r.runId);
    try {
      if (r.status === 'ANSWERING' || r.status === 'READY') {
        const c = await conversation(r.questionId);
        const run = c.runs.find((x) => x.runId === r.runId) ?? c.runs[c.runs.length - 1];
        const messages: ChatMsg[] = [];
        let id = 0;
        for (const turn of run?.turns ?? []) {
          if (turn.rawAnswer) messages.push({ id: ++id, role: 'me', text: turn.rawAnswer });
          if (turn.tutorText) messages.push({ id: ++id, role: 'ai', text: turn.tutorText });
        }
        navigate(`/run/${r.runId}`, {
          state: {
            view: { runId: r.runId, questionId: r.questionId, stem: c.stem, responseFormat: c.responseFormat },
            messages,
          },
        });
      } else {
        navigate(`/review/${r.runId}`, { state: { stem: r.stem } });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '加载失败');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="greet-title">练习</div>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          本周 {weekCount} 题 · 目标 {graded.length + ongoing.length} 题
        </span>
      </div>

      <div className="hint-card">
        <span className="hint-icon"><Sparkles size={18} /></span>
        <div>
          <div style={{ fontWeight: 800 }}>AI 导师只提问引导，不直接给答案</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            先想通，才是真的会——把答案说出口前，先自己想一遍。
          </div>
        </div>
      </div>

      {err && <div className="form-err">{err}</div>}

      {ongoing.map((r) => (
        <button key={r.runId} className="task-card ongoing-card" onClick={() => open(r)} disabled={busy !== null}>
          <div className="task-head">
            <span className="pill" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>● 进行中</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              第 {turnsByRun[r.runId] ?? 1} 轮对话中
            </span>
          </div>
          <div className="hist-title">{plainStem(r.stem).slice(0, 30)}{plainStem(r.stem).length > 30 ? '…' : ''}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
            对话轮次 {turnsByRun[r.runId] ?? 1}
          </div>
        </button>
      ))}

      <div className="section-h">
        历史练习 <small>{graded.length ? `全部 ${graded.length} 次` : ''}</small>
      </div>

      {firstDone && graded.length === 0 && !hasMore && (
        <div className="center-note">还没有已完成的练习</div>
      )}
      {graded.map((r) => {
        const title = plainStem(r.stem);
        return (
          <button key={r.runId} className="task-card hist-card" onClick={() => open(r)} disabled={busy !== null}>
            <div className="task-head">
              <span className="hist-title">{title.slice(0, 30)}{title.length > 30 ? '…' : ''}</span>
              <span className={'grade-badge ' + ((r.grade && BADGE_CLS[r.grade]) || 'badge-easy')}>
                {r.grade ?? '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{dayLabel(r.answeredAt)}</span>
              <ChevronRight size={16} style={{ color: 'var(--ink-faint)' }} />
            </div>
          </button>
        );
      })}

      <div ref={sentinelRef} />
      {loading && (
        <div className="center-note"><Loader2 size={18} className="spin" /> 加载中…</div>
      )}
      {firstDone && !hasMore && graded.length > 0 && (
        <div className="center-note" style={{ fontSize: 13, color: 'var(--ink-faint)' }}>— 到底了 —</div>
      )}
    </div>
  );
}
