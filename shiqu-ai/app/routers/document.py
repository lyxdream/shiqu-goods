from fastapi import APIRouter

from app.schemas import DocumentParseRequest, DocumentParseResponse
from app.services import document_service

router = APIRouter(prefix="/document", tags=["document"])


@router.post("/parse", response_model=DocumentParseResponse)
def parse_document(body: DocumentParseRequest):
    """预留接口：暂不实现解析逻辑。"""
    return document_service.parse_document(body)
