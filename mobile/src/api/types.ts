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

export interface GradeView {
  runId: number;
  questionId: number;
  rawScore: number;
  grade: string; // EASY / GOOD / HARD / MISSING
  byConceptJson: string; // JSON 字符串 → ByConcept[]
}

export interface ReviewView {
  runId: number;
  stem: string;
  rawScore: number;
  weakPoints: string[];
  gapSummary: string | null;
  approach: string | null;
  mnemonic: string | null;
  myWords: string | null;
  gapFound: string | null;
  nextAction: string | null;
}

export interface RunSummaryView {
  runId: number; // 该题最近一次 run 的 runId
  stem: string;
  rawScore: number;
  grade: string | null;
  answeredAt: string;
  hasNote: boolean;
  questionId: number; // 对话线聚合键
  runCount: number;
  status: string; // GRADED / ANSWERING / READY
  planId: number | null;
}

export interface ConversationTurn {
  round: number;
  stem: string;
  rawAnswer: string | null;
  rawScore: number;
  passed: boolean | null;
  byConceptJson: string | null;
  tutorText: string | null;
  images?: string[] | null;
}

export interface ConversationRun {
  runId: number;
  mode: string; // LEARN / REHEARSAL
  status: string; // GRADED / ANSWERING / READY
  sourceRunId: number | null;
  rawScore: number;
  grade: string | null;
  answeredAt: string;
  turns: ConversationTurn[];
}

export interface ConversationView {
  questionId: number;
  stem: string;
  probeType: string;
  responseFormat: string;
  runs: ConversationRun[];
}

export interface RunDetailView {
  runId: number;
  questionId: number;
  stem: string;
  probeType: string;
  responseFormat: string;
  rawAnswer: string | null;
  rawScore: number;
  grade: string | null;
  byConceptJson: string;
}

export interface ChatMsg {
  id: number;
  role: 'me' | 'ai';
  text: string;
  reasoning?: string;
}
