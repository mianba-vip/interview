import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { profile, skillDoc } from "@/api/drill";
import type { TopicProfile } from "@/api/types";

/** 技能画像详情页：
 *  概览卡（掌握度三段分布）→ L1–L5 层级进度卡 → 分主题能力胶囊云。
 *  能力清单来自 GET /drill/profile/skill-doc（Markdown），就地解析成结构化视图；
 *  解析失败时回退为原文 Markdown 卡。模板无对应帧，排版沿用奶油子页设计。 */

interface SkillItem {
  name: string;
  layer: number;
  mastery: number; // 2 已掌握 / 1 进行中 / 0 未掌握
}
interface SkillTopic {
  title: string;
  badge: string; // 「已掌握至 L3」
  items: SkillItem[];
}

const MASTERY_COLOR = [
  "var(--color-brand-coral)",
  "var(--color-brand-lemon)",
  "var(--color-brand-mint)",
];

/** 解析画像文档：## 主题（badge）+ - **知识点**（Lx，掌握度 y） */
function parseSkillDoc(md: string): SkillTopic[] {
  const topics: SkillTopic[] = [];
  const parts = md.split(/^## /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const heading = (nl >= 0 ? part.slice(0, nl) : part).trim();
    const body = nl >= 0 ? part.slice(nl + 1) : "";
    const hm = /^(.*?)（([^）]+)）\s*$/.exec(heading);
    const items: SkillItem[] = [];
    const re = /^-\s*\*\*(.+?)\*\*（L(\d)，掌握度\s*(\d+)）/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      items.push({ name: m[1], layer: Number(m[2]), mastery: Number(m[3]) });
    }
    if (items.length > 0) {
      topics.push({
        title: hm ? hm[1] : heading,
        badge: hm ? hm[2] : "",
        items,
      });
    }
  }
  return topics;
}

// ---- 样式（与「学习方向」子页同一套奶油设计语言）----
const page: CSSProperties = {
  height: "100vh",
  overflowY: "auto",
  background: "var(--color-bg-cream)",
  paddingBottom: 40,
};
const topbar: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 20px 6px",
  background: "var(--color-bg-cream)",
};
const backBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "var(--color-bg-card)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 24px rgba(45,42,38,0.078)",
  fontSize: 20,
  color: "var(--color-text-primary)",
  flexShrink: 0,
  cursor: "pointer",
};
const h1: CSSProperties = { fontSize: "var(--font-h2)", fontWeight: 800, color: "var(--color-text-primary)" };
const body: CSSProperties = { padding: "6px 20px 0", display: "flex", flexDirection: "column", gap: 14 };
const card: CSSProperties = {
  background: "var(--color-bg-card)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 8px 24px rgba(45,42,38,0.078)",
};
const sectionLabel: CSSProperties = {
  fontSize: "var(--font-caption)",
  fontWeight: 700,
  color: "var(--color-text-secondary)",
  margin: "10px 2px -2px",
};
const muted: CSSProperties = {
  fontSize: "var(--font-caption)",
  color: "var(--color-text-placeholder)",
  textAlign: "center",
  padding: "48px 0",
};

const SkillProfileScreen = () => {
  const navigate = useNavigate();
  const [md, setMd] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      skillDoc().catch((e: unknown) => {
        if (alive) setErr(e instanceof Error ? e.message : "画像加载失败");
        return { markdown: "" };
      }),
      profile().catch(() => [] as TopicProfile[]),
    ]).then(([doc, prof]) => {
      if (!alive) return;
      setMd(doc.markdown ?? "");
      setTopics(prof);
    });
    return () => {
      alive = false;
    };
  }, []);

  const parsed = useMemo(() => (md ? parseSkillDoc(md) : []), [md]);
  const concepts = useMemo(() => topics.flatMap((t) => t.concepts), [topics]);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = concepts.length - mastered - inProgress;
  const pct = concepts.length ? Math.round((mastered / concepts.length) * 100) : 0;

  // L1–L5 层级统计（按概念所在层聚合）
  const layers = useMemo(() => {
    const map = new Map<number, { total: number; done: number }>();
    for (const c of concepts) {
      const e = map.get(c.layer) ?? { total: 0, done: 0 };
      e.total += 1;
      if (c.masteryLevel >= 2) e.done += 1;
      map.set(c.layer, e);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([layer, v]) => ({ layer, ...v }));
  }, [concepts]);

  const loading = md === null;

  return (
    <div style={page}>
      <div style={topbar}>
        <div onClick={() => navigate(-1)} style={backBtn}>
          ‹
        </div>
        <div>
          <p style={h1}>技能画像</p>
        </div>
      </div>

      <div style={body}>
        {err ? (
          <p style={{ ...muted, color: "var(--color-brand-coral)" }}>{err}</p>
        ) : loading ? (
          <p style={muted}>加载中…</p>
        ) : (
          <>
            {/* ── 概览：掌握度大数字 + 三段分布 ── */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: "var(--color-brand-purple)",
                    fontFamily: '"DM Sans-Medium", sans-serif',
                  }}
                >
                  {mastered}
                </span>
                <span style={{ fontSize: "var(--font-caption)", color: "var(--color-text-secondary)", paddingBottom: 5 }}>
                  个知识点已掌握 · 共 {concepts.length}
                </span>
              </div>
              <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", gap: 2, marginTop: 14 }}>
                <div style={{ flex: mastered, background: "var(--color-brand-mint)" }} />
                <div style={{ flex: inProgress, background: "var(--color-brand-lemon)" }} />
                <div style={{ flex: notMastered, background: "var(--color-brand-coral)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "var(--font-micro)", color: "var(--color-text-secondary)" }}>
                <span>已掌握 {mastered}（{pct}%）</span>
                <span>进行中 {inProgress}</span>
                <span>未掌握 {notMastered}</span>
              </div>
            </div>

            {/* ── L1–L5 层级进度 ── */}
            {layers.length > 0 && (
              <>
                <p style={sectionLabel}>层级进度</p>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {layers.map((l) => {
                    const lp = l.total ? Math.round((l.done / l.total) * 100) : 0;
                    const done = lp === 100;
                    return (
                      <div
                        key={l.layer}
                        style={{
                          ...card,
                          flex: "none",
                          width: 118,
                          padding: 14,
                          border: done ? "1.5px solid var(--color-brand-mint)" : "1px solid var(--color-border-base)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "var(--font-body)", fontWeight: 800, color: "var(--color-text-primary)" }}>
                            L{l.layer}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--font-micro)",
                              fontWeight: 700,
                              color: done ? "var(--color-brand-mint)" : "var(--color-text-secondary)",
                            }}
                          >
                            {done ? "✓ 已通关" : `${lp}%`}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: "var(--color-bg-input)", marginTop: 10, overflow: "hidden" }}>
                          <div style={{ width: `${lp}%`, height: "100%", background: done ? "var(--color-brand-mint)" : "var(--color-brand-purple)" }} />
                        </div>
                        <p style={{ fontSize: "var(--font-micro)", color: "var(--color-text-placeholder)", margin: "8px 0 0" }}>
                          {l.done}/{l.total} 个知识点
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── 分主题能力胶囊云（解析 skill-doc；失败回退原文） ── */}
            {parsed.length > 0 ? (
              parsed.map((t) => (
                <div key={t.title}>
                  <p style={sectionLabel}>{t.title}</p>
                  <div style={{ ...card, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: "var(--font-micro)",
                          fontWeight: 700,
                          color: "var(--color-brand-purple)",
                          background: "var(--color-brand-purplesoft)",
                          borderRadius: 999,
                          padding: "4px 10px",
                        }}
                      >
                        {t.badge || `${t.items.length} 个能力点`}
                      </span>
                      <span style={{ fontSize: "var(--font-micro)", color: "var(--color-text-placeholder)" }}>
                        {t.items.filter((i) => i.mastery >= 2).length} / {t.items.length} 已掌握
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {t.items.map((it) => (
                        <span
                          key={it.name}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "var(--font-caption)",
                            fontWeight: 600,
                            color: it.mastery >= 2 ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                            background: "var(--color-bg-input)",
                            border: "1px solid var(--color-border-base)",
                            borderRadius: 999,
                            padding: "6px 12px",
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: MASTERY_COLOR[Math.max(0, Math.min(2, it.mastery))],
                              flexShrink: 0,
                            }}
                          />
                          {it.name}
                          <span style={{ fontSize: 11, color: "var(--color-text-placeholder)", fontWeight: 700 }}>
                            L{it.layer}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ ...card, padding: 16 }}>
                <p style={{ fontSize: "var(--font-caption)", color: "var(--color-text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {md || "还没有画像内容，先去练习攒一些能力吧"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SkillProfileScreen;
