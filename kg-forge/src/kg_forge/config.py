"""kg-forge 配置（环境变量驱动，风格对齐 interview 后端的 app.forge.* / .env 约定）。"""

import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # 服务间共享密钥：interview 后端调用 sidecar 时必带 X-Forge-Secret 头。
    # sidecar 只部署在 compose 内网，公网不可达；密钥是第二道保险。
    forge_secret: str = os.getenv("FORGE_SECRET", "change-me-forge-secret")

    # LangGraph checkpointer 用的 PostgreSQL（复用 interview 的 PG 实例即可；
    # LangGraph 自建 ckpt_* 表，不与业务表混用）。
    forge_db_url: str = os.getenv(
        "FORGE_DB_URL", "postgresql://postgres:123456@localhost:5432/interview")

    # 兜底 LLM 配置：用户没配 BYOK（请求头没带 X-LLM-*）时使用服务端默认 key。
    # 云端多用户部署建议留空，强制 BYOK——与 interview 后端同一哲学。
    forge_api_key: str = os.getenv("FORGE_API_KEY", "")
    forge_base_url: str = os.getenv("FORGE_BASE_URL", "https://api.deepseek.com")
    forge_model: str = os.getenv("FORGE_MODEL", "deepseek-chat")

    # checkpoint 后端：postgres（默认，与生产一致，断点续跑）/ memory（开发测试，
    # 免 PG 起服务，重启即失）。仅影响本进程存档方式，API 契约不变。
    forge_checkpoint: str = os.getenv("FORGE_CHECKPOINT", "postgres")

    # HTTP 端口（compose 内网）
    forge_port: int = int(os.getenv("FORGE_PORT", "8100"))

    # 环境变量取值不依赖 pydantic-settings 的字段名匹配——2026-10-20 线上踩坑：
    # 全新构建解析到的新版 pydantic-settings 下，容器内 FORGE_* env 正确、
    # 进程却拿到默认值（疑为 env 匹配默认大小写行为变更）。字段默认值改为
    # os.getenv 显式取 FORGE_*，与依赖版本彻底解耦；BaseSettings 仅保留
    # .env 文件（本地开发/测试台）加载与类型校验。字段名与 FORGE_* 的
    # 大小写对应关系保持文档约定不变。
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)


settings = Settings()
