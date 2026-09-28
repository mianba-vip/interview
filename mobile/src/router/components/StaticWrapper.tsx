import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { routes } from "../routes";
import TabLayout, { isTabPath } from "../TabLayout";

const RouterView = () => {
  const location = useLocation();
  // Tab 页内容由常驻的 TabLayout 提供（避免整屏重挂造成的闪烁），
  // 这里只渲染非 Tab 的沉浸页（答题/复盘/讲解/设置/登录/面试中…）。
  const onTab = isTabPath(location.pathname);

  return (
    <>
      <TabLayout />
      {!onTab && (
        <Routes location={location} key={location.pathname}>
          {routes
            .filter((route) => !isTabPath(route.path))
            .map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            ))}
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      )}
    </>
  );
};

export default RouterView;
