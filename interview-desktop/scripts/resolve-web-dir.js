// 前端 SPA 目录解析：CI 把 mianba-web 克隆到 ../frontend，本地开发则常与后端仓库
// 平级放置为 ../mianba-web。按顺序探测，也可用 MIANBA_WEB_DIR 显式指定。
// 三个候选都缺时给出可操作的错误提示（而非让后续 npm 构建报模糊的 ENOENT）。
const fs = require('fs');
const path = require('path');

function resolveWebDir(desktopRoot) {
  const candidates = [
    process.env.MIANBA_WEB_DIR,
    path.resolve(desktopRoot, '..', 'frontend'),      // CI：build-desktop.yml 克隆到此
    path.resolve(desktopRoot, '..', 'mianba-web'),    // 本地：与后端仓库平级放置
    path.resolve(desktopRoot, '..', '..', 'mianba-web'), // 本地：interview-desktop 位于后端仓库内时，后端仓库的平级
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  console.error(
    '找不到 mianba-web 前端仓库。请任选其一：\n' +
    '  1) 与本仓库平级克隆：git clone https://github.com/mianba-vip/mianba-web.git\n' +
    '  2) 设置环境变量 MIANBA_WEB_DIR 指向 mianba-web 目录\n' +
    `已探测：${candidates.join('、')}`
  );
  process.exit(1);
}

module.exports = { resolveWebDir };
