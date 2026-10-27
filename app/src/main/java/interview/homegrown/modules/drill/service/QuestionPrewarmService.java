package interview.homegrown.modules.drill.service;

import interview.homegrown.modules.drill.domain.QuestionBank;
import interview.homegrown.modules.drill.domain.SelectedTask;
import interview.homegrown.modules.drill.web.DrillSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * 出题预热编排：讲解页加载完成后触发，后台虚拟线程里提前生成该子点的第一道题，
 * 用户点「开始做题」时直接消费预热结果（秒开），免去 10~60 秒的现场 LLM 等待。
 *
 * <p>时机设计的依据：「开始做题」按钮就在讲解正文的末尾，读完讲解点做题是主路径——
 * 用户读讲解的 1~2 分钟正是天然的生成窗口（与移动端 prefetch 预热讲解缓存同一思路）。</p>
 *
 * <p>预热失败/Redis 不可用一律静默降级（做题时现场生成）；同一子点短时间内只预热一次
 * （{@link QuestionPrewarmStore#tryBegin} 去重）。代价权衡：用户读了讲解但没点做题的子点
 * 会浪费一次生成（TTL 6h 后自动丢弃），换来主路径的零等待。</p>
 */
@Service
public class QuestionPrewarmService {

    private static final Logger log = LoggerFactory.getLogger(QuestionPrewarmService.class);

    private final SelectionService selectionService;
    private final DrillSupport support;
    private final QuestionPrewarmStore store;
    private final ConceptPoolService conceptPool;

    public QuestionPrewarmService(SelectionService selectionService, DrillSupport support,
                                  QuestionPrewarmStore store, ConceptPoolService conceptPool) {
        this.selectionService = selectionService;
        this.support = support;
        this.store = store;
        this.conceptPool = conceptPool;
    }

    /**
     * 触发预热（fire-and-forget，立即返回）。
     *
     * @return true=已开始本次预热；false=该子点已有预热结果 / 正在预热 / 预热不可用（均无需重复触发）
     */
    public boolean prewarm(Long uid, Long conceptId, String focus) {
        if (focus == null || focus.isBlank()) return false;
        // 越权审计修复(2026-10-27):概念必须对当前用户可见,否则任何登录用户
        // 可用他人 conceptId 触发预热,读他人概念并烧自己的 key 生成无主题目。
        boolean visible = conceptPool.visiblePool(uid).stream().anyMatch(c -> c.getId().equals(conceptId));
        if (!visible) return false;
        if (!store.tryBegin(uid, conceptId, focus)) return false;

        // LLM 调用依赖 ThreadLocal 上下文（登录用户的 BYOK 配置、桌面端 X-LLM-Key 头），
        // 虚拟线程里手工带入——与 SseStream 的做法一致；结束必须清理，避免线程复用串号
        SecurityContext security = SecurityContextHolder.getContext();
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        Thread.ofVirtual().name("drill-prewarm").start(() -> {
            SecurityContextHolder.setContext(security);
            if (requestAttributes != null) {
                RequestContextHolder.setRequestAttributes(requestAttributes);
            }
            try {
                SelectedTask task = selectionService.pickFor(uid, conceptId);
                QuestionBank q = support.generateFor(uid, task, focus, s -> { });
                store.store(uid, conceptId, focus, q.getId());
                log.debug("出题预热完成 concept={} focus={} question={}", conceptId, focus, q.getId());
            } catch (Exception e) {
                log.debug("出题预热失败（做题时将现场生成）: {}", e.getMessage());
            } finally {
                store.finish(uid, conceptId, focus);
                SecurityContextHolder.clearContext();
                RequestContextHolder.resetRequestAttributes();
            }
        });
        return true;
    }
}
