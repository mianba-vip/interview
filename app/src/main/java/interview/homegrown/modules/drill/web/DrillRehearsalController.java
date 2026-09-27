package interview.homegrown.modules.drill.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.common.web.SseStream;
import org.springframework.web.server.ResponseStatusException;
import interview.homegrown.modules.drill.ai.TutorGenerator;
import interview.homegrown.modules.drill.domain.*;
import interview.homegrown.modules.drill.repository.*;
import interview.homegrown.modules.drill.service.RehearsalService;
import interview.homegrown.modules.drill.web.dto.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

import static org.springframework.http.HttpStatus.*;

/**
 * 模拟面试（REHEARSAL）：开始/作答（SSE 流式讲解）/结束结算。
 * 从 DrillController 拆出（P1 结构重构），路径与行为完全不变。
 */
@RestController
@RequestMapping("/api/drill")
public class DrillRehearsalController {

    private final RehearsalService rehearsalService;
    private final TutorGenerator tutorGenerator;
    private final DrillRunRepository runRepo;
    private final DrillTurnRepository turnRepo;
    private final ObjectMapper objectMapper;
    private final DrillSupport support;

    public DrillRehearsalController(RehearsalService rehearsalService, TutorGenerator tutorGenerator,
                                    DrillRunRepository runRepo, DrillTurnRepository turnRepo,
                                    ObjectMapper objectMapper, DrillSupport support) {
        this.rehearsalService = rehearsalService;
        this.tutorGenerator = tutorGenerator;
        this.runRepo = runRepo;
        this.turnRepo = turnRepo;
        this.objectMapper = objectMapper;
        this.support = support;
    }

    // -------------------------------------------------------- REHEARSAL

    @PostMapping("/rehearsal/start")
    public RehearsalView rehearsalStart(@RequestBody(required = false) RehearsalStartRequest req) {
        Long uid = CurrentUser.id();
        return rehearsalService.start(uid, req == null ? null : req.conceptId());
    }
    /**
     * 模拟面试作答并流式讲解（SSE 单端点，与 LEARN {@code submit} 同构）。
     *
     * <p>协议（text/event-stream）：
     * <ol>
     *   <li>{@code event: result} → 判分/下一轮结果（RehearsalView JSON），前端据此渲染下一问或结算；</li>
     *   <li>{@code data: {"text":"..."}}（默认 message 事件）→ 逐 token 的讲解，前端累积显示；</li>
     *   <li>{@code event: done} → 讲解结束（不再回带完整文本，避免末尾整段重复）；</li>
     *   <li>{@code event: error} → 流式中途异常。</li>
     * </ol>
     *
     * <p>判分（rehearsalService.answer）在写响应体之前同步完成——若抛闸门 409 等，由 Spring 错误
     * 机制直接返回，不会进 SSE 体；仅讲解流式阶段的中断才走 {@code event: error}。
     * 讲解针对"刚作答的那一轮"（view.round），写成 JSON 后再逐 token 推，避免旧两段式里
     * answer 同步卡慢 + 前端再单独开 tutor-stream 拉讲解的双重 LLM 往返。
     */

    @PostMapping(value = "/rehearsal/{runId}/answer", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> rehearsalAnswer(
            @PathVariable Long runId, @RequestBody RehearsalAnswerRequest req) {
        // 同步段取 uid（SecurityContext 不跨 async 线程）
        Long uid = CurrentUser.id();
        // 同步判分（决定 advance / settle），与 LEARN submit 同策略
        RehearsalView view = rehearsalService.answer(uid, runId, req.rawAnswer());
        // 取「刚作答那轮」的 turn 生成讲解（view.round 即已作答轮）
        DrillTurn turn = turnRepo.findByRunIdAndRound(runId, view.round())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "本轮问题不存在"));
        if (turn.getRawAnswer() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "本轮尚未作答");
        }
        String stem = turn.getStem();
        String pointsJson = turn.getPointsJson();
        String byConceptJson = turn.getByConceptJson();
        String rawAnswer = turn.getRawAnswer();
        final DrillTurn fTurn = turn;
        final RehearsalView fView = view;
        DrillRun reheRun = runRepo.findById(runId).orElse(null);
        final String context = reheRun == null ? null : support.contextOf(uid, reheRun.getQuestionId());

        return SseStream.start(sink -> {
            sink.event("result", objectMapper.writeValueAsString(fView));
            String full = tutorGenerator.streamExplain(stem, pointsJson, byConceptJson, rawAnswer, context,
                    sink::token, sink::reasoning);
            if (full != null) { fTurn.setTutorText(full); turnRepo.save(fTurn); }
            sink.doneWithText(full);
        });
    }

    /** 追问/模拟面试主动结束：用户点"下一题（结束追问）"或"结算本场"时调用 */
    @PostMapping("/rehearsal/{runId}/end")
    public RehearsalView rehearsalEnd(@PathVariable Long runId) {
        Long uid = CurrentUser.id();
        return rehearsalService.endRehearsal(uid, runId);
    }
}
