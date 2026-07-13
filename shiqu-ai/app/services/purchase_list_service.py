import re

from app.schemas import ChatRequest, ChatResult
from app.services.recommend_service import _eligible_products, _tokenize


def _parse_items(text: str) -> list[str]:
    """从用户消息里拆分采购条目，支持顿号、逗号、换行、分号。"""
    items = re.split(r"[、，,\n；;]+", text)
    # 去掉常见引导词前缀
    prefixes = ("我要买", "帮我买", "我想买", "采购清单", "清单", "需要", "购买")
    cleaned: list[str] = []
    for raw in items:
        item = raw.strip()
        for prefix in prefixes:
            if item.startswith(prefix):
                item = item[len(prefix):].strip()
        item = re.sub(r"^\d+[.、）\)]\s*", "", item).strip()  # 去掉编号 "1. / 1、"
        if len(item) >= 1:
            cleaned.append(item)
    return cleaned


def _best_match(
    item: str,
    products: list[dict],
) -> dict | None:
    """对单个采购条目，在在售商品中找最佳匹配，找不到则返回 None。"""
    tokens = _tokenize(item)
    if not tokens:
        return None

    best: dict | None = None
    best_score = 0.0

    for product in products:
        name = str(product.get("name") or "")
        desc = str(product.get("description") or "")
        haystack = f"{name} {desc}".lower()

        score = 0.0
        for token in tokens:
            if token in haystack:
                score += 3.0 if token in name.lower() else 1.0

        if score > best_score:
            best_score = score
            best = product

    return best if best_score > 0 else None


def match(req: ChatRequest) -> ChatResult:
    products = _eligible_products((req.context or {}).get("products") or [])

    if not products:
        return ChatResult(
            reply="当前没有在售商品，请稍后再试。",
            product_ids=[],
        )

    text = req.message.strip()
    items = _parse_items(text)

    if not items:
        return ChatResult(
            reply=(
                "请输入你的采购清单，例如：\n"
                "平板电脑、蓝牙耳机、机械键盘\n\n"
                "我会帮你对照站内在售商品，看看有哪些可以买到。"
            ),
            product_ids=[],
        )

    matched_ids: list[int] = []
    seen_ids: set[int] = set()
    hit_lines: list[str] = []
    miss_lines: list[str] = []

    for item in items:
        product = _best_match(item, products)
        if product:
            pid = int(product["id"])
            name = product.get("name") or "商品"
            price = product.get("price")
            price_text = f"¥{float(price):.2f}" if price is not None else "价格见详情"
            hit_lines.append(f"✅ {item} → {name}（{price_text}）")
            if pid not in seen_ids:
                seen_ids.add(pid)
                matched_ids.append(pid)
        else:
            miss_lines.append(f"❌ {item} → 站内暂无")

    # 计算合计
    id_to_product = {int(p["id"]): p for p in products if p.get("id") is not None}
    total = sum(
        float(id_to_product[pid]["price"])
        for pid in matched_ids
        if id_to_product.get(pid, {}).get("price") is not None
    )

    lines = ["已对照站内商品，为你整理如下：", ""]
    lines.extend(hit_lines)
    lines.extend(miss_lines)
    lines.append("")

    if matched_ids:
        lines.append(
            f"站内可购 {len(matched_ids)} 件，参考合计：¥{total:.2f}"
        )
        lines.append("点击下方卡片直接进入商品详情。")
    else:
        lines.append("你清单里的品类站内暂时都没有，可以换个描述再试试。")

    return ChatResult(reply="\n".join(lines), product_ids=matched_ids)
