from uuid import uuid4
from ..schemas.verification import Comparison, ExtractedField, Finding
from ..utils.normalization import is_expired


def finding(category: str, severity: str, title: str, description: str, recommendation: str, **values) -> Finding:
    return Finding(id=str(uuid4()), category=category, severity=severity, title=title, description=description, recommendation=recommendation, **values)


def detect(comparisons: list[Comparison], fields: list[ExtractedField], document_results: list[dict], conflicts: list[tuple]) -> list[Finding]:
    output = []
    for item in comparisons:
        if item.status == "MISMATCH":
            output.append(finding("APPLICATION_COMPARISON", "HIGH", f"{item.fieldName} differs", item.explanation, "Compare the submitted field with the cited source document.", documentId=item.documentId, fieldName=item.fieldName, expectedValue=item.expectedValue, observedValue=item.observedValue, evidenceText=item.evidenceText, pageNumber=item.pageNumber))
        elif item.status == "NOT_FOUND":
            output.append(finding("MISSING_INFORMATION", "WARNING", f"{item.fieldName} was not found", item.explanation, "Inspect the source documents and confirm whether the submitted value is supported.", fieldName=item.fieldName, expectedValue=item.expectedValue))
    for field in fields:
        if field.fieldName == "expiryDate" and field.value and is_expired(field.value):
            output.append(finding("EXPIRY", "HIGH", "Document date appears expired", "The extracted expiry date is earlier than today's date.", "Confirm whether a current document is required.", documentId=field.sourceDocumentId, fieldName=field.fieldName, observedValue=field.value, evidenceText=field.evidenceText, pageNumber=field.pageNumber))
    for result in document_results:
        if result["classification"] == "POSSIBLE_MISMATCH":
            output.append(finding("DOCUMENT_CLASSIFICATION", "WARNING", "Declared category may not match readable content", "Expected category terminology was not found in the readable text. This is not proof that the document is invalid.", "Inspect the complete source document and its declared category.", documentId=result["documentId"]))
        if not result["readable"]:
            output.append(finding("READABILITY", "WARNING", "Document could not be read", "No usable text was extracted from this document.", "Provide a clearer scan or inspect the source manually.", documentId=result["documentId"]))
    for name, values in conflicts:
        output.append(finding("CROSS_DOCUMENT", "HIGH", f"Conflicting {name} values", "Different normalized values were extracted from multiple documents.", "Inspect each cited document before continuing review.", fieldName=name, documentId=values[0].sourceDocumentId, observedValue=" | ".join(dict.fromkeys(v.value or "" for v in values)), evidenceText=values[0].evidenceText, pageNumber=values[0].pageNumber))
    return output
