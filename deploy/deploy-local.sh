#!/usr/bin/env bash
# ============================================================================
# 后端部署到 103.236.92.40；官网与 SPA 由 mianba-web 发布到 106.14.143.151。
#
# 背景：服务器机房（陕西电信云基地/XIAOTEYUN）限制境外入站，GitHub Actions
#       直连部署不可用；本机（国内 IP）SSH 可达，故用本脚本完成部署。
#
# 用法（在仓库根目录任意位置执行）：
#   bash deploy/deploy-local.sh
#
# 可配置环境变量（均有默认值）：
#   SSH_HOST   服务器 IP                默认 103.236.92.40
#   SSH_PORT   服务器 SSH 端口（机房 NAT→22） 默认 37777
#   SSH_USER   SSH 用户名               默认 root
#   SSH_KEY    SSH 私钥路径             默认 ~/.ssh/id_ed25519
#   DEPLOY_DIR 服务器部署目录           默认 /opt/mianba
#   ENABLE_OBSERVABILITY 首次启用监控时设 true；之后由服务器标记自动沿用
#
# 流程：预检 SSH → gradle 构建 jar →
#       scp/tar 上传产物 → 服务器跑 deploy-prod.sh（先备份 PG，
#       再 docker 缓存构建 + 重启 + 健康检查）→ 本地复核后端健康。
# ============================================================================
set -Eeuo pipefail
trap 'rc=$?; echo "❌ 部署中断：deploy-local.sh 第 ${LINENO} 行，退出码 ${rc}" >&2' ERR

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SSH_HOST="${SSH_HOST:-103.236.92.40}"
SSH_PORT="${SSH_PORT:-37777}"
SSH_USER="${SSH_USER:-root}"
# SSH 私钥：优先环境变量 SSH_KEY；否则自动探测（兼容 Git Bash / WSL；WSL 里 Windows 路径要走 /mnt/c）
if [ -z "${SSH_KEY:-}" ]; then
  for _k in "$HOME/.ssh/id_ed25519" "$HOME/.ssh/id_rsa" "/mnt/c/Users/31136/.ssh/id_rsa"; do
    if [ -f "$_k" ]; then SSH_KEY="$_k"; break; fi
  done
fi
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/mianba}"
ENABLE_OBSERVABILITY="${ENABLE_OBSERVABILITY:-auto}"
[[ "$ENABLE_OBSERVABILITY" =~ ^(auto|true|false)$ ]] || {
  echo "❌ ENABLE_OBSERVABILITY 只能是 auto、true 或 false" >&2
  exit 1
}
JAR="app/build/libs/app-0.0.1-SNAPSHOT.jar"

step() { echo; echo "==> $1"; }

# Git Bash 下混用其它发行版的 rsync.exe 与 ssh.exe 会触发
# "dup() in/out/err failed"。统一使用 Git 自带的 ssh/scp，并用 tar
# 传输目录，避免 Windows 上的 rsync 运行时兼容问题。
# ssh/scp 解析：个别 Git Bash 自带的 ssh/scp 是坏的（缺 DLL / 传输层失效），
# 成对优先用 Windows 自带 OpenSSH；WSL/Linux 下该路径不存在，走系统自带 ssh/scp。
resolve_pair() {
  local d="${WINDIR:-/c/Windows}/System32/OpenSSH"
  [ -x "$d/ssh.exe" ] && [ -x "$d/scp.exe" ] || d="/c/Windows/System32/OpenSSH"
  if [ -x "$d/ssh.exe" ] && [ -x "$d/scp.exe" ] && "$d/ssh.exe" -V 2>&1 | grep -qi ssh; then
    SSH_BIN="$d/ssh.exe"; SCP_BIN="$d/scp.exe"; return 0
  fi
  SSH_BIN="$(command -v ssh 2>/dev/null || true)"
  SCP_BIN="$(command -v scp 2>/dev/null || true)"
  if [ -n "$SSH_BIN" ] && [ -n "$SCP_BIN" ] && "$SSH_BIN" -V 2>&1 | grep -qi ssh; then
    return 0
  fi
  echo "❌ 缺少可用的 ssh/scp（Git Bash 自带的损坏且未找到 Windows OpenSSH）" >&2; exit 1
}
resolve_pair

SSH=("$SSH_BIN" -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=no
  -o ConnectTimeout=20 -o ServerAliveInterval=30 -o ServerAliveCountMax=6 -p "$SSH_PORT")
