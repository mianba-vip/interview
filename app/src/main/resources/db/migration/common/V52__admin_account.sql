-- 管理员账号交接(2026-10-27):新建专用管理员,收回个人账号的管理员权限。
-- 登录体系要求邮箱格式(@Email 校验),用户名 admin 落为 admin@mianba.vip。
-- 密码哈希由 pgcrypto 的 bcrypt 生成,与 Spring BCryptPasswordEncoder 算法互认($2a$)。
-- ⚠️ 密码出现在迁移文件里(随仓库保存):上线后建议尽快改密,或接受私有仓库风险。
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO app_user (email, password_hash, username, nickname, verified, role, status)
VALUES ('admin@mianba.vip', crypt('035657644', gen_salt('bf', 10)), 'admin', '管理员', TRUE, 'ADMIN', 1)
ON CONFLICT (email) DO UPDATE
    SET role = 'ADMIN',
        password_hash = EXCLUDED.password_hash,
        verified = TRUE;

-- 原个人账号回归普通用户
UPDATE app_user SET role = 'USER' WHERE email = 'masuchao2023@163.com';
