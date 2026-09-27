package interview.homegrown.common.async;

import interview.homegrown.common.ai.AiConfig;
import interview.homegrown.common.ai.AiSettingsService;
import interview.homegrown.common.observability.AsyncJobTelemetry;
import interview.homegrown.modules.drill.service.CorpusIndexer;
import interview.homegrown.modules.drill.service.DailyPlanService;
import interview.homegrown.modules.project.service.ProjectAnalysisService;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/** 固定并发的任务执行器。数据库租约负责重启接管，多实例之间通过 SKIP LOCKED 互斥领取。 */
@Component
public class DurableJobWorker {
    private static final Logger log = LoggerFactory.getLogger(DurableJobWorker.class);
    private final DurableJobStore store;
    private final DurableJobQueue queue;
    private final AiSettingsService settings;
    private final ProjectAnalysisService projects;
    private final CorpusIndexer corpora;
    private final DailyPlanService daily;
    private final AsyncJobTelemetry telemetry;
    private final Semaphore capacity = new Semaphore(2);
    private final ExecutorService workers = Executors.newFixedThreadPool(2);
    private final Map<Long, DurableJob> active = new ConcurrentHashMap<>();

    public DurableJobWorker(DurableJobStore store, DurableJobQueue queue, AiSettingsService settings,
                            ProjectAnalysisService projects, CorpusIndexer corpora, DailyPlanService daily,
                            AsyncJobTelemetry telemetry) {
        this.store = store;
        this.queue = queue;
        this.settings = settings;
        this.projects = projects;
        this.corpora = corpora;
        this.daily = daily;
        this.telemetry = telemetry;
    }

    @Scheduled(fixedDelay = 1000)
    public void poll() {
        if (!capacity.tryAcquire()) return;
        try {
            store.deadLetterExpired().forEach(job -> {
                telemetry.deadLetter(job.type());
                markBusinessFailure(job, true, "任务执行中断，重试次数已耗尽");
            });
            var claimed = store.claim();
            if (claimed.isEmpty()) { capacity.release(); return; }
            DurableJob job = claimed.get();
            active.put(job.id(), job);
            workers.execute(() -> run(job));
        } catch (Exception e) {
            capacity.release();
            log.error("领取异步任务失败", e);
        }
    }

    @Scheduled(fixedDelay = 20000)
    public void heartbeat() {
        for (DurableJob job : active.values()) {
            try {
                if (!store.renew(job)) log.warn("任务租约已失效 jobId={}", job.id());
            } catch (Exception e) {
                log.warn("任务心跳失败 jobId={}", job.id(), e);
            }
        }
    }

    private void run(DurableJob job) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable("taskId", job.id().toString());
             AsyncJobTelemetry.Scope observed = telemetry.start(job)) {
            AiConfig config = queue.configFor(job.userId());
            if (job.type() != DurableJobType.CORPUS_INDEX
                    && (config == null || config.apiKey() == null || config.apiKey().isBlank())) {
                store.waitForConfig(job);
                observed.outcome("waiting_config");
                return;
            }
            settings.withTaskConfig(config, () -> execute(job));
            observed.outcome(store.complete(job) ? "success" : "lease_lost");
        } catch (Exception e) {
            log.error("异步任务失败 jobId={}, type={}, attempt={}", job.id(), job.type(), job.attempts(), e);
            String safeReason = "执行失败（" + e.getClass().getSimpleName() + "），可在配置和日志检查后重试";
            Boolean dead = store.fail(job, safeReason);
            if (dead != null) {
                if (dead) telemetry.deadLetter(job.type());
                markBusinessFailure(job, dead, safeReason);
            }
        } finally {
            active.remove(job.id());
            capacity.release();
        }
    }

    private void execute(DurableJob job) {
        switch (job.type()) {
            case PROJECT_ANALYSIS -> projects.runJob(job.entityId(), job.userId());
            case CORPUS_INDEX -> corpora.runJob(job.entityId(), job.userId(), job.refreshRequested());
            case DAILY_QUESTION -> daily.runJob(job.entityId(), job.userId());
        }
    }

    private void markBusinessFailure(DurableJob job, boolean dead, String reason) {
        switch (job.type()) {
            case PROJECT_ANALYSIS -> projects.markJobFailure(job.entityId(), job.userId(), dead, reason);
            case CORPUS_INDEX -> corpora.markJobFailure(job.entityId(), job.userId(), dead);
            case DAILY_QUESTION -> { /* 题目未就绪时保持 PENDING，用户可从失败队列重试。 */ }
        }
    }

    @PreDestroy
    void shutdown() { workers.shutdownNow(); }
}
