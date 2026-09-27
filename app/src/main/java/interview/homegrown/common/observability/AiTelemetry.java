package interview.homegrown.common.observability;

import com.fasterxml.jackson.databind.JsonNode;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.config.MeterFilter;
import io.micrometer.core.instrument.distribution.DistributionStatisticConfig;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** One bounded set of metrics for native HTTP model calls; Spring AI keeps its own built-in metrics. */
@Component
public class AiTelemetry {
    private final MeterRegistry meters;
    private final ObservationRegistry observations;
    private final ObservabilityProperties properties;

    public AiTelemetry(MeterRegistry meters, ObservationRegistry observations, ObservabilityProperties properties) {
        this.meters = meters;
        this.observations = observations;
        this.properties = properties;
    }

    public Call start(String provider, String model, String operation) {
        return new Call(provider, model, operation);
    }

    public void retry(String reason) {
        Counter.builder("mianba.ai.retries")
                .tag("reason", safe(reason))
                .register(meters).increment();
    }

    public final class Call implements AutoCloseable {
        private final String provider;
        private final String model;
        private final String operation;
        private final long started = System.nanoTime();
        private final Observation observation;
        private final Observation.Scope scope;
        private final AtomicBoolean finished = new AtomicBoolean();
        private final AtomicBoolean usageRecorded = new AtomicBoolean();
        private final AtomicBoolean firstContent = new AtomicBoolean();

        private Call(String provider, String model, String operation) {
            this.provider = safe(provider);
            this.model = safe(model);
            this.operation = safe(operation);
            observation = Observation.createNotStarted("mianba.ai.operation", observations)
                    .lowCardinalityKeyValue("provider", this.provider)
                    .lowCardinalityKeyValue("model", this.model)
                    .lowCardinalityKeyValue("operation", this.operation)
                    .start();
            scope = observation.openScope();
        }

        /** Time until the first visible answer fragment, excluding private reasoning. */
        public void firstContent() {
            if (firstContent.compareAndSet(false, true)) {
                Timer.builder("mianba.ai.first.content")
                        .description("Time to first visible AI content")
                        .tag("provider", provider).tag("model", model)
                        .publishPercentileHistogram().register(meters)
                        .record(System.nanoTime() - started, TimeUnit.NANOSECONDS);
            }
        }

        /** Only record provider-reported usage; do not guess tokens from response length. */
        public void usage(JsonNode usage) {
            if (usage == null || usage.isMissingNode() || usage.isNull()) return;
            long input = usage.path("prompt_tokens").asLong(usage.path("input_tokens").asLong());
            long output = usage.path("completion_tokens").asLong(usage.path("output_tokens").asLong());
            usage(input, output);
        }

        public void usage(long input, long output) {
            if (input <= 0 && output <= 0) return;
            if (!usageRecorded.compareAndSet(false, true)) return;
            addTokens("input", input);
            addTokens("output", output);
            ObservabilityProperties.ModelPrice price = properties.getModelPrices().get(model);
            if (price != null && price.getInputUsdPerMillion() >= 0 && price.getOutputUsdPerMillion() >= 0) {
                double usd = (input * price.getInputUsdPerMillion()
                        + output * price.getOutputUsdPerMillion()) / 1_000_000.0;
                if (usd > 0) {
                    Counter.builder("mianba.ai.estimated.cost.usd")
                            .tag("provider", provider).tag("model", model)
                            .register(meters).increment(usd);
                }
            }
        }

        private void addTokens(String type, long count) {
            if (count <= 0) return;
            Counter.builder("mianba.ai.tokens")
                    .tag("provider", provider).tag("model", model).tag("type", type)
                    .register(meters).increment(count);
        }

        public void finish(boolean success) {
            if (!finished.compareAndSet(false, true)) return;
            Timer.builder("mianba.ai.call")
                    .tag("provider", provider).tag("model", model)
                    .tag("operation", operation).tag("outcome", success ? "success" : "error")
                    .publishPercentileHistogram().register(meters)
                    .record(System.nanoTime() - started, TimeUnit.NANOSECONDS);
            if (!success) observation.error(new IllegalStateException("model call failed"));
            scope.close();
            observation.stop();
        }

        @Override
        public void close() {
            finish(false);
        }
    }

    private static String safe(String value) {
        if (value == null || value.isBlank()) return "unknown";
        String clean = value.replaceAll("[^A-Za-z0-9_.:/-]", "_");
        return clean.length() > 64 ? clean.substring(0, 64) : clean;
    }

    @Configuration
    static class CardinalityLimit {
        @Bean
        MeterFilter observabilityModelCardinalityLimit() {
            return MeterFilter.maximumAllowableTags("mianba.ai", "model", 40, MeterFilter.deny());
        }

        @Bean
        MeterFilter observabilityProviderCardinalityLimit() {
            return MeterFilter.maximumAllowableTags("mianba.ai", "provider", 20, MeterFilter.deny());
        }

        @Bean
        MeterFilter httpRequestHistogram() {
            return new MeterFilter() {
                @Override
                public DistributionStatisticConfig configure(io.micrometer.core.instrument.Meter.Id id,
                                                             DistributionStatisticConfig config) {
                    if (!"http.server.requests".equals(id.getName())
                            && !"gen_ai.client.operation".equals(id.getName())) return config;
                    return DistributionStatisticConfig.builder().percentilesHistogram(true).build().merge(config);
                }
            };
        }
    }
}
