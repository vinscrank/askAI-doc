from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
import uuid
from qdrant_client.models import PointStruct


QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "askdocs_chunks")

client = QdrantClient(url=QDRANT_URL)

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
            },
        )
        for chunk in chunks
    ]

    client.upsert(collection_name=COLLECTION_NAME, wait=True, points=points)
    return len(points)
