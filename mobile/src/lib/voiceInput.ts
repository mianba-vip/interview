import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import type { PluginListenerHandle } from "@capacitor/core";

/**
 * 按住说话的语音输入（设置页「语音作答」开关控制显隐）。
 * Android WebView 不支持 webkitSpeechRecognition，走原生 SpeechRecognizer 插件：
 * 按下 → 查设备支持 + 申请麦克风权限 + 开始识别（partialResults 持续缓冲最新识别）；
 * 松开 → 停止识别，把识别文本回调给调用方追加进输入框。
 */
export function useVoiceInput(onText: (text: string) => void, onError: (msg: string) => void) {
  const [listening, setListening] = useState(false);
  const bufferRef = useRef("");
  const activeRef = useRef(false);

  // 部分结果持续刷新缓冲（松开时取最后一版作为最终文本）
  useEffect(() => {
    let handle: PluginListenerHandle | undefined;
    let disposed = false;
    void SpeechRecognition.addListener("partialResults", (data) => {
      const m = data.matches?.[0];
      if (m) bufferRef.current = m;
    }).then((h) => {
      if (disposed) void h.remove();
      else handle = h;
    });
    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, []);

  // 离开页面兜底：还有识别会话就停掉，避免系统麦克风指示灯常亮
  useEffect(
    () => () => {
      if (activeRef.current) {
        activeRef.current = false;
        void SpeechRecognition.stop().catch(() => undefined);
      }
    },
    [],
  );

  const start = useCallback(async () => {
    if (activeRef.current) return;
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        onError("此设备不支持语音识别");
        return;
      }
      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        onError("需要麦克风权限才能语音作答，请在系统设置中开启");
        return;
      }
      bufferRef.current = "";
      await SpeechRecognition.start({
        language: "zh-CN",
        partialResults: true,
        popup: false,
        maxResults: 3,
      });
      activeRef.current = true;
      setListening(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      onError(
        /unimplemented|not implemented/i.test(msg)
          ? "语音作答需在手机 App 内使用"
          : "启动语音识别失败，请检查麦克风权限后重试",
      );
    }
  }, [onError]);

  const stop = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setListening(false);
    try {
      await SpeechRecognition.stop();
    } catch {
      /* 识别已自行结束时忽略 */
    }
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    if (text) onText(text);
  }, [onText]);

  return { listening, start, stop };
}
