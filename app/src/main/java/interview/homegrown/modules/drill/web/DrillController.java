package interview.homegrown.modules.drill.web;

import interview.homegrown.modules.studyplan.domain.DailyTask;

import interview.homegrown.modules.studyplan.dto.DailyTaskView;

import interview.homegrown.modules.studyplan.service.DailyPlanService;

import interview.homegrown.modules.corpus.service.CorpusService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.common.web.SseStream;
import interview.homegrown.modules.drill.ai.TutorGenerator;
import interview.homegrown.modules.drill.ai.SocraticJudge;
import interview.homegrown.modules.drill.ai.SocraticJudgeService;
import interview.homegrown.modules.drill.domain.*;
import interview.homegrown.modules.drill.repository.*;
import interview.homegrown.modules.drill.service.*;
import interview.homegrown.modules.drill.web.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static interview.homegrown.modules.drill.grader.GradeScale.PASS_LINE;
import static org.springframework.http.HttpStatus.*;

/**
 * 学习模块唯一 REST 入口。所有端点需 JWT（见 SecurityConfig.drillSecurityFilterChain）。
 *
 * <p>三条主线：
 * <ul>
 *   <li><b>LEARN</b>：POST /next -&gt; POST /{runId}/submit -&gt; POST /{runId}/note</li>
 *   <li><b>REHEARSAL</b>：POST /rehearsal/start -&gt; POST /rehearsal/{runId}/answer（可能多轮）</li>
 *   <li><b>看数</b>：GET /profile（深度画像） GET /debt（内化欠账）</li>
 * </ul>
 *
 * <p>注意 /next 前置了两道闸门：内化债务（痛点 7）与未闭环作答唯一索引（痛点 5）。
 * 闸门失败一律 409，不是 400 —— 这不是参数错，是"你现在不该拿新题"的状态冲突。
 */
@RestController
@RequestMapping("/api/drill")
public class DrillController {

    private static final Logger log = LoggerFactory.getLogger(DrillController.class);

    private final DrillSupport support;

    private final SelectionService selectionService;
    private final AnswerService answerService;
    private final GradingService gradingService;
    private final NoteService noteService;
    private final DrillRunRepository runRepo;
    private final QuestionBankRepository questionBankRepo;
    private final DrillTurnRepository turnRepo;
    private final interview.homegrown.common.ai.AiSettingsService aiSettings;
    private final TutorGenerator tutorGenerator;
    private final SocraticJudgeService socraticJudge;
    private final ObjectMapper objectMapper;
    private final DailyPlanService dailyPlanService;
    private final LearningWorkflowService learningWorkflowService;
    private final ReviewService reviewService;
    private final interview.homegrown.modules.knowledge.service.ChatCaptureService chatCaptureService;

    public DrillController(DrillSupport support, SelectionService selectionService,
                           AnswerService answerService, GradingService gradingService, NoteService noteService,
                           DrillRunRepository runRepo, QuestionBankRepository questionBankRepo,
                           DrillTurnRepository turnRepo,
                           interview.homegrown.common.ai.AiSettingsService aiSettings,
                           TutorGenerator tutorGenerator,
                           SocraticJudgeService socraticJudge,
                           ObjectMapper objectMapper,
                           DailyPlanService dailyPlanService, LearningWorkflowService learningWorkflowService,
                           ReviewService reviewService,
                           interview.homegrown.modules.knowledge.service.ChatCaptureService chatCaptureService) {
        this.support = support;
        this.selectionService = selectionService;
        this.answerService = answerService;
        this.gradingService = gradingService;
        this.noteService = noteService;
        this.runRepo = runRepo;
        this.questionBankRepo = questionBankRepo;
        this.turnRepo = turnRepo;
        this.aiSettings = aiSettings;
        this.tutorGenerator = tutorGenerator;
        this.socraticJudge = socraticJudge;
        this.objectMapper = objectMapper;
        this.dailyPlanService = dailyPlanService;
        this.learningWorkflowService = learningWorkflowService;
        this.reviewService = reviewService;
        this.chatCaptureService = chatCaptureService;
    }

    // ------------------------------------------------------------ LEARN

