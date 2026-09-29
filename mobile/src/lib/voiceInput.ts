import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import type { PluginListenerHandle } from "@capacitor/core";

/**
 * 按住说话的语音输入（设置页「语音作答」开关控制显隐）。
 * Android WebView 不支持 webkitSpeechRecognition，走原生 SpeechRecognizer 插件：
 * 按下 → 查设备支持 + 申请麦克风权限 + 开始识别（partialResults 持续缓冲最新识别）；
 * 松开 / 系统静音自动结束 → 停止识别，把识别文本回调给调用方追加进输入框。
 *
 * 插件缺陷兜底：partialResults 模式下 start() 已 resolve，原生识别错误走
 * call.reject 会被 Capacitor 静默吞掉（JS 侧无感知）——用「看门狗 + 空结果提示」
 * 补齐：长时间无任何识别文本就主动收尾并给出可操作的提示。
 */
export function useVoiceInput(onText: (text: string) => void, onError: (msg: string) => void) {
  const [listening, setListening] = useState(false);
  const bufferRef = useRef("");
  const activeRef = useRef(false);
  const watchRef = useRef<number | undefined>(undefined);

  // 回调经 ref 转发：监听器只在挂载时注册一次，不随渲染重挂
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clearWatch = () => {
    if (watchRef.current !== undefined) {
      window.clearTimeout(watchRef.current);
      watchRef.current = undefined;
    }
  };

  /** 收尾：清看门狗 → 回调最终文本；空结果给出可操作的提示。 */
  const commit = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setListening(false);
    clearWatch();
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    if (text) onTextRef.current(text);
    else onErrorRef.current("未识别到语音，请靠近麦克风再按住说话");
  }, []);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        onErrorRef.current("此设备不支持语音识别");
        return;
      }
      const perm = await SpeechRecognition.requestPermissions();
      if (perm.speechRecognition !== "granted") {
        onErrorRef.current("需要麦克风权限才能语音作答，请在系统设置中开启");
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
      // 看门狗：12s 仍无任何识别文本（静默失败/无语音服务）→ 主动收尾并提示，
      // 避免按钮一直「聆听中」却永远不出字
      watchRef.current = window.setTimeout(() => {
        if (activeRef.current && !bufferRef.current.trim()) {
          void SpeechRecognition.stop().catch(() => undefined);
          commit();
        }
      }, 12000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      onErrorRef.current(
        /unimplemented|not implemented/i.test(msg)
          ? "语音作答需在手机 App 内使用"
          : "启动语音识别失败，请检查麦克风权限后重试",
      );
    }
  }, []);

  const stop = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      await SpeechRecognition.stop();
    } catch {
      /* 识别已自行结束时忽略 */
    }
    commit();
  }, [commit]);

  // 事件监听只注册一次
  useEffect(() => {
    const handles: PluginListenerHandle[] = [];
    let disposed = false;
    void SpeechRecognition.addListener("partialResults", (data) => {
      const m = data.matches?.[0];
      if (m) bufferRef.current = m;
    }).then((h) => {
      if (disposed) void h.remove();
      else handles.push(h);
    });
    void SpeechRecognition.addListener("listeningState", (data) => {
      // 系统侧静音自动结束：稍候片刻让最终结果落地，再提交
      if (data.status === "stopped" && activeRef.current) {
        window.setTimeout(() => {
          if (activeRef.current) commit();
        }, 800);
      }
    }).then((h) => {
      if (disposed) void h.remove();
      else handles.push(h);
    });
    return () => {
      disposed = true;
      for (const h of handles) void h.remove();
    };
  }, [commit]);

  // 组件卸载兜底：结束识别会话，避免系统麦克风指示灯常亮
  useEffect(
    () => () => {
      if (activeRef.current) {
        activeRef.current = false;
        void SpeechRecognition.stop().catch(() => undefined);
      }
    },
    [],
  );

  return { listening, start, stop };
}
