from fastapi import APIRouter, File, UploadFile

from app.services import chunking_service, document_service, embedding_service, qdrant_service



router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    document_id, stored_path = document_service.save_upload_file(file)
    text = document_service.extract_text(stored_path)
    chunks = chunking_service.chunk_text(text, document_id)
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
