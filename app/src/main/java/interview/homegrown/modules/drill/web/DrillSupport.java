package interview.homegrown.modules.drill.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.modules.drill.domain.*;
import interview.homegrown.modules.drill.repository.*;
import interview.homegrown.modules.drill.service.ProgressContextService;
import interview.homegrown.modules.drill.service.ProfileService;
import interview.homegrown.modules.drill.service.QuestionService;
import interview.homegrown.modules.drill.web.dto.QuestionView;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

/**
 * 学习主线共享支撑：开 run 的全套闸门/恢复/出题辅助 + 学习上下文拼装。
 * 抽出供 DrillController（主线）、DrillTaskController（每日任务）、
 * DrillRehearsalController（模拟面试）等共用，避免互相复制或巨型控制器。
 */
@Component
public class DrillSupport {

    private static final Logger log = LoggerFactory.getLogger(DrillSupport.class);

    static final List<DrillRunStatus> ACTIVE_STATUSES = List.of(DrillRunStatus.READY, DrillRunStatus.ANSWERING);

    private final DrillRunRepository runRepo;
    private final QuestionBankRepository questionBankRepo;
    private final DrillTurnRepository turnRepo;
    private final ConceptRepository conceptRepo;
    private final ProgressContextService progressContext;
    private final ProfileService profileService;
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;

    public DrillSupport(DrillRunRepository runRepo, QuestionBankRepository questionBankRepo,
                        DrillTurnRepository turnRepo, ConceptRepository conceptRepo,
                        ProgressContextService progressContext, ProfileService profileService,
                        QuestionService questionService, ObjectMapper objectMapper) {
        this.runRepo = runRepo;
        this.questionBankRepo = questionBankRepo;
        this.turnRepo = turnRepo;
        this.conceptRepo = conceptRepo;
        this.progressContext = progressContext;
        this.profileService = profileService;
        this.questionService = questionService;
        this.objectMapper = objectMapper;
    }

    /** 当前用户所有活跃 LEARN run 的 id（READY / ANSWERING）。 */
    Set<Long> activeLearnIds(Long uid) {
        return runRepo.findByUserIdAndStatusInAndMode(uid, ACTIVE_STATUSES, DrillMode.LEARN)
                .stream().map(DrillRun::getId).collect(Collectors.toSet());
    }

    QuestionView openRun(Long uid, SelectedTask task) {
        return openRun(uid, task, null, null, null, null);   // 自由模式：不指定目标，恢复任何活跃 run
    }

    QuestionView openRun(Long uid, SelectedTask task, Long targetPlanId) {
        return openRun(uid, task, targetPlanId, null, null, null);
    }

    QuestionView openRun(Long uid, SelectedTask task, Long targetPlanId,
                         Integer targetLayer, Long targetConceptId, String focus) {
        QuestionView resumed = resumeActiveOrPark(uid, targetPlanId, targetLayer, targetConceptId);
        if (resumed != null) {
            if (focus == null || focus.isBlank()) return resumed;
            DrillRun active = runRepo.findById(resumed.runId()).orElse(null);
            if (active != null && focus.equals(active.getFocusSubPoint())) return resumed;
            // 同一大知识点下切换到另一个子知识点时，不能恢复上一子点的题。
            if (active != null) {
                active.setStatus(DrillRunStatus.PARKED);
                runRepo.save(active);
            }
        }

        // 学习上下文注入：学生进度 + 概念要点 + 用户资料块 + 互联网补充（素材不锁死）
        String context = progressContext.contextFor(uid, task.conceptIds());
        // 先教后考：出题限定到「子知识点」粒度，题目必须围绕当前子知识点，不跑偏到别的子点。
        if (focus != null && !focus.isBlank()) {
            context = (context == null ? "" : context + "\n\n")
                    + "本次练习聚焦的子知识点：「" + focus + "」。题目必须围绕这个子知识点展开，"
                    + "不要考这个概念下的其它子知识点。";
        }
        List<String> practicedStems = List.of();
        if (focus != null && !focus.isBlank()) {
            List<DrillRun> priorRuns = priorFocusedRuns(uid, task.conceptId(), focus);
            practicedStems = priorRuns.stream()
                    .map(r -> questionBankRepo.findById(r.getQuestionId()).map(QuestionBank::getStem).orElse(null))
                    .filter(s -> s != null && !s.isBlank())
                    .distinct()
                    .limit(5)
                    .toList();
            String dialogue = focusedPracticeContext(priorRuns);
            if (!dialogue.isBlank()) {
                context += "\n\n用户此前在这个子知识点的已完成练习对话：\n" + dialogue
                        + "\n请据此出一道真正的新题：避开已问过的题干、场景和直接结论；"
                        + "对已经正确回答的内容换认知动作或应用场景，对暴露出的薄弱处做针对性考察。";
            }
        }
        var q = questionService.generate(task, withSkillContext(uid, context), practicedStems);       // 出题（LLM 填空）
        return openRunOnQuestion(uid, q.getId(), targetPlanId, focus);
    }

