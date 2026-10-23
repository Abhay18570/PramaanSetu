import hashlib
import json
import re
from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4
from ..schemas.compliance import ComplianceEvaluation, ComplianceFinding, EvaluationCounts, EvaluationRequest, EvidenceReference, Rule, RuleCatalog

def canonical_fingerprint(payload: EvaluationRequest, catalog_version: str) -> str:
    value = {"application": payload.application, "documents": [item.model_dump() for item in payload.documents], "analysisReport": payload.analysisReport, "analysisStale": payload.analysisStale, "catalogVersion": catalog_version}
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def nested(data: dict[str, Any], path: str) -> Any:
    value: Any = data
    for part in path.split("."):
        if not isinstance(value, dict): return None
        value = value.get(part)
    return value

def norm(value: Any) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())

def evidence(kind: str, reference: str, document_id: str | None = None, page: int | None = None):
    return EvidenceReference(kind=kind, reference=reference, documentId=document_id, pageNumber=page)

def base(rule: Rule, result: str, code: str, **kwargs) -> ComplianceFinding:
    return ComplianceFinding(ruleId=rule.ruleId, ruleVersion=rule.ruleVersion, result=result, severity=rule.severity, titleKey=rule.titleKey, descriptionKey=rule.descriptionKey, explanationCode=code, sourceType=rule.sourceType, sourceReference=rule.sourceReference, reviewRequired=result in {"FAIL", "INSUFFICIENT_EVIDENCE", "ERROR"}, **kwargs)

def field_consistency(rule: Rule, request: EvaluationRequest) -> ComplianceFinding:
    report = request.analysisReport or {}
    expected = rule.expectedValue
    if expected == "CROSS_DOCUMENT_INSTITUTION_NAME":
        fields = [item for item in report.get("extractedFields", []) if item.get("fieldName") == "institutionName" and item.get("value")]
        if len(fields) < 2:
            return base(rule, "INSUFFICIENT_EVIDENCE", "CROSS_DOCUMENT_EVIDENCE_MISSING")
        values = {norm(item["value"]) for item in fields}
        refs = [evidence("ANALYSIS_FIELD", "institutionName", item.get("sourceDocumentId"), item.get("pageNumber")) for item in fields]
        result = "PASS" if len(values) == 1 else "FAIL"
        return base(rule, result, "CROSS_DOCUMENT_FIELDS_CONSISTENT" if result == "PASS" else "CROSS_DOCUMENT_FIELDS_MISMATCH", observedValue=[item["value"] for item in fields], documentIds=list(dict.fromkeys(item.get("sourceDocumentId") for item in fields if item.get("sourceDocumentId"))), pageNumbers=[item["pageNumber"] for item in fields if item.get("pageNumber")], evidenceReferences=refs)
    comparisons = [item for item in report.get("comparisons", []) if item.get("fieldName") == expected]
    if not comparisons:
        return base(rule, "INSUFFICIENT_EVIDENCE", "COMPARISON_EVIDENCE_MISSING", expectedValue=expected)
    item = comparisons[0]
    status = item.get("status")
    result = "PASS" if status == "MATCH" else "FAIL" if status == "MISMATCH" else "INSUFFICIENT_EVIDENCE"
    return base(rule, result, "FIELD_CONSISTENT" if result == "PASS" else "FIELD_MISMATCH" if result == "FAIL" else "COMPARISON_EVIDENCE_MISSING", expectedValue=item.get("expectedValue"), observedValue=item.get("observedValue"), documentIds=[item["documentId"]] if item.get("documentId") else [], pageNumbers=[item["pageNumber"]] if item.get("pageNumber") else [], evidenceReferences=[evidence("COMPARISON", str(expected), item.get("documentId"), item.get("pageNumber"))])

