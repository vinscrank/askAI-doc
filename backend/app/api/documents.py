from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services import chunking_service, document_service, embedding_service, qdrant_service


class RenameDocumentRequest(BaseModel):
    filename: str



router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    document_id, stored_path = document_service.save_upload_file(file)
    text = document_service.extract_text(stored_path)
    chunks = chunking_service.chunk_text(text, document_id, filename=file.filename)
    chunks = embedding_service.embed_chunks(chunks)
    num_stored = qdrant_service.upsert_chunks(chunks)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "num_characters": len(text),
        "num_chunks": len(chunks),
        "num_stored_in_qdrant": num_stored,
        "embedding_dimension": len(chunks[0]["embedding"]) if chunks else 0,
    }

@router.get("")
def list_documents():
    return qdrant_service.list_documents()

@router.get("/{document_id}/file")
@router.head("/{document_id}/file")
def get_document_file(document_id: str):
    stored_path = document_service.find_stored_file(document_id)
    if stored_path is None:
        raise HTTPException(status_code=404, detail="Documento non trovato.")
    return FileResponse(stored_path)

@router.patch("/{document_id}")
def rename_document(document_id: str, body: RenameDocumentRequest):
    renamed = qdrant_service.rename_document(document_id, body.filename)
    if not renamed:
        raise HTTPException(status_code=404, detail="Documento non trovato.")
    return {"document_id": document_id, "filename": body.filename}