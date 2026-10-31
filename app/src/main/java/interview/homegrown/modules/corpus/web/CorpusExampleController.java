package interview.homegrown.modules.corpus.web;
import interview.homegrown.common.result.Result;
import interview.homegrown.modules.corpus.dto.CorpusView;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
public class CorpusExampleController {
    @GetMapping("/api/corpus/examples")
    public Result<List<CorpusView>> examples() {
        return Result.success(List.of(new CorpusView(1L, "示例文档", 0, "EXAMPLE",
                Instant.EPOCH, "仅供展示的固定假数据", "NOT_CONNECTED",
                List.of("Java", "Spring Boot"), 0, false)));
    }
}
