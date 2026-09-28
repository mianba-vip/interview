import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame2341 from "@/views/Frame2341";
import { login } from "@/api/auth";

/** 登录页：模板 Frame2341 视觉 + 真实登录（token 由 auth.login 落盘）。 */
const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("xiaoyu_dev@qq.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setError(e instanceof Error ? e.message : "登录失败，请重试");
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
