const assert = require('node:assert/strict');
const test = require('node:test');
const { nextReleaseVersion } = require('../scripts/next-release-version');

test('首次发布从源码基础版本递增 patch', () => {
  assert.equal(nextReleaseVersion('0.6.6', []), '0.6.7');
});

test('连续发布使用最新标签，即使 main 的基础版本未变', () => {
  const tags = ['v0.6.6'];
  const first = nextReleaseVersion('0.6.6', tags);
  tags.push(`v${first}`);
  const second = nextReleaseVersion('0.6.6', tags);
  assert.equal(first, '0.6.7');
  assert.equal(second, '0.6.8');
});

test('按数字比较版本，不受标签排序或位数影响', () => {
  assert.equal(nextReleaseVersion('0.6.6', ['v0.6.9', 'v0.6.100', 'v0.6.11']), '0.6.101');
});

test('源码可提升主次版本，旧源码也不会产生低于已发布版本的版本号', () => {
  assert.equal(nextReleaseVersion('0.7.0', ['v0.6.99']), '0.7.1');
  assert.equal(nextReleaseVersion('0.6.6', ['v1.0.0']), '1.0.1');
});

test('忽略预发布标签和无关标签', () => {
  assert.equal(nextReleaseVersion('0.6.6', ['v9.0.0-beta.1', 'mobile-v2.0.0', 'v01.0.0', 'desktop']), '0.6.7');
});

test('拒绝无效基础版本，避免发布 NaN 或非法版本', () => {
  for (const value of ['0.6', '0.6.6-beta.1', 'v0.6.6', '01.6.6', '', null]) {
    assert.throws(() => nextReleaseVersion(value, []), /稳定版本/);
  }
  assert.throws(() => nextReleaseVersion('0.6.9007199254740991', []), /安全整数/);
});
