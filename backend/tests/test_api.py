import json
from .conftest import make_pdf


def metadata(name="Apex Institute of Technology"):
    return json.dumps({"applicationId":"11111111-1111-4111-8111-111111111111","institutionDetails":{"institutionName":name,"pincode":"411001","phone":"9000000000","address":"Sample Campus Pune"},"applicationDetails":{"institutionCode":"","existingApprovalReference":"","universityAffiliation":""},"academicYear":"2026-2027"})


def request(client, data, name="fire.pdf", kind="FIRE_SAFETY", content_type="application/pdf", application=None):
    return client.post("/api/verification/analyze",data={"metadata":application or metadata(),"document_ids":["22222222-2222-4222-8222-222222222222"],"document_types":[kind]},files=[("files",(name,data,content_type))])


def test_health_and_capabilities(client):
    health=client.get("/api/health");assert health.status_code==200;assert health.json()["status"]=="ready"
    capabilities=client.get("/api/verification/capabilities");assert capabilities.status_code==200;assert "PDF" in capabilities.json()["supportedFormats"];assert capabilities.json()["maximumUploadSize"]==10485760


def test_structured_text_pdf_report_and_hash(client, matching_pdf):
    response=request(client,matching_pdf);assert response.status_code==200
    report=response.json();assert report["documentsAnalyzed"]==1;assert report["documentsFailed"]==0
    assert report["documentResults"][0]["extractionMethod"]=="PDF_TEXT"
    assert report["documentResults"][0]["classification"]=="CONSISTENT"
    assert len(report["documentResults"][0]["fingerprint"]["sha256"])==64
    fields={item["fieldName"]:item for item in report["extractedFields"]}
    assert fields["institutionName"]["value"]=="Apex Institute of Technology"
    assert fields["registrationNumber"]["value"]=="REG-2026-101"
    assert fields["academicYear"]["value"]=="2026-2027"
    comparisons={item["fieldName"]:item["status"] for item in report["comparisons"]}
    assert comparisons["institutionName"]=="MATCH";assert comparisons["pincode"]=="MATCH"


def test_meaningful_mismatch_and_missing_field(client, matching_pdf):
    report=request(client,matching_pdf,application=metadata("Different Institute")).json()
    comparisons={item["fieldName"]:item["status"] for item in report["comparisons"]}
    assert comparisons["institutionName"]=="MISMATCH";assert comparisons["contact"]=="NOT_FOUND"
    assert any(item["category"]=="APPLICATION_COMPARISON" for item in report["findings"])


def test_rejections_and_corrupt_pdf(client):
    assert request(client,b"hello","sample.txt","FIRE_SAFETY","text/plain").status_code==415
    corrupt=request(client,b"%PDF-broken").json();assert corrupt["documentsFailed"]==1
    assert request(client,b"%PDF-"+b"x"*(10*1024*1024)).status_code==413


def test_cross_document_conflict_and_partial_analysis(client):
    first=make_pdf("Institution Name: Apex Institute of Technology\nRegistration Certificate")
    second=make_pdf("Institution Name: Different College\nAffiliated to: Sample University")
    response=client.post("/api/verification/analyze",data={"metadata":metadata(),"document_ids":["a","b"],"document_types":["REGISTRATION","AFFILIATION"]},files=[("files",("registration.pdf",first,"application/pdf")),("files",("affiliation.pdf",second,"application/pdf"))])
    assert response.status_code==200;report=response.json();assert any(item["category"]=="CROSS_DOCUMENT" for item in report["findings"])
    partial=client.post("/api/verification/analyze",data={"metadata":metadata(),"document_ids":["a","b"],"document_types":["REGISTRATION","AFFILIATION"]},files=[("files",("registration.pdf",first,"application/pdf")),("files",("bad.pdf",b"%PDF-bad","application/pdf"))]).json()
    assert partial["overallStatus"]=="INCOMPLETE_ANALYSIS";assert partial["documentsFailed"]==1


def test_expired_date_and_possible_category_mismatch(client):
    document=make_pdf("Institution Name: Apex Institute of Technology\nExpiry Date: 01/01/2000\nRegistration Number: REG-1")
    report=request(client,document,kind="FIRE_SAFETY").json()
    assert any(item["category"]=="EXPIRY" for item in report["findings"])
    assert report["documentResults"][0]["classification"]=="POSSIBLE_MISMATCH"
