from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="用户消息")
    session_id: str | None = Field(default=None, alias="sessionId")
    scene: str | None = Field(
        default="assistant",
        description="product_qa | order_help | assistant",
    )
    product_id: int | None = Field(default=None, alias="productId")
    order_id: int | None = Field(default=None, alias="orderId")
    context: dict | None = Field(
        default=None,
        description="Nest 注入的商品/订单等上下文",
    )

    model_config = {"populate_by_name": True}


class ChatResponse(BaseModel):
    reply: str
    session_id: str | None = Field(default=None, alias="sessionId")
    scene: str | None = None
    # 后续推荐能力：仅允许站内商品 ID
    product_ids: list[int] = Field(default_factory=list, alias="productIds")

    model_config = {"populate_by_name": True, "by_alias": True}


class DocumentParseRequest(BaseModel):
    content: str
    prompt: str | None = None


class DocumentParseResponse(BaseModel):
    reply: str
    available: bool = False
