from io import BytesIO
from pathlib import Path
import html
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from ..schemas.compliance import PdfReportRequest

TEXT = {
 "en": {"title":"Prototype Compliance Evaluation Report","summary":"Executive Summary","analysis":"Document Analysis Overview","rules":"Compliance Rule Results","evidence":"Evidence and Findings","missing":"Missing Information","review":"Officer Review Summary","sources":"Rule Sources and References","limits":"Evaluation Limitations","application":"Application reference","institution":"Institution name","type":"Application type","date":"Evaluation date","report":"Report ID","catalog":"Rule catalog version","overall":"Overall assessment","language":"Report language","illustrative":"Illustrative Rule","stale":"Historical report — evaluation was outdated when exported.","limitText":"Automated consistency checks do not establish document authenticity or constitute a regulatory decision.","disclaimer":"Independent SIH 2026 prototype. Not an official AICTE or Government of India verification certificate."},
 "hi": {"title":"प्रोटोटाइप अनुपालन मूल्यांकन रिपोर्ट","summary":"कार्यकारी सारांश","analysis":"दस्तावेज़ विश्लेषण अवलोकन","rules":"अनुपालन नियम परिणाम","evidence":"साक्ष्य और निष्कर्ष","missing":"अनुपलब्ध जानकारी","review":"अधिकारी समीक्षा सारांश","sources":"नियम स्रोत और संदर्भ","limits":"मूल्यांकन सीमाएँ","application":"आवेदन संदर्भ","institution":"संस्थान का नाम","type":"आवेदन प्रकार","date":"मूल्यांकन तिथि","report":"रिपोर्ट आईडी","catalog":"नियम सूची संस्करण","overall":"समग्र मूल्यांकन","language":"रिपोर्ट भाषा","illustrative":"उदाहरणात्मक नियम","stale":"ऐतिहासिक रिपोर्ट — निर्यात के समय मूल्यांकन पुराना था।","limitText":"स्वचालित संगति जाँच दस्तावेज़ की प्रामाणिकता सिद्ध नहीं करती और नियामक निर्णय नहीं है।","disclaimer":"स्वतंत्र SIH 2026 प्रोटोटाइप। यह आधिकारिक AICTE या भारत सरकार सत्यापन प्रमाणपत्र नहीं है।"},
 "mr": {"title":"प्रोटोटाइप नियमपालन मूल्यांकन अहवाल","summary":"कार्यकारी सारांश","analysis":"दस्तऐवज विश्लेषण आढावा","rules":"नियमपालन नियम निकाल","evidence":"पुरावे आणि निष्कर्ष","missing":"अपूर्ण माहिती","review":"अधिकारी पुनरावलोकन सारांश","sources":"नियम स्रोत आणि संदर्भ","limits":"मूल्यांकन मर्यादा","application":"अर्ज संदर्भ","institution":"संस्थेचे नाव","type":"अर्ज प्रकार","date":"मूल्यांकन दिनांक","report":"अहवाल आयडी","catalog":"नियम सूची आवृत्ती","overall":"एकूण मूल्यांकन","language":"अहवाल भाषा","illustrative":"उदाहरणात्मक नियम","stale":"ऐतिहासिक अहवाल — निर्यातवेळी मूल्यांकन जुने होते.","limitText":"स्वयंचलित सुसंगती तपासणी दस्तऐवजाची सत्यता सिद्ध करत नाही आणि नियामक निर्णय नाही.","disclaimer":"स्वतंत्र SIH 2026 प्रोटोटाइप. हे अधिकृत AICTE किंवा भारत सरकार पडताळणी प्रमाणपत्र नाही."}
}

def _font(language: str) -> str:
    if language == "en": return "Helvetica"
    path = Path(__file__).resolve().parents[1] / "assets" / "NotoSansDevanagari-Regular.ttf"
    if not path.exists(): raise RuntimeError("Devanagari report font is unavailable")
    name = "NotoSansDevanagari"
    if name not in pdfmetrics.getRegisteredFontNames(): pdfmetrics.registerFont(TTFont(name, str(path), shapable=True))
    return name

