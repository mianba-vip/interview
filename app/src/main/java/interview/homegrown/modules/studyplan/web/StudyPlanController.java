package interview.homegrown.modules.studyplan.web;
import interview.homegrown.common.result.Result;
import interview.homegrown.modules.studyplan.dto.CreatePlanRequest;
import interview.homegrown.modules.studyplan.dto.LearningPlanView;
import interview.homegrown.modules.studyplan.service.StudyPlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/study-plans")
public class StudyPlanController {
    private final StudyPlanService service;
    public StudyPlanController(StudyPlanService service) { this.service = service; }
    @PostMapping
    public Result<LearningPlanView> create(@Valid @RequestBody CreatePlanRequest request) {
        return Result.success(service.create(request));
    }
}
