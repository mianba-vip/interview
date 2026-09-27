package interview.homegrown.modules.studyplan.repository;

import interview.homegrown.modules.studyplan.domain.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {

    List<DailyTask> findByUserIdAndTaskDate(Long userId, LocalDate date);

    List<DailyTask> findByUserIdAndTaskDateAndStatusInOrderByIdAsc(
            Long userId, LocalDate date, List<String> statuses);

    long countByUserIdAndTaskDateAndStatus(Long userId, LocalDate date, String status);

    boolean existsByUserIdAndTaskDate(Long userId, LocalDate date);
}
