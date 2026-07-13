import re

from app.schemas import ChatRequest, ChatResult


def _extract_max_budget(text: str) -> float | None:
    patterns = [
        r"(\d+(?:\.\d+)?)\s*以内",
        r"不超过\s*(\d+(?:\.\d+)?)",
        r"预算\s*(\d+(?:\.\d+)?)",
        r"(\d+(?:\.\d+)?)\s*左右",
        r"(\d+(?:\.\d+)?)\s*以下",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                continue
    return None


def _tokenize(text: str) -> set[str]:
    text = re.sub(r"[^\u4e00-\u9fa5a-zA-Z0-9]", " ", text.lower())
    parts = [p.strip() for p in text.split() if len(p.strip()) >= 2]
    return set(parts)


def _eligible_products(products: list[dict]) -> list[dict]:
    result: list[dict] = []
    for item in products:
        if not isinstance(item, dict):
            continue
        product_id = item.get("id")
        if product_id is None:
            continue
        status = str(item.get("status") or "on_sale")
        stock = item.get("stock")
        if status != "on_sale":
            continue
        if stock is not None and int(stock) <= 0:
            continue
        result.append(item)
    return result


def _score_product(product: dict, tokens: set[str], max_budget: float | None) -> float:
    name = str(product.get("name") or "")
    desc = str(product.get("description") or "")
    haystack = f"{name} {desc}".lower()
    score = 0.0
    for token in tokens:
        if token in haystack:
            score += 3.0 if token in name.lower() else 1.0

    price = product.get("price")
    try:
        price_value = float(price)
    except (TypeError, ValueError):
        price_value = None

    if max_budget is not None and price_value is not None:
        if price_value <= max_budget:
            score += 2.0
        else:
            score -= 5.0

    stock = product.get("stock")
    if stock is not None and int(stock) > 0:
        score += 0.5

    return score


def validate_product_ids(ids: list[int], allowed: set[int], limit: int = 3) -> list[int]:
    result: list[int] = []
    seen: set[int] = set()
    for product_id in ids:
        if product_id in allowed and product_id not in seen:
            seen.add(product_id)
            result.append(product_id)
        if len(result) >= limit:
            break
    return result


def recommend(req: ChatRequest) -> ChatResult:
    products = _eligible_products((req.context or {}).get("products") or [])
    allowed_ids = {int(p["id"]) for p in products if p.get("id") is not None}

    if not products:
        return ChatResult(
            reply="当前没有可推荐的在售商品，请稍后再试或换个描述。",
            product_ids=[],
        )

    text = req.message.strip()
    tokens = _tokenize(text)
    stop_words = {"推荐", "有什么", "买点", "礼物", "搭配", "适合", "想要", "帮我", "看看"}
    tokens -= stop_words
    max_budget = _extract_max_budget(text)

    scored = sorted(
        products,
        key=lambda p: _score_product(p, tokens, max_budget),
        reverse=True,
    )

    picked = [p for p in scored if _score_product(p, tokens, max_budget) > 0][:3]
    if not picked and max_budget is not None:
        picked = [
            p
            for p in scored
            if p.get("price") is not None and float(p["price"]) <= max_budget
        ][:3]
    if not picked:
        picked = scored[:3]

    product_ids = validate_product_ids(
        [int(p["id"]) for p in picked if p.get("id") is not None],
        allowed_ids,
    )

    if not product_ids:
        return ChatResult(
            reply="暂时没有匹配到你描述的商品，可以换个关键词或预算试试。",
            product_ids=[],
        )

    id_to_product = {int(p["id"]): p for p in products if p.get("id") is not None}
    lines = ["根据你的需求，推荐以下站内商品："]
    for index, product_id in enumerate(product_ids, start=1):
        product = id_to_product.get(product_id, {})
        name = product.get("name") or "商品"
        price = product.get("price")
        price_text = f"¥{float(price):.2f}" if price is not None else "价格见详情"
        reason = product.get("description") or "在售现货，欢迎查看详情。"
        lines.append(f"{index}. {name}（{price_text}）— {str(reason)[:60]}")
    lines.append("点击下方卡片可查看商品详情。")

    return ChatResult(reply="\n".join(lines), product_ids=product_ids)
