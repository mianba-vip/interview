package interview.homegrown.modules.drill.grader;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.modules.drill.ai.McqOption;
import interview.homegrown.modules.drill.domain.ConceptRole;
import interview.homegrown.modules.drill.domain.Grade;
import interview.homegrown.modules.drill.domain.QuestionBank;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * CHOICE 判分：精确比对用户所选与正确选项，**完全不走 LLM**。
 * 客观可复现，是痛点 3 诚实画像的基石。
 */
@Component
public class GraderMcq implements Grader {

    private final ObjectMapper objectMapper;

    public GraderMcq(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public GraderOutput grade(Long runId, QuestionBank q, String rawAnswer, boolean timed) {
        // 判断题（B3）：中文作答习惯「对/错」而非字母——先归一成 A/B 再走统一比对
        if (q.getResponseFormat() == interview.homegrown.modules.drill.domain.ResponseFormat.JUDGE) {
            rawAnswer = normalizeJudgeAnswer(rawAnswer);
        }
        List<McqOption> opts = parseOptions(q.getMcqOptionsJson());
        Set<String> validKeys = new HashSet<>();
        for (McqOption o : opts) {
            if (o.key() != null && !o.key().isBlank()) validKeys.add(o.key().trim().toUpperCase());
        }
        Set<String> chosen = parseSelected(rawAnswer, validKeys);

        List<PointVerdict> results = new ArrayList<>();
        int hit = 0;
        for (var o : opts) {
            boolean selected = chosen.contains(o.key()) || matchByText(rawAnswer, o);   // 兼容直接输入选项文本
            boolean ok = (o.correct() == selected);   // 该选的选了、不该选的没选 = 正确
            if (ok) hit++;
            results.add(new PointVerdict(o.key() + ":" + o.text(), ok ? "HIT" : "MISS", rawAnswer));
        }

        if (q.getConceptIds() == null || q.getConceptIds().length == 0) {
            // 防御脏数据：concept_ids 非空数组是建表约束，这里避免脏题导致 500
            throw new IllegalArgumentException("选择题缺少 concept_ids：questionId=" + q.getId());
        }
        // MCQ 天然是单概念摸底题（arity=1），index 0 即 PRIMARY
        Long conceptId = Long.valueOf(q.getConceptIds()[0]);
        ByConcept bc = new ByConcept(conceptId, ConceptRole.PRIMARY.name(), results, List.of(), List.of());
        String byConceptJson = serialize(List.of(bc));

        BigDecimal rawScore = opts.isEmpty() ? BigDecimal.ZERO :
                BigDecimal.valueOf((double) hit / opts.size() * 100).setScale(2, RoundingMode.HALF_UP);
        Grade grade = GradeScale.toGrade(rawScore, timed);
        List<ConceptScore> scores = List.of(new ConceptScore(conceptId, ConceptRole.PRIMARY, rawScore, grade));
        return new GraderOutput(byConceptJson, rawScore, grade, scores);
    }

    private List<McqOption> parseOptions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            McqOption[] arr = objectMapper.readValue(json, McqOption[].class);
            return List.of(arr);
        } catch (Exception e) {
            return List.of();
        }
    }

    // 用户所选：逗号/空格/分号/顿号分割；每段在【去除"答案/选"等前缀与标点后】是一个
    // 「字母全部落在合法选项键内」的串，才算选择意图（容忍 “B.”“选B”“答案:B”“AC” 多选连写）。
    // 抽不出合法键的段（含英文解释整句等）不算选择，交给 matchByText 按选项文本匹配。
    //
    // 为什么必须带 validKeys 约束：旧实现把每段里所有 A-Z 字母逐个拆成键，
    // "B, because it's faster" 里 BECAUSE 会被拆出 B,E,C,A,U,S,E —— A/C 无辜被"选中"，
    // 带解释的英文作答几乎必判错。约束为"整段的字母 ⊆ 合法键"后，BECAUSE 含 E/U/S
    // 不在键内，整段判为叙述文本，只有 B 生效。
    private Set<String> parseSelected(String raw, Set<String> validKeys) {
        Set<String> set = new HashSet<>();
        if (raw == null || validKeys.isEmpty()) return set;
        // 分割符含全角逗号/分号/顿号：中文作答常用“B，因为…”
        for (String part : raw.split("[,，;；、\\s]+")) {
            String t = part.trim().toUpperCase();
            if (t.isEmpty()) continue;
            java.util.regex.Matcher m = KEY_TOKEN.matcher(t);
            if (m.matches()) {
                String letters = m.group(1);
                // 整段的字母必须全部落在合法选项键内，才算"选择意图"：
                // "AC"（多选连写）✓；"BECAUSE" 含 E/U/S ✗ → 叙述文本，不产生键
                boolean allValid = letters.chars().allMatch(c -> validKeys.contains(String.valueOf((char) c)));
                if (allValid) {
                    for (char c : letters.toCharArray()) set.add(String.valueOf(c));
                }
            }
        }
        return set;
    }

    /** "B" / "B." / "选B" / "答案:B" / "AC" 这类纯选择 token（前缀可有"答案/选"，尾部可带标点）。 */
    private static final java.util.regex.Pattern KEY_TOKEN =
            java.util.regex.Pattern.compile("^(?:答案|ANSWER|选|OPT(?:ION)?)?[:：.。\\s]*([A-Z]+)[.。,，:：\\s]*$");

    /**
     * 判断题作答归一：整段是「对/正确/是/√/T/TRUE」→ "A"（正确项约定 key=A），
     * 「错/错误/否/×/F/FALSE」→ "B"。带解释的长文本不动（交给 matchByText 或视为叙述）。
     */
    static String normalizeJudgeAnswer(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        if (t.matches("(?i)^(?:答案|选|判断)?[:：.。\\s]*(对|正确|是|√|T|TRUE|A)[.。,，:：\\s!！]*$")) return "A";
        if (t.matches("(?i)^(?:答案|选|判断)?[:：.。\\s]*(错|错误|否|×|F|FALSE|B)[.。,，:：\\s!！]*$")) return "B";
        return raw;
    }

    /** 用户直接粘贴/输入了选项原文：整段包含该选项文本（≥2 字）也视为选中。 */
    private boolean matchByText(String raw, McqOption o) {
        if (raw == null || o.text() == null || o.text().trim().length() < 2) return false;
        return raw.trim().contains(o.text().trim());
    }

    private String serialize(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            throw new IllegalStateException("判分结果序列化失败", e);
        }
    }
}
