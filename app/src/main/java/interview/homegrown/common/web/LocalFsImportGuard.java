package interview.homegrown.common.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * 本地文件系统导入守卫：凡是"由服务端直接读本地磁盘"的端点（corpus from-path、
 * project import-path）都必须先过这道闸。
 *
 * <p>背景：这类端点是为<b>桌面端本地模式</b>设计的（后端就跑在用户自己电脑上，
 * 读的是用户自己的盘）。但端点本身对任何已登录用户开放——若后端部署在公网服务器，
 * 任意用户都能让服务器扫描 /etc、/opt/&lt;部署目录&gt; 等任意路径，文件内容经 LLM
 * 分析后还会从状态接口回显，等于服务器任意文件读取。
 *
 * <p>策略（默认安全，零配置）：
 * <ul>
 *   <li>只有<b>回环地址</b>的直接请求（桌面本地模式 SPA → 127.0.0.1:23333，或本机
 *       开发时 vite 代理 → localhost）放行；</li>
 *   <li>经 nginx 反代 / 公网直连的请求 remoteAddr 均非回环，一律 403；</li>
 *   <li>确有"后端跑在局域网另一台机器"的场景，设 {@code APP_LOCAL_FS_ALLOW_REMOTE=true}
 *       显式放开（此时路径内容安全完全由部署者自己负责）。</li>
 * </ul>
 * 云端桌面端不受影响：它走的是 Electron 在<b>用户本机</b>读盘后上传字节的
 * from-files / import-zip 通道，不读服务器磁盘。
 */
@Component
public class LocalFsImportGuard {

    private final boolean allowRemote;

    public LocalFsImportGuard(@Value("${app.local-fs.allow-remote:false}") boolean allowRemote) {
        this.allowRemote = allowRemote;
    }

    /** 非回环调用且未显式放开时抛 403。feature 用于拼错误信息，如 "本地路径导入"。 */
    public void requireLocalCaller(String feature) {
        if (allowRemote) {
            return;
        }
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes sra) {
            if (isLoopback(sra.getRequest().getRemoteAddr())) {
                return;
            }
            throw new ResponseStatusException(FORBIDDEN,
                    feature + "只允许本机（桌面本地模式）调用：该接口会读取服务器本地磁盘，已对远程请求关闭");
        }
        // 非 HTTP 上下文（定时任务 / 内部调用）没有"远程攻击面"，放行。
    }

    private static boolean isLoopback(String addr) {
        if (addr == null) {
            return false;
        }
        return "127.0.0.1".equals(addr)
                || "::1".equals(addr)
                || "0:0:0:0:0:0:0:1".equals(addr);
    }
}
