/** 移动端本地偏好：主题色温 / 字号 / 功能开关（localStorage，改完即生效）。 */
const KEY = 'mianba.mobile.prefs';

export interface MobilePrefs {
  /** 主题色温：奶油白天 / 纯白 / 跟随系统（深色版待设计，系统暗色暂回落奶油） */
  theme: 'cream' | 'white' | 'system';
  /** 字号档位：0 小(15px) | 1 标准(16px) | 2 大(18px) */
  fontScale: number;
  /** 学习提醒开关（推送预留） */
  remindOn: boolean;
  /** 语音作答开关（M3 语音输入读取） */
  voiceOn: boolean;
}

export const DEFAULT_PREFS: MobilePrefs = {
  theme: 'cream',
  fontScale: 1,
  remindOn: true,
  voiceOn: true,
};

export function loadPrefs(): MobilePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const p = JSON.parse(raw) as Partial<MobilePrefs>;
    return {
      theme: p.theme === 'white' || p.theme === 'system' ? p.theme : 'cream',
      fontScale: typeof p.fontScale === 'number' ? Math.min(2, Math.max(0, Math.round(p.fontScale))) : 1,
      remindOn: p.remindOn !== false,
      voiceOn: p.voiceOn !== false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: MobilePrefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function applyPrefs(p: MobilePrefs): void {
  const root = document.documentElement;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const bg = p.theme === 'white' ? '#FFFFFF' : p.theme === 'system' && prefersDark ? '#FFFFFF' : '#FAF7F2';
  root.style.setProperty('--bg', bg);
  // 字号档位：15 / 16 / 18
  root.style.fontSize = `${[15, 16, 18][p.fontScale] ?? 16}px`;
}
