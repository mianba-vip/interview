import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame21403 from "@/views/Frame21403";
import { logout } from "@/api/auth";
import { knowledgeApi } from "@/api/knowledge";
import { userApi } from "@/api/user";
import { history, profile } from "@/api/drill";
import { loadPrefs } from "@/lib/prefs";
import type { RunSummaryView, TopicProfile, UserProfileView } from "@/api/types";

const loadingStyle = { minHeight: "100vh", background: "var(--color-bg-cream)" } as const;
const errorStyle = {
  ...loadingStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  textAlign: "center",
  color: "var(--color-text-secondary)",
} as const;

const THEME_LABEL = { cream: "奶油白天", white: "纯白", system: "跟随系统" } as const;
const FONT_LABEL = ["小", "标准", "大"];

/** 我的：画像 + 深度画像 + 历史练习推导统计，视觉交给 Frame21403。 */
const MeScreen = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfileView | null>(null);
  const [topics, setTopics] = useState<TopicProfile[]>([]);
  const [hist, setHist] = useState<RunSummaryView[]>([]);
  const [due, setDue] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 待复习张数独立兜底，失败不拖垮整屏
    Promise.all([
      userApi.profile(),
      profile(),
      history(),
      knowledgeApi.due().catch(() => []),
    ])
      .then(([u, t, h, d]) => {
        setMe(u);
        setTopics(t);
        setHist(h);
        setDue(d.length);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  // 掌握度分层：masteryLevel >=2 已掌握 / =1 进行中 / 其余未掌握
  const concepts = topics.flatMap((t) => t.concepts);
  const mastered = concepts.filter((c) => c.masteryLevel >= 2).length;
  const inProgress = concepts.filter((c) => c.masteryLevel === 1).length;
  const notMastered = Math.max(0, concepts.length - mastered - inProgress);
  const totalPractice = hist.reduce((s, r) => s + r.runCount, 0);
  const completion = me
    ? Math.min(
        100,
        Math.round(
          (([me.nickname, me.phone, me.gender, me.birthday].filter(Boolean).length + 1) / 5) * 100,
        ),
      )
    : 0;

  // 作答日期去重（降序）
  const days = [...new Set(hist.map((r) => r.answeredAt.slice(0, 10)))].sort().reverse();
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);

  // 连续学习天数：从今天（或昨天）往回连续数
  let streak = 0;
  if (days.length > 0) {
    const first = new Date(days[0] + "T00:00:00");
    if ((today0.getTime() - first.getTime()) / 86400000 <= 1) {
      streak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1] + "T00:00:00");
        const cur = new Date(days[i] + "T00:00:00");
        if ((prev.getTime() - cur.getTime()) / 86400000 === 1) streak++;
        else break;
      }
    }
  }

  // 加入天数：后端无注册时间，按最早一次练习日近似
  const earliest = days.length ? new Date(days[days.length - 1] + "T00:00:00") : null;
  const joinedDays =
    earliest && !Number.isNaN(earliest.getTime())
      ? Math.max(1, Math.round((today0.getTime() - earliest.getTime()) / 86400000) + 1)
      : 1;

  const names = concepts.filter((c) => c.masteryLevel >= 2).map((c) => c.name);
  const skillPreview = names.length
    ? `已掌握：${names.slice(0, 3).join(" · ")}${names.length > 3 ? ` 等 ${names.length} 个知识点` : ""}`
    : "已掌握：暂无";

  const prefs = loadPrefs();
  const topic = topics[0];

  if (loading) return <div style={loadingStyle} />;
  if (err) return <div style={errorStyle}>{err}</div>;

  return (
    <Frame21403
      name={me?.nickname || me?.username || "同学"}
      email={me?.email || "—"}
      joinedText={`已加入 ${joinedDays} 天`}
      completion={completion}
      streak={streak}
      totalPractice={totalPractice}
      due={due}
      total={concepts.length}
      mastered={mastered}
      inProgress={inProgress}
      notMastered={notMastered}
      skillPreview={skillPreview}
      themeLabel={THEME_LABEL[prefs.theme]}
      fontLabel={FONT_LABEL[prefs.fontScale] ?? "标准"}
      direction={topic ? topic.topic : "Go 后端工程师"}
      onSettings={() => navigate("/settings")}
      onRow={(row) => console.log("待接入：", row)}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
};

export default MeScreen;
