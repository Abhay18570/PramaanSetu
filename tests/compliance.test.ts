import test from 'node:test'
import assert from 'node:assert/strict'
import { isEvaluationStale } from '../src/storage/complianceRepository.ts'
import { complianceEvaluationSchema, officerReviewSchema } from '../src/compliance/model.ts'

const evaluation=complianceEvaluationSchema.parse({evaluationId:'eval-1',applicationId:'app-1',generatedAt:'2026-10-23T00:00:00.000Z',catalogVersion:'demo-2026.1',sourceAnalysisReportId:'report-1',snapshotFingerprint:'a'.repeat(64),overallAssessment:'INCOMPLETE_EVALUATION',counts:{totalApplicable:1,passed:0,failed:0,insufficientEvidence:1,notApplicable:0,errors:0},findings:[{ruleId:'DEMO-001',ruleVersion:'1.0',result:'INSUFFICIENT_EVIDENCE',severity:'HIGH',titleKey:'rules.institutionName',descriptionKey:'rules.institutionNameDescription',explanationCode:'REQUIRED_VALUE_MISSING',explanationParams:{},documentIds:[],pageNumbers:[],evidenceReferences:[],sourceType:'DEMONSTRATION',sourceReference:'DEMO-2026/001',reviewRequired:true}],warnings:[]})

test('compliance evaluation schema preserves stable codes and traceable rule metadata',()=>{assert.equal(evaluation.findings[0].ruleId,'DEMO-001');assert.equal(evaluation.findings[0].sourceType,'DEMONSTRATION');assert.equal(evaluation.findings[0].reviewRequired,true)})

test('evaluation staleness detects application, document, analysis and catalog changes',()=>{
 const application:any={id:'app-1',revision:2};const documents:any=[{id:'doc-1',storageKey:'blob-1'}];const analysis:any={reportId:'report-1'};const saved:any={...evaluation,applicationRevision:2,documentVersions:[{documentId:'doc-1',storageKey:'blob-1'}],savedAt:evaluation.generatedAt}
 assert.equal(isEvaluationStale(saved,application,documents,analysis,'demo-2026.1'),false)
 assert.equal(isEvaluationStale(saved,{...application,revision:3},documents,analysis),true)
 assert.equal(isEvaluationStale(saved,application,[{...documents[0],storageKey:'blob-2'}],analysis),true)
 assert.equal(isEvaluationStale(saved,application,documents,{reportId:'report-2'}),true)
 assert.equal(isEvaluationStale(saved,application,documents,analysis,'demo-2027.1'),true)
})

test('officer review schema separates private and institution-visible notes',()=>{
 const review=officerReviewSchema.parse({reviewId:'review-1',applicationId:'app-1',evaluationId:'eval-1',officerUserId:'officer-1',findingAssessments:[{ruleId:'DEMO-001',reviewed:true,assessment:'NEEDS_CLARIFICATION',note:'finding note'}],privateNotes:'private note',institutionVisibleNotes:'visible note',createdAt:'2026-10-23T00:00:00.000Z',updatedAt:'2026-10-23T00:00:00.000Z',finalizedAt:null,revision:1})
 assert.equal(review.privateNotes,'private note');assert.equal(review.institutionVisibleNotes,'visible note')
})
