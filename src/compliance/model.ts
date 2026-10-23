import { z } from 'zod'

export const findingResultSchema = z.enum(['PASS','FAIL','INSUFFICIENT_EVIDENCE','NOT_APPLICABLE','ERROR'])
export const complianceFindingSchema = z.object({
  ruleId:z.string(), ruleVersion:z.string(), result:findingResultSchema,
  severity:z.enum(['INFO','WARNING','HIGH']), titleKey:z.string(), descriptionKey:z.string(), explanationCode:z.string(),
  explanationParams:z.record(z.string(),z.unknown()), expectedValue:z.unknown().optional(), observedValue:z.unknown().optional(),
  documentIds:z.array(z.string()), pageNumbers:z.array(z.number().int()), evidenceReferences:z.array(z.object({kind:z.enum(['APPLICATION_FIELD','DOCUMENT','ANALYSIS_FIELD','COMPARISON','FINGERPRINT']),reference:z.string(),documentId:z.string().nullable().optional(),pageNumber:z.number().int().nullable().optional()})),
  sourceType:z.enum(['VERIFIED_SOURCE','DEMONSTRATION']), sourceReference:z.string(), reviewRequired:z.boolean(),
})
export const complianceEvaluationSchema = z.object({
  evaluationId:z.string(), applicationId:z.string(), generatedAt:z.string(), catalogVersion:z.string(), sourceAnalysisReportId:z.string().nullable().optional(), snapshotFingerprint:z.string(),
  overallAssessment:z.enum(['NO_FAILURES_DETECTED','ISSUES_DETECTED','INCOMPLETE_EVALUATION','EVALUATION_FAILED']),
  counts:z.object({totalApplicable:z.number().int(),passed:z.number().int(),failed:z.number().int(),insufficientEvidence:z.number().int(),notApplicable:z.number().int(),errors:z.number().int()}),
  findings:z.array(complianceFindingSchema), warnings:z.array(z.string()),
})
export type ComplianceEvaluation=z.infer<typeof complianceEvaluationSchema>
export const savedEvaluationSchema=complianceEvaluationSchema.extend({
  applicationRevision:z.number().int(), documentVersions:z.array(z.object({documentId:z.string(),storageKey:z.string()})), savedAt:z.string(),
})
export type SavedEvaluation=z.infer<typeof savedEvaluationSchema>
const findingAssessmentSchema=z.object({ruleId:z.string(),reviewed:z.boolean(),assessment:z.enum(['ACCEPTED','NEEDS_CLARIFICATION','DISPUTED']),note:z.string().max(2000)})
export const officerReviewSchema=z.object({reviewId:z.string(),applicationId:z.string(),evaluationId:z.string(),officerUserId:z.string(),findingAssessments:z.array(findingAssessmentSchema),privateNotes:z.string().max(5000),institutionVisibleNotes:z.string().max(5000),createdAt:z.string(),updatedAt:z.string(),finalizedAt:z.string().nullable(),revision:z.number().int().positive()})
export type OfficerReview=z.infer<typeof officerReviewSchema>
