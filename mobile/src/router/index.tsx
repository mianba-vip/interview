import { BrowserRouter as Router, Navigate, useLocation } from "react-router-dom";
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

export const RouterView = () => {
  return (
    <Router>
      <AuthGate />
    </Router>
  );
};
