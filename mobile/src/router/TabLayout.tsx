import { useLocation } from "react-router-dom";
import { routes } from "./routes";

/**
 * 5 个 Tab 页常驻挂载、按 pathname 显隐。
 *
 * 之前每次切 Tab 都是整屏卸载 → 空白加载页 → 重新取数挂载，底部 TabBar
 * 长在各 Frame 里会跟着一起消失再出现（肉眼可见的闪烁）。改为全部挂载后，
 * 切换只是一次 display 翻转：同一个渲染提交内完成，导航栏与已加载数据
 * 都保持原地，观感与原生 Tab 一致。
 */
const TAB_PATHS = ["/tasks", "/practice", "/interview", "/sediment", "/me"];
const TAB_PATH_SET = new Set(TAB_PATHS);

export const isTabPath = (p: string): boolean => TAB_PATH_SET.has(p);

const TabLayout = () => {
  const { pathname } = useLocation();
  const onTab = isTabPath(pathname);

  return (
    // 外层：离开 Tab 区（答题/复盘/设置等沉浸页）时整体隐藏但保持挂载
    <div style={{ display: onTab ? "contents" : "none" }}>
      {routes
        .filter((r) => TAB_PATH_SET.has(r.path))
        .map(({ path, component: Screen }) => (
          <div
            key={path}
            style={{
              display: pathname === path ? "block" : "none",
              // scroll-container 的 height:100% 需要父级有确定高度
              height: "100%",
            }}
          >
            <Screen />
          </div>
        ))}
    </div>
  );
};

export default TabLayout;
