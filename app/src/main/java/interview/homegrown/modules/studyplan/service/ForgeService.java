package interview.homegrown.modules.studyplan.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.common.async.DurableJobQueue;
import interview.homegrown.common.async.DurableJobType;
import interview.homegrown.modules.drill.domain.Concept;
import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.drill.service.NgramSimilarityGuard;
import interview.homegrown.modules.studyplan.domain.KgForgeRun;
import interview.homegrown.modules.studyplan.repository.KgForgeRunRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * 知识图谱锻造（kg-forge sidecar）编排：建 run、派活、取提案、批准落库。
 *
 * <p><b>权责边界（严格）</b>：sidecar 的 LangGraph 图只产出提案（存在它的
 * checkpoint 里）；批准时由本服务做确定性校验（层级范围/字段长度/与既有概念
 * trigram 去重）后写 concept——Agent 无写库权，与「教学决策权归服务端」同构。</p>
 */
@Service
public class ForgeService {

    private static final Logger log = LoggerFactory.getLogger(ForgeService.class);

    /** 与 sidecar 的 dedup_proposals / QuestionService.DUP_THRESHOLD 同值。 */
    private static final double DUP_THRESHOLD = 0.85;
    private static final int MAX_SUB_POINTS = 8;

    private final KgForgeRunRepository runRepo;
    private final ConceptRepository conceptRepo;
    private final DurableJobQueue jobQueue;
    private final NgramSimilarityGuard similarity;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String secret;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public ForgeService(KgForgeRunRepository runRepo, ConceptRepository conceptRepo,
                        DurableJobQueue jobQueue, NgramSimilarityGuard similarity,
                        ObjectMapper objectMapper,
                        @Value("${app.forge.base-url}") String baseUrl,
                        @Value("${app.forge.secret}") String secret) {
        this.runRepo = runRepo;
        this.conceptRepo = conceptRepo;
        this.jobQueue = jobQueue;
        this.similarity = similarity;
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.secret = secret;
    }

    // ------------------------------------------------------------- 触发

    public Map<String, Object> create(Long userId, Long planId, String topic, String goal, Integer layerBudget) {
        if (topic == null || topic.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "请填写学习方向");
        KgForgeRun run = new KgForgeRun();
        run.setUserId(userId);
        run.setPlanId(planId);
        run.setTopic(topic.strip());
        run.setGoal(goal == null || goal.isBlank() ? null : goal.strip());
        run.setLayerBudget(layerBudget == null ? 50 : Math.max(10, Math.min(120, layerBudget)));
        run.setStatus("PENDING");
        run = runRepo.save(run);
        run.setThreadId("forge-" + run.getId());
        runRepo.save(run);
        // 记住请求级 BYOK 配置，Worker 领取时随任务转发给 sidecar（key 只经内存）
        jobQueue.enqueue(DurableJobType.KG_FORGE, run.getId(), userId, false, false);
        return Map.of("id", run.getId(), "threadId", run.getThreadId());
    }

    /** DurableJobWorker 回调：把任务连同用户 BYOK 配置转发给 sidecar（202 即接单）。 */
    public void runJob(Long runId, Long userId) {
        KgForgeRun run = runRepo.findByUserIdAndId(userId, runId).orElse(null);
        if (run == null) return;
        run.setStatus("RUNNING");
        runRepo.save(run);

        var existing = existingConceptNames(run.getPlanId());
        Map<String, Object> body = new java.util.HashMap<>(Map.of(
                "run_id", run.getThreadId(),
                "topic", run.getTopic(),
                "goal", run.getGoal() == null ? "" : run.getGoal(),
                "layer_budget", run.getLayerBudget(),
                "existing_names", existing));
        var cfg = jobQueue.configFor(userId);
        if (cfg != null && cfg.apiKey() != null && !cfg.apiKey().isBlank()) {
            // BYOK：只随本请求进 sidecar 内存（KeyRing），绝不落 checkpoint/库
            body.put("llm", Map.of(
                    "base_url", cfg.baseUrl(),
                    "api_key", cfg.apiKey(),
                    "model", cfg.model(),
                    "temperature", cfg.temperature()));
        }
        post("/runs", body);
        log.info("锻造任务已派发 runId={} thread={} concepts存量={} llm={}",
                runId, run.getThreadId(), existing.size(), cfg != null ? cfg.provider() : "server-default");
    }

