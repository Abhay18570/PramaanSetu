from datetime import datetime, timezone
from uuid import uuid4
from PIL import Image, UnidentifiedImageError
import io
from ..core.config import Settings
from ..schemas.verification import ApplicationMetadata, DocumentResult, FileFingerprint, VerificationReport
from ..utils.hashing import sha256_bytes
from .image_ocr import extract_image_text
from .pdf_extractor import extract_pdf
from .field_extractor import extract_fields
from .document_classifier import classify
from .comparison_engine import compare, cross_document
from .anomaly_detector import detect


def validate_content(data: bytes, name: str, content_type: str, settings: Settings) -> str:
    if not data:
        raise ValueError("The uploaded file is empty.")
    if len(data) > settings.max_file_size:
        raise ValueError("File must be 10 MB or smaller.")
    extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    expected = {"pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(extension)
    if not expected or content_type != expected:
        raise ValueError("Only PDF, JPG and PNG files are supported, with matching content types.")
    if expected == "application/pdf" and not data.startswith(b"%PDF-"):
        raise ValueError("PDF content does not match its declared format.")
    if expected == "image/png" and not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("PNG content does not match its declared format.")
    if expected == "image/jpeg" and not data.startswith(b"\xff\xd8\xff"):
        raise ValueError("JPEG content does not match its declared format.")
    return expected


def analyze(metadata: ApplicationMetadata, documents: list[dict], settings: Settings) -> VerificationReport:
    generated = datetime.now(timezone.utc).isoformat()
    fields, results, warnings = [], [], []
    failed = 0
    for item in documents:
        fingerprint = FileFingerprint(documentId=item["id"], fileName=item["name"], sha256=sha256_bytes(item["data"]), fileSize=len(item["data"]), processedAt=generated)
        try:
            kind = validate_content(item["data"], item["name"], item["content_type"], settings)
            if kind == "application/pdf":
                pages, method, document_warnings = extract_pdf(item["data"], settings.max_pdf_pages, settings.ocr_language, settings.ocr_timeout, settings.max_ocr_pages)
            else:
                try:
                    with Image.open(io.BytesIO(item["data"])) as image:
                        image.verify()
                except UnidentifiedImageError as exc:
                    raise ValueError("Image content is malformed or unreadable.") from exc
                text, document_warnings = extract_image_text(item["data"], settings.ocr_language, settings.ocr_timeout)
                method = "OCR" if text else "UNAVAILABLE"
                pages = [{"number": 1, "text": text, "method": method, "width": None, "height": None, "words": []}]
            text = "\n".join(page["text"] for page in pages)
            extracted = extract_fields(item["id"], pages, settings.max_evidence_length)
            fields.extend(extracted)
            classification = classify(item["type"], text)
            readable = bool(text.strip())
            warnings.extend(f'{item["name"]}: {warning}' for warning in document_warnings)
            results.append(DocumentResult(documentId=item["id"], documentType=item["type"], fileName=item["name"], extractionMethod=method, classification=classification, pagesProcessed=len(pages), readable=readable, warnings=document_warnings, fingerprint=fingerprint))
        except ValueError as exc:
            failed += 1
            message = str(exc)
            warnings.append(f'{item["name"]}: {message}')
            results.append(DocumentResult(documentId=item["id"], documentType=item["type"], fileName=item["name"], extractionMethod="UNAVAILABLE", classification="INSUFFICIENT_EVIDENCE", pagesProcessed=0, readable=False, warnings=[message], fingerprint=fingerprint))
    comparisons = compare(metadata.model_dump(), fields)
    result_dicts = [result.model_dump() for result in results]
    findings = detect(comparisons, fields, result_dicts, cross_document(fields))
    analyzed = len(documents) - failed
    if not documents or failed == len(documents): status = "ANALYSIS_FAILED"
    elif failed or any(not result.readable for result in results): status = "INCOMPLETE_ANALYSIS"
    elif findings: status = "REVIEW_REQUIRED"
    else: status = "NO_ISSUES_DETECTED"
    return VerificationReport(reportId=str(uuid4()), applicationId=metadata.applicationId, generatedAt=generated, engineVersion=settings.engine_version, overallStatus=status, documentsAnalyzed=analyzed, documentsFailed=failed, findings=findings, extractedFields=fields, comparisons=comparisons, documentResults=results, processingWarnings=warnings)
