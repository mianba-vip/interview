package interview.homegrown.modules.drill.grader;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.modules.drill.domain.QuestionBank;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** 选择题判分：文本输入形态下的字母容错与选项文本匹配（免 LLM、精确比对）。 */
class GraderMcqTest {

    private final GraderMcq grader = new GraderMcq(new ObjectMapper());

    private QuestionBank question() {
        QuestionBank qb = new QuestionBank();
        qb.setConceptIds(new Integer[]{1});
        qb.setMcqOptionsJson("[{\"key\":\"A\",\"text\":\"甲说法\",\"correct\":false},"
                + "{\"key\":\"B\",\"text\":\"乙说法\",\"correct\":true},"
                + "{\"key\":\"C\",\"text\":\"丙说法\",\"correct\":false},"
                + "{\"key\":\"D\",\"text\":\"丁说法\",\"correct\":false}]");
        return qb;
    }

    private double score(String answer) {
        return grader.grade(1L, question(), answer, false).rawScore().doubleValue();
    }

    @Test
    @DisplayName("字母作答容错：B / b. / 选B / 答案:B 判对，A 判错")
    void letterInputs() {
        assertThat(score("B")).isEqualTo(100.0);
        assertThat(score("b.")).isEqualTo(100.0);
        assertThat(score("选B")).isEqualTo(100.0);
        assertThat(score("答案:B")).isEqualTo(100.0);
        // 多选语义：错选 A 但未误选 C/D，按对错项比例只得 50 分（等级仍判不过）
        assertThat(score("A")).isEqualTo(50.0);
    }

    @Test
    @DisplayName("直接输入选项文本判对；选错组合按对错项比例给分")
    void textMatchAndPartial() {
        assertThat(score("乙说法")).isEqualTo(100.0);
        assertThat(score("A C")).isEqualTo(25.0);
    }
}