    /** 取同一用户、同一概念、同一子点最近完成的练习，防止同名子点跨概念串线。 */
    List<DrillRun> priorFocusedRuns(Long uid, Long conceptId, String focus) {
        return runRepo.findTop20ByUserIdAndFocusSubPointAndStatusOrderByIdDesc(
                        uid, focus, DrillRunStatus.GRADED).stream()
                .filter(r -> questionBankRepo.findById(r.getQuestionId())
                        .map(q -> java.util.Arrays.stream(q.getConceptIds())
                                .anyMatch(cid -> conceptId.equals(cid.longValue())))
                        .orElse(false))
                .limit(5)
                .toList();
    }

    /** 历史对话只用于个性化出题，限制长度避免持续练习后撑爆模型上下文。 */
    String focusedPracticeContext(List<DrillRun> runs) {
        StringBuilder out = new StringBuilder();
        for (DrillRun run : runs) {
            QuestionBank q = questionBankRepo.findById(run.getQuestionId()).orElse(null);
            if (q == null) continue;
            out.append("题目：").append(truncateForPrompt(q.getStem(), 800)).append('\n');
            for (DrillTurn turn : turnRepo.findByRunIdOrderByRoundAsc(run.getId())) {
                if (turn.getRawAnswer() != null && !turn.getRawAnswer().isBlank()) {
                    out.append("用户：").append(truncateForPrompt(turn.getRawAnswer(), 500)).append('\n');
                }
                if (turn.getTutorText() != null && !turn.getTutorText().isBlank()) {
                    out.append("老师：").append(truncateForPrompt(turn.getTutorText(), 500)).append('\n');
                }
            }
            out.append('\n');
            if (out.length() >= 6000) break;
        }
        return truncateForPrompt(out.toString(), 6000);
    }

    static String truncateForPrompt(String text, int max) {
        if (text == null || text.length() <= max) return text == null ? "" : text;
        return text.substring(0, max) + "…";
    }

    /**
     * 物理闸门（LEARN 主线复用 + 方向/层级/概念隔离）：
     * 有活跃 LEARN 且<b>与用户本次请求的目标一致</b>（同方向，且未显式指定层级/概念，或指定了且匹配）
     * → 恢复它，避免同一题开两条未闭环 run。
     * 活跃 run 与请求不匹配（别的方向、或用户显式点了别的层级/概念）→ 先搁置它，为请求的目标开新题。
     * 有活跃 REHEARSAL 先搁置腾出闸门名额。无活跃则返回 null，可开新题。
     */
    QuestionView resumeActiveOrPark(Long uid, Long targetPlanId, Integer targetLayer, Long targetConceptId) {
        List<DrillRun> activeLearns = runRepo.findByUserIdAndStatusInAndMode(uid, ACTIVE_STATUSES, DrillMode.LEARN);
        if (!activeLearns.isEmpty()) {
            DrillRun run = activeLearns.getFirst();
            Long activePlanId = planIdOfQuestion(run.getQuestionId());
            boolean samePlan = targetPlanId == null || activePlanId == null
                    || targetPlanId.equals(activePlanId);
            if (samePlan && layerMatches(run, targetLayer) && conceptMatches(run, targetConceptId)) {
                QuestionBank q = questionBankRepo.findById(run.getQuestionId())
                        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目已失效"));
                return new QuestionView(run.getId(), q.getId(), q.getStem(), q.getProbeType().name(), q.getResponseFormat().name());
            }
            // 活跃 run 与请求不匹配（别的方向，或显式指定的层级/概念不一致）：搁置（PARKED），为请求目标开新题
            run.setStatus(DrillRunStatus.PARKED);
            runRepo.save(run);
        }
        // 存在被丢弃的活跃 REHEARSAL（如中途切去练习）：先搁置腾出物理闸门名额，再开 LEARN 新题。
        // 用 PARKED（与 72h 自动搁置同款终态）而非 endRehearsal 结算——避免对未完成的模拟面试误判分/动 mastery。
        List<DrillRun> activeRehearsals = runRepo.findByUserIdAndStatusInAndMode(uid, ACTIVE_STATUSES, DrillMode.REHEARSAL);
        if (!activeRehearsals.isEmpty()) {
            DrillRun stray = activeRehearsals.getFirst();
            stray.setStatus(DrillRunStatus.PARKED);
            runRepo.save(stray);
        }
        return null;
    }

