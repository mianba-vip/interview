import { createRoot } from "react-dom/client";
import "./assets/styles/variables.css";
import "./assets/styles/common.css";
import "./assets/styles/global.css";
import "./index.css";
import "./assets/styles/font.css";
import "./styles/app-extra.css";
import App from "./App";
// 必须在 App（各 Frame 样式）之后引入：底部导航贴底覆盖依赖样式表顺序
import "./styles/nav-flush.css";

createRoot(document.getElementById("root")!).render(<App />);
