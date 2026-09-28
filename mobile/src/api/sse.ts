import { getToken } from './client';

/** 移动端 SSE 解析器：逐帧分发 token / reasoning / done / error / 自定义事件。
 *  与桌面 openSse 同源简化版：注释帧（: keepalive）忽略，data 多行合并。 */
export interface SseHandlers {
  onToken?: (text: string) => void;
  onReasoning?: (text: string) => void;
  onEvent?: (name: string, json: string) => void;
  onDone: (finalText?: string) => void;
  onError: (status?: number, message?: string) => void;
}

export interface SseStream {
  cancel: () => void;
}

export function openSse(url: string, init: RequestInit, h: SseHandlers): SseStream {
  const controller = new AbortController();
  let cancelled = false;

  void (async () => {
    try {
      const token = getToken();
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok || !res.body) {
        let msg = '';
        try { msg = await res.text(); } catch { /* ignore */ }
        if (!cancelled) h.onError(res.status, msg || `HTTP ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let event: string | null = null;
      const data: string[] = [];
      let sawDone = false;
      let sawError = false;

      const dispatch = () => {
        const payload = data.join('\n');
        data.length = 0;
        if (!payload) return;
        if (event === 'done') {
          sawDone = true;
          let text: string | undefined;
          try {
            const j = JSON.parse(payload) as { text?: string };
            if (typeof j.text === 'string') text = j.text;
          } catch { /* 非 JSON 兜底 */ }
          h.onDone(text);
        } else if (event === 'reasoning') {
          try {
            const j = JSON.parse(payload) as { text?: string };
            if (typeof j.text === 'string') h.onReasoning?.(j.text);
          } catch { h.onReasoning?.(payload); }
        } else if (event === 'error') {
          sawError = true;
          let m = payload;
          try { m = (JSON.parse(payload) as { message?: string }).message ?? payload; } catch { /* keep raw */ }
          h.onError(undefined, m);
        } else if (event === 'reveal') {
          h.onEvent?.('reveal', payload);
        } else if (event === 'grade' || event === 'result') {
          h.onEvent?.(event, payload);
        } else if (event === null || event === 'message') {
          try {
            const j = JSON.parse(payload) as { text?: string };
            if (typeof j.text === 'string') h.onToken?.(j.text);
          } catch {
            if (payload !== '[DONE]') h.onToken?.(payload);
          }
        } else {
          // 其余自定义事件（start 等）交给调用方
          h.onEvent?.(event, payload);
        }
        event = null;
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).replace(/\r$/, '');
          buf = buf.slice(nl + 1);
          if (line === '') dispatch();
          else if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).trim());
          // 其余（: keepalive 注释）忽略
        }
      }
      dispatch();
      if (!cancelled && !sawDone && !sawError) h.onDone();
    } catch (e) {
      if (!cancelled) h.onError(undefined, e instanceof Error ? e.message : '网络错误');
    }
  })();

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}
