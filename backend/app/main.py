from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.verification import router
from .api.compliance import router as compliance_router
from .api.copilot import router as copilot_router
from .core.config import get_settings
from .services.image_ocr import ocr_available

settings = get_settings()
app = FastAPI(title="PramaanSetu Local Verification API", version=settings.engine_version)
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
app.include_router(router)
app.include_router(compliance_router)
app.include_router(copilot_router)


@app.get("/api/health")
def health():
    return {"status": "ready", "engineVersion": settings.engine_version, "pdfExtractionAvailable": True, "ocrAvailable": ocr_available()}
