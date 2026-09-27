package interview.homegrown.common.async;

import interview.homegrown.common.ai.AiConfig;
import interview.homegrown.common.ai.AiSettingsService;
import interview.homegrown.modules.drill.service.CorpusIndexer;
import interview.homegrown.modules.drill.service.DailyPlanService;
import interview.homegrown.modules.project.service.ProjectAnalysisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DurableJobWorkerTest {
    @Test
    @DisplayName("没有桌面密钥时等待配置，不把它当作失败重试")
    void missingKeyWaits() {
        DurableJobStore store = mock(DurableJobStore.class);
        DurableJobQueue queue = mock(DurableJobQueue.class);
        DurableJob job = new DurableJob(1L, DurableJobType.PROJECT_ANALYSIS, 19L, 7L, 1, 3, false, UUID.randomUUID());
        when(store.deadLetterExpired()).thenReturn(List.of());
        when(store.claim()).thenReturn(Optional.of(job));
        DurableJobWorker worker = new DurableJobWorker(store, queue, mock(AiSettingsService.class),
                mock(ProjectAnalysisService.class), mock(CorpusIndexer.class), mock(DailyPlanService.class));
        try {
            worker.poll();
            verify(store, timeout(3000)).waitForConfig(job);
            verify(store, never()).fail(any(), any());
        } finally {
            worker.shutdown();
        }
    }

    @Test
    @DisplayName("领取任务后执行项目分析并确认完成")
    void completesProjectJob() {
        DurableJobStore store = mock(DurableJobStore.class);
        DurableJobQueue queue = mock(DurableJobQueue.class);
        AiSettingsService settings = mock(AiSettingsService.class);
        ProjectAnalysisService projects = mock(ProjectAnalysisService.class);
        DurableJob job = new DurableJob(2L, DurableJobType.PROJECT_ANALYSIS, 19L, 7L, 1, 3, false, UUID.randomUUID());
        when(store.deadLetterExpired()).thenReturn(List.of());
        when(store.claim()).thenReturn(Optional.of(job));
        when(queue.configFor(7L)).thenReturn(new AiConfig("qwen", "https://example.invalid", "key", "test", 0.2, null));
        doAnswer(call -> { call.<Runnable>getArgument(1).run(); return null; })
                .when(settings).withTaskConfig(any(), any());
        DurableJobWorker worker = new DurableJobWorker(store, queue, settings, projects,
                mock(CorpusIndexer.class), mock(DailyPlanService.class));
        try {
            worker.poll();
            verify(projects, timeout(3000)).runJob(19L, 7L);
            verify(store, timeout(3000)).complete(job);
        } finally {
            worker.shutdown();
        }
    }
}
