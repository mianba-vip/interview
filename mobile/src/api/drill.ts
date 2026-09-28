import { apiFetch } from './client';
import type { DailyTaskView, QuestionView, TopicProfile } from './types';

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
