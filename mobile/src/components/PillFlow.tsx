/** mermaid 药丸流渲染器：解析 flowchart/graph 的节点与边。
 *  - 纯链式（每节点最多一出一入）→ 横向药丸 + 箭头
 *  - 有分支/汇聚（如 C -->|Errorf| D 与 C -->|Fatalf| G）→ 逐条转移行展示，如实呈现分支
 *  - 边标签（|Errorf|）不再被误认成节点（旧解析器会把标签挤进节点序列）
 *  移动端不引入 mermaid.js（体积大），解析失败回退源码块。 */
import { type ReactNode } from 'react';

export interface FlowNode {
  id: string;
  label: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const NODE_COLORS = ['var(--primary-soft)', 'var(--mint-soft)', 'var(--lemon-soft)', 'var(--sky-soft)'];
const TEXT_COLORS = ['var(--primary)', '#1d8a82', '#8a6d0b', '#2f6fd1'];

export function parsePillFlow(src: string): FlowGraph | null {
  const s = src.trim();
  if (!/^(flowchart|graph)\b/m.test(s)) return null;

  // 节点定义：id + 可选形状标签（支持中文）
  const labels = new Map<string, string>();
  const defRe = /([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\]|\(\(([^)]*)\)\)|\(([^)]*)\)|\{([^}]*)\})/g;
  let m: RegExpExecArray | null;
  while ((m = defRe.exec(s))) {
    const id = m[1];
    const label = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim();
    if (!labels.has(id)) labels.set(id, id);
    if (label) labels.set(id, label);
  }

  // 边：逐行解析 `from[形状] -->|标签| to[形状]`；|标签| 显式捕获，不再混入节点序列
  const edges: FlowEdge[] = [];
  const seen = new Set<string>();
  const order: string[] = [];
  const push = (id: string) => {
    if (!order.includes(id)) order.push(id);
  };
  for (const raw of s.split('\n')) {
    const line = raw.trim();
    if (
      !line ||
      /^(flowchart|graph|subgraph|end|direction|classDef|class|style|linkStyle|%%)/i.test(line)
    ) {
      continue;
    }
    const em = line.match(
      /^([A-Za-z0-9_]+)\s*(?:\[[^\]]*\]|\(\([^)]*\)\)|\([^)]*\)|\{[^}]*\})?\s*(?:-{2,}>?|-\.->?|={2,}>?)\s*(?:\|([^|]*)\|\s*)?([A-Za-z0-9_]+)/,
    );
    if (!em) continue;
    const [, from, label, to] = em;
    const key = `${from}->${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    push(from);
    push(to);
    edges.push({ from, to, label: label?.trim() || undefined });
  }

  if (edges.length === 0) return null;
  const nodes = order.map((id) => ({ id, label: labels.get(id) ?? id }));
  return { nodes, edges };
}

/** 是否纯链式：边数=节点数-1、无分叉、能从起点走完所有边。 */
function isChain({ nodes, edges }: FlowGraph): boolean {
  if (edges.length !== nodes.length - 1) return false;
  const out = new Map<string, string>();
  for (const e of edges) {
    if (out.has(e.from)) return false;
    out.set(e.from, e.to);
  }
  const indeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const e of edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const start = nodes.find((n) => (indeg.get(n.id) ?? 0) === 0);
  if (!start) return false;
  let cur = start.id;
  let hops = 0;
  while (out.has(cur)) {
    cur = out.get(cur)!;
    hops += 1;
  }
  return hops === edges.length;
}

function Pill({ node, index }: { node: FlowNode; index: number }) {
  return (
    <span
      className="pillflow-node"
      style={{ background: NODE_COLORS[index % 4], color: TEXT_COLORS[index % 4] }}
    >
      {node.label}
    </span>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <>
      <span className="pillflow-arrow">→</span>
      {label ? (
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
      ) : null}
    </>
  );
}

export function PillFlow({ graph }: { graph: FlowGraph }) {
  if (isChain(graph)) {
    return (
      <div className="pillflow">
        {graph.nodes.map((n, i) => (
          <FragmentWrap key={n.id} withArrow={i > 0}>
            <Pill node={n} index={i} />
          </FragmentWrap>
        ))}
      </div>
    );
  }
  // 分支图：逐条转移行展示（分支不再被拉直、边标签如实显示）
  const nodeOf = (id: string): FlowNode =>
    graph.nodes.find((n) => n.id === id) ?? { id, label: id };
  return (
    <div
      className="pillflow"
      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}
    >
      {graph.edges.map((e, i) => (
        <div
          key={`${e.from}-${e.to}-${i}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Pill node={nodeOf(e.from)} index={0} />
          <Arrow label={e.label} />
          <Pill node={nodeOf(e.to)} index={1} />
        </div>
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
