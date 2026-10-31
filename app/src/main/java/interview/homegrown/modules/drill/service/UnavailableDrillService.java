package interview.homegrown.modules.drill.service;
import interview.homegrown.common.exception.CoreNotPublishedException;
import interview.homegrown.modules.drill.dto.StartDrillRequest;
import interview.homegrown.modules.drill.dto.DrillRunView;
import org.springframework.stereotype.Service;
@Service
public class UnavailableDrillService implements DrillService {
    @Override
    public DrillRunView create(StartDrillRequest request) {
        throw new CoreNotPublishedException("练习");
    }
}
