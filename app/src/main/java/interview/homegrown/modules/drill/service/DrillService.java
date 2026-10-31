package interview.homegrown.modules.drill.service;
import interview.homegrown.modules.drill.dto.StartDrillRequest;
import interview.homegrown.modules.drill.dto.DrillRunView;
/** 仅公开调用契约，不包含生产策略或算法。 */
public interface DrillService {
    DrillRunView create(StartDrillRequest request);
}
