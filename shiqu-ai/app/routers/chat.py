from fastapi import APIRouter, Depends

from app.dependencies import require_internal_token
from app.schemas import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(require_internal_token)])
def chat(body: ChatRequest):
    result = chat_service.chat(body)
    return ChatResponse(
        reply=result.reply,
        sessionId=body.session_id,
        scene=body.scene or "assistant",
        productIds=result.product_ids,
        products=result.products,
    )
