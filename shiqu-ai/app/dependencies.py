"""
FastAPI 依赖项：内部调用鉴权。

Nest 转发请求时需在 Header 中携带 X-Internal-Token。
若 settings.internal_secret 为空（开发模式），跳过校验。
"""

from fastapi import Header, HTTPException, status

from app.config import settings


def require_internal_token(
    x_internal_token: str | None = Header(default=None),
) -> None:
    """
    校验内部密钥。

    - 开发环境（app_env=development）且未配置密钥：跳过校验，方便本地调试
    - 生产环境（app_env=production）：密钥为空时服务启动即报错（见 main.py），
      此处不会出现空密钥，直接做严格比对
    """
    secret = settings.internal_secret
    is_dev = settings.app_env != "production"

    if not secret and is_dev:
        return  # 开发模式 + 未配置密钥，放行

    if x_internal_token != secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="禁止访问：缺少或无效的内部鉴权凭证",
        )
