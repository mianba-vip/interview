package interview.homegrown.modules.project.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * zip 解压防护：路径穿越（原有）+ 条目数 / 解压总量 / 单文件大小 / 压缩比（新增）。
 * 用真实 ZipOutputStream 构造包，验证正常包照常解压、恶意包被拒绝且不留垃圾文件。
 */
class ProjectUnzipGuardTest {

    @TempDir
    Path tmp;

    private ProjectAnalysisService service() throws Exception {
        // unzip 不触碰任何依赖，全部传 null 即可
        var ctor = ProjectAnalysisService.class.getDeclaredConstructors()[0];
        Object[] args = new Object[ctor.getParameterCount()];
        ctor.setAccessible(true);
        return (ProjectAnalysisService) ctor.newInstance(args);
    }

    /** 反射调用私有 unzip；把 InvocationTargetException 解包为原始 IOException，断言才能看到真实消息。 */
    private void unzip(byte[] zipBytes) throws Throwable {
        var m = ProjectAnalysisService.class.getDeclaredMethod("unzip", java.io.InputStream.class, Path.class);
        m.setAccessible(true);
        try {
            m.invoke(service(), new ByteArrayInputStream(zipBytes), tmp.resolve("out"));
        } catch (java.lang.reflect.InvocationTargetException e) {
            throw e.getCause();
        }
    }

    private static byte[] zip(java.util.function.Consumer<ZipOutputStream> writer) throws IOException {
        var bos = new java.io.ByteArrayOutputStream();
        try (var zos = new ZipOutputStream(bos)) {
            writer.accept(zos);
        }
        return bos.toByteArray();
    }

    @Test
    @DisplayName("正常 zip：照常解压，内容一致")
    void normalZipExtracts() throws Throwable {
        byte[] z = zip(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("src/Main.java"));
                zos.write("class Main {}".getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
                zos.putNextEntry(new ZipEntry("docs/"));
                zos.closeEntry();
            } catch (IOException ignored) {
            }
        });
        unzip(z);
        assertThat(tmp.resolve("out/src/Main.java")).hasContent("class Main {}");
    }

    @Test
    @DisplayName("路径穿越（zip slip）仍被拒绝")
    void zipSlipRejected() throws Throwable {
        byte[] z = zip(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("../../etc/pwned.txt"));
                zos.write("x".repeat(10).getBytes());
                zos.closeEntry();
            } catch (IOException ignored) {
            }
        });
        assertThatThrownBy(() -> unzip(z))
                .hasMessageContaining("zip");
    }

    @Test
    @DisplayName("压缩比异常（高倍率同内容）被判定为 zip bomb 拒绝")
    void ratioBombRejected() throws Throwable {
        // 1MB 同字符内容压缩后约 1KB → 比率远超 100
        byte[] z = zip(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("bomb.txt"));
                zos.write("0".repeat(1024 * 1024).getBytes());
                zos.closeEntry();
            } catch (IOException ignored) {
            }
        });
        assertThatThrownBy(() -> unzip(z))
                .hasMessageContaining("疑似 zip bomb");
    }

    @Test
    @DisplayName("条目数超限被拒绝")
    void tooManyEntriesRejected() throws Throwable {
        int over = ProjectAnalysisService.MAX_ZIP_ENTRIES + 1;
        byte[] z = zip(zos -> {
            try {
                for (int i = 0; i < over; i++) {
                    zos.putNextEntry(new ZipEntry("f" + i + ".txt"));
                    zos.write("a".getBytes());
                    zos.closeEntry();
                }
            } catch (IOException ignored) {
            }
        });
        assertThatThrownBy(() -> unzip(z))
                .hasMessageContaining("条目过多");
    }

    @Test
    @DisplayName("中途被拒后不残留 .part 临时文件")
    void noTempLeftoversAfterRejection() throws Throwable {
        byte[] z = zip(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("ok.txt"));
                zos.write("fine".getBytes());
                zos.closeEntry();
                zos.putNextEntry(new ZipEntry("bomb.txt"));
                zos.write("7".repeat(1024 * 1024).getBytes());
                zos.closeEntry();
            } catch (IOException ignored) {
            }
        });
        assertThatThrownBy(() -> unzip(z)).hasMessageContaining("zip");
        try (var s = Files.list(tmp.resolve("out"))) {
            assertThat(s.filter(p -> p.getFileName().toString().endsWith(".part"))).isEmpty();
        }
    }
}
