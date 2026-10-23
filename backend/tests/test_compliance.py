import copy
import json
from pathlib import Path
import fitz
import pytest
from pydantic import ValidationError
from app.schemas.compliance import EvaluationRequest, RuleCatalog
from app.services.rule_catalog import load_catalog
from app.services.rule_engine import evaluate

def payload():
    return {"application":{"id":"app-1","applicationType":"EXTENSION_OF_APPROVAL","academicYear":"2026-2027","institutionDetails":{"institutionName":"Apex Institute"}},"documents":[{"id":"doc-reg","documentType":"REGISTRATION","fileName":"registration.pdf","storageKey":"one","blobAvailable":True},{"id":"doc-approval","documentType":"APPROVAL_LETTER","fileName":"approval.pdf","storageKey":"two","blobAvailable":True}],"analysisReport":{"reportId":"analysis-1","extractedFields":[{"fieldName":"expiryDate","value":"31/12/2099","sourceDocumentId":"doc-approval","pageNumber":1},{"fieldName":"institutionName","value":"Apex Institute","sourceDocumentId":"doc-reg","pageNumber":1},{"fieldName":"institutionName","value":"Apex Institute","sourceDocumentId":"doc-approval","pageNumber":1}],"comparisons":[{"fieldName":"institutionName","status":"MATCH","expectedValue":"Apex Institute","observedValue":"Apex Institute","documentId":"doc-reg","pageNumber":1},{"fieldName":"registrationNumber","status":"MATCH","expectedValue":"REG-1","observedValue":"REG-1","documentId":"doc-reg","pageNumber":1}],"documentResults":[{"documentId":"doc-reg","readable":True},{"documentId":"doc-approval","readable":True}]},"analysisStale":False,"requestedCatalogVersion":"demo-2026.1"}

def run(value=None): return evaluate(EvaluationRequest.model_validate(value or payload()),load_catalog())

def test_valid_catalog_has_ten_versioned_demonstration_rules():
    catalog=load_catalog();assert catalog.catalogVersion=="demo-2026.1";assert len(catalog.rules)==10;assert {r.sourceType for r in catalog.rules}=={"DEMONSTRATION"}

def test_invalid_and_unsupported_rules_are_rejected(tmp_path:Path):
    invalid=payload();rule=load_catalog().rules[0].model_dump();rule["operator"]="__import__('os').system('false')"
    with pytest.raises(ValidationError): RuleCatalog.model_validate({"catalogVersion":"bad","publishedAt":"now","rules":[rule]})
    path=tmp_path/"bad.json";path.write_text(json.dumps({"catalogVersion":"bad","publishedAt":"now","rules":[]}),encoding="utf-8")
    with pytest.raises(ValueError): load_catalog(path)

def test_complete_evidence_passes_deterministically():
    first=run();second=run();assert first.overallAssessment=="NO_FAILURES_DETECTED";assert first.counts.passed==10;assert [x.model_dump() for x in first.findings]==[x.model_dump() for x in second.findings];assert first.snapshotFingerprint==second.snapshotFingerprint

@pytest.mark.parametrize("mutate,rule_id",[(lambda p:p["application"]["institutionDetails"].update(institutionName=""),"DEMO-001"),(lambda p:p["analysisReport"]["comparisons"][0].update(status="MISMATCH"),"DEMO-005"),(lambda p:p["analysisReport"]["extractedFields"][0].update(value="01/01/2000"),"DEMO-006")])
def test_fail_evaluations(mutate,rule_id):
    value=payload();mutate(value);result=run(value);assert result.overallAssessment=="ISSUES_DETECTED";assert next(x for x in result.findings if x.ruleId==rule_id).result=="FAIL"

def test_missing_documents_and_analysis_are_insufficient_not_failures():
    value=payload();value["documents"]=[];value["analysisReport"]=None;result=run(value);assert result.overallAssessment=="INCOMPLETE_EVALUATION";assert result.counts.insufficientEvidence>=7;assert result.counts.failed==0;assert "ANALYSIS_REPORT_MISSING" in result.warnings

def test_stale_analysis_is_insufficient_evidence():
    value=payload();value["analysisStale"]=True;result=run(value);assert next(x for x in result.findings if x.ruleId=="DEMO-005").result=="INSUFFICIENT_EVIDENCE";assert "ANALYSIS_REPORT_STALE" in result.warnings

def test_other_application_type_is_not_applicable():
    value=payload();value["application"]["applicationType"]="OTHER";result=run(value);assert result.counts.notApplicable==10;assert result.overallAssessment=="EVALUATION_FAILED"

