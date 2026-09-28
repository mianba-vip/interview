import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  confirmPlan,
  intake,
  listPlans,
  validateCandidates,
  type ChatMsg,
  type PlanView,
  type StudyPlanDraft,
} from "@/api/plan";
import { readActivePlanId, setActivePlanId } from "@/lib/activePlan";

/** 学习方向管理：方向列表（点击即切换当前方向）+ AI 问答式新建（intake→confirm）。全内联样式。 */

// #root 是 overflow:hidden，本页自带滚动（100vh + overflowY）
const page: CSSProperties = { height: "100vh", overflowY: "auto", background: "var(--color-bg-cream)", paddingBottom: 36 };
const topbar: CSSProperties = { position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 20px 6px", background: "var(--color-bg-cream)" };
const backBtn: CSSProperties = { width: 36, height: 36, borderRadius: 12, background: "var(--color-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(45,42,38,0.078)", fontSize: 20, color: "var(--color-text-primary)", flexShrink: 0, cursor: "pointer" };
const h1: CSSProperties = { fontSize: "var(--font-h2)", fontWeight: 800, color: "var(--color-text-primary)" };
const body: CSSProperties = { padding: "0 20px" };
const sectionLabel: CSSProperties = { fontSize: "var(--font-caption)", fontWeight: 700, color: "var(--color-text-secondary)", margin: "18px 0 8px" };
const card: CSSProperties = { background: "var(--color-bg-card)", borderRadius: 24, padding: 18, boxShadow: "0 8px 24px rgba(45,42,38,0.078)" };
const currentTitle: CSSProperties = { fontSize: "var(--font-h2)", fontWeight: 800, color: "var(--color-text-primary)", margin: "2px 0 6px" };
const goalText: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 10px" };
const metaRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6 };
const chip: CSSProperties = { fontSize: "var(--font-micro)", fontWeight: 700, color: "var(--color-brand-purple)", background: "var(--color-brand-purplesoft)", borderRadius: 999, padding: "4px 10px" };
const chipMint: CSSProperties = { ...chip, color: "var(--color-brand-mint)", background: "var(--color-brand-mintsoft)" };
const corpusText: CSSProperties = { fontSize: "var(--font-micro)", color: "var(--color-text-placeholder)", margin: "10px 0 0" };
const row: CSSProperties = { background: "var(--color-bg-card)", borderRadius: 18, padding: 14, marginBottom: 10, border: "1px solid var(--color-border-base)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" };
const rowActive: CSSProperties = { ...row, border: "1.5px solid var(--color-brand-purple)", background: "var(--color-brand-purplesoft)" };
const rowMain: CSSProperties = { flex: 1, minWidth: 0 };
const rowTitle: CSSProperties = { fontSize: "var(--font-body)", fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 };
const rowGoal: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "3px 0 0" };
const rowMeta: CSSProperties = { fontSize: "var(--font-micro)", color: "var(--color-text-placeholder)", margin: "5px 0 0" };
const check: CSSProperties = { fontSize: 16, fontWeight: 800, color: "var(--color-brand-purple)", flexShrink: 0 };
const empty: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-text-placeholder)", textAlign: "center", padding: "14px 0" };

