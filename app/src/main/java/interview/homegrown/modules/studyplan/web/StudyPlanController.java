package interview.homegrown.modules.studyplan.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.common.web.SseStream;
import interview.homegrown.modules.studyplan.service.StudyPlanService;
import interview.homegrown.modules.studyplan.service.ConceptValidationService;
import interview.homegrown.modules.drill.web.dto.ChatMessage;
import interview.homegrown.modules.studyplan.dto.IntakeResponse;
import interview.homegrown.modules.studyplan.dto.PlanView;
import interview.homegrown.modules.studyplan.dto.StudyPlanDraft;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * 入口：学习方向（study_plan）的增与列。
 *
 * <ul>
 *   <li>POST /study-plan/intake —— 无状态多轮对话，返回 {reply, draft}<b>（已废弃，见下）</b></li>
 *   <li>POST /study-plan/confirm —— 把 draft 落库（clamp layer、同名幂等）<b>（已废弃，见下）</b></li>
 *   <li>GET  /study-plan        —— 列出我的方向（含知识点与精熟计数）</li>
 *   <li>PUT/DELETE /study-plan/{id} —— 编辑标题/目标、删除方向（用户自主权）</li>
 *   <li>POST /study-plan/{id}/concepts、PUT/DELETE /study-plan/concepts/{id} —— 增改删知识点</li>
 * </ul>
 *
 * <p><b>2026-10-21 起知识划分主链路切换为 kg-forge 锻造</b>（POST /api/forge/runs，
 * 见 {@link interview.homegrown.modules.studyplan.web.ForgeController}）：多主题并行起草
 * + 裁决 + 全局去重 + 人工审核 + 子知识点（先教后考），产出质量已由双路盲测验证优于
 * intake 单次生成。intake 对话式规划链路（intake / intake/stream / validate-candidates /
 * confirm / ai-revise）<b>标示废弃但保留不删</b>：存量用户数据与旧前端入口仍依赖它，
 * 作为锻造不可用时的回退通道；不再迭代新能力，新功能一律走 forge。</p>
 */