    public void markJobFailure(Long runId, Long userId, boolean dead, String reason) {
        runRepo.findByUserIdAndId(userId, runId).ifPresent(run -> {
            run.setStatus("FAILED");
            run.setError(reason == null ? "锻造任务失败" : reason);
            runRepo.save(run);
        });
    }

    // ------------------------------------------------------------- 状态

    /** 前端轮询：行状态 + sidecar 实时状态（审核载荷 concepts/report 来自 checkpoint）。 */
    public Map<String, Object> getState(Long userId, Long runId) {
        KgForgeRun run = owned(userId, runId);
        if (List.of("APPROVED", "REJECTED").contains(run.getStatus())) {
            return Map.of("id", run.getId(), "status", run.getStatus(),
                    "conceptCount", run.getConceptCount());
        }
        JsonNode remote;
        try {
            remote = get("/runs/" + run.getThreadId());
        } catch (Exception e) {
            // sidecar 暂不可达：用行状态兜底（PENDING/RUNNING/FAILED）
            log.debug("查询 sidecar 状态失败 runId={}: {}", runId, e.getMessage());
            return Map.of("id", run.getId(), "status",
                    "FAILED".equals(run.getStatus()) ? "FAILED" : "RUNNING",
                    "error", run.getError());
        }
        String status = remote.path("status").asText("RUNNING").toUpperCase();
        // 同步行状态（列表页不依赖 sidecar）
        if (!status.equals(run.getStatus())) {
            run.setStatus(status);
            if ("FAILED".equals(status)) run.setError(remote.path("error").asText(null));
            runRepo.save(run);
        }
        Map<String, Object> out = new java.util.HashMap<>(Map.of("id", run.getId(), "status", status));
        if (remote.has("concepts")) out.put("concepts", remote.get("concepts"));
        if (remote.has("report")) out.put("report", remote.get("report"));
        if (remote.hasNonNull("error")) out.put("error", remote.get("error").asText());
        return out;
    }

    // ------------------------------------------------------------- 审核落库

    /**
     * 批准（可携带用户编辑后的提案）：确定性校验 + 与既有概念 trigram 去重后写 concept
     * （含 lesson_outline = 子知识点 JSON），最后通知 sidecar 收尾图状态。
     * 幂等：重复批准直接返回既有结果。
     */
    public Map<String, Object> approve(Long userId, Long runId, JsonNode concepts) {
        KgForgeRun run = owned(userId, runId);
        if ("APPROVED".equals(run.getStatus())) {
            return Map.of("created", 0, "skipped", List.of(), "alreadyApproved", true);
        }
        if (!"AWAITING_REVIEW".equals(run.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "当前状态不可批准: " + run.getStatus());
        }
        if (concepts == null || !concepts.isArray() || concepts.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "提案为空，请至少保留一条概念");
        }

        List<Concept> existing = run.getPlanId() != null
                ? conceptRepo.findByStudyPlanId(run.getPlanId())
                : conceptRepo.findByStudyPlanIdIsNull();
        Set<String> batchNames = new HashSet<>();
        List<Map<String, String>> skipped = new ArrayList<>();
        int created = 0;

