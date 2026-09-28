import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { conversation, history } from '../api/drill';
import type { ChatMsg, ConversationView, RunSummaryView } from '../api/types';

const BADGE_CLS: Record<string, string> = {
  GOOD: 'badge-good',
  EASY: 'badge-easy',
  HARD: 'badge-hard',
  MISSING: 'badge-miss',
  AGAIN: 'badge-miss',
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const day = 86400000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (that === today) return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (today - that === day) return `昨天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 练习 Tab：进行中的置顶卡 + 历史练习列表（按设计稿·练习Tab 实现）。 */
export default function PracticeScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RunSummaryView[] | null>(null);
  const [conv, setConv] = useState<ConversationView | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    history()
      .then((h) => {
        setItems(h);
        const active = h.find((x) => x.status === 'ANSWERING');
        if (active) {
          conversation(active.questionId)
            .then(setConv)
            .catch(() => {});
        }
      })
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const ongoing = items?.find((x) => x.status === 'ANSWERING') ?? null;
  const ongoingRun = ongoing && conv ? conv.runs.find((x) => x.runId === ongoing.runId) ?? null : null;
  const graded = (items ?? []).filter((x) => x.status === 'GRADED');
  const weekStart = Date.now() - 7 * 86400000;
  const weekCount = (items ?? []).filter((x) => x.answeredAt && new Date(x.answeredAt).getTime() >= weekStart).length;

  const open = async (r: RunSummaryView) => {
    if (busy !== null) return;
    setBusy(r.runId);
    try {
      if (r.status === 'ANSWERING' || r.status === 'READY') {
        const c = conv && conv.questionId === r.questionId ? conv : await conversation(r.questionId);
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
          本周 {weekCount} 题 · 目标 {(items ?? []).length || '—'} 题
        </span>
      </div>

      <div className="card hint-card">
        <span className="hint-icon"><Sparkles size={18} /></span>
        <div>
          <div style={{ fontWeight: 800 }}>AI 导师只提问引导，不直接给答案</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            先想通，才是真的会——把答案说出口前，先自己想一遍。
          </div>
        </div>
      </div>

      {ongoing && (
        <button className="card task-card ongoing-card" onClick={() => open(ongoing)} disabled={busy !== null}>
          <div className="task-head">
            <span className="pill" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>● 进行中</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              第 {ongoingRun?.turns.length ?? 1} 轮对话中
            </span>
          </div>
          <div className="task-title">{ongoing.stem.slice(0, 30)}{ongoing.stem.length > 30 ? '…' : ''}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-soft)' }}>
            对话轮次 {ongoingRun?.turns.length ?? 1}
          </div>
        </button>
      )}

      <div className="section-h">
        历史练习 <small>全部 {(graded.length || (items ?? []).length)} 次</small>
      </div>

      {err && <div className="form-err">{err}</div>}
      {items === null && <div className="center-note">加载中…</div>}
      {items !== null && graded.length === 0 && (
        <div className="center-note">还没有已完成的练习</div>
      )}
      {graded.map((r) => (
        <button key={r.runId} className="task-card" onClick={() => open(r)} disabled={busy !== null}>
          <div className="task-head">
            <span className="task-title" style={{ margin: 0 }}>
              {r.stem.slice(0, 26)}{r.stem.length > 26 ? '…' : ''}
            </span>
            <span className={'grade-badge ' + ((r.grade && BADGE_CLS[r.grade]) || 'badge-easy')}>
              {r.grade ?? '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{dayLabel(r.answeredAt)}</span>
            <ChevronRight size={16} style={{ color: 'var(--ink-faint)' }} />
          </div>
        </button>
      ))}
    </div>
  );
}