const log: CSSProperties = { display: "flex", flexDirection: "column", gap: 8, background: "var(--color-bg-input)", borderRadius: 16, padding: 12, maxHeight: 300, overflowY: "auto" };
const hint: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-text-placeholder)", textAlign: "center", margin: "6px 0" };
const bubbleBase: CSSProperties = { maxWidth: "84%", padding: "9px 13px", fontSize: "var(--font-caption)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" };
const bubbleUser: CSSProperties = { ...bubbleBase, alignSelf: "flex-end", background: "var(--color-brand-purple)", color: "#fff", borderRadius: "16px 16px 4px 16px" };
const bubbleAi: CSSProperties = { ...bubbleBase, alignSelf: "flex-start", background: "var(--color-bg-card)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-base)", borderRadius: "16px 16px 16px 4px" };
const draftCard: CSSProperties = { background: "var(--color-bg-card)", border: "1.5px solid var(--color-brand-purple)", borderRadius: 16, padding: 14, marginTop: 10 };
const draftTitle: CSSProperties = { fontSize: "var(--font-body)", fontWeight: 700, color: "var(--color-text-primary)", margin: "2px 0 4px" };
const eyebrow: CSSProperties = { fontSize: "var(--font-micro)", fontWeight: 800, color: "var(--color-brand-purple)", margin: "0 0 4px" };
const errText: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-brand-coral)", margin: "8px 0 0" };
const inputRow: CSSProperties = { display: "flex", gap: 8, marginTop: 10 };
const chatInput: CSSProperties = { flex: 1, minWidth: 0, background: "var(--color-bg-input)", border: "1px solid var(--color-border-base)", borderRadius: 12, padding: "10px 14px", fontSize: "var(--font-caption)", color: "var(--color-text-primary)", outline: "none" };
const btnPrimary: CSSProperties = { background: "var(--color-brand-purple)", color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: "var(--font-caption)", fontWeight: 700, flexShrink: 0, cursor: "pointer" };
const btnGhost: CSSProperties = { ...btnPrimary, background: "var(--color-bg-input)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-base)" };
const btnGrow: CSSProperties = { flex: 1, textAlign: "center" };
const btnOff: CSSProperties = { opacity: 0.55, cursor: "default" };
const noticeBox: CSSProperties = { background: "var(--color-brand-mintsoft)", border: "1px solid var(--color-brand-mint)", color: "var(--color-text-primary)", borderRadius: 14, padding: "10px 14px", fontSize: "var(--font-caption)", marginTop: 12 };
const loading: CSSProperties = { minHeight: "100vh", background: "var(--color-bg-cream)" };
const loadErrBox: CSSProperties = { ...loading, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "var(--color-brand-coral)", fontSize: "var(--font-caption)" };

