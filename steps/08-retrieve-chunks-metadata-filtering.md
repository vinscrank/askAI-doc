# Step 08 — Retrieval + metadata filtering

⬅️ Precedente: [Step 07 — Endpoint /ask e pipeline RAG](07-ask-endpoint-rag-pipeline.md) · ➡️ Prossimo: [Step 09 — Generare la risposta con l'LLM](09-llm-answer-generation.md)

## 1. Obiettivo dello step

Limitare la ricerca semantica a **un solo documento**: quando l'utente fa una domanda nella schermata "Chat with Document", i chunk recuperati devono appartenere solo a quel `document_id`, non a tutta la collection. Alla fine di questo step, **POST /ask** accetta `document_id` + `question` e restituisce chunk filtrati.

## 2. Concetti da imparare

- **Metadata filtering**: oltre alla similarità vettoriale, Qdrant permette di filtrare i risultati per valori nel `payload` (es. `document_id == "abc-123"`). La ricerca combina geometria (vettori) e metadati (JSON).
- **Perché serve in un'app multi-documento**: senza filtro, una domanda su un documento può restituire chunk di altri file caricati — risposte imprecise o fuori contesto. Il filtro garantisce che il retrieval sia *scoped* al documento scelto.
- **Filter in Qdrant**: si esprime con `Filter(must=[FieldCondition(key="...", match=MatchValue(value="..."))])` e si passa a `query_points` come `query_filter`.
- **Payload indexing**: per filtri efficienti su campi usati spesso, Qdrant può indicizzare il payload — per un portfolio piccolo non è critico, ma è una best practice in produzione.

## 3. Istruzioni pratiche

### 3.1 Aggiorna `search_similar` con filtro opzionale

Modifica `backend/app/services/qdrant_service.py`:

```python
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
```

Se `document_id` è `None`, la ricerca resta globale (comportamento Step 07). Se è valorizzato, Qdrant cerca solo tra i point con quel `document_id` nel payload.

### 3.2 Aggiorna la request di `/ask`

Modifica `backend/app/api/ask.py`:

```python
class AskRequest(BaseModel):
    question: str
    document_id: str


class AskResponse(BaseModel):
    question: str
    document_id: str
    retrieved_chunks: list[dict]


@router.post("", response_model=AskResponse)
def ask(body: AskRequest):
    query_vector = embedding_service.embed_query(body.question)
    chunks = qdrant_service.search_similar(
        query_vector,
        top_k=5,
        document_id=body.document_id,
    )

    return AskResponse(
        question=body.question,
        document_id=body.document_id,
        retrieved_chunks=chunks,
    )
```

Il `document_id` lo ottieni dalla risposta di **POST /documents/upload** (`document_id` nel JSON).

### 3.3 Testa

1. Carica **due documenti .txt diversi** via `/documents/upload` e annota i rispettivi `document_id`.
2. Fai una domanda specifica su uno dei due via **POST /ask**:

```json
{
  "question": "Quali sono i requisiti minimi?",
  "document_id": "IL-TUO-DOCUMENT-ID-QUI"
}
```

3. Ripeti la stessa domanda con l'altro `document_id` e confronta i chunk restituiti.

## 4. Verifica

- Tutti i chunk in `retrieved_chunks` hanno lo stesso `document_id` passato nella request.
- Con un `document_id` inesistente o sbagliato, `retrieved_chunks` è vuoto (nessun errore 500).
- La stessa domanda con `document_id` diversi restituisce chunk di documenti diversi.
- Se hai caricato un solo documento, il filtro restituisce gli stessi chunk rilevanti di prima — ma ora sei sicuro che non "fugano" dati di altri file.

Non proseguire allo step 9 finché il filtro per `document_id` non funziona in modo consistente.

## 5. Cosa hai imparato / CV

Sai spiegare perché un vector database in un'app multi-documento ha bisogno di **metadata filtering** oltre alla similarity search: il vettore trova contenuto semanticamente vicino, il filtro delimita *da quale documento* può venire quel contenuto. È un pattern standard in RAG production-ready.
