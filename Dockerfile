FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir .

EXPOSE 8100
# 只监听容器内网：不发布公网端口，由 compose 网络隔离（见 interview 仓库 compose）
CMD ["uvicorn", "kg_forge.api:app", "--host", "0.0.0.0", "--port", "8100"]
