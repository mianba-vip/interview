package interview.homegrown.modules.drill.service;

import interview.homegrown.infrastructure.redis.RedisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 出题预热缓存（Redis）：讲解页加载完成后提前生成「该子点的第一道题」，做题时秒开。
 *
 * <p>键 {@code drill:prewarm:{userId}:{conceptId}:{focusHash}}，值为 question_bank.id，TTL 6 小时。
 * <b>一次性消费</b>：consume 即删——同一道题不会被开两条 run，过期未消费自动丢弃。</p>
 *
 * <p><b>降级</b>：预热是锦上添花，Redis 不可用（未部署/连接失败）时全部方法静默返回
 * 「未命中」，做题走正常现场生成，主流程不受任何影响。</p>
 */
@Component
public class QuestionPrewarmStore {

    private static final Logger log = LoggerFactory.getLogger(QuestionPrewarmStore.class);

    private static final Duration TTL = Duration.ofHours(6);

    private final RedisService redis;

    /** 预热进行中的键（进程内去重，防止讲解页反复进入触发重复生成）。 */
    private final ConcurrentHashMap<String, Boolean> inFlight = new ConcurrentHashMap<>();

    public QuestionPrewarmStore(RedisService redis) {
        this.redis = redis;
    }

    static String key(Long uid, Long conceptId, String focus) {
        String focusKey = focus == null ? "" : Integer.toHexString(focus.hashCode());
        return "drill:prewarm:" + uid + ":" + conceptId + ":" + focusKey;
    }

    /**
     * 尝试占住「预热进行中」名额：已在预热或已有结果返回 false（无需重复触发）；
     * 占住返回 true（调用方负责生成后 {@link #store} 并 {@link #finish}）。
     * Redis 不可用时返回 false（跳过预热，降级为做题时现场生成）。
     */
    public boolean tryBegin(Long uid, Long conceptId, String focus) {
        String k = key(uid, conceptId, focus);
        if (inFlight.putIfAbsent(k, Boolean.TRUE) != null) return false;
        try {
            if (redis.hasKey(k)) {
                inFlight.remove(k);
                return false;
            }
            return true;
        } catch (Exception e) {
            inFlight.remove(k);
            log.debug("预热缓存不可用（Redis 连接失败？），跳过预热: {}", e.getMessage());
            return false;
        }
    }

    /** 预热结果落缓存（Redis 失败静默——做题时现场生成即可）。 */
    public void store(Long uid, Long conceptId, String focus, Long questionId) {
        try {
            redis.set(key(uid, conceptId, focus), String.valueOf(questionId), TTL);
        } catch (Exception e) {
            log.debug("预热结果写缓存失败（做题时现场生成）: {}", e.getMessage());
        }
    }

    /** 释放「进行中」名额（无论成败都要调，否则该子点永远不能再预热）。 */
    public void finish(Long uid, Long conceptId, String focus) {
        inFlight.remove(key(uid, conceptId, focus));
    }

    /**
     * 一次性消费预热题目 id（读后即删）：未预热 / 已被消费 / Redis 不可用返回空。
     */
    public Optional<Long> consume(Long uid, Long conceptId, String focus) {
        try {
            String k = key(uid, conceptId, focus);
            Optional<String> value = redis.get(k);
            if (value.isPresent()) redis.delete(k);
            return value.flatMap(s -> {
                try {
                    return Optional.of(Long.parseLong(s));
                } catch (NumberFormatException e) {
                    return Optional.empty();
                }
            });
        } catch (Exception e) {
            log.debug("预热缓存不可用，按未预热处理: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
