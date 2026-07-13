from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "shiqu-ai"
    app_host: str = "127.0.0.1"  # 生产只监听本机，禁止对外暴露
    app_port: int = 8000
    app_env: str = "development"  # development | production

    # 内部调用鉴权密钥（Nest → AI 转发时携带）
    # 生产环境（app_env=production）若未配置，服务启动时会报错拒绝启动
    internal_secret: str = ""

    # LLM 配置（false 时使用规则引擎兜底）
    llm_enabled: bool = False
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com"
    # 可选模型：deepseek-v3-0324（快速低成本）或 deepseek-chat（效果最佳）
    llm_model: str = "deepseek-chat"


settings = Settings()
