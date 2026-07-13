import re

from app.config import settings
from app.schemas import ChatRequest, ChatResult
from app.services import llm_service, session_store
from app.services import grass_copy_service, purchase_list_service, recommend_service
from app.services import prompt_builder
from app.services.recommend_service import validate_product_ids, _eligible_products
from app.utils import format_price_yuan


def _strip_markdown(text: str) -> str:
    """剥离 LLM 可能输出的 Markdown 标记，保留纯文本。"""
    # 去掉代码块（```...```）
    text = re.sub(r"```[\s\S]*?```", "", text)
    # 去掉加粗/斜体 **x** / *x* / __x__
    text = re.sub(r"\*{1,3}(.*?)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,2}(.*?)_{1,2}", r"\1", text)
    # 去掉标题符号 ## xxx
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # 多余空行收缩
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

ORDER_STATUS_LABEL = {
    "pending_payment": "待付款",
    "paid": "已付款",
    "picked_up": "已自提",
    "cancelled": "已取消",
}

ORDER_STATUS_HINT = {
    "pending_payment": "可以在订单详情页点击「模拟付款」完成支付。",
    "paid": "已支付成功，请按自提地址线下取货；取货后状态会变为「已自提」。",
    "picked_up": "订单已完成自提，如有问题可联系管理员处理。",
    "cancelled": "该订单已取消。如需购买可重新下单。",
}


def _format_price_yuan(cents_or_yuan) -> str:
    return format_price_yuan(cents_or_yuan)


def _status_label(status: str | None) -> str:
    if not status:
        return "未知"
    return ORDER_STATUS_LABEL.get(status, status)


def _order_no(ctx: dict) -> str:
    return str(ctx.get("orderNo") or "未知订单")


def _format_order_brief(ctx: dict) -> str:
    order_no = _order_no(ctx)
    status = ctx.get("status")
    total = ctx.get("totalAmount")
    lines = [f"订单 {order_no} 当前状态：{_status_label(status)}。"]
    if total is not None:
        lines.append(f"合计金额：¥{_format_price_yuan(total)}。")
    items = ctx.get("items") or []
    if items:
        names = "、".join(
            f"{i.get('productName', '商品')}×{i.get('quantity', 1)}" for i in items[:5]
        )
        lines.append(f"商品：{names}。")
    hint = ORDER_STATUS_HINT.get(str(status or ""))
    if hint:
        lines.append(hint)
    return "\n".join(lines)


def _product_qa(req: ChatRequest) -> str:
    ctx = (req.context or {}).get("product") or {}
    if not ctx:
        return (
            "当前没有关联到具体商品。请从商品详情页点击「AI 咨询好物」进入，"
            "我就能结合商品参数、用法和场景为你解答。"
        )

    name = ctx.get("name") or "该商品"
    product_no = ctx.get("productNo") or "未知商品"
    price = _format_price_yuan(ctx.get("price"))
    stock = ctx.get("stock")
    desc = (ctx.get("description") or "").strip() or "暂无详细简介"
    status = ctx.get("status") or ""

    text = req.message.lower()
    tips: list[str] = [f"关于商品 {product_no}「{name}」"]

    if any(k in text for k in ("价", "多少钱", "贵", "便宜", "预算")):
        tips.append(f"参考售价约 ¥{price}（以页面展示为准）。")
    if any(k in text for k in ("库存", "有货", "缺货", "现货")):
        tips.append(f"当前库存：{stock if stock is not None else '未知'}。")
    if any(k in text for k in ("参数", "材质", "规格", "介绍", "是什么", "怎么样")):
        tips.append(f"商品简介：{desc}")
    if any(k in text for k in ("用法", "怎么用", "如何用", "场景", "适合", "人群")):
        tips.append(
            f"结合简介「{desc}」，可按个人使用场景选购；"
            "若简介未写明细节，建议以实物包装说明为准。"
        )
    if any(k in text for k in ("保养", "存放", "注意", "清洗")):
        tips.append(
            "保养与存放请优先参考商品包装/说明书；"
            "一般避免暴晒、潮湿，按材质选择清洁方式。"
        )
    if any(k in text for k in ("优缺点", "好不好", "推荐吗")):
        tips.append(
            f"优点可参考简介与售价（约 ¥{price}）、库存情况；"
            "是否适合取决于你的用途与预算。需要的话告诉我用途，我帮你一起看。"
        )

    if len(tips) == 1:
        tips.append(f"售价约 ¥{price}，库存 {stock if stock is not None else '未知'}。")
        tips.append(f"简介：{desc}")
        tips.append("你可以问我：价格、库存、用法、适用场景、保养注意等。")

    if status and status != "on_sale":
        tips.append("注意：该商品当前可能非在售状态，下单前请以页面为准。")

    return "\n".join(tips)