def generate_pdf(request: PdfReportRequest) -> bytes:
    labels = TEXT[request.language]
    font = _font(request.language)
    stream = BytesIO()
    styles = getSampleStyleSheet()
    normal = ParagraphStyle("ReportBody", parent=styles["BodyText"], fontName=font, fontSize=9, leading=13)
    heading = ParagraphStyle("ReportHeading", parent=styles["Heading2"], fontName=font, textColor=colors.HexColor("#061D45"), spaceBefore=10, spaceAfter=7)
    title = ParagraphStyle("ReportTitle", parent=heading, fontSize=20, leading=26, alignment=TA_CENTER)
    def paragraph(value, style=normal):
        escaped=html.escape(str(value))
        if request.language != "en": escaped=re.sub(r"([A-Za-z0-9_./:·—-]+(?:\s+[A-Za-z0-9_./:·—-]+)*)",r'<font name="Helvetica">\1</font>',escaped)
        return Paragraph(escaped,style)
    def decorate(canvas, doc):
        canvas.saveState(); canvas.setFillColor(colors.HexColor("#061D45")); canvas.rect(0, A4[1]-18*mm, A4[0], 18*mm, fill=1, stroke=0)
        canvas.setFillColor(colors.white); canvas.setFont("Helvetica", 9); canvas.drawString(18*mm, A4[1]-11*mm, "PramaanSetu · SIH26261")
        canvas.setFillColor(colors.HexColor("#475569")); canvas.setFont(font, 7); canvas.drawCentredString(A4[0]/2, 10*mm, labels["disclaimer"]); canvas.drawRightString(A4[0]-15*mm, 10*mm, str(doc.page)); canvas.restoreState()
    document = BaseDocTemplate(stream, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=27*mm, bottomMargin=18*mm, title=labels["title"])
    document.addPageTemplates(PageTemplate(id="report", frames=[Frame(document.leftMargin, document.bottomMargin, document.width, document.height, id="body")], onPage=decorate))
    evaluation = request.evaluation
    story = [Spacer(1, 12*mm), Paragraph("PramaanSetu", ParagraphStyle("Brand",parent=title,fontName="Helvetica")), paragraph(labels["title"], title), Spacer(1, 8*mm)]
    rows = [[labels["application"], request.applicationReference], [labels["institution"], request.institutionName], [labels["type"], request.applicationType], [labels["date"], evaluation.generatedAt], [labels["report"], evaluation.evaluationId], [labels["catalog"], evaluation.catalogVersion], [labels["overall"], evaluation.overallAssessment], [labels["language"], request.language]]
    table = Table([[paragraph(a), paragraph(b)] for a,b in rows], colWidths=[52*mm, 110*mm], repeatRows=0)
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),colors.HexColor("#EAF2FB")),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#D9E2EF")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6)])); story += [table, Spacer(1, 6*mm)]
    if request.stale: story.append(paragraph(labels["stale"]))
    story += [paragraph(labels["summary"], heading), paragraph(f"PASS: {evaluation.counts.passed} · FAIL: {evaluation.counts.failed} · INSUFFICIENT EVIDENCE: {evaluation.counts.insufficientEvidence} · ERROR: {evaluation.counts.errors}"), paragraph(labels["analysis"], heading), paragraph(f"Source analysis report: {evaluation.sourceAnalysisReportId or 'Not available'}"), PageBreak(), paragraph(labels["rules"], heading)]
    rule_rows = [["Rule", "Result", "Severity", labels["evidence"]]] + [[item.ruleId, item.result, item.severity, ", ".join(item.documentIds) or "—"] for item in evaluation.findings]
    rule_table = Table([[paragraph(cell) for cell in row] for row in rule_rows], colWidths=[29*mm,42*mm,30*mm,61*mm], repeatRows=1)
    rule_table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#061D45")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#CBD5E1")),("VALIGN",(0,0),(-1,-1),"TOP")]))
    story += [rule_table, paragraph(labels["evidence"], heading)]
    for item in evaluation.findings: story += [paragraph(f"{item.ruleId} · {labels['illustrative']} — {item.explanationCode}"), paragraph(f"{item.sourceReference} · {', '.join(item.documentIds) or '—'}"), Spacer(1,2*mm)]
    missing = [item.ruleId for item in evaluation.findings if item.result in {"INSUFFICIENT_EVIDENCE", "ERROR"}]
    story += [paragraph(labels["missing"], heading), paragraph(", ".join(missing) or "—"), paragraph(labels["review"], heading), paragraph(str((request.reviewerSummary or {}).get("institutionVisibleNotes") or "—")), paragraph(labels["sources"], heading), paragraph("; ".join(f"{item.ruleId}: {item.sourceReference}" for item in evaluation.findings)), paragraph(labels["limits"], heading), paragraph(labels["limitText"]), paragraph(labels["disclaimer"])]
    document.build(story)
    return stream.getvalue()
