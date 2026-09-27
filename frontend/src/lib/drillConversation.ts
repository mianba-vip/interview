import type { ConversationView } from '../api/types';
import type { ChatMsg } from '../pages/DrillChatBits';
import { nextMsgId } from '../pages/DrillChatBits';

/** 会话记录 → 消息列表的映射。从 Drill.tsx 拆出。 */

export function convToMessages(conv: ConversationView): ChatMsg[] {
  const msgs: ChatMsg[] = [
    { id: nextMsgId(), role: 'ai', text: conv.stem, streaming: false, type: 'stem' },
  ];
  for (const run of conv.runs) {
    for (const turn of run.turns) {
      if (turn.rawAnswer) msgs.push({ id: nextMsgId(), role: 'me', text: turn.rawAnswer, type: 'chat', images: turn.images ?? [] });
      if (turn.tutorText) msgs.push({ id: nextMsgId(), role: 'ai', text: turn.tutorText, type: 'chat' });
    }
  }
  return msgs;
}

// 只取某 run 已有的轮次（不含题干）：「继续学习」恢复到进行中的题时，把之前的问答历史载入聊天线程
export function runTurnsToMessages(conv: ConversationView, runId: number): ChatMsg[] {
  const run = conv.runs.find((r) => r.runId === runId);
  if (!run) return [];
  const msgs: ChatMsg[] = [];
  for (const turn of run.turns) {
    if (turn.rawAnswer) msgs.push({ id: nextMsgId(), role: 'me', text: turn.rawAnswer, type: 'chat', images: turn.images ?? [] });
    if (turn.tutorText) msgs.push({ id: nextMsgId(), role: 'ai', text: turn.tutorText, type: 'chat' });
  }
  return msgs;
}
