import { apiFetch } from './client';
import type { CorpusView } from './types';

export const corpusApi = {
  list: () => apiFetch<CorpusView[]>('/corpus'),
};
