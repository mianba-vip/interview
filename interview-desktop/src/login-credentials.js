// 本机登录信息只使用系统密钥加密保存；不会降级成明文。
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { pathToFileURL } = require('url');

function trustedCredentialSender(event, win, appPath, packaged) {
  if (!win || win.isDestroyed() || event.sender !== win.webContents
      || event.senderFrame !== win.webContents.mainFrame) return false;
  try {
    const url = new URL(event.senderFrame.url);
    url.hash = '';
    if (url.href === pathToFileURL(path.join(appPath, 'app-dist', 'index.html')).href) return true;
    return !packaged && url.origin === 'http://localhost:5173' && url.pathname === '/' && !url.search;
  } catch { return false; }
}

// 固定新安装的数据目录，同时继续使用已有的完整旧目录，不搬动系统加密密钥。
function resolveUserDataDirectory(appData, currentDirectory) {
  const canonical = path.join(appData, 'interview-desktop');
  const candidates = [...new Set([canonical, currentDirectory, path.join(appData, 'mianba')])];
  return candidates.find(directory => {
    try {
      return fs.readdirSync(directory).some(name =>
        name === 'llm-key.json' || name === 'Local Storage' || /^(login|session)-.*\.json$/.test(name));
    } catch { return false; }
  }) || canonical;
}

const CLOUD_SCOPES = [
  'cloud:https://mianba.vip',
  'cloud:http://103.236.92.40:23333',
  'cloud:https://103.236.92.40:23333',
  'cloud:http://mianba.vip',
  'cloud:https://www.mianba.vip',
  'cloud:http://www.mianba.vip',
];

function encryptedStore({ directory, scope, safeStorage, platform = process.platform }, prefix, valid, project) {
  if (typeof scope !== 'string' || !scope) throw new Error('当前桌面端缺少后端地址，无法隔离保存登录信息');
  const scopes = CLOUD_SCOPES.includes(scope) ? CLOUD_SCOPES : [scope];
  const canonicalScope = scopes[0];
  const fileFor = value => path.join(directory, prefix + '-' + createHash('sha256').update(value).digest('hex') + '.json');
  const file = fileFor(canonicalScope);
  const available = () => safeStorage.isEncryptionAvailable()
    && !(platform === 'linux' && safeStorage.getSelectedStorageBackend?.() === 'basic_text');
  const clear = () => {
    for (const value of scopes) {
      for (const target of [fileFor(value), fileFor(value) + '.tmp']) {
        try { fs.unlinkSync(target); }
        catch (error) { if (error.code !== 'ENOENT') throw new Error('无法清除本机保存的登录信息，请检查文件权限'); }
      }
    }
  };
  const save = data => {
    if (!available()) throw new Error('系统加密服务不可用，不会明文保存登录信息');
    if (!valid(data)) throw new Error('登录信息格式不正确');
    try {
      const ciphertext = safeStorage.encryptString(JSON.stringify({ scope: canonicalScope, ...project(data) })).toString('base64');
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(file + '.tmp', JSON.stringify({ version: 1, ciphertext }), { mode: 0o600 });
      fs.renameSync(file + '.tmp', file);
    } catch {
      throw new Error('本机登录信息保存失败，请检查磁盘及目录权限');
    }
  };
  const read = () => {
    if (!available()) return { available: false, data: null, message: '系统加密服务不可用，已保存的信息会继续保留' };
    let invalid = false;
    for (const value of scopes) {
      try {
        const source = fileFor(value);
        if (fs.statSync(source).size > 65536) throw new Error('invalid size');
        const saved = JSON.parse(fs.readFileSync(source, 'utf8'));
        if (saved.version !== 1 || typeof saved.ciphertext !== 'string') throw new Error('invalid format');
        const data = JSON.parse(safeStorage.decryptString(Buffer.from(saved.ciphertext, 'base64')));
        if (data.scope !== value || !valid(data)) throw new Error('invalid credentials');
        // 旧 IP 升级为官网 HTTPS 时迁移到统一范围；迁移失败也保留旧文件。
        if (value !== canonicalScope) {
          try { save(data); } catch { /* 仍可使用解密后的旧数据，下次启动重试迁移。 */ }
        }
        return { available: true, data: project(data) };
      } catch (error) { if (error.code !== 'ENOENT') invalid = true; }
    }
    return { available: true, data: null,
      ...(invalid ? { message: '保存的登录信息暂时无法解密，请重新输入后保存或清除' } : {}) };
  };
  return { read, save, clear };
}

function createCredentialStore(config) {
  const store = encryptedStore(config, 'login', data =>
    data && typeof data.email === 'string' && data.email.length <= 254
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
      && typeof data.password === 'string' && data.password.length >= 6 && data.password.length <= 64,
  data => ({ email: data.email.trim(), password: data.password }));
  const read = () => {
    const { data, ...result } = store.read();
    return { ...result, credentials: data };
  };
  const updatePassword = (email, password) => {
    const saved = read().credentials;
    if (!saved || typeof email !== 'string' || saved.email.toLowerCase() !== email.trim().toLowerCase()) return;
    try { store.save({ email: saved.email, password }); }
    catch (error) { store.clear(); throw error; }
  };
  return { read, save: store.save, clear: store.clear, updatePassword };
}

// 登录态与“记住密码”分开保存；注销只清登录态，不清 AI Key 和记住的密码。
function createSessionStore(config) {
  const store = encryptedStore(config, 'session', data =>
    data && typeof data.token === 'string' && data.token.length > 0 && data.token.length <= 8192
      && typeof data.userId === 'string' && data.userId.length > 0 && data.userId.length <= 254,
  data => ({ token: data.token, userId: data.userId }));
  return { read() { const { data, ...result } = store.read(); return { ...result, session: data }; },
    save: store.save, clear: store.clear };
}

module.exports = { createCredentialStore, createSessionStore, trustedCredentialSender, resolveUserDataDirectory };
