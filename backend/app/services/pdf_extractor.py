import fitz
from .image_ocr import extract_image_text, ocr_available


def extract_pdf(data: bytes, max_pages: int, language: str, timeout: int, max_ocr_pages: int = 8) -> tuple[list[dict], str, list[str]]:
    try:
        document = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise ValueError("PDF content is malformed or unreadable.") from exc
    try:
        if document.page_count == 0:
            raise ValueError("PDF contains no pages.")
        if document.page_count > max_pages:
            raise ValueError(f"PDF exceeds the {max_pages}-page processing limit.")
        pages, warnings, methods = [], [], set()
        ocr_pages = 0
        for index, page in enumerate(document):
            text = page.get_text("text").strip()
            words = [{"x0": word[0], "y0": word[1], "x1": word[2], "y1": word[3], "text": word[4]} for word in page.get_text("words")]
            method = "PDF_TEXT"
            if len(text) < 20:
                if ocr_available() and ocr_pages < max_ocr_pages:
                    ocr_pages += 1
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                    text, page_warnings = extract_image_text(pixmap.tobytes("png"), language, timeout)
                    warnings.extend(f"Page {index + 1}: {warning}" for warning in page_warnings)
                    method = "OCR" if text else "UNAVAILABLE"
                else:
                    reason = "OCR page limit reached" if ocr_available() else "OCR is unavailable"
                    warnings.append(f"Page {index + 1}: {reason} for this scanned or low-text page.")
                    method = "UNAVAILABLE"
            methods.add(method)
            pages.append({"number": index + 1, "text": text, "method": method, "width": page.rect.width, "height": page.rect.height, "words": words if method == "PDF_TEXT" else []})
        usable = methods - {"UNAVAILABLE"}
        overall = "MIXED" if len(usable) > 1 else (next(iter(usable)) if usable else "UNAVAILABLE")
        return pages, overall, warnings
    finally:
        document.close()
