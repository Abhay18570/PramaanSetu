from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

ExtractionMethod = Literal["PDF_TEXT", "OCR", "MIXED", "UNAVAILABLE"]
Severity = Literal["INFO", "WARNING", "HIGH"]

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class EvidenceLocation(BaseModel):
    boundingBoxes: list[BoundingBox] = Field(default_factory=list)
    coordinateSystem: Literal["PDF_POINTS_TOP_LEFT"] = "PDF_POINTS_TOP_LEFT"
    pageWidth: float
    pageHeight: float
    locationQuality: Literal["EXACT", "TEXT_MATCH", "PAGE_ONLY", "UNAVAILABLE"]


class ApplicationMetadata(BaseModel):
    model_config = ConfigDict(extra="ignore")
    applicationId: str
    institutionDetails: dict = Field(default_factory=dict)
    applicationDetails: dict = Field(default_factory=dict)
    academicYear: str = ""


class ExtractedField(BaseModel):
    fieldName: str
    value: str | None
    normalizedValue: str | None
    sourceDocumentId: str
    pageNumber: int | None = None
    evidenceText: str | None = None
    confidence: float | None = None
    extractionMethod: ExtractionMethod
    evidenceLocation: EvidenceLocation | None = None


class Comparison(BaseModel):
    fieldName: str
    status: Literal["MATCH", "MISMATCH", "NOT_FOUND", "UNABLE_TO_DETERMINE"]
    expectedValue: str | None = None
    observedValue: str | None = None
    documentId: str | None = None
    pageNumber: int | None = None
    evidenceText: str | None = None
    explanation: str


class Finding(BaseModel):
    id: str
    category: str
    severity: Severity
    title: str
    description: str
    documentId: str | None = None
    fieldName: str | None = None
    expectedValue: str | None = None
    observedValue: str | None = None
    evidenceText: str | None = None
    pageNumber: int | None = None
    recommendation: str


class FileFingerprint(BaseModel):
    documentId: str
    fileName: str
    sha256: str
    fileSize: int
    processedAt: str


class DocumentResult(BaseModel):
    documentId: str
    documentType: str
    fileName: str
    extractionMethod: ExtractionMethod
    classification: Literal["CONSISTENT", "POSSIBLE_MISMATCH", "INSUFFICIENT_EVIDENCE"]
    pagesProcessed: int
    readable: bool
    warnings: list[str] = Field(default_factory=list)
    fingerprint: FileFingerprint


class VerificationReport(BaseModel):
    reportId: str
    applicationId: str
    generatedAt: str
    engineVersion: str
    overallStatus: Literal["NO_ISSUES_DETECTED", "REVIEW_REQUIRED", "INCOMPLETE_ANALYSIS", "ANALYSIS_FAILED"]
    documentsAnalyzed: int
    documentsFailed: int
    findings: list[Finding]
    extractedFields: list[ExtractedField]
    comparisons: list[Comparison]
    documentResults: list[DocumentResult]
    processingWarnings: list[str]
