package interview.homegrown.modules.interview.service;
    /** 模块边界示例；真实数据访问和业务实现不在公开版中。 */
    public interface InterviewService {
        SessionView createSession(String topic);
record SessionView(String id, String status) {}
    }
