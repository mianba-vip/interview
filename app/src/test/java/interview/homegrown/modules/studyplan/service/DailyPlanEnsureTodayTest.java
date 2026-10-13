package interview.homegrown.modules.studyplan.service;

import interview.homegrown.common.async.DurableJobQueue;
import interview.homegrown.common.async.DurableJobType;
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ensureToday 的事务时序缺陷修复验证：
 * 1) saveAll 撞唯一约束（并发重复生成）时，catch 兜底真正生效——重新读回已有任务并
 *    继续（旧实现因外层事务被标记 rollback-only，方法收尾必抛 UnexpectedRollbackException）；
 * 2) PENDING 任务在恢复路径同样会被调度预生成（入队持久异步队列）；
 * 3) 只有 PENDING 且未出题的任务入队（重复入队的防重由队列幂等键 ON CONFLICT 保证）。
 */
class DailyPlanEnsureTodayTest {

    private final DailyTaskRepository taskRepo = mock(DailyTaskRepository.class);
    private final StudyPlanRepository planRepo = mock(StudyPlanRepository.class);
    private final ConceptRepository conceptRepo = mock(ConceptRepository.class);
    private final MasteryRepository masteryRepo = mock(MasteryRepository.class);
    private final QuestionBankRepository qbRepo = mock(QuestionBankRepository.class);
    private final DurableJobQueue jobs = mock(DurableJobQueue.class);

    private DailyPlanService service() {
        return new DailyPlanService(taskRepo, planRepo, conceptRepo, masteryRepo,
                qbRepo, null, null, null, null, null, null, jobs, null);
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
        when(conceptRepo.findAllById(any())).thenReturn(List.of(c));
        when(planRepo.findAllById(any())).thenReturn(List.of(plan(1L)));

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
        verify(jobs, times(1)).enqueue(DurableJobType.DAILY_QUESTION, 99L, 7L, false, false);
        verify(taskRepo, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("入队调度：仅 PENDING 且未出题的任务入队，DONE/已出题不入队")
    void schedulesOnlyPendingWithoutQuestion() {
        when(planRepo.findByUserId(7L)).thenReturn(List.of(plan(1L)));
        when(masteryRepo.findByUserId(7L)).thenReturn(List.of());
        when(conceptRepo.findByStudyPlanId(1L)).thenReturn(List.of());   // 无新概念 → 不新建任务
        Concept c = new Concept();
        c.setId(11L);
        c.setLayer(1);
        when(conceptRepo.findAllById(any())).thenReturn(List.of(c)); // 概念存在 → 不判孤儿
        when(planRepo.findAllById(any())).thenReturn(List.of(plan(1L)));

        DailyTask pending = pendingTask(5L, 1L, 11L);
        DailyTask done = pendingTask(6L, 1L, 11L);
        done.setStatus("DONE");
        DailyTask ready = pendingTask(7L, 1L, 11L);
        ready.setQuestionId(88L);
        ready.setStatus("READY");
        when(taskRepo.findByUserIdAndTaskDate(any(), any(LocalDate.class)))
                .thenReturn(List.of(pending, done, ready));

        service().ensureToday(7L);

        // 防重语义：服务侧只负责「PENDING 且未出题才入队」；同一任务重复入队由
        // 队列的幂等键（ON CONFLICT DO NOTHING）挡住，不再需要内存里的在途集合
        verify(jobs, times(1)).enqueue(DurableJobType.DAILY_QUESTION, 5L, 7L, false, false);
        verify(jobs, never()).enqueue(eq(DurableJobType.DAILY_QUESTION), eq(6L), any(), anyBoolean(), anyBoolean());
        verify(jobs, never()).enqueue(eq(DurableJobType.DAILY_QUESTION), eq(7L), any(), anyBoolean(), anyBoolean());
        verify(taskRepo, never()).save(any());
    }
}
