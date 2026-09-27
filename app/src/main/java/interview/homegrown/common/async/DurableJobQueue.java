package interview.homegrown.common.async;

import interview.homegrown.common.ai.AiConfig;
import interview.homegrown.common.ai.AiSettingsService;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/** 生产端与临时 BYOK 配置。密钥只在当前进程内短暂保留，不写入任务表。 */
@Component
public class DurableJobQueue {
    private final DurableJobStore store;
    private final AiSettingsService settings;
    private final ConcurrentHashMap<Long, CachedConfig> requestConfigs = new ConcurrentHashMap<>();

    public DurableJobQueue(DurableJobStore store, AiSettingsService settings) {
        this.store = store;
        this.settings = settings;
    }

    public void enqueue(DurableJobType type, Long entityId, Long userId, boolean refresh, boolean retry) {
        rememberRequestConfig(userId);
        store.enqueue(type, entityId, userId, refresh, retry);
    }

    public void rememberRequestConfig(Long userId) {
        if (userId == null) return;
        AiConfig config = settings.currentProviderForRequest();
        if (config != null && config.apiKey() != null && !config.apiKey().isBlank()) {
            AiConfig stored = settings.userConfig(userId);
            if (stored == null || !config.apiKey().equals(stored.apiKey())) {
                requestConfigs.put(userId, new CachedConfig(config, System.currentTimeMillis() + 30 * 60_000L));
            } else {
                requestConfigs.remove(userId);
            }
            store.wakeWaiting(userId);
        }
    }

    public AiConfig configFor(Long userId) {
        CachedConfig cached = requestConfigs.get(userId);
        if (cached != null && cached.expiresAt() <= System.currentTimeMillis()) {
            requestConfigs.remove(userId, cached);
            cached = null;
        }
        if (cached != null) return cached.config();
        AiConfig configured = settings.userConfig(userId);
        return configured != null && configured.apiKey() != null && !configured.apiKey().isBlank()
                ? configured : null;
    }

    private record CachedConfig(AiConfig config, long expiresAt) {}
}
