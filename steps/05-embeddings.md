# Step 05 — Generare embeddings

⬅️ Precedente: [Step 04 — Chunking del testo](04-chunking.md) · ➡️ Prossimo: [Step 06 — Salvare i chunk in Qdrant](06-qdrant-upsert.md)

## 1. Obiettivo dello step

Trasformare ogni chunk di testo (Step 04) in un **embedding**: un vettore numerico che rappresenta il significato del testo. Alla fine di questo step, dato un documento, ottieni per ogni chunk un vettore a 1536 dimensioni pronto per essere salvato in Qdrant — che è esattamente ciò che farai allo Step 06.

## 2. Concetti da imparare

- **Cos'è un embedding**: un vettore (una lista di numeri) prodotto da un modello, tale che testi con significato simile producano vettori "vicini" nello spazio geometrico. È il meccanismo che rende possibile la ricerca semantica: non cerchi parole esatte, cerchi vicinanza di significato.
- **Perché 1536 dimensioni**: la dimensione del vettore dipende dal modello di embedding scelto ed è fissa per quel modello. `qdrant_service.py` ha già `vector_size: int = 1536` di default (vedi `ensure_collection`) perché è la dimensione prodotta da `text-embedding-3-small` di OpenAI, che userai in questo step — la collection e il modello devono sempre essere coerenti tra loro.
- **Batching delle richieste**: l'API di embedding di OpenAI accetta una lista di testi in un'unica chiamata (`input=[testo1, testo2, ...]`) e restituisce i vettori nello stesso ordine. Fare una chiamata sola per tutti i chunk di un documento, invece di una chiamata per chunk, riduce drasticamente la latenza totale e il numero di richieste HTTP.
- **Costo e chiavi API**: ogni chiamata di embedding consuma quota a pagamento sull'account OpenAI (anche se `text-embedding-3-small` è tra i modelli più economici). La chiave API non va mai scritta nel codice: resta in `.env`, che è già escluso da git (vedi `.gitignore`).

## 3. Istruzioni pratiche

### 3.1 Libreria e chiave API

Installa l'SDK ufficiale OpenAI:

```bash
pip install openai
```

Aggiungi `openai` a `requirements.txt`.

Aggiungi la tua chiave API in `backend/.env` (il file non viene mai committato):

```
OPENAI_API_KEY=sk-...
```

### 3.2 Service di embedding

Crea `backend/app/services/embedding_service.py`:

```python
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
```

`embed_chunks` prende la lista di chunk prodotta da `chunking_service.chunk_text` e ci aggiunge, in place, la chiave `"embedding"` su ciascuno — così ogni chunk arriva allo Step 06 già completo di `document_id`, `chunk_index`, `text` e `embedding`.

### 3.3 Collegare l'endpoint

Aggiorna `backend/app/api/documents.py`:

```python
from app.services import chunking_service, document_service, embedding_service

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    document_id, stored_path = document_service.save_upload_file(file)
    text = document_service.extract_text(stored_path)
    chunks = chunking_service.chunk_text(text, document_id)
    chunks = embedding_service.embed_chunks(chunks)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "num_characters": len(text),
        "num_chunks": len(chunks),
        "embedding_dimension": len(chunks[0]["embedding"]) if chunks else 0,
        "first_embedding_preview": chunks[0]["embedding"][:5] if chunks else [],
    }
```

Nota che la risposta non include mai il vettore intero (1536 numeri sarebbero illeggibili) — solo la dimensione e i primi 5 valori, per verificare a occhio che qualcosa di sensato sia stato calcolato.

### 3.4 Testa

Riavvia il server (se non è già in `--reload`) e ricarica un file `.txt` da http://localhost:8000/docs, come negli step precedenti.

## 4. Verifica

- La risposta contiene `embedding_dimension: 1536`.
- `first_embedding_preview` è una lista di 5 numeri decimali (positivi e negativi, tipicamente piccoli, es. tra -0.1 e 0.1) — non zeri, non lo stesso valore ripetuto.
- Caricando lo stesso file due volte, i valori di `first_embedding_preview` sono identici (il modello è deterministico per lo stesso input) — se invece caricando due file con contenuti molto diversi ottieni vettori "diversi", è un buon segno che l'embedding sta effettivamente catturando il contenuto.

Non proseguire allo step 6 finché non vedi `embedding_dimension: 1536` in modo consistente.

## 5. Cosa hai imparato / CV

Sai spiegare cos'è un embedding e perché è il ponte tra "testo" e "ricerca semantica": un modello converte il significato in geometria, e la vicinanza tra vettori diventa una proxy della somiglianza di significato. Sai anche perché la dimensione del vettore è un vincolo che lega insieme modello di embedding e configurazione del vector database — non sono scelte indipendenti.
