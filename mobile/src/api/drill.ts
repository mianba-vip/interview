import { apiFetch, API_BASE } from './client';
import { openSse, type SseStream } from './sse';
import type {
  ConversationView,
  DailyTaskView,
  GradeView,
  QuestionView,
  RehearsalView,
  ReviewView,
  RunSummaryView,
  RunDetailView,
  TopicProfile,
} from './types';

/** 今日任务（懒兜底：服务端会现场补排期与预生成）。 */
export function today(): Promise<DailyTaskView[]> {
  return apiFetch<DailyTaskView[]>('/drill/today');
}

/** 开任务：恢复活跃 run 或用预生成题开新 run（服务端已做闸门）。 */
export function startTask(taskId: number): Promise<QuestionView> {
  return apiFetch<QuestionView>(`/drill/task/${taskId}/start`, { method: 'POST' });
}

/** 深度画像：按主题聚合的概念掌握度（驱动首页掌握度环）。 */
export function profile(): Promise<TopicProfile[]> {
  return apiFetch<TopicProfile[]>('/drill/profile');
}

/** 练习 Tab：历史练习（按对话线聚合）。 */
export function history(): Promise<RunSummaryView[]> {
  return apiFetch<RunSummaryView[]>('/drill/history');
}

/** 对话线详情：该题全部轮次（恢复对话用）。 */
export function conversation(questionId: number): Promise<ConversationView> {
  return apiFetch<ConversationView>(`/drill/history/conversation/${questionId}`);
}

/** run 详情（M2 复盘页补 grade 用）。 */
export function runDetail(runId: number): Promise<RunDetailView> {
  return apiFetch<RunDetailView>(`/drill/${runId}`);
}

/** 结束并评分：一次性 LLM 判分（同步返回 GradeView）。 */
export function finish(runId: number): Promise<GradeView> {
  return apiFetch<GradeView>(`/drill/${runId}/finish`, { method: 'POST' });
}

/** AI 复盘：欠缺总结 / 解题思路 / 记忆口诀。 */
export function review(runId: number): Promise<ReviewView> {
  return apiFetch<ReviewView>(`/drill/${runId}/review`);
}

export interface ChatHandlers {
  onToken: (text: string) => void;
  onReasoning?: (text: string) => void;
  onReveal?: () => void;
  onDone: () => void;
  onError: (status?: number, message?: string) => void;
}

/** 苏格拉底对话式练习：每轮作答走此 SSE（judge 三态判定由后端驱动）。 */
export function chatStream(
  runId: number,
  rawAnswer: string,
  reveal: boolean,
  h: ChatHandlers,
  images?: string[],
): SseStream {
  return openSse(
    `${API_BASE}/api/drill/${runId}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawAnswer, reveal, images: images ?? [] }),
    },
    {
      onToken: h.onToken,
      onReasoning: h.onReasoning,
      onEvent: (name) => {
        if (name === 'reveal') h.onReveal?.();
      },
      onDone: h.onDone,
      onError: h.onError,
    },
  );
}

export function rehearsalStart(conceptId?: number): Promise<RehearsalView> {
  return apiFetch<RehearsalView>('/drill/rehearsal/start', {
    method: 'POST',
    body: JSON.stringify({ conceptId: conceptId ?? null }),
  });
}

export function rehearsalEnd(runId: number): Promise<RehearsalView> {
  return apiFetch<RehearsalView>(`/drill/rehearsal/${runId}/end`, { method: 'POST' });
}

export interface RehearsalAnswerHandlers {
  onResult: (view: RehearsalView) => void;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (status?: number, message?: string) => void;
}

/** 模拟面试作答：先 result（判分/下一问），随后逐 token 推讲解。 */
export function rehearsalAnswer(
  runId: number,
  rawAnswer: string,
  h: RehearsalAnswerHandlers,
): SseStream {
  return openSse(
    `${API_BASE}/api/drill/rehearsal/${runId}/answer`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawAnswer }),
    },
    {
      onEvent: (name, json) => {
        if (name === 'result') {
          try { h.onResult(JSON.parse(json) as RehearsalView); } catch { /* 忽略坏帧 */ }
        }
      },
      onToken: h.onToken,
      onDone: h.onDone,
      onError: h.onError,
    },
  );
}

/** 分页历史（懒加载）：最新在前；limit 默认 20。 */
export function historyPage(offset: number, limit = 20): Promise<RunSummaryView[]> {
  return apiFetch<RunSummaryView[]>(`/drill/history/page?offset=${offset}&limit=${limit}`);
}
