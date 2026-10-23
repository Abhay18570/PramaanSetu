from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, field_validator
from ..core.config import get_settings

router=APIRouter(prefix="/api/copilot",tags=["copilot"])
Language=Literal["en","hi","mr"]
Intent=Literal["APPLICATION_STATUS","DOCUMENT_SUMMARY","MISSING_DOCUMENTS","VERIFICATION_FINDINGS","COMPLIANCE_FINDINGS","OFFICER_FEEDBACK","INVESTIGATION_SIGNALS","EVIDENCE_EXPLANATION","SIMULATION_EXPLANATION","CORRECTION_ROADMAP","APPLICATION_SUMMARY","HOW_TO_USE","UNSUPPORTED"]

class EvidenceItem(BaseModel):
    model_config=ConfigDict(extra="forbid")
    evidenceId:str=Field(min_length=1,max_length=160)
    sourceModule:Literal["APPLICATION","DOCUMENT_ANALYSIS","COMPLIANCE","INTELLIGENCE","EVIDENCE_INSPECTOR","SIMULATOR"]
    title:str=Field(max_length=200)
    summary:str=Field(max_length=800)
    value:str|None=Field(default=None,max_length=500)
    evidenceStatus:Literal["CURRENT","STALE","MISSING","HYPOTHETICAL","UNRESOLVED"]

class ChatRequest(BaseModel):
    model_config=ConfigDict(extra="forbid")
    question:str=Field(min_length=1,max_length=1000)
    language:Language
    contextType:Literal["APPLICATION","DOCUMENT_ANALYSIS","COMPLIANCE_EVALUATION","INVESTIGATION_SIGNAL","EVIDENCE_INSPECTOR","SIMULATION_SCENARIO"]
    intent:Intent
    evidenceContext:list[EvidenceItem]=Field(max_length=30)
    allowedCitationIds:list[str]=Field(max_length=30)
    providerMode:Literal["DETERMINISTIC","HOSTED_OPT_IN"]="DETERMINISTIC"

    @field_validator("allowedCitationIds")
    @classmethod
    def unique_citations(cls,value):
        if len(value)!=len(set(value)): raise ValueError("Citation IDs must be unique.")
        return value

class ChatResponse(BaseModel):
    answer:str
    mode:Literal["DETERMINISTIC_EVIDENCE"]
    language:Language
    citationIds:list[str]
    limitations:list[str]
    suggestedFollowUps:list[str]
    requestId:str

TEXT={
"en":{"none":"No current authorized evidence is available for this question.","prefix":"Based on the current authorized records","status":"the application status is","items":"the relevant records are","limit":"This is a browser-local prototype response and not an official compliance decision.","follow":"Ask about evidence, compliance findings, or correction priorities."},
"hi":{"none":"इस प्रश्न के लिए वर्तमान अधिकृत साक्ष्य उपलब्ध नहीं है।","prefix":"वर्तमान अधिकृत रिकॉर्ड के आधार पर","status":"आवेदन की स्थिति है","items":"संबंधित रिकॉर्ड हैं","limit":"यह ब्राउज़र-स्थानीय प्रोटोटाइप उत्तर है, आधिकारिक अनुपालन निर्णय नहीं।","follow":"साक्ष्य, अनुपालन निष्कर्ष या सुधार प्राथमिकताओं के बारे में पूछें।"},
"mr":{"none":"या प्रश्नासाठी सध्याचा अधिकृत पुरावा उपलब्ध नाही.","prefix":"सध्याच्या अधिकृत नोंदींनुसार","status":"अर्जाची स्थिती आहे","items":"संबंधित नोंदी आहेत","limit":"हे ब्राउझर-स्थानिक प्रात्यक्षिक उत्तर आहे; अधिकृत नियमपालन निर्णय नाही.","follow":"पुरावा, नियमपालन निष्कर्ष किंवा दुरुस्ती प्राधान्यांबद्दल विचारा."}}

@router.get("/capabilities")
def capabilities():
    settings=get_settings(); hosted=bool(settings.ai_provider!="deterministic" and settings.ai_model and settings.ai_api_key and settings.ai_base_url)
    return {"defaultMode":"DETERMINISTIC_EVIDENCE","languages":["en","hi","mr"],"hostedProviderAvailable":hosted,"providerId":settings.ai_provider if hosted else None,"rawDocumentsUploaded":False,"maxEvidenceItems":30}

@router.get("/health")
def health(): return {"status":"ready","mode":"DETERMINISTIC_EVIDENCE","checkedAt":datetime.now(timezone.utc).isoformat()}

@router.post("/chat",response_model=ChatResponse)
def chat(request:ChatRequest):
    # Client IDs are an allowlist, never authorization. Browser ownership filtering occurs before this boundary.
    allowed=set(request.allowedCitationIds); evidence=[item for item in request.evidenceContext if item.evidenceId in allowed]
    language=TEXT[request.language]
    if not evidence: answer=language["none"]
    elif request.intent=="APPLICATION_STATUS": answer=f'{language["prefix"]}, {language["status"]} {evidence[0].value or evidence[0].summary}.'
    else:
        facts="; ".join(f"{item.title}: {item.summary}" for item in evidence[:8])
        answer=f'{language["prefix"]}, {language["items"]}: {facts}.'
    stale=any(item.evidenceStatus=="STALE" for item in evidence); hypothetical=any(item.evidenceStatus=="HYPOTHETICAL" for item in evidence)
    limitations=[language["limit"]]
    if stale: limitations.append({"en":"Some cited evidence is outdated.","hi":"कुछ उद्धृत साक्ष्य पुराने हैं।","mr":"काही संदर्भित पुरावे जुने आहेत."}[request.language])
    if hypothetical: limitations.append({"en":"Hypothetical outcomes are unverified and do not guarantee approval.","hi":"परिकल्पित परिणाम असत्यापित हैं और स्वीकृति की गारंटी नहीं देते।","mr":"कल्पित निकाल अपडताळलेले आहेत आणि मंजुरीची हमी देत नाहीत."}[request.language])
    return ChatResponse(answer=answer,mode="DETERMINISTIC_EVIDENCE",language=request.language,citationIds=[item.evidenceId for item in evidence[:8]],limitations=limitations,suggestedFollowUps=[language["follow"]],requestId=str(uuid4()))
