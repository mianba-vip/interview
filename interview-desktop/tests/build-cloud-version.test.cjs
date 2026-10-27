const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mianba-build-version-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const desktop = path.join(root, 'desktop');
  const frontend = path.join(root, 'frontend');
  fs.mkdirSync(path.join(desktop, 'scripts'), { recursive: true });
  fs.mkdirSync(frontend);
  for (const script of ['build-cloud.js', 'resolve-web-dir.js']) {
    fs.copyFileSync(path.join(__dirname, '..', 'scripts', script), path.join(desktop, 'scripts', script));
  }
  const manifest = JSON.stringify({ name: 'desktop-fixture', version: '0.6.7' });
  const lockfile = JSON.stringify({ version: '0.6.7', packages: { '': { version: '0.6.7' } } });
  fs.writeFileSync(path.join(desktop, 'package.json'), manifest);
  fs.writeFileSync(path.join(desktop, 'package-lock.json'), lockfile);
  fs.writeFileSync(path.join(frontend, 'package.json'), JSON.stringify({
    name: 'frontend-fixture', scripts: { build: 'node build.cjs' },
  }));
  fs.writeFileSync(path.join(frontend, 'build.cjs'),
    "require('fs').mkdirSync('dist', { recursive: true }); require('fs').writeFileSync('dist/index.html', 'fixture SPA');");
  const env = { ...process.env, MIANBA_WEB_DIR: frontend };
  delete env.VERSION_NO_BUMP;
  delete env.MIANBA_SERVER;
  return { desktop, manifest, lockfile, env };
}

function assertVersionUnchanged(fixture) {
  assert.equal(fs.readFileSync(path.join(fixture.desktop, 'package.json'), 'utf8'), fixture.manifest);
  assert.equal(fs.readFileSync(path.join(fixture.desktop, 'package-lock.json'), 'utf8'), fixture.lockfile);
}

test('成功的云构建沿用准备阶段版本，不再次递增', (t) => {
  const fixture = createFixture(t);
  const result = spawnSync(process.execPath, [path.join(fixture.desktop, 'scripts', 'build-cloud.js')], {
    env: { ...fixture.env, MIANBA_SERVER: 'https://api.example.com' }, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assertVersionUnchanged(fixture);
  assert.equal(fs.readFileSync(path.join(fixture.desktop, 'app-dist', 'index.html'), 'utf8'), 'fixture SPA');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture.desktop, 'app-dist', 'desktop-config.json'))), {
    serverUrl: 'https://api.example.com',
  });
});

test('缺少服务器地址的失败构建也不会消耗版本号', (t) => {
  const fixture = createFixture(t);
  const result = spawnSync(process.execPath, [path.join(fixture.desktop, 'scripts', 'build-cloud.js')], {
    env: fixture.env, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /缺少 MIANBA_SERVER/);
  assertVersionUnchanged(fixture);
});
