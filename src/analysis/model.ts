import { z } from 'zod'

const method = z.enum(['PDF_TEXT', 'OCR', 'MIXED', 'UNAVAILABLE'])
const evidenceLocationSchema=z.object({boundingBoxes:z.array(z.object({x:z.number(),y:z.number(),width:z.number(),height:z.number()})).default([]),coordinateSystem:z.literal('PDF_POINTS_TOP_LEFT'),pageWidth:z.number().positive(),pageHeight:z.number().positive(),locationQuality:z.enum(['EXACT','TEXT_MATCH','PAGE_ONLY','UNAVAILABLE'])})
const extractedFieldSchema = z.object({
  fieldName: z.string(),
  value: z.string().nullable(),
  normalizedValue: z.string().nullable(),
  sourceDocumentId: z.string(),
  pageNumber: z.number().int().nullable(),
  evidenceText: z.string().nullable(),
  confidence: z.number().nullable(),
  extractionMethod: method,
  evidenceLocation: evidenceLocationSchema.nullable().optional(),
})
const comparisonSchema = z.object({
  fieldName: z.string(),
  status: z.enum(['MATCH', 'MISMATCH', 'NOT_FOUND', 'UNABLE_TO_DETERMINE']),
  expectedValue: z.string().nullable().optional(),
  observedValue: z.string().nullable().optional(),
  documentId: z.string().nullable().optional(),
  pageNumber: z.number().int().nullable().optional(),
  evidenceText: z.string().nullable().optional(),
  explanation: z.string(),
})
const fingerprintSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  fileSize: z.number(),
  processedAt: z.string(),
})
const findingSchema = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'HIGH']),
  title: z.string(),
  description: z.string(),
  documentId: z.string().nullable().optional(),
  fieldName: z.string().nullable().optional(),
  expectedValue: z.string().nullable().optional(),
  observedValue: z.string().nullable().optional(),
  evidenceText: z.string().nullable().optional(),
  pageNumber: z.number().int().nullable().optional(),
  recommendation: z.string(),
})
const documentResultSchema = z.object({
  documentId: z.string(),
  documentType: z.string(),
  fileName: z.string(),
  extractionMethod: method,
  classification: z.enum([
    'CONSISTENT',
    'POSSIBLE_MISMATCH',
    'INSUFFICIENT_EVIDENCE',
  ]),
  pagesProcessed: z.number().int(),
  readable: z.boolean(),
  warnings: z.array(z.string()),
  fingerprint: fingerprintSchema,
})
export const verificationReportSchema = z.object({
  reportId: z.string(),
  applicationId: z.string(),
  generatedAt: z.string(),
  engineVersion: z.string(),
  overallStatus: z.enum([
    'NO_ISSUES_DETECTED',
    'REVIEW_REQUIRED',
    'INCOMPLETE_ANALYSIS',
    'ANALYSIS_FAILED',
  ]),
  documentsAnalyzed: z.number().int(),
  documentsFailed: z.number().int(),
  findings: z.array(findingSchema),
  extractedFields: z.array(extractedFieldSchema),
  comparisons: z.array(comparisonSchema),
  documentResults: z.array(documentResultSchema),
  processingWarnings: z.array(z.string()),
})
export type VerificationReport = z.infer<typeof verificationReportSchema>

export const savedReportSchema = verificationReportSchema.extend({
  documentVersions: z.array(
    z.object({ documentId: z.string(), storageKey: z.string() }),
  ),
})
export type SavedReport = z.infer<typeof savedReportSchema>
