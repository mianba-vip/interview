package interview.homegrown.modules.studyplan.service;
import interview.homegrown.common.exception.CoreNotPublishedException;
import interview.homegrown.modules.studyplan.dto.CreatePlanRequest;
import interview.homegrown.modules.studyplan.dto.LearningPlanView;
import org.springframework.stereotype.Service;
@Service
public class UnavailableStudyPlanService implements StudyPlanService {
    @Override
    public LearningPlanView create(CreatePlanRequest request) {
        throw new CoreNotPublishedException("学习");
    }
}
