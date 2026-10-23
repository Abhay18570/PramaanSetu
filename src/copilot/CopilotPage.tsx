import { useRef,useState } from 'react'
import { Link,useParams,useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Copy,Send,ShieldCheck,Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { getApplication } from '../documents/service'
import { classifyIntent } from './intents'
import { retrieveEvidence,citations } from './retrieval'
import { askCopilot } from './api'
import { conversationRepository,newConversation } from './repository'
import type { Conversation,CopilotMessage } from './model'
import type { ApplicationRecord } from '../applications/model'
import './copilot.css'

const contexts=['APPLICATION','DOCUMENT_ANALYSIS','COMPLIANCE_EVALUATION','EVIDENCE_INSPECTOR','SIMULATION_SCENARIO'] as const
export default function CopilotPage(){
 const {id=''}=useParams(),{user}=useAuth(),{t}=useTranslation(),[query]=useSearchParams();const context=(contexts.includes(query.get('context') as never)?query.get('context'):'APPLICATION') as Conversation['contextType'];let application:ApplicationRecord|null=null,error='';if(user)try{application=getApplication(user,id)}catch(err){error=(err as Error).message}
 const initial=user&&application?conversationRepository.forOwner(user.id,user.role,id):[];const [history,setHistory]=useState(initial),[conversation,setConversation]=useState<Conversation|null>(initial[0]??(user&&application?newConversation(user.id,user.role,id,context):null)),[question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');const active=useRef<AbortController|null>(null)
 if(!user)return null;if(!application)return <section className="gov-card"><h1>{t('copilot.title')}</h1><p role="alert">{error}</p></section>
 const owner=user,activeApplication=application
 const suggestions=user.role==='INSTITUTION'?[t('copilot.q.status'),t('copilot.q.findings'),t('copilot.q.correct'),t('copilot.q.feedback'),t('copilot.q.simulation')]:[t('copilot.q.summary'),t('copilot.q.priority'),t('copilot.q.documents'),t('copilot.q.relationship'),t('copilot.q.evidence')]
 const persist=(value:Conversation)=>{const saved=conversationRepository.save(value);setConversation(saved);setHistory(conversationRepository.forOwner(user.id,user.role,id))}
 // oxlint-disable-next-line react/purity -- timestamps are created only when this event handler runs.
 async function send(text=question){const trimmed=text.trim();if(!trimmed||!conversation||busy)return;const intent=classifyIntent(trimmed),evidence=retrieveEvidence(owner,activeApplication,intent),userMessage:CopilotMessage={messageId:crypto.randomUUID(),role:'USER',content:trimmed,createdAt:new Date().toISOString(),citations:[],limitations:[]},pending={...conversation,messages:[...conversation.messages,userMessage]};setConversation(pending);setQuestion('');setBusy(true);setNotice('');active.current?.abort();const controller=new AbortController();active.current=controller;try{const result=await askCopilot(trimmed,intent,evidence,conversation.contextType,controller.signal);if(active.current!==controller)return;const answer:CopilotMessage={messageId:crypto.randomUUID(),role:'ASSISTANT',content:result.answer,createdAt:new Date().toISOString(),citations:citations(evidence,result.citationIds),limitations:result.limitations};persist({...pending,messages:[...pending.messages,answer]})}catch(err){if((err as Error).name!=='AbortError')setNotice((err as Error).message)}finally{if(active.current===controller)setBusy(false)}}
 return <div className="copilot-page">
  <header className="copilot-header"><div><span>MODULE 09 · READ ONLY</span><h1>{t('copilot.title')}</h1><p>{t('copilot.subtitle')}</p></div><Link className="gov-btn gov-btn-secondary" to={`${user.role==='OFFICER'?'/officer':'/institution'}/applications/${id}`}>{t('copilot.back')}</Link></header>
  <div className="copilot-context"><ShieldCheck size={18}/><b>{application.referenceNumber}</b><span>{application.institutionName}</span><span className="copilot-chip">{conversation?.contextType.replaceAll('_',' ')}</span><span className="copilot-mode">{t('copilot.mode')}</span></div>
  <aside className="copilot-privacy"><b>{t('copilot.privacyTitle')}</b> {t('copilot.privacy')}</aside>
  <div className="copilot-layout">
   <aside className="gov-card copilot-history"><div className="copilot-section-title"><h2>{t('copilot.history')}</h2><button onClick={()=>{const value=newConversation(user.id,user.role,id,context);setConversation(value)}}>{t('copilot.new')}</button></div>{history.map(item=><div className="copilot-history-item" key={item.conversationId}><button onClick={()=>setConversation(item)}>{item.messages.find(x=>x.role==='USER')?.content??t('copilot.empty')}</button><button aria-label="Delete conversation" onClick={()=>{conversationRepository.remove(item.conversationId,user.id);const rows=conversationRepository.forOwner(user.id,user.role,id);setHistory(rows);if(item.conversationId===conversation?.conversationId)setConversation(rows[0]??newConversation(user.id,user.role,id,context))}}><Trash2 size={15}/></button></div>)}<button className="copilot-clear" onClick={()=>confirm(t('copilot.clearConfirm'))&&(conversationRepository.clear(user.id,user.role),setHistory([]),setConversation(newConversation(user.id,user.role,id,context)))}>{t('copilot.clear')}</button></aside>
   <section className="gov-card copilot-chat" aria-label={t('copilot.title')}>
    <div className="copilot-messages" aria-live="polite">{!conversation?.messages.length&&<div className="copilot-empty"><h2>{t('copilot.ready')}</h2><p>{t('copilot.emptyHelp')}</p><div className="copilot-suggestions">{suggestions.map(s=><button key={s} onClick={()=>void send(s)}>{s}</button>)}</div></div>}{conversation?.messages.map(message=><article key={message.messageId} className={`copilot-message ${message.role.toLowerCase()}`}><small>{message.role==='USER'?t('copilot.you'):t('copilot.assistant')}</small><p>{message.content}</p>{message.role==='ASSISTANT'&&<button className="copilot-copy" onClick={()=>void navigator.clipboard.writeText(message.content)}><Copy size={14}/> {t('copilot.copy')}</button>}{message.citations.length>0&&<div className="copilot-citations"><b>{t('copilot.sources')}</b>{message.citations.map(c=><details key={c.evidenceId}><summary><Link to={c.targetRoute}>{c.title}</Link><span>{c.evidenceStatus}</span></summary><p>{c.sourceModule.replaceAll('_',' ')}{c.pageNumber?` · Page ${c.pageNumber}`:''}</p></details>)}</div>}{message.limitations.map(limit=><p className="copilot-limitation" key={limit}>{limit}</p>)}</article>)}{busy&&<p role="status" className="copilot-loading">{t('copilot.searching')}</p>}</div>
    {notice&&<div className="copilot-error" role="alert">{notice}<button onClick={()=>void send(conversation?.messages.filter(x=>x.role==='USER').at(-1)?.content??'')}>{t('copilot.retry')}</button></div>}
    <form className="copilot-composer" onSubmit={event=>{event.preventDefault();void send()}}><label htmlFor="copilot-question">{t('copilot.ask')}</label><textarea id="copilot-question" maxLength={1000} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send()}}} placeholder={t('copilot.placeholder')}/><button className="gov-btn gov-btn-primary" disabled={busy||!question.trim()}><Send size={17}/>{t('copilot.send')}</button></form>
   </section>
  </div>
 </div>
}
