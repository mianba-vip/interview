import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getToken } from './api/client';
import TabBar from './components/TabBar';
import LoginScreen from './screens/LoginScreen';
import TasksScreen from './screens/TasksScreen';
import RunScreen from './screens/RunScreen';
import ReviewScreen from './screens/ReviewScreen';
import PracticeScreen from './screens/PracticeScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';
import MeScreen from './screens/MeScreen';
import SettingsAppearanceScreen from './screens/SettingsAppearanceScreen';
import AiSettingsScreen from './screens/AiSettingsScreen';
import InterviewSessionScreen from './screens/InterviewSessionScreen';

export default function App() {
  const { pathname } = useLocation();
  const authed = !!getToken();
  const immersive =
    pathname.startsWith('/run/') ||
    pathname.startsWith('/review/') ||
    pathname.startsWith('/interview/session') ||
    pathname.startsWith('/settings/');

  // 未登录一律回登录页（沉浸式答题页也不例外）
  if (!authed && pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/run/:runId" element={<RunScreen />} />
        <Route path="/review/:runId" element={<ReviewScreen />} />
        <Route path="/interview/session" element={<InterviewSessionScreen />} />
        <Route path="/tasks" element={<TasksScreen />} />
        <Route path="/practice" element={<PracticeScreen />} />
        <Route path="/interview" element={<PlaceholderScreen title="面试" note="模拟面试 · 即将开放" />} />
        <Route path="/sediment" element={<PlaceholderScreen title="沉淀" note="对话沉淀 · 即将开放" />} />
        <Route path="/me" element={<MeScreen />} />
        <Route path="/settings/appearance" element={<SettingsAppearanceScreen />} />
        <Route path="/settings/ai" element={<AiSettingsScreen />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
      {authed && !immersive && <TabBar />}
    </>
  );
}
