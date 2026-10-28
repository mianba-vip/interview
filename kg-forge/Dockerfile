FROM python:3.12-slim

# pip 全局走清华镜像 + 加大超时/重试。必须用 ENV 而不是每行 -i:
# `pip install .` 触发 PEP 517 构建隔离时,子进程只继承环境变量,
# 不吃命令行的 -i——setuptools 等构建依赖会直连 files.pythonhosted.org,
# 国内网络读超时导致构建随机失败(2026-10-28 踩坑)。
ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    PIP_DEFAULT_TIMEOUT=60 \
    PIP_RETRIES=5

WORKDIR /app
# 依赖层与代码层分离：只改 Python 代码不再触发全量重下依赖（层缓存以
# requirements.txt 内容为键）。版本全部钉死——2026-10 两次踩坑（psycopg
# 缺 binary、pydantic-settings env 匹配行为变更）都是开放约束解析到
# 上游新版所致；升级依赖时只改 requirements.txt 并重新验证。
# 清华镜像：机房直连 pypi.org 仅 ~60-110KB/s，镜像源可把重装从 ~8 分钟压到 <1 分钟。
COPY requirements.txt ./
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
# 应用本体：--no-deps 只装 kg-forge 自身，依赖已由上层就位
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir --no-deps .

EXPOSE 8100
# 只监听容器内网：不发布公网端口，由 compose 网络隔离（见 interview 仓库 compose）
CMD ["uvicorn", "kg_forge.api:app", "--host", "0.0.0.0", "--port", "8100"]
