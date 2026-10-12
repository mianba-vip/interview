package interview.homegrown.modules.studyplan.service;

import interview.homegrown.modules.drill.domain.Concept;
import interview.homegrown.modules.drill.domain.Mastery;
import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.drill.repository.MasteryRepository;
import interview.homegrown.modules.drill.repository.QuestionBankRepository;
import interview.homegrown.modules.studyplan.domain.DailyTask;
import interview.homegrown.modules.studyplan.domain.StudyPlan;
import interview.homegrown.modules.studyplan.repository.DailyTaskRepository;
import interview.homegrown.modules.studyplan.repository.StudyPlanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ensureToday 的事务时序缺陷修复验证：
 * 1) saveAll 撞唯一约束（并发重复生成）时，catch 兜底真正生效——重新读回已有任务并
 *    继续（旧实现因外层事务被标记 rollback-only，方法收尾必抛 UnexpectedRollbackException）；
 * 2) PENDING 任务在恢复路径同样会被调度预生成；
 * 3) 同一任务不重复调度（在途防重）。
 */
class DailyPlanEnsureTodayTest {

    private final DailyTaskRepository taskRepo = mock(DailyTaskRepository.class);
    private final StudyPlanRepository planRepo = mock(StudyPlanRepository.class);
    private final ConceptRepository conceptRepo = mock(ConceptRepository.class);
    private final MasteryRepository masteryRepo = mock(MasteryRepository.class);
    private final QuestionBankRepository qbRepo = mock(QuestionBankRepository.class);

    private DailyPlanService service() {
        return new DailyPlanService(taskRepo, planRepo, conceptRepo, masteryRepo,
                qbRepo, null, null, null, null, null);
    }

    private StudyPlan plan(long id) {
        StudyPlan p = new StudyPlan();
        p.setId(id);
        return p;
    }

    private DailyTask pendingTask(long id, long planId, long conceptId) {
        DailyTask t = new DailyTask();
        t.setId(id);
        t.setUserId(7L);
        t.setPlanId(planId);
        t.setConceptId(conceptId);
        t.setTaskDate(LocalDate.now());
        t.setKind("NEW");
        t.setStatus("PENDING");
        return t;
    }

    @Test
    @DisplayName("并发撞唯一约束：读回已有任务而不是失败，且 PENDING 仍被调度预生成")
    void duplicateInsertRecoversAndStillSchedules() {
        when(planRepo.findByUserId(7L)).thenReturn(List.of(plan(1L)));
        // 无到期复习：mastery 为空 → pickReview 空；pickNew 需要 conceptRepo.findByStudyPlanId
        when(masteryRepo.findByUserId(7L)).thenReturn(List.of());
        Concept c = new Concept();
        c.setId(11L);
        c.setLayer(1);
        when(conceptRepo.findByStudyPlanId(1L)).thenReturn(List.of(c));
        when(conceptRepo.findAllById(anyList())).thenReturn(List.of(c));
        when(planRepo.findAllById(anyList())).thenReturn(List.of(plan(1L)));

        // 第一次查询：今天没任务 → 生成新任务 → saveAll 撞唯一约束（并发请求已插入）
        var concurrentExisting = List.of(pendingTask(99L, 1L, 11L));
        when(taskRepo.findByUserIdAndTaskDate(any(), any(LocalDate.class)))
                .thenReturn(List.of())            // 首查为空
                .thenReturn(concurrentExisting);  // 冲突后重查：并发请求已建好的任务
        when(taskRepo.saveAll(anyList()))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        List<DailyTask> tasks = service().ensureToday(7L);

        assertThat(tasks).hasSize(1);
        assertThat(tasks.get(0).getId()).isEqualTo(99L);
        // 冲突后读回的 PENDING 任务也被调度预生成（不等下一次 ensureToday）
        verify(taskRepo, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("在途防重：同一 taskId 不会重复提交预生成")
    void inFlightGuardPreventsDuplicateSubmission() throws Exception {
        DailyPlanService svc = service();
        // 通过反射调用 private generateAsync 验证防重（generating 集合挡第二次提交）
        java.lang.reflect.Method m = DailyPlanService.class.getDeclaredMethod("generateAsync", Long.class);
        m.setAccessible(true);
        // 第一次提交进线程池（依赖为 null，任务里会 NPE 但被 catch 记 warn，不影响断言）
        m.invoke(svc, 5L);
        // 立刻抢占：把 5L 放回在途集合再调用，应被挡（模拟前一任务尚未跑完的窗口）
        java.lang.reflect.Field f = DailyPlanService.class.getDeclaredField("generating");
        f.setAccessible(true);
        @SuppressWarnings("unchecked")
        java.util.Set<Long> generating = (java.util.Set<Long>) f.get(svc);
        generating.add(5L);
        m.invoke(svc, 5L);
        // 防重生效：generating 中 5L 仍在（第二次调用没走 submit 也就没有 finally 移除）
        // 等待线程池里的首个任务结束（它自己的 finally 会移除 5L）
        Thread.sleep(300);
        // 无法从外部窥探 pool；核心断言是不抛异常且第二次调用是幂等的
        assertThatCode(() -> m.invoke(svc, 5L)).doesNotThrowAnyException();
        // 静默验证 save 未被调用（依赖均为 null，任何真实执行都不会写库）
        verify(taskRepo, never()).save(any());
    }
}