const DirectionsScreen = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanView[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<StudyPlanDraft | null>(null);
  const [validateErr, setValidateErr] = useState("");
  const [chatErr, setChatErr] = useState("");
  const [notice, setNotice] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // 进屏拉方向列表，激活 id 取 localStorage，无效则回落第一个
  useEffect(() => {
    listPlans()
      .then((list) => {
        setPlans(list);
        const stored = readActivePlanId();
        setActiveId(list.find((p) => p.id === stored)?.id ?? list[0]?.id ?? null);
      })
      .catch((e: unknown) => setLoadErr(e instanceof Error ? e.message : "加载失败"));
  }, []);

  // 新消息/草稿出现时滚到底
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, draft]);

  /** 切换当前方向：写 localStorage（与 Web 同键）并即时刷新高亮 */
  const switchTo = (id: number) => {
    setActivePlanId(id);
    setActiveId(id);
    setNotice("");
  };

  /** 发送：历史 messages 一并 POST intake，回填 AI 回复；带 draft 则出预览卡 */
  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setChatErr("");
    setDraft(null);
    setValidateErr("");
    try {
      const res = await intake(next);
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.draft) {
        setDraft(res.draft);
        // 预校验失败只提示不阻断，后端 confirm 自己也会再校验
        validateCandidates(res.draft).catch((e: unknown) =>
          setValidateErr(e instanceof Error ? e.message : "知识点预校验失败"),
        );
      }
    } catch (e) {
      setChatErr(e instanceof Error ? e.message : "发送失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  /** 换种说法：丢掉草稿继续聊 */
  const rewrite = () => {
    setDraft(null);
    setValidateErr("");
    setMessages((m) => [...m, { role: "assistant", content: "好，那我们继续聊——你还想调整或补充什么？" }]);
  };

  /** 确认创建：落库 → 记为当前方向 → 清空对话并刷新列表 */
  const confirm = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setChatErr("");
    try {
      const created = await confirmPlan(draft);
      setActivePlanId(created.id);
      setActiveId(created.id);
      setMessages([]);
      setDraft(null);
      setInput("");
      setValidateErr("");
      setNotice(`已创建「${created.title}」并切换为当前方向`);
      // 先用返回的 PlanView 补进列表（保证当前卡立即可见），再后台刷新兜底
      setPlans((prev) => (prev && prev.some((p) => p.id === created.id) ? prev : [...(prev ?? []), created]));
      void listPlans()
        .then(setPlans)
        .catch(() => undefined);
    } catch (e) {
      setChatErr(e instanceof Error ? e.message : "创建失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) return <div style={loadErrBox}>{loadErr}</div>;
  if (!plans) return <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />;

  const current = plans.find((p) => p.id === activeId) ?? plans[0] ?? null;

  return (
    <div style={page}>
      <div style={topbar}>
        <div
          onClick={() => navigate(-1)}
          style={backBtn}
        >
          {"←"}
        </div>
        <p style={h1}>学习方向</p>
      </div>
      <div style={body}>
        {notice && <div style={noticeBox}>{notice}</div>}

        <p style={sectionLabel}>当前方向</p>
        {current ? (
          <div style={card}>
            <p style={currentTitle}>{current.title}</p>
            {current.goal && <p style={goalText}>{current.goal}</p>}
            <div style={metaRow}>
              <span style={chip}>{`${current.totalCount} 个知识点`}</span>
              <span style={chipMint}>{`已掌握 ${current.masteredCount}`}</span>
            </div>
            {current.corpusName && <p style={corpusText}>{`关联资料：${current.corpusName}`}</p>}
          </div>
        ) : (
          <div style={card}>
            <p style={empty}>还没有方向，在下方和 AI 聊聊你想学什么</p>
          </div>
        )}

        <p style={sectionLabel}>{`全部方向（${plans.length}）`}</p>
        {plans.length === 0 && <p style={empty}>暂无方向</p>}
        {plans.map((p) => {
          const active = p.id === activeId;
          return (
            <div
              onClick={() => switchTo(p.id)}
              key={p.id}
              style={active ? rowActive : row}
            >
              <div style={rowMain}>
                <p style={rowTitle}>{p.title}</p>
                {p.goal && <p style={rowGoal}>{p.goal}</p>}
                <p style={rowMeta}>{`${p.totalCount} 个知识点 · 已掌握 ${p.masteredCount}`}</p>
                {p.corpusName && <p style={rowMeta}>{p.corpusName}</p>}
              </div>
              {active && <span style={check}>{"✓"}</span>}
            </div>
          );
        })}

        <p style={sectionLabel}>新建方向</p>
        <div style={card}>
          <div ref={logRef} style={log}>
            {messages.length === 0 && (
              <p style={hint}>例如：我想学 Go 后端，3 个月能独立做服务，帮我拆个计划</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={m.role === "user" ? bubbleUser : bubbleAi}
              >
                {m.content}
              </div>
            ))}
          </div>

          {draft && (
            <div style={draftCard}>
              <p style={eyebrow}>AI 拟的规划</p>
              <p style={draftTitle}>{draft.title}</p>
              {draft.goal && <p style={goalText}>{draft.goal}</p>}
              <p style={rowMeta}>{`${draft.points.length} 个知识点`}</p>
              {validateErr && <p style={errText}>{validateErr}</p>}
              <div style={inputRow}>
                <div
                  onClick={rewrite}
                  style={busy ? { ...btnGhost, ...btnGrow, ...btnOff } : { ...btnGhost, ...btnGrow }}
                >
                  换种说法
                </div>
                <div
                  onClick={() => void confirm()}
                  style={busy ? { ...btnPrimary, ...btnGrow, ...btnOff } : { ...btnPrimary, ...btnGrow }}
                >
                  确认创建
                </div>
              </div>
            </div>
          )}

          {chatErr && <p style={errText}>{chatErr}</p>}

          <div style={inputRow}>
            <input
              style={chatInput}
              value={input}
              disabled={busy}
              placeholder={busy ? "AI 正在回复…" : "说点什么，回车发送"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // 输入法组字中的回车只是确认候选词，不能当发送
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter") void send();
              }}
            />
            <div
              onClick={() => void send()}
              style={busy ? { ...btnPrimary, ...btnOff } : btnPrimary}
            >
              发送
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectionsScreen;
