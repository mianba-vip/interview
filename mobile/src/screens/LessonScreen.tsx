import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Frame2965, { type LessonMsg, type SubPointItem } from "@/views/Frame2965";
import { lessonChat, lessonQa, lessonStream, outline, subPointPass } from "@/api/lesson";
import type { OutlineView } from "@/api/lesson";
import type { SseStream } from "@/api/sse";
import { parsePillFlow, type FlowNode } from "@/components/PillFlow";

const LOADING = <div style={{ minHeight: "100vh", background: "var(--color-bg-cream)" }} />;

const failBox = (text: string, onBack: () => void) => (
  <div
    style={{
      minHeight: "100vh",
      background: "var(--color-bg-cream)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: 24,
    }}
  >
    <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, textAlign: "center" }}>
      {text}
    </p>
    <div
      onClick={onBack}
      style={{
        padding: "10px 26px",
        borderRadius: 14,
        background: "var(--color-brand-sky)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      返回
    </div>
  </div>
);

const hm = (d: Date): string =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** 答疑气泡时间「21:11」。 */
const parseTime = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : hm(d);
};

/** 抽出正文里的 mermaid 流程段：能解析成药丸流就从正文剥离，交给「流程示意」块。 */
const splitFlow = (src: string): { text: string; flow: FlowNode[] | null } => {
  const m = /```mermaid\s*([\s\S]*?)```/.exec(src);
  if (!m) return { text: src, flow: null };
  const flow = parsePillFlow(m[1]);
  if (!flow) return { text: src, flow: null };
  return { text: src.replace(m[0], "").trim(), flow };
};

