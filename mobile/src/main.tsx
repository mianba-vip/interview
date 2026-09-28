import { createRoot } from "react-dom/client";
import "./assets/styles/variables.css";
import "./assets/styles/common.css";
import "./assets/styles/global.css";
import "./index.css";
import "./assets/styles/font.css";
import "./styles/app-extra.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
