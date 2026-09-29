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

/** 注册：邮箱 + 密码 + 邮箱验证码，验证通过后端才建号并签发 JWT（成功即存 token）。 */
export async function register(email: string, password: string, code: string): Promise<LoginResp> {
  const resp = await apiFetch<LoginResp | { code: number; message: string; data: LoginResp | null }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, code }) },
  );
  const data = unwrap(resp);
  if (!data.token) throw new ApiError(undefined, 500, '注册响应缺少 token');
  setToken(data.token);
  return data;
}

/** 注册前置发码：滑块通过后调用，向邮箱发验证码（此步不建账号）。 */
export async function sendRegisterCode(email: string, captchaToken?: string): Promise<void> {
  await apiFetch<void>('/auth/send-register-code', {
    method: 'POST',
    body: JSON.stringify({ email, captchaToken }),
  });
}

/** 环境开关：captchaRequired=注册是否需要滑块；emailVerifyRequired=是否需要邮箱验证码。 */
export async function getAuthConfig(): Promise<{
  captchaRequired: boolean;
  emailVerifyRequired: boolean;
}> {
  return apiFetch('/auth/config');
}

function unwrap(resp: LoginResp | { code: number; message: string; data: LoginResp | null }): LoginResp {
  if (resp && typeof resp === 'object' && 'code' in resp) {
    if (resp.code !== 200 || !resp.data) throw new ApiError(undefined, resp.code, resp.message || '认证失败');
    return resp.data;
  }
  return resp;
}
