"""kg-forge 配置（环境变量驱动，风格对齐 interview 后端的 app.forge.* / .env 约定）。"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 服务间共享密钥：interview 后端调用 sidecar 时必带 X-Forge-Secret 头。
    # sidecar 只部署在 compose 内网，公网不可达；密钥是第二道保险。
    forge_secret: str = "change-me-forge-secret"

    # LangGraph checkpointer 用的 PostgreSQL（复用 interview 的 PG 实例即可；
    # LangGraph 自建 ckpt_* 表，不与业务表混用）。
    forge_db_url: str = "postgresql://postgres:123456@localhost:5432/interview"

    # 兜底 LLM 配置：用户没配 BYOK（请求头没带 X-LLM-*）时使用服务端默认 key。
    # 云端多用户部署建议留空，强制 BYOK——与 interview 后端同一哲学。
    forge_api_key: str = ""
    forge_base_url: str = "https://api.deepseek.com"
    forge_model: str = "deepseek-chat"

    # checkpoint 后端：postgres（默认，与生产一致，断点续跑）/ memory（开发测试，
    # 免 PG 起服务，重启即失）。仅影响本进程存档方式，API 契约不变。
    forge_checkpoint: str = "postgres"

    # HTTP 端口（compose 内网）
    forge_port: int = 8100

    model_config = {"env_prefix": "FORGE_"}


settings = Settings()