def test_invalid_date_evidence_returns_error_without_crashing_engine():
    value=payload();value["analysisReport"]["extractedFields"][0]["value"]="not-a-date";result=run(value);finding=next(x for x in result.findings if x.ruleId=="DEMO-006");assert finding.result=="ERROR";assert result.overallAssessment=="INCOMPLETE_EVALUATION"

def test_document_presence_and_blob_availability():
    value=payload();value["documents"][0]["blobAvailable"]=False;result=run(value);assert next(x for x in result.findings if x.ruleId=="DEMO-003").result=="INSUFFICIENT_EVIDENCE";assert next(x for x in result.findings if x.ruleId=="DEMO-009").result=="INSUFFICIENT_EVIDENCE"

def test_api_rules_capabilities_evaluation_and_validation(client):
    assert client.get('/api/compliance/rules').json()['catalogVersion']=='demo-2026.1';cap=client.get('/api/compliance/capabilities').json();assert 'FIELD_CONSISTENT' in cap['operators'];response=client.post('/api/compliance/evaluate',json=payload());assert response.status_code==200;assert response.json()['counts']['passed']==10;assert client.post('/api/compliance/evaluate',json={}).status_code==422

def test_requested_inactive_catalog_is_rejected(client):
    value=payload();value['requestedCatalogVersion']='unknown';assert client.post('/api/compliance/evaluate',json=value).status_code==409

def test_simulation_reuses_engine_without_mutating_request(client):
    value=payload(); original=copy.deepcopy(value)
    value['overrides']=[{"overrideId":"change-name","targetType":"APPLICATION_FIELD","targetReference":"application.institutionDetails.institutionName","operation":"REMOVE_VALUE","provenance":"HYPOTHETICAL_USER_ASSUMPTION"}]
    response=client.post('/api/compliance/simulate',json=value)
    assert response.status_code==200
    body=response.json();assert next(x for x in body['evaluation']['findings'] if x['ruleId']=='DEMO-001')['result']=='FAIL'
    assert body['outcomeProvenance']['DEMO-001']=='EVALUATED_FROM_HYPOTHETICAL_INPUT'
    assert {k:v for k,v in value.items() if k!='overrides'}==original

def test_assumed_document_is_never_verified(client):
    value=payload();value['documents']=[];value['overrides']=[{"overrideId":"assume-registration","targetType":"DOCUMENT_AVAILABILITY","targetReference":"REGISTRATION","operation":"ASSUME_DOCUMENT_PRESENT","hypotheticalValue":True,"provenance":"HYPOTHETICAL_USER_ASSUMPTION"}]
    body=client.post('/api/compliance/simulate',json=value).json();finding=next(x for x in body['evaluation']['findings'] if x['ruleId']=='DEMO-003')
    assert finding['result']=='INSUFFICIENT_EVIDENCE';assert body['outcomeProvenance']['DEMO-003']=='INSUFFICIENT_EVIDENCE';assert 'ASSUMED_DOCUMENT_NOT_VERIFIED' in body['warnings']

def test_simulation_rejects_invalid_assumption_and_catalog(client):
    value=payload();value['overrides']=[{"overrideId":"bad","targetType":"FAKE","targetReference":"x","operation":"SET_VALUE"}]
    assert client.post('/api/compliance/simulate',json=value).status_code==422
    value=payload();value['requestedCatalogVersion']='retired';value['overrides']=[]
    assert client.post('/api/compliance/simulate',json=value).status_code==409

@pytest.mark.parametrize('language', ['en','hi','mr'])
def test_pdf_reports_are_multilingual_multipage_and_disclaimed(client,language):
    evaluation=run().model_dump(mode='json');body={"applicationReference":"PS-2026-000001","institutionName":"Apex Institute","applicationType":"Extension of Approval","evaluation":evaluation,"reviewerSummary":{"institutionVisibleNotes":"Review note"},"language":language,"stale":False};response=client.post('/api/compliance/report/pdf',json=body);assert response.status_code==200;assert response.headers['content-type']=='application/pdf';document=fitz.open(stream=response.content,filetype='pdf');assert document.page_count>=2;text=''.join(page.get_text() for page in document);assert 'PramaanSetu' in text;assert 'SIH26261' in text;assert ('Prototype Compliance Evaluation Report' in text) if language=='en' else any('\u0900'<=char<='\u097f' for char in text);document.close()

def test_pdf_marks_stale_historical_snapshot(client):
    body={"applicationReference":"PS-1","institutionName":"Apex","applicationType":"Test","evaluation":run().model_dump(mode='json'),"language":"en","stale":True};response=client.post('/api/compliance/report/pdf',json=body);text=''.join(page.get_text() for page in fitz.open(stream=response.content,filetype='pdf'));assert 'Historical report' in text
