package interview.homegrown.common.observability;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.AsyncHandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Map;

/** Session IDs belong in searchable logs/traces, never in metric labels. */
@Configuration
public class SessionCorrelationConfig implements WebMvcConfigurer {
    private final ObjectProvider<Tracer> tracer;

    public SessionCorrelationConfig(ObjectProvider<Tracer> tracer) {
        this.tracer = tracer;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AsyncHandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                Object requestId = request.getAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE);
                Tracer activeTracer = tracer.getIfAvailable();
                Span span = activeTracer == null ? null : activeTracer.currentSpan();
                if (span != null && requestId instanceof String id) span.tag("request.id", id);
                Object variables = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
                if (variables instanceof Map<?, ?> route) {
                    Object value = route.get("sessionId");
                    if (value instanceof String sessionId && sessionId.matches("[A-Za-z0-9_-]{1,64}")) {
                        MDC.put("sessionId", sessionId);
                        if (span != null) span.tag("session.id", sessionId);
                    }
                }
                return true;
            }

            @Override
            public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                        Object handler, Exception exception) {
                MDC.remove("sessionId");
            }

            @Override
            public void afterConcurrentHandlingStarted(HttpServletRequest request,
                                                       HttpServletResponse response, Object handler) {
                MDC.remove("sessionId");
            }
        });
    }
}
