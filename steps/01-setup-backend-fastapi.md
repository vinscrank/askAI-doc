# Step 01 — Setup del backend FastAPI

⬅️ Precedente: nessuno (è il primo step) · ➡️ Prossimo: [Step 02 — Qdrant locale con Docker](02-qdrant-docker.md)

## 1. Obiettivo dello step

Creare lo scheletro del backend Python con FastAPI: struttura cartelle, ambiente virtuale, dipendenze, e un primo endpoint di health-check che risponde. Niente RAG ancora — solo le fondamenta su cui costruirai tutto il resto.

## 2. Concetti da imparare

- **FastAPI**: framework Python per costruire API REST, basato su type hints e Pydantic. È diventato lo standard de-facto per i backend AI in Python (lo trovi ovunque: OpenAI cookbook, LangChain, LlamaIndex demo).
- **Pydantic**: libreria di validazione dati basata su classi Python tipizzate. FastAPI la usa per validare automaticamente request/response.
- **Uvicorn**: server ASGI che esegue effettivamente l'app FastAPI (FastAPI definisce le route, Uvicorn le serve).
- **Ambiente virtuale (venv)**: isola le dipendenze Python del progetto da quelle di sistema — pratica standard, sempre da usare.
- Perché FastAPI e non Flask/Django? Perché genera automaticamente documentazione OpenAPI/Swagger, ha supporto nativo async (utile perché le chiamate a Qdrant e agli LLM sono I/O-bound), ed è quello che usano davvero i progetti AI in produzione.

## 3. Istruzioni pratiche

### 3.1 Struttura cartelle

Nella root del progetto (`askDocAI/`), crea:

```
backend/
  app/
    main.py
    api/
    services/
    utils/
    config.py
  uploads/
  requirements.txt
  Dockerfile
  docker-compose.yml
```

Comandi:

```bash
cd /Users/vincenzo/Desktop/websites/askDocAI
mkdir -p backend/app/api backend/app/services backend/app/utils backend/uploads
touch backend/app/main.py backend/app/config.py
touch backend/app/api/__init__.py backend/app/services/__init__.py backend/app/utils/__init__.py backend/app/__init__.py
```

### 3.2 Ambiente virtuale e dipendenze

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

Crea `requirements.txt` con almeno:

```
fastapi
uvicorn[standard]
python-multipart
python-dotenv
```

Installa:

```bash
pip install -r requirements.txt
```

`python-multipart` serve già da ora: ti servirà a breve per l'upload dei file (`multipart/form-data`).

### 3.3 Primo main.py

In `backend/app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="AskDocs AI")

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 3.4 Avvia il server

```bash
uvicorn app.main:app --reload --port 8000
```

`--reload` riavvia automaticamente il server quando modifichi il codice — utile in sviluppo, da rimuovere in produzione.

## 4. Verifica

- Apri http://localhost:8000/health nel browser o con `curl http://localhost:8000/health` → deve rispondere `{"status":"ok"}`.
- Apri http://localhost:8000/docs → deve mostrarti la Swagger UI generata automaticamente da FastAPI. Questo è uno dei motivi per cui FastAPI è utile: documentazione API gratis.

Non proseguire allo step 2 finché entrambe le verifiche non funzionano.

## 5. Cosa hai imparato / CV

Sai spiegare la differenza tra un web server (Uvicorn) e un framework applicativo (FastAPI), e perché la generazione automatica di documentazione OpenAPI è un vantaggio pratico quando costruisci API consumate da un frontend separato (Next.js in questo caso — architettura decoupled frontend/backend).
