-- 业务异步任务使用数据库作为持久队列；同一实体同一任务类型只有一个幂等键。
-- RUNNING 租约到期可重新领取；DEAD 保留失败记录，等待用户显式重试。
CREATE TABLE IF NOT EXISTS async_job (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(160) NOT NULL UNIQUE,
    job_type VARCHAR(32) NOT NULL,
    entity_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
    lease_until TIMESTAMPTZ,
    lease_token UUID,
    refresh_requested BOOLEAN NOT NULL DEFAULT false,
    last_error VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT async_job_status_check CHECK (status IN ('QUEUED', 'RUNNING', 'WAITING_CONFIG', 'SUCCEEDED', 'DEAD'))
);
CREATE INDEX IF NOT EXISTS idx_async_job_available ON async_job (status, run_after, id);
CREATE INDEX IF NOT EXISTS idx_async_job_expired ON async_job (lease_until) WHERE status = 'RUNNING';
CREATE INDEX IF NOT EXISTS idx_async_job_owner ON async_job (user_id, created_at DESC);

-- 部署新版本时接管旧版本进程内队列遗留的业务记录。
INSERT INTO async_job (idempotency_key, job_type, entity_id, user_id)
SELECT 'PROJECT_ANALYSIS:' || id, 'PROJECT_ANALYSIS', id, user_id
FROM project_import WHERE status IN ('PENDING', 'ANALYZING')
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO async_job (idempotency_key, job_type, entity_id, user_id)
SELECT 'CORPUS_INDEX:' || id, 'CORPUS_INDEX', id, user_id
FROM corpus WHERE index_state IN ('PENDING', 'RUNNING')
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO async_job (idempotency_key, job_type, entity_id, user_id)
SELECT 'DAILY_QUESTION:' || id, 'DAILY_QUESTION', id, user_id
FROM daily_task WHERE status = 'PENDING' AND question_id IS NULL AND task_date >= CURRENT_DATE - 1
ON CONFLICT (idempotency_key) DO NOTHING;
