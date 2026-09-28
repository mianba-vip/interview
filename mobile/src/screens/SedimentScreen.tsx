import { useEffect, useState } from "react";
import Frame21242 from "@/views/Frame21242";
import { corpusApi } from "@/api/corpus";
import { knowledgeApi } from "@/api/knowledge";
import type { CorpusView, KnowledgeCardView } from "@/api/types";

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

/** 沉淀：知识卡 / 到期复习 / 资料库三份数据并行拉取，视觉交给 Frame21242。 */
const SedimentScreen = () => {
  const [cards, setCards] = useState<KnowledgeCardView[]>([]);
  const [due, setDue] = useState<KnowledgeCardView[]>([]);
  const [corpus, setCorpus] = useState<CorpusView[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([knowledgeApi.cards(), knowledgeApi.due(), corpusApi.list()])
      .then(([cardList, dueList, corpusList]) => {
        setCards(cardList);
        setDue(dueList);
        setCorpus(corpusList);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={loadingStyle} />;
  if (err) return <div style={errorStyle}>{err}</div>;

  return <Frame21242 cards={cards} due={due} corpus={corpus} />;
};

export default SedimentScreen;
