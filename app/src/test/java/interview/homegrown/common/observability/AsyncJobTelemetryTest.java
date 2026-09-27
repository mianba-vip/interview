package interview.homegrown.common.observability;

import interview.homegrown.common.async.DurableJobStore;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AsyncJobTelemetryTest {
    @Test
    @DisplayName("一次批量查询更新各任务状态的队列深度")
    void refreshesQueueDepth() {
        var store = mock(DurableJobStore.class);
        when(store.countByStatus()).thenReturn(Map.of("QUEUED", 3L, "DEAD", 1L));
        var meters = new SimpleMeterRegistry();
        var telemetry = new AsyncJobTelemetry(meters, ObservationRegistry.create(), store);

        telemetry.refreshQueueDepth();

        assertThat(meters.get("mianba.async.jobs").tag("status", "QUEUED").gauge().value()).isEqualTo(3);
        assertThat(meters.get("mianba.async.jobs").tag("status", "DEAD").gauge().value()).isEqualTo(1);
        assertThat(meters.get("mianba.async.jobs").tag("status", "RUNNING").gauge().value()).isZero();
    }
}
