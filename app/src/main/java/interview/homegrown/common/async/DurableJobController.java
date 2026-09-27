package interview.homegrown.common.async;

import interview.homegrown.common.ai.AiSettingsService;
import interview.homegrown.common.exception.BusinessException;
import interview.homegrown.common.exception.ErrorCode;
import interview.homegrown.common.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 用户可查看任务状态及失败原因，并手动重试自己的死信任务。 */
@RestController
@RequestMapping("/api/async-jobs")
public class DurableJobController {
    private final DurableJobStore store;
    private final DurableJobQueue queue;
    private final AiSettingsService settings;

    public DurableJobController(DurableJobStore store, DurableJobQueue queue, AiSettingsService settings) {
        this.store = store;
        this.queue = queue;
        this.settings = settings;
    }

    @GetMapping
    public Result<List<DurableJobStore.JobStatus>> list() {
        Long userId = requireUser();
        queue.rememberRequestConfig(userId);
        return Result.success(store.listForUser(userId));
    }

    @PostMapping("/{id}/retry")
    public Result<Void> retry(@PathVariable Long id) {
        Long userId = requireUser();
        queue.rememberRequestConfig(userId);
        if (!store.retryDead(id, userId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "任务不存在、不是失败状态或不属于当前用户");
        }
        return Result.success();
    }

    private Long requireUser() {
        Long userId = settings.currentUserId();
        if (userId == null) throw new BusinessException(ErrorCode.UNAUTHORIZED, "请先登录");
        return userId;
    }
}
