import { apiFetch } from './client';

/** 学习方向（Study Plan）：列表 / AI 问答式新建（intake→confirm）。 */

export interface PlanConcept {
  id: number;
  name: string;
  topic: string;
  layer: number;
  masteryLevel: number; // 0 未掌握 /1 进行中 /2 已掌握
  note: string | null;
  subPoints: string[];
  completedSubPoints: string[];
}

export interface PlanView {
  id: number;
  title: string;
  goal: string | null;
  concepts: PlanConcept[];
  masteredCount: number;
  totalCount: number;
  dueReviewCount: number;
  corpusName: string | null;
}

export interface PlanPointDraft {
  name: string;
  layer?: number;
  note?: string;
  [k: string]: unknown;
}

export interface StudyPlanDraft {
  title: string;
  goal: string;
  points: PlanPointDraft[];
  corpusId: number | null;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface IntakeResp {
  reply: string;
  draft: StudyPlanDraft | null;
}

/** 全部学习方向（含概念清单）。 */
export function listPlans(): Promise<PlanView[]> {
  return apiFetch<PlanView[]>('/study-plan');
}

/** AI 问答式方向新建：信息足够时 draft 非空。 */
export function intake(messages: ChatMsg[], corpusId?: number | null): Promise<IntakeResp> {
  return apiFetch<IntakeResp>('/study-plan/intake', {
    method: 'POST',
    body: JSON.stringify({ messages, corpusId: corpusId ?? null }),
  });
}

/** 草稿知识点候选校验（名称/重复等）。 */
export function validateCandidates(draft: StudyPlanDraft): Promise<unknown> {
  return apiFetch<unknown>('/study-plan/validate-candidates', {
    method: 'POST',
    body: JSON.stringify({ draft }),
  });
}

/** 确认创建方向。 */
export function confirmPlan(draft: StudyPlanDraft): Promise<PlanView> {
  return apiFetch<PlanView>('/study-plan/confirm', {
    method: 'POST',
    body: JSON.stringify({ draft }),
  });
}
