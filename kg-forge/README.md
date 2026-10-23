# kg-forge · 知识图谱锻造炉

面霸的 LangGraph sidecar：把一句学习方向批产为「概念树提案」，人工审核后由
interview 后端落库。**Agent 只有提案权——确定性校验、去重与写库权全在 Java 侧**，
与产品「教学决策权归服务端」的哲学一致。

## 图结构

```
START → plan ──Send 并行播种──► forge_topic(每主题一条支线) ──► assemble ──interrupt──► END
          ≤2 轮自检修复            起草 → 审核 → 应用裁决          全局去重+报告+人工审核挂起
```

严格逻辑的边界（全部有硬上限，无无界循环）：

- plan 修复 ≤ 2 轮（主题数 2-6、预算可行性校验）；
- forge_topic 每主题恰好两次 LLM 调用（起草 + 逐条裁决），宁缺毋滥；
- assemble 的去重/报告是**纯函数**（`schema.dedup_proposals`），interrupt 恢复时
  节点整体重入、重算无害；
- 任何节点抛错由 API 层 `aupdate_state` 写入 `failed`，前端可见原因。

层级语义与 interview 的 `Concept` 严格一致：L1 概念 → L2 机制 → L3 实现 → L4 权衡 → L5 故障。

## API 契约（只对 compose 内网的 interview 后端开放）

所有请求必带 `X-Forge-Secret` 头。

### POST /runs（触发锻造，202）

```json
{
  "run_id": "forge-42",
  "topic": "JVM 调优，准备秋招",
  "goal": "秋招",
  "layer_budget": 50,
  "existing_names": ["分代假说"],
  "llm": {"base_url": "https://api.deepseek.com", "api_key": "sk-...", "model": "deepseek-chat", "temperature": 0.7}
}
```

`llm` 为用户 BYOK（由后端 DurableJobWorker 的 configFor 取得，随任务转发）；
**只驻进程内存（KeyRing），绝不进入 checkpoint**。不传则用服务端兜底 key。

### GET /runs/{run_id}

- `{ "status": "planning|forging|running" }` —— 进行中
- `{ "status": "awaiting_review", "concepts": [...], "report": {...} }` —— 待审核
  （concepts 字段：name/description/topic/layer/sub_points[]/source）
- `{ "status": "approved|rejected|failed", "error": null, "coverage": {...} }` —— 终态

### POST /runs/{run_id}/finalize

```json
{ "decision": "approved", "note": null }
```

恢复 interrupt：approved/rejected。**注意：批准后的落库由 interview 后端完成**
（approve API 里校验 + 写 concept），本服务只记录结论。

## 部署

已正式接线（2026-10-21）：

- 仓库根 `docker-compose.prod.yml` 已含 `kg-forge` 服务（build `./kg-forge`，不发布端口），
  `deploy-prod.sh` 会随 backend 一起构建/启动/健康检查；backend 通过
  `APP_FORGE_BASE_URL=http://kg-forge:8100` 访问（compose 已显式设置——不设会退回
  localhost 默认值导致容器内连不上）；
- 线上 legacy compose（`/opt/mianba/docker-compose.yml`）走
  `deploy/docker-compose.kgforge.yml` 增量覆盖，同一套变量与地址；
- `.env` **必须**设置 `APP_FORGE_SECRET=<随机长串>`：两处 compose 均按 `:?` 必填校验，
  未设置直接拒绝启动（避免带着公开默认值上线）；backend 与 sidecar 自动共用同一变量。

```yaml
  kg-forge:
    build: ./kg-forge
    restart: unless-stopped
    environment:
      FORGE_SECRET: ${APP_FORGE_SECRET:?请在 .env 设置 APP_FORGE_SECRET}
      FORGE_DB_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    # 不发布端口：仅 compose 内网，backend 通过服务名 kg-forge:8100 访问
    depends_on:
      postgres: { condition: service_healthy }
```

## 本地开发

```bash
pip install -e ".[dev]"
export FORGE_DB_URL=postgresql://postgres:123456@localhost:5432/interview
uvicorn kg_forge.api:app --port 8100
pytest                      # 假 LLM + InMemorySaver，全链路含 interrupt/恢复
```

## 测试台（playground）

起服务后浏览器打开 <http://localhost:8100/playground>（由 api.py 内嵌提供，
同源调用 /runs，免 CORS）。用于在接入 interview 前直接评估锻造质量：

- 填 `X-Forge-Secret`（与 `FORGE_SECRET` 一致）；BYOK 四项全留空则用服务端兜底配置；
- 发起锻造 → 实时轮询流水线阶段 → 待审核时看「主题 × 层级」覆盖矩阵与提案卡片
  （可按层级/主题筛选）→ 「批准/拒绝」验证 finalize 通道；
- 编辑提案后落库是 Java 审核页的能力，此处只做整批批准/拒绝；
- 页面打不开 sidecar 时自动进入演示模式（内置样例数据，仅预览界面）。

免 Postgres 冒烟测试：`FORGE_CHECKPOINT=memory` 时 checkpoint 只驻进程内存
（重启即失、无断点续跑），API 契约不变。**生产不要用**：

```bash
FORGE_CHECKPOINT=memory FORGE_SECRET=test-secret \
FORGE_API_KEY=sk-xxx uvicorn kg_forge.api:app --port 8100
```

### 对比评测（双路盲测）

测试台顶栏切「对比评测」：同一输入下，kg-forge 流水线对阵 interview 后端的
intake 旧逻辑（`POST /api/study-plan/intake`，多轮收敛出 draft）。

- **隔离性**：intake 走真实接口但**零写库**（落库只发生在 `/confirm`，本页永不调用）；
  后端与 sidecar 都不需要为此改任何代码（后端 CORS 已放行）；
- **公平性**：kg-forge 用页面 BYOK，intake 用后端账号配置的 LLM——两边配**同一个模型**；
- **自动指标**：深层占比（L3-L5）、层级均衡熵、批内重复率（trigram Jaccard >0.85，与
  Java/Python 侧同语义）、子点均数/描述均长、预算达成率、耗时与 LLM 调用数；
- **人工盲测**：左右随机、来源隐藏，四维打分 + 二选一，提交揭晓；评分存浏览器
  localStorage（`kgf_evals`），底部累计表给出两边均分与胜场。

前提：本机起 interview 后端（默认 `http://localhost:23333`），左侧「interview
后端」卡里登录一次（凭据只存本机浏览器）。

## 与 interview 后端的对接速查

| 后端配置（application.yml） | 值 |
|---|---|
| `app.forge.base-url` | `http://kg-forge:8100`（compose 内）|
| `app.forge.secret` | 与 FORGE_SECRET 一致 |

流程：前端 POST `/api/forge/runs` → 后端建 `kg_forge_run` 行并入队
DurableJob(KG_FORGE) → Worker 取 BYOK 配置调 sidecar → 前端轮询
`GET /api/forge/runs/{id}`（后端代理 sidecar）→ 审核页编辑提案 →
`POST /api/forge/runs/{id}/approve`（Java 校验去重后写 concept + lesson_outline，
并调 sidecar finalize）。

## 预留扩展位（本期未做）

- research 节点（corpus 检索 / web 检索）：`source` 字段已预留；
- 题库批产：题目生成仍走 Java 侧 QuestionService（B 系列已把现场出题提速），
  如需批产可在 assemble 前加一层并行节点，产物走同一审核通道。
  ⚠️ **注意**：若在 interrupt 之后新增需要调 LLM 的阶段，finalize 时必须重新
  传入 BYOK key（跑图结束后 KeyRing 已清理；当前 assemble 是纯函数所以无此需求）。