    @PostMapping("/next")
    public QuestionView next() {
        Long uid = CurrentUser.id();
        // 债务闸门已按用户决策移除：欠账不拦截开新题（欠账清单仍经 GET /debt 暴露，供复盘页自选消化）
        var task = selectionService.pickNext(uid);         // 确定性选题（服务端）
        return support.openRun(uid, task);
    }

    /** 学习计划的确定性下一步：严格按层级、概念、子点、综合检测推进。 */
    @GetMapping("/learning-next/{planId}")
    public LearningNextView learningNext(@PathVariable Long planId) {
        return learningWorkflowService.next(CurrentUser.id(), planId);
    }

    /** 用户自选概念开练（痛点1：用户掌 what，服务端仍用 pickFor 定 task）。 */
    @PostMapping("/start")
    public QuestionView start(@RequestBody StartRequest req) {
        Long uid = CurrentUser.id();
        // 债务闸门已移除（同上）
        var task = selectionService.pickFor(uid, req.conceptId());
        QuestionView view = support.openRun(uid, task, support.planIdOfConcept(req.conceptId()), null, req.conceptId(), req.subPoint());
        support.tagRun(view.runId(), req.subPoint() == null ? DrillPurpose.FREE_PRACTICE : DrillPurpose.SUB_POINT_PRACTICE,
                support.planIdOfConcept(req.conceptId()), req.conceptId(), null);
        return view;
    }

    /** 方向级入口：继续（plan 内确定性选题）/ 复习（plan 内到期已掌握项）/ 层级练习（指定 layer）。 */
    @PostMapping("/start-plan")
    public QuestionView startPlan(@RequestBody StartPlanRequest req) {
        Long uid = CurrentUser.id();
        // 债务闸门已移除（同上）
        String mode = req.mode() == null ? "continue" : req.mode();
        if ("concept-assessment".equals(mode) || "level-assessment".equals(mode)) {
            return support.openAssessmentRun(uid, req.planId(), mode, req.layer(), req.conceptId());
        }
        // 用户主动的整知识点 / 整层级练习：范围 = 已学内容 + 整个知识点 / 整个层级
        if ("concept-practice".equals(mode) || "layer-practice".equals(mode)) {
            return support.openScopedPracticeRun(uid, req.planId(), mode, req.layer(), req.conceptId());
        }
        SelectedTask task = switch (mode) {
            case "review" -> selectionService.pickReviewWithinPlan(uid, req.planId());
            case "layer" -> selectionService.pickNextWithinPlanAtLayer(uid, req.planId(), req.layer());
            default -> selectionService.pickNextWithinPlan(uid, req.planId());
        };
        Integer targetLayer = "layer".equals(mode) ? req.layer() : null;
        Long targetConcept = null;
        // 需求1：复习也基于子知识点——复习时聚焦该概念下「还没通过」的子点，
        // 让复习精准补漏（已全部通过则退回概念级复习）。
        String reviewFocus = "review".equals(mode)
                ? selectionService.pickReviewSubPoint(uid, task.conceptIds().get(0))
                : null;
        // 复习闭环：记录开 run 前的活跃 run——只有本次真正开了新 run（而非恢复了旧的活跃作答）
        // 才消费今日待办里同方向同概念的 REVIEW 任务，否则复习完了「今日待办」仍会残留。
        Set<Long> activeBefore = support.activeLearnIds(uid);
        QuestionView view = support.openRun(uid, task, req.planId(), targetLayer, targetConcept, reviewFocus);
        DrillPurpose purpose = "review".equals(mode) ? DrillPurpose.REVIEW : DrillPurpose.FREE_PRACTICE;
        support.tagRun(view.runId(), purpose, req.planId(), req.conceptId(), req.layer());
        if ("review".equals(mode) && !activeBefore.contains(view.runId())) {
            dailyPlanService.markReviewDone(uid, req.planId(), task.conceptIds().get(0));
        }
        return view;
    }

