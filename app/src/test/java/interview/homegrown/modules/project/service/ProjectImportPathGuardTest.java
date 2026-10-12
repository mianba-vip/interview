package interview.homegrown.modules.project.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** import-path 的系统目录 deny-list：修复"任意已登录用户读取服务器目录"的第二道闸。 */
class ProjectImportPathGuardTest {

    @Test
    @DisplayName("系统目录（含子孙）一律拒绝")
    void systemRootsRejected() {
        // Windows 盘符路径在 unix 上不是分隔路径（startsWith 比较失效），只在 Windows 跑
        java.util.List<String> roots = new java.util.ArrayList<>(java.util.List.of(
                "/etc", "/etc/nginx/nginx.conf", "/usr/local",
                "/proc/self/environ", "/root/.ssh", "/run/systemd",
                "/System/Library", "/private/etc/hosts"));
        if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            roots.add("C:\\Windows\\System32");
        }
        for (String p : roots) {
            assertThatThrownBy(() -> ProjectAnalysisService.assertNotSystemDir(Paths.get(p)))
                    .as("应拒绝系统目录: %s", p)
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    @Test
    @DisplayName("普通用户目录不误伤")
    void userDirsAllowed() {
        assertThatCode(() -> ProjectAnalysisService.assertNotSystemDir(
                Paths.get("/Users/dev/projects/interview"))).doesNotThrowAnyException();
        assertThatCode(() -> ProjectAnalysisService.assertNotSystemDir(
                Paths.get("/home/dev/workspace/demo"))).doesNotThrowAnyException();
        assertThatCode(() -> ProjectAnalysisService.assertNotSystemDir(
                Paths.get("C:\\Users\\dev\\code\\demo"))).doesNotThrowAnyException();
    }
}
