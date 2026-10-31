package interview.homegrown.modules.drill.web;
import interview.homegrown.common.result.Result;
import interview.homegrown.modules.drill.dto.StartDrillRequest;
import interview.homegrown.modules.drill.dto.DrillRunView;
import interview.homegrown.modules.drill.service.DrillService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/drill/runs")
public class DrillController {
    private final DrillService service;
    public DrillController(DrillService service) { this.service = service; }
    @PostMapping
    public Result<DrillRunView> create(@Valid @RequestBody StartDrillRequest request) {
        return Result.success(service.create(request));
    }
}