    /**
     * 历史记录「继续练习」：复用原题（同 questionId）开一条新 run。
     * 旧 run 保持 GRADED 不可变（历史留档），新 run 从 READY 重新作答。
     *
     * <p>债务闸门已整体移除（用户 2026-08-10 决策：欠账不拦截开新题），本接口同样不设。
     * 复用 openRun 的 active-run 语义：若已有未闭环作答则直接恢复之（物理闸门语义）。
     */
    @PostMapping("/restart")
    public QuestionView restart(@RequestBody RestartRequest req) {
        Long uid = CurrentUser.id();
        // 闸门一在此有意跳过——见 Javadoc
        if (req.runId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "runId 不能为空");
        }
        DrillRun old = runRepo.findByUserIdAndId(uid, req.runId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "记录不存在"));
        QuestionBank q = questionBankRepo.findById(old.getQuestionId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目已失效"));

        // 已有未闭环作答 -> 恢复之（物理闸门语义：同一时间只做一道）。
        // 复用只认 LEARN 主线：若活跃的是 REHEARSAL，先搁置再开原题，避免把它当 LEARN 新题返回。
        List<DrillRun> activeLearns = runRepo.findByUserIdAndStatusInAndMode(uid, DrillSupport.ACTIVE_STATUSES, DrillMode.LEARN);
        if (!activeLearns.isEmpty()) {
            DrillRun run = activeLearns.getFirst();
            QuestionBank aq = questionBankRepo.findById(run.getQuestionId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目已失效"));
            return new QuestionView(run.getId(), run.getQuestionId(), aq.getStem(), aq.getProbeType().name(), aq.getResponseFormat().name());
        }
        List<DrillRun> activeRehearsals = runRepo.findByUserIdAndStatusInAndMode(uid, DrillSupport.ACTIVE_STATUSES, DrillMode.REHEARSAL);
        if (!activeRehearsals.isEmpty()) {
            DrillRun stray = activeRehearsals.getFirst();
            stray.setStatus(DrillRunStatus.PARKED);
            runRepo.save(stray);
        }

        // 用原题开新 run：不重新调用 LLM，直接复用已生成的 stem/points
        DrillRun run = new DrillRun();
        run.setUserId(uid);
        run.setQuestionId(q.getId());
        run.setMode(DrillMode.LEARN);
        run.setStatus(DrillRunStatus.READY);
        try {
            run = runRepo.save(run);
        } catch (DataIntegrityViolationException e) {
            // 闸门二：部分唯一索引物理闸门（并发兜底）
            throw new ResponseStatusException(CONFLICT, "已有未完成的作答，请先完成或搁置");
        }
        return new QuestionView(run.getId(), q.getId(), q.getStem(), q.getProbeType().name(), q.getResponseFormat().name());
    }

    /**
     * 提交作答并流式讲解（SSE 单端点，替代旧「submit 同步 JSON + 另开 tutor-stream」两段式）。
     *
     * <p>协议（text/event-stream）：
     * <ol>
     *   <li>{@code event: grade} → 判分结果（GradeView JSON），前端据此先渲染评分面板；</li>
     *   <li>{@code data: {"text":"..."}}（默认 message 事件）→ 逐 token 的讲解，前端累积显示；</li>
     *   <li>{@code event: done} → 完整讲解文本，前端用它兜底覆盖（修复偶发末尾截断）；</li>
     *   <li>{@code event: error} → 流式中途异常。</li>
     * </ol>
     *
     * <p>判分（answerService.submit）在写响应体之前同步完成——若抛闸门 409 等，由 Spring 错误
     * 机制直接返回，不会进 SSE 体；只有讲解流式阶段的中断才走 {@code event: error}。
     */
    @PostMapping(value = "/{runId}/submit", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> submit(
            @PathVariable Long runId, @RequestBody SubmitRequest req) {
        Long uid = CurrentUser.id();
        GradeView grade = answerService.submit(uid, runId, req.rawAnswer(), req.timing(), req.activeSeconds());

        DrillTurn turn = turnRepo.findByRunIdAndRound(runId, 0)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "作答不存在"));
        if (turn.getRawAnswer() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "本轮尚未作答");
        }
        String stem = turn.getStem();
        String pointsJson = turn.getPointsJson();
        String byConceptJson = turn.getByConceptJson();
        String rawAnswer = turn.getRawAnswer();
        final DrillTurn fTurn = turn;
        // 学习上下文（判分讲解依据：学生进度/概念要点/资料块/互联网补充）
        DrillRun submitRun = runRepo.findById(runId).orElse(null);
        final String context = submitRun == null ? null : support.contextOf(uid, submitRun.getQuestionId());

        return SseStream.start(sink -> {
            sink.event("grade", objectMapper.writeValueAsString(grade));
            String full = tutorGenerator.streamExplain(stem, pointsJson, byConceptJson, rawAnswer, context,
                    sink::token, sink::reasoning);
            if (full != null) { fTurn.setTutorText(full); turnRepo.save(fTurn); }
            sink.doneWithText(full);
        });
    }


    // ---------------------------------------------------- 对话式作答（chat + finish）

    /**
     * 对话式作答 SSE（POST /{runId}/chat）：
     * <p>用户在聊天页发送消息后，AI 以辅导老师身份流式回复。<b>不判分</b>——评分延迟到
     * 用户点「结束并评分」时由 {@code POST /{runId}/finish} 一次性完成。
     *
     * <p>协议（text/event-stream）：
     * <ol>
     *   <li>{@code data: {"text":"..."}}（默认 message 事件）→ 逐 token 的 AI 回复；</li>
     *   <li>{@code event: done} → 回复结束；</li>
     *   <li>{@code event: error} → 流式中途异常。</li>
     * </ol>
     *
     * <p>同步段完成：验证 run 归属 + 状态、保存用户回答为 DrillTurn、首次对话时推进 run 到 ANSWERING。
     * 流式段调 {@link TutorGenerator#streamChat} 生成对话回复，完成后写回 turn.tutorText。
     *
     * <p>状态门槛放宽：除 READY/ANSWERING 外，也允许对「已判分的 LEARN run」继续对话——历史记录
     * 「继续对话」= 用户向 AI 提问（追问是用户问 AI），不重新评分，GRADED 状态保持不变。
     */
    @PostMapping(value = "/{runId}/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> chat(
            @PathVariable Long runId, @RequestBody ChatRequest req) {
        Long uid = CurrentUser.id();

        DrillRun run = runRepo.findByUserIdAndId(uid, runId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "作答不存在"));
        // 状态门槛：READY/ANSWERING 正常对话；另放行「已判分的 LEARN run」——历史记录「继续对话」
        // = 用户在同一道题上继续向 AI 提问（追问是用户问 AI），不重新评分、不改 GRADED 状态。
        boolean continueAfterGraded =
                run.getStatus() == DrillRunStatus.GRADED && run.getMode() == DrillMode.LEARN;
        if (run.getStatus() != DrillRunStatus.READY && run.getStatus() != DrillRunStatus.ANSWERING
                && !continueAfterGraded) {
            throw new ResponseStatusException(BAD_REQUEST, "当前作答状态不可对话: " + run.getStatus());
        }
        if (req.rawAnswer() == null || req.rawAnswer().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "回答不能为空");
        }

        QuestionBank q = questionBankRepo.findById(run.getQuestionId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目不存在"));

        // 图片校验：当前模型必须支持视觉，否则明确报错（前端虽按能力隐藏上传入口，后端仍需兜底）
        List<String> images = req.images();
        if (!images.isEmpty() && !aiSettings.supportsVision()) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "当前模型不支持图片（请切换到支持视觉的模型，如 deepseek-v4-flash-vision-exp / qwen-vl-max）");
        }
        int MAX_IMAGES = 4;
        if (images.size() > MAX_IMAGES) {
            throw new ResponseStatusException(BAD_REQUEST, "一次最多附带 " + MAX_IMAGES + " 张图片");
        }

        // 保存用户回答为新 turn（round 递增）
        List<DrillTurn> existing = turnRepo.findByRunIdOrderByRoundAsc(runId);
        int nextRound = existing.isEmpty() ? 0 : existing.getLast().getRound() + 1;
        DrillTurn turn = new DrillTurn();
        turn.setRunId(runId);
        turn.setRound(nextRound);
        turn.setStem(q.getStem());
        turn.setRawAnswer(req.rawAnswer());
        if (!images.isEmpty()) {
            turn.setImageJson(support.jsonImages(images));
        }
        turnRepo.save(turn);

        // 首次对话：run READY -> ANSWERING
        if (run.getStatus() == DrillRunStatus.READY) {
            run.setStatus(DrillRunStatus.ANSWERING);
            runRepo.save(run);
        }

        // 收集全部 turns（含刚创建的）供 AI 参考对话历史
        List<DrillTurn> allTurns = turnRepo.findByRunIdOrderByRoundAsc(runId);
        String stem = q.getStem();
        String pointsJson = q.getPointsJson();
        final DrillTurn fTurn = turn;
        final String context = support.contextOf(uid, run.getQuestionId());
        final List<String> fImages = images;

        return SseStream.start(sink -> {
            // 首帧立即下发：EdgeOne 回源首包超时很短（实测约 15 秒），而下面的苏格拉底
            // 判定（LLM）与 LLM 首 token 都比它慢——不先发一帧占住连接，网关会 524 掐断。
            sink.start();

            // —— 苏格拉底三态判定（用户每轮作答后）——
            // 判定结果写回 turn，并决定 AI 这轮的回复行为：
            //   answering → AI 简短确认并等（不引导不评分）
            //   needs_guide → AI 抛一个引导问题（不给答案）
            //   done → 表扬 + 提示结束；G1 未达标则后续触发再考查
            //   wantsAnswerNow=true → 用户明确索要完整答案/放弃作答，触发揭示（评分封 AGAIN）
            // 已判分（GRADED）的 run 继续对话是自由问答，不再判定、不改变评分结果。
            boolean buttonReveal = Boolean.TRUE.equals(req.reveal());
            boolean preGraded = run.getStatus() == DrillRunStatus.READY
                    || run.getStatus() == DrillRunStatus.ANSWERING;
            // 按钮已揭示 → 不再判定（直接走 reveal 讲解）；否则每轮都让 AI 判定三态 + 用户意图
            String judgeConv = support.buildConversationForJudge(allTurns);
            if (q.getResponseFormat() == ResponseFormat.CHOICE) {
                // 选择题专属注入（不动通用判分提示词）：把标准答案键喂给判分器——
                // 选对直接 done 满分式肯定、选错按键引导，避免按开放题逻辑对正确选项挑刺。
                judgeConv = (judgeConv == null ? "" : judgeConv)
                        + "\n（本题为选择题，标准答案是 " + correctKeys(q.getMcqOptionsJson()) + "。判定规则："
                        + "学生所选与标准答案一致 → 直接 state=done、coverage=1.0，praise 一句简短肯定即可，不要挑刺、不要展开逐点论述；"
                        + "所选与标准答案不一致 → state=needs_guide，guideQuestion 引导思考「标准答案为什么对、所选项错在哪」；"
                        + "一切以标准答案为准，不要用你自己的理解推翻标准答案。学生直接回复字母即为完整作答，不要求逐评分点展开。）";
            }
            final SocraticJudge judge = (buttonReveal || !preGraded) ? null : socraticJudge.judge(
                    stem, pointsJson, judgeConv);

            // —— 答案揭示边界（“得到答案之前”的评分依据）——
            // 触发揭示：前端「看答案」按钮，或 AI 判定用户明确索要完整答案/放弃作答（wantsAnswerNow）。
            // 意图由 AI 语义理解判定（非关键词写死）。揭示后评分封 AGAIN，防止骗答案刷分。
            // 判分后（GRADED）看答案同样记录边界：看答案后封 AGAIN，不再引导/再考查。
            boolean reveal = buttonReveal || (judge != null && judge.wantsAnswerNow());
            boolean notFinished = run.getSocraticState() != DrillPhase.DONE;
            if (reveal && notFinished && !run.isRevealed()) {
                run.setRevealed(true);
                runRepo.save(run);
            }

            if (judge != null) {
                fTurn.setJudgeState(judge.state());
                fTurn.setCoverage(java.math.BigDecimal.valueOf(judge.coverage()));
                fTurn.setFatalGap(judge.fatalGap());
                turnRepo.save(fTurn);
                // 若用户明确要答案：不按三态走引导/达标结算，直接进入揭示讲解（reveal=true）
                if (!reveal && "done".equalsIgnoreCase(judge.state())) {
                    // 达标（覆盖≥80% 无致命缺漏）：G1 未经过引导 → 直接 GOOD 结束；
                    // 已经过引导（GUIDED）→ G2 引导后达标，落 GradeResult + applyMastery（封顶 GOOD）
                    boolean guided = run.getGuideRounds() > 0
                            || run.getSocraticState() == DrillPhase.GUIDED;
                    if (guided) {
                        gradingService.guidedPass(uid, runId, fTurn);
                    } else {
                        run.setSocraticState(DrillPhase.DONE);
                        run.setFinalGrade("GOOD");
                        runRepo.save(run);
                    }
                } else if (!reveal && "needs_guide".equalsIgnoreCase(judge.state())) {
                    run.setSocraticState(DrillPhase.GUIDED);
                    run.setGuideRounds(run.getGuideRounds() + 1);
                    runRepo.save(run);
                }
            }

            if (reveal && notFinished) sink.event("reveal", "{}");

            boolean wantAnswer = judge != null && judge.wantsAnswerNow();
            String judgeReply = (!wantAnswer && judge != null && "done".equalsIgnoreCase(judge.state())
                    && judge.praise() != null && !judge.praise().isBlank()) ? judge.praise() : null;
            final String fGuide = (!wantAnswer && judge != null
                    && "needs_guide".equalsIgnoreCase(judge.state())
                    && judge.guideQuestion() != null && !judge.guideQuestion().isBlank())
                    ? judge.guideQuestion() : null;

            String full;
            if (judgeReply != null) {
                for (String token : judgeReply.split("(?<=。|？|！|\\n)")) {
                    if (!token.isBlank()) sink.token(token);
                }
                full = judgeReply;
            } else {
                full = tutorGenerator.streamChat(stem, pointsJson, allTurns, context,
                        fImages, fGuide, sink::token, sink::reasoning, reveal);
            }

            if (full != null && !sink.isBroken()) { fTurn.setTutorText(full.trim()); turnRepo.save(fTurn); }
            sink.done();
        });
    }

    /** 选择题标准答案键（mcq_options 中 correct=true 的 key，如 "B"；解析失败给兜底指令文本）。 */
    private String correctKeys(String mcqJson) {
        try {
            interview.homegrown.modules.drill.ai.McqOption[] opts =
                    objectMapper.readValue(mcqJson, interview.homegrown.modules.drill.ai.McqOption[].class);
            StringBuilder sb = new StringBuilder();
            for (var o : opts) {
                if (o.correct()) {
                    if (sb.length() > 0) sb.append("/");
                    sb.append(o.key());
                }
            }
            return sb.length() > 0 ? sb.toString() : "以 options 中 correct=true 为准";
        } catch (Exception e) {
            return "以 options 中 correct=true 为准";
        }
    }

    /**
     * 结束对话并评分（POST /{runId}/finish）：
     * <p>基于整轮对话（所有 /chat 的用户回答）一次性判分，返回 GradeView。
     * 判分后 run 状态置 GRADED，mastery 按概念粒度更新。
     */
    @PostMapping("/{runId}/finish")
    public GradeView finish(@PathVariable Long runId) {
        Long uid = CurrentUser.id();
        return answerService.finish(uid, runId);
    }

    /**
     * 放弃本次作答（未独立作答即看答案，不再判分，按 AGAIN 结算闭环）。
     * 让 run 置 GRADED、物理闸门放行下一题——否则看答案后既不能评分也无法推进。
     */
    @PostMapping("/{runId}/abandon")
    public GradeView abandon(@PathVariable Long runId) {
        Long uid = CurrentUser.id();
        return answerService.abandon(uid, runId);
    }

    /**
     * 把本次练习对话提取为知识卡片（需求：无论是否通过，都能沉淀）。
     * 复用知识模块的对话沉淀逻辑（LLM 提炼 question/answer/tags + 关联概念），
     * 对话来源 = 题干 + 全部轮次的学生回答与 AI 讲解。
     */
    @PostMapping("/{runId}/card")
    public interview.homegrown.modules.knowledge.domain.KnowledgeCard extractCard(@PathVariable Long runId) {
        Long uid = CurrentUser.id();
        DrillRun run = runRepo.findByUserIdAndId(uid, runId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "作答不存在"));
        QuestionBank q = questionBankRepo.findById(run.getQuestionId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目不存在"));
        List<DrillTurn> turns = turnRepo.findByRunIdOrderByRoundAsc(runId);

        List<interview.homegrown.modules.knowledge.service.ChatCaptureService.Message> messages =
                new java.util.ArrayList<>();
        messages.add(new interview.homegrown.modules.knowledge.service.ChatCaptureService.Message("ai", q.getStem()));
        for (DrillTurn t : turns) {
            if (t.getRawAnswer() != null && !t.getRawAnswer().isBlank()) {
                messages.add(new interview.homegrown.modules.knowledge.service.ChatCaptureService.Message("user", t.getRawAnswer()));
            }
            if (t.getTutorText() != null && !t.getTutorText().isBlank()) {
                messages.add(new interview.homegrown.modules.knowledge.service.ChatCaptureService.Message("ai", t.getTutorText()));
            }
        }
        return chatCaptureService.capture(uid, messages);
    }

    // ------------------------------------------------------------ 教学讲解 SSE 流

    /**
     * 教学讲解 SSE 流：前端 EventSource 订阅此 URL，逐 token 累积显示讲解。
     * 服务端调 TutorGenerator 流式生成，每 token 写 {@code data: <token>\n\n}，
     * 写完时再补 {@code event: done} 与完整文本，最后把讲解写回 drill_turn.tutor_text。
     *
     * <p>路由注意：本端点路径是 {@code /{runId}/tutor-stream}，单段动态段；
     * 不能与 {@code GET /{runId}} 撞路由（SSE 端点在前缀排序靠后），Spring MVC
     * 按"具体路径优先于路径变量"，先匹配本端点的子串。
     */
    @GetMapping(value = "/{runId}/tutor-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> tutorStream(
            @PathVariable Long runId,
            @RequestParam(defaultValue = "0") int round) {
        // 同步段取 uid（SecurityContext 不跨 async 线程，uid 必须现在拿到）
        Long uid = CurrentUser.id();
        DrillRun run = runRepo.findByUserIdAndId(uid, runId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "作答不存在"));
        // 主问 LEARN 讲解要求 run 已判分(GRADED)；模拟面试 REHEARSAL 多轮间 run 处于 ANSWERING
        // 态（不立即 GRADED），每轮用户作答后即当轮生成讲解，故对 REHEARSAL 模式放宽门槛。
        if (run.getStatus() != DrillRunStatus.GRADED && run.getMode() != DrillMode.REHEARSAL) {
            throw new ResponseStatusException(BAD_REQUEST, "该作答尚未判分，无讲解");
        }
        DrillTurn turn = turnRepo.findByRunIdAndRound(runId, round)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "本轮问题不存在"));
        if (turn.getRawAnswer() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "本轮尚未作答");
        }

        // 捕获到 lambda 里的变量需为 final
        String stem = turn.getStem();
        String pointsJson = turn.getPointsJson();
        String byConceptJson = turn.getByConceptJson();
        String rawAnswer = turn.getRawAnswer();
        final DrillTurn fTurn = turn;       // mutable turn 在 lambda 内被 setTutorText 写库
        final String context = support.contextOf(uid, run.getQuestionId());

        return SseStream.start(sink -> {
            sink.start();
            String full = tutorGenerator.streamExplain(stem, pointsJson, byConceptJson, rawAnswer, context,
                    sink::token, sink::reasoning);
            if (full != null) { fTurn.setTutorText(full); turnRepo.save(fTurn); }
            sink.done();
        });
    }

    // ------------------------------------------------------------- 内化

    @PostMapping("/{runId}/note")
    public NoteView note(@PathVariable Long runId, @RequestBody NoteRequest req) {
        Long uid = CurrentUser.id();
        return noteService.write(uid, runId, req);
    }

    /** AI 复盘：题目 + 对话总结（欠缺） + 解题思路 + 记忆口诀（按 runId 缓存，只生成一次）。 */
    @GetMapping("/{runId}/review")
    public ReviewView review(@PathVariable Long runId) {
        return reviewService.review(CurrentUser.id(), runId);
    }

    public record StartRequest(Long conceptId, String subPoint) {}

    public record StartPlanRequest(Long planId, String mode, Integer layer, Long conceptId) {}

    public record RestartRequest(Long runId) {}
}
