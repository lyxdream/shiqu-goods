from fastapi import FastAPI

from app.config import settings
from app.routers import chat, document, health

# 生产环境启动前置校验：内部密钥不能为空
if settings.app_env == "production" and not settings.internal_secret:
    raise RuntimeError(
        "生产环境必须配置 INTERNAL_SECRET，请在 .env 中填写后重启服务。"
    )

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    # 生产环境关闭自动生成的接口文档
    docs_url=None if settings.app_env == "production" else "/docs",
    redoc_url=None if settings.app_env == "production" else "/redoc",
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(document.router)
