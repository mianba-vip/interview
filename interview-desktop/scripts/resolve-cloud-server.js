// 云桌面统一后端地址。旧机 23333 已改为仅回环监听，历史配置迁移到域名 HTTPS 入口。
const CLOUD_SERVER = 'https://mianba.vip';

function resolveCloudServer(value) {
  const raw = String(value ?? '').trim();
  if (!raw) throw new Error('缺少 MIANBA_SERVER（例如 https://mianba.vip）');
  const candidate = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  let url;
  try { url = new URL(candidate); } catch { throw new Error('MIANBA_SERVER 不是有效的服务器地址'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password
      || url.search || url.hash) {
    throw new Error('MIANBA_SERVER 必须是 HTTP(S) 后端地址，不能包含账号密码、查询参数或锚点');
  }
  if (url.hostname === '103.236.92.40' && url.port === '23333') {
    if (url.pathname !== '/') throw new Error('旧后端地址应只包含服务器和端口');
    return CLOUD_SERVER;
  }
  if (['mianba.vip', 'www.mianba.vip'].includes(url.hostname)) {
    if (url.pathname !== '/' || (url.port && url.port !== '80' && url.port !== '443')) {
      throw new Error('面霸云端地址请填写 https://mianba.vip，不要包含 /app、/api 或旧回源端口');
    }
    return CLOUD_SERVER;
  }
  return url.toString().replace(/\/+$/, '');
}

if (require.main === module) {
  try { console.log(resolveCloudServer(process.env.MIANBA_SERVER)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { resolveCloudServer };
