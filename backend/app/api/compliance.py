from io import BytesIO
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ..schemas.compliance import ComplianceEvaluation, EvaluationRequest, PdfReportRequest, SimulationRequest, SimulationResponse
from ..services.rule_catalog import load_catalog
from ..services.rule_engine import evaluate
from ..services.pdf_report_generator import generate_pdf

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@router.get("/rules")
def rules(): return load_catalog()

@router.get("/capabilities")
def capabilities():
    return {"operators": ["REQUIRED","EQUALS","NOT_EQUALS","GREATER_THAN","GREATER_THAN_OR_EQUAL","LESS_THAN","LESS_THAN_OR_EQUAL","IN_SET","DOCUMENT_PRESENT","DOCUMENT_READABLE","FIELD_CONSISTENT","DATE_NOT_EXPIRED"], "resultTypes": ["PASS","FAIL","INSUFFICIENT_EVIDENCE","NOT_APPLICABLE","ERROR"], "reportLanguages": ["en","hi","mr"], "partialEvaluation": True}

@router.post("/evaluate", response_model=ComplianceEvaluation)
def evaluate_compliance(request: EvaluationRequest):
    catalog = load_catalog()
    if request.requestedCatalogVersion and request.requestedCatalogVersion != catalog.catalogVersion:
        raise HTTPException(409, "Requested rule catalog version is not active.")
    return evaluate(request, catalog)

@router.post("/simulate", response_model=SimulationResponse)
def simulate_compliance(request: SimulationRequest):
    """Evaluate a copied hypothetical payload. This endpoint has no persistence."""
    catalog = load_catalog()
    if request.requestedCatalogVersion and request.requestedCatalogVersion != catalog.catalogVersion:
        raise HTTPException(409, "Requested rule catalog version is not active.")
    payload = request.model_dump(exclude={"overrides"})
    application = payload["application"]
    documents = payload["documents"]
    report = payload.get("analysisReport")
    hypothetical_paths: set[str] = set()
    applied: list[str] = []
    warnings: list[str] = []
    for override in request.overrides:
        applied.append(override.overrideId)
        hypothetical_paths.add(override.targetReference)
        if override.targetType == "APPLICATION_FIELD":
            path = override.targetReference.removeprefix("application.").split(".")
            target = application
            for part in path[:-1]: target = target.setdefault(part, {})
            if override.operation == "REMOVE_VALUE": target.pop(path[-1], None)
            else: target[path[-1]] = override.hypotheticalValue
        elif override.targetType == "DOCUMENT_AVAILABILITY":
            # Assumed presence is deliberately not an authenticated blob.
            if not any(item["documentType"] == override.targetReference for item in documents):
                documents.append({"id": f"hypothetical-{override.overrideId}", "documentType": override.targetReference, "fileName": "Hypothetical document", "storageKey": "", "blobAvailable": False})
            warnings.append("ASSUMED_DOCUMENT_NOT_VERIFIED")
        elif override.targetType == "DOCUMENT_METADATA":
            value = override.hypotheticalValue if isinstance(override.hypotheticalValue, dict) else {}
            doc_type = str(value.get("documentType") or override.targetReference)
            documents[:] = [item for item in documents if item["documentType"] != override.targetReference]
            documents.append({"id": f"hypothetical-{override.overrideId}", "documentType": doc_type, "fileName": "Hypothetical replacement", "storageKey": "", "blobAvailable": False})
            warnings.append("HYPOTHETICAL_REPLACEMENT_NOT_VERIFIED")
            for name in ("expiryDate", "institutionName", "registrationNumber"):
                if value.get(name) and report:
                    fields = report.setdefault("extractedFields", [])
                    matches = [item for item in fields if item.get("fieldName") == name]
                    if matches:
                        matches[0].update(value=value[name], sourceDocumentId=f"hypothetical-{override.overrideId}", pageNumber=1)
                    else:
                        fields.append({"fieldName": name, "value": value[name], "sourceDocumentId": f"hypothetical-{override.overrideId}", "pageNumber": 1})
        elif override.targetType == "EXTRACTED_FIELD_ASSUMPTION" and report:
            fields = report.setdefault("extractedFields", [])
            matches = [item for item in fields if item.get("fieldName") == override.targetReference]
            if matches: matches[0]["value"] = override.hypotheticalValue
            else: fields.append({"fieldName": override.targetReference, "value": override.hypotheticalValue, "sourceDocumentId": None, "pageNumber": 1})
            for comparison in report.get("comparisons", []):
                if comparison.get("fieldName") == override.targetReference:
                    comparison["observedValue"] = override.hypotheticalValue
                    expected = comparison.get("expectedValue")
                    comparison["status"] = "MATCH" if str(expected or "").strip().casefold() == str(override.hypotheticalValue or "").strip().casefold() else "MISMATCH"
            warnings.append("EXTRACTED_VALUE_IS_HYPOTHETICAL")
    evaluation = evaluate(EvaluationRequest.model_validate(payload), catalog)
    provenance = {}
    for finding in evaluation.findings:
        if finding.result == "INSUFFICIENT_EVIDENCE": provenance[finding.ruleId] = "INSUFFICIENT_EVIDENCE"
        elif finding.result == "ERROR": provenance[finding.ruleId] = "NOT_EVALUABLE"
        elif any(ref.reference in hypothetical_paths or f"application.{ref.reference}" in hypothetical_paths for ref in finding.evidenceReferences): provenance[finding.ruleId] = "EVALUATED_FROM_HYPOTHETICAL_INPUT"
        elif any((doc_id or "").startswith("hypothetical-") for doc_id in finding.documentIds): provenance[finding.ruleId] = "EVALUATED_FROM_HYPOTHETICAL_INPUT"
        else: provenance[finding.ruleId] = "EVALUATED_FROM_ACTUAL_EVIDENCE"
    return SimulationResponse(evaluation=evaluation, outcomeProvenance=provenance, appliedOverrideIds=applied, warnings=warnings)

@router.post("/report/pdf")
def pdf_report(request: PdfReportRequest):
    try: content = generate_pdf(request)
    except RuntimeError as exc: raise HTTPException(503, str(exc)) from exc
    filename = f"PramaanSetu_Verification_{request.applicationReference}_{request.language}.pdf".replace("/", "-")
    return StreamingResponse(BytesIO(content), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"', "X-Content-Type-Options":"nosniff"})
