package interview.homegrown.modules.drill.web;

import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.common.web.SseStream;
import org.springframework.web.server.ResponseStatusException;
import interview.homegrown.modules.drill.ai.LessonGenerator;
import interview.homegrown.modules.drill.ai.LessonQaGenerator;
import interview.homegrown.modules.drill.domain.*;
import interview.homegrown.modules.drill.repository.*;
import interview.homegrown.modules.drill.service.ProgressContextService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.*;
import static interview.homegrown.modules.drill.grader.GradeScale.PASS_LINE;

/**
 * 先教后考：概念拆解（大纲/子知识点）、子点通过标记、逐子点讲解（SSE）与讲解答疑。
 * 从 DrillController 拆出（P1 结构重构），路径与行为完全不变。
 */
@RestController
@RequestMapping("/api/drill")
public class DrillLessonController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DrillLessonController.class);

    private final ConceptRepository conceptRepo;
    private final ConceptLessonRepository conceptLessonRepo;
    private final SubPointPassRepository subPointPassRepo;
    private final LessonQaRepository lessonQaRepo;
    private final DrillRunRepository runRepo;
    private final ProgressContextService progressContext;
    private final LessonGenerator lessonGenerator;
    private final LessonQaGenerator lessonQaGenerator;
    private final DrillSupport support;

    public DrillLessonController(ConceptRepository conceptRepo, ConceptLessonRepository conceptLessonRepo,
                                 SubPointPassRepository subPointPassRepo, LessonQaRepository lessonQaRepo,
                                 DrillRunRepository runRepo, ProgressContextService progressContext,
                                 LessonGenerator lessonGenerator, LessonQaGenerator lessonQaGenerator,
                                 DrillSupport support) {
        this.conceptRepo = conceptRepo;
        this.conceptLessonRepo = conceptLessonRepo;
        this.subPointPassRepo = subPointPassRepo;
        this.lessonQaRepo = lessonQaRepo;
        this.runRepo = runRepo;
        this.progressContext = progressContext;
        this.lessonGenerator = lessonGenerator;
        this.lessonQaGenerator = lessonQaGenerator;
        this.support = support;
    }


    // ------------------------------------------------------------ 先教后考（拆解 + 子知识点讲解）

    /** 拆解知识点为子知识点清单（缓存 concept.lesson_outline；无缓存则现场拆解后写回）。 */
    @PostMapping("/{conceptId}/outline")
    public OutlineView outline(@PathVariable Long conceptId) {
        Long uid = CurrentUser.id();
        Concept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));

        List<String> subPoints = lessonGenerator.outlineFromJson(concept.getLessonOutline());
        boolean cached = !subPoints.isEmpty();
        if (!cached) {
            subPoints = lessonGenerator.ensureOutline(concept, progressContext.contextFor(uid, conceptId));
            conceptRepo.save(concept);
        }
        return outlineView(uid, conceptId, concept, subPoints, cached);
    }

    /** 用户新增一个子知识点：写入 lesson_outline 缓存，讲解首次打开时按需生成。 */
    @PostMapping("/{conceptId}/sub-points")
    public OutlineView addSubPoint(@PathVariable Long conceptId,
                                   @RequestBody SubPointEditRequest req) {
        Long uid = CurrentUser.id();
        Concept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        String sp = req.subPoint() == null ? "" : req.subPoint().trim();
        if (sp.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "子知识点不能为空");
        }
        List<String> subs = new java.util.ArrayList<>(lessonGenerator.outlineFromJson(concept.getLessonOutline()));
        if (subs.stream().anyMatch(s -> s.trim().equalsIgnoreCase(sp))) {
            throw new ResponseStatusException(BAD_REQUEST, "该子知识点已存在");
        }
        // 语义重复校验：与已有子点「内容几乎一样」也不允许（如「列表推导式」vs「列表推导式的用法」）
        java.util.List<String> probe = new java.util.ArrayList<>(subs);
        probe.add(sp);
        if (LessonGenerator.dedupeSimilar(probe).size() != probe.size()) {
            throw new ResponseStatusException(BAD_REQUEST, "该子知识点与已有子知识点内容重复，请换个说法");
        }
        subs.add(sp);
        saveOutline(concept, subs);
        return outlineView(uid, conceptId, concept, subs, true);
    }

    /** 删除一个子知识点：从 outline 移除，并同步清理讲解缓存与「直接通过」记录。 */
    @PostMapping("/{conceptId}/sub-points/remove")
    public OutlineView removeSubPoint(@PathVariable Long conceptId,
                                      @RequestBody SubPointEditRequest req) {
        Long uid = CurrentUser.id();
        Concept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        String sp = req.subPoint() == null ? "" : req.subPoint().trim();
        List<String> subs = new java.util.ArrayList<>(lessonGenerator.outlineFromJson(concept.getLessonOutline()));
        boolean removed = subs.removeIf(s -> s.trim().equalsIgnoreCase(sp));
        if (!removed) {
            throw new ResponseStatusException(BAD_REQUEST, "子知识点不存在");
        }
        saveOutline(concept, subs);
        conceptLessonRepo.deleteByConceptIdAndSubPoint(conceptId, sp);
        subPointPassRepo.deleteByUserIdAndConceptIdAndSubPoint(uid, conceptId, sp);
        return outlineView(uid, conceptId, concept, subs, true);
    }

    private void saveOutline(Concept concept, List<String> subPoints) {
        String json = lessonGenerator.outlineToJson(subPoints);
        if (json != null) {
            concept.setLessonOutline(json);
            conceptRepo.save(concept);
        }
    }

    /** 组装 OutlineView：手动「直接通过」与判分通过（≥及格线）的练习并集为达标子点。 */
    private OutlineView outlineView(Long uid, Long conceptId, Concept concept,
                                    List<String> subPoints, boolean cached) {
        List<String> completed = new java.util.ArrayList<>(runRepo
                .findPassedFocusedRuns(uid, DrillRunStatus.GRADED, PASS_LINE).stream()
                .filter(r -> support.questionContainsConcept(r.getQuestionId(), conceptId))
                .map(DrillRun::getFocusSubPoint)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList());
        subPointPassRepo.findByUserId(uid).stream()
                .filter(p -> conceptId.equals(p.getConceptId()))
                .map(SubPointPass::getSubPoint)
                .filter(s -> !completed.contains(s))
                .forEach(completed::add);
        return new OutlineView(conceptId, concept.getName(), concept.getTopic(),
                subPoints, completed, cached);
    }

    /** 手动「直接通过 / 取消通过」某个子知识点（简单知识点跳过做题）。 */
    @PostMapping("/{conceptId}/sub-point-pass")
    public Map<String, Object> subPointPass(@PathVariable Long conceptId,
                                            @RequestBody SubPointPassRequest req) {
        Long uid = CurrentUser.id();
        conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        if (req.subPoint() == null || req.subPoint().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "子知识点不能为空");
        }
        if (Boolean.TRUE.equals(req.passed())) {
            if (subPointPassRepo.findByUserIdAndConceptIdAndSubPoint(uid, conceptId, req.subPoint()).isEmpty()) {
                SubPointPass p = new SubPointPass();
                p.setUserId(uid);
                p.setConceptId(conceptId);
                p.setSubPoint(req.subPoint());
                subPointPassRepo.save(p);
            }
        } else {
            subPointPassRepo.deleteByUserIdAndConceptIdAndSubPoint(uid, conceptId, req.subPoint());
        }
        return Map.of("ok", true);
    }

    /** 子知识点讲解 SSE 流（缓存 concept_lesson；无缓存则流式生成后写回）。
     *  {@code refresh=true}（「换种描述」按钮）：跳过缓存强制重新生成，并把旧讲解文本
     *  传给生成器作参考，让新讲解换角度/换描述、不照搬；生成后覆盖缓存。 */
    @PostMapping(value = "/{conceptId}/lesson", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> lesson(@PathVariable Long conceptId,
                                                        @RequestParam String subPoint,
                                                        @RequestParam(defaultValue = "false") boolean refresh) {
        Long uid = CurrentUser.id();
        Concept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        final String sub = subPoint.trim();
        if (sub.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "subPoint 不能为空");
        }

        // 缓存命中：直接整体下发（一个 data 帧）；refresh=true 时跳过缓存强制重新生成。
        final ConceptLesson cachedLesson = conceptLessonRepo
                .findByConceptIdAndSubPoint(conceptId, sub).orElse(null);
        final boolean useCache = !refresh && cachedLesson != null;
        // 换种描述时把旧讲解文本交给生成器，让它换角度/换例子，避免照搬。
        final String previousText = (refresh && cachedLesson != null) ? cachedLesson.getLessonText() : null;
        final String context = progressContext.contextFor(uid, conceptId);

        return SseStream.start(sink -> {
            sink.start();
            if (useCache) {
                String cachedText = cachedLesson.getLessonText();
                String normalized = lessonGenerator.normalizeLesson(cachedText);
                String trimmed = cachedText == null ? "" : cachedText.trim();
                if (!normalized.equals(trimmed)) {
                    cachedLesson.setLessonText(normalized);
                    cachedLesson.setCharCount(normalized.length());
                    conceptLessonRepo.save(cachedLesson);
                }
                sink.token(normalized);
            } else {
                List<LessonGenerator.SiblingLesson> siblings =
                        lessonGenerator.siblingSummaries(conceptLessonRepo.findByConceptId(conceptId), sub);
                String full = lessonGenerator.streamLesson(concept, sub, context, previousText, siblings,
                        sink::token, sink::reasoning);

                if (full != null && !full.isBlank() && !sink.isBroken()) {
                    try {
                        conceptLessonRepo.findByConceptIdAndSubPoint(conceptId, sub)
                                .ifPresentOrElse(exist -> {
                                    exist.setLessonText(full); exist.setCharCount(full.length());
                                    conceptLessonRepo.save(exist);
                                }, () -> {
                                    ConceptLesson cl = new ConceptLesson();
                                    cl.setConceptId(conceptId); cl.setSubPoint(sub);
                                    cl.setLessonText(full); cl.setCharCount(full.length());
                                    conceptLessonRepo.save(cl);
                                });
                    } catch (Exception e) {
                        log.debug("lesson cache write failed (ignored): {}", e.getMessage());
                    }
                } else if (full == null || full.isBlank()) {
                    sink.token("(lesson generation failed, you can start practicing first)");
                }
            }
            sink.done();
        });
    }

    // ------------------------------------------------------------ 子知识点讲解答疑（仅当前用户私有）

    /** 讲解页答疑：拉取当前用户在该子知识点下的全部历史（按时间升序）。 */
    @GetMapping("/{conceptId}/lesson/qa")
    public List<LessonQaView> lessonQa(@PathVariable Long conceptId, @RequestParam String subPoint) {
        Long uid = CurrentUser.id();
        conceptRepo.findById(conceptId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        String sub = subPoint.trim();
        if (sub.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "subPoint 不能为空");
        return lessonQaRepo.findByUserIdAndConceptIdAndSubPointOrderByIdAsc(uid, conceptId, sub).stream()
                .map(m -> new LessonQaView(m.getId(), m.getRole(), m.getText(), m.getAnchor(), m.getCreatedAt()))
                .toList();
    }

    /**
     * 讲解页答疑 SSE（POST /{conceptId}/lesson/chat?subPoint=...）：
     * <ol>
     *   <li>先持久化学生提问（写入 lesson_qa_message）；</li>
     *   <li>逐 token 推 AI 回答（默认 message 事件，data:{"text":...}），event:reasoning 推思考；</li>
     *   <li>event:done 带完整回答文本，随后把 AI 回答写入同表（前端可用 done 的全文兜底覆盖截断）；</li>
     *   <li>event:error 流式中途异常。</li>
     * </ol>
     * 答疑与 run/判分/mastery 完全解耦：只存于讲解页自己的表，仅当前用户可见。
     */
    @PostMapping(value = "/{conceptId}/lesson/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> lessonChat(
            @PathVariable Long conceptId,
            @RequestParam String subPoint,
            @RequestBody LessonChatRequest req) {
        Long uid = CurrentUser.id();
        Concept concept = conceptRepo.findById(conceptId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "知识点不存在"));
        final String sub = subPoint.trim();
        if (sub.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "subPoint 不能为空");
        String question = req.question() == null ? "" : req.question().trim();
        if (question.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "问题不能为空");
        String anchor = req.anchor() == null ? null : req.anchor().trim();

        // 讲解正文（最新缓存；refresh 后覆盖的就是它）
        ConceptLesson lesson = conceptLessonRepo.findByConceptIdAndSubPoint(conceptId, sub).orElse(null);
        // 该用户自己的学习上下文（与出题/对话同一套装配：学生画像 + 概念要点 + 资料块 + 互联网）
        String context = progressContext.contextFor(uid, conceptId);
        // 该用户在此子点下已答过的历史（AI 避免重复已回答的内容）
        List<LessonQaMessage> historyMsgs =
                lessonQaRepo.findByUserIdAndConceptIdAndSubPointOrderByIdAsc(uid, conceptId, sub);
        List<LessonQaGenerator.QaPair> history = new java.util.ArrayList<>();
        for (int i = 0; i < historyMsgs.size() - 1; i++) {
            LessonQaMessage m = historyMsgs.get(i);
            if ("user".equals(m.getRole())) {
                LessonQaMessage next = historyMsgs.get(i + 1);
                if ("assistant".equals(next.getRole()) && next.getText() != null) {
                    history.add(new LessonQaGenerator.QaPair(m.getText(), next.getText()));
                }
            }
        }

        // 学生提问先落库（id 会回传给前端用于删除）
        LessonQaMessage userMsg = new LessonQaMessage();
        userMsg.setUserId(uid);
        userMsg.setConceptId(conceptId);
        userMsg.setSubPoint(sub);
        userMsg.setRole("user");
        userMsg.setText(question);
        userMsg.setAnchor(anchor);
        userMsg = lessonQaRepo.save(userMsg);
        final long userMsgId = userMsg.getId();

        return SseStream.start(sink -> {
            sink.event("start", "{\"userMessageId\":" + userMsgId + "}");
            String full = lessonQaGenerator.streamAnswer(
                    concept.getName(), concept.getTopic(), concept.getLayer(),
                    sub, lesson == null ? null : lesson.getLessonText(), anchor, context, history, question,
                    sink::token, sink::reasoning);
            if (full != null && !full.isBlank()) {
                LessonQaMessage aiMsg = new LessonQaMessage();
                aiMsg.setUserId(uid); aiMsg.setConceptId(conceptId); aiMsg.setSubPoint(sub);
                aiMsg.setRole("assistant"); aiMsg.setText(full);
                try { lessonQaRepo.save(aiMsg); } catch (Exception e) { log.debug("lesson-qa 写库失败（忽略）: {}", e.getMessage()); }
            }
            sink.doneWithText(full);
        });
    }

    /** 删除当前用户在某个子知识点下的若干条答疑（仅自己的记录，前端多选 + 二次确认后调用）。 */
    @PostMapping("/{conceptId}/lesson/qa/delete")
    public Map<String, Object> deleteLessonQa(@PathVariable Long conceptId,
                                              @RequestParam String subPoint,
                                              @RequestBody LessonQaDeleteRequest req) {
        Long uid = CurrentUser.id();
        String sub = subPoint.trim();
        if (sub.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "subPoint 不能为空");
        if (req.ids() == null || req.ids().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "请选择要删除的答疑记录");
        }
        int deleted = lessonQaRepo.deleteByIdsAndUser(uid, req.ids());
        return Map.of("ok", true, "deleted", deleted);
    }

    public record LessonQaView(Long id, String role, String text, String anchor, Instant createdAt) {}

    public record LessonChatRequest(String question, String anchor) {}

    public record LessonQaDeleteRequest(List<Long> ids) {}

    public record OutlineView(Long conceptId, String name, String topic, List<String> subPoints,
                              List<String> completedSubPoints, boolean cached) {}
    public record SubPointPassRequest(String subPoint, Boolean passed) {}
    public record SubPointEditRequest(String subPoint) {}
}
