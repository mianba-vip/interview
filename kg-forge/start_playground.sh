#!/usr/bin/env bash
# kg-forge 测试台一键启动(免 Postgres 模式)
# 用法: cd interview/kg-forge && ./start_playground.sh
# 配置持久化在 kg-forge/.env(已被 .gitignore 忽略):首次启动问一次,
# 之后直接沿用,不再询问。要改配置:编辑或删除 .env。
set -euo pipefail
cd "$(dirname "$0")"

# 1) 激活 venv(没有就用 uv 或 python3.12 现建一个并装依赖)
if [[ ! -d .venv ]]; then
  echo "[准备] 没找到 .venv,正在创建…"
  if command -v uv >/dev/null 2>&1; then
    uv venv --python 3.12 .venv && source .venv/bin/activate && uv pip install -e .
  else
    python3.12 -m venv .venv && source .venv/bin/activate && pip install -e .
  fi
else
  source .venv/bin/activate
fi

# 2) 已有 .env → 直接沿用,不再询问
if [[ -f .env ]]; then
  set -a; source .env; set +a
  echo "[配置] 沿用 kg-forge/.env(要改:编辑该文件,或删掉它让脚本重问)"
fi

# 3) 首次使用才询问:只问一次 API key(secret 默认 test-secret,本地测试够用)
if [[ ! -f .env ]]; then
  FORGE_API_KEY=""
  read -rp "首次使用:输入 LLM API key(sk-…,直接回车=跳过,稍后在页面 BYOK 里填): " FORGE_API_KEY
  FORGE_SECRET="${FORGE_SECRET:-test-secret}"
  cat > .env <<EOF
FORGE_CHECKPOINT=memory
FORGE_SECRET=${FORGE_SECRET}
FORGE_API_KEY=${FORGE_API_KEY}
EOF
  echo "[配置] 已保存到 kg-forge/.env,下次启动不再询问"
fi

export FORGE_CHECKPOINT=memory
export FORGE_SECRET="${FORGE_SECRET:-test-secret}"
export FORGE_API_KEY="${FORGE_API_KEY:-}"

# 4) 启动前自检:memory 模式必须生效;顺带打印页面上要填的 secret 与 key 尾号
python - <<'PY'
import os
from kg_forge.config import settings
print(f"[自检] settings.forge_checkpoint = {settings.forge_checkpoint!r}")
assert settings.forge_checkpoint == "memory", "memory 模式未生效 —— 把这行输出发给 Claude"
from langgraph.checkpoint.memory import InMemorySaver  # noqa: F401 预检导入
key_tail = ("…" + settings.forge_api_key[-4:]) if settings.forge_api_key else "(未配置,请在页面 BYOK 填)"
print(f"[自检] InMemorySaver 正常 | 兜底 LLM key {key_tail} | 页面 secret 填:{settings.forge_secret}")
PY

echo
echo "▶ 浏览器打开 http://localhost:8100/playground"
echo
exec python -m uvicorn kg_forge.api:app --port 8100
