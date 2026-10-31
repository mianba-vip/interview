package interview.homegrown.common.exception;
/** 公开契约有意不提供生产实现。 */
public class CoreNotPublishedException extends UnsupportedOperationException {
    public CoreNotPublishedException(String module) {
        super(module + "核心实现未包含在公开展示版中");
    }
}
