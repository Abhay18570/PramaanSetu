import { z } from 'zod'
import { complianceEvaluationSchema } from '../compliance/model.ts'

export const overrideSchema=z.object({overrideId:z.string(),targetType:z.enum(['APPLICATION_FIELD','DOCUMENT_METADATA','DOCUMENT_AVAILABILITY','EXTRACTED_FIELD_ASSUMPTION']),targetReference:z.string(),operation:z.enum(['SET_VALUE','REMOVE_VALUE','ASSUME_DOCUMENT_PRESENT','ASSUME_DOCUMENT_REPLACED','ASSUME_EXTRACTED_VALUE']),originalValue:z.unknown().optional(),hypotheticalValue:z.unknown().optional(),explanation:z.string().max(500).default(''),provenance:z.literal('HYPOTHETICAL_USER_ASSUMPTION')})
export const simulationResultSchema=z.object({evaluation:complianceEvaluationSchema,outcomeProvenance:z.record(z.string(),z.enum(['EVALUATED_FROM_ACTUAL_EVIDENCE','EVALUATED_FROM_HYPOTHETICAL_INPUT','INSUFFICIENT_EVIDENCE','NOT_EVALUABLE'])),appliedOverrideIds:z.array(z.string()),warnings:z.array(z.string())})
export const scenarioSchema=z.object({scenarioId:z.string(),applicationId:z.string(),ownerInstitutionId:z.string(),scenarioName:z.string().min(1).max(100),description:z.string().max(500),createdAt:z.string(),updatedAt:z.string(),baselineFingerprint:z.string(),ruleCatalogVersion:z.string(),overrides:z.array(overrideSchema).max(50),lastSimulationResult:simulationResultSchema.nullable(),scenarioFingerprint:z.string(),status:z.enum(['DRAFT','SIMULATED','OUTDATED','ERROR'])})
export type SimulationOverride=z.infer<typeof overrideSchema>
export type SimulationResult=z.infer<typeof simulationResultSchema>
export type Scenario=z.infer<typeof scenarioSchema>
export type Impact='POTENTIAL_IMPROVEMENT'|'POTENTIAL_REGRESSION'|'UNCHANGED'|'BECAME_EVALUABLE'|'BECAME_INSUFFICIENT'|'UNKNOWN'
