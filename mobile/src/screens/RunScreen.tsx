import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { chatStream, finish as finishApi } from '../api/drill';
import type { ChatMsg, QuestionView } from '../api/types';
import { MarkdownLite } from '../components/MarkdownLite';

interface LocationState {
  view?: QuestionView;
  messages?: ChatMsg[];
}

/** 沉浸式答题页：题干 →（选择题点选 / 文本+语音占位）→ chat SSE 判定流 → 结束并评分。 */
export default function RunScreen() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState | null };
  const view = state?.view ?? null;
  const [msgs, setMsgs] = useState<ChatMsg[]>(state?.messages ?? []);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [err, setErr] = useState('');
  const [finishing, setFinishing] = useState(false);
  const idRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs]);

  if (!view) {
    return (
      <div className="screen screen-immersive">
        <div className="immersive-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="center-note">请从今日任务或练习历史进入本题。</div>
      </div>
    );
  }

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setErr('');
    setMsgs((m) => [...m, { id: ++idRef.current, role: 'me', text }]);
    setInput('');
    setStreaming(true);
    const aiId = ++idRef.current;
    let created = false;
    const ensureAi = () => {
      setMsgs((m) => {
        if (created) return m;
        created = true;
        return [...m, { id: aiId, role: 'ai', text: '', reasoning: '' }];
      });
    };
    chatStream(view.runId, text, revealed, {
      onToken: (t) => {
        ensureAi();
        setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, text: x.text + t } : x)));
      },
      onReasoning: (t) => {
        ensureAi();
        setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, reasoning: (x.reasoning ?? '') + t } : x)));
      },
      onReveal: () => setRevealed(true),
      onDone: () => setStreaming(false),
      onError: (_status, message) => {
        setStreaming(false);
        setErr(message ?? '回复失败');
        setMsgs((m) => m.map((x) => (x.id === aiId ? { ...x, text: x.text || '（回复失败）' } : x)));
      },
    });
  };

  const doFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    setErr('');
    try {
      const grade = await finishApi(view.runId);
      navigate(`/review/${view.runId}`, { state: { grade, stem: view.stem } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '评分失败，请重试');
      setFinishing(false);
    }
  };

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate('/tasks')}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }} />
        <button className="finish-btn" disabled={finishing || msgs.length === 0} onClick={doFinish}>
          {finishing ? (
            <>
              <Loader2 size={14} className="spin" /> 判分中…
            </>
          ) : (
            '结束并评分'
          )}
        </button>
      </div>
      {revealed && <div className="reveal-banner">已揭示答案 · 本次评分封顶 AGAIN</div>}
      {err && <div className="form-err">{err}</div>}

      <div className="stem-card">
        <MarkdownLite text={view.stem} />
      </div>

      <div className="chat-list" ref={listRef}>
        {msgs.map((m) => (
          <div key={m.id} className={'msg-row ' + (m.role === 'me' ? 'me' : 'ai')}>
            <div className="bubble">
              {m.role === 'ai' && m.reasoning ? (
                <details className="think">
                  <summary>AI 思考过程</summary>
                  <div className="think-body">{m.reasoning}</div>
                </details>
              ) : null}
              {m.role === 'ai' ? <MarkdownLite text={m.text} /> : m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="inputbar">
        <div className="inputbar-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={view.responseFormat === 'CHOICE' ? '输入选项字母，如 B' : '输入你的回答…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button className="send-btn" disabled={streaming || !input.trim()} onClick={send}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
