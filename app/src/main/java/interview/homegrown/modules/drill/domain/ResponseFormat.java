package interview.homegrown.modules.drill.domain;

/** 用户产出答案的形态。这是"题型"被消解的关键维度——Grader 按它分策略。 */
public enum ResponseFormat {
    FREE_TEXT,   // 自由文本（LLM 逐点判分）
    CHOICE,      // 单选题（精确比对，不走 LLM）
    MULTI,       // 多选题（字母集合精确比对；漏选/错选按选项计部分分，非满分走引导评分）
    JUDGE,       // 判断题（对/错二选一；一个说法判真伪，天然适配 TRAP 探针）
    STRUCTURED,  // 结构化字段（按 schema 逐条 rubric）
    CODE         // 代码（relay 力扣判题，不走 LLM）
}
