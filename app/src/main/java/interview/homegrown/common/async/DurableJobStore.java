package interview.homegrown.common.async;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** 短事务操作持久任务；领取用 SKIP LOCKED，多个后端实例不会拿到同一条租约。 */
@Repository
public class DurableJobStore {
    private final JdbcTemplate jdbc;

    public DurableJobStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long enqueue(DurableJobType type, Long entityId, Long userId, boolean refresh, boolean explicitRetry) {
        String key = type.name() + ":" + entityId;
        jdbc.update("""
                INSERT INTO async_job (idempotency_key, job_type, entity_id, user_id, refresh_requested)
                VALUES (?, ?, ?, ?, ?) ON CONFLICT (idempotency_key) DO NOTHING
                """, key, type.name(), entityId, userId, refresh);
        if (explicitRetry) {
            jdbc.update("""
                    UPDATE async_job SET status = 'QUEUED', attempts = 0, run_after = now(),
                        lease_until = NULL, lease_token = NULL, last_error = NULL, finished_at = NULL,
                        refresh_requested = ?, updated_at = now()
                    WHERE idempotency_key = ? AND user_id = ? AND status IN ('SUCCEEDED', 'DEAD')
                    """, refresh, key, userId);
        }
        return jdbc.queryForObject("SELECT id FROM async_job WHERE idempotency_key = ? AND user_id = ?",
                Long.class, key, userId);
    }

    public Optional<DurableJob> claim() {
        UUID token = UUID.randomUUID();
        List<DurableJob> jobs = jdbc.query("""
                WITH candidate AS (
                    SELECT id FROM async_job
                    WHERE attempts < max_attempts AND (
                        (status IN ('QUEUED', 'WAITING_CONFIG') AND run_after <= now())
                        OR (status = 'RUNNING' AND lease_until < now()))
                    ORDER BY run_after, id LIMIT 1 FOR UPDATE SKIP LOCKED
                )
                UPDATE async_job j SET status = 'RUNNING', attempts = j.attempts + 1,
                    lease_until = now() + interval '90 seconds', lease_token = CAST(? AS uuid), updated_at = now()
                FROM candidate WHERE j.id = candidate.id
                RETURNING j.id, j.job_type, j.entity_id, j.user_id, j.attempts,
                          j.max_attempts, j.refresh_requested, j.lease_token
                """, (rs, row) -> map(rs), token.toString());
        return jobs.stream().findFirst();
    }

    public boolean renew(DurableJob job) {
        return jdbc.update("""
                UPDATE async_job SET lease_until = now() + interval '90 seconds', updated_at = now()
                WHERE id = ? AND lease_token = CAST(? AS uuid) AND status = 'RUNNING'
                """, job.id(), job.leaseToken().toString()) == 1;
    }

    public boolean complete(DurableJob job) {
        return jdbc.update("""
                UPDATE async_job SET status = 'SUCCEEDED', lease_until = NULL, lease_token = NULL,
                    last_error = NULL, finished_at = now(), updated_at = now()
                WHERE id = ? AND lease_token = CAST(? AS uuid) AND status = 'RUNNING'
                """, job.id(), job.leaseToken().toString()) == 1;
    }

    /** null 表示租约已失效，调用方不可改写业务状态。 */
    public Boolean fail(DurableJob job, String reason) {
        boolean dead = job.attempts() >= job.maxAttempts();
        int delaySeconds = switch (job.attempts()) { case 1 -> 5; case 2 -> 30; default -> 120; };
        int changed = jdbc.update("""
                UPDATE async_job SET status = ?, run_after = now() + (? * interval '1 second'),
                    lease_until = NULL, lease_token = NULL, last_error = ?,
                    finished_at = CASE WHEN ? THEN now() ELSE NULL END, updated_at = now()
                WHERE id = ? AND lease_token = CAST(? AS uuid) AND status = 'RUNNING'
                """, dead ? "DEAD" : "QUEUED", delaySeconds, limit(reason), dead,
                job.id(), job.leaseToken().toString());
        return changed == 1 ? dead : null;
    }

    /** 桌面端仅在请求头提供密钥时，等待用户重新打开应用；不消耗重试次数，也不落库密钥。 */
    public void waitForConfig(DurableJob job) {
        jdbc.update("""
                UPDATE async_job SET status = 'WAITING_CONFIG', attempts = attempts - 1,
                    run_after = now() + interval '60 seconds', lease_until = NULL, lease_token = NULL,
                    last_error = '等待用户配置模型密钥', updated_at = now()
                WHERE id = ? AND lease_token = CAST(? AS uuid) AND status = 'RUNNING'
                """, job.id(), job.leaseToken().toString());
    }

    public void wakeWaiting(Long userId) {
        jdbc.update("""
                UPDATE async_job SET status = 'QUEUED', run_after = now(), updated_at = now()
                WHERE user_id = ? AND status = 'WAITING_CONFIG'
                """, userId);
    }

    /** 第三次执行时进程恰好退出，租约到期后进入失败队列，不能永远留在 RUNNING。 */
    public List<DurableJob> deadLetterExpired() {
        return jdbc.query("""
                UPDATE async_job SET status = 'DEAD', lease_until = NULL, lease_token = NULL,
                    last_error = '执行中断且已达到最大重试次数', finished_at = now(), updated_at = now()
                WHERE status = 'RUNNING' AND lease_until < now() AND attempts >= max_attempts
                RETURNING id, job_type, entity_id, user_id, attempts, max_attempts, refresh_requested, lease_token
                """, (rs, row) -> map(rs));
    }

    public List<JobStatus> listForUser(Long userId) {
        return jdbc.query("""
                SELECT id, job_type, entity_id, status, attempts, max_attempts, last_error
                FROM async_job WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
                """, (rs, row) -> new JobStatus(rs.getLong("id"), rs.getString("job_type"),
                rs.getLong("entity_id"), rs.getString("status"), rs.getInt("attempts"),
                rs.getInt("max_attempts"), rs.getString("last_error")), userId);
    }

    public boolean retryDead(Long jobId, Long userId) {
        return jdbc.update("""
                UPDATE async_job SET status = 'QUEUED', attempts = 0, run_after = now(),
                    last_error = NULL, finished_at = NULL, updated_at = now()
                WHERE id = ? AND user_id = ? AND status = 'DEAD'
                """, jobId, userId) == 1;
    }

    private DurableJob map(ResultSet rs) throws SQLException {
        return new DurableJob(rs.getLong("id"), DurableJobType.valueOf(rs.getString("job_type")),
                rs.getLong("entity_id"), rs.getLong("user_id"), rs.getInt("attempts"),
                rs.getInt("max_attempts"), rs.getBoolean("refresh_requested"),
                rs.getObject("lease_token", UUID.class));
    }

    private String limit(String reason) {
        if (reason == null || reason.isBlank()) return "异步处理失败";
        return reason.length() > 900 ? reason.substring(0, 900) : reason;
    }

    public record JobStatus(Long id, String type, Long entityId, String status,
                            int attempts, int maxAttempts, String lastError) {}
}
