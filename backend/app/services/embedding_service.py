import os

from openai import OpenAI

EMBEDDING_MODEL = "text-embedding-3-small"

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def embed_chunks(chunks: list[dict]) -> list[dict]:
    texts = [c["text"] for c in chunks]

    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)

    for chunk, item in zip(chunks, response.data):
        chunk["embedding"] = item.embedding

    return chunks

# Embed a query, stringa input, return a list of floats
def embed_query(text: str) -> list[float]:
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=[text])
    return response.data[0].embedding