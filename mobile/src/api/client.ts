/** 统一 fetch 包装：Bearer 鉴权 + Result 信封解包 + 401 自动回登录页。 */
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'yan.token:mobile';

export class ApiError extends Error {
  status?: number;
  code?: number;
  constructor(status: number | undefined, code: number | undefined, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body && !('Content-Type' in (init.headers ?? {}))
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
  });

  const body = (await res.json().catch(() => null)) as
    | { code?: number; message?: string; data?: T }
    | null;

  if (res.status === 401) {
    const hadToken = !!token;
    removeToken();
    if (hadToken) {
      // 带着 token 被拒 = 会话过期/被踢：静默回登录页即可，不把「未登录」当
      // 报错展示（此前首次打开会先看到一屏「未登录或登录已过期」，像登录失败）
      console.info(`[auth] 会话已失效（${path}），返回登录页`);
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError(401, 401, '登录已过期');
    }
    // 没带 token 还401 = 意外：透出服务端原文 + 接口路径，登录页展示便于定位
    const detail = `${body?.message ?? '未登录或登录已过期'}（HTTP 401 · ${path}）`;
    try { sessionStorage.setItem('mb.authError', detail); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 401, detail);
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.code, body?.message ?? `请求失败（HTTP ${res.status}）`);
  }
  if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
    throw new ApiError(res.status, body.code, body.message ?? '请求失败');
  }
  return (body && typeof body === 'object' && 'data' in body ? body.data : (body as T)) as T;
}

export { API_BASE };
