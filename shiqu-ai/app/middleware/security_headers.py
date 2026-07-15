"""HTTP 安全响应头中间件（对齐 shiqu-server helmet 策略）。"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, is_production: bool, docs_enabled: bool) -> None:
        super().__init__(app)
        self._is_production = is_production
        self._docs_enabled = docs_enabled

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.setdefault('Cross-Origin-Resource-Policy', 'cross-origin')
        response.headers.setdefault('X-Permitted-Cross-Domain-Policies', 'none')

        if self._is_production:
            response.headers.setdefault(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains',
            )

        # /docs、/redoc 依赖内联脚本；与 server 一致，文档开启时不设 CSP
        if not self._docs_enabled:
            response.headers.setdefault(
                'Content-Security-Policy',
                "default-src 'none'; frame-ancestors 'none'",
            )

        return response
