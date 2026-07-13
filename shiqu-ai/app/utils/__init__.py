def format_price_yuan(price) -> str:
    """将价格格式化为两位小数字符串（Nest 注入的 price 已是元）。"""
    try:
        return f"{float(price):.2f}"
    except (TypeError, ValueError):
        return "见详情"
