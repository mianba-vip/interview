package interview.homegrown.modules.drill.web.dto;

/**
 * 判分响应：服务端算出的 rawScore + FSRS 档 + 统一 byConcept 明细。
 *
 * @param mcqCorrect 选择题正确项字母（如 "AC"）：仅随判分结果下发，供前端做
 *                   「你选了 X / 正确答案 Y」的选项级对照；非选择题为 null。
 *                   绝不随题目元数据提前下发——判分前泄露正确项等于送分。
 */
public record GradeView(Long runId, Long questionId, double rawScore, String grade, String byConceptJson,
                        String mcqCorrect) {
}