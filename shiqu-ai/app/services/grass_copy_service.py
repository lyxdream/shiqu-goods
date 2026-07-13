from app.schemas import ChatRequest, ChatResult
from app.utils import format_price_yuan


def generate(req: ChatRequest) -> ChatResult:
    product = (req.context or {}).get("product") or {}
    if not product:
        return ChatResult(
            reply=(
                "当前没有关联到具体商品。\n"
                "请从商品详情页点击「AI 种草文案」进入，我就能基于该商品生成种草内容。"
            ),
            product_ids=[],
        )

    name = product.get("name") or "这款好物"
    product_no = product.get("productNo") or "未知商品"
    price = format_price_yuan(product.get("price"))
    desc = (product.get("description") or "").strip() or "品质不错，值得入手。"
    stock = product.get("stock")
    stock_text = f"现货 {stock} 件" if stock is not None else "现货供应"

    text = req.message.strip()
    tone = "朋友圈"
    if any(k in text for k in ("小红书", "笔记")):
        tone = "小红书"
    elif any(k in text for k in ("短", "简短", "一句话")):
        tone = "简短"

    if tone == "简短":
        copy = (
            f"【{name}】{desc[:40]} 参考价 ¥{price}，拾趣好物可自提，感兴趣去看看～"
        )
    elif tone == "小红书":
        copy = (
            f"✨ 真实安利｜{name}\n\n"
            f"最近挖到这件 {product_no}，{desc}\n"
            f"💰 参考价 ¥{price}，{stock_text}\n"
            f"📍 适合日常自用/送礼，线下自提更方便\n"
            f"👉 需要的姐妹可以冲，详情见拾趣好物\n"
            f"#好物分享 #拾趣好物 #{name[:8]}"
        )
    else:
        copy = (
            f"【{name}】真的值得入手！\n\n"
            f"✨ 亮点：{desc}\n"
            f"💰 参考价 ¥{price}，{stock_text}\n"
            f"📍 拾趣好物支持自提，下单后按地址取货即可\n"
            f"👉 感兴趣可以看看商品详情，欢迎入手～"
        )

    return ChatResult(reply=copy, product_ids=[])
