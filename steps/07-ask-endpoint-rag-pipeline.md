# Step 07 — Endpoint /ask e pipeline RAG

⬅️ Precedente: [Step 06 — Salvare i chunk in Qdrant](06-qdrant-upsert.md) · ➡️ Prossimo: [Step 08 — Retrieval + metadata filtering](08-retrieve-chunks-metadata-filtering.md)

## 1. Obiettivo dello step

Creare l'endpoint `/ask` e collegare la prima metà della pipeline **RAG** (Retrieval-Augmented Generation): data una domanda, generi l'embedding della domanda, cerchi in Qdrant i chunk più simili e li restituisci nella risposta. In questo step **non** c'è ancora l'LLM che genera la risposta in linguaggio naturale — quello arriva allo Step 09. Qui verifichi che il **retrieval** funzioni.

## 2. Concetti da imparare

- **RAG in due fasi**: (1) *Retrieval* — trovi i chunk rilevanti nel vector database; (2) *Generation* — un LLM legge quei chunk e risponde. In questo step implementi solo la fase 1.
- **Query embedding**: la domanda dell'utente va embeddata con lo **stesso modello** usato per i chunk (`text-embedding-3-small`). Se usi modelli diversi, i vettori vivono in spazi incomparabili e la ricerca non ha senso.
- **Similarity search**: Qdrant confronta il vettore della domanda con tutti i vettori nella collection e restituisce i *top-k* più vicini (per cosine similarity, già configurata allo Step 02).
- **Score**: ogni risultato ha un punteggio di similarità (più alto = più rilevante). Non è una percentuale assoluta — serve per ordinare e capire quanto un chunk è vicino alla domanda.
- **Perché separare retrieval e generation**: puoi testare e debuggare la ricerca semantica in isolamento, prima di aggiungere la complessità (e il costo) delle chiamate LLM.

## 3. Istruzioni pratiche

### 3.1 Embedding della domanda

Aggiungi in `backend/app/services/embedding_service.py`:

```python
def embed_query(text: str) -> list[float]:
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=[text])
    return response.data[0].embedding
```

Una sola stringa in input, un solo vettore in output — stesso modello, stessa dimensione (1536) dei chunk indicizzati.

### 3.2 Ricerca in Qdrant

Aggiungi in `backend/app/services/qdrant_service.py`:

```python
def search_similar(query_vector: list[float], top_k: int = 5) -> list[dict]:
    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
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

In questo step la ricerca è **globale** su tutta la collection — non filtri ancora per `document_id`. Lo Step 08 aggiunge quel filtro, necessario per la schermata "Chat with Document".

### 3.3 Router `/ask`

Crea `backend/app/api/ask.py`:

```python
from pydantic import BaseModel

from fastapi import APIRouter

from app.services import embedding_service, qdrant_service

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    retrieved_chunks: list[dict]


@router.post("", response_model=AskResponse)
def ask(body: AskRequest):
    query_vector = embedding_service.embed_query(body.question)
    chunks = qdrant_service.search_similar(query_vector, top_k=5)

    return AskResponse(
        question=body.question,
        retrieved_chunks=chunks,
    )
```

### 3.4 Registra il router in main.py

In `backend/app/main.py`:

```python
from app.api import ask, documents

app.include_router(documents.router)
app.include_router(ask.router)
```

### 3.5 Testa

Prerequisito: almeno un documento già caricato e salvato in Qdrant (Step 06 completato).

1. Riavvia FastAPI se necessario.
2. Apri http://localhost:8000/docs.
3. Usa **POST /ask** con un body come:

```json
{
  "question": "Di cosa parla il documento?"
}
```

4. Prova anche una domanda molto specifica su un contenuto che sai essere nel file caricato.

## 4. Verifica

- La risposta contiene `retrieved_chunks` con almeno un elemento (se hai chunk in Qdrant).
- Ogni chunk ha `document_id`, `chunk_index`, `text` e `score`.
- I chunk restituiti contengono testo **semanticamente vicino** alla domanda (non necessariamente le stesse parole).
- Una domanda generica restituisce chunk plausibili; una domanda fuori tema restituisce score più bassi rispetto a una domanda pertinente.
- Se Qdrant è vuoto, `retrieved_chunks` è una lista vuota — segno che devi prima fare un upload (Step 06).

Non proseguire allo step 8 finché il retrieval non restituisce chunk sensati su un documento che hai caricato.

## 5. Cosa hai imparato / CV

Sai descrivere la pipeline RAG e cosa fa concretamente la fase di retrieval: embeddare la domanda, cercare per similarità nel vector database, recuperare il contesto rilevante. Sai anche perché query e documenti devono usare lo stesso modello di embedding — un vincolo architetturale reale, non un dettaglio implementativo.
