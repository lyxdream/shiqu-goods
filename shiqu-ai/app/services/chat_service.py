from app.schemas import ChatRequest
from app.services import session_store

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
    """Nest 注入的 price 已是「元」。"""
    try:
        value = float(cents_or_yuan)
    except (TypeError, ValueError):
        return "暂无"
    return f"{value:.2f}"


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
    ask_howto = any(k in text for k in ("怎么下单", "如何下单", "下单步骤", "下单流程"))
    ask_register = any(k in text for k in ("注册", "登录", "密码"))
    ask_all = any(k in text for k in ("流程", "说明", "帮助", "指南", "全部", "都有哪些"))

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
            "下单步骤：\n"
            "1. 打开商品详情，选择数量\n"
            "2. 选择自提地址\n"
            "3. 提交订单（无购物车，提交即扣库存）\n"
            "4. 在订单详情「模拟付款」"
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


def _assistant(req: ChatRequest) -> str:
    text = req.message
    if any(
        k in text
        for k in ("订单", "自提", "付款", "地址", "注册", "登录", "下单", "状态", "退款")
    ):
        return _order_help(req)
    if any(k in text for k in ("推荐", "种草", "清单", "搭配")):
        return (
            "选购推荐、种草文案、采购清单属于后续能力，当前暂未开放。\n"
            "现在可以为你解答商品问题（请从详情页进入）或订单/购物流程问题。"
        )
    return (
        "你好，我是拾趣好物购物助手。\n"
        "可以帮你：商品答疑（从详情页进入）、订单状态与购物流程问题。\n"
        "直接说出你的问题即可。"
    )


def chat(req: ChatRequest) -> str:
    scene = (req.scene or "assistant").strip()
    session_store.append_message(req.session_id, "user", req.message)

    if scene == "product_qa":
        reply = _product_qa(req)
    elif scene == "order_help":
        reply = _order_help(req)
    else:
        reply = _assistant(req)

    session_store.append_message(req.session_id, "assistant", reply)
    return reply
