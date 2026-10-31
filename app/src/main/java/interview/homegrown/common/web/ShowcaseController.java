package interview.homegrown.common.web;
import interview.homegrown.common.result.Result;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class ShowcaseController {
    @GetMapping("/api/showcase")
    public Result<Map<String, Object>> overview() {
        return Result.success(Map.of("edition", "public-showcase", "coreAvailable", false,
                "modules", List.of("studyplan", "drill", "corpus", "knowledge",
                "interview", "resume", "project", "user")));
    }
}
