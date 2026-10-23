import json
from functools import lru_cache
from pathlib import Path
from pydantic import ValidationError
from ..schemas.compliance import RuleCatalog

CATALOG_PATH = Path(__file__).resolve().parents[1] / "rules" / "demonstration_rules.json"

@lru_cache
def load_catalog(path: Path = CATALOG_PATH) -> RuleCatalog:
    try:
        catalog = RuleCatalog.model_validate(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError, ValidationError) as exc:
        raise ValueError(f"Invalid compliance rule catalog: {exc}") from exc
    ids = [rule.ruleId for rule in catalog.rules]
    if len(ids) != len(set(ids)):
        raise ValueError("Invalid compliance rule catalog: duplicate rule IDs")
    if not any(rule.enabled for rule in catalog.rules):
        raise ValueError("Invalid compliance rule catalog: no enabled rules")
    return catalog
