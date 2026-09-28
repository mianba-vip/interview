import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { conversation, history } from '../api/drill';
import type { ChatMsg, ConversationView, RunSummaryView } from '../api/types';

const BADGE_CLS: Record<string, string> = {
  GOOD: 'badge-good',
  EASY: 'badge-easy',
  HARD: 'badge-hard',
  MISSING: 'badge-miss',
  AGAIN: 'badge-miss',
};



/** 练习 Tab：历史练习列表 → 继续进行中的 / 回看已判分的复盘。 */
export default function PracticeScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RunSummaryView[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    history()
      .then(setItems)
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const open = async (r: RunSummaryView) => {
    if (busy !== null) return;
    setBusy(r.runId);
    try {
      if (r.status === 'ANSWERING' || r.status === 'READY') {
        const conv: ConversationView = await conversation(r.questionId);
        const run = conv.runs.find((x) => x.runId === r.runId) ?? conv.runs[conv.runs.length - 1];
        const messages: ChatMsg[] = [];
        let id = 0;
        for (const turn of run?.turns ?? []) {
          if (turn.rawAnswer) messages.push({ id: ++id, role: 'me', text: turn.rawAnswer });
          if (turn.tutorText) messages.push({ id: ++id, role: 'ai', text: turn.tutorText });
        }
        navigate(`/run/${r.runId}`, {
          state: {
            view: { runId: r.runId, questionId: r.questionId, stem: conv.stem, responseFormat: 'FREE_TEXT' },
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
      <div className="greet-title">练习</div>
      <div className="greet-sub">AI 导师只提问引导，不直接给答案</div>
      {err && <div className="form-err">{err}</div>}
      {items === null && <div className="center-note">加载中…</div>}
      {items?.length === 0 && <div className="center-note">还没有练习记录，去首页开始第一题</div>}
      {items?.map((r) => (
        <button key={r.runId} className="task-card" onClick={() => open(r)} disabled={busy !== null}>
          <div className="task-head">
            <span className={'grade-badge ' + ((r.grade && BADGE_CLS[r.grade]) || 'badge-easy')}>
              {r.grade ?? (r.status === 'ANSWERING' ? '进行中' : r.status)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              {r.answeredAt.slice(0, 10)} · {r.runCount} 轮
            </span>
          </div>
          <div className="task-title">{r.stem.slice(0, 40)}{r.stem.length > 40 ? '…' : ''}</div>
          <div style={{ marginTop: 8, color: 'var(--primary)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
            {r.status === 'ANSWERING' ? '继续对话' : '查看复盘'} <ChevronRight size={15} />
          </div>
        </button>
      ))}
    </div>
  );
}