def evaluate_rule(rule: Rule, request: EvaluationRequest) -> ComplianceFinding:
    app_type = request.application.get("applicationType") or request.application.get("type")
    if rule.applicableApplicationTypes and app_type not in rule.applicableApplicationTypes:
        return base(rule, "NOT_APPLICABLE", "RULE_NOT_APPLICABLE", observedValue=app_type)
    if rule.operator == "REQUIRED":
        path = rule.requiredInputs[0].removeprefix("application.")
        value = nested(request.application, path)
        return base(rule, "PASS" if value not in (None, "", []) else "FAIL", "REQUIRED_VALUE_PRESENT" if value not in (None, "", []) else "REQUIRED_VALUE_MISSING", expectedValue=True, observedValue=value, evidenceReferences=[evidence("APPLICATION_FIELD", path)])
    if rule.operator == "DOCUMENT_PRESENT":
        if rule.expectedValue == "ALL_REQUIRED_FILES":
            missing = [item for item in request.documents if not item.blobAvailable]
            result = "PASS" if request.documents and not missing else "INSUFFICIENT_EVIDENCE"
            return base(rule, result, "DOCUMENT_FILES_AVAILABLE" if result == "PASS" else "DOCUMENT_FILE_MISSING", observedValue=[item.fileName for item in missing], documentIds=[item.id for item in missing], evidenceReferences=[evidence("DOCUMENT", item.documentType, item.id) for item in request.documents])
        matches = [item for item in request.documents if item.documentType == rule.expectedValue]
        result = "PASS" if matches and all(item.blobAvailable for item in matches) else "INSUFFICIENT_EVIDENCE"
        return base(rule, result, "DOCUMENT_PRESENT" if result == "PASS" else "DOCUMENT_MISSING", expectedValue=rule.expectedValue, observedValue=len(matches), documentIds=[item.id for item in matches], evidenceReferences=[evidence("DOCUMENT", item.documentType, item.id) for item in matches])
    if rule.operator == "DOCUMENT_READABLE":
        results = (request.analysisReport or {}).get("documentResults", [])
        if request.analysisStale or not results: return base(rule, "INSUFFICIENT_EVIDENCE", "ANALYSIS_MISSING_OR_STALE")
        unreadable = [item for item in results if not item.get("readable")]
        return base(rule, "INSUFFICIENT_EVIDENCE" if unreadable else "PASS", "DOCUMENT_UNREADABLE" if unreadable else "DOCUMENTS_READABLE", documentIds=[item.get("documentId") for item in unreadable if item.get("documentId")], evidenceReferences=[evidence("DOCUMENT", "readable", item.get("documentId")) for item in results])
    if rule.operator == "FIELD_CONSISTENT":
        if request.analysisStale: return base(rule, "INSUFFICIENT_EVIDENCE", "ANALYSIS_MISSING_OR_STALE")
        return field_consistency(rule, request)
    if rule.operator == "DATE_NOT_EXPIRED":
        fields = [item for item in (request.analysisReport or {}).get("extractedFields", []) if item.get("fieldName") in {"expiryDate", "expiry_date"} and item.get("value")]
        if not fields or request.analysisStale: return base(rule, "INSUFFICIENT_EVIDENCE", "EXPIRY_DATE_MISSING")
        item = fields[0]
        try:
            raw = str(item["value"])
            parsed = datetime.strptime(raw, "%d/%m/%Y").date() if "/" in raw else date.fromisoformat(raw[:10])
            result = "PASS" if parsed >= date.today() else "FAIL"
            return base(rule, result, "DOCUMENT_NOT_EXPIRED" if result == "PASS" else "DOCUMENT_EXPIRED", expectedValue=date.today().isoformat(), observedValue=raw, documentIds=[item["sourceDocumentId"]] if item.get("sourceDocumentId") else [], pageNumbers=[item["pageNumber"]] if item.get("pageNumber") else [], evidenceReferences=[evidence("ANALYSIS_FIELD", "expiryDate", item.get("sourceDocumentId"), item.get("pageNumber"))])
        except (ValueError, TypeError):
            return base(rule, "ERROR", "INVALID_DATE_EVIDENCE", observedValue=item.get("value"))
    return base(rule, "ERROR", "UNSUPPORTED_OPERATOR")

def evaluate(request: EvaluationRequest, catalog: RuleCatalog) -> ComplianceEvaluation:
    findings = []
    for rule in catalog.rules:
        if not rule.enabled: continue
        try: findings.append(evaluate_rule(rule, request))
        except Exception: findings.append(base(rule, "ERROR", "RULE_EVALUATION_ERROR"))
    counts = EvaluationCounts(totalApplicable=sum(item.result != "NOT_APPLICABLE" for item in findings), passed=sum(item.result == "PASS" for item in findings), failed=sum(item.result == "FAIL" for item in findings), insufficientEvidence=sum(item.result == "INSUFFICIENT_EVIDENCE" for item in findings), notApplicable=sum(item.result == "NOT_APPLICABLE" for item in findings), errors=sum(item.result == "ERROR" for item in findings))
    if not counts.totalApplicable or counts.errors == counts.totalApplicable: overall = "EVALUATION_FAILED"
    elif counts.failed: overall = "ISSUES_DETECTED"
    elif counts.insufficientEvidence or counts.errors: overall = "INCOMPLETE_EVALUATION"
    else: overall = "NO_FAILURES_DETECTED"
    report = request.analysisReport or {}
    warnings = (["ANALYSIS_REPORT_STALE"] if request.analysisStale else []) + (["ANALYSIS_REPORT_MISSING"] if not request.analysisReport else [])
    return ComplianceEvaluation(evaluationId=str(uuid4()), applicationId=str(request.application.get("id") or request.application.get("applicationId") or ""), generatedAt=datetime.now(timezone.utc).isoformat(), catalogVersion=catalog.catalogVersion, sourceAnalysisReportId=report.get("reportId"), snapshotFingerprint=canonical_fingerprint(request, catalog.catalogVersion), overallAssessment=overall, counts=counts, findings=findings, warnings=warnings)
