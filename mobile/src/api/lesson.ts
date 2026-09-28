import { apiFetch, API_BASE } from './client';
import { openSse, type SseStream } from './sse';

/** 先教后考：概念拆解（大纲/子点）、逐子点讲解 SSE 与讲解答疑。 */

export interface OutlineView {
  conceptId: number;
  name: string;
  topic: string;
  subPoints: string[];
  completedSubPoints: string[];
  cached: boolean;
}

export interface LessonQaView {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  anchor: string | null;
  createdAt: string;
}

/** 拆解知识点为子知识点清单（缓存 miss 时现场生成后写回）。 */
export function outline(conceptId: number): Promise<OutlineView> {
  return apiFetch<OutlineView>(`/drill/${conceptId}/outline`, { method: 'POST' });
}

/** 新增一个子知识点（语义重复会被 400 拦截）。 */
export function addSubPoint(conceptId: number, subPoint: string): Promise<OutlineView> {
  return apiFetch<OutlineView>(`/drill/${conceptId}/sub-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subPoint }),
  });
}

/** 删除子知识点（同步清讲解缓存与直接通过记录）。 */
export function removeSubPoint(conceptId: number, subPoint: string): Promise<OutlineView> {
  return apiFetch<OutlineView>(`/drill/${conceptId}/sub-points/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subPoint }),
  });
}

/** 手动「直接通过 / 取消通过」某个子知识点。 */
export function subPointPass(
  conceptId: number,
  subPoint: string,
  passed: boolean,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/drill/${conceptId}/sub-point-pass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subPoint, passed }),
  });
}

export interface LessonHandlers {
  onToken?: (text: string) => void;
  onReasoning?: (text: string) => void;
  onDone: (finalText?: string) => void;
  onError: (status?: number, message?: string) => void;
}

/** 子知识点讲解 SSE：缓存命中整段一帧下发，否则逐 token 流式；refresh=true 换种描述。 */
export function lessonStream(
  conceptId: number,
  subPoint: string,
  refresh: boolean,
  h: LessonHandlers,
): SseStream {
  return openSse(
    `${API_BASE}/api/drill/${conceptId}/lesson?subPoint=${encodeURIComponent(subPoint)}&refresh=${refresh}`,
    { method: 'POST' },
    { onToken: h.onToken, onReasoning: h.onReasoning, onDone: h.onDone, onError: h.onError },
  );
}

/** 答疑历史（当前用户、该子点，时间升序）。 */
export function lessonQa(conceptId: number, subPoint: string): Promise<LessonQaView[]> {
  return apiFetch<LessonQaView[]>(
    `/drill/${conceptId}/lesson/qa?subPoint=${encodeURIComponent(subPoint)}`,
  );
}

export interface LessonChatHandlers {
  /** 提问先落库：event:start 回传 userMessageId（删除/兜底用）。 */
  onStart?: (userMessageId: number) => void;
  onToken?: (text: string) => void;
  onReasoning?: (text: string) => void;
  onDone: (finalText?: string) => void;
  onError?: (status?: number, message?: string) => void;
}

/** 讲解答疑 SSE：先持久化学生提问，再逐 token 推回答；done 带全文可覆盖截断。 */
export function lessonChat(
  conceptId: number,
  subPoint: string,
  question: string,
  anchor: string | null,
  h: LessonChatHandlers,
): SseStream {
  return openSse(
    `${API_BASE}/api/drill/${conceptId}/lesson/chat?subPoint=${encodeURIComponent(subPoint)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, anchor }),
    },
    {
      onEvent: (name, json) => {
        if (name === 'start') {
          try {
            h.onStart?.((JSON.parse(json) as { userMessageId?: number }).userMessageId ?? 0);
          } catch {
            /* 坏帧忽略 */
          }
        }
      },
      onToken: h.onToken,
      onReasoning: h.onReasoning,
      onDone: h.onDone,
      onError: h.onError ?? (() => {}),
    },
  );
}

/** 删除若干条答疑记录（仅当前用户）。 */
export function deleteLessonQa(
  conceptId: number,
  subPoint: string,
  ids: number[],
): Promise<{ ok: boolean; deleted: number }> {
  return apiFetch<{ ok: boolean; deleted: number }>(
    `/drill/${conceptId}/lesson/qa/delete?subPoint=${encodeURIComponent(subPoint)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    },
  );
}
