package interview.homegrown.modules.studyplan.dto;
import jakarta.validation.constraints.NotBlank;
public record CreatePlanRequest(@NotBlank String goal) {}
