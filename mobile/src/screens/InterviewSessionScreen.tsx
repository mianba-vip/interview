import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { rehearsalAnswer, rehearsalEnd } from '../api/drill';
import type { RehearsalView } from '../api/types';
import { MarkdownLite } from '../components/MarkdownLite';

type Msg = { id: number; role: 'interviewer' | 'me' | 'ai'; text: string };

/** 模拟面试进行中：面试官提问 → 学生作答 → 判分推进 → 讲解流式点评 → 结算。 */
export default function InterviewSessionScreen() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { view: RehearsalView } | null };
  const [view, setView] = useState<RehearsalView | null>(state?.view ?? null);
  const [msgs, setMsgs] = useState<Msg[]>(() =>
    state?.view ? [{ id: 1, role: 'interviewer', text: state.view.stem }] : [],
  );
  const [explain, setExplain] = useState('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, explain]);

  const submit = () => {
    const text = inputRef.current.trim();
    if (!text || streaming || !view) return;
    setMsgs((m) => [...m, { id: m.length + 1, role: 'me', text }]);
    setInput('');
    inputRef.current = '';
    setStreaming(true);
    setErr('');
    rehearsalAnswer(view.runId, text, {
      onResult: (v) => {
        setView(v);
        if (v.finished) setStreaming(false);
      },
      onToken: (t) => setExplain((x) => x + t),
      onDone: () => {
        setStreaming(false);
        if (view && !view.finished) {
          setMsgs((m) => [...m, { id: m.length + 2, role: 'interviewer', text: view.stem }]);
        }
      },
      onError: (_s, m2) => {
        setStreaming(false);
        setErr(m2 ?? '回复失败');
      },
    });
  };

  const doEnd = async () => {
    if (!view) return;
    try {
      const v = await rehearsalEnd(view.runId);
      setView(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '结算失败');
    }
  };

  const finished = view?.finished;

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate('/interview')}>
          <ChevronLeft size={22} />
        </button>
        <span className="pill" style={{ background: 'var(--sky-soft)', color: '#2f6fd1' }}>
          第 {view?.round ?? 1} / {view?.maxRound ?? '—'} 问
        </span>
        <div style={{ flex: 1 }} />
        {!finished && (
          <button className="finish-btn" onClick={doEnd} disabled={streaming}>
            结束并结算
          </button>
        )}
      </div>

      {err && <div className="form-err">{err}</div>}

      {finished && view && (
        <div className="card" style={{ textAlign: 'center' }}>
          <span className={'review-badge ' + (view.allPassed ? 'g-good' : 'g-hard')}>
            {view.allPassed ? '全部通过' : '本场结束'}
          </span>
          <div className="score-big">{view.score ?? 0}<small> 分</small></div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            共 {view.round} 轮 · {view.roundScores.join(' / ')}
          </div>
        </div>
      )}

      <div className="chat-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className={'msg-row ' + (m.role === 'me' ? 'me' : 'ai')}>
            <div className="bubble">
              {m.role === 'interviewer' && <div style={{ fontSize: 12, color: 'var(--sky)', fontWeight: 700, marginBottom: 4 }}>面试官</div>}
              <MarkdownLite text={m.text} />
            </div>
          </div>
        ))}
        {explain && (
          <div className="msg-row ai">
            <div className="bubble">
              <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>点评讲解</div>
              <MarkdownLite text={explain} />
            </div>
          </div>
        )}
        {streaming && !explain && (
          <div className="msg-row ai">
            <div className="bubble">面试官正在点评…</div>
          </div>
        )}
      </div>

      {!finished && (
        <div className="inputbar">
          <div className="inputbar-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的回答…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button className="send-btn" disabled={streaming || !input.trim()} onClick={submit}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
