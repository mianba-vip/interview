import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, useLocation, useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { getToken } from "@/api/client";
import RouterViewContext from "./components/StaticWrapper";

// 未登录一律回登录页（与路由结构无关，统一在 Router 内兜底）
const AuthGate = () => {
  const { pathname } = useLocation();
  if (!getToken() && pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }
  return <RouterViewContext />;
};

/**
 * 平台桥：
 * 1) 接口 401（client.ts 清 token 后派发 auth:expired）→ 自动回登录页，
 *    真实原因经 sessionStorage mb.authError 在登录页展示；
 * 2) Android 返回键：有历史则后退；子页面无历史回主页面；
 *    根页面最小化回桌面——绝不直接退出应用（未监听时 Capacitor 默认会杀进程）。
 */
const PlatformBridge = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => {
      if (window.location.pathname !== "/login") navigate("/login", { replace: true });
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [navigate]);

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;
    let disposed = false;
    void App.addListener("backButton", ({ canGoBack }) => {
      const path = window.location.pathname;
      if (canGoBack) {
        window.history.back();
      } else if (path !== "/login" && path !== "/tasks") {
        navigate("/tasks");
      } else {
        void App.minimizeApp();
      }
    }).then((h) => {
      if (disposed) void h.remove();
      else handle = h;
    });
    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, [navigate]);

  return null;
};

export const RouterView = () => {
  return (
    <Router>
      <PlatformBridge />
      <AuthGate />
    </Router>
  );
};
