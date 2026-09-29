package interview.homegrown.common.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * CORS 只暴露 CorsConfigurationSource，由 SecurityConfig 注入安全链处理。
 * 不能改回独立 CorsFilter bean：Filter bean 排在安全链之后执行，而跨域预检
 * OPTIONS 不携带任何凭证，会先被鉴权链拦成 401 且响应不带 CORS 头，浏览器/
 * WebView 直接抛 Failed to fetch（APK 因此登录后整屏失败）。
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
