package interview.homegrown.modules.studyplan.web;

import com.fasterxml.jackson.databind.JsonNode;
import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.modules.studyplan.repository.KgForgeRunRepository;
import interview.homegrown.modules.studyplan.service.ForgeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 知识图谱锻造（先教后考的上游）：一句方向 → sidecar 批产概念树提案 → 人工审核 → 落库。
 * 全部端点走默认 JWT 链（/api/** authenticated）。
 */
@RestController
@RequestMapping("/api/forge")
public class ForgeController {

    private final ForgeService forge;
    private final KgForgeRunRepository runRepo;

    public ForgeController(ForgeService forge, KgForgeRunRepository runRepo) {
        this.forge = forge;
        this.runRepo = runRepo;
    }

    public record ForgeCreateRequest(Long planId, String topic, String goal, Integer layerBudget) {}

    /** 触发一次锻造（入队异步执行，立即返回 runId；前端轮询 GET /{id}）。 */
    @PostMapping("/runs")
    public Map<String, Object> create(@RequestBody ForgeCreateRequest req) {
        return forge.create(CurrentUser.id(), req.planId(), req.topic(), req.goal(), req.layerBudget());
    }

    @GetMapping("/runs")
    public List<Map<String, Object>> list() {
        Long uid = CurrentUser.id();
        return runRepo.findByUserIdOrderByIdDesc(uid).stream()
                .map(r -> Map.<String, Object>of(
                        "id", r.getId(),
                        "topic", r.getTopic(),
                        "status", r.getStatus(),
                        "conceptCount", r.getConceptCount()))
                .toList();
    }

    /** 轮询状态：RUNNING / AWAITING_REVIEW（含 concepts+report 审核载荷）/ 终态。 */
    @GetMapping("/runs/{id}")
    public Map<String, Object> state(@PathVariable Long id) {
        return forge.getState(CurrentUser.id(), id);
    }

    /** 批准（携带用户在审核页编辑后的提案）；返回实际写入数与被去重跳过的清单。 */
    @PostMapping("/runs/{id}/approve")
    public Map<String, Object> approve(@PathVariable Long id, @RequestBody JsonNode body) {
        return forge.approve(CurrentUser.id(), id, body.path("concepts"));
    }

    @PostMapping("/runs/{id}/reject")
    public Map<String, Object> reject(@PathVariable Long id) {
        return forge.reject(CurrentUser.id(), id);
    }
}
