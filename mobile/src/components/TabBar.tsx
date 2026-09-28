import { NavLink } from 'react-router-dom';
import { Home, PenLine, Briefcase, Layers, User } from 'lucide-react';

const items = [
  { to: '/tasks', label: '首页', icon: Home },
  { to: '/practice', label: '练习', icon: PenLine },
  { to: '/interview', label: '面试', icon: Briefcase },
  { to: '/sediment', label: '沉淀', icon: Layers },
  { to: '/me', label: '我的', icon: User },
];

/** 悬浮胶囊底部导航（奶油多巴胺：选中 = 紫色圆底图标）。 */
export default function TabBar() {
  return (
    <nav className="tabbar">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => 'tab-item' + (isActive ? ' active' : '')}>
          <span className="tab-icon">
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <span className="tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
