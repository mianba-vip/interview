package interview.homegrown.modules.drill.service;

import interview.homegrown.modules.drill.domain.Concept;
import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.studyplan.domain.StudyPlan;
import interview.homegrown.modules.studyplan.repository.StudyPlanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 可见概念池：多用户部署下的概念隔离边界——选题、锚点伙伴、卡片关联、画像
 * 都只能看到「全局种子 + 本人方向」的概念，绝不包含其他用户的私有概念。
 */
class ConceptPoolServiceTest {

    private final ConceptRepository conceptRepo = mock(ConceptRepository.class);
    private final StudyPlanRepository planRepo = mock(StudyPlanRepository.class);
    private final ConceptPoolService pool = new ConceptPoolService(conceptRepo, planRepo);

    private static Concept concept(long id, Long planId, String name) {
        Concept c = new Concept();
        c.setId(id);
        c.setStudyPlanId(planId);
        c.setTopic("Java");
        c.setLayer(1);
        c.setName(name);
        return c;
    }

    private static StudyPlan plan(long id) {
        StudyPlan p = new StudyPlan();
        p.setId(id);
        return p;
    }

    @Test
    @DisplayName("可见池 = 全局种子 + 本人方向概念；不含其他用户的概念")
    void visiblePoolExcludesOtherUsersConcepts() {
        Concept seed = concept(1, null, "JVM 内存结构");
        Concept mine = concept(2, 100L, "我的自定义知识点");
        StudyPlan myPlan = plan(100L);
        when(conceptRepo.findByStudyPlanIdIsNull()).thenReturn(List.of(seed));
        when(planRepo.findByUserId(7L)).thenReturn(List.of(myPlan));
        when(conceptRepo.findByStudyPlanIdIn(List.of(100L))).thenReturn(List.of(mine));

        List<Concept> visible = pool.visiblePool(7L);

        assertThat(visible).extracting(Concept::getId).containsExactlyInAnyOrder(1L, 2L);
        // 其他用户的私有概念（planId=200）从未进入查询结果，池中不存在
        assertThat(visible).noneMatch(c -> c.getStudyPlanId() != null && !c.getStudyPlanId().equals(100L));
    }

    @Test
    @DisplayName("用户没有方向时，池里只剩全局种子")
    void visiblePoolSeedsOnlyWhenNoPlans() {
        Concept seed = concept(1, null, "JVM 内存结构");
        when(conceptRepo.findByStudyPlanIdIsNull()).thenReturn(List.of(seed));
        when(planRepo.findByUserId(9L)).thenReturn(List.of());

        List<Concept> visible = pool.visiblePool(9L);

        assertThat(visible).extracting(Concept::getId).containsExactly(1L);
        org.mockito.Mockito.verify(conceptRepo, org.mockito.Mockito.never()).findByStudyPlanIdIn(anyList());
    }
}
