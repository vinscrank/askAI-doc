# Step 10 — Sources / Chunks Used

⬅️ Precedente: [Step 09 — Generare la risposta con l'LLM](09-llm-answer-generation.md) · ➡️ Prossimo: [Step 11 — UI Next.js (4 schermate)](11-nextjs-frontend.md)

## 1. Obiettivo dello step

Chiudere il backend RAG rendendo la risposta di **POST /ask** pronta per il frontend: oltre a `answer`, restituisci un array `sources` strutturato con i chunk usati (indice, estratto del testo, score). Aggiungi anche **GET /documents** per elencare i documenti indicizzati in Qdrant — serve alla schermata "Documents List" dello Step 11.

## 2. Concetti da imparare

- **Citabilità (grounding)**: in un'app RAG seria l'utente deve poter verificare *da dove* viene la risposta. Esporre i chunk recuperati come `sources` è il contratto API per la schermata "Sources / Chunks Used".
- **Response contract**: il frontend non dovrebbe parsare strutture interne grezze (`retrieved_chunks` con tutto il testo). Meglio un modello Pydantic esplicito (`SourceItem`) con solo i campi necessari alla UI.
- **Text preview**: in UI non mostri 400 token per chunk — un estratto (es. primi 200 caratteri) basta per capire quale passaggio è stato usato.
- **Lista documenti da Qdrant**: non hai un DB relazionale — l'elenco documenti si ricostruisce aggregando i payload già salvati (`document_id` + conteggio chunk). Pattern comune in MVP RAG senza PostgreSQL.

## 3. Istruzioni pratiche

### 3.1 Modello `SourceItem` e formattazione

In `backend/app/api/ask.py`, definisci un modello dedicato alle fonti:

```python
class SourceItem(BaseModel):
    chunk_index: int
    text_preview: str
    score: float


def _format_sources(chunks: list[dict], preview_length: int = 200) -> list[SourceItem]:
    return [
        SourceItem(
            chunk_index=chunk["chunk_index"],
            text_preview=chunk["text"][:preview_length],
            score=chunk["score"],
        )
        for chunk in chunks
    ]
```

### 3.2 Aggiorna la risposta di `/ask`

Sostituisci `retrieved_chunks` con `sources`:

```python
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
```

Il LLM continua a ricevere i chunk completi (in `llm_service`); `sources` espone solo ciò che serve alla UI.

### 3.3 Lista documenti da Qdrant

Aggiungi in `backend/app/services/qdrant_service.py`:

```python
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
                    "num_chunks": 0,
                }
            documents[doc_id]["num_chunks"] += 1

        if offset is None:
            break

    return list(documents.values())
```

### 3.4 Endpoint GET /documents

In `backend/app/api/documents.py`:

```python
@router.get("")
def list_documents():
    return qdrant_service.list_documents()
```

La route completa sarà **GET /documents** (il router ha già `prefix="/documents"`).

### 3.5 Testa

1. **POST /ask** — verifica che la risposta abbia `answer` + `sources` (non più `retrieved_chunks`).
2. **GET /documents** — deve restituire i `document_id` caricati con `num_chunks` per ciascuno.
3. Carica due file diversi e controlla che GET /documents mostri entrambi.

## 4. Verifica

- `sources` è un array; ogni elemento ha `chunk_index`, `text_preview` e `score`.
- `text_preview` è troncato (max ~200 caratteri) ma leggibile.
- Gli score sono in ordine decrescente (il chunk più rilevante per primo).
- **GET /documents** restituisce tutti i `document_id` presenti in Qdrant con il conteggio chunk corretto.
- Dopo un nuovo upload, GET /documents include il nuovo documento senza riavviare il server.

A questo punto il **backend RAG è completo**. Puoi passare allo Step 11 (frontend).

## 5. Cosa hai imparato / CV

Sai progettare un contratto API RAG che separa risposta (`answer`) da evidenze (`sources`) — requisito fondamentale per trust e debug in produzione. Sai anche ricostruire metadati applicativi (lista documenti) da un vector database senza un DB relazionale, aggregando i payload dei point.
