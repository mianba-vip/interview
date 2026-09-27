package interview.homegrown.modules.drill.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import interview.homegrown.common.exception.BusinessException;
import interview.homegrown.common.exception.ErrorCode;
import interview.homegrown.modules.drill.ai.GeneratedQuestion;
import interview.homegrown.modules.drill.ai.McqOption;
import interview.homegrown.modules.drill.ai.QuestionGenerator;
import interview.homegrown.modules.drill.domain.AnswerMode;
import interview.homegrown.modules.drill.domain.ProbeType;
import interview.homegrown.modules.drill.domain.QuestionBank;
import interview.homegrown.modules.drill.domain.ResponseFormat;
import interview.homegrown.modules.drill.domain.SelectedTask;
import interview.homegrown.modules.drill.repository.QuestionBankRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 出题：服务端定四维签名（concept_ids / probe_type / answer_mode / response_format），LLM 只填内容。
 *
 * <p><b>去重三闸</b>（痛点 2 的"问法重复"）：
 * <ol>
 *   <li><b>硬闸</b>：在 arity 允许的 probe_type 里，优先选该概念没用过的认知动作；</li>
 *   <li><b>软闸</b>：把历史题干注入 prompt，要求提问角度明显不同；</li>
 *   <li><b>兜底硬闸</b>：生成后算 trigram 相似度，超阈值就换 probe_type 重出，最多 3 次。</li>
 * </ol>
 * 前两闸管"大概率不重复"，第三闸管"模型抽风时也不会真的塞一道重复题进库"。
 */
@Service
public class QuestionService {

    private static final Logger log = LoggerFactory.getLogger(QuestionService.class);

    /** 相似度超过它就判定为重复题 */
    private static final double DUP_THRESHOLD = 0.85;
    /** 出题只调一次 LLM：推理模型每次要几十秒，重试代价太高；去重靠「优先未用 probe + 历史题干注入」 */
    private static final int MAX_ATTEMPTS = 2;
    private static final int HISTORY_LIMIT = 10;

    private final QuestionBankRepository qbRepo;
    private final QuestionGenerator generator;
    private final SimilarityGuard similarityGuard;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public QuestionService(QuestionBankRepository qbRepo, QuestionGenerator generator,
                           SimilarityGuard similarityGuard, ObjectMapper objectMapper) {
        this.qbRepo = qbRepo;
        this.generator = generator;
        this.similarityGuard = similarityGuard;
        this.objectMapper = objectMapper;
    }

    public QuestionBank generate(SelectedTask task) {
        return generate(task, null);
    }

    public QuestionBank generate(SelectedTask task, String referenceText) {
        return generate(task, referenceText, List.of());
    }

    /**
     * 生成新题，并额外避开当前用户在该子知识点真正做过的题。
     * userHistory 同时参与提示词去重和生成后相似度校验；referenceText 可包含历史作答对话，
     * 让模型针对已经答过、答对和薄弱的内容换场景、换角度继续考察。
     */
    public QuestionBank generate(SelectedTask task, String referenceText, List<String> userHistory) {
        int arity = task.arity();
        Long primaryId = task.conceptId();

        List<String> usedProbes = qbRepo.findUsedProbeTypes(primaryId, arity);
        List<String> history = new ArrayList<>(qbRepo.findRecentStems(primaryId, HISTORY_LIMIT));
        if (userHistory != null) {
            userHistory.stream()
                    .filter(s -> s != null && !s.isBlank() && !history.contains(s))
                    .limit(HISTORY_LIMIT)
                    .forEach(history::add);
        }
        List<ProbeType> tried = new ArrayList<>();
        GeneratedQuestion accepted = null;
        ProbeType acceptedProbe = null;

        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            ProbeType probe = pickProbeType(arity, usedProbes, tried);
            tried.add(probe);
            // 作答形态按认知动作分流：识别/补全/对比/倒推/找 bug 出选择题（用户输入字母作答、判分免 LLM）；
            // 场景设计与端到端设计保留文本作答。
            ResponseFormat format = CHOICE_PROBES.contains(probe) ? ResponseFormat.CHOICE : ResponseFormat.FREE_TEXT;

            GeneratedQuestion gq = generator.generate(task, probe, format, history, referenceText);
            if (gq == null || gq.stem == null || gq.stem.isBlank()) {
                // 兜底闸：模型漏顶层 stem 时 DB 非空约束会炸（整笔回滚、任务永远 PENDING）——带错重试而非落库崩
                log.warn("出题结果缺少顶层 stem，带错重试 attempt={} probe={}", attempt + 1, probe);
                referenceText = (referenceText == null ? "" : referenceText + "\n\n")
                        + "上一次输出缺少顶层 stem：JSON 顶层必须同时包含 stem（完整题干）、points、byConcept。";
                continue;
            }
            if (format == ResponseFormat.CHOICE && !validChoice(gq)) {
                // 选择题结构坏（选项数/正确项/题干缺字母行）会把判分变成全 MISS——带错重试而非落库
                log.warn("选择题结构不合法，带错重试 attempt={} probe={}", attempt + 1, probe);
                referenceText = (referenceText == null ? "" : referenceText + "\n\n")
                        + "上一次选择题结构不合法：options 必须恰好 4 项、key 为 A/B/C/D、有且只有 1 个 correct=true，"
                        + "且 stem 内必须出现 A./B./C./D. 四个选项行（与 options 逐字一致）。";
                continue;
            }
            double sim = similarityGuard.maxSimilarity(gq.stem, history);

            if (sim <= DUP_THRESHOLD) {
                accepted = gq;
                acceptedProbe = probe;
                break;
            }
            log.warn("出题重复度过高 sim={} concept={} probe={} attempt={}，换认知动作重出",
                    String.format("%.3f", sim), primaryId, probe, attempt + 1);
            accepted = gq;
            acceptedProbe = probe;
            referenceText = (referenceText == null ? "" : referenceText + "\n\n")
                    + "上一版新题与历史题过于相似（相似度 " + String.format("%.2f", sim)
                    + "），本次必须更换实际场景、示例代码和核心问法，不得只改措辞。";
        }