        for (JsonNode c : concepts) {
            String name = c.path("name").asText("").strip();
            if (name.isEmpty() || name.length() > 100) {
                skipped.add(Map.of("name", name, "reason", "名称为空或超长"));
                continue;
            }
            int layer = c.path("layer").asInt(0);
            if (layer < 1 || layer > 5) {
                skipped.add(Map.of("name", name, "reason", "层级必须在 1-5"));
                continue;
            }
            if (batchNames.contains(name)) {
                skipped.add(Map.of("name", name, "reason", "与本批次重复"));
                continue;
            }
            String dup = findSimilarExisting(name, existing, batchNames);
            if (dup != null) {
                skipped.add(Map.of("name", name, "reason", "与已有概念「" + dup + "」高度相似"));
                continue;
            }
            Concept concept = new Concept();
            concept.setTopic(truncate(c.path("topic").asText(run.getTopic()).strip(), 100));
            concept.setName(name);
            concept.setDescription(truncate(c.path("description").asText(""), 2000));
            concept.setLayer(layer);
            concept.setStudyPlanId(run.getPlanId());
            concept.setLessonOutline(serializeSubPoints(c.path("sub_points")));
            conceptRepo.save(concept);
            batchNames.add(name);
            created++;
        }

        run.setStatus("APPROVED");
        run.setConceptCount(created);
        runRepo.save(run);
        // 收尾 sidecar 图状态（best-effort：checkpoint 残留无害，失败只记日志）
        try {
            post("/runs/" + run.getThreadId() + "/finalize", Map.of("decision", "approved"));
        } catch (Exception e) {
            log.warn("通知 sidecar finalize 失败（不影响落库结果）runId={}: {}", runId, e.getMessage());
        }
        return Map.of("created", created, "skipped", skipped);
    }

    public Map<String, Object> reject(Long userId, Long runId) {
        KgForgeRun run = owned(userId, runId);
        if (!List.of("AWAITING_REVIEW", "RUNNING", "PENDING").contains(run.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "当前状态不可拒绝: " + run.getStatus());
        }
        run.setStatus("REJECTED");
        runRepo.save(run);
        try {
            post("/runs/" + run.getThreadId() + "/finalize", Map.of("decision", "rejected"));
        } catch (Exception e) {
            log.warn("通知 sidecar finalize 失败 runId={}: {}", runId, e.getMessage());
        }
        return Map.of("ok", true);
    }

    // ------------------------------------------------------------- 内部

    private KgForgeRun owned(Long userId, Long runId) {
        return runRepo.findByUserIdAndId(userId, runId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "锻造任务不存在"));
    }

    /** 去重池：目标方向的全部概念（无方向 = 全局种子池）。 */
    private List<String> existingConceptNames(Long planId) {
        List<Concept> pool = planId != null
                ? conceptRepo.findByStudyPlanId(planId)
                : conceptRepo.findByStudyPlanIdIsNull();
        return pool.stream().map(Concept::getName).filter(n -> n != null && !n.isBlank()).toList();
    }

    private String findSimilarExisting(String name, List<Concept> existing, Set<String> batchNames) {
        for (Concept c : existing) {
            if (c.getName() != null && similarity.similarity(name, c.getName()) > DUP_THRESHOLD) return c.getName();
        }
        for (String b : batchNames) {
            if (similarity.similarity(name, b) > DUP_THRESHOLD) return b;
        }
        return null;
    }

    private String serializeSubPoints(JsonNode subPoints) {
        List<String> keep = new ArrayList<>();
        if (subPoints != null && subPoints.isArray()) {
            for (JsonNode s : subPoints) {
                String t = s.asText("").strip();
                if (!t.isEmpty() && t.length() <= 100) keep.add(t);
                if (keep.size() >= MAX_SUB_POINTS) break;
            }
        }
        try {
            return objectMapper.writeValueAsString(keep);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    // ------------------------------------------------------------- sidecar HTTP

    private JsonNode post(String path, Object body) {
        return exchange("POST", path, body);
    }

    private JsonNode get(String path) {
        return exchange("GET", path, null);
    }

    private JsonNode exchange(String method, String path, Object body) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .timeout(Duration.ofSeconds(15))
                    .header("X-Forge-Secret", secret);
            if (body != null) {
                b.header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
            } else if ("GET".equals(method)) {
                b.GET();
            } else {
                b.POST(HttpRequest.BodyPublishers.noBody());
            }
            HttpResponse<String> resp = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                throw new RuntimeException("kg-forge " + resp.statusCode() + ": " + resp.body());
            }
            return objectMapper.readTree(resp.body());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("kg-forge 不可达: " + e.getMessage(), e);
        }
    }
}
