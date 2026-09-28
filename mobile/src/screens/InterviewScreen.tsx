import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rehearsalStart } from '../api/drill';

/** 面试 Tab：开始模拟面试（历史场次 P2 接入）。 */
export default function InterviewScreen() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const start = async () => {
    setBusy(true);
    setErr('');
    try {
      const view = await rehearsalStart();
      navigate('/interview/session', { state: { view } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '开场失败，请重试');
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <div className="greet-title">模拟面试</div>
      <div className="greet-sub">多轮追问 · 即时点评 · 结算评级</div>
      <div className="card interview-start">
        <div style={{ fontSize: 44 }}>🎤</div>
        <div className="card-title" style={{ marginTop: 10 }}>开始一场模拟面试</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 8 }}>
          面试官将围绕你的学习方向连续追问，作答后即时点评讲解，可随时结束结算评级。
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="btn-primary" disabled={busy} onClick={start}>
            {busy ? '准备中…' : '开始面试'}
          </button>
        </div>
        {err && <div className="form-err">{err}</div>}
      </div>
      <div className="section-h">说明 <small>历史场次 · 即将开放</small></div>
    </div>
  );
}
