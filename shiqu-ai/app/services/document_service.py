"""文档解析：预留，暂不实现真实逻辑。"""

from app.schemas import DocumentParseRequest, DocumentParseResponse


def parse_document(_req: DocumentParseRequest) -> DocumentParseResponse:
    return DocumentParseResponse(
        available=False,
        reply="文档解析功能暂未开放，敬请期待。",
    )
