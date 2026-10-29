const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { createCredentialStore, createSessionStore, trustedCredentialSender, resolveUserDataDirectory } = require('../src/login-credentials');

function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mianba-login-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const key = crypto.randomBytes(32);
  // 单元测试使用独立随机 AES 密钥模拟系统 API，不触及真实用户凭据。
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString(value) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]);
    },
    decryptString(buffer) {
      const cipher = crypto.createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12));
      cipher.setAuthTag(buffer.subarray(12, 28));
      return Buffer.concat([cipher.update(buffer.subarray(28)), cipher.final()]).toString('utf8');
    },
  };
  const config = { directory, scope: 'local:http://127.0.0.1:23333', safeStorage, ...options };
  return { directory, config, store: createCredentialStore(config) };
}
const account = { email: 'fixture@example.test', password: 'Fixture-secret-123' };

test('凭据以密文落盘，重新创建存储实例后可填充，清除只影响当前后端', t => {
  const { config, directory, store } = fixture(t);
  assert.equal(store.read().credentials, null);
  store.save(account);
  const raw = fs.readFileSync(path.join(directory, fs.readdirSync(directory)[0]), 'utf8');
  assert.ok(!raw.includes(account.email) && !raw.includes(account.password));
  assert.deepEqual(createCredentialStore(config).read().credentials, account);
  const cloud = createCredentialStore({ ...config, scope: 'cloud:https://example.test' });
  assert.equal(cloud.read().credentials, null);
  cloud.save({ ...account, password: 'Cloud-secret-456' });
  store.clear();
  assert.equal(store.read().credentials, null);
  assert.equal(cloud.read().credentials.password, 'Cloud-secret-456');
});

test('系统加密不可用或 Linux basic_text 时拒绝保存，绝不回退明文', t => {
  const { config, directory } = fixture(t);
  for (const safeStorage of [
    { ...config.safeStorage, isEncryptionAvailable: () => false },
    { ...config.safeStorage, getSelectedStorageBackend: () => 'basic_text' },
  ]) {
    const store = createCredentialStore({ ...config, safeStorage, platform: 'linux' });
    assert.equal(store.read().available, false);
    assert.throws(() => store.save(account), /不会明文/);
  }
  assert.deepEqual(fs.readdirSync(directory), []);
});

test('改密只更新已记住的同一账号；损坏凭据不泄露、可清除', t => {
  const { directory, store } = fixture(t);
  store.save(account);
  store.updatePassword('different@example.test', 'Other-secret-123');
  assert.equal(store.read().credentials.password, account.password);
  store.updatePassword(account.email, 'New-secret-123');
  assert.equal(store.read().credentials.password, 'New-secret-123');
  fs.writeFileSync(path.join(directory, fs.readdirSync(directory)[0]), '{}');
  assert.equal(store.read().credentials, null);
  assert.match(store.read().message, /无法解密/);
  store.clear();
  assert.equal(store.read().message, undefined);
});

test('只允许可信主窗口的顶层本地 SPA 访问凭据，拒绝外站与子 frame', () => {
  const appPath = path.resolve('fixture-app');
  const frame = { url: pathToFileURL(path.join(appPath, 'app-dist', 'index.html')).href + '#/login' };
  const contents = { mainFrame: frame };
  const win = { webContents: contents, isDestroyed: () => false };
  const event = { sender: contents, senderFrame: frame };
  assert.equal(trustedCredentialSender(event, win, appPath, true), true);
  assert.equal(trustedCredentialSender({ ...event, senderFrame: { ...frame } }, win, appPath, true), false);
  frame.url = 'https://example.test/#/login';
  assert.equal(trustedCredentialSender(event, win, appPath, false), false);
  frame.url = 'http://localhost:5173/#/login';
  assert.equal(trustedCredentialSender(event, win, appPath, false), true);
  assert.equal(trustedCredentialSender(event, win, appPath, true), false);
});

test('旧 IP 的记住密码迁移到 HTTPS；清除后不会从旧文件恢复', t => {
  const { config, directory } = fixture(t);
  const oldScope = 'cloud:http://103.236.92.40:23333';
  const filename = 'login-' + crypto.createHash('sha256').update(oldScope).digest('hex') + '.json';
  const ciphertext = config.safeStorage.encryptString(JSON.stringify({ scope: oldScope, ...account })).toString('base64');
  fs.writeFileSync(path.join(directory, filename), JSON.stringify({ version: 1, ciphertext }));
  const store = createCredentialStore({ ...config, scope: 'cloud:https://mianba.vip' });
  assert.deepEqual(store.read().credentials, account);
  assert.equal(fs.readdirSync(directory).length, 2);
  store.clear();
  assert.equal(store.read().credentials, null);
  assert.deepEqual(fs.readdirSync(directory), []);
});

