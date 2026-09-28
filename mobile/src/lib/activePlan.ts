/** 当前学习方向（与 Web 端同一 localStorage 键，跨端记忆一致）。 */
export const ACTIVE_PLAN_KEY = 'yan.activePlanId';

export function readActivePlanId(): number | null {
  const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function setActivePlanId(id: number | null): void {
  if (id == null) localStorage.removeItem(ACTIVE_PLAN_KEY);
  else localStorage.setItem(ACTIVE_PLAN_KEY, String(id));
}