def _order_help(req: ChatRequest) -> str:
    ctx = (req.context or {}).get("order") or {}
    text = req.message.strip()

    ask_status = any(
        k in text for k in ("状态", "进度", "到哪了", "怎么样了", "查一下订单", "订单怎样")
    )
    ask_pickup = any(k in text for k in ("自提", "物流", "快递", "配送", "取货", "发货"))
    ask_pay = any(k in text for k in ("付款", "支付", "怎么付", "模拟付款"))
    ask_cancel = any(k in text for k in ("取消", "退款", "售后"))
    ask_address = any(k in text for k in ("地址", "收货"))
    ask_howto = any(
        k in text
        for k in (
            "怎么下单",
            "如何下单",
            "下单步骤",
            "下单流程",
            "购物流程",
            "购买流程",
            "怎么买",
            "如何购买",
            "购物步骤",
            "怎么购物",
        )
    )
    ask_register = any(k in text for k in ("注册", "登录", "密码"))
    ask_all = any(k in text for k in ("说明", "帮助", "指南", "全部", "都有哪些", "能做什么"))

    if ask_status:
        if ctx:
            return _format_order_brief(ctx)
        return (
            "目前没有关联到具体订单。\n"
            "请从「订单详情」点「订单问题咨询」进入，我就能直接告诉你该单状态。\n"
            "订单状态含义：待付款 → 已付款 → 已自提；也可能是已取消。"
        )

    if ask_pickup:
        base = "本站是自提模式，不提供快递配送；付款后请按订单里的自提地址线下取货。"
        if ctx:
            addr = ctx.get("pickupAddress") or "（见订单详情）"
            return (
                f"{base}\n你的订单 {_order_no(ctx)} 自提地址：{addr}\n"
                f"当前状态：{_status_label(ctx.get('status'))}。"
            )
        return base

    if ask_pay:
        if ctx and ctx.get("status") == "pending_payment":
            return (
                f"订单 {_order_no(ctx)} 还在「待付款」。"
                "打开该订单详情，点击「模拟付款」即可（演示环境）。"
            )
        if ctx and ctx.get("status") == "paid":
            return f"订单 {_order_no(ctx)} 已经付过款了，无需再付。"
        return "待付款订单可在订单详情页点击「模拟付款」（演示环境）。已付款订单不用重复支付。"

    if ask_cancel:
        if ctx and ctx.get("status") == "pending_payment":
            return (
                f"订单 {_order_no(ctx)} 仍是待付款，一般可取消；"
                "演示环境也可由管理员在后台调整状态。"
            )
        if ctx and ctx.get("status") in ("paid", "picked_up"):
            return (
                f"订单 {_order_no(ctx)} 当前是「{_status_label(ctx.get('status'))}」，"
                "演示环境暂无自动退款，如需处理可联系管理员在后台操作。"
            )
        return "待付款通常可取消；已付款演示环境暂无自动退款，可联系管理员处理。"

    if ask_address:
        return "在「我的 → 收货地址」填写联系人、电话和自提地址；下单时选择即可。"

    if ask_howto:
        return (
            "拾趣好物购物流程：\n"
            "1. 浏览首页商品，进入详情页\n"
            "2. 选择购买数量，并选择自提地址\n"
            "3. 提交订单（本站无购物车，提交即扣库存）\n"
            "4. 在订单详情点击「模拟付款」\n"
            "5. 付款后按订单自提地址线下取货，完成后为「已自提」\n"
            "也可以问我：怎么填地址、怎么付款、订单状态、自提规则。"
        )

    if ask_register:
        return "用用户名 + 密码注册/登录即可；个人中心可改昵称、头像、手机号和密码。"

    if ask_all:
        return (
            "可以帮你解答这些：\n"
            "· 查当前订单状态\n"
            "· 自提 / 付款 / 取消说明\n"
            "· 怎么下单、怎么填地址\n"
            "直接问具体问题就行，比如「订单状态」「怎么自提」。"
        )

    if ctx:
        return (
            f"{_format_order_brief(ctx)}\n"
            "还可以问我：怎么付款、自提地址、能否取消等。"
        )

    return (
        "你好，我是订单助手。你可以问：订单状态、怎么付款、自提规则、如何取消等。\n"
        "若从订单详情进入，我会自动带上该订单信息作答。"
    )


def _is_recommend_intent(text: str) -> bool:
    return any(
        k in text
        for k in ("推荐", "有什么", "买点", "礼物", "搭配", "适合", "送", "想买")
    )


