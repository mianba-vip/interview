package interview.homegrown.common.ai;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** 模型服务的 HTTP 错误，与模型生成了不可解析的 JSON 区分处理。 */
public class LlmUpstreamException extends ResponseStatusException {
    private final int upstreamStatus;

    public LlmUpstreamException(int upstreamStatus) {
        super(clientStatus(upstreamStatus), userMessage(upstreamStatus));
        this.upstreamStatus = upstreamStatus;
    }

    public int getUpstreamStatus() {
        return upstreamStatus;
    }

    private static HttpStatus clientStatus(int status) {
        // 模型 Key 失效不是面霸登录失效，不能向前端返回 401 并清除用户会话。
        if (status == 402) return HttpStatus.PAYMENT_REQUIRED;
        if (status == 429) return HttpStatus.TOO_MANY_REQUESTS;
        return status >= 500 ? HttpStatus.BAD_GATEWAY : HttpStatus.BAD_REQUEST;
    }

    private static String userMessage(int status) {
        return switch (status) {
            case 401 -> "模型服务 API Key 无效或已过期，请到「设置」检查并更新";
            case 402 -> "模型服务余额不足或额度已用尽，请在供应商处补充额度，或到「设置」切换可用的 API Key";
            case 403 -> "当前 API Key 无权使用该模型，请到「设置」检查模型权限";
            case 404 -> "模型或接口地址不存在，请到「设置」检查模型名称和服务地址";
            case 429 -> "模型服务请求过于频繁或额度受限，请稍后重试或检查供应商额度";
            default -> status >= 500
                    ? "模型服务暂时不可用（上游 HTTP " + status + "），请稍后重试"
                    : "模型服务拒绝了请求（上游 HTTP " + status + "），请检查模型、接口地址和请求配置";
        };
    }
}
