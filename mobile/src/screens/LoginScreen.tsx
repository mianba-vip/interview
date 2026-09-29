import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2341 from "@/views/Frame2341";
import { login } from "@/api/auth";
import { API_BASE } from "@/api/client";

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

/** 登录页：模板 Frame2341 视觉 + 真实登录（token 由 auth.login 落盘）。 */
const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("xiaoyu_dev@qq.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 会话失效被自动踢回登录页时，展示 client.ts 暂存的真实 401 原因（接口路径 + 服务端原文）
  useEffect(() => {
    const saved = sessionStorage.getItem("mb.authError");
    if (saved) {
      sessionStorage.removeItem("mb.authError");
      setError(saved);
    }
  }, []);

  const submit = async () => {
    if (busy) return;
    setError("");
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
  };

  return (
    <Frame2341
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      remember={remember}
      onToggleRemember={() => setRemember((v) => !v)}
      error={error}
      busy={busy}
      onSubmit={() => void submit()}
      onRegister={() => console.log("立即注册：暂未开放")}
    />
  );
};

export default LoginScreen;
