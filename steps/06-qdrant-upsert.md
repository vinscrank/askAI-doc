# Step 06 — Salvare i chunk in Qdrant

⬅️ Precedente: [Step 05 — Generare embeddings](05-embeddings.md) · ➡️ Prossimo: [Step 07 — Endpoint /ask e pipeline RAG](07-ask-endpoint-rag-pipeline.md)

## 1. Obiettivo dello step

Salvare ogni chunk con il suo embedding nella collection Qdrant creata allo Step 02. Alla fine di questo step, caricare un documento via `/documents/upload` significa: estrarre testo, spezzarlo in chunk, generare gli embedding e **persistere tutto in Qdrant** — pronto per la ricerca semantica allo Step 07.

## 2. Concetti da imparare

- **Point in Qdrant**: ogni record salvato è un *point* con tre parti: un `id` univoco, un `vector` (l'embedding) e un `payload` (metadata JSON arbitrari — nel tuo caso `document_id`, `chunk_index`, `text`, `num_tokens`).
- **Upsert**: operazione che inserisce nuovi point o aggiorna quelli esistenti se l'`id` coincide. È l'operazione standard di scrittura in Qdrant (equivalente concettuale a un "insert or update").
- **Perché il payload conta**: il vettore serve per la ricerca per similarità; il payload serve per recuperare il testo originale e filtrare per `document_id` quando farai domande su un singolo documento (Step 08).
- **ID deterministico**: usare un id derivato da `document_id + chunk_index` (es. con `uuid.uuid5`) permette di ricaricare lo stesso documento senza duplicare i point — l'upsert sovrascrive invece di moltiplicare.

## 3. Istruzioni pratiche

### 3.1 Funzione `upsert_chunks` in qdrant_service

Aggiungi in `backend/app/services/qdrant_service.py`:

```python
import uuid

from qdrant_client.models import PointStruct

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
```

Ogni chunk che esce da `embedding_service.embed_chunks` ha già tutto ciò che serve: `document_id`, `chunk_index`, `text`, `num_tokens` e `embedding`.

### 3.2 Collegare l'endpoint

Aggiorna `backend/app/api/documents.py`:

```python
from app.services import chunking_service, document_service, embedding_service, qdrant_service

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
```

### 3.3 Testa

Assicurati che Qdrant sia attivo (`docker compose up -d` da `backend/`) e riavvia FastAPI se necessario. Carica un file `.txt` da http://localhost:8000/docs.

## 4. Verifica

- La risposta dell'upload contiene `num_stored_in_qdrant` uguale a `num_chunks`.
- Nella dashboard Qdrant (http://localhost:6333/dashboard) la collection `askdocs_chunks` mostra point count > 0 dopo l'upload.
- `curl http://localhost:6333/collections/askdocs_chunks` → il campo `points_count` aumenta dopo ogni upload.
- Cliccando su un point nella dashboard, vedi nel payload `document_id`, `chunk_index`, `text` e `num_tokens`.

Non proseguire allo step 7 finché non vedi i point in Qdrant con payload corretto.

## 5. Cosa hai imparato / CV

Sai spiegare la differenza tra vettore e payload in un vector database: il vettore abilita la ricerca semantica, il payload conserva i dati leggibili e i filtri. Sai anche perché l'upsert con id deterministico è preferibile a insert ciechi quando re-indicizzi documenti.
