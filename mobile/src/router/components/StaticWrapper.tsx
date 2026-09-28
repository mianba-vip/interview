import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { routes } from "../routes";

const RouterView = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
        />
      ))}
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
};

export default RouterView;
