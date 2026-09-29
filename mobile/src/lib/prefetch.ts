import { lessonStream, outline } from "@/api/lesson";

/**
 * 每日预取：把今日任务涉及概念的大纲与各子点讲解预热进服务端缓存，
 * 用户点开任务/知识点时全部命中缓存秒开。
 *
 * - 每天最多跑一轮（localStorage 记录日期与已完成概念，中断后下次打开续跑）
 * - 串行执行，不与用户当前操作抢带宽；离线直接跳过
 * - 单个概念失败（含 LLM 超时）即跳过，不标记完成，下次打开自动续跑
 */
const KEY = "mbs.prefetch";
const STEP_TIMEOUT_MS = 90_000;

interface PrefetchState {
  date: string;
  done: number[];
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function read(): PrefetchState {
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Partial<PrefetchState>) : {};
    if (p.date === today() && Array.isArray(p.done)) {
      return { date: p.date, done: p.done.filter((x) => typeof x === "number") };
    }
  } catch {
    /* ignore */
  }
  return { date: today(), done: [] };
}

function write(s: PrefetchState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** 还没预取的概念数（用于决定是否启动）。 */
export function prefetchPendingCount(conceptIds: number[]): number {
  const s = read();
  const unique = [...new Set(conceptIds)];
  if (s.date !== today()) return unique.length;
  return unique.filter((id) => !s.done.includes(id)).length;
}

/** 单个子点讲解走一遍 SSE（缓存命中即时返回；miss 时服务端生成并写缓存）。 */
function streamOnce(conceptId: number, subPoint: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve();
      }
    };
    const stream = lessonStream(conceptId, subPoint, false, {
      onToken: () => undefined,
      onReasoning: () => undefined,
      onDone: finish,
      onError: finish,
    });
    const timer = window.setTimeout(() => {
      stream.cancel();
      finish();
    }, STEP_TIMEOUT_MS);
  });
}

let running = false;

/** 串行预取今日任务涉及的概念；进度经 onProgress 上报（已完成概念数/总数）。 */
export async function prefetchTodayConcepts(
  conceptIds: number[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  if (running) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const ids = [...new Set(conceptIds)];
  if (ids.length === 0) return;

  const state = read();
  const pending = ids.filter((id) => !state.done.includes(id));
  if (pending.length === 0) return;

  running = true;
  try {
    for (const id of pending) {
      try {
        const o = await outline(id); // 大纲（服务端缓存；未拆解过会现场生成）
        for (const sp of o.subPoints) {
          await streamOnce(id, sp); // 各子点讲解（缓存命中即时返回）
        }
        const s = read();
        if (s.date === today()) {
          s.done.push(id);
          write(s);
        }
      } catch {
        /* 单个概念失败：不标记完成，下次打开续跑 */
      }
      const s = read();
      onProgress?.(s.done.length, ids.length);
    }
  } finally {
    running = false;
  }
}
