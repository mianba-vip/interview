import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Frame2877 from '../frames/Frame2877';
import { review, runDetail, sedimentToCard } from '../api/drill';
import type { GradeView, ReviewView } from '../api/types';

const VERDICT_LABEL: Record<string, string> = { HIT: '命中', PARTIAL: '部分', MISS: '缺失' };

interface ByConceptRow {
  pointResults: { point: string; verdict: string }[];
}

/** 复盘页：数据层（评级 + AI 复盘）→ 视觉层 Frame2877（Pixso 源码直迁）。 */
export default function ReviewScreen() {
  const { runId: runIdParam } = useParams();
  const runId = Number(runIdParam);
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { grade?: GradeView; stem?: string } | null };

  const [grade, setGrade] = useState<GradeView | null>(state?.grade ?? null);
  const [rv, setRv] = useState<ReviewView | null>(null);
  const [err, setErr] = useState('');
  const [sedimenting, setSedimenting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(runId) || runId <= 0) return;
    if (!grade) {
      runDetail(runId)
        .then((d) =>
          setGrade({
            runId: d.runId,
            questionId: d.questionId,
            rawScore: d.rawScore,
            grade: d.grade ?? '',
            byConceptJson: d.byConceptJson ?? '[]',
          }),
        )
        .catch((e) => setErr(e instanceof Error ? e.message : '加载失败'));
    }
    review(runId)
      .then(setRv)
      .catch(() => setRv(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  if (!Number.isFinite(runId) || runId <= 0 || !grade) {
    return (
      <div className="screen screen-immersive">
        <div className="center-note">{err || '加载中…'}</div>
      </div>
    );
  }

  let rows: { point: string; verdict: 'HIT' | 'PARTIAL' | 'MISS'; verdictLabel: string }[] = [];
  try {
    const groups = JSON.parse(grade.byConceptJson ?? '[]') as ByConceptRow[];
    rows = groups.flatMap((g) =>
      g.pointResults.map((p) => ({
        point: p.point,
        verdict: (p.verdict as 'HIT' | 'PARTIAL' | 'MISS') ?? 'MISS',
        verdictLabel: VERDICT_LABEL[p.verdict] ?? p.verdict,
      })),
    );
  } catch { /* 解析失败静默 */ }

  const sediment = async () => {
    if (sedimenting) return;
    setSedimenting(true);
    setErr('');
    try {
      await sedimentToCard(runId);
      navigate('/sediment');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '沉淀失败，请重试');
    } finally {
      setSedimenting(false);
    }
  };

  return (
    <div className="screen screen-immersive" style={{ paddingTop: 8 }}>
      {err && <div className="form-err">{err}</div>}
      <Frame2877
        score={grade.rawScore}
        grade={grade.grade || '—'}
        timeText=""
        attemptText=""
        rows={rows}
        weak={rv?.weakPoints ?? []}
        rv={{ mnemonic: rv?.mnemonic ?? null, approach: rv?.approach ?? null }}
        onBack={() => navigate(-1)}
        onCard={() => void sediment()}
      />
    </div>
  );
}