    /** 用已存在的题目开一条 LEARN run（不调 LLM，今日任务预生成题走这里）。 */
    QuestionView openRunOnQuestion(Long uid, Long questionId) {
        return openRunOnQuestion(uid, questionId, null);
    }

    QuestionView openRunOnQuestion(Long uid, Long questionId, Long targetPlanId) {
        return openRunOnQuestion(uid, questionId, targetPlanId, null);
    }

    QuestionView openRunOnQuestion(Long uid, Long questionId, Long targetPlanId, String focusSubPoint) {
        QuestionBank q = questionBankRepo.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "题目已失效"));
        QuestionView resumed = resumeActiveOrPark(uid, targetPlanId, null, null);
        if (resumed != null) return resumed;

        DrillRun run = new DrillRun();
        run.setUserId(uid);
        run.setQuestionId(q.getId());
        run.setMode(DrillMode.LEARN);
        run.setStatus(DrillRunStatus.READY);
        run.setFocusSubPoint(focusSubPoint);
        try {
            run = runRepo.save(run);
        } catch (DataIntegrityViolationException e) {
            // 闸门二：部分唯一索引物理闸门，已有未闭环作答（并发兜底）
            throw new ResponseStatusException(CONFLICT, "已有未完成的作答，请先完成或搁置");
        }
        return new QuestionView(run.getId(), q.getId(), q.getStem(), q.getProbeType().name(), q.getResponseFormat().name());
    }

    QuestionView openAssessmentRun(Long uid, Long planId, String mode, Integer layer, Long conceptId) {
        // 综合检测必须新开对应范围的题，不能被同方向另一条普通子点题“恢复”并冒充检测题。
        for (DrillRun active : runRepo.findByUserIdAndStatusInAndMode(uid, ACTIVE_STATUSES, DrillMode.LEARN)) {
            active.setStatus(DrillRunStatus.PARKED);
            runRepo.save(active);
        }
        List<Concept> scope;
        DrillPurpose purpose;
        if ("concept-assessment".equals(mode)) {
            Concept target = conceptRepo.findById(conceptId)
                    .filter(c -> planId.equals(c.getStudyPlanId()))
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "综合检测知识点不存在"));
            scope = List.of(target);
            layer = target.getLayer();
            purpose = DrillPurpose.CONCEPT_ASSESSMENT;
        } else {
            final int targetLayer = layer == null ? 1 : layer;
            List<Concept> layerPool = conceptRepo.findByStudyPlanId(planId).stream()
                    .filter(c -> c.getLayer() == targetLayer)
                    .sorted(Comparator.comparing(Concept::getId))
                    .toList();
            int already = runRepo.findByUserIdAndPlanIdAndPurposeAndAssessmentLayerAndStatus(
                    uid, planId, DrillPurpose.LEVEL_ASSESSMENT, targetLayer, DrillRunStatus.GRADED).size();
            int take = Math.min(3, layerPool.size());
            scope = java.util.stream.IntStream.range(0, take)
                    .mapToObj(i -> layerPool.get((already + i) % layerPool.size()))
                    .toList();
            if (scope.isEmpty()) throw new ResponseStatusException(NOT_FOUND, "该层没有可检测的知识点");
            layer = targetLayer;
            purpose = DrillPurpose.LEVEL_ASSESSMENT;
        }
        List<ConceptRef> refs = java.util.stream.IntStream.range(0, scope.size())
                .mapToObj(i -> ConceptRef.of(scope.get(i), i == 0 ? ConceptRole.PRIMARY : ConceptRole.ANCHOR))
                .toList();
        SelectedTask task = new SelectedTask(refs);
        String context = progressContext.contextFor(uid, task.conceptIds());
        context = (context == null ? "" : context + "\n\n")
                + (purpose == DrillPurpose.CONCEPT_ASSESSMENT
                ? "这是大知识点综合检测。题目应综合该知识点下多个子知识点，考察组合运用，不要只重复单个定义。"
                : "这是 L" + layer + " 层级综合检测。题目应在当前层的多个知识点间建立真实工程联系，难度不得超过当前层级。")
                + "一次只出一道核心主问，后续仍使用普通聊天式作答。";
        QuestionBank q = questionService.generate(task, withSkillContext(uid, context));
        QuestionView view = openRunOnQuestion(uid, q.getId(), planId, null);
        tagRun(view.runId(), purpose, planId, conceptId, layer);
        return view;
    }

    /**
     * 用户主动的整知识点 / 整层级练习出题：
     * <ul>
     *   <li>concept-practice：范围 = 已学内容（进度画像 + 概念要点 + 资料）+ 整个知识点；</li>
     *   <li>layer-practice：范围 = 已学内容 + 整个层级（该层全部概念进上下文）。</li>
     * </ul>
     * 与工作流的综合检测（CONCEPT/LEVEL_ASSESSMENT）互不计数：这是练习，不是关卡。
     */
    QuestionView openScopedPracticeRun(Long uid, Long planId, String mode, Integer layer, Long conceptId) {
        // 必须新开对应范围的题，不能被同方向另一条普通子点题“恢复”并冒充。
        for (DrillRun active : runRepo.findByUserIdAndStatusInAndMode(uid, ACTIVE_STATUSES, DrillMode.LEARN)) {
            active.setStatus(DrillRunStatus.PARKED);
            runRepo.save(active);
        }
        // 前端可能不传 planId（从知识点页进入）
        if (planId == null && conceptId != null) {
            Concept byId = conceptRepo.findById(conceptId).orElse(null);
            if (byId != null) planId = byId.getStudyPlanId();
        }
        if (planId == null) throw new ResponseStatusException(BAD_REQUEST, "缺少学习方向");
        List<Concept> layerAll = List.of();   // 整层全部概念：作为「整个层级」的上下文范围
        List<Concept> scope;
        DrillPurpose purpose;
        if ("concept-practice".equals(mode)) {
            Concept target = conceptRepo.findById(conceptId)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
            scope = List.of(target);
            if (planId == null) planId = target.getStudyPlanId();
            layer = target.getLayer();
            purpose = DrillPurpose.CONCEPT_PRACTICE;
        } else {
            final int targetLayer = layer == null ? 1 : layer;
            List<Concept> layerPool = conceptRepo.findByStudyPlanId(planId).stream()
                    .filter(c -> c.getLayer() == targetLayer)
                    .sorted(Comparator.comparing(Concept::getId))
                    .toList();
            if (layerPool.isEmpty()) throw new ResponseStatusException(NOT_FOUND, "这一层还没有知识点，先去「继续学习」");
            layerAll = layerPool;
            // 题面参与概念数受 probe_type 支持上限约束（最大 3），取不到整层；
            // 但「范围」是整层：下面 contextFor 用整层概念注入（已学内容 + 整层要点）。
            int already = runRepo.findByUserIdAndPlanIdAndPurposeAndAssessmentLayerAndStatus(
                    uid, planId, DrillPurpose.LAYER_PRACTICE, targetLayer, DrillRunStatus.GRADED).size();
            int take = Math.min(3, layerPool.size());
            scope = java.util.stream.IntStream.range(0, take)
                    .mapToObj(i -> layerPool.get((already + i) % layerPool.size()))
                    .toList();
            layer = targetLayer;
            purpose = DrillPurpose.LAYER_PRACTICE;
        }
        List<ConceptRef> refs = java.util.stream.IntStream.range(0, scope.size())
                .mapToObj(i -> ConceptRef.of(scope.get(i), i == 0 ? ConceptRole.PRIMARY : ConceptRole.ANCHOR))
                .toList();
        SelectedTask task = new SelectedTask(refs);
        List<Long> contextIds = purpose == DrillPurpose.LAYER_PRACTICE
                ? layerAll.stream().map(Concept::getId).toList()
                : task.conceptIds();
        String context = progressContext.contextFor(uid, contextIds);
        context = (context == null ? "" : context + "\n\n")
                + (purpose == DrillPurpose.CONCEPT_PRACTICE
                ? "这是整个知识点的综合练习。题目应综合这个知识点下的多个子知识点，考察组合运用，不要只重复单个子知识点。"
                : "这是 L" + layer + " 整个层级的综合练习。题目应综合覆盖当前层级的多个知识点，在它们之间建立真实工程联系，难度不得超过 L" + layer + "。")
                + "一次只出一道核心主问，后续仍使用普通聊天式作答。";
        QuestionBank q = questionService.generate(task, withSkillContext(uid, context));
        QuestionView view = openRunOnQuestion(uid, q.getId(), planId, null);
        tagRun(view.runId(), purpose, planId, conceptId, layer);
        return view;
    }

    /** 把用户能力画像（已掌握知识点）追加进出题上下文，作为下次出题的「基于已学知识点考查」锚点。 */
    String withSkillContext(Long uid, String context) {
        String skill = profileService.skillDoc(uid);
        if (skill == null || skill.isBlank() || skill.startsWith("（用户暂无")) return context;
        return (context == null ? "" : context + "\n\n")
                + "【能力画像（用户已掌握的知识点，作为考查锚点参考）】\n" + skill;
    }

    void tagRun(Long runId, DrillPurpose purpose, Long planId, Long conceptId, Integer layer) {
        runRepo.findById(runId).ifPresent(run -> {
            run.setPurpose(purpose);
            run.setPlanId(planId);
            run.setAssessmentConceptId(conceptId);
            run.setAssessmentLayer(layer);
            runRepo.save(run);
        });
    }

    /** 概念所属学习方向（用于闸门的方向隔离）。 */
    Long planIdOfConcept(Long conceptId) {
        return conceptRepo.findById(conceptId).map(Concept::getStudyPlanId).orElse(null);
    }

    /** 题目主概念所属学习方向（用于闸门的方向隔离）。 */
    private Long planIdOfQuestion(Long questionId) {
        Long primaryId = primaryConceptId(questionId);
        return primaryId == null ? null : planIdOfConcept(primaryId);
    }

    /**
     * 活跃 run 的主概念是否属于用户显式指定的层级。
     * 未指定层级（null）一律视为匹配；题目拿不到主概念时保守不匹配（宁可按目标层重出，也不顶掉请求）。
     */
    private boolean layerMatches(DrillRun run, Integer targetLayer) {
        if (targetLayer == null) return true;
        return conceptRepo.findById(primaryConceptId(run.getQuestionId()))
                .map(c -> c.getLayer() == targetLayer)
                .orElse(false);
    }

    /** 活跃 run 的主概念是否就是用户显式点开的概念（未指定概念则一律匹配）。 */
    private boolean conceptMatches(DrillRun run, Long targetConceptId) {
        if (targetConceptId == null) return true;
        Long primaryId = primaryConceptId(run.getQuestionId());
        return primaryId != null && primaryId.equals(targetConceptId);
    }

    private Long primaryConceptId(Long questionId) {
        QuestionBank q = questionBankRepo.findById(questionId).orElse(null);
        if (q == null || q.getConceptIds() == null || q.getConceptIds().length == 0) return null;
        return q.getConceptIds()[0].longValue();
    }

    /**
     * 把 turns 拼成「学生/老师」对话实录（含当前轮，待判定作答在最后），供 SocraticJudgeService
     * 判定哪些点被实际考到。两个硬约束：
     * <ul>
     *   <li><b>前缀缓存对齐</b>：已发出的行永不改动、新内容只往尾部追加，每轮请求的 token 前缀
     *       与上一轮逐字节一致，mimo 自动前缀缓存整段命中——所以<b>不能做整体尾部截断</b>
     *       （尾部截断会让起点漂移、前缀报废），只做行级截断防单条爆炸；</li>
     *   <li>老师的长讲解对"学生覆盖了哪些点"几乎无信息量，只留 120 字当上下文。</li>
     * </ul>
     */
    String buildConversationForJudge(List<DrillTurn> turns) {
        if (turns == null || turns.isEmpty()) return null;
        StringBuilder sb = new StringBuilder();
        for (DrillTurn t : turns) {
            String ans = t.getRawAnswer();
            if (ans != null && !ans.isBlank()) {
                sb.append("学生（第 ").append(t.getRound() + 1).append(" 轮）：")
                        .append(interview.homegrown.common.util.TextUtil.truncateCodeAware(ans, 2400))
                        .append("\n");
            }
            String tutor = t.getTutorText();
            if (tutor != null && !tutor.isBlank()) {
                sb.append("老师：")
                        .append(interview.homegrown.common.util.TextUtil.truncateCodeAware(tutor, 120))
                        .append("\n");
            }
        }
        return sb.toString();
    }

    /** 题目涉及的学习上下文（学生进度 + 概念要点 + 资料块 + 互联网补充），查不到返回 null。 */
    String contextOf(Long uid, Long questionId) {
        QuestionBank q = questionBankRepo.findById(questionId).orElse(null);
        return progressContext.contextFor(uid, q);
    }

    boolean questionContainsConcept(Long questionId, Long conceptId) {
        QuestionBank q = questionBankRepo.findById(questionId).orElse(null);
        if (q == null || q.getConceptIds() == null || q.getConceptIds().length == 0) return false;
        return java.util.Arrays.stream(q.getConceptIds())
                .anyMatch(id -> id != null && id.longValue() == conceptId.longValue());
    }

    /** 把图片 data URL 列表序列化为 JSON 字符串（存 drill_turn.image_json）。 */
    String jsonImages(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images);
        } catch (Exception e) {
            log.warn("序列化图片列表失败: {}", e.getMessage());
            return null;
        }
    }
}
