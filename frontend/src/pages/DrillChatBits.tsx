import { useEffect, useRef, useState } from 'react';
import { Markdown } from '../components/Markdown';

/** Drill 会话展示的小组件与工具：时间格式化、思考打字机、思考面板、消息模型。 */

export function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// —— 思考过程打字机：即使模型一次吐一大段，也逐字揭示，视觉上像流式 ——
export function useTypewriter(target: string, active: boolean, charsPerSec = 320): string {
  const [revealed, setRevealed] = useState(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  const activeRef = useRef(active);
  activeRef.current = active;

  // 完成 / 非生成态：直接显示全部，避免停在半句话上
  useEffect(() => {
    if (!active) setRevealed(targetRef.current.length);
  }, [active]);

  // 生成中：逐步揭示，并持续追上新到达的文本
  useEffect(() => {
    if (!active) return;
    const tick = Math.max(1, Math.round(charsPerSec / 20)); // ~50ms 一帧，每帧揭示若干字符
    const id = setInterval(() => {
      setRevealed(prev => {
        if (!activeRef.current) return targetRef.current.length;
        return Math.min(targetRef.current.length, prev + tick);
      });
    }, 50);
    return () => clearInterval(id);
  }, [active, charsPerSec]);

  // 目标变短（切换子点 / 重置）时收敛揭示进度
  useEffect(() => {
    setRevealed(prev => Math.min(prev, targetRef.current.length));
  }, [targetRef.current.length]);

  return target.slice(0, revealed);
}

/** 思考面板：可折叠 + 打字机逐字揭示；流式时默认自动滚动到底部展示最新输出，
 *  用户手动向上滚动（离开底部约 28px）后暂停自动跟随，回到底部再恢复。 */
export function ReasoningPanel({ text, active, speed, title = 'AI 思考过程' }: { text: string; active?: boolean; speed?: number; title?: string }) {
  const shown = useTypewriter(text, active ?? false, speed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true); // 是否鹏在底部（自动跟随最新输出）

  // 内容随打字机逐帧变高：只要仍鹏在底部，就滚到底展示最新字
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [shown]);

  // 用户滚动：离开底部（容差 28px）暂停跟随；回到底部恢复
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
  };

  return (
    <details className="reasoning-panel" open>
      <summary>{title}</summary>
      <div className="reasoning-text" ref={scrollRef} onScroll={handleScroll}>
        <Markdown>{shown}</Markdown>
      </div>
    </details>
  );
}

// —— 聊天消息：stem(题干) / chat(对话) 两型；reasoning 为 AI 思考过程（可折叠展示）——
export interface ChatMsg {
  id: string;
  role: 'ai' | 'me';
  text: string;
  streaming?: boolean;
  type: 'stem' | 'chat';
  reasoning?: string;
  paused?: boolean;   // AI 回复被用户「暂停」：已显示的内容保留，但未答完的回复不落库
  images?: string[];  // 用户消息附带的图片（data URL）
  revealed?: boolean; // 该 AI 回复是「参考答案」（答案已揭示，评分只取揭示之前的回答）
}

let msgCounter = 0;
export const nextMsgId = () => `m${++msgCounter}`;
