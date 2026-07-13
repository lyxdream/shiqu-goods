"""
将 Nest 注入的 context 转换为 LLM system prompt。
"""

_BASE = (
    "你是「拾趣好物」电商平台的购物 AI 助手，专注于回答与站内商品、订单、购物流程相关的问题。"
    "回答简洁自然，使用中文，不超过 200 字。"
    "不要编造不存在的商品或订单信息。"
    "严禁使用 Markdown 格式（不要用 **加粗**、# 标题、- 列表、代码块等）。"
)

_PRODUCTS_SCENE_NOTE = (
    "\n\n【重要约束】推荐或匹配商品时，回复 JSON 中的 productIds 字段"
    "只能包含上方商品列表中实际存在的 ID，不得捏造，不得包含列表之外的 ID。"
)

_JSON_FORMAT_NOTE = (
    "\n\n请严格按以下 JSON 格式回复，不要输出 JSON 以外任何内容：\n"
    '{"reply": "一句话推荐语（纯文本，不要列商品清单，不要用Markdown格式）", "productIds": [商品ID数组，只填站内存在的ID，最多5个]}'
    "\n注意：productIds 中的商品会自动以卡片形式展示给用户，reply 里不需要再逐条列出商品名称。"
)


def build(scene: str, context: dict) -> str:
    parts = [_BASE]

    # ── 在售商品列表（推荐 / 凑单 / 通用助手场景）──
    products: list[dict] = (context or {}).get("products") or []
    if products:
        rows = "\n".join(
            f"ID:{p['id']} | {p.get('name','')} | ¥{p.get('price','')} | 库存:{p.get('stock',0)}"
            for p in products[:30]  # 控制 token 量
        )
        parts.append(f"\n\n【在售商品列表】\n{rows}")
        if scene in ("product_recommend", "purchase_list", "assistant"):
            parts.append(_PRODUCTS_SCENE_NOTE)

    # ── 单品上下文（商品答疑 / 种草文案场景）──
    product: dict = (context or {}).get("product") or {}
    if product:
        parts.append(
            f"\n\n【当前咨询商品】\n"
            f"名称：{product.get('name')}  编号：{product.get('productNo')}\n"
            f"售价：¥{product.get('price')}  库存：{product.get('stock')}\n"
            f"简介：{product.get('description') or '暂无'}"
        )

    # ── 订单上下文（订单答疑场景）──
    order: dict = (context or {}).get("order") or {}
    if order:
        items_text = "、".join(
            f"{i.get('productName', '商品')}×{i.get('quantity', 1)}"
            for i in (order.get("items") or [])[:5]
        )
        parts.append(
            f"\n\n【当前订单】\n"
            f"订单号：{order.get('orderNo')}  状态：{order.get('status')}\n"
            f"金额：¥{order.get('totalAmount')}"
            + (f"  商品：{items_text}" if items_text else "")
        )

    # ── 需要结构化 JSON 回复的场景附加格式说明 ──
    # assistant 场景有商品列表时同样要求 JSON，以便返回相关商品卡片
    if scene in ("product_recommend", "purchase_list") or (
        scene == "assistant" and products
    ):
        parts.append(_JSON_FORMAT_NOTE)

    return "".join(parts)
