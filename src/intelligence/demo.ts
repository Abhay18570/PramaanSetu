import { applicationRepository } from '../storage/applicationRepository'
import { documentMetadataRepository } from '../storage/documentMetadataRepository'
import { analysisReportRepository } from '../storage/analysisReportRepository'
import { complianceRepository,reviewRepository } from '../storage/complianceRepository'
import { userRepository } from '../storage/userRepository'
import type { SavedReport } from '../analysis/model'

const institutions=[
 ['d1000000-0000-4000-8000-000000000001','Fictional Northstar Institute','northstar.demo@example.test'],
 ['d1000000-0000-4000-8000-000000000002','Fictional Riverbend College','riverbend.demo@example.test'],
 ['d1000000-0000-4000-8000-000000000003','Fictional Cedar Academy','cedar.demo@example.test'],
] as const
const applications=[
 ['d2000000-0000-4000-8000-000000000001',institutions[0][0],'PS-DEMO-A1','DEMO-REG-101'],
 ['d2000000-0000-4000-8000-000000000002',institutions[1][0],'PS-DEMO-B1','DEMO-REG-202'],
 ['d2000000-0000-4000-8000-000000000003',institutions[2][0],'PS-DEMO-C1','demo reg 101'],
 ['d2000000-0000-4000-8000-000000000004',institutions[0][0],'PS-DEMO-A2','DEMO-REG-404'],
] as const
const docIds=['d3000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000003','d3000000-0000-4000-8000-000000000004']
const storageIds=['d4000000-0000-4000-8000-000000000001','d4000000-0000-4000-8000-000000000002','d4000000-0000-4000-8000-000000000003','d4000000-0000-4000-8000-000000000004']
const shared='a'.repeat(64),hashes=[shared,shared,'b'.repeat(64),'c'.repeat(64)]

export function loadIntelligenceDemo(){const now=new Date().toISOString();for(const [id,name,email] of institutions)userRepository.save({id,name:`${name} Coordinator`,email,role:'INSTITUTION',institutionName:name,phone:'9000000000',state:'Maharashtra',city:'Pune',createdAt:now,updatedAt:now});applications.forEach(([id,userId,reference,identifier],index)=>{const institutionName=institutions.find(x=>x[0]===userId)![1];applicationRepository.save({id,userId,institutionUserId:userId,referenceNumber:reference,institutionName,type:'Extension of Approval — Institutional Application',applicationType:'EXTENSION_OF_APPROVAL',academicYear:'2026-2027',institutionDetails:{institutionName,institutionType:'Engineering College',contactPerson:'Synthetic Coordinator',email:'demo@example.test',phone:'9000000000',state:'Maharashtra',city:'Pune',address:'Synthetic campus address',pincode:'411001'},applicationDetails:{approvalType:'EXTENSION_OF_APPROVAL',institutionCode:identifier,universityAffiliation:'Fictional University',establishmentYear:'2020',existingApprovalReference:'',remarks:'Module 06 synthetic demonstration record'},documentIds:[docIds[index]],status:'UNDER_REVIEW',createdAt:now,updatedAt:now,submittedAt:now,currentStep:4,revision:1,statusHistory:[{status:'DRAFT',timestamp:now},{status:'SUBMITTED',timestamp:now},{status:'UNDER_REVIEW',timestamp:now}]});documentMetadataRepository.save({id:docIds[index],applicationId:id,documentType:'REGISTRATION',fileName:`synthetic-registration-${reference.slice(-2)}.pdf`,mimeType:'application/pdf',fileSize:512,uploadedAt:now,storageKey:storageIds[index]});analysisReportRepository.save(report(id,docIds[index],reference,identifier,hashes[index],now))})}
function report(applicationId:string,documentId:string,reference:string,identifier:string,sha256:string,now:string):SavedReport{return{reportId:`analysis-${reference}`,applicationId,generatedAt:now,engineVersion:'demo-module-06',overallStatus:'NO_ISSUES_DETECTED',documentsAnalyzed:1,documentsFailed:0,findings:[],extractedFields:[{fieldName:'registrationNumber',value:identifier,normalizedValue:identifier.toUpperCase().replaceAll(' ','-'),sourceDocumentId:documentId,pageNumber:1,evidenceText:null,confidence:1,extractionMethod:'PDF_TEXT'}],comparisons:[],documentResults:[{documentId,documentType:'REGISTRATION',fileName:`synthetic-${reference}.pdf`,extractionMethod:'PDF_TEXT',classification:'CONSISTENT',pagesProcessed:1,readable:true,warnings:[],fingerprint:{documentId,fileName:`synthetic-${reference}.pdf`,sha256,fileSize:512,processedAt:now}}],processingWarnings:['SYNTHETIC_MODULE_06_DEMO'],documentVersions:[{documentId,storageKey:storageIds[applications.findIndex(a=>a[0]===applicationId)]}]}}
export function removeIntelligenceDemo(){const appIds=applications.map(x=>x[0]);documentMetadataRepository.removeApplications(appIds);analysisReportRepository.removeApplications(appIds);complianceRepository.removeApplications(appIds);reviewRepository.removeApplications(appIds);for(const id of appIds)applicationRepository.remove(id);for(const [id] of institutions)userRepository.remove(id)}
