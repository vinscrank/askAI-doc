from pydantic import BaseModel

from fastapi import APIRouter

from app.services import embedding_service, llm_service, qdrant_service

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str
    document_id: str

class SourceItem(BaseModel):
    chunk_index: int
    text_preview: str
    score: float

class AskResponse(BaseModel):
    question: str
    document_id: str
    answer: str
    sources: list[SourceItem]



@router.post("", response_model=AskResponse)
def ask(body: AskRequest):
    query_vector = embedding_service.embed_query(body.question)
    chunks = qdrant_service.search_similar(
        query_vector,
        top_k=5,
        document_id=body.document_id,
    )
    answer = llm_service.generate_answer(body.question, chunks)

    return AskResponse(
        question=body.question,
        document_id=body.document_id,
        answer=answer,
        sources=_format_sources(chunks),
    )

def _format_sources(chunks: list[dict], preview_length: int = 200) -> list[SourceItem]:
    return [
        SourceItem(
            chunk_index=chunk["chunk_index"],
            text_preview=chunk["text"][:preview_length],
            score=chunk["score"],
        )
        for chunk in chunks
    ]