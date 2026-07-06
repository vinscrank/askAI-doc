import os
import uuid

import docx
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_upload_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato: {ext}. Formati ammessi: {', '.join(sorted(ALLOWED_EXTENSIONS))}.",
        )

    document_id = str(uuid.uuid4())
    stored_path = os.path.join(UPLOAD_DIR, f"{document_id}{ext}")

    with open(stored_path, "wb") as f:
        f.write(file.file.read())

    return document_id, stored_path


def find_stored_file(document_id: str) -> str | None:
    for ext in ALLOWED_EXTENSIONS:
        candidate = os.path.join(UPLOAD_DIR, f"{document_id}{ext}")
        if os.path.exists(candidate):
            return candidate
    return None


def extract_text(stored_path: str) -> str:
    ext = os.path.splitext(stored_path)[1].lower()

    if ext == ".pdf":
        return _extract_text_from_pdf(stored_path)
    if ext == ".docx":
        return _extract_text_from_docx(stored_path)

    with open(stored_path, "r", encoding="utf-8") as f:
        return f.read()


def _extract_text_from_pdf(stored_path: str) -> str:
    reader = PdfReader(stored_path)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages_text)


def _extract_text_from_docx(stored_path: str) -> str:
    document = docx.Document(stored_path)
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    return "\n".join(paragraphs)
