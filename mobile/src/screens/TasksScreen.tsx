import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import MasteryRing from '../components/MasteryRing';
import { today, startTask, profile } from '../api/drill';
import type { DailyTaskView, TopicProfile } from '../api/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

/** 首页：学习进度总览 + 今日任务（预生成题秒开）。 */
export default function TasksScreen() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTaskView[] | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [err, setErr] = useState('');
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([today(), profile()])
      .then(([t, p]) => {
        setTasks(t);
        setTopics(p);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const progress = concepts.length ? Math.round((mastered / concepts.length) * 100) : 0;

  const open = async (t: DailyTaskView) => {
    if (starting !== null || t.status !== 'READY') return;
    setStarting(t.id);
    try {
      const view = await startTask(t.id);
      navigate(`/run/${view.runId}`, { state: view });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '开题失败，请重试');
    } finally {
      setStarting(null);
    }
  };

  const direction = tasks?.[0]?.planTitle ?? '';

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="greet-title">{greeting()}</div>
          <div className="greet-sub">🔥 连续学习 7 天</div>
        </div>
        {direction && <span className="direction-pill">{direction} ⌄</span>}
      </div>

      {err && <div className="form-err">{err}</div>}

      <div className="card">
        <div className="card-title">掌握度总览</div>
        <div className="donut-row">
          <MasteryRing mastered={mastered} inProgress={inProgress} notMastered={notMastered} />
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--mint)' }} /> 已掌握 {mastered}
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--lemon)' }} /> 进行中 {inProgress}
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--coral)' }} /> 未掌握 {notMastered}
            </div>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">本月学习进度 {progress}%</div>
      </div>

      <div className="section-h">
        今日任务 <small>{tasks ? `${tasks.length} 项` : ''}</small>
      </div>

      {tasks === null && (
        <div className="center-note">
          <Loader2 size={20} className="spin" /> 加载中…
        </div>
      )}
      {tasks?.map((t) => (
        <button key={t.id} className="task-card" onClick={() => open(t)} disabled={starting !== null}>
          <div className="task-head">
            <span className={'pill ' + (t.kind === 'REVIEW' ? 'pill-review' : 'pill-new')}>
              {t.kind === 'REVIEW' ? '复习' : '新学'}
            </span>
            {t.status === 'READY' && <span className="task-status status-ready">已就绪 · 秒开</span>}
            {t.status === 'PENDING' && (
              <span className="task-status status-pending">
                <RefreshCw size={12} style={{ marginRight: 4 }} />
                生成中…
              </span>
            )}
            {t.status === 'DONE' && <span className="task-status">已完成 ✓</span>}
          </div>
          <div className="task-title">{t.conceptName}</div>
          {t.status === 'READY' && (
            <div style={{ marginTop: 10, color: 'var(--primary)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 2 }}>
              开始练习 <ChevronRight size={16} />
            </div>
          )}
        </button>
      ))}
      {starting !== null && (
        <div className="center-note">
          <Loader2 size={18} className="spin" /> 正在开题…
        </div>
      )}
    </div>
  );
}
