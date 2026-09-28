import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

/** 登录页：邮箱 + 密码（与桌面端同一账号体系，token 存本机）。 */
export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setErr('');
    if (!email.trim() || !password) { setErr('请输入邮箱和密码'); return; }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/tasks', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen screen-immersive">
      <div className="login-logo">面霸</div>
      <div className="login-slogan">AI 导师陪你练过每一道面试题</div>
      <div className="field">
        <input
          type="email"
          placeholder="邮箱"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <input
          type="password"
          placeholder="密码"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      {err && <div className="form-err">{err}</div>}
      <div style={{ marginTop: 24 }}>
        <button className="btn-primary" disabled={busy} onClick={submit}>
          {busy ? '登录中…' : '登录'}
        </button>
      </div>
    </div>
  );
}
