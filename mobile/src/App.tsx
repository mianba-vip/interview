import { useEffect } from "react";
import { RouterView } from "./router";

const App = () => {
  // 开屏图（index.html 内联的 #mbsplash）：React 挂载完成即淡出移除，
  // 把原生开屏 → WebView 首帧 → 数据加载的空窗串成连续的品牌画面
  useEffect(() => {
    const splash = document.getElementById("mbsplash");
    if (!splash) return;
    splash.classList.add("mb-hide");
    const t = window.setTimeout(() => splash.remove(), 320);
    return () => window.clearTimeout(t);
  }, []);

  return <RouterView />;
};

export default App;
