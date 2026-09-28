import { useEffect, useState } from 'react';
import { corpusApi } from '../api/corpus';
import { knowledgeApi } from '../api/knowledge';
import type { CorpusView, KnowledgeCardView } from '../api/types';
import { MarkdownLite } from '../components/MarkdownLite';

type Seg = 'cards' | 'due' | 'corpus';

/** 沉淀：对话沉淀知识卡 + 到期复习 + 资料库。 */
export default function SedimentScreen() {
  const [seg, setSeg] = useState<Seg>('cards');
  const [cards, setCards] = useState<KnowledgeCardView[] | null>(null);
  const [due, setDue] = useState<KnowledgeCardView[] | null>(null);
  const [corpus, setCorpus] = useState<CorpusView[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (seg === 'cards' && cards === null) {
      knowledgeApi.cards().then(setCards).catch((e) => setErr(e.message));
    }
    if (seg === 'due' && due === null) {
      knowledgeApi.due().then(setDue).catch((e) => setErr(e.message));
    }
    if (seg === 'corpus' && corpus === null) {
      corpusApi.list().then(setCorpus).catch((e) => setErr(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg]);

  const list = seg === 'cards' ? cards : seg === 'due' ? due : corpus;

  return (
    <div className="screen">
      <div className="greet-title">沉淀</div>
      <div className="greet-sub">对话沉淀为知识卡，到期自动提醒复习</div>

      <div className="seg-row">
        {(['cards', 'due', 'corpus'] as Seg[]).map((s) => (
          <button
            key={s}
            className={'seg-btn' + (seg === s ? ' seg-on' : '')}
            onClick={() => setSeg(s)}
          >
            {s === 'cards' ? '知识卡' : s === 'due' ? '到期复习' : '资料库'}
          </button>
        ))}
      </div>

      {err && <div className="form-err">{err}</div>}
      {list === null && <div className="center-note">加载中…</div>}
      {list !== null && list.length === 0 && (
        <div className="center-note">{seg === 'corpus' ? '还没有上传资料' : '暂无内容'}</div>
      )}

      {seg !== 'corpus' &&
        (list as KnowledgeCardView[])?.map((c) => (
          <div key={c.id} className="card">
            <div className="card-title"><MarkdownLite text={c.question} /></div>
            {c.answer && <div className="card-sub"><MarkdownLite text={c.answer} /></div>}
            {c.tags && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {c.tags.split(/[,，]/).filter(Boolean).map((t) => (
                  <span key={t} className="pill" style={{ background: 'var(--mint-soft)', color: '#1d8a82' }}>
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}
            {seg === 'due' && c.dueAt && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--coral)', fontWeight: 700 }}>
                到期：{c.dueAt.slice(0, 10)}
              </div>
            )}
          </div>
        ))}

      {seg === 'corpus' &&
        (list as CorpusView[])?.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">{c.name}</div>
              <span className="pill" style={{ background: 'var(--mint-soft)', color: '#1d8a82' }}>
                {c.indexState === 'READY' ? '已索引' : c.indexState}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
              {c.charCount} 字 · {c.chunkCount} 块 · {c.sourceType}
            </div>
            {c.overview && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>
                {c.overview.slice(0, 90)}{c.overview.length > 90 ? '…' : ''}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
