# Step 03 — Upload .txt ed estrazione testo

⬅️ Precedente: [Step 02 — Qdrant locale con Docker](02-qdrant-docker.md) · ➡️ Prossimo: [Step 04 — Chunking del testo](04-chunking.md)

## 1. Obiettivo dello step

Creare un endpoint che riceve un file `.txt` via upload, lo salva su disco in `uploads/` e ne estrae il testo. Alla fine di questo step devi poter caricare un file `.txt` da Swagger UI (o curl) e ricevere indietro il testo estratto — nessun embedding, nessun Qdrant ancora: solo l'ingresso della pipeline RAG.

## 2. Concetti da imparare

- **multipart/form-data**: il formato HTTP standard per l'upload di file. FastAPI lo gestisce tramite `UploadFile`, che espone il file come stream senza caricarlo tutto in RAM in un colpo solo (utile per file grandi).
- **Document ID**: ogni documento caricato deve avere un identificatore univoco (userai `uuid4`) che lo accompagnerà in tutta la pipeline — è la chiave con cui più avanti (step 06) collegherai i chunk in Qdrant al documento originale.
- **Separazione tra storage e estrazione**: salvare il file grezzo (`uploads/`) è un passo diverso dall'estrarre il testo. Per `.txt` l'estrazione è banale (leggi il file), ma tenerle separate ti prepara allo step 12 (PDF), dove l'estrazione richiederà una libreria dedicata mentre lo storage resterà identico.
- **Router FastAPI (`APIRouter`)**: invece di scrivere tutte le route in `main.py`, FastAPI permette di raggrupparle in router modulari (uno per dominio, es. `documents`) e includerli nell'app principale con `app.include_router(...)`. È il pattern che userai per ogni nuova famiglia di endpoint (documents, ask, ecc.).

## 3. Istruzioni pratiche

### 3.1 Service di gestione documenti

Crea `backend/app/services/document_service.py`:

```python
import os
import uuid

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
ALLOWED_EXTENSIONS = {".txt"}


def save_upload_file(file: UploadFile) -> tuple[str, str]:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato: {ext}. Al momento è supportato solo .txt.",
        )

    document_id = str(uuid.uuid4())
    stored_path = os.path.join(UPLOAD_DIR, f"{document_id}{ext}")

    with open(stored_path, "wb") as f:
        f.write(file.file.read())

    return document_id, stored_path


def extract_text(stored_path: str) -> str:
    with open(stored_path, "r", encoding="utf-8") as f:
        return f.read()
```

`UPLOAD_DIR` è calcolato in modo relativo al file (`os.path.dirname(__file__)`), così funziona indipendentemente dalla cartella da cui lanci `uvicorn`. La validazione dell'estensione tiene fuori tutto ciò che non è `.txt` per ora — il PDF arriverà allo step 12.

### 3.2 Endpoint di upload

Crea `backend/app/api/documents.py`:

```python
from fastapi import APIRouter, File, UploadFile

from app.services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    document_id, stored_path = document_service.save_upload_file(file)
    text = document_service.extract_text(stored_path)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "num_characters": len(text),
        "preview": text[:200],
    }
```

Nota lo stile di import: `from app.services import document_service` e poi `document_service.save_upload_file(...)`, invece di importare le singole funzioni. Tenere il nome del modulo come prefisso rende subito chiaro, leggendo il router, da dove viene ogni funzione — utile quando i service cresceranno (è lo stesso pattern che userai per `qa_service`, `embedding_service`, ecc. nei prossimi step).

### 3.3 Collegare il router all'app

In `backend/app/main.py`, aggiungi l'import e la registrazione del router:

```python
from app.api import documents

app.include_router(documents.router)
```

Aggiungilo accanto alla route `/health` già esistente, dopo che `app = FastAPI(...)` è stato creato.

### 3.4 Avvia e testa

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Vai su http://localhost:8000/docs, apri `POST /documents/upload`, carica un file `.txt` di prova e osserva la risposta.

In alternativa via curl:

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@/percorso/a/un/file.txt"
```

## 4. Verifica

- Caricando un `.txt` ricevi un JSON con `document_id`, `filename`, `num_characters` e `preview` coerenti col contenuto del file.
- Nella cartella `backend/uploads/` compare un nuovo file chiamato `{document_id}.txt`.
- Caricando un file con estensione diversa da `.txt` (es. `.pdf`) ricevi un errore `400` con un messaggio chiaro, non un `500` generico o un crash del server.

Non proseguire allo step 4 finché entrambe le verifiche non funzionano.

## 5. Cosa hai imparato / CV

Sai spiegare come funziona l'upload di file via HTTP (`multipart/form-data`) in un'API REST, e perché è buona pratica separare lo storage del file grezzo dall'estrazione del testo — una scelta architetturale che rende il sistema estendibile a nuovi formati (PDF, DOCX, ecc.) senza toccare la logica di storage. Sai anche perché ogni documento ha bisogno di un identificatore univoco stabile lungo tutta la pipeline RAG.
