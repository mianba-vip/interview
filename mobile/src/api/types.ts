/** 移动端用到的后端数据模型（与桌面 frontend/src/api/types.ts 同源子集）。 */

export interface LoginResp {
  token: string;
  userId: string;
  verified: boolean;
}

export interface DailyTaskView {
  id: number;
  planId: number | null;
  planTitle: string;
  kind: 'REVIEW' | 'NEW';
  conceptId: number;
  conceptName: string;
  layer: number;
  status: 'PENDING' | 'READY' | 'DONE' | 'SKIPPED';
  questionId: number | null;
  stem: string | null;
  probeType: string | null;
  subPoint: string | null;
}

export interface QuestionView {
  runId: number;
  questionId: number;
  stem: string;
  probeType: string;
  responseFormat: string;
}

export interface ConceptProfile {
  conceptId: number;
  name: string;
  layer: number;
  masteryLevel: number;
}

export interface TopicProfile {
  topic: string;
  masteredLayer: number;
  concepts: ConceptProfile[];
}
