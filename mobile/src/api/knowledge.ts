import { apiFetch } from './client';
import type { KnowledgeCardView } from './types';

export const knowledgeApi = {
  cards: () => apiFetch<KnowledgeCardView[]>('/knowledge/cards'),
  due: () => apiFetch<KnowledgeCardView[]>('/knowledge/cards/due'),
};
