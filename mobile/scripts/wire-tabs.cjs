// 给模板 Tab 页的底部 TabBar 注入点击导航（React 侧 useNavigate）。
// 用法: node scripts/wire-tabs.cjs <tsx 文件...>
// 结构（Pixso 导出固定）：tab 项 div > frame-content 包装 > (图标 div + <p>标签)。
// 解析：只按行首 <div/<p 开启与 </div>/</p> 关闭记账；开启行向下到 '>' 行之间取 id。
const fs = require("node:fs");

const TAB_PATH = {
  "首页": "/tasks",
  "练习": "/practice",
  "面试": "/interview",
  "沉淀": "/sediment",
  "我的": "/me",
};

function fail(file, label, msg) {
  console.error(`${file} [${label}]: ${msg}`);
  process.exitCode = 1;
}

function captureId(lines, i) {
  const inline = lines[i].match(/id="([^"]+)"/);
  if (inline) return inline[1];
  // 单行开启（本行已含 '>'）：属性只在本行，后面都是子元素，不许再扫
  if (lines[i].includes(">")) return null;
  // 裸 <div 单独一行：id 在后续属性行里，遇 '>' 行停止
  for (let k = i + 1; k < Math.min(i + 6, lines.length); k++) {
    const m = lines[k].match(/^\s*id="([^"]+)"/);
    if (m) return m[1];
    if (lines[k].includes(">")) break;
  }
  return null;
}

function wire(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n");
  const n = lines.length;

  // 只认文件后 45% 区域：页面标题（“沉淀”“我的”“练习”）在顶部，tab 栏在底部。
  const hits = [];
  for (let i = Math.floor(n * 0.55); i < n; i++) {
    const m = lines[i].match(/^\s*\{"(首页|练习|面试|沉淀|我的)"\}\s*$/);
    if (m) hits.push({ line: i, label: m[1] });
  }
  if (hits.length !== 5 || new Set(hits.map((h) => h.label)).size !== 5) {
    return fail(file, "*", `期望 5 个互不相同的 tab 标签，实得 ${hits.length}`);
  }

  const plan = [];
  const hitByLine = new Map(hits.map((h) => [h.line, h]));
  const stack = [];

  for (let i = 0; i < n; i++) {
    const t = lines[i].trim();

    const hit = hitByLine.get(i);
    if (hit) {
      // 栈顶应是标签 <p>；向上找第一个带 id 的 div = 可点击 tab 项
      let target = null;
      for (let s = stack.length - 1; s >= 0; s--) {
        const el = stack[s];
        if (el.tag === "p") continue;
        if (el.id) {
          target = el;
          break;
        }
      }
      if (!target) return fail(file, hit.label, "栈里找不到带 id 的祖先 div");
      plan.push({ injectLine: target.pushLine, path: TAB_PATH[hit.label], label: hit.label });
      target.injected = true;
    }

    const opensDiv = /^<div$|^<div[\s>]/.test(t);
    const opensP = /^<p$|^<p[\s>]/.test(t);
    const closes = (t.match(/<\/(div|p)>/g) || []).length;

    if ((opensDiv || opensP) && closes === 0 && !/\/>\s*$/.test(t)) {
      stack.push({
        tag: t.startsWith("<div") ? "div" : "p",
        id: captureId(lines, i),
        pushLine: i,
      });
    } else if (!opensDiv && !opensP && closes > 0) {
      for (let c = 0; c < closes; c++) stack.pop();
    }
    // 行内自带开与关（<div ...></div> 或 <div ... />）：净零，跳过
  }

  if (plan.length !== 5) {
    return fail(file, "*", `只定位到 ${plan.length}/5 个 tab 点击目标`);
  }
  if (new Set(plan.map((p) => p.injectLine)).size !== 5) {
    return fail(file, "*", "点击目标行重叠");
  }

  // 行号倒序注入，避免行号漂移
  plan.sort((a, b) => b.injectLine - a.injectLine);
  for (const p of plan) {
    const indent = lines[p.injectLine].match(/^\s*/)[0];
    lines.splice(p.injectLine + 1, 0, `${indent}    onClick={() => navigate("${p.path}")}`);
  }

  const cssIdx = lines.findIndex((l) => l.startsWith('import "@/styles/'));
  lines.splice(cssIdx + 1, 0, 'import { useNavigate } from "react-router-dom";');
  const compIdx = lines.findIndex((l) => /^const Frame\w+ = \(\) => \{\s*$/.test(l));
  if (compIdx < 0) return fail(file, "*", "找不到组件定义行");
  lines.splice(compIdx + 1, 0, "    const navigate = useNavigate();");

  fs.writeFileSync(file, lines.join("\n"));
  console.log(`${file}: OK → ` + plan.map((p) => `${p.label}${p.path}`).join(" "));
}

for (const f of process.argv.slice(2)) wire(f);
