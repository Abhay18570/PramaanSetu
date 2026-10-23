import fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def make_pdf(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text, fontsize=10)
    data = document.tobytes()
    document.close()
    return data


@pytest.fixture
def matching_pdf():
    return make_pdf("Institution Name: Apex Institute of Technology\nRegistration Number: REG-2026-101\nAcademic Year: 2026-2027\nPIN Code: 411001\nFire Safety Certificate\nExpiry Date: 31/12/2099")

