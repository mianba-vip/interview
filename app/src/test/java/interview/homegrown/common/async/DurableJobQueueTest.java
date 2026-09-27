package interview.homegrown.common.async;

import interview.homegrown.common.ai.AiConfig;
import interview.homegrown.common.ai.AiSettingsService;
import interview.homegrown.common.observability.AsyncJobTelemetry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DurableJobQueueTest {
    @Test
    @DisplayName("相同业务实体按任务类型形成幂等键且桌面密钥只保留在内存")
    void keepsDesktopConfigOutOfJobStore() {
        DurableJobStore store = mock(DurableJobStore.class);
        AiSettingsService settings = mock(AiSettingsService.class);
        AiConfig desktop = new AiConfig("qwen", "https://example.invalid", "local-secret", "qwen-test", 0.2, null);
        AiConfig empty = new AiConfig("qwen", "https://example.invalid", "", "qwen-test", 0.2, null);
        when(settings.currentProviderForRequest()).thenReturn(desktop);
        when(settings.userConfig(7L)).thenReturn(empty);

        DurableJobQueue queue = new DurableJobQueue(store, settings, mock(AsyncJobTelemetry.class));
        queue.enqueue(DurableJobType.PROJECT_ANALYSIS, 19L, 7L, false, false);

        verify(store).enqueue(DurableJobType.PROJECT_ANALYSIS, 19L, 7L, false, false);
        verify(store).wakeWaiting(7L);
        assertThat(queue.configFor(7L)).isEqualTo(desktop);
    }
}
