package interview.homegrown.common.ai;

import interview.homegrown.common.observability.AiTelemetry;
import interview.homegrown.common.observability.ObservabilityProperties;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LlmRawClientErrorTest {
    private LlmRawClient client;
    private HttpClient http;

    @BeforeEach
    void setup() {
        var settings = mock(AiSettingsService.class);
        var config = new AiConfig("deepseek", "https://example.invalid/v1", "test-only", "deepseek-chat", 0.7, "low");
        when(settings.currentProvider()).thenReturn(config);
        when(settings.currentProviderForRequest()).thenReturn(config);
        client = new LlmRawClient(settings, new AiTelemetry(new SimpleMeterRegistry(),
                ObservationRegistry.create(), new ObservabilityProperties()));
        http = mock(HttpClient.class);
        ReflectionTestUtils.setField(client, "httpClient", http);
    }

    @Test
    void insufficientBalanceIsReportedOnceWithoutLeakingProviderBody() throws Exception {
        reply(402, "upstream-private-body");
        assertThatThrownBy(() -> client.complete("system", "question"))
                .isInstanceOfSatisfying(LlmUpstreamException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PAYMENT_REQUIRED);
                    assertThat(error.getReason()).contains("余额不足");
                    assertThat(error.getMessage()).doesNotContain("upstream-private-body");
                });
        verify(http, times(1)).send(any(HttpRequest.class), any());
    }

    @Test
    void invalidModelKeyDoesNotReturnAppLoginUnauthorized() throws Exception {
        reply(401, "invalid key");
        assertThatThrownBy(() -> client.complete("system", "question"))
                .isInstanceOfSatisfying(LlmUpstreamException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(error.getReason()).contains("API Key 无效");
                });
        verify(http, times(1)).send(any(HttpRequest.class), any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void unsupportedOptionalParametersStillRetryWithMinimalRequest() throws Exception {
        HttpResponse<String> rejected = mock(HttpResponse.class);
        when(rejected.statusCode()).thenReturn(400);
        HttpResponse<String> accepted = mock(HttpResponse.class);
        when(accepted.statusCode()).thenReturn(200);
        when(accepted.body()).thenReturn("{\"choices\":[{\"message\":{\"content\":\"ok\"}}]}");
        when(http.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenReturn(rejected, accepted);
        assertThat(client.complete("system", "question")).isEqualTo("ok");
        verify(http, times(2)).send(any(HttpRequest.class), any());
    }

    @SuppressWarnings("unchecked")
    private void reply(int status, String body) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.body()).thenReturn(body);
        when(http.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
                .thenReturn(response);
    }
}
