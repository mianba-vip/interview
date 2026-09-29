package interview.homegrown.modules.user.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;

/**
 * 两条 SecurityFilterChain，互不波及：
 *  - drillChain：仅匹配 /api/drill/** 与 /api/auth/**，drill 端点需 JWT，登录放行
 *  - defaultChain：兜底放行走 interview 等其它模块（不碰同事代码）
 */
@Configuration
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain drillSecurityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter,
                                                        CorsConfigurationSource corsConfigurationSource) throws Exception {
        // /api/demo/** 的 AI 演示端点会真调 LLM，必须收进鉴权链，防止公网裸奔烧钱
        http.securityMatcher("/api/drill/**", "/api/auth/**", "/api/user/**", "/api/settings/**", "/api/demo/**","/api/knowledge/**",
                "/api/interviews/**", "/api/resumes/**", "/api/study-plan/**", "/api/corpus/**",
                "/api/project/**")
                // 必须显式接入 CORS：预检 OPTIONS 不带凭证，要在鉴权之前短路；
                // 否则跨域（APK WebView 源为 https://localhost）的预检被 401 且无 CORS 头 → Failed to fetch
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/corpus/original/*", "/api/corpus/parsed/*").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/verify",
                                "/api/auth/send-register-code",
                                "/api/auth/config", "/api/auth/captcha/**").permitAll()
                        .requestMatchers("/api/drill/**", "/api/settings/**").authenticated()
                        .anyRequest().authenticated())
                // 未登录/令牌失效访问受保护接口 → 401（而非默认 403），前端据此自动清会话
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"code\":401,\"message\":\"未登录或登录已过期\",\"data\":null}");
                }))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /** 密码哈希：注册/登录用 BCrypt，绝不存明文。 */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
