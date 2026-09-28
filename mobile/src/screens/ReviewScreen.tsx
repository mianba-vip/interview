import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { ChevronLeft } from 'lucide-react';
import { runDetail, review } from '../api/drill';
import type { GradeView, ReviewView } from '../api/types';
import { MarkdownLite } from '../components/MarkdownLite';

interface ByConceptRow {
  conceptId: number;
  role: string;
  pointResults: { point: string; verdict: string; evidence?: string }[];
}

const VERDICT: Record<string, { label: string; cls: string }> = {
  HIT: { label: '命中', cls: 'v-hit' },
  PARTIAL: { label: '部分', cls: 'v-partial' },
  MISS: { label: '缺失', cls: 'v-miss' },
};

const GRADE_CLS: Record<string, string> = {
  GOOD: 'g-good',
  EASY: 'g-easy',
  HARD: 'g-hard',
  MISSING: 'g-miss',
  AGAIN: 'g-miss',
};

/** 复盘页：评级 + 评分点明细 + AI 复盘三件套（总结/思路/口诀）。 */
export default function ReviewScreen() {
  const { runId: runIdParam } = useParams();
  const navigate = useNavigate();
  const runId = Number(runIdParam);
  const { state } = useLocation() as { state: { grade?: GradeView; stem?: string } | null };
      // useLocation 用于读取练习列表带来的 grade 快照

  const [grade, setGrade] = useState<GradeView | null>(state?.grade ?? null);
  const [rv, setRv] = useState<ReviewView | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!Number.isFinite(runId) || runId <= 0) return;
    if (!grade) {
      runDetail(runId).then((d) => setGrade({ runId: d.runId, questionId: d.questionId, rawScore: d.rawScore, grade: d.grade ?? '', byConceptJson: d.byConceptJson ?? '[]' }))
        .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
    }
    review(runId)
      .then(setRv)
      .catch(() => setRv(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  if (!Number.isFinite(runId) || runId <= 0) {
    return (
      <div className="screen screen-immersive">
        <div className="center-note">缺少练习信息，请从练习列表进入。</div>
        <Link to="/tasks" className="back-link">返回首页</Link>
      </div>
    );
  }
  if (!grade) {
    return (
      <div className="screen screen-immersive">
        <div className="center-note">{err || '加载中…'}</div>
        <Link to="/tasks" className="back-link">返回首页</Link>
      </div>
    );
  }

  let rows: { point: string; verdict: string }[] = [];
  try {
    const groups = JSON.parse(grade.byConceptJson ?? '[]') as ByConceptRow[];
    rows = groups.flatMap((g) => g.pointResults.map((p) => ({ point: p.point, verdict: p.verdict })));
  } catch { /* 解析失败静默 */ }

  const badgeCls = GRADE_CLS[grade.grade] ?? 'g-good';

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontWeight: 800 }}>复盘</span>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <span className={'review-badge ' + badgeCls}>{grade.grade}</span>
        <div className="score-big">
          {grade.rawScore}
          <small> 分</small>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card">
          <div className="card-title">评分点明细</div>
          {rows.map((r, i) => (
            <div key={i} className="detail-row">
              <span className="rv-point"><MarkdownLite text={r.point} /></span>
              <span className={'verdict-pill ' + (VERDICT[r.verdict]?.cls ?? 'v-partial')}>
                {VERDICT[r.verdict]?.label ?? r.verdict}
              </span>
            </div>
          ))}
        </div>
      )}

      {rv && (
        <>
          {rv.weakPoints.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--coral)' }}>
                对话总结 · {rv.weakPoints.length} 个欠缺
              </div>
              {rv.gapSummary && <div className="review-text"><MarkdownLite text={rv.gapSummary} /></div>}
              <ul className="weak-list">
                {rv.weakPoints.map((w, i) => (
                  <li key={i}>
                    <span className="weak-dot" />
                    <span className="rv-md"><MarkdownLite text={w} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rv.approach && (
            <div className="card">
              <div className="card-title">解题思路</div>
              <div className="review-text"><MarkdownLite text={rv.approach} /></div>
            </div>
          )}
          {rv.mnemonic && (
            <div className="card">
              <div className="card-title">记忆口诀</div>
              <div className="quote"><MarkdownLite text={rv.mnemonic} /></div>
            </div>
          )}
        </>
      )}

      {err && <div className="form-err">{err}</div>}
    </div>
  );
}
