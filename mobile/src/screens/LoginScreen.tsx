import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2341 from "@/views/Frame2341";
import { PuzzleSlider } from "@/components/PuzzleSlider";
import { login, register as apiRegister, sendRegisterCode, getAuthConfig } from "@/api/auth";
import { API_BASE, ApiError } from "@/api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 联网诊断：fetch 失败时区分「手机→服务器这一跳不通」与「请求已到达但被中断」。
 *  no-cors 探活只要 TCP+TLS 握手成功就会返回（哪怕响应不可读），失败=网络层被拦。 */
async function diagnose(): Promise<string> {
  const host = API_BASE || "https://mianba.vip";
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "手机当前处于离线状态，请检查 Wi-Fi / 数据网络";
  }
  const t0 = Date.now();
  try {
    await fetch(`${host}/`, { mode: "no-cors", cache: "no-store" });
    return `已连通 ${host}（${Date.now() - t0}ms），但接口请求被中断，请截图反馈`;
  } catch {
    return `连不上 ${host}：请先用手机浏览器打开该地址测试（DNS / 网络 / 代理拦截）`;
  }
}

/** 登录页：登录 / 注册双模式（注册=邮箱验证码 + 滑块人机闸门），不预填任何账号数据。 */
const LoginScreen = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 注册：环境开关 + 发码状态
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [sentNote, setSentNote] = useState("");

  // 会话失效被自动踢回登录页时，展示 client.ts 暂存的意外401原因（正常过期不暂存）
  useEffect(() => {
    const saved = sessionStorage.getItem("mb.authError");
    if (saved) {
      sessionStorage.removeItem("mb.authError");
      setError(saved);
    }
  }, []);

  useEffect(() => {
    getAuthConfig()
      .then((c) => setCaptchaRequired(c.captchaRequired))
      .catch(() => { /* 后端未就绪时保持默认，提交时会自然报错 */ })
      .finally(() => setConfigLoaded(true));
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const switchMode = () => {
    setError("");
    setSentNote("");
    setCode("");
    setCodeSent(false);
    setResendIn(0);
    setPassword("");
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  const checkBaseInput = (): boolean => {
    if (!email.trim()) {
      setError("请输入邮箱");
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("邮箱格式不正确，请检查后再试");
      return false;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return false;
    }
    return true;
  };

  /** 实际调用后端发码（滑块通过后或滑块关闭时直接调用）。 */
  const doSendCode = async (captchaToken?: string) => {
    setSendingCode(true);
    setError("");
    try {
      await sendRegisterCode(email.trim(), captchaToken);
      setCodeSent(true);
      setResendIn(60);
      setSentNote(`验证码已发送至 ${email.trim()}，15 分钟内有效。`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "验证码发送失败，请检查网络后重试");
    } finally {
      setSendingCode(false);
    }
  };

  /** 点「获取验证码」：先本地校验，再决定是否弹滑块。 */
  const handleGetCode = () => {
    setError("");
    setSentNote("");
    if (!checkBaseInput()) return;
    if (captchaRequired) setShowCaptcha(true);
    else void doSendCode(undefined);
  };

  const submit = async () => {
    if (busy) return;
    setError("");

    if (mode === "login") {
      if (!email.trim() || !password) {
        setError("请输入邮箱和密码");
        return;
      }
      setBusy(true);
      try {
        await login(email.trim(), password);
        navigate("/tasks", { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "登录失败，请重试";
        setError(/fetch/i.test(msg) ? await diagnose() : msg);
      } finally {
        setBusy(false);
      }
      return;
    }

    // —— 注册 ——
    if (!checkBaseInput()) return;
    if (!codeSent) {
      setError("请先点「获取验证码」，输入邮箱收到的验证码后再注册");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("请输入 6 位邮箱验证码");
      return;
    }
    setBusy(true);
    try {
      await apiRegister(email.trim(), password, code.trim());
      navigate("/tasks", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "注册失败，请重试";
      setError(/fetch/i.test(msg) ? await diagnose() : msg);
    } finally {
      setBusy(false);
    }
  };

  const codeLabel = sendingCode
    ? "发送中…"
    : resendIn > 0
      ? `${resendIn}s 后重发`
      : codeSent
        ? "重新获取"
        : "获取验证码";

  return (
    <>
      <Frame2341
        mode={mode}
        email={email}
        password={password}
        code={code}
        onEmailChange={(v) => {
          setEmail(v);
          setError("");
          // 邮箱变了 → 已发的验证码作废
          setCode("");
          setCodeSent(false);
          setResendIn(0);
          setSentNote("");
        }}
        onPasswordChange={(v) => {
          setPassword(v);
          setError("");
        }}
        onCodeChange={(v) => {
          setCode(v.replace(/\D/g, "").slice(0, 6));
          setError("");
        }}
        onGetCode={handleGetCode}
        codeLabel={codeLabel}
        codeDisabled={sendingCode || !configLoaded || resendIn > 0}
        codeNote={sentNote}
        remember={remember}
        onToggleRemember={() => setRemember((r) => !r)}
        error={error}
        busy={busy}
        onSubmit={() => void submit()}
        onRegister={switchMode}
      />
      {showCaptcha && (
        <PuzzleSlider
          onPass={(t) => {
            setShowCaptcha(false);
            void doSendCode(t);
          }}
          onClose={() => setShowCaptcha(false)}
        />
      )}
    </>
  );
};

export default LoginScreen;
