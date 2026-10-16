-- 知识图谱锻造炉（kg-forge）：一次锻造 = 一行。提案本体存在 sidecar 的
-- LangGraph checkpoint 里（thread_id 关联），批准时才由后端校验落库到 concept。
CREATE TABLE IF NOT EXISTS kg_forge_run (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL,
    plan_id       BIGINT,                          -- 锻造进哪个学习方向；空 = 全局概念池
    topic         VARCHAR(200) NOT NULL,           -- 方向意图，如「JVM 调优，准备秋招」
    goal          VARCHAR(500),
    layer_budget  INT         NOT NULL DEFAULT 50, -- 概念总数预算（审核页阅读负担上限）
    thread_id     VARCHAR(64) NOT NULL,            -- = kg-forge 的 LangGraph thread_id
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING/RUNNING/AWAITING_REVIEW/APPROVED/REJECTED/FAILED
    error         TEXT,
    concept_count INT         NOT NULL DEFAULT 0,  -- 批准时实际写入的概念数
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_kg_forge_thread ON kg_forge_run (thread_id);
CREATE INDEX IF NOT EXISTS idx_kg_forge_user ON kg_forge_run (user_id, id DESC);
