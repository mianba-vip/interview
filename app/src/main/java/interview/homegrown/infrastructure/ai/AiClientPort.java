package interview.homegrown.infrastructure.ai;
import java.util.concurrent.Flow;
/** 模型调用的流式边界，不包含适配器、提示词或编排策略。 */
public interface AiClientPort {
    Flow.Publisher<String> stream(String input);
}
