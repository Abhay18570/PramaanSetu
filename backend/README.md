# PramaanSetu local verification API

This localhost-only FastAPI service processes synthetic PDF, JPG and PNG documents in memory. It extracts readable PDF text with PyMuPDF, uses local Tesseract OCR for scanned pages and images when available, calculates SHA-256 fingerprints, extracts bounded evidence fields, and returns explainable comparison and anomaly signals. Its Module 05 API also runs a versioned demonstration rule catalog and produces multilingual verification PDFs. It does not authenticate documents, detect forgery, implement official regulatory rules, or make approval decisions.

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On macOS, install local OCR with `brew install tesseract`. Without it, direct PDF text extraction remains available and scanned/image results explicitly report OCR unavailable.

Verification endpoints are `GET /api/health`, `GET /api/verification/capabilities`, and multipart `POST /api/verification/analyze`. Compliance endpoints are `GET /api/compliance/rules`, `GET /api/compliance/capabilities`, `POST /api/compliance/evaluate`, and `POST /api/compliance/report/pdf`. Run tests with `pytest`. Keep the API bound to localhost; a public deployment needs server authentication, authorization, rate limits, malware handling, encrypted durable storage, audit controls, signed reports, and a privacy/retention policy.
