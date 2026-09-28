// 给 5 个 Tab 页的底部 TabBar 包装层注入 position:sticky 吸底。
// 根帧高度放开后（见 app-extra.css），整页可滚动；TabBar 需要始终贴在视口底部。
// 定位：第一个 tab 标签 {"首页"} → 所在 tab 项 div → 向上第一个 stroke-wrapper- 祖先
//      （Pixso 的「描边+阴影+内容」三明治包装，正好包住整条 TabBar 的背景与内容）。
// 要求：该包装层行号之后 200 行内出现全部 5 个标签（防错锚到别的卡片）。
const fs = require("node:fs");

const LABELS = ["首页", "练习", "面试", "沉淀", "我的"];

function fail(file, msg) {
  console.error(`${file}: ${msg}`);
  process.exitCode = 1;
}

function wire(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const n = lines.length;

  const labelLines = [];
  // 只认文件后 45% 区域（与 wire-tabs 一致）：页面标题「练习/沉淀/我的」在顶部会撞标签名
  for (let i = Math.floor(n * 0.55); i < n; i++) {
    const m = lines[i].match(/^\s*\{"(首页|练习|面试|沉淀|我的)"\}\s*$/);
    if (m) labelLines.push({ line: i, label: m[1] });
  }
  if (labelLines.length !== 5) return fail(file, `标签数 ${labelLines.length}≠5`);
  const first = labelLines[0];

  // 自顶向下建栈，到第一个标签处取祖先链（<p 与 <div 同样记账，否则 </p> 会多弹栈）
  const stack = [];
  for (let i = 0; i <= first.line; i++) {
    const t = lines[i].trim();
    const opensDiv = /^<div$|^<div[\s>]/.test(t);
    const opensP = /^<p$|^<p[\s>]/.test(t);
    const opens = opensDiv || opensP;
    const closes = (t.match(/<\/(div|p)>/g) || []).length;
    if (opens && closes === 0 && !/\/>\s*$/.test(t)) {
      let cls = null;
      for (let k = i; k <= Math.min(i + 5, n - 1); k++) {
        const cm = lines[k].match(/className="([^"]+)"/);
        if (cm) {
          cls = cm[1];
          break;
        }
        // 属性行里出现的 "=>" 不是标签闭合，只有行首 ">" 才结束属性区
        if (/^>/.test(lines[k].trim())) break;
      }
      stack.push({ pushLine: i, cls });
    } else if (!opens && closes > 0) {
      for (let c = 0; c < closes; c++) stack.pop();
    }
  }

  // 从栈顶向下找第一个 stroke-wrapper- 包装；吸底必须落在它的「根帧直系子级」上
  // （sticky 受父级盒子约束，父级只有 TabBar 那一小块时钉不起来；fixed 在 2 层之上）
  let swIdx = -1;
  for (let s = stack.length - 1; s >= 0; s--) {
    const el = stack[s];
    if (el.cls && el.cls.split(/\s+/).some((c) => c.startsWith("stroke-wrapper-"))) {
      swIdx = s;
      break;
    }
  }
  if (swIdx < 0) return fail(file, "找不到 TabBar 的 stroke-wrapper 祖先");
  const wrapIdx = swIdx - 1; // frame-content-XXXX 行包装层
  const rootIdx = swIdx - 2; // 2_546 级：根帧的直系子级
  if (
    wrapIdx < 0 ||
    rootIdx < 1 ||
    !stack[wrapIdx].cls ||
    !stack[wrapIdx].cls.startsWith("frame-content-")
  ) {
    return fail(file, "TabBar 祖先链形状不符（期望 stroke-wrapper 上方是 frame-content-*）");
  }
  const target = stack[rootIdx];

  // 锚点校验：5 个标签都落在包装层之后 200 行内
  const end = target.pushLine + 200;
  if (!labelLines.every((l) => l.line > target.pushLine && l.line < end)) {
    return fail(file, "标签不在包装层邻域内，锚点可疑");
  }
  if (lines[target.pushLine].includes("position:")) return fail(file, "已注入过");

  const indent = lines[target.pushLine].match(/^\s*/)[0];
  lines.splice(
    target.pushLine + 1,
    0,
    `${indent}    style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}`,
  );
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`${file}: OK (行 ${target.pushLine + 1} 注入 fixed 吸底)`);
}

for (const f of process.argv.slice(2)) wire(f);
