import { investigationSchema,type Investigation,type InvestigationSignal } from '../intelligence/model.ts'
import { readRecords,storageKeys,writeRecords } from './localStorage.ts'
export const investigationRepository={
 list(){return readRecords(storageKeys.investigations,investigationSchema)},
 forSignal(signal:InvestigationSignal){const record=this.list().find(item=>item.signalId===signal.signalId);return record?{...record,requiresReassessment:record.signalFingerprint!==signal.signalFingerprint}:null},
 save(signal:InvestigationSignal,officerId:string,status:Investigation['status'],notes:string,dismissalReason=''){if(status==='DISMISSED'&&!dismissalReason.trim())throw new Error('A dismissal reason is required.');const records=this.list(),existing=records.find(item=>item.signalId===signal.signalId),now=new Date().toISOString();const value=investigationSchema.parse({signalId:signal.signalId,signalFingerprint:signal.signalFingerprint,status,officerId,notes,dismissalReason,createdAt:existing?.createdAt??now,updatedAt:now,requiresReassessment:false,revisionHistory:[...(existing?.revisionHistory??[]),{status,note:status==='DISMISSED'?dismissalReason:notes,officerId,timestamp:now}]});writeRecords(storageKeys.investigations,investigationSchema,[...records.filter(item=>item.signalId!==signal.signalId),value]);return value},
 removeSignals(ids:string[]){writeRecords(storageKeys.investigations,investigationSchema,this.list().filter(item=>!ids.includes(item.signalId)))}
}
