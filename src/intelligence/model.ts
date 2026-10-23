import { z } from 'zod'

export const nodeTypeSchema=z.enum(['INSTITUTION','APPLICATION','DOCUMENT','IDENTIFIER','FINDING'])
export const relationshipTypeSchema=z.enum(['SUBMITTED_BY','CONTAINS_DOCUMENT','EXACT_DOCUMENT_MATCH','SHARES_IDENTIFIER','IDENTIFIER_CONFLICT','HAS_FINDING'])
export const signalTypeSchema=z.enum(['EXACT_DOCUMENT_REUSE','SHARED_IDENTIFIER','IDENTIFIER_CONFLICT'])
export const prioritySchema=z.enum(['INFO','REVIEW','HIGH_REVIEW'])
export const certaintySchema=z.enum(['EXACT_MATCH','NORMALIZED_MATCH','POTENTIAL_CONFLICT','INSUFFICIENT_EVIDENCE'])
export const evidenceReferenceSchema=z.object({kind:z.string(),reference:z.string(),applicationId:z.string().optional(),documentId:z.string().optional(),reportId:z.string().optional()})
export const graphNodeSchema=z.object({id:z.string(),type:nodeTypeSchema,label:z.string(),entityReference:z.string(),metadata:z.record(z.string(),z.unknown()),investigationSignalCount:z.number().int().nonnegative()})
export const graphEdgeSchema=z.object({id:z.string(),source:z.string(),target:z.string(),relationshipType:relationshipTypeSchema,evidenceReferences:z.array(evidenceReferenceSchema),explanationCode:z.string(),explanationParams:z.record(z.string(),z.unknown()),priority:prioritySchema.optional(),createdAt:z.string()})
export const signalSchema=z.object({signalId:z.string(),signalType:signalTypeSchema,priority:prioritySchema,evidenceCertainty:certaintySchema,applicationIds:z.array(z.string()),institutionIds:z.array(z.string()),documentIds:z.array(z.string()),identifierReferences:z.array(z.string()),explanationCode:z.string(),explanationParams:z.record(z.string(),z.unknown()),evidenceReferences:z.array(evidenceReferenceSchema),detectedAt:z.string(),inputSnapshotFingerprint:z.string(),signalFingerprint:z.string()})
export const graphSchema=z.object({snapshotFingerprint:z.string(),generatedAt:z.string(),nodes:z.array(graphNodeSchema),edges:z.array(graphEdgeSchema),signals:z.array(signalSchema),components:z.array(z.array(z.string()))})
export type IntelligenceGraph=z.infer<typeof graphSchema>
export type GraphNode=z.infer<typeof graphNodeSchema>
export type GraphEdge=z.infer<typeof graphEdgeSchema>
export type InvestigationSignal=z.infer<typeof signalSchema>
const revisionSchema=z.object({status:z.enum(['NEW','UNDER_INVESTIGATION','EXPLAINED','NEEDS_FOLLOW_UP','DISMISSED']),note:z.string().max(3000),officerId:z.string(),timestamp:z.string()})
export const investigationSchema=z.object({signalId:z.string(),signalFingerprint:z.string(),status:z.enum(['NEW','UNDER_INVESTIGATION','EXPLAINED','NEEDS_FOLLOW_UP','DISMISSED']),officerId:z.string(),notes:z.string().max(3000),dismissalReason:z.string().max(1000),createdAt:z.string(),updatedAt:z.string(),requiresReassessment:z.boolean(),revisionHistory:z.array(revisionSchema)})
export type Investigation=z.infer<typeof investigationSchema>
