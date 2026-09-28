import { Fragment } from 'react';

/** 掌握度环形图：三段色（薄荷=已掌握 / 柠檬=进行中 / 珊瑚=未掌握），中心显示知识点总数。 */
export default function MasteryRing({
  mastered,
  inProgress,
  notMastered,
}: {
  mastered: number;
  inProgress: number;
  notMastered: number;
}) {
  const size = 116;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const total = Math.max(1, mastered + inProgress + notMastered);
  const segs = [
    { v: mastered, color: 'var(--mint)' },
    { v: inProgress, color: 'var(--lemon)' },
    { v: notMastered, color: 'var(--coral)' },
  ];

  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--input)" strokeWidth={stroke} />
      {segs.map((s, i) => {
        if (s.v <= 0) return null;
        const len = (s.v / total) * circumference;
        const el = (
          <Fragment key={i}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-acc}
            />
          </Fragment>
        );
        acc += len;
        return el;
      })}
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 30, fontWeight: 800, fill: 'var(--primary)', fontFamily: 'DM Sans, sans-serif' }}
      >
        {mastered + inProgress + notMastered}
      </text>
      <text x="50%" y="62%" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--ink-faint)' }}>
        知识点
      </text>
    </svg>
  );
}
