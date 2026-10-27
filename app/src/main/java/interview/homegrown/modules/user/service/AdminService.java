package interview.homegrown.modules.user.service;

import interview.homegrown.modules.drill.repository.ConceptRepository;
import interview.homegrown.modules.studyplan.repository.KgForgeRunRepository;
import interview.homegrown.modules.studyplan.repository.StudyPlanRepository;
import interview.homegrown.modules.user.domain.AppUser;
import interview.homegrown.modules.user.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * 人员管理(管理员专用):查看全体用户状态、授予/撤销管理员。
 *
 * <p>鉴权纪律:所有入口先 {@link #requireAdmin(Long)}——角色实时读库,
 * 不进 JWT(避免改 token 签发/校验链路;管理端点低频,单行查询无压力)。
 * 普通用户的请求完全不经过本服务,零开销。</p>
 *
 * <p>护栏:不能修改自己的角色(防止唯一管理员把自己降级锁死)。
 * 「操作所有用户」当前仅角色管理;删除用户涉及多表级联,后续按需再加。</p>
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final AppUserRepository userRepo;
    private final StudyPlanRepository planRepo;
    private final ConceptRepository conceptRepo;
    private final KgForgeRunRepository forgeRunRepo;
    private final JdbcTemplate jdbc;

    public AdminService(AppUserRepository userRepo, StudyPlanRepository planRepo,
                        ConceptRepository conceptRepo, KgForgeRunRepository forgeRunRepo,
                        JdbcTemplate jdbc) {
        this.userRepo = userRepo;
        this.planRepo = planRepo;
        this.conceptRepo = conceptRepo;
        this.forgeRunRepo = forgeRunRepo;
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------- 鉴权

    public AppUser requireAdmin(Long userId) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "用户不存在"));
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(FORBIDDEN, "需要管理员权限");
        }
        return user;
    }

    // ------------------------------------------------------------- 查询

    /** 全体用户一览:账号信息 + 使用统计(方向/概念/锻造/练习),按注册时间倒序。 */
    @Transactional(readOnly = true)
    public List<AdminUserView> listUsers(Long adminId) {
        requireAdmin(adminId);
        return userRepo.findAll().stream()
                .map(this::toView)
                .sorted(Comparator.comparing(AdminUserView::createdAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public record AdminUserView(
            Long id,
            String email,
            String username,
            String nickname,
            String role,
            boolean verified,
            short status,
            Instant createdAt,
            int planCount,
            int conceptCount,
            int forgeRunCount,
            long drillRunCount
    ) {}

    private AdminUserView toView(AppUser u) {
        Long uid = u.getId();
        List<Long> planIds = planRepo.findByUserId(uid).stream()
                .map(p -> p.getId()).toList();
        int concepts = planIds.isEmpty()
                ? 0
                : conceptRepo.findByStudyPlanIdIn(planIds).size();
        Long drills = jdbc.queryForObject(
                "select count(*) from drill_run where user_id = ?", Long.class, uid);
        return new AdminUserView(
                uid, u.getEmail(), u.getUsername(), u.getNickname(),
                u.getRole() == null ? "USER" : u.getRole(),
                u.isVerified(), u.getStatus() == null ? 1 : u.getStatus(),
                u.getCreatedAt(),
                planIds.size(), concepts,
                forgeRunRepo.findByUserIdOrderByIdDesc(uid).size(),
                drills == null ? 0 : drills
        );
    }

    // ------------------------------------------------------------- 操作

    /** 授予/撤销管理员。护栏:不能改自己(防唯一管理员自锁)。 */
    @Transactional
    public AdminUserView setRole(Long adminId, Long targetUserId, String role) {
        requireAdmin(adminId);
        if (!"ADMIN".equals(role) && !"USER".equals(role)) {
            throw new ResponseStatusException(BAD_REQUEST, "角色只能是 USER 或 ADMIN");
        }
        if (adminId.equals(targetUserId)) {
            throw new ResponseStatusException(BAD_REQUEST, "不能修改自己的角色");
        }
        AppUser target = userRepo.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "用户不存在"));
        target.setRole(role);
        userRepo.save(target);
        log.info("管理员 {} 将用户 {}({}) 角色设为 {}", adminId, targetUserId, target.getEmail(), role);
        return toView(target);
    }
}
