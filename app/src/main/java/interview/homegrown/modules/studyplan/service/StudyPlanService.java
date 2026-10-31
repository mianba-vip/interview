package interview.homegrown.modules.studyplan.service;
import interview.homegrown.modules.studyplan.dto.CreatePlanRequest;
import interview.homegrown.modules.studyplan.dto.LearningPlanView;
/** 仅公开调用契约，不包含生产策略或算法。 */
public interface StudyPlanService {
    LearningPlanView create(CreatePlanRequest request);
}
