import io
import shutil
from PIL import Image, ImageOps, UnidentifiedImageError
import pytesseract


def ocr_available() -> bool:
    return shutil.which("tesseract") is not None


def extract_image_text(data: bytes, language: str, timeout: int) -> tuple[str, list[str]]:
    if not ocr_available():
        return "", ["OCR is unavailable. Install Tesseract and retry."]
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.width * source.height > 25_000_000:
                raise ValueError("Image exceeds the pixel processing limit.")
            image = ImageOps.exif_transpose(source).convert("L")
            image.thumbnail((2400, 2400))
            image = ImageOps.autocontrast(image)
            text = pytesseract.image_to_string(image, lang=language, timeout=timeout).strip()
    except UnidentifiedImageError as exc:
        raise ValueError("Image content is malformed or unreadable.") from exc
    except RuntimeError as exc:
        return "", ["OCR timed out while processing this image."]
    except pytesseract.TesseractError as exc:
        return "", ["OCR could not process this image."]
    return text, ([] if text else ["No readable text was found in this document."])
