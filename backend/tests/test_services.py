import io
import pytest
from PIL import Image, ImageDraw
from app.core.config import Settings
from app.schemas.verification import ApplicationMetadata
from app.services.field_extractor import extract_fields
from app.services.image_ocr import extract_image_text, ocr_available
from app.services.pdf_extractor import extract_pdf
from app.services.verification_engine import analyze
from app.utils.hashing import sha256_bytes
from .conftest import make_pdf


def test_field_extraction_with_page_evidence():
    fields=extract_fields("doc",[{"number":2,"text":"Institution Name: Apex Institute\nRegistration No: REG/55\nAcademic Year: 2026-2027","method":"PDF_TEXT"}],280)
    values={item.fieldName:item for item in fields};assert values["institutionName"].pageNumber==2;assert values["registrationNumber"].normalizedValue=="REG55";assert values["academicYear"].value=="2026-2027"

def test_native_pdf_extraction_provides_real_word_coordinates():
    pages,method,_=extract_pdf(make_pdf(["Institution Name: Apex Institute", "Registration No: REG/55"]),5,"eng",2)
    fields=extract_fields("doc",pages,280);field=next(item for item in fields if item.fieldName=="institutionName")
    assert method=="PDF_TEXT";assert field.evidenceLocation is not None;assert field.evidenceLocation.locationQuality=="EXACT";assert field.evidenceLocation.pageWidth>0;assert field.evidenceLocation.boundingBoxes[0].width>0


def test_hash_is_deterministic():
    assert sha256_bytes(b"sample")==sha256_bytes(b"sample");assert sha256_bytes(b"sample")!=sha256_bytes(b"other")


def test_pdf_page_limit_and_malformed():
    with pytest.raises(ValueError,match="malformed"):
        extract_pdf(b"%PDF-bad",30,"eng",2)
    two=__import__("fitz").open();two.new_page();two.new_page();data=two.tobytes();two.close()
    with pytest.raises(ValueError,match="page"):
        extract_pdf(data,1,"eng",2)


def test_image_ocr_or_explicit_unavailable():
    image=Image.new("RGB",(500,120),"white");ImageDraw.Draw(image).text((20,40),"Institution Name: Apex Institute",fill="black");buffer=io.BytesIO();image.save(buffer,"PNG")
    text,warnings=extract_image_text(buffer.getvalue(),"eng",10)
    if ocr_available(): assert isinstance(text,str)
    else: assert not text and "unavailable" in warnings[0].lower()


@pytest.mark.skipif(not ocr_available(),reason="Tesseract is not installed")
def test_scanned_pdf_ocr_when_available():
    import fitz
    image=Image.new("RGB",(900,160),"white");ImageDraw.Draw(image).text((30,60),"Institution Name: OCR Sample Institute",fill="black");buffer=io.BytesIO();image.save(buffer,"PNG")
    document=fitz.open();page=document.new_page(width=900,height=160);page.insert_image(page.rect,stream=buffer.getvalue());data=document.tobytes();document.close()
    pages,method,warnings=extract_pdf(data,5,"eng",15);assert method=="OCR";assert pages[0]["text"]