@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    private final StudyPlanService service;
    private final ObjectMapper objectMapper;
    private final ConceptValidationService validationService;

    public StudyPlanController(StudyPlanService service, ObjectMapper objectMapper,
                               ConceptValidationService validationService) {
        this.service = service;
        this.objectMapper = objectMapper;
        this.validationService = validationService;
    }

    /** @deprecated 2026-10-21 知识划分主链路已切换为 kg-forge 锻造（POST /api/forge/runs）。
     * 本端点保留作存量前端入口与回退通道，不再迭代；详见类注释。 */
    @Deprecated
    @PostMapping("/intake")
    public IntakeResponse intake(@RequestBody IntakeRequest req) {
        return service.intake(req.messages(), req.corpusId());
    }

    /**
     * 流式 intake（SSE）：先逐 token 推对话回复，结束后 event:draft 推草稿（信息不够则 null）。
     * 与练习聊天同款流式体验。
     *
     * @deprecated 2026-10-21 知识划分主链路已切换为 kg-forge 锻造（POST /api/forge/runs）。
     *     本端点保留作存量前端入口与回退通道，不再迭代；详见类注释。
     */
    @Deprecated
    @PostMapping(value = "/intake/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> intakeStream(@RequestBody IntakeRequest req) {
        List<ChatMessage> messages = req.messages();
        Long corpusId = req.corpusId();
        return SseStream.start(sink -> {
            // 首帧立即下发：EdgeOne 回源首包超时很短，LLM 首 token 比它慢，先占住连接。
            sink.start();
            String reply = service.intakeStream(messages, corpusId, sink::token);
            // 把流式的回复并入对话历史，再提取草稿
            List<ChatMessage> conv = new ArrayList<>(messages);
            if (reply != null && !reply.isBlank()) {
                conv.add(new ChatMessage("assistant", reply));
            }
            StudyPlanDraft draft = service.normalizeDraftForView(service.extractDraft(conv, corpusId));
            sink.event("draft", objectMapper.writeValueAsString(draft));
            sink.done();
        });
    }

    /** @deprecated 2026-10-21 属 intake 废弃链路（草稿校验）。保留作回退，不再迭代。 */
    @Deprecated
    @PostMapping("/validate-candidates")
    public ConceptValidationService.ValidationResponse validateCandidates(@RequestBody ValidateRequest req) {
        return validationService.validate(req.draft());
    }

    /** @deprecated 2026-10-21 知识划分主链路已切换为 kg-forge 锻造（审核落库走
     * POST /api/forge/runs/{id}/approve，含确定性校验与 trigram 去重）。
     * 本端点保留作存量前端入口与回退通道，不再迭代；详见类注释。 */
    @Deprecated
    @PostMapping("/confirm")
    public PlanView confirm(@RequestBody ConfirmRequest req) {
        return service.confirm(currentUserId(), req.draft());
    }

    @GetMapping
    public List<PlanView> list() {
        return service.list(currentUserId());
    }

    /**
     * 新建空方向（锻造优先流程的起点）：先建方向壳，再去「图谱锻造」
     * （POST /api/forge/runs 带 planId）往里批产概念。不属于废弃的 intake 链路。
     */
    @PostMapping
    public PlanView create(@RequestBody CreatePlanRequest req) {
        return service.createPlan(currentUserId(), req.title(), req.goal());
    }

    // ---------------------------------------------------- 用户手动编辑（自主权）

    @PutMapping("/{planId}")
    public PlanView updatePlan(@PathVariable Long planId, @RequestBody UpdatePlanRequest req) {
        return service.updatePlan(currentUserId(), planId, req.title(), req.goal());
    }

    @DeleteMapping("/{planId}")
    public Map<String, Object> deletePlan(@PathVariable Long planId) {
        service.deletePlan(currentUserId(), planId);
        return Map.of("ok", true);
    }

    @PostMapping("/{planId}/concepts")
    public PlanView addConcept(@PathVariable Long planId, @RequestBody ConceptWriteRequest req) {
        return service.addConcept(currentUserId(), planId, req.name(), req.layer(), req.note());
    }

    @PutMapping("/concepts/{conceptId}")
    public PlanView updateConcept(@PathVariable Long conceptId, @RequestBody ConceptWriteRequest req) {
        return service.updateConcept(currentUserId(), conceptId, req.name(), req.layer(), req.note());
    }

    @DeleteMapping("/concepts/{conceptId}")
    public Map<String, Object> deleteConcept(@PathVariable Long conceptId) {
        service.deleteConcept(currentUserId(), conceptId);
        return Map.of("ok", true);
    }

    /**
     * AI 补充知识点：用一句话让 AI 在现有方向下追加知识点（按名去重合并，不动已有内容）。
     *
     * @deprecated 2026-10-21 属 intake 废弃链路（单次生成的 AI 增补）。补充知识点的
     *     推荐方式是对该方向再次发起锻造（POST /api/forge/runs，会带 existing_names
     *     去重并产出子点）。保留作回退通道，不再迭代。
     */
    @Deprecated
    @PostMapping("/{planId}/ai-revise")
    public PlanView aiRevise(@PathVariable Long planId, @RequestBody AiReviseRequest req) {
        return service.aiRevise(currentUserId(), planId, req.instruction());
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new ResponseStatusException(UNAUTHORIZED, "未鉴权");
        }
        return (Long) auth.getPrincipal();
    }

    public record IntakeRequest(List<ChatMessage> messages, Long corpusId) {}
    public record ValidateRequest(StudyPlanDraft draft) {}
    public record ConfirmRequest(StudyPlanDraft draft) {}
    public record CreatePlanRequest(String title, String goal) {}
    public record UpdatePlanRequest(String title, String goal) {}
    public record ConceptWriteRequest(String name, Integer layer, String note) {}
    public record AiReviseRequest(String instruction) {}
}