def _assistant(req: ChatRequest) -> ChatResult:
    text = req.message
    if _is_recommend_intent(text) and not any(
        k in text for k in ("流程", "订单", "下单", "付款", "自提")
    ):
        return recommend_service.recommend(req)
    if any(
        k in text
        for k in (
            "订单",
            "自提",
            "付款",
            "支付",
            "地址",
            "注册",
            "登录",
            "下单",
            "状态",
            "退款",
            "取消",
            "购物",
            "流程",
            "怎么买",
            "如何购买",
            "帮助",
            "指南",
        )
    ):
        return ChatResult(reply=_order_help(req), product_ids=[])
    return ChatResult(
        reply=(
            "你好，我是拾趣好物购物助手。\n"
            "可以帮你：商品推荐、商品答疑（从详情页进入）、订单与购物流程问题。\n"
            "直接说出你的问题即可，例如「购物流程」或「推荐个200以内的礼物」。"
        ),
        product_ids=[],
    )


def _chat_llm(req: ChatRequest, scene: str) -> ChatResult | None:
    """
    LLM 分支：构建 system prompt 后调用大模型。
    - 需要 productIds 的场景（product_recommend / purchase_list）使用 JSON 模式。
    - 其余场景直接返回文本回复。
    - 任何异常或 LLM 不可用时返回 None，由调用方降级到规则引擎。
    """
    context = req.context or {}
    history = session_store.get_history(req.session_id)
    system = prompt_builder.build(scene, context)

    eligible = _eligible_products(context.get("products") or [])
    allowed = {int(p["id"]) for p in eligible if p.get("id") is not None}
    id_to_product = {int(p["id"]): p for p in eligible if p.get("id") is not None}

    # 需要结构化 productIds 的场景（含 assistant 有商品列表时）
    use_json = scene in ("product_recommend", "purchase_list") or (
        scene == "assistant" and bool(eligible)
    )
    if use_json:
        data = llm_service.ask_json(system, req.message, history)
        if not data:
            return None
        reply = _strip_markdown(str(data.get("reply") or ""))
        raw_ids: list = data.get("productIds") or []
        product_ids = validate_product_ids(
            [int(i) for i in raw_ids if str(i).isdigit()],
            allowed,
            limit=5,
        )
        products_brief = [
            {"id": pid, "name": id_to_product[pid].get("name") or "商品", "price": id_to_product[pid].get("price")}
            for pid in product_ids
            if pid in id_to_product
        ]
        return ChatResult(reply=reply, product_ids=product_ids, products=products_brief)

    reply = _strip_markdown(llm_service.ask(system, req.message, history) or "")
    if not reply:
        return None

    # product_qa：上下文里就有商品，直接附商品卡片
    product_ctx = context.get("product") or {}
    pid = product_ctx.get("id")
    if scene == "product_qa" and pid is not None:
        try:
            pid = int(pid)
            brief = {"id": pid, "name": product_ctx.get("name") or "商品", "price": product_ctx.get("price")}
            return ChatResult(reply=reply, product_ids=[pid], products=[brief])
        except (ValueError, TypeError):
            pass

    return ChatResult(reply=reply, product_ids=[])


def _chat_rule(req: ChatRequest, scene: str) -> ChatResult:
    """规则引擎分支（原有逻辑）。"""
    if scene == "product_qa":
        product_ctx = ((req.context or {}).get("product") or {})
        pid = product_ctx.get("id")
        reply = _product_qa(req)
        if pid is not None:
            try:
                pid = int(pid)
                brief = {"id": pid, "name": product_ctx.get("name") or "商品", "price": product_ctx.get("price")}
                return ChatResult(reply=reply, product_ids=[pid], products=[brief])
            except (ValueError, TypeError):
                pass
        return ChatResult(reply=reply, product_ids=[])
    if scene == "order_help":
        return ChatResult(reply=_order_help(req), product_ids=[])
    if scene == "product_recommend":
        return recommend_service.recommend(req)
    if scene == "grass_copy":
        return grass_copy_service.generate(req)
    if scene == "purchase_list":
        return purchase_list_service.match(req)
    return _assistant(req)


def chat(req: ChatRequest) -> ChatResult:
    scene = (req.scene or "assistant").strip()
    session_store.append_message(req.session_id, "user", req.message)

    result: ChatResult | None = None
    if settings.llm_enabled:
        result = _chat_llm(req, scene)  # LLM 失败返回 None

    if result is None:
        result = _chat_rule(req, scene)  # 兜底：规则引擎

    session_store.append_message(req.session_id, "assistant", result.reply)
    return result
