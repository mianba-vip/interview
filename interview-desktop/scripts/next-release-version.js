// 正式发布版本 = 源码基础版本与已有稳定 v 标签中的最大值，再递增 patch。
// 无第三方依赖，供 CI 安装 npm 依赖之前使用；只输出版本，不修改工作区。
const { execFileSync } = require('node:child_process');
const path = require('node:path');

function parseVersion(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    return null;
  }
  const parts = value.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}

function nextReleaseVersion(baseVersion, tags) {
  let highest = parseVersion(baseVersion);
  if (!highest) throw new Error(`正式发布要求稳定版本 x.y.z，当前为：${baseVersion}`);
  for (const tag of tags) {
    const candidate = tag.startsWith('v') ? parseVersion(tag.slice(1)) : null;
    if (candidate && compareVersions(candidate, highest) > 0) highest = candidate;
  }
  if (!Number.isSafeInteger(highest[2] + 1)) throw new Error('patch 版本号超出安全整数范围');
  return `${highest[0]}.${highest[1]}.${highest[2] + 1}`;
}

if (require.main === module) {
  try {
    const desktop = path.resolve(__dirname, '..');
    const { version } = require(path.join(desktop, 'package.json'));
    const tags = execFileSync('git', ['tag', '--list', 'v*'], { cwd: desktop, encoding: 'utf8' })
      .split(/\r?\n/).filter(Boolean);
    console.log(nextReleaseVersion(version, tags));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { nextReleaseVersion };
