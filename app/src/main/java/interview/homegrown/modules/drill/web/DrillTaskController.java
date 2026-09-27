package interview.homegrown.modules.drill.web;

import interview.homegrown.common.web.CurrentUser;
import org.springframework.web.server.ResponseStatusException;
import interview.homegrown.modules.drill.domain.*;
import interview.homegrown.modules.studyplan.domain.DailyTask;
import interview.homegrown.modules.studyplan.dto.DailyTaskView;
import interview.homegrown.modules.studyplan.service.DailyPlanService;
import interview.homegrown.modules.drill.web.dto.*;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.*;

/**
 * 今日任务：每日自动排期的查看/开练/完成/连续下一题。
 * 从 DrillController 拆出（P1 结构重构），路径与行为完全不变。
 */
@RestController
@RequestMapping("/api/drill")
public class DrillTaskController {

    private final DailyPlanService dailyPlanService;
    private final DrillSupport support;

    public DrillTaskController(DailyPlanService dailyPlanService, DrillSupport support) {
        this.dailyPlanService = dailyPlanService;
        this.support = support;
    }

    // ------------------------------------------------------------ 今日任务（每日自动排期）

    /** 今日任务：确保生成（懒兜底）后返回列表（含预生成题干，READY 即秒开）。 */
    @GetMapping("/today")
    public List<DailyTaskView> today() {
        Long uid = CurrentUser.id();
        dailyPlanService.ensureToday(uid);
        return dailyPlanService.todayView(uid);
    }

    /**
     * 用今日任务的预生成题开 run（不调 LLM）。预生成还没好（PENDING）时现场同步出一题兜底。
     * 真正开了新 run 才把任务置 DONE（若是恢复别的活跃 run，则不消费该任务）。
     */
    @PostMapping("/task/{taskId}/start")
    public QuestionView startTask(@PathVariable Long taskId) {
        Long uid = CurrentUser.id();
        dailyPlanService.ensureReady(uid, taskId);
        DailyTask t = dailyPlanService.requireTask(uid, taskId);
        // 记录开 run 前的活跃 run：只有本次真正开了新 run（而非恢复了旧的活跃作答）才消费任务，
        // 否则用户手头挂着别的未完成作答时（即使会被搁置）任务永远不置 DONE，导致已学的题反复出现。
        Set<Long> activeBefore = support.activeLearnIds(uid);
        // 需求1：复习任务聚焦子点——开 run 时把任务的子点带给 run（后续判分/子点通过判定用）
        QuestionView view = support.openRunOnQuestion(uid, t.getQuestionId(), t.getPlanId(), t.getSubPoint());
        if (!activeBefore.contains(view.runId())) {
            dailyPlanService.markDone(taskId);
        }
        return view;
    }

    @PostMapping("/task/{taskId}/done")
    public Map<String, Object> completeTask(@PathVariable Long taskId) {
        Long uid = CurrentUser.id();
        dailyPlanService.requireTask(uid, taskId);
        dailyPlanService.markDone(taskId);
        return Map.of("ok", true);
    }

    /** 连续下一题：取今日下一个 READY 任务开 run；今日已全部完成则 404，由前端提示。 */
    @PostMapping("/next-task")
    public QuestionView nextTask() {
        Long uid = CurrentUser.id();
        dailyPlanService.ensureToday(uid);
        List<DailyTask> ready = dailyPlanService.readyTasksToday(uid);
        if (ready.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "今日任务已全部完成，去自由练习吧");
        }
        DailyTask t = ready.get(0);
        dailyPlanService.ensureReady(uid, t.getId());
        t = dailyPlanService.requireTask(uid, t.getId());
        Set<Long> activeBefore = support.activeLearnIds(uid);
        QuestionView view = support.openRunOnQuestion(uid, t.getQuestionId(), t.getPlanId());
        if (!activeBefore.contains(view.runId())) {
            dailyPlanService.markDone(t.getId());
        }
        return view;
    }

}
