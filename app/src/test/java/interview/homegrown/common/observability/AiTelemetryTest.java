package interview.homegrown.common.observability;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AiTelemetryTest {
    @Test
    @DisplayName("仅按供应商上报的 Token 和配置的单价计算费用，且同一次调用不会重复计数")
    void recordsReportedUsageAndConfiguredPrice() throws Exception {
        var meters = new SimpleMeterRegistry();
        var properties = new ObservabilityProperties();
        var price = new ObservabilityProperties.ModelPrice();
        price.setInputUsdPerMillion(2.0);
        price.setOutputUsdPerMillion(4.0);
        properties.setModelPrices(Map.of("demo-model", price));
        var telemetry = new AiTelemetry(meters, ObservationRegistry.create(), properties);
        var usage = new ObjectMapper().readTree("{\"prompt_tokens\":1000,\"completion_tokens\":500}");

        AiTelemetry.Call call = telemetry.start("demo", "demo-model", "stream");
        call.firstContent();
        call.firstContent();
        call.usage(usage);
        call.usage(usage);
        call.finish(true);
        call.finish(false);

        assertThat(meters.get("mianba.ai.tokens").tags("provider", "demo", "model", "demo-model", "type", "input")
                .counter().count()).isEqualTo(1000);
        assertThat(meters.get("mianba.ai.tokens").tags("provider", "demo", "model", "demo-model", "type", "output")
                .counter().count()).isEqualTo(500);
        assertThat(meters.get("mianba.ai.estimated.cost.usd").counter().count()).isEqualTo(0.004);
        assertThat(meters.get("mianba.ai.first.content").timer().count()).isEqualTo(1);
        assertThat(meters.get("mianba.ai.call").timer().count()).isEqualTo(1);
    }

    @Test
    @DisplayName("没有配置模型价格时不产生费用指标")
    void unknownPriceNeverInventsCost() {
        var meters = new SimpleMeterRegistry();
        var telemetry = new AiTelemetry(meters, ObservationRegistry.create(), new ObservabilityProperties());
        try (AiTelemetry.Call call = telemetry.start("custom", "unknown", "sync")) {
            call.usage(10, 20);
            call.finish(true);
        }
        assertThat(meters.find("mianba.ai.estimated.cost.usd").counter()).isNull();
    }
}
