import { apiFetch, setToken, removeToken, ApiError } from './client';
import type { LoginResp } from './types';

/** 登录：成功即保存 token（与桌面端同一后端账号体系）。 */
export async function login(email: string, password: string): Promise<LoginResp> {
  const resp = await apiFetch<LoginResp | { code: number; message: string; data: LoginResp | null }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  const data = unwrap(resp);
  if (!data.token) throw new ApiError(undefined, 500, '登录响应缺少 token');
  setToken(data.token);
  return data;
}

export function logout(): void {
  removeToken();
}

function unwrap(resp: LoginResp | { code: number; message: string; data: LoginResp | null }): LoginResp {
  if (resp && typeof resp === 'object' && 'code' in resp) {
    if (resp.code !== 200 || !resp.data) throw new ApiError(undefined, resp.code, resp.message || '认证失败');
    return resp.data;
  }
  return resp;
}
