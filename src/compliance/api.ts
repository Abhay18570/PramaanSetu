import type { ApplicationRecord } from '../applications/model'
import type { SavedReport } from '../analysis/model'
import type { DocumentMetadata } from '../storage/documentMetadataRepository'
import { complianceEvaluationSchema, type SavedEvaluation, type OfficerReview } from './model'
import { documentBlobRepository } from '../storage/documentBlobRepository'
import { currentLanguage } from '../i18n'

const apiBase=(import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000').replace(/\/$/,'')
async function request(path:string,options?:RequestInit){try{return await fetch(`${apiBase}${path}`,options)}catch{throw new Error('Compliance service is unavailable. Start the local backend and try again.')}}
export async function getCatalog(){const response=await request('/api/compliance/rules');if(!response.ok)throw new Error('Could not load the compliance rule catalog.');return response.json() as Promise<{catalogVersion:string}>}
export async function evaluateCompliance(application:ApplicationRecord,documents:DocumentMetadata[],analysis:SavedReport|null,analysisStale:boolean){
  const documentPayload=await Promise.all(documents.map(async item=>({id:item.id,documentType:item.documentType,fileName:item.fileName,storageKey:item.storageKey,blobAvailable:!!(await documentBlobRepository.get(item.storageKey))})))
  const catalog=await getCatalog();const response=await request('/api/compliance/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({application,documents:documentPayload,analysisReport:analysis,analysisStale,requestedCatalogVersion:catalog.catalogVersion})})
  if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.detail||'Compliance evaluation failed.')}
  const parsed=complianceEvaluationSchema.safeParse(await response.json());if(!parsed.success)throw new Error('The compliance service returned an invalid evaluation.')
  return {...parsed.data,applicationRevision:application.revision,documentVersions:documents.map(item=>({documentId:item.id,storageKey:item.storageKey})),savedAt:new Date().toISOString()} satisfies SavedEvaluation
}
export async function downloadCompliancePdf(application:ApplicationRecord,evaluation:SavedEvaluation,review:OfficerReview|null,stale:boolean){
  const response=await request('/api/compliance/report/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationReference:application.referenceNumber||application.id,institutionName:application.institutionName,applicationType:application.type,evaluation,reviewerSummary:review?{institutionVisibleNotes:review.institutionVisibleNotes,finalizedAt:review.finalizedAt,revision:review.revision}:null,language:currentLanguage(),stale})})
  if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.detail||'PDF report generation failed.')}
  const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`PramaanSetu_Verification_${application.referenceNumber||application.id}_${currentLanguage()}.pdf`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
