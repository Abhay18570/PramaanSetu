from ..schemas.verification import Comparison, ExtractedField
from ..utils.normalization import normalize_text, normalize_identifier


def _expected(metadata: dict) -> dict[str, str]:
    institution = metadata.get("institutionDetails", {})
    details = metadata.get("applicationDetails", {})
    return {
        "institutionName": institution.get("institutionName", ""),
        "institutionCode": details.get("institutionCode", ""),
        "approvalReference": details.get("existingApprovalReference", ""),
        "academicYear": metadata.get("academicYear", ""),
        "universityAffiliation": details.get("universityAffiliation", ""),
        "address": institution.get("address", ""),
        "pincode": institution.get("pincode", ""),
        "contact": institution.get("phone", ""),
    }


def compare(metadata: dict, fields: list[ExtractedField]) -> list[Comparison]:
    output = []
    for name, expected in _expected(metadata).items():
        if not expected:
            continue
        observed = next((field for field in fields if field.fieldName == name and field.value), None)
        if not observed:
            output.append(Comparison(fieldName=name, status="NOT_FOUND", expectedValue=str(expected), explanation="The submitted value was not found in readable document text."))
            continue
        exact = name in {"institutionCode", "approvalReference", "academicYear", "pincode", "contact"}
        normalize = normalize_identifier if exact else normalize_text
        status = "MATCH" if normalize(str(expected)) == normalize(observed.value or "") else "MISMATCH"
        output.append(Comparison(fieldName=name, status=status, expectedValue=str(expected), observedValue=observed.value, documentId=observed.sourceDocumentId, pageNumber=observed.pageNumber, evidenceText=observed.evidenceText, explanation="Normalized values match." if status == "MATCH" else "The normalized submitted and extracted values differ; a reviewer should inspect the source."))
    return output


def cross_document(fields: list[ExtractedField]) -> list[tuple[str, list[ExtractedField]]]:
    conflicts = []
    for name in {field.fieldName for field in fields}:
        values = [field for field in fields if field.fieldName == name and field.normalizedValue]
        if len({field.normalizedValue for field in values}) > 1 and name in {"institutionName", "pincode", "registrationNumber", "academicYear"}:
            conflicts.append((name, values))
    return conflicts
