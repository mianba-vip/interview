/** mermaid 药丸流渲染器：把 flowchart 的 A[文字] --> B[文字] 链解析成彩色药丸 + 箭头。
 *  移动端不引入 mermaid.js（3MB + 渲染不稳），简单链路图用此组件呈现；复杂图回退源码。 */
import { type ReactNode } from 'react';

export interface FlowNode {
  id: string;
  label: string;
}

const NODE_COLORS = ['var(--primary-soft)', 'var(--mint-soft)', 'var(--lemon-soft)', 'var(--sky-soft)'];
const TEXT_COLORS = ['var(--primary)', '#1d8a82', '#8a6d0b', '#2f6fd1'];

export function parsePillFlow(src: string): FlowNode[] | null {
  const s = src.trim();
  if (!/^(flowchart|graph)\b/m.test(s)) return null;
  const labels = new Map<string, string>();
  const defRe = /([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\(\(([^)]*)\)\)|\(([^)]*)\)|\{([^}]*)\})/g;
  let m: RegExpExecArray | null;
  while ((m = defRe.exec(s))) {
    const id = m[1];
    const label = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim();
    if (!labels.has(id)) labels.set(id, id);
    if (label) labels.set(id, label);
  }
  const seq: string[] = [];
  const edgeRe = /([A-Za-z0-9_]+)(?:\s*(?:\[[^\]]*\]|\(\([^)]*\)\)|\([^)]*\)|\{[^}]*\}))?\s*-{2,}[^A-Za-z0-9_]*([A-Za-z0-9_]+)/g;
  while ((m = edgeRe.exec(s))) {
    const a = m[1];
    const b = m[2];
    if (!seq.includes(a)) seq.push(a);
    if (!seq.includes(b)) seq.push(b);
  }
  if (seq.length < 2) return null;
  return seq.map((id) => ({ id, label: labels.get(id) ?? id }));
}

export function PillFlow({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="pillflow">
      {nodes.map((n, i) => (
        <FragmentWrap key={n.id} withArrow={i > 0}>
          <span
            className="pillflow-node"
            style={{ background: NODE_COLORS[i % 4], color: TEXT_COLORS[i % 4] }}
          >
            {n.label}
          </span>
        </FragmentWrap>
      ))}
    </div>
  );
}

function FragmentWrap({ withArrow, children }: { withArrow: boolean; children: ReactNode }) {
  return (
    <>
      {withArrow && <span className="pillflow-arrow">→</span>}
      {children}
    </>
  );
}
