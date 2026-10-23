import re
from ..schemas.verification import BoundingBox, EvidenceLocation, ExtractedField
from ..utils.normalization import normalize_text, normalize_identifier, normalize_date

PATTERNS = {
    "institutionName": [r"(?:institution|college|institute|university)\s+name\s*[:\-]\s*([^\n]{3,160})", r"name of (?:the )?institution\s*[:\-]\s*([^\n]{3,160})"],
    "institutionCode": [r"institution\s+code\s*[:\-]\s*([A-Z0-9\-/]{3,40})"],
    "registrationNumber": [r"(?:registration|regn\.?)\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z0-9\-/]{3,50})"],
    "approvalReference": [r"(?:approval|reference|ref\.?)[\s]*(?:number|no\.?|#)?\s*[:\-]\s*([A-Z0-9\-/]{3,60})"],
    "academicYear": [r"academic\s+year\s*[:\-]\s*(20\d{2}\s*[-/]\s*20\d{2})"],
    "dateOfIssue": [r"(?:date of issue|issued on|issue date)\s*[:\-]\s*(\d{1,2}[\-/ ](?:\d{1,2}|[A-Za-z]+)[\-/ ]\d{4})"],
    "expiryDate": [r"(?:expiry date|valid until|valid upto|expires on)\s*[:\-]\s*(\d{1,2}[\-/ ](?:\d{1,2}|[A-Za-z]+)[\-/ ]\d{4})"],
    "universityAffiliation": [r"(?:affiliating university|affiliated to|university affiliation)\s*[:\-]\s*([^\n]{3,180})"],
    "address": [r"(?:registered address|institution address|address)\s*[:\-]\s*([^\n]{5,240})"],
    "pincode": [r"(?:pin(?:\s*code)?|postal code)\s*[:\-]?\s*([1-9]\d{5})\b"],
    "contact": [r"(?:phone|mobile|contact)\s*[:\-]?\s*([+\d][\d\s\-]{7,18})"],
}

IDENTIFIERS = {"institutionCode", "registrationNumber", "approvalReference", "pincode", "contact"}
DATES = {"dateOfIssue", "expiryDate"}

def evidence_location(page: dict, source: str) -> EvidenceLocation | None:
    width, height = page.get("width"), page.get("height")
    if not width or not height:
        return None
    if page.get("method") != "PDF_TEXT" or not page.get("words"):
        return EvidenceLocation(pageWidth=width, pageHeight=height, locationQuality="PAGE_ONLY")
    tokens = re.findall(r"[\w/-]+", source.casefold())
    words = page["words"]
    normalized = [re.sub(r"[^\w/-]", "", word["text"].casefold()) for word in words]
    for start in range(len(normalized)):
        if not tokens or normalized[start] != tokens[0]:
            continue
        cursor, matched = start, []
        for token in tokens:
            while cursor < len(normalized) and not normalized[cursor]: cursor += 1
            if cursor >= len(normalized) or normalized[cursor] != token: break
            matched.append(words[cursor]); cursor += 1
        if len(matched) == len(tokens):
            x0=min(word["x0"] for word in matched);y0=min(word["y0"] for word in matched);x1=max(word["x1"] for word in matched);y1=max(word["y1"] for word in matched)
            return EvidenceLocation(pageWidth=width,pageHeight=height,locationQuality="EXACT",boundingBoxes=[BoundingBox(x=x0,y=y0,width=x1-x0,height=y1-y0)])
    return EvidenceLocation(pageWidth=width,pageHeight=height,locationQuality="TEXT_MATCH")


def extract_fields(document_id: str, pages: list[dict], evidence_limit: int) -> list[ExtractedField]:
    results = []
    for field, patterns in PATTERNS.items():
        found = None
        for page in pages:
            for pattern in patterns:
                match = re.search(pattern, page["text"], re.IGNORECASE)
                if match:
                    value = " ".join(match.group(1).strip().split()).rstrip(".,;")
                    normalized = normalize_date(value) if field in DATES else normalize_identifier(value) if field in IDENTIFIERS else normalize_text(value)
                    line = match.group(0).strip()[:evidence_limit]
                    found = ExtractedField(fieldName=field, value=value, normalizedValue=normalized, sourceDocumentId=document_id, pageNumber=page["number"], evidenceText=line, confidence=None, extractionMethod=page["method"], evidenceLocation=evidence_location(page,line))
                    break
            if found:
                break
        if found:
            results.append(found)
        else:
            results.append(ExtractedField(fieldName=field, value=None, normalizedValue=None, sourceDocumentId=document_id, pageNumber=None, evidenceText=None, confidence=None, extractionMethod="UNAVAILABLE" if not any(page["text"] for page in pages) else pages[0]["method"]))
    return results
