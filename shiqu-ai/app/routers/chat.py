from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    result = chat_service.chat(body)
    return ChatResponse(
        reply=result.reply,
        sessionId=body.session_id,
        scene=body.scene or "assistant",
        productIds=result.product_ids,
    )