SCP=("$SCP_BIN" -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=no
  -o ConnectTimeout=20 -o ServerAliveInterval=30 -o ServerAliveCountMax=6 -P "$SSH_PORT")
REMOTE="$SSH_USER@$SSH_HOST"

# SSHD 在受到公网扫描时可能触发 MaxStartups，短时随机拒绝新连接。
# 只重试第 0/3 步可安全重复的操作；真正的生产部署不盲目重复执行。
retry() {
  local label="$1"; shift
  local attempt code
  for ((attempt=1; attempt<=8; attempt++)); do
    if "$@"; then return 0; else code=$?; fi
    if ((attempt == 8)); then
      echo "❌ $label 失败（8 次尝试，最后退出码 ${code}）" >&2
      return "$code"
    fi
    echo "   ⚠ $label 暂时失败（退出码 ${code}），${attempt}/8，稍后重试" >&2
    sleep "$((attempt * 5))"
  done
}

remote_sha() {
  local path="$1"
  "${SSH[@]}" "$REMOTE" \
    "if [ -f '$path' ]; then sha256sum '$path' | cut -d ' ' -f1; else echo MISSING; fi"
}

# ---------- 0/5 预检 ----------
[ -f "$SSH_KEY" ] || { echo "❌ SSH 私钥不存在：$SSH_KEY"; exit 1; }
[[ "$DEPLOY_DIR" =~ ^/[A-Za-z0-9._/-]+$ && "$DEPLOY_DIR" != "/" \
   && ! "$DEPLOY_DIR" =~ (^|/)\.\.(/|$) ]] || {
  echo "❌ DEPLOY_DIR 必须是安全的绝对路径且不能为根目录：$DEPLOY_DIR"
  exit 1
}
command -v tar >/dev/null || { echo "❌ 缺少 tar"; exit 1; }

step "0/5 预检服务器 SSH 连通性（${SSH_USER}@${SSH_HOST}:${SSH_PORT}）"
if ! retry "SSH 预检" "${SSH[@]}" "$REMOTE" 'command -v tar >/dev/null'; then
  echo "❌ 无法 SSH 到服务器（检查网络/密钥/端口）"
  exit 1
fi
echo "   ✓ SSH 连通"

# ---------- 1/5 构建后端 ----------
step "1/5 构建后端 jar（gradle）"
bash "$ROOT/deploy/build-backend.sh"
[ -f "$JAR" ] || { echo "❌ jar 构建失败：$JAR 不存在"; exit 1; }
echo "   ✓ jar: $(ls -la "$JAR" | awk '{print $5}') bytes"

# ---------- 2/5 前端独立部署 ----------
step "2/5 前端已迁移到 106.14.143.151（本脚本只发布后端）"

# ---------- 3/5 上传产物 ----------
step "3/5 上传产物到服务器"
retry "创建服务器部署目录" "${SSH[@]}" "$REMOTE" \
  "mkdir -p '$DEPLOY_DIR/backend'"

command -v sha256sum >/dev/null || { echo "❌ 缺少 sha256sum，无法校验上传产物"; exit 1; }
JAR_SHA="$(sha256sum "$JAR" | cut -d ' ' -f1)"
JAR_STAGE="$DEPLOY_DIR/backend/app.jar.uploading"
JAR_TARGET="$DEPLOY_DIR/backend/app.jar"
JAR_PREVIOUS="$DEPLOY_DIR/backend/app.jar.previous"

# 上次可能已传完整文件，但 scp/SSH 的最终回执丢失；先校验，避免再传 184 MB。
# 另：若服务器正式 jar 已是本次构建产物（如仅改 sidecar/脚本后重跑），整段跳过。
TARGET_SHA="$(retry "检查服务器正式 jar" remote_sha "$JAR_TARGET")"
STAGED_SHA="$(retry "检查服务器暂存 jar" remote_sha "$JAR_STAGE")"
if [ "$TARGET_SHA" = "$JAR_SHA" ]; then
  echo "   ✓ 服务器 jar 已是本次构建产物，跳过上传"
elif [ "$STAGED_SHA" = "$JAR_SHA" ]; then
  echo "   ✓ 暂存 jar 已完整，跳过重复上传"
