import os
import uuid

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
ALLOWED_EXTENSIONS = {".txt"}


def save_upload_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato: {ext}. Al momento è supportato solo .txt.",
        )

    document_id = str(uuid.uuid4())
    stored_path = os.path.join(UPLOAD_DIR, f"{document_id}{ext}")

    with open(stored_path, "wb") as f:
        f.write(file.file.read())

    return document_id, stored_path


def extract_text(stored_path: str) -> str:
    with open(stored_path, "r", encoding="utf-8") as f:
        return f.read()