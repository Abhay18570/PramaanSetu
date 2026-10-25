import { readRecords, storageKeys, writeRecords } from './localStorage.ts'
import { savedEvaluationSchema, officerReviewSchema, type SavedEvaluation, type OfficerReview } from '../compliance/model.ts'
import type { ApplicationRecord } from '../applications/model.ts'
import type { DocumentMetadata } from './documentMetadataRepository.ts'
import type { SavedReport } from '../analysis/model.ts'
import { isDemoSession, readDemoCollection, writeDemoCollection } from '../demo/storage.ts'

function writeEvaluations(values:SavedEvaluation[]){const valid=savedEvaluationSchema.array().parse(values);if(isDemoSession())writeDemoCollection('evaluations',valid);else writeRecords(storageKeys.complianceEvaluations,savedEvaluationSchema,valid)}
function writeReviews(values:OfficerReview[]){const valid=officerReviewSchema.array().parse(values);if(isDemoSession())writeDemoCollection('reviews',valid);else writeRecords(storageKeys.officerReviews,officerReviewSchema,valid)}

const MAX_EVALUATIONS_PER_APPLICATION=10
export function isEvaluationStale(evaluation:SavedEvaluation,application:ApplicationRecord,documents:DocumentMetadata[],analysis:SavedReport|null,catalogVersion=evaluation.catalogVersion){
  return evaluation.catalogVersion!==catalogVersion || evaluation.applicationRevision!==application.revision || evaluation.sourceAnalysisReportId!==(analysis?.reportId??null) || evaluation.documentVersions.length!==documents.length || evaluation.documentVersions.some(version=>!documents.some(item=>item.id===version.documentId&&item.storageKey===version.storageKey))
}
export const complianceRepository={
  list(){if(isDemoSession())return readDemoCollection<SavedEvaluation>('evaluations');return readRecords(storageKeys.complianceEvaluations,savedEvaluationSchema)},
  forApplication(id:string){return this.list().filter(item=>item.applicationId===id).sort((a,b)=>b.generatedAt.localeCompare(a.generatedAt))},
  latest(id:string){return this.forApplication(id)[0]??null},
  save(value:SavedEvaluation){const others=this.list().filter(item=>item.applicationId!==value.applicationId);const history=[value,...this.forApplication(value.applicationId).filter(item=>item.evaluationId!==value.evaluationId)].slice(0,MAX_EVALUATIONS_PER_APPLICATION);writeEvaluations([...others,...history]);return value},
  removeApplications(ids:string[]){writeEvaluations(this.list().filter(item=>!ids.includes(item.applicationId)))},
}
export const reviewRepository={
  list(){if(isDemoSession())return readDemoCollection<OfficerReview>('reviews');return readRecords(storageKeys.officerReviews,officerReviewSchema)},
  forApplication(id:string){return this.list().filter(item=>item.applicationId===id).sort((a,b)=>b.revision-a.revision)},
  latestForEvaluation(id:string){return this.list().filter(item=>item.evaluationId===id).sort((a,b)=>b.revision-a.revision)[0]??null},
  save(value:OfficerReview){const valid=officerReviewSchema.parse(value);const records=this.list();const existing=records.find(item=>item.reviewId===valid.reviewId);if(existing?.finalizedAt)throw new Error('Finalized reviews are immutable. Create a correction revision.');const revisions=records.filter(item=>item.evaluationId===valid.evaluationId);const latest=Math.max(0,...revisions.map(item=>item.revision));if(!existing&&revisions.some(item=>item.finalizedAt)&&valid.revision!==latest+1)throw new Error('A correction must create the next review revision.');writeReviews([...records.filter(item=>item.reviewId!==valid.reviewId),valid]);return valid},
  removeApplications(ids:string[]){writeReviews(this.list().filter(item=>!ids.includes(item.applicationId)))},
}