else
  UPLOAD_VERIFIED=false
  for ((attempt=1; attempt<=3; attempt++)); do
    if "${SCP[@]}" "$JAR" "$REMOTE:$JAR_STAGE"; then
      echo "   ✓ scp 传输返回成功"
    else
      echo "   ⚠ scp 未正常返回，检查服务器上的文件校验值（第 $attempt/3 次）" >&2
    fi
    STAGED_SHA="$(retry "校验服务器暂存 jar" remote_sha "$JAR_STAGE")"
    if [ "$STAGED_SHA" = "$JAR_SHA" ]; then UPLOAD_VERIFIED=true; break; fi
    echo "   ⚠ 暂存 jar 校验不一致，准备重新上传（第 $attempt/3 次）" >&2
  done
  [ "$UPLOAD_VERIFIED" = true ] || { echo "❌ jar 上传三次后仍不完整" >&2; exit 1; }
fi

# 先复制旧版本留回退，再原子切换。若切换成功但 SSH 回执丢失，重试只验正式文件。
retry "切换后端 jar" "${SSH[@]}" "$REMOTE" \
  "set -e; if [ -f '$JAR_STAGE' ]; then \
     if [ -f '$JAR_TARGET' ]; then cp -f '$JAR_TARGET' '$JAR_PREVIOUS'; fi; \
     mv -f '$JAR_STAGE' '$JAR_TARGET'; \
   fi; printf '%s  %s\n' '$JAR_SHA' '$JAR_TARGET' | sha256sum -c - >/dev/null"
echo "   ✓ backend/app.jar"
"${SCP[@]}" deploy/deploy-prod.sh "$REMOTE:$DEPLOY_DIR/deploy-prod.sh.uploading"
"${SSH[@]}" "$REMOTE" \
  "mv -f '$DEPLOY_DIR/deploy-prod.sh.uploading' '$DEPLOY_DIR/deploy-prod.sh'"
echo "   ✓ deploy-prod.sh"

# kg-forge 增量覆盖文件：不动服务器 legacy compose，以第二 -f 文件合并进部署
"${SCP[@]}" deploy/docker-compose.kgforge.yml "$REMOTE:$DEPLOY_DIR/docker-compose.kgforge.yml"
echo "   ✓ docker-compose.kgforge.yml（覆盖文件）"

# kg-forge 源码树：服务器 compose 以 ./kg-forge 为构建上下文，随部署同步
# （只传源码与 Dockerfile，排除缓存/虚拟环境；重复部署是幂等覆盖）
if [ -d kg-forge ]; then
  tar --exclude=.git --exclude=__pycache__ --exclude='*.egg-info' \
      --exclude=.venv --exclude=.pytest_cache -C kg-forge -czf - . | \
    "${SSH[@]}" "$REMOTE" "mkdir -p '$DEPLOY_DIR/kg-forge' && tar -xzf - -C '$DEPLOY_DIR/kg-forge'"
  echo "   ✓ kg-forge/（sidecar 源码）"
else
  echo "   ⚠ 仓库根目录未找到 kg-forge/，跳过 sidecar 源码同步" >&2
fi

# ---------- 4/5 服务器执行部署 ----------
step "4/5 服务器执行部署（PG 备份 → docker 构建/重启 → 健康检查，约 1~3 分钟）"
"$SSH_BIN" -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=15 \
    -o ServerAliveInterval=30 -p "$SSH_PORT" "$REMOTE" \
  "export DEPLOY_DIR='$DEPLOY_DIR' COMPOSE_FILE='$DEPLOY_DIR/docker-compose.yml:$DEPLOY_DIR/docker-compose.kgforge.yml' ENABLE_OBSERVABILITY='$ENABLE_OBSERVABILITY'; \
   chmod +x '$DEPLOY_DIR/deploy-prod.sh'; bash '$DEPLOY_DIR/deploy-prod.sh'"

# ---------- 5/5 健康检查 ----------
# backend 已默认只绑服务器回环（BACKEND_BIND_ADDRESS=127.0.0.1），
# 本机无法直连 23333，改经 SSH 在服务器本机复核。
step "5/5 复核后端健康（服务器本机 127.0.0.1:23333/healthz，经 SSH）"
sleep 3
HEALTH="$("${SSH[@]}" "$REMOTE" "curl -s --max-time 20 http://127.0.0.1:23333/healthz" 2>/dev/null || true)"
if echo "$HEALTH" | grep -q '"status":"UP"'; then
  echo "✅ 部署成功，服务器后端健康：$HEALTH"
else
  echo "⚠️ 健康检查未通过：$HEALTH"
  exit 1
fi
