const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveCloudServer } = require('../scripts/resolve-cloud-server');

test('旧 IP 配置迁移到域名 HTTPS，无论是否包含协议', () => {
  for (const input of ['http://103.236.92.40:23333', '103.236.92.40:23333/']) {
    assert.equal(resolveCloudServer(input), 'https://mianba.vip');
  }
});

test('面霸域名规范为同一个 HTTPS 入口', () => {
  for (const input of ['mianba.vip', 'http://mianba.vip/', 'https://mianba.vip/', 'https://www.mianba.vip']) {
    assert.equal(resolveCloudServer(input), 'https://mianba.vip');
  }
});

test('拒绝把网页入口和旧回源端口当作后端', () => {
  for (const input of ['https://mianba.vip/app/', 'https://mianba.vip/api', 'http://mianba.vip:18080']) {
    assert.throws(() => resolveCloudServer(input), /不要包含/);
  }
});

test('保留自定义后端地址，且不允许把凭据写入安装包配置', () => {
  assert.equal(resolveCloudServer('https://custom.example/backend/'), 'https://custom.example/backend');
  assert.throws(() => resolveCloudServer('https://user:password@custom.example'), /账号密码/);
  assert.throws(() => resolveCloudServer(''), /缺少/);
});
