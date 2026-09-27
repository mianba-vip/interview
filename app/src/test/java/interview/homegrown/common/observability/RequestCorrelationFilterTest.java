package interview.homegrown.common.observability;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class RequestCorrelationFilterTest {
    @Test
    @DisplayName("合法请求 ID 回传给客户端并在请求结束后清理 MDC")
    void propagatesAndClearsRequestId() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/interviews/sessions");
        request.addHeader("X-Request-ID", "request_12345");
        var response = new MockHttpServletResponse();
        var during = new AtomicReference<String>();

        new RequestCorrelationFilter().doFilter(request, response,
                (req, res) -> during.set(MDC.get("requestId")));

        assertThat(during.get()).isEqualTo("request_12345");
        assertThat(response.getHeader("X-Request-ID")).isEqualTo("request_12345");
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    @DisplayName("不信任超长请求 ID，自动生成新 ID 防止污染日志")
    void rejectsUnsafeRequestId() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/interviews/sessions");
        request.addHeader("X-Request-ID", "a".repeat(200) + "\nforged");
        var response = new MockHttpServletResponse();
        new RequestCorrelationFilter().doFilter(request, response, (req, res) -> {});
        assertThat(response.getHeader("X-Request-ID")).hasSize(36).doesNotContain("forged");
    }
}