        if (accepted == null || accepted.stem == null || accepted.stem.isBlank()) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "出题失败：模型未返回有效题干，请重试");
        }
        ResponseFormat fmt = CHOICE_PROBES.contains(acceptedProbe) ? ResponseFormat.CHOICE : ResponseFormat.FREE_TEXT;
        if (fmt == ResponseFormat.CHOICE && !validChoice(accepted)) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "选择题结构不合法，请重试");
        }
        return persist(task, accepted, acceptedProbe, fmt);
    }

    /** 出选择题的认知动作：概念识别/补全/对比/倒推/找 bug——选项可客观判定；设计类保留文本作答。 */
    private static final java.util.Set<ProbeType> CHOICE_PROBES = java.util.Set.of(
            ProbeType.RECALL, ProbeType.CLOZE, ProbeType.CONTRAST, ProbeType.REVERSE, ProbeType.TRAP);

    /** 选择题结构硬校验：4 项、唯一正确、key 各异且题干内嵌对应选项行（不满足则带错重试）。 */
    private static boolean validChoice(GeneratedQuestion gq) {
        if (gq == null || gq.options == null || gq.options.size() != 4) return false;
        if (gq.options.stream().filter(McqOption::correct).count() != 1) return false;
        java.util.Set<String> keys = new java.util.HashSet<>();
        for (McqOption o : gq.options) {
            if (o.key() == null || o.text() == null || o.text().isBlank()) return false;
            if (!keys.add(o.key())) return false;
            if (!gq.stem.contains(o.key() + ".")) return false;
        }
        return true;
    }

    /**
     * 硬闸：先按 arity 过滤出合法 probe_type（CONTRAST/INTEGRATION 天然要求 arity&gt;=2），
     * 再优先挑没用过的，最后排除本轮已试过的。
     */
    private ProbeType pickProbeType(int arity, List<String> used, List<ProbeType> tried) {
        List<ProbeType> legal = ProbeType.forArity(arity).stream()
                .filter(p -> !tried.contains(p))
                .toList();
        if (legal.isEmpty()) {
            legal = ProbeType.forArity(arity);      // 都试过了，只能复用
        }
        List<ProbeType> unused = legal.stream().filter(p -> !used.contains(p.name())).toList();
        List<ProbeType> pool = unused.isEmpty() ? legal : unused;
        return pool.get(random.nextInt(pool.size()));
    }

    private QuestionBank persist(SelectedTask task, GeneratedQuestion gq,
                                 ProbeType probe, ResponseFormat format) {
        // concept_ids 的顺序 == 出题时给 LLM 的 conceptIndex 顺序，判分靠它映射回真实 id
        Integer[] cids = task.conceptIds().stream()
                .map(Long::intValue).toArray(Integer[]::new);

        QuestionBank qb = new QuestionBank();
        qb.setConceptIds(cids);
        qb.setProbeType(probe);
        qb.setAnswerMode(AnswerMode.WRITE);
        qb.setResponseFormat(format);
        qb.setArity(task.arity());
        qb.setStem(gq.stem);
        qb.setPointsJson(serialize(gq));
        qb.setMcqOptionsJson(format == ResponseFormat.CHOICE && gq.options != null ? serialize(gq.options) : null);
        return qbRepo.save(qb);
    }

    private String serialize(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            throw new IllegalStateException("题目 points 序列化失败", e);
        }
    }
}
