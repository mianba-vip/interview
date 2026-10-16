package interview.homegrown.modules.studyplan.repository;

import interview.homegrown.modules.studyplan.domain.KgForgeRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KgForgeRunRepository extends JpaRepository<KgForgeRun, Long> {

    List<KgForgeRun> findByUserIdOrderByIdDesc(Long userId);

    Optional<KgForgeRun> findByUserIdAndId(Long userId, Long id);
}
