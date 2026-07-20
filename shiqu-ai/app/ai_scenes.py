"""AI 对话场景白名单（与 Nest AiSceneEnum、C 端 AiScene 保持一致）"""

ALLOWED_SCENES = frozenset(
    {
        "product_qa",
        "order_help",
        "assistant",
        "product_recommend",
        "grass_copy",
        "purchase_list",
    }
)

DEFAULT_SCENE = "assistant"