test('升级后登录态可从密文恢复；注销保留 API Key 和记住的密码', t => {
  const { config, store, directory } = fixture(t);
  const session = { token: 'fixture-token-for-upgrade', userId: '42' };
  store.save(account);
  fs.writeFileSync(path.join(directory, 'llm-key.json'), 'fixture-key');
  createSessionStore(config).save(session);
  assert.deepEqual(createSessionStore(config).read().session, session);
  const raw = fs.readdirSync(directory).filter(name => name.startsWith('session-'))
    .map(name => fs.readFileSync(path.join(directory, name), 'utf8')).join('');
  assert(!raw.includes(session.token));
  assert.equal(createSessionStore({ ...config, scope: 'cloud:https://other.example' }).read().session, null);
  const unavailable = createSessionStore({ ...config,
    safeStorage: { ...config.safeStorage, isEncryptionAvailable: () => false } });
  assert.equal(unavailable.read().available, false);
  assert.deepEqual(createSessionStore(config).read().session, session);
  createSessionStore(config).clear();
  assert.deepEqual(store.read().credentials, account);
  assert.equal(fs.readFileSync(path.join(directory, 'llm-key.json'), 'utf8'), 'fixture-key');
});

test('固定用户数据目录并保留完整旧目录，不复制或覆盖系统加密状态', t => {
  const { directory } = fixture(t);
  const legacy = path.join(directory, 'mianba');
  fs.mkdirSync(legacy);
  fs.writeFileSync(path.join(legacy, 'llm-key.json'), 'fixture');
  fs.writeFileSync(path.join(legacy, 'Local State'), 'fixture-encryption-state');
  assert.equal(resolveUserDataDirectory(directory, legacy), legacy);
  assert.equal(fs.readFileSync(path.join(legacy, 'Local State'), 'utf8'), 'fixture-encryption-state');
  const canonical = path.join(directory, 'interview-desktop');
  fs.mkdirSync(canonical);
  fs.writeFileSync(path.join(canonical, 'llm-key.json'), 'canonical-fixture');
  assert.equal(resolveUserDataDirectory(directory, legacy), canonical);
});

test('自动更新提示可跳官网或本次关闭，重复检查不反复弹窗；重启后 API Key 仍存在', async t => {
  const vm = require('node:vm');
  const { EventEmitter } = require('node:events');
  const { config, directory } = fixture(t);
  function runtime(response) {
    const handlers = new Map();
    const dialogs = [];
    const opened = [];
    const paths = { appData: directory, userData: path.join(directory, 'interview-desktop') };
    const updater = new EventEmitter();
    updater.checkForUpdates = async () => { updater.emit('update-available', { version: '1.2.3' }); };
    const electron = {
      app: { isPackaged: true, getPath: key => paths[key], setPath: (key, value) => paths[key] = value,
        setAppUserModelId() {}, commandLine: { appendSwitch() {} }, requestSingleInstanceLock: () => true,
        on() {}, whenReady: () => ({ then() {} }), getVersion: () => '1.2.2' },
      Menu: { buildFromTemplate: value => value, setApplicationMenu() {} },
      ipcMain: { handle: (name, handler) => handlers.set(name, handler) }, safeStorage: config.safeStorage,
      dialog: { showMessageBox: async options => { dialogs.push(options); return { response }; } },
      shell: { openExternal: async value => opened.push(value) },
    };
    const context = vm.createContext({
      require: name => name === 'electron' ? electron : name === 'electron-updater' ? { autoUpdater: updater }
        : name === './login-credentials' ? require('../src/login-credentials') : require(name),
      __dirname: path.resolve(__dirname, '../src'), Buffer, URL, console,
      process: { platform: 'win32', on() {} }, setTimeout() {}, clearTimeout() {},
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8'), context);
    vm.runInContext('setupAutoUpdate()', context);
    return { handlers, dialogs, opened };
  }
  const dismissed = runtime(1);
  await dismissed.handlers.get('app:checkForUpdates')({}, { prompt: true });
  await dismissed.handlers.get('app:checkForUpdates')({}, { prompt: true });
  assert.equal(dismissed.dialogs.length, 1);
  assert.deepEqual(Array.from(dismissed.dialogs[0].buttons), ['立即去更新', '这次暂不更新']);
  assert.equal(dismissed.dialogs[0].cancelId, 1);
  assert.equal(dismissed.opened.length, 0);
  dismissed.handlers.get('llm:setKey')({}, 'fixture-api-key');
  const upgraded = runtime(0);
  assert.equal(upgraded.handlers.get('llm:getKey')(), 'fixture-api-key');
  await upgraded.handlers.get('app:checkForUpdates')({}, { prompt: true });
  assert.deepEqual(upgraded.opened, ['https://mianba.vip/#download']);
});
