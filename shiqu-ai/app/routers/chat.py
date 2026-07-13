from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    reply = chat_service.chat(body)
    return ChatResponse(
        reply=reply,
        sessionId=body.session_id,
        scene=body.scene or "assistant",
        productIds=[],  # MVP 不做推荐；后续强制仅返回站内商品 ID
    )
