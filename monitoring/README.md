# 面霸可观测性

生产部署使用现有 Compose 加上 `docker-compose.monitoring.yml`。默认部署**不会**启动监控容器；首次启用需要显式指定 `ENABLE_OBSERVABILITY=true`。启用成功后服务器会留下 `/opt/mianba/.observability-enabled` 标记，后续普通部署继续保留监控配置。

## 首次启用（Windows Git Bash）

1. 在服务器 `/opt/mianba/.env` 中增加随机强密码 `GRAFANA_ADMIN_PASSWORD=...`。不要提交到 Git。
2. 如需费用估算，先在本地 [`model-prices.yml`](model-prices.yml) 按当前供应商价目表填写实际模型的每百万输入/输出 Token 美元单价；不填则不会产生费用估算指标。价格不是账单，缓存命中、折扣和特殊计费需另行核算。
3. 在 **interview-homegrown** 根目录运行：

   ```bash
   ENABLE_OBSERVABILITY=true bash deploy/deploy-local.sh
   ```

   第一次需要拉取 Prometheus、Grafana、Tempo、Loki 和 Alloy 镜像，可能明显慢于日常发布。此后运行原来的 `bash deploy/deploy-local.sh` 即可，部署脚本会自动沿用已启用的监控配置。

4. 在本机 PowerShell 打开 SSH 隧道，保持终端不关闭：

   ```powershell
   ssh -N -L 3000:127.0.0.1:3000 -i "C:\Users\26680\.ssh\id_ed25519" -p 37777 root@103.236.92.40
   ```

5. 浏览器访问 `http://127.0.0.1:3000`，用户 `admin`，密码为服务器 `.env` 的 `GRAFANA_ADMIN_PASSWORD`。打开 **Mianba → 面霸 · 服务与 AI 观测**。Grafana、Prometheus、Loki 和 Tempo 不经官网代理公开；只有 Grafana 的端口绑定在服务器 `127.0.0.1`。

## 在哪里看

- **Dashboard**：HTTP 请求/5xx/P95、包括 HTTP 200 业务错误在内的应用层错误，原生与 Spring AI 两条调用路径的模型耗时与 Token、原生/结构化调用失败率、流式首字时间、价格已知的费用估算、异步任务队列与重试。两条调用路径可能在结构化回退时重叠，图中分别显示，不要直接相加。
- **Explore → Loki**：按 `requestId=...`、`taskId=...`、`sessionId=...` 或 `traceId=...` 搜索日志，例如 `{job="mianba-backend"} |= "taskId=123"`。日志中的 TraceID 可跳到 Tempo。
- **Explore → Tempo**：用 trace ID 查看一次被采样请求中的 HTTP、模型和异步执行跨度。异步任务是独立 trace，通过入队日志的 `taskId` 与请求关联；它不是同一个连续的 trace ID。
- **Prometheus 自检**：服务器本机 `curl http://127.0.0.1:23334/actuator/prometheus`。异步任务状态指标启动即有；AI 调用指标需要实际请求后才出现。

## 数据与安全边界

- 仅启用监控的生产部署把 Actuator 迁移到容器内 `23334`；主服务 `23333` 使用 `/healthz` 健康检查，Nginx 对外仍兼容 `/actuator/health`。桌面/本地模式仍可使用原 `/actuator/health`。
- 目前费用估算只覆盖原生客户端和结构化调用的可观测路径；其他 Spring AI 模型调用有原生 Token 指标，但尚未折算费用。价格没有配置或供应商没有返回 `usage` 时不估算费用，也不把文本长度冒充 Token。流式 `usage` 取决于供应商是否支持 `stream_options.include_usage`；不支持时客户端会去掉该可选参数重试。
- 指标标签仅包括有限的 Provider、模型、操作和状态；唯一的请求/会话/任务 ID 只进日志和 trace，避免 Prometheus 标签爆炸。不会记录提示词、回答正文、API Key 或密码。
- 默认仅采样 10% trace，可通过服务器 `.env` 的 `APP_TRACE_SAMPLING` 调整。Prometheus 保留 7 天、Tempo/Loki 保留 7 天，后端监控日志滚动保留最多约 500 MB。监控栈设有内存限制，但这台 4 GiB 服务器仍应观察 OOM/磁盘余量。
