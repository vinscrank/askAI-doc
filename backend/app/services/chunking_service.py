import tiktoken

ENCODING = tiktoken.get_encoding("cl100k_base")

CHUNK_SIZE_TOKENS = 400
CHUNK_OVERLAP_TOKENS = 60


def chunk_text(
    text: str,
    document_id: str,
    chunk_size: int = CHUNK_SIZE_TOKENS,
    overlap: int = CHUNK_OVERLAP_TOKENS,
) -> list[dict]:
    tokens = ENCODING.encode(text)

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_value = ENCODING.decode(chunk_tokens)

        chunks.append({
            "document_id": document_id,
            "chunk_index": chunk_index,
            "text": chunk_text_value,
            "num_tokens": len(chunk_tokens),
        })

        if end == len(tokens):
            break

        start += chunk_size - overlap
        chunk_index += 1

    return chunks