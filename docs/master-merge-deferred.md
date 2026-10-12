# master 分支未合入功能的状态与移植计划

> 记录时间：2026-10（main 分支修复批次部署前评估）

## 背景

`master` 分支领先 main 三个提交（origin/master：1312d95）：

| 提交 | 内容 | 依赖 |
|---|---|---|
| 639cc10 | 异步任务改为 PostgreSQL 持久队列（DurableJob* 一族 + V49 迁移 + DailyPlanService/CorpusIndexer/ProjectAnalysisService 接入） | — |
| b0e1f0a | 可观测性：Prometheus/Grafana/Loki/Tempo（monitoring/ + docker-compose.monitoring.yml）+ AiTelemetry/AsyncJobTelemetry + 请求关联 | 依赖 639cc10（指标打点埋在 DurableJob* 里） |
| 1312d95 | 桌面版本号 bump | — |

## 为什么本次不合入

cherry-pick 实测冲突 4 文件，且都是**结构性冲突**而非行级冲突：

1. `DailyPlanService.java`：master 版把它改为 DurableJobQueue + JdbcTemplate +
   TransactionTemplate（master 自己的一套事务修复）；main 版（本次修复批次）已经
   完成了另一套事务时序修复（ensureToday 去外层事务 + 在途防重 + ensureReady 两阶段），
   两个版本对同一批方法做了不同方向的重写，合并 = 手工重写一遍。
2. `CorpusIndexer.java`：master 接持久队列；main 已迁到 corpus 模块（P2 拆分）并自带
   TransactionTemplate，基线不同。
3. `deploy/deploy-local.sh`：master 版改了部署流程（含截图资源清理）；main 本次又加了
   web-image/Dockerfile 同步步骤。
4. `DailyPlanPickNewTest.java`：构造器签名两边都变过。

本次部署批次的原则是「修复已验证的问题，不引入新的风险面」：持久队列 + 全套监控栈
（Prometheus/Grafana/Loki/Tempo 四个容器）是架构级变更，混在同一批上线会显著放大
回归排查成本。main 上 A5 修复已消除了持久队列想解决的最急迫问题（预生成因事务
时序大概率丢失），剩余收益（重启不丢任务、可观测）可以独立批次做。

## 移植计划（后续独立批次）

1. **先合可观测性的无依赖部分**：`RequestCorrelationFilter`、`SessionCorrelationConfig`、
   `logback-spring.xml`、`GlobalExceptionHandler` 关联 ID——与 DurableJob 无耦合，冲突小。
2. **持久队列移植到 main 结构**：
   - `common/async/DurableJob*` 一族 + `V49__durable_async_jobs.sql` 原样搬（新文件无冲突）；
   - `DailyPlanService.generateAsync` 改为入队 `DURABLE_TASK_GEN`（替换本次加的在途防重
     Set——持久队列天然防重），保留本次的两阶段事务结构；
   - `CorpusIndexer`（corpus 模块）与 `ProjectAnalysisService` 的异步路径逐个接入；
   - `SchedulingConfig` 合并两边的线程池配置。
3. **AiTelemetry/AsyncJobTelemetry + monitoring/ 栈**：队列稳定后再上，服务器需评估
   内存预算（+4 容器）。
4. `1312d95` 版本号：随下一个功能版本一起 bump。

## 快速重试命令（移植时用）

```bash
git cherry-pick 639cc10   # 预期冲突 4 文件，见上
git cherry-pick b0e1f0a   # 依赖上一步完成
```
