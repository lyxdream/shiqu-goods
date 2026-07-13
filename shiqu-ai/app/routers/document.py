from fastapi import APIRouter, Depends

from app.dependencies import require_internal_token
from app.schemas import DocumentParseRequest, DocumentParseResponse
from app.services import document_service

router = APIRouter(prefix="/document", tags=["document"])


@router.post("/parse", response_model=DocumentParseResponse, dependencies=[Depends(require_internal_token)])
def parse_document(body: DocumentParseRequest):
    """预留接口：暂不实现解析逻辑。"""
    return document_service.parse_document(body)
