import json
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError
from ..core.config import get_settings
from ..schemas.verification import ApplicationMetadata, VerificationReport
from ..services.image_ocr import ocr_available
from ..services.verification_engine import analyze

router = APIRouter(prefix="/api/verification", tags=["verification"])


@router.get("/capabilities")
def capabilities():
    settings = get_settings()
    return {"pdfExtractionAvailable": True, "ocrAvailable": ocr_available(), "supportedFormats": ["PDF", "JPG", "JPEG", "PNG"], "supportedLanguages": [settings.ocr_language], "maximumUploadSize": settings.max_file_size, "maximumPdfPages": settings.max_pdf_pages, "maximumOcrPages": settings.max_ocr_pages}


@router.post("/analyze", response_model=VerificationReport)
async def analyze_documents(metadata: str = Form(...), document_ids: list[str] = Form(...), document_types: list[str] = Form(...), files: list[UploadFile] = File(...)):
    settings = get_settings()
    if not files or len(files) > settings.max_files:
        raise HTTPException(400, f"Upload between 1 and {settings.max_files} documents.")
    if len(files) != len(document_ids) or len(files) != len(document_types):
        raise HTTPException(400, "Document identifiers and types must match uploaded files.")
    try:
        application = ApplicationMetadata.model_validate(json.loads(metadata))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(422, "Application metadata is invalid.") from exc
    documents = []
    for file, document_id, document_type in zip(files, document_ids, document_types, strict=True):
        data = await file.read(settings.max_file_size + 1)
        if len(data) > settings.max_file_size:
            raise HTTPException(413, "File must be 10 MB or smaller.")
        extension = (file.filename or "").rsplit(".", 1)[-1].lower()
        expected = {"pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(extension)
        if not expected or file.content_type != expected:
            raise HTTPException(415, "Only PDF, JPG and PNG files are supported, with matching content types.")
        documents.append({"id": document_id, "type": document_type, "name": file.filename or "document", "content_type": file.content_type or "", "data": data})
    return analyze(application, documents, settings)
