package interview.homegrown.modules.studyplan.dto;

/** 规划里的一个知识点。layer 由 LLM 建议、服务端 clamp 到 [1,5]；用 Integer 容忍 LLM 偶发输出 null。 */
public record PlanPoint(String name, Integer layer, String note) {
}
