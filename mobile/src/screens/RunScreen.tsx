import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { QuestionView } from '../api/types';

/** 沉浸式答题页骨架（M1）：展示题目。M2 在此接入作答输入、SSE 判分与讲解流。 */
export default function RunScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const view = (state ?? null) as QuestionView | null;

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate('/tasks')}>
          <ChevronLeft size={22} />
        </button>
      </div>
      {view ? (
        <>
          <div className="stem-card">{view.stem}</div>
          <div className="center-note">
            作答与判分交互在 M2 里程碑接入（对话式练习 + 选择题点选 + 语音）。
          </div>
        </>
      ) : (
        <div className="center-note">请从今日任务重新进入本题。</div>
      )}
      <Link to="/tasks" style={{ display: 'block', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>
        返回今日任务
      </Link>
    </div>
  );
}
