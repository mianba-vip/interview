import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Frame2394 from '../frames/Frame2394';
import { debtCount, profile, startTask, today } from '../api/drill';
import { userApi } from '../api/user';
import type { DailyTaskView, TopicProfile } from '../api/types';

/** 首页：数据全部来自后端，视觉基准 = 导出 Frame2394（Pixso 源码直迁）。 */
export default function TasksScreen() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<DailyTaskView[] | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [name, setName] = useState('');
  const [debt, setDebt] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([today(), profile(), userApi.profile(), debtCount()])
      .then(([t, p, u, d]) => {
        setTasks(t);
        setTopics(p);
        setDebt(d);
        setName(u.nickname || u.username || '同学');
      })
      .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
  }, []);

  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const progress = concepts.length ? Math.round((mastered / concepts.length) * 100) : 0;

  const open = async (taskId: number) => {
    try {
      const view = await startTask(taskId);
      navigate(`/run/${view.runId}`, { state: { view } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '开题失败，请重试');
    }
  };

  const list = tasks ?? [];
  const taskSummary = `${list.length} 项 · 约 ${list.length * 8} 分钟`;

  return (
    <div style={{ paddingBottom: 96 }}>
      {err && <div className="form-err" style={{ margin: '0 20px' }}>{err}</div>}
      <Frame2394
        name={name}
        streakDays={7}
        direction={list[0]?.planTitle ?? ''}
        mastered={mastered}
        inProgress={inProgress}
        notMastered={notMastered}
        total={concepts.length}
        unlockHint="L1 达标 50% 解锁 L2"
        progress={progress}
        taskSummary={taskSummary}
        tasks={list.map((t) => ({ id: t.id, kind: t.kind, title: t.conceptName, status: t.status }))}
        debtText={debt > 0 ? `${debt} 条未闭环作答等待收尾` : '暂无未闭环作答'}
        onTaskClick={(id) => void open(id)}
      />
    </div>
  );
}
