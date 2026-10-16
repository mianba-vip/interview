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

docker-compose（本目录已并入 interview 仓库，服务加进仓库根目录的 `docker-compose.prod.yml`）：

```yaml
  kg-forge:
    build: ./kg-forge         # 或镜像引用
    restart: unless-stopped
    environment:
      FORGE_SECRET: ${APP_FORGE_SECRET:?}
      FORGE_DB_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    # 不发布端口：仅 compose 内网，backend 通过服务名 kg-forge:8100 访问
    depends_on: [postgres]
```

## 本地开发

```bash
pip install -e ".[dev]"
export FORGE_DB_URL=postgresql://postgres:123456@localhost:5432/interview
uvicorn kg_forge.api:app --port 8100
pytest                      # 假 LLM + InMemorySaver，全链路含 interrupt/恢复
```

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
