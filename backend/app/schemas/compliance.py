from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

Operator = Literal["REQUIRED", "EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL", "IN_SET", "DOCUMENT_PRESENT", "DOCUMENT_READABLE", "FIELD_CONSISTENT", "DATE_NOT_EXPIRED"]
Result = Literal["PASS", "FAIL", "INSUFFICIENT_EVIDENCE", "NOT_APPLICABLE", "ERROR"]

class Rule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ruleId: str
    ruleVersion: str
    titleKey: str
    descriptionKey: str
    category: str
    sourceType: Literal["VERIFIED_SOURCE", "DEMONSTRATION"]
    sourceTitle: str
    sourceUrl: str | None = None
    sourceReference: str
    effectiveFrom: str | None = None
    effectiveTo: str | None = None
    applicableApplicationTypes: list[str]
    requiredInputs: list[str]
    operator: Operator
    expectedValue: Any = None
    severity: Literal["INFO", "WARNING", "HIGH"]
    enabled: bool

class RuleCatalog(BaseModel):
    model_config = ConfigDict(extra="forbid")
    catalogVersion: str
    publishedAt: str
    rules: list[Rule]

class DocumentMetadata(BaseModel):
    id: str
    documentType: str
    fileName: str = ""
    storageKey: str = ""
    blobAvailable: bool = True

class EvaluationRequest(BaseModel):
    application: dict[str, Any]
    documents: list[DocumentMetadata] = Field(default_factory=list)
    analysisReport: dict[str, Any] | None = None
    analysisStale: bool = False
    requestedCatalogVersion: str | None = None

class SimulationOverride(BaseModel):
    model_config = ConfigDict(extra="forbid")
    overrideId: str
    targetType: Literal["APPLICATION_FIELD", "DOCUMENT_METADATA", "DOCUMENT_AVAILABILITY", "EXTRACTED_FIELD_ASSUMPTION"]
    targetReference: str
    operation: Literal["SET_VALUE", "REMOVE_VALUE", "ASSUME_DOCUMENT_PRESENT", "ASSUME_DOCUMENT_REPLACED", "ASSUME_EXTRACTED_VALUE"]
    hypotheticalValue: Any = None
    originalValue: Any = None
    explanation: str = Field(default="", max_length=500)
    provenance: Literal["HYPOTHETICAL_USER_ASSUMPTION"] = "HYPOTHETICAL_USER_ASSUMPTION"

class SimulationRequest(EvaluationRequest):
    overrides: list[SimulationOverride] = Field(default_factory=list, max_length=50)

class EvidenceReference(BaseModel):
    kind: Literal["APPLICATION_FIELD", "DOCUMENT", "ANALYSIS_FIELD", "COMPARISON", "FINGERPRINT"]
    reference: str
    documentId: str | None = None
    pageNumber: int | None = None

class ComplianceFinding(BaseModel):
    ruleId: str
    ruleVersion: str
    result: Result
    severity: Literal["INFO", "WARNING", "HIGH"]
    titleKey: str
    descriptionKey: str
    explanationCode: str
    explanationParams: dict[str, Any] = Field(default_factory=dict)
    expectedValue: Any = None
    observedValue: Any = None
    documentIds: list[str] = Field(default_factory=list)
    pageNumbers: list[int] = Field(default_factory=list)
    evidenceReferences: list[EvidenceReference] = Field(default_factory=list)
    sourceType: Literal["VERIFIED_SOURCE", "DEMONSTRATION"]
    sourceReference: str
    reviewRequired: bool

class EvaluationCounts(BaseModel):
    totalApplicable: int
    passed: int
    failed: int
    insufficientEvidence: int
    notApplicable: int
    errors: int

class ComplianceEvaluation(BaseModel):
    evaluationId: str
    applicationId: str
    generatedAt: str
    catalogVersion: str
    sourceAnalysisReportId: str | None = None
    snapshotFingerprint: str
    overallAssessment: Literal["NO_FAILURES_DETECTED", "ISSUES_DETECTED", "INCOMPLETE_EVALUATION", "EVALUATION_FAILED"]
    counts: EvaluationCounts
    findings: list[ComplianceFinding]
    warnings: list[str] = Field(default_factory=list)

class SimulationResponse(BaseModel):
    evaluation: ComplianceEvaluation
    outcomeProvenance: dict[str, Literal["EVALUATED_FROM_ACTUAL_EVIDENCE", "EVALUATED_FROM_HYPOTHETICAL_INPUT", "INSUFFICIENT_EVIDENCE", "NOT_EVALUABLE"]]
    appliedOverrideIds: list[str]
    warnings: list[str] = Field(default_factory=list)

class PdfReportRequest(BaseModel):
    applicationReference: str
    institutionName: str
    applicationType: str
    evaluation: ComplianceEvaluation
    reviewerSummary: dict[str, Any] | None = None
    language: Literal["en", "hi", "mr"] = "en"
    stale: bool = False