/** 讲解页：入参 conceptId/subPoint（state 或 ?query），首载大纲 → 逐子点流式讲解 + 答疑。 */
const LessonScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: { conceptId?: number; subPoint?: string; taskId?: number } | null;
  };
  const [searchParams] = useSearchParams();

  const conceptId = Number(state?.conceptId ?? searchParams.get("conceptId") ?? 0);
  const stateSub = state?.subPoint ?? searchParams.get("subPoint") ?? "";
  /** 首页任务卡带来的题：学完直接开这道题 */
  const taskId = Number(state?.taskId ?? 0);
  const valid = Number.isFinite(conceptId) && conceptId > 0;

  const [ol, setOl] = useState<OutlineView | null>(null);
  const [olErr, setOlErr] = useState("");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(stateSub);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [streaming, setStreaming] = useState(false);
  const [msgs, setMsgs] = useState<LessonMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [err, setErr] = useState("");
  const [passBusy, setPassBusy] = useState(false);

  const textsRef = useRef<Record<string, string>>({});
  const lessonRef = useRef<SseStream | null>(null);
  const chatRef = useRef<SseStream | null>(null);
  const lastUserMsgId = useRef(0);
  const nextId = useRef(-1);

  const goBack = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate("/tasks");
  };

  // 大纲（缓存 miss 时服务端现场拆解）
  useEffect(() => {
    if (!valid) return;
    let alive = true;
    outline(conceptId)
      .then((o) => {
        if (!alive) return;
        setOl(o);
        setActive((cur) => {
          if (cur && o.subPoints.includes(cur)) return cur;
          if (stateSub && o.subPoints.includes(stateSub)) return stateSub;
          return o.subPoints[0] ?? "";
        });
      })
      .catch((e) => {
        if (alive) setOlErr(e instanceof Error ? e.message : "知识点加载失败");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [conceptId, stateSub, valid]);

  // 选中子点：本地有缓存文本直接用，否则 SSE 流式拉讲解
  useEffect(() => {
    if (!valid || !active) return;
    if (textsRef.current[active]) {
      setStreaming(false);
      setErr("");
      return;
    }
    setStreaming(true);
    setErr("");
    lessonRef.current?.cancel();
    lessonRef.current = lessonStream(conceptId, active, false, {
      onToken: (t) => {
        textsRef.current = {
          ...textsRef.current,
          [active]: (textsRef.current[active] ?? "") + t,
        };
        setTexts(textsRef.current);
      },
      onDone: () => setStreaming(false),
      onError: (_status, msg) => {
        setStreaming(false);
        setErr(msg ?? "讲解生成失败");
        // 残缺文本丢弃，重进该子点时可重流
        const rest = { ...textsRef.current };
        delete rest[active];
        textsRef.current = rest;
        setTexts(rest);
      },
    });
    return () => {
      lessonRef.current?.cancel();
    };
  }, [conceptId, active, valid]);

  // 答疑历史（时间升序）
  useEffect(() => {
    if (!valid || !active) return;
    let alive = true;
    setMsgs([]);
    lessonQa(conceptId, active)
      .then((list) => {
        if (!alive) return;
        setMsgs(
          list.map((m, i) => ({
            id: m.id || -(i + 1),
            role: m.role,
            text: m.text,
            timeText: parseTime(m.createdAt),
          })),
        );
      })
      .catch(() => {
        if (alive) setMsgs([]);
      });
    return () => {
      alive = false;
    };
  }, [conceptId, active, valid]);

  // 离开页面掐断 SSE
  useEffect(
    () => () => {
      lessonRef.current?.cancel();
      chatRef.current?.cancel();
    },
    [],
  );

  const send = () => {
    const q = question.trim();
    if (!valid || !active || !q || chatBusy) return;
    setQuestion("");
    setChatBusy(true);
    setErr("");
    const uid = (nextId.current -= 1);
    const aid = (nextId.current -= 1);
    const stamp = hm(new Date());
    setMsgs((m) => [
      ...m,
      { id: uid, role: "user", text: q, timeText: stamp },
      { id: aid, role: "assistant", text: "", timeText: stamp },
    ]);
    chatRef.current = lessonChat(conceptId, active, q, null, {
      onStart: (id) => {
        lastUserMsgId.current = id; // 提问落库 id（删除/兜底用）
      },
      onToken: (t) =>
        setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text: x.text + t } : x))),
      onDone: (finalText) => {
        if (finalText) {
          setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text: finalText } : x)));
        }
        setChatBusy(false);
      },
      onError: (_status, msg) => {
        setChatBusy(false);
        setErr(msg ?? "提问失败，请重试");
        setMsgs((m) =>
          m.length > 0 && m[m.length - 1].id === aid && !m[m.length - 1].text
            ? m.slice(0, -1)
            : m,
        );
      },
    });
  };

  const pass = async () => {
    if (!valid || !active || passBusy) return;
    setPassBusy(true);
    setErr("");
    try {
      await subPointPass(conceptId, active, true);
      if (taskId > 0) {
        // 秒进题面：题页内自己 startTask，不在这里等待
        navigate(`/run/task/${taskId}`);
      } else {
        navigate("/practice");
      }
    } catch (e) {
      setPassBusy(false);
      setErr(e instanceof Error ? e.message : "标记失败，请重试");
    }
  };

  if (!valid) return failBox("请从知识点进入讲解", goBack);
  if (!ready) return LOADING;
  if (!ol) return failBox(olErr || "知识点加载失败，请稍后重试", goBack);
  if (ol.subPoints.length === 0) return failBox("该知识点暂无子知识点", goBack);

  const activeIndex = Math.max(0, ol.subPoints.indexOf(active));
  const { text: bodyText, flow } = splitFlow(texts[active] ?? "");
  const subPoints: SubPointItem[] = ol.subPoints.map((sp, i) => ({
    text: sp,
    done: ol.completedSubPoints.includes(sp),
    active: i === activeIndex,
  }));
  const statusText = streaming ? "流式生成中" : bodyText ? "已生成" : "暂无内容";

  return (
    <Frame2965
      titleText={ol.name || ol.topic}
      subPoints={subPoints}
      activeIndex={activeIndex}
      statusText={statusText}
      bodyText={bodyText}
      flowNodes={flow}
      messages={msgs}
      question={question}
      error={err || undefined}
      passBusy={passBusy}
      onBack={goBack}
      onSelect={(i) => {
        const next = ol.subPoints[i];
        if (next && next !== active) setActive(next);
      }}
      onQuestion={setQuestion}
      onSend={send}
      onPass={() => void pass()}
    />
  );
};

export default LessonScreen;
