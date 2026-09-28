import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { getAiSettings, saveAiSettings, type AiSettingsUpdate } from "@/api/aiSettings";

/** AI 模型设置：getAiSettings 初始化表单，saveAiSettings 落库（apiKey 留空 = 保留原 key）。 */

// #root 是 overflow:hidden，本页自带滚动（100vh + overflowY）
const page: CSSProperties = { height: "100vh", overflowY: "auto", background: "var(--color-bg-cream)", paddingBottom: 40 };
const topbar: CSSProperties = { position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 20px 6px", background: "var(--color-bg-cream)" };
const backBtn: CSSProperties = { width: 36, height: 36, borderRadius: 12, background: "var(--color-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(45,42,38,0.078)", fontSize: 20, color: "var(--color-text-primary)", flexShrink: 0, cursor: "pointer" };
const h1: CSSProperties = { fontSize: "var(--font-h2)", fontWeight: 800, color: "var(--color-text-primary)" };
const card: CSSProperties = { background: "var(--color-bg-card)", borderRadius: 24, padding: 18, margin: "6px 20px 0", boxShadow: "0 8px 24px rgba(45,42,38,0.078)", display: "flex", flexDirection: "column", gap: 14 };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 12 };
const label: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-text-secondary)", width: 84, flexShrink: 0 };
const input: CSSProperties = { flex: 1, minWidth: 0, background: "var(--color-bg-input)", border: "1px solid var(--color-border-base)", borderRadius: 12, padding: "10px 14px", fontSize: "var(--font-caption)", color: "var(--color-text-primary)", outline: "none" };
const segmented: CSSProperties = { flex: 1, minWidth: 0, display: "flex", gap: 6 };
const segItem: CSSProperties = { flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 10, fontSize: "var(--font-micro)", fontWeight: 700, background: "var(--color-bg-input)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-base)", cursor: "pointer" };
const segOn: CSSProperties = { ...segItem, background: "var(--color-brand-purple)", color: "#fff", border: "1px solid var(--color-brand-purple)" };
const errText: CSSProperties = { fontSize: "var(--font-caption)", color: "var(--color-brand-coral)", margin: "10px 20px 0" };
const saveBtn: CSSProperties = { display: "block", width: "calc(100% - 40px)", margin: "18px 20px 0", background: "var(--color-brand-purple)", color: "#fff", borderRadius: 14, padding: "14px 0", fontSize: "var(--font-body)", fontWeight: 700, cursor: "pointer" };
const saveOff: CSSProperties = { ...saveBtn, opacity: 0.55, cursor: "default" };
const loading: CSSProperties = { minHeight: "100vh", background: "var(--color-bg-cream)" };
const loadErrBox: CSSProperties = { ...loading, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "var(--color-brand-coral)", fontSize: "var(--font-caption)" };

const EFFORTS = ["low", "medium", "high", "auto"] as const;

const AiSettingsScreen = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [effort, setEffort] = useState("low");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAiSettings()
      .then((v) => {
        setProvider(v.provider);
        setModel(v.model);
        setBaseUrl(v.baseUrl);
        setTemperature(String(v.temperature));
        setEffort(v.reasoningEffort || "low");
        setHasKey(v.hasApiKey);
      })
      .catch((e: unknown) => setLoadErr(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setReady(true));
  }, []);

  /** 保存：apiKey 仅非空时携带（空 = 保留原 key）；成功回上一页 */
  const save = async () => {
    if (busy) return;
    const temp = Number(temperature);
    if (!provider.trim() || !model.trim() || !baseUrl.trim()) {
      setErr("请填写服务商、模型名和 Base URL");
      return;
    }
    if (!Number.isFinite(temp) || temp < 0 || temp > 1) {
      setErr("Temperature 需在 0 到 1 之间");
      return;
    }
    setBusy(true);
    setErr("");
    const payload: AiSettingsUpdate = {
      provider: provider.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim(),
      temperature: temp,
      reasoningEffort: effort,
    };
    const key = apiKey.trim();
    if (key) payload.apiKey = key;
    try {
      await saveAiSettings(payload);
      navigate(-1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "保存失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) return <div style={loadErrBox}>{loadErr}</div>;
  if (!ready) return <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />;

  return (
    <div style={page}>
      <div style={topbar}>
        <div
          onClick={() => navigate(-1)}
          style={backBtn}
        >
          {"←"}
        </div>
        <p style={h1}>AI 模型设置</p>
      </div>

      <div style={card}>
        <div style={row}>
          <span style={label}>服务商</span>
          <input
            style={input}
            value={provider}
            placeholder="如 openai / deepseek"
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>
        <div style={row}>
          <span style={label}>模型名</span>
          <input
            style={input}
            value={model}
            placeholder="如 mimo-v2.6-flash"
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div style={row}>
          <span style={label}>Base URL</span>
          <input
            style={input}
            value={baseUrl}
            placeholder="https://api.example.com/v1"
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
        <div style={row}>
          <span style={label}>Temperature</span>
          <input
            style={input}
            type="number"
            step={0.1}
            min={0}
            max={1}
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </div>
        <div style={row}>
          <span style={label}>思考强度</span>
          <div style={segmented}>
            {EFFORTS.map((o) => (
              <div
                onClick={() => setEffort(o)}
                key={o}
                style={effort === o ? segOn : segItem}
              >
                {o}
              </div>
            ))}
          </div>
        </div>
        <div style={row}>
          <span style={label}>API Key</span>
          <input
            style={input}
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={hasKey ? "已配置，留空则不修改" : "填写 API Key"}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>

      {err && <p style={errText}>{err}</p>}

      <div
        onClick={() => void save()}
        style={busy ? saveOff : saveBtn}
      >
        {busy ? "保存中…" : "保存"}
      </div>
    </div>
  );
};

export default AiSettingsScreen;
