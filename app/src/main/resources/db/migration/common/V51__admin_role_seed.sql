-- 管理员机制启用:role 列自 V17 已存在(USER/ADMIN),此前从未使用。
-- 本迁移只做种子数据:指定账号授管理员,其余默认普通用户。幂等可重放。
UPDATE app_user SET role = 'ADMIN' WHERE email = 'masuchao2023@163.com';
