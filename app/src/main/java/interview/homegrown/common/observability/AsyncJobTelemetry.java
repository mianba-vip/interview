package interview.homegrown.common.observability;

import interview.homegrown.common.async.DurableJob;
import interview.homegrown.common.async.DurableJobStore;
import interview.homegrown.common.async.DurableJobType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/** Queue depths are refreshed in one database query, not queried separately by every scrape. */
@Component
public class AsyncJobTelemetry {
    private static final Logger log = LoggerFactory.getLogger(AsyncJobTelemetry.class);
    private static final String[] STATUSES = {"QUEUED", "RUNNING", "WAITING_CONFIG", "SUCCEEDED", "DEAD"};
    private final MeterRegistry meters;
    private final ObservationRegistry observations;
    private final DurableJobStore store;
    private final Map<String, AtomicLong> depths = new java.util.HashMap<>();

    public AsyncJobTelemetry(MeterRegistry meters, ObservationRegistry observations, DurableJobStore store) {
        this.meters = meters;
        this.observations = observations;
        this.store = store;
        for (String status : STATUSES) {
            AtomicLong count = new AtomicLong();
            depths.put(status, count);
            Gauge.builder("mianba.async.jobs", count, AtomicLong::get)
                    .tag("status", status).register(meters);
        }
    }

    @Scheduled(fixedDelay = 15000, initialDelay = 15000)
    public void refreshQueueDepth() {
        try {
            Map<String, Long> current = store.countByStatus();
            depths.forEach((status, count) -> count.set(current.getOrDefault(status, 0L)));
        } catch (Exception e) {
            log.warn("刷新异步任务监控指标失败", e);
        }
    }

    public void enqueued(DurableJobType type) {
        Counter.builder("mianba.async.enqueue.requests")
                .tag("type", type.name()).register(meters).increment();
    }

    public void deadLetter(DurableJobType type) {
        Counter.builder("mianba.async.dead.letters")
                .tag("type", type.name()).register(meters).increment();
    }

    public Scope start(DurableJob job) {
        if (job.attempts() > 1) {
            Counter.builder("mianba.async.retries")
                    .tag("type", job.type().name()).register(meters).increment();
        }
        return new Scope(job);
    }

    public final class Scope implements AutoCloseable {
        private final DurableJob job;
        private final long started = System.nanoTime();
        private final Observation observation;
        private final Observation.Scope scope;
        private String outcome = "error";

        private Scope(DurableJob job) {
            this.job = job;
            observation = Observation.createNotStarted("mianba.async.job", observations)
                    .lowCardinalityKeyValue("type", job.type().name())
                    .highCardinalityKeyValue("task.id", job.id().toString())
                    .start();
            scope = observation.openScope();
        }

        public void outcome(String outcome) {
            this.outcome = outcome;
        }

        @Override
        public void close() {
            Timer.builder("mianba.async.execution")
                    .tag("type", job.type().name()).tag("outcome", outcome)
                    .publishPercentileHistogram().register(meters)
                    .record(System.nanoTime() - started, TimeUnit.NANOSECONDS);
            if ("error".equals(outcome)) observation.error(new IllegalStateException("job execution failed"));
            scope.close();
            observation.stop();
        }
    }
}
