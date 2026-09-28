import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { apiFetch } from '../api/client';

interface AiSettings {
  provider: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  temperature: number;
  reasoningEffort: string;
  supportsVision: boolean;
}

/** AI 模型设置（只读）：当前 Provider / 模型 / 密钥状态。修改请到网页端设置页。 */
export default function AiSettingsScreen() {
  const navigate = useNavigate();
  const [s, setS] = useState<AiSettings | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch<AiSettings>('/settings/ai')
      .then(setS)
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate('/me')}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 18 }}>AI 模型设置</span>
      </div>

      {err && <div className="form-err">{err}</div>}
      {s && (
        <div className="card">
          <div className="detail-row"><span>Provider</span><b>{s.provider}</b></div>
          <div className="detail-row"><span>模型</span><b>{s.model}</b></div>
          <div className="detail-row"><span>接口地址</span><b>{s.baseUrl}</b></div>
          <div className="detail-row"><span>密钥状态</span><b>{s.hasApiKey ? '已配置 ✓' : '未配置（去网页端设置）'}</b></div>
          <div className="detail-row"><span>思考强度</span><b>{s.reasoningEffort || '默认'}</b></div>
          <div className="detail-row" style={{ borderBottom: 'none' }}><span>支持图片</span><b>{s.supportsVision ? '是' : '否'}</b></div>
        </div>
      )}
      <div className="center-note" style={{ fontSize: 13 }}>
        密钥按账号保存在服务端，桌面端仅本机保存、随请求头传入。
      </div>
    </div>
  );
}
