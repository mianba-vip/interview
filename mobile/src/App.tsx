import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getToken } from './api/client';
import TabBar from './components/TabBar';
import LoginScreen from './screens/LoginScreen';
import TasksScreen from './screens/TasksScreen';
import RunScreen from './screens/RunScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';

export default function App() {
  const { pathname } = useLocation();
  const authed = !!getToken();
  const immersive = pathname.startsWith('/run/');

  // 未登录一律回登录页（沉浸式答题页也不例外）
  if (!authed && pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/run/:runId" element={<RunScreen />} />
        <Route path="/tasks" element={<TasksScreen />} />
        <Route path="/practice" element={<PlaceholderScreen title="练习" note="对话式练习 · M2 里程碑开放" />} />
        <Route path="/interview" element={<PlaceholderScreen title="面试" note="模拟面试 · M2 里程碑开放" />} />
        <Route path="/sediment" element={<PlaceholderScreen title="沉淀" note="对话沉淀 · M2 里程碑开放" />} />
        <Route path="/me" element={<PlaceholderScreen title="我的" note="个人中心 · M2 里程碑开放" />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
      {authed && !immersive && <TabBar />}
    </>
  );
}
