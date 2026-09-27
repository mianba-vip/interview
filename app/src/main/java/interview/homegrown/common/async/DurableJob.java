package interview.homegrown.common.async;

import java.util.UUID;

public record DurableJob(Long id, DurableJobType type, Long entityId, Long userId,
                         int attempts, int maxAttempts, boolean refreshRequested, UUID leaseToken) {
}
