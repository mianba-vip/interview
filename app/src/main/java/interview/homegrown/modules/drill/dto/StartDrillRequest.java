package interview.homegrown.modules.drill.dto;
import jakarta.validation.constraints.NotBlank;
public record StartDrillRequest(@NotBlank String topic) {}
