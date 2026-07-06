# Step 02 — Qdrant locale con Docker

⬅️ Precedente: [Step 01 — Setup FastAPI](01-setup-backend-fastapi.md) · ➡️ Prossimo: [Step 03 — Upload .txt ed estrazione testo](03-upload-txt-extract-text.md)

## 1. Obiettivo dello step

Far girare Qdrant in locale via Docker e creare la collection che conterrà i vettori dei documenti. Alla fine di questo step devi avere un database vettoriale funzionante su `localhost:6333`, vuoto ma pronto.

## 2. Concetti da imparare

- **Vector database**: database ottimizzato per memorizzare vettori (embeddings) e fare ricerca per similarità, invece che ricerca esatta come un DB relazionale. È il cuore tecnico di ogni sistema RAG.
- **Qdrant**: vector database open-source scritto in Rust. Concetti chiave: una **collection** (equivalente a una tabella), i **points** al suo interno (ogni point ha un `id`, un `vector` e un `payload` cioè metadata arbitrari in JSON).
- **Distanza/similarità**: Qdrant confronta vettori con metriche come **cosine similarity** o **dot product**. Per gli embedding di testo (OpenAI, ecc.) si usa quasi sempre cosine.
- **Perché Docker e non installazione nativa**: isolamento, riproducibilità, e perché in produzione userai comunque un servizio managed (Qdrant Cloud, step 13) — il container locale simula lo stesso comportamento.

## 3. Istruzioni pratiche

### 3.1 Prerequisito

Docker Desktop installato e in esecuzione. Verifica:

```bash
docker --version
docker ps
```

### 3.2 docker-compose.yml

In `backend/docker-compose.yml`:

```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

Avvia:

```bash
cd backend
docker compose up -d
```

### 3.3 Verifica che Qdrant risponda

```bash
curl http://localhost:6333
```

Apri anche la dashboard web integrata: http://localhost:6333/dashboard

### 3.4 Variabili d'ambiente

Crea `backend/.env` (e aggiungilo a `.gitignore` se non l'hai già fatto):

```
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=askdocs_chunks
```

### 3.5 Installa il client Python di Qdrant

```bash
pip install qdrant-client
```

Aggiungi `qdrant-client` a `requirements.txt`.

### 3.6 Crea la collection

Crea `backend/app/services/qdrant_service.py`:

```python
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
```

`vector_size=1536` corrisponde alla dimensione degli embedding di OpenAI `text-embedding-3-small`. Se usi un altro modello di embedding dovrai cambiare questo numero — è un dettaglio importante: la dimensione del vettore della collection deve corrispondere esattamente a quella del modello di embedding che userai.

### 3.7 Richiama `ensure_collection()` all'avvio dell'app

In `backend/app/main.py`, aggiungi:

```python
from app.services.qdrant_service import ensure_collection

@app.on_event("startup")
def startup():
    ensure_collection()
```

Riavvia il server (`uvicorn app.main:app --reload --port 8000`).

## 4. Verifica

- Nella dashboard Qdrant (http://localhost:6333/dashboard) deve comparire la collection `askdocs_chunks` con vector size 1536 e distance Cosine.
- `curl http://localhost:6333/collections/askdocs_chunks` deve restituire i dettagli della collection in JSON.

## 5. Cosa hai imparato / CV

Sai spiegare cos'è un vector database e perché serve rispetto a un database relazionale classico: la ricerca non è per uguaglianza esatta ma per **similarità semantica** tra vettori ad alta dimensionalità. Sai anche che la scelta della dimensione del vettore è vincolata al modello di embedding usato — un dettaglio che dimostra comprensione reale, non solo copia-incolla.
