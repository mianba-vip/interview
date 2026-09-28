import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Frame21403 from '../frames/Frame21403';
import { apiFetch } from '../api/client';
import { logout } from '../api/auth';
import { knowledgeApi } from '../api/knowledge';
import { userApi } from '../api/user';
import { history, profile } from '../api/drill';
import { loadPrefs } from '../lib/prefs';
import type { RunSummaryView, TopicProfile, UserProfileView } from '../api/types';

/** 我的：资料完成度 / 学习统计 / 掌握度分布 / 设置入口——视觉 = Frame21403（Pixso 直迁）。 */
export default function MeScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfileView | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [hist, setHist] = useState<RunSummaryView[]>([]);
  const [due, setDue] = useState(0);
  const [model, setModel] = useState('—');
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      userApi.profile(),
      profile(),
      history(),
      knowledgeApi.due(),
      apiFetch<{ model: string }>('/settings/ai').catch(() => ({ model: '—' })),
    ])
      .then(([u, t, h, d, ai]) => {
        setMe(u);
        setTopics(t);
        setHist(h);
        setDue(d.length);
        setModel(ai.model || '—');
      })
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const totalPractice = hist.reduce((s, r) => s + r.runCount, 0);
  const completion = me
    ? Math.min(100, Math.round((([me.nickname, me.phone, me.gender, me.birthday].filter(Boolean).length + 1) / 5) * 100))
    : 0;

  // 连续学习天数：按作答日期去重后从今天（或昨天）往回数
  const days = [...new Set(hist.map((r) => r.answeredAt.slice(0, 10)))].sort().reverse();
  let streak = 0;
  if (days.length > 0) {
    const d = new Date(days[0] + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if ((today.getTime() - d.getTime()) / 86400000 <= 1) {
      streak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1] + 'T00:00:00');
        const cur = new Date(days[i] + 'T00:00:00');
        if ((prev.getTime() - cur.getTime()) / 86400000 === 1) streak++;
        else break;
      }
    }
  }

  const names = concepts.filter((c) => c.masteryLevel >= 2).map((c) => c.name);
  const skillPreview = names.length
    ? `已掌握：${names.slice(0, 3).join(' · ')}${names.length > 3 ? ` 等 ${names.length} 个知识点` : ''}`
    : '已掌握：暂无';
  const prefs = loadPrefs();
  const themeLabel = { cream: '奶油白天', white: '纯白', system: '跟随系统' }[prefs.theme];
  const fontLabel = ['小', '标准', '大'][prefs.fontScale];
  const topic = topics[0];
  const subtitle = topic ? `${topic.topic} · L${topic.masteredLayer ?? 1} 筑基` : '';
  const name = me?.nickname || me?.username || '同学';

  return (
    <div style={{ paddingBottom: 16 }}>
      {err && <div className="form-err" style={{ margin: '0 20px' }}>{err}</div>}
      <Frame21403
        name={name}
        subtitle={subtitle}
        joinedText=""
        completion={completion}
        streak={streak}
        totalPractice={totalPractice}
        due={due}
        total={concepts.length}
        mastered={mastered}
        inProgress={inProgress}
        notMastered={notMastered}
        skillPreview={skillPreview}
        themeLabel={themeLabel}
        fontLabel={fontLabel}
        model={model}
        onAppearance={() => navigate('/settings/appearance')}
        onAiSettings={() => navigate('/settings/ai')}
      />
      <div style={{ textAlign: 'center', paddingBottom: 12 }}>
        <button
          style={{ color: 'var(--coral)', fontWeight: 700, fontSize: 14 }}
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
