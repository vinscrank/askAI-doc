from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os

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