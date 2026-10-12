package interview.homegrown.modules.drill.service;

import interview.homegrown.modules.drill.domain.Concept;
import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.studyplan.domain.StudyPlan;
import interview.homegrown.modules.studyplan.repository.StudyPlanRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 当前用户的<b>可见概念池</b>：全局种子概念（study_plan_id IS NULL）+ 该用户自己
 * 学习方向下的概念。
 *
 * <p>背景：concept 表没有 user_id（归属经 study_plan 间接表达），此前选题闸门、
 * 组合策略的锚点伙伴、卡片概念匹配、掌握画像都用 {@code findAll()} 全表取概念，
 * 多用户云端部署时<b>其他用户的私有方向概念会泄漏</b>进题干 / 画像 / LLM 匹配候选。
 *
 * <p>凡是"给某用户看或用"的概念集合，一律从这里取；全局管理类的后台任务才允许
 * 直接 {@code findAll()}。种子概念对所有用户开放（官方知识矩阵，见
 * {@code StudyPlanService#conceptsOf} 注释：全局种子概念 study_plan_id 为 null）。
 */
@Service
public class ConceptPoolService {

    private final ConceptRepository conceptRepo;
    private final StudyPlanRepository planRepo;

    public ConceptPoolService(ConceptRepository conceptRepo, StudyPlanRepository planRepo) {
        this.conceptRepo = conceptRepo;
        this.planRepo = planRepo;
    }

    /** 种子概念 + userId 自己方向下的概念（不含其他用户的私有概念）。 */
    public List<Concept> visiblePool(Long userId) {
        List<Concept> pool = new ArrayList<>(conceptRepo.findByStudyPlanIdIsNull());
        List<Long> planIds = planRepo.findByUserId(userId).stream()
                .map(StudyPlan::getId)
                .toList();
        if (!planIds.isEmpty()) {
            pool.addAll(conceptRepo.findByStudyPlanIdIn(planIds));
        }
        return pool;
    }
}
