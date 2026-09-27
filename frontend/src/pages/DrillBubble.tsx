import { fmt, ReasoningPanel, type ChatMsg } from './DrillChatBits';
import { Timer } from 'lucide-react';
import { Tag } from '../components/ui';
import { Markdown } from '../components/Markdown';
import { PROBE_LABEL } from '../lib/labels';
import type { QuestionMeta } from '../api/types';

/** 聊天气泡渲染（含思考过程折叠面板与逐字光标）。从 Drill.tsx 拆出。 */

export function ChatBubble({
  msg: m,
  meta,
  timingOn,
  seconds,
}: {
  msg: ChatMsg;
  meta: QuestionMeta | null;
  timingOn: boolean;
  seconds: number;
}) {
  // 思考中 / 生成中：streaming 且还没出字
  const isThinking = m.streaming && !m.text;
  const thinkingText = m.type === 'stem' ? '正在生成题目…' : '思考中…';

  const rowCls = isThinking
    ? `chat-row chat-row-${m.role} chat-row-loading`
    : `chat-row chat-row-${m.role}`;
  const bubbleCls =
    `chat-bubble chat-bubble-${m.role}` +
    (m.type === 'stem' ? ' is-stem' : '') +
    (m.type === 'chat' && m.role === 'ai' && !isThinking ? ' is-tutor' : '') +
    (isThinking ? ' is-loading' : '');

  return (
    <div className={rowCls}>
      {m.role === 'ai' && (
        <div className="chat-avatar chat-avatar-ai"><span>AI</span></div>
      )}
      <div className={bubbleCls}>
        {/* 题干 meta 信息（probe type / runId / 计时）*/}
        {m.type === 'stem' && meta && (
          <div className="chat-stem-meta">
            <Tag>{PROBE_LABEL[meta.probeType] ?? meta.probeType}</Tag>
            <span className="eyebrow">run #{meta.runId}</span>
            {timingOn && (
              <span className="timer-chip">
                <Timer size={14} strokeWidth={1.8} /> {fmt(seconds)}
              </span>
            )}
          </div>
        )}
        {isThinking ? (
          <>
            <span className="spinner-sm" /> {thinkingText}
          </>
        ) : m.type === 'stem' ? (
          // 题干不走 tutor-text（避免"讲解 ·"前缀）；思考过程流式展示（默认展开，markdown）
          <>
            {m.reasoning && <ReasoningPanel text={m.reasoning} active={m.streaming} />}
            <Markdown>{m.text}</Markdown>
            {m.streaming && <span className="tutor-caret" aria-hidden />}
          </>
        ) : m.role === 'ai' ? (
          // AI 对话回复走 tutor-text 样式；思考过程流式展示（默认展开，markdown），正文保持干净。
          // revealed=true（答案已揭示）时在气泡顶部渲染「参考答案」分隔线。
          <>
            {m.revealed && (
              <div className="chat-reveal-divider">
                <span>参考答案 · 此后的回答不再计入评分</span>
              </div>
            )}
            <div className="tutor-text">
            {m.reasoning && <ReasoningPanel text={m.reasoning} active={m.streaming} />}
            <Markdown>{m.text}</Markdown>
            {m.streaming && <span className="tutor-caret" aria-hidden />}
          </div>
          {m.paused && (
            <div className="chat-paused-note">⏸ 已暂停：未答完的回复未保存，可继续提问</div>
          )}
          </>
        ) : (
          // 用户自己的消息：Markdown 渲染（与 AI 同款），贴的代码自动高亮；图片原样展示
          <div className="me-text">
            {m.images && m.images.length > 0 && (
              <div className="chat-img-row">
                {m.images.map((src, i) => <img key={i} src={src} alt={`消息图片 ${i + 1}`} loading="lazy" />)}
              </div>
            )}
            <Markdown>{m.text}</Markdown>
          </div>
        )}
      </div>
      {m.role === 'me' && (
        <div className="chat-avatar chat-avatar-me"><span>我</span></div>
      )}
    </div>
  );
}

// —— 应用内确认弹窗（Electron 不支持 window.confirm/prompt，必须用组件弹窗）——
