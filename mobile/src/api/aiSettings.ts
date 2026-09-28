import { apiFetch } from './client';

/** AI 模型配置（GET 不回显 key，只回 hasApiKey；POST 时 apiKey 留空/缺省=不改）。 */

export interface AiSettingsView {
  provider: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  temperature: number;
  reasoningEffort: string;
  supportsVision: boolean;
}

export interface AiSettingsUpdate {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature: number;
  reasoningEffort: string;
}

export function getAiSettings(): Promise<AiSettingsView> {
  return apiFetch<AiSettingsView>('/settings/ai');
}

export function saveAiSettings(cfg: AiSettingsUpdate): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/settings/ai', {
    method: 'POST',
    body: JSON.stringify(cfg),
  });
}
