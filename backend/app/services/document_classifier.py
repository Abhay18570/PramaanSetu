from ..utils.normalization import normalize_text

KEYWORDS = {
    "APPROVAL_LETTER": ("approval", "approved", "extension of approval"),
    "REGISTRATION": ("registration", "registered", "society", "trust"),
    "AFFILIATION": ("affiliation", "affiliated", "university"),
    "LAND_BUILDING": ("land", "building", "property", "area"),
    "FIRE_SAFETY": ("fire safety", "fire department", "fire certificate", "fire n.o.c"),
    "FACULTY": ("faculty", "teacher", "professor"),
    "INFRASTRUCTURE": ("infrastructure", "laboratory", "library"),
}


def classify(declared_type: str, text: str) -> str:
    normalized = normalize_text(text)
    if len(normalized) < 20:
        return "INSUFFICIENT_EVIDENCE"
    expected = KEYWORDS.get(declared_type)
    if not expected:
        return "INSUFFICIENT_EVIDENCE"
    return "CONSISTENT" if any(term in normalized for term in expected) else "POSSIBLE_MISMATCH"

