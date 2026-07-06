from pydantic import BaseModel

from fastapi import APIRouter

from app.services import embedding_service, llm_service, qdrant_service

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str
    document_id: str

class AskResponse(BaseModel):
    question: str
    document_id: str
    answer: str
    retrieved_chunks: list[dict]



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
        retrieved_chunks=chunks,
    )