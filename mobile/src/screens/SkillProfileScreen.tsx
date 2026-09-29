import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { skillDoc } from "@/api/drill";
import { MarkdownLite } from "@/components/MarkdownLite";

/** 技能画像详情页：GET /drill/profile/skill-doc 的能力清单 Markdown 全文展示。
 *  模板无对应帧，排版沿用「学习方向」子页的奶油设计（sticky 顶栏 + 白卡）。 */

const page: CSSProperties = {
  height: "100vh",
  overflowY: "auto",
  background: "var(--color-bg-cream)",
  paddingBottom: 36,
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
const body: CSSProperties = { padding: "0 20px" };
const card: CSSProperties = {
  background: "var(--color-bg-card)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 8px 24px rgba(45,42,38,0.078)",
  fontSize: "var(--font-caption)",
  lineHeight: 1.75,
  color: "var(--color-text-primary)",
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
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    skillDoc()
      .then((d) => {
        if (alive) setMd(d.markdown || "");
      })
      .catch((e) => {
        if (alive) setErr(e instanceof Error ? e.message : "加载失败");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={page}>
      <div style={topbar}>
        <div onClick={() => navigate(-1)} style={backBtn}>
          ‹
        </div>
        <p style={h1}>技能画像</p>
      </div>
      <div style={body}>
        {err ? (
          <p style={{ ...muted, color: "var(--color-brand-coral)" }}>{err}</p>
        ) : md === null ? (
          <p style={muted}>加载中…</p>
        ) : md === "" ? (
          <p style={muted}>还没有画像内容，先去练习攒一些能力吧</p>
        ) : (
          <div style={card}>
            <MarkdownLite text={md} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillProfileScreen;
