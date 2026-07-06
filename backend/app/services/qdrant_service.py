from qdrant_client import QdrantClient
from qdrant_client.models import Distance, FieldCondition, Filter, MatchValue, PointStruct, VectorParams
import os
import uuid


QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "askdocs_chunks")

client = QdrantClient(
    url=QDRANT_URL,
    api_key=os.getenv("QDRANT_API_KEY"),
)

def ensure_collection(vector_size: int = 1536):
    collections = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in collections:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
def upsert_chunks(chunks: list[dict]) -> int:
    if not chunks:
        return 0

    points = [
        PointStruct(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{chunk['document_id']}:{chunk['chunk_index']}")),
            vector=chunk["embedding"],
            payload={
                "document_id": chunk["document_id"],
                "chunk_index": chunk["chunk_index"],
                "text": chunk["text"],
                "num_tokens": chunk["num_tokens"],
                "filename": chunk.get("filename"),
            },
        )
        for chunk in chunks
    ]

    client.upsert(collection_name=COLLECTION_NAME, wait=True, points=points)
    return len(points)

from qdrant_client.models import Distance, FieldCondition, Filter, MatchValue, PointStruct, VectorParams

def search_similar(
    query_vector: list[float],
    top_k: int = 5,
    document_id: str | None = None,
) -> list[dict]:
    query_filter = None
    if document_id is not None:
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        )

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True,
    )

    return [
        {
            "document_id": hit.payload["document_id"],
            "chunk_index": hit.payload["chunk_index"],
            "text": hit.payload["text"],
            "score": hit.score,
        }
        for hit in response.points
    ]

def rename_document(document_id: str, filename: str) -> bool:
    query_filter = Filter(
        must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
    )

    existing, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=query_filter,
        limit=1,
        with_payload=False,
        with_vectors=False,
    )
    if not existing:
        return False

    client.set_payload(
        collection_name=COLLECTION_NAME,
        payload={"filename": filename},
        points=query_filter,
    )
    return True


def list_documents() -> list[dict]:
    documents: dict[str, dict] = {}
    offset = None

    while True:
        records, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        for record in records:
            doc_id = record.payload["document_id"]
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "filename": record.payload.get("filename"),
                    "num_chunks": 0,
                }
            documents[doc_id]["num_chunks"] += 1

        if offset is None:
            break

    return list(documents.values())