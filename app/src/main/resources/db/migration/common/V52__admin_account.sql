-- 管理员账号引导(2026-10-27):仓库不保存任何密码(密钥卫生)。
-- 本迁移只创建管理员身份,密码是一个无人知晓的随机 bcrypt(不可登录),
-- 初始密码由现任管理员在「人员管理 → 设密码」设置;交接完成后由新管理员
-- 在人员管理页把个人账号降回 USER(不在迁移里降级,否则引导期间无人可操作)。
--
-- 交接步骤:
--   1. 部署本版本后,用现任管理员登录 → 人员管理 → 给 admin@mianba.vip 设初始密码
--   2. 登出,用 admin@mianba.vip 登录,确认侧栏出现「管理」组
--   3. 人员管理 → 把 masuchao2023@163.com 撤销管理员
-- 注:登录体系要求邮箱格式(@Email 校验),用户名 admin 落为 admin@mianba.vip。
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO app_user (email, password_hash, username, nickname, verified, role, status)
VALUES ('admin@mianba.vip',
        crypt(gen_random_uuid()::text || gen_random_uuid()::text, gen_salt('bf', 10)),
        'admin', '管理员', TRUE, 'ADMIN', 1)
ON CONFLICT (email) DO UPDATE
    SET role = 'ADMIN',
        verified = TRUE;
