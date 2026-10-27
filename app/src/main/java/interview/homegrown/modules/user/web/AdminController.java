package interview.homegrown.modules.user.web;

import interview.homegrown.common.web.CurrentUser;
import interview.homegrown.modules.user.service.AdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 人员管理(管理员专用)。全部端点走默认 JWT 链,进入服务层先 requireAdmin,
 * 非管理员一律 403;普通用户请求不会到达这里之外的任何管理逻辑。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** 全体用户一览(账号状态 + 使用统计)。 */
    @GetMapping("/users")
    public List<AdminService.AdminUserView> listUsers() {
        return adminService.listUsers(CurrentUser.id());
    }

    /** 授予/撤销管理员:{"role": "ADMIN" | "USER"}。不能改自己。 */
    @PutMapping("/users/{id}/role")
    public Map<String, Object> setRole(@PathVariable Long id, @RequestBody RoleRequest req) {
        AdminService.AdminUserView updated = adminService.setRole(CurrentUser.id(), id, req.role());
        return Map.of("ok", true, "user", updated);
    }

    /** 重置任意用户密码(引导期设初始密码/管理员运维通道):{"newPassword": "..."}。 */
    @PutMapping("/users/{id}/password")
    public Map<String, Object> resetPassword(@PathVariable Long id, @RequestBody PasswordRequest req) {
        return adminService.resetPassword(CurrentUser.id(), id, req.newPassword());
    }

    public record RoleRequest(String role) {}
    public record PasswordRequest(String newPassword) {}
}
