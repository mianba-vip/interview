package interview.homegrown.common.web;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 本地文件系统导入守卫：回环放行、远程 403、显式放开后全放行。
 * 这是修复"公网服务器任意目录读取"的关键闸门，必须有测试钉住行为。
 */
class LocalFsImportGuardTest {

    @AfterEach
    void clean() {
        RequestContextHolder.resetRequestAttributes();
    }

    private static void withRemoteAddr(String addr) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr(addr);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    }

    @Test
    @DisplayName("回环地址（桌面本地模式）放行：127.0.0.1 / ::1")
    void loopbackAllowed() {
        LocalFsImportGuard guard = new LocalFsImportGuard(false);
        withRemoteAddr("127.0.0.1");
        assertThatCode(() -> guard.requireLocalCaller("本地路径导入")).doesNotThrowAnyException();
        withRemoteAddr("::1");
        assertThatCode(() -> guard.requireLocalCaller("本地路径导入")).doesNotThrowAnyException();
        withRemoteAddr("0:0:0:0:0:0:0:1");
        assertThatCode(() -> guard.requireLocalCaller("本地路径导入")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("非回环（公网 / nginx 反代）默认 403")
    void remoteRejectedByDefault() {
        LocalFsImportGuard guard = new LocalFsImportGuard(false);
        withRemoteAddr("203.0.113.7");
        assertThatThrownBy(() -> guard.requireLocalCaller("本地路径导入"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
        // nginx 容器桥接地址同样拦截
        withRemoteAddr("172.17.0.5");
        assertThatThrownBy(() -> guard.requireLocalCaller("本地路径导入"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("APP_LOCAL_FS_ALLOW_REMOTE=true 时远程也放行（部署者自担风险）")
    void remoteAllowedWhenExplicitlyEnabled() {
        LocalFsImportGuard guard = new LocalFsImportGuard(true);
        withRemoteAddr("203.0.113.7");
        assertThatCode(() -> guard.requireLocalCaller("本地路径导入")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("非 HTTP 上下文（内部调用）放行")
    void nonHttpContextAllowed() {
        LocalFsImportGuard guard = new LocalFsImportGuard(false);
        RequestContextHolder.resetRequestAttributes();
        assertThatCode(() -> guard.requireLocalCaller("本地路径导入")).doesNotThrowAnyException();
    }
}
