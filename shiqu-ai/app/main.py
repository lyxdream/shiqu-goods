from fastapi import FastAPI

from app.config import settings
from app.routers import chat, document, health

app = FastAPI(title=settings.app_name, version="0.1.0")

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(document.router)
