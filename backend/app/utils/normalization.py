import re
from datetime import date, datetime


def normalize_text(value: str) -> str:
    value = value.casefold().replace("&", " and ")
    return " ".join(re.sub(r"[^\w\s]", " ", value).split())


def normalize_identifier(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def normalize_date(value: str) -> str | None:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d %B %Y", "%d %b %Y"):
        try:
            return datetime.strptime(value.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    return None


def is_expired(value: str) -> bool:
    parsed = normalize_date(value)
    return bool(parsed and date.fromisoformat(parsed) < date.today())

