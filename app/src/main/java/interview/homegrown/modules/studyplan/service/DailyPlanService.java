package interview.homegrown.modules.studyplan.service;

import interview.homegrown.modules.drill.service.ProgressContextService;

import interview.homegrown.modules.drill.service.QuestionService;

import interview.homegrown.modules.drill.service.SelectionService;

import interview.homegrown.modules.corpus.service.CorpusService;

import interview.homegrown.common.ai.AiConfig;
import interview.homegrown.common.ai.AiSettingsService;
import interview.homegrown.modules.drill.domain.Concept;
import interview.homegrown.modules.studyplan.domain.DailyTask;
import interview.homegrown.modules.drill.domain.Mastery;
import interview.homegrown.modules.drill.domain.QuestionBank;
import interview.homegrown.modules.drill.domain.SelectedTask;
import interview.homegrown.modules.studyplan.domain.StudyPlan;
import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.studyplan.repository.DailyTaskRepository;
import interview.homegrown.modules.drill.repository.MasteryRepository;
import interview.homegrown.modules.drill.repository.QuestionBankRepository;
import interview.homegrown.modules.studyplan.repository.StudyPlanRepository;
import interview.homegrown.modules.studyplan.dto.DailyTaskView;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * 每日学习任务排程：让学习方向"自主安排每天复习多少、新学多少"，并异步预生成题目。
 *
 * <p>规则（循序渐进）：
 * <ul>
 *   <li><b>REVIEW</b>：本方向内到期（dueAt&lt;=now）且已掌握的概念，按到期时间升序，封顶 {@link #REVIEW_CAP}；</li>
 *   <li><b>NEW</b>：按「层掌握率递进解锁」选可出层，等概率抽层，封顶 {@link #NEW_PER_PLAN}。
 *       层掌握率 = 该层内写达标（mastery_level&gt;=2）的概念数 / 该层概念总数；
 *       L1 达标 50% 才解锁 L2，L2 达标 50% 才解锁 L3，以此类推——一开始 L1 没掌握就只出 L1 的题，
 *       用户手动指定层级（「练这一层」）不受此门槛限制。</li>
 *   <li>落表 PENDING → 持久任务异步出题（复用 {@link QuestionService} 去重/跨知识点逻辑）→ READY。</li>
 * </ul>
 *
 * <p>触发：{@link #generateAll()} 每天 06:30 全员预生成；{@link #ensureToday(Long)} 懒兜底（用户访问今日任务/复盘时
 * 若今天没生成则现场生成，不依赖定时器恰好跑过）。
 */
@Service
public class DailyPlanService {

    private static final Logger log = LoggerFactory.getLogger(DailyPlanService.class);

    /** 每个方向每天新学的概念数 */
    private static final int NEW_PER_PLAN = 3;
    /** 每个方向每天复习（到期）的概念数上限 */
    private static final int REVIEW_CAP = 8;

    /** 层解锁门槛：上一层掌握率达标比例（L1 达标 50% 才解锁 L2，以此类推） */
    private static final double LAYER_UNLOCK_RATIO = 0.5;
    /** 写达标线：mastery_level >= 2 才算该层掌握 */
    private static final int MASTERED_LEVEL = 2;

    private final DailyTaskRepository taskRepo;
    private final StudyPlanRepository planRepo;
    private final ConceptRepository conceptRepo;
    private final MasteryRepository masteryRepo;
    private final QuestionBankRepository qbRepo;
    private final SelectionService selectionService;
    private final QuestionService questionService;
    private final CorpusService corpusService;
    private final ProgressContextService progressContext;
    private final AiSettingsService settings;
    /** 显式事务边界：出题（LLM，10~60s）绝不能在事务里占着连接（见 ensureReady 注释）。 */
    private final org.springframework.transaction.support.TransactionTemplate transactions;

    private final ExecutorService generatorPool;

    public DailyPlanService(DailyTaskRepository taskRepo, StudyPlanRepository planRepo,
                            ConceptRepository conceptRepo, MasteryRepository masteryRepo,
                            QuestionBankRepository qbRepo, SelectionService selectionService,
                            QuestionService questionService, CorpusService corpusService,
                            ProgressContextService progressContext, AiSettingsService settings,
                            org.springframework.transaction.support.TransactionTemplate transactions) {
        this.taskRepo = taskRepo;
        this.planRepo = planRepo;
        this.conceptRepo = conceptRepo;
        this.masteryRepo = masteryRepo;
        this.qbRepo = qbRepo;
        this.selectionService = selectionService;
        this.questionService = questionService;
        this.corpusService = corpusService;
        this.progressContext = progressContext;
        this.settings = settings;
        this.transactions = transactions;
        this.generatorPool = Executors.newFixedThreadPool(2, r -> {
            Thread t = new Thread(r, "daily-task-gen");
            t.setDaemon(true);
            return t;
        });
    }

    /** 定时：每天 06:30 为所有用户预生成今日任务（主动推送的承载——打开即 READY，无需等待）。 */
    @Scheduled(cron = "0 30 6 * * *")
    public void generateAll() {
        for (Long uid : planRepo.findDistinctUserIds()) {
            try {
                transactions.execute(status -> ensureToday(uid));
            } catch (Exception e) {
                log.warn("定时生成今日任务失败 uid={}: {}", uid, e.getMessage());
            }
        }
    }

    /** 服务在 06:30 停机时补排今天的任务；每日任务与队列均按实体幂等。 */
    @Scheduled(fixedDelay = 1800000, initialDelay = 10000)
    public void recoverMissedDailySchedule() {
        generateAll();
    }

    /**
     * 幂等：今天已生成过的方向不再重复建；但<b>每个方向都保证有今日任务</b>——
     * 某个方向若是今天后建的（首访问时还没生成），也要当场补上，否则该方向今日任务为空。
     * PENDING 未出题则异步补生成。返回今日任务。
     *
     * <p><b>刻意不加 @Transactional</b>（历史缺陷修复）：
     * <ul>
     *   <li>外层事务里 catch {@link DataIntegrityViolationException} 无效——Hibernate 约束冲突
     *       会把事务标记 rollback-only，方法返回时抛 UnexpectedRollbackException（/today 直接 500），
     *       "并发下重复生成读回已有任务"的兜底从未真正生效；</li>
     *   <li>外层事务未提交就 submit 线程池，异步线程在 READ_COMMITTED 下看不到新建的
     *       daily_task 行，findById 得 null 直接返回——预生成大概率丢失；</li>
     *   <li>{@code generateAll} 里 {@code this.ensureToday(uid)} 自调用本就绕过了事务代理，
     *       两条调用路径（定时器/控制器）语义不一致。</li>
     * </ul>
     * 去掉外层事务后：saveAll 自带单批原子性（整批插入要么全成功要么全回滚），
     * DIV 恢复真正可用，generateAsync 提交时行已可见，定时器与控制器行为一致。
     * 幂等性由「hasTasks 检查 + 唯一约束 + SKIPPED/DONE 不重写」共同保证，无需跨语句原子。
     */
    public List<DailyTask> ensureToday(Long userId) {
        LocalDate today = LocalDate.now();
        List<DailyTask> existing = taskRepo.findByUserIdAndTaskDate(userId, today);
        List<DailyTask> created = new ArrayList<>();
        for (StudyPlan plan : planRepo.findByUserId(userId)) {
            boolean hasTasks = existing.stream().anyMatch(t -> plan.getId().equals(t.getPlanId()));
            if (!hasTasks) {
                created.addAll(planTasks(userId, plan, today));
            }
        }
        if (!created.isEmpty()) {
            try {
                existing = new ArrayList<>(existing);
                existing.addAll(taskRepo.saveAll(created));
            } catch (DataIntegrityViolationException e) {
                // 并发下重复生成：直接读回已存在的
                existing = taskRepo.findByUserIdAndTaskDate(userId, today);
            }
        }
        // 清理孤儿任务：方向或知识点已被删除的任务置 SKIPPED（前端统一过滤该状态），
        // 避免「今日待办」残留已删除方向的无效条目（删除方向/知识点时并未清 daily_task）。
        skipOrphaned(existing);
        for (DailyTask t : existing) {
            if (DailyTask.STATUS_PENDING.equals(t.getStatus()) && t.getQuestionId() == null) {
                jobs.enqueue(DurableJobType.DAILY_QUESTION, t.getId(), userId, false, false);
            }
        }
        return existing;
    }

    /**
     * 把「方向或知识点已不存在」的今日任务置 SKIPPED。幂等：已 SKIPPED 不重写。
     * planId 为 null（全局任务）时只校验知识点是否存在。
     */
    private void skipOrphaned(List<DailyTask> tasks) {
        if (tasks.isEmpty()) return;
        Set<Long> planIds = tasks.stream().map(DailyTask::getPlanId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> planExists = planIds.isEmpty() ? Set.of()
                : planRepo.findAllById(planIds).stream().map(StudyPlan::getId).collect(Collectors.toSet());
        Set<Long> conceptIds = tasks.stream().map(DailyTask::getConceptId).collect(Collectors.toSet());
        Set<Long> conceptExists = conceptRepo.findAllById(conceptIds).stream()
                .map(Concept::getId).collect(Collectors.toSet());
        for (DailyTask t : tasks) {
            boolean orphaned = (t.getPlanId() != null && !planExists.contains(t.getPlanId()))
                    || !conceptExists.contains(t.getConceptId());
            // 已 SKIPPED 的不重写；DONE 的也一并作废——方向已删，其完成记录不再计入今日统计
            if (orphaned && !DailyTask.STATUS_SKIPPED.equals(t.getStatus())) {
                t.setStatus(DailyTask.STATUS_SKIPPED);
                taskRepo.save(t);
            }
        }
    }

    /** 今日任务视图（含方向名、概念名、预生成题干）。 */
    @Transactional(readOnly = true)
    public List<DailyTaskView> todayView(Long userId) {
        List<DailyTask> tasks = taskRepo.findByUserIdAndTaskDate(userId, LocalDate.now());
        if (tasks.isEmpty()) {
            return List.of();
        }
        Map<Long, String> planTitles = planRepo.findByUserId(userId).stream()
                .collect(Collectors.toMap(StudyPlan::getId, StudyPlan::getTitle));
        List<Concept> concepts = conceptRepo.findAllById(
                tasks.stream().map(DailyTask::getConceptId).toList());
        Map<Long, Concept> byConcept = concepts.stream()
                .collect(Collectors.toMap(Concept::getId, c -> c));

        List<DailyTaskView> views = new ArrayList<>();
        for (DailyTask t : tasks) {
            Concept c = byConcept.get(t.getConceptId());
            String stem = null;
            String probe = null;
            if (t.getQuestionId() != null) {
                QuestionBank qb = qbRepo.findById(t.getQuestionId()).orElse(null);
                if (qb != null) {
                    stem = qb.getStem();
                    probe = qb.getProbeType().name();
                }
            }
            views.add(new DailyTaskView(t.getId(), t.getPlanId(),
                    planTitles.getOrDefault(t.getPlanId(), "全局"),
                    t.getKind(), t.getConceptId(),
                    c == null ? "概念" : c.getName(),
                    c == null ? 0 : c.getLayer(),
                    t.getStatus(), t.getQuestionId(), stem, probe, t.getSubPoint()));
        }
        return views;
    }

    /** 取当前用户的一条任务（不存在 404）。 */
    @Transactional(readOnly = true)
    public DailyTask requireTask(Long userId, Long taskId) {
        return taskRepo.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "今日任务不存在"));
    }

    /** 任务已作答：置 DONE。 */
    @Transactional
    public void markDone(Long taskId) {
        taskRepo.findById(taskId).ifPresent(t -> {
            t.setStatus(DailyTask.STATUS_DONE);
            taskRepo.save(t);
        });
    }

    /**
     * 复习闭环：计划卡「复习」入口（start-plan review）不经过任务开题端点，
     * 用户在今日待办里的对应 REVIEW 任务会一直残留。这里把今日该方向该概念的
     * REVIEW 任务一并置 DONE（幂等：已 DONE 的不重复写）。
     */
    @Transactional
    public void markReviewDone(Long userId, Long planId, Long conceptId) {
        for (DailyTask t : taskRepo.findByUserIdAndTaskDate(userId, LocalDate.now())) {
            if (DailyTask.KIND_REVIEW.equals(t.getKind())
                    && planId.equals(t.getPlanId())
                    && conceptId.equals(t.getConceptId())
                    && !DailyTask.STATUS_DONE.equals(t.getStatus())) {
                t.setStatus(DailyTask.STATUS_DONE);
                taskRepo.save(t);
            }
        }
    }

    /** 今日 READY 任务（按 id 升序，尚未作答的）。 */
    @Transactional(readOnly = true)
    public List<DailyTask> readyTasksToday(Long userId) {
        return taskRepo.findByUserIdAndTaskDateAndStatusInOrderByIdAsc(
                userId, LocalDate.now(), List.of(DailyTask.STATUS_READY));
    }

    /**
     * 同步兜底出题：预生成还没好（PENDING）时现场出一题，保证任务可立即开练。
     * <p>出题是 LLM 调用（10~60s），<b>刻意不用 @Transactional</b>——放事务里会长期占住一个
     * 连接，并发几路就把 Hikari 池（默认 10）占满、整站排队。出题在无事务阶段完成后，
     * 回填 question_id/READY 走显式短事务；事务内重读任务，若并发方已回填则不覆盖。
     */
    public boolean ensureReady(Long userId, Long taskId) {
        DailyTask t = requireTask(userId, taskId);
        if (t.getQuestionId() == null) {
            SelectedTask sel = selectionService.pickFor(userId, t.getConceptId());
            QuestionBank qb = questionService.generate(sel, taskContext(t));   // LLM，无事务
            return Boolean.TRUE.equals(transactions.execute(tx -> {
                DailyTask task = requireTask(userId, taskId);   // 事务内重读最新状态
                if (task.getQuestionId() == null) {
                    task.setQuestionId(qb.getId());
                    task.setStatus(DailyTask.STATUS_READY);
                    taskRepo.save(task);
                }
                return task.getQuestionId() != null;
            }));
        }
        Long questionId = jdbc.queryForObject(
                "SELECT question_id FROM daily_task WHERE id = ? AND user_id = ?", Long.class, taskId, userId);
        return questionId != null;
    }

    /** 出题上下文：学生进度/概念要点 + 复习任务聚焦的子点约束（与 openRun 的 focus 语义一致）。 */
    private String taskContext(DailyTask t) {
        String context = progressContext.contextFor(t.getUserId(), List.of(t.getConceptId()));
        String ref = corpusService.referenceForConcept(t.getConceptId());
        String base = (context == null || context.isBlank()) ? ref : context;
        if (t.getSubPoint() == null || t.getSubPoint().isBlank()) return base;
        return (base == null ? "" : base + "\n\n")
                + "本次练习聚焦的子知识点：「" + t.getSubPoint() + "」。题目必须围绕这个子知识点展开，"
                + "不要考这个概念下的其它子知识点。";
    }

    // ------------------------------------------------------------ 内部

    private List<DailyTask> planTasks(Long userId, StudyPlan plan, LocalDate today) {
        List<DailyTask> out = new ArrayList<>();
        for (Concept c : pickReview(userId, plan.getId(), REVIEW_CAP)) {
            // 需求1：复习也基于子知识点——每日复习任务聚焦该概念下「还没通过」的子点（null = 概念级）
            String sub = selectionService.pickReviewSubPoint(userId, c.getId());
            out.add(newTask(userId, plan.getId(), today, DailyTask.KIND_REVIEW, c.getId(), sub));
        }
        for (Concept c : pickNew(userId, plan.getId(), NEW_PER_PLAN)) {
            out.add(newTask(userId, plan.getId(), today, DailyTask.KIND_NEW, c.getId(), null));
        }
        return out;
    }

    private DailyTask newTask(Long userId, Long planId, LocalDate today, String kind, Long conceptId, String subPoint) {
        DailyTask t = new DailyTask();
        t.setUserId(userId);
        t.setPlanId(planId);
        t.setTaskDate(today);
        t.setKind(kind);
        t.setConceptId(conceptId);
        t.setSubPoint(subPoint);
        return t;
    }

    /** 复习候选：本方向到期且已掌握的概念，按到期时间升序，封顶 cap */
    private List<Concept> pickReview(Long userId, Long planId, int cap) {
        Set<Long> planIds = conceptRepo.findByStudyPlanId(planId).stream()
                .map(Concept::getId).collect(Collectors.toSet());
        Instant now = Instant.now();
        return masteryRepo.findByUserId(userId).stream()
                .filter(m -> planIds.contains(m.getConceptId()))
                .filter(m -> m.getMasteryLevel() > 0)
                .filter(m -> m.getDueAt() != null && !m.getDueAt().isAfter(now))
                .sorted(Comparator.comparing(Mastery::getDueAt))
                .limit(cap)
                .map(m -> conceptRepo.findById(m.getConceptId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * 新学候选：按「层掌握率递进解锁」选可出层，等概率抽层，层内按出现顺序取未掌握概念，封顶 cap。
     *
     * <p>解锁链：层 L 可出，当且仅当它之下<b>所有存在</b>的层掌握率都 &gt;= 50%
     * （层掌握率 = 写达标概念数 / 该层概念总数）。若某层没有未掌握概念，则该层不参与抽层；
     * 可出层全空则本次不新学（不强凑）。随机种子含 (userId, planId, 日期)，同一天结果可复现。
     * 包级可见：供单测直接验证。
     */
    List<Concept> pickNew(Long userId, Long planId, int cap) {
        List<Concept> all = conceptRepo.findByStudyPlanId(planId);
        if (all.isEmpty()) {
            return List.of();
        }
        List<Mastery> mastery = masteryRepo.findByUserId(userId);
        Set<Long> masteredIds = mastery.stream()
                .filter(m -> m.getMasteryLevel() > 0)
                .map(Mastery::getConceptId).collect(Collectors.toSet());

        // 未掌握概念按层分组（层内保持查询顺序 = 按 id）
        Map<Integer, List<Concept>> poolByLayer = all.stream()
                .filter(c -> !masteredIds.contains(c.getId()))
                .collect(Collectors.groupingBy(Concept::getLayer));
        // 每层掌握率
        Map<Integer, Double> ratioByLayer = all.stream()
                .collect(Collectors.groupingBy(Concept::getLayer, Collectors.toList()))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey,
                        e -> layerRatio(mastery, e.getValue())));
        List<Integer> layerAsc = ratioByLayer.keySet().stream().sorted().toList();

        // 解锁链：层 L 可出 ⇔ 它之下所有存在的层掌握率都 >= 50%，且本层还有未掌握概念
        List<Integer> available = new ArrayList<>();
        for (int i = 0; i < layerAsc.size(); i++) {
            boolean gated = false;
            for (int j = 0; j < i; j++) {
                if (ratioByLayer.get(layerAsc.get(j)) < LAYER_UNLOCK_RATIO) {
                    gated = true;
                    break;
                }
            }
            if (!gated && !poolByLayer.getOrDefault(layerAsc.get(i), List.of()).isEmpty()) {
                available.add(layerAsc.get(i));
            }
        }
        if (available.isEmpty()) {
            return List.of();
        }

        // 每个名额独立等概率抽层（可出 L1/L2 → 各 50%；L1/L2/L3 → 各 1/3），层内按 id 顺序取
        Random rng = new Random(seed(userId, planId, LocalDate.now()));
        List<Concept> out = new ArrayList<>();
        while (out.size() < cap) {
            List<Integer> still = available.stream()
                    .filter(l -> !poolByLayer.get(l).isEmpty())
                    .toList();
            if (still.isEmpty()) break;
            int layer = still.get(rng.nextInt(still.size()));
            out.add(poolByLayer.get(layer).remove(0));
        }
        return out;
    }

    /** 层掌握率：写达标（level>=2）概念数 / 该层概念总数；空层视为 100%（不阻塞下层解锁） */
    private double layerRatio(List<Mastery> mastery, List<Concept> concepts) {
        if (concepts.isEmpty()) return 1.0;
        Set<Long> ids = concepts.stream().map(Concept::getId).collect(Collectors.toSet());
        long mastered = mastery.stream()
                .filter(m -> ids.contains(m.getConceptId()) && m.getMasteryLevel() >= MASTERED_LEVEL)
                .count();
        return (double) mastered / concepts.size();
    }

    /** 同一天结果可复现（含日期），便于排查今日任务为何这样排 */
    private long seed(Long userId, Long planId, LocalDate date) {
        return userId * 1_000_003L + planId * 31L + date.toEpochDay();
    }

    /**
     * 异步预出题：READY 后回填 question_id。失败保持 PENDING，下次 ensureToday 重试。
     * 线程内重新加载实体，避免跨线程改已分离实体。
     * 在途防重：同一任务同时只有一个预生成在跑（并发 ensureToday 会重复 submit，
     * 一次多余的 LLM 调用几十秒几十厘，纯浪费）；完成/失败即移出，可重试。
     */
    private final java.util.Set<Long> generating = java.util.concurrent.ConcurrentHashMap.newKeySet();

    private void generateAsync(Long taskId) {
        if (!generating.add(taskId)) {
            return;   // 已有同任务的预生成在途
        }
        generatorPool.submit(() -> {
            try {
                DailyTask t = taskRepo.findById(taskId).orElse(null);
                if (t == null || t.getQuestionId() != null) return;
                // 后台线程没有请求上下文，取任务归属用户的库配置（否则云端无服务器级 key，
                // 预生成全部报"尚未配置 API Key"、任务永远 PENDING）
                settings.withTaskConfig(settings.userConfig(t.getUserId()), () -> {
                    try {
                        SelectedTask sel = selectionService.pickFor(t.getUserId(), t.getConceptId());
                        QuestionBank qb = questionService.generate(sel, taskContext(t));
                        t.setQuestionId(qb.getId());
                        t.setStatus(DailyTask.STATUS_READY);
                        taskRepo.save(t);
                    } catch (Exception e) {
                        log.warn("预生成题目失败 taskId={}: {}", taskId, e.getMessage());
                    }
                });
            } catch (Exception e) {
                log.warn("预生成调度失败 taskId={}: {}", taskId, e.getMessage());
            } finally {
                generating.remove(taskId);
            }
        });
    }
}
