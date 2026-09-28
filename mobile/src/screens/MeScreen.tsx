import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { knowledgeApi } from '../api/knowledge';
import { userApi } from '../api/user';
import { history, profile } from '../api/drill';
import { logout } from '../api/auth';
import type { RunSummaryView, TopicProfile, UserProfileView } from '../api/types';


/** 我的：资料完成度 + 学习统计 + 掌握度分布 + 设置入口。 */
export default function MeScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfileView | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [hist, setHist] = useState<RunSummaryView[] | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([userApi.profile(), profile(), history(), knowledgeApi.due()])
      .then(([u, t, h, due]) => {
        setMe(u);
        setTopics(t);
        setHist(h);
        setDueCount(due.length);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const totalPractice = (hist ?? []).reduce((sum, r) => sum + r.runCount, 0);
  const display = me?.nickname || me?.username || me?.email || '学习者';
  const filled = [me?.nickname, me?.phone, me?.gender, me?.birthday].filter(Boolean).length;
  const completion = me ? Math.round(((filled + 1) / 5) * 100) : 0;
  const masteredNames = topics
    .flatMap((t) => t.concepts)
    .filter((c) => c.masteryLevel >= 2)
    .map((c) => c.name);

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="greet-title">我的</div>
        <button
          style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 14 }}
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
        >
          退出登录
        </button>
      </div>

      {err && <div className="form-err">{err}</div>}

      <div className="card me-profile">
        <div className="me-avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
          {display.slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{display}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{me?.email ?? ''}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{completion}%</div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>资料完成度</div>
        </div>
      </div>

      <div className="card stats-row">
        <div className="stat">
          <div className="stat-num">{totalPractice}</div>
          <div className="stat-label">累计练习</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--mint)' }}>{mastered}</div>
          <div className="stat-label">已掌握</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: 'var(--coral)' }}>{dueCount ?? '—'}</div>
          <div className="stat-label">待复习</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="card-title">掌握度分布</span>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{concepts.length} 个知识点</span>
        </div>
        <div className="bar3">
          <div style={{ width: `${concepts.length ? (mastered / concepts.length) * 100 : 0}%`, background: 'var(--mint)' }} />
          <div style={{ width: `${concepts.length ? (inProgress / concepts.length) * 100 : 0}%`, background: 'var(--lemon)' }} />
          <div style={{ flex: 1, background: 'var(--coral)' }} />
        </div>
        <div className="bar3-legend">
          <span>● 已掌握 {mastered}</span>
          <span>● 进行中 {inProgress}</span>
          <span>● 未掌握 {notMastered}</span>
        </div>
      </div>

      <button className="card row-card" onClick={() => navigate('/me/skills')} disabled>
        <div>
          <div className="card-title">技能画像</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            已掌握：{masteredNames.slice(0, 4).join(' · ') || '暂无'}{masteredNames.length > 4 ? ` 等 ${masteredNames.length} 个` : ''}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
      </button>

      <button className="card row-card" onClick={() => navigate('/settings/appearance')}>
        <span className="row-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>🎨</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="card-title">外观设置</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>奶油白天 · 字号：标准</div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
      </button>

      <button className="card row-card" onClick={() => navigate('/settings/ai')}>
        <span className="row-icon" style={{ background: 'var(--mint-soft)', color: '#1d8a82' }}>🤖</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="card-title">AI 模型设置</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>查看当前模型与密钥状态</div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
      </button>

      <div className="card row-card" style={{ opacity: 0.6 }}>
        <span className="row-icon" style={{ background: 'var(--lemon-soft)', color: '#8a6d0b' }}>📚</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="card-title">学习方向管理</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>即将开放</div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--ink-faint)' }} />
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
}
