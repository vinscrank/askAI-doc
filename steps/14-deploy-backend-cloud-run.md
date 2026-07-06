# Step 14 — Deploy backend su Google Cloud Run + Qdrant Cloud

⬅️ Precedente: [Step 10 — Sources / Chunks Used](10-sources-panel.md) · ➡️ Prossimo: [Step 15 — Deploy frontend su Vercel](15-deploy-frontend-vercel.md)

## 1. Obiettivo dello step

Mettere online il backend FastAPI su **Google Cloud Run** collegato a un database vettoriale **Qdrant Cloud**. Alla fine avrai un URL pubblico con `/health`, `/documents` e `/ask` funzionanti.

**URL produzione (progetto):**
- Backend: `https://askdocs-api-111757801670.europe-west1.run.app`
- Frontend: `https://ask-ai-doc.vercel.app`

## 2. Architettura deploy

```
Browser → https://ask-ai-doc.vercel.app (Frontend Vercel)
        │
        ▼
https://askdocs-api-111757801670.europe-west1.run.app (Cloud Run)
        │
        ├──► Qdrant Cloud (vector DB)
        └──► OpenAI API (embeddings + chat)
```

| Componente | Dove gira | Perché |
|---|---|---|
| **FastAPI** | Google Cloud Run | Serverless, scala automaticamente, pay-per-use |
| **Qdrant** | Qdrant Cloud | Il vector DB non va su Cloud Run (serve storage persistente) |
| **OpenAI** | API esterna | Già usata in locale, stessa chiave in produzione |
| **uploads/** | Disco Cloud Run | **Effimero** — i file spariscono al riavvio del container (limite MVP) |

In locale usavi Docker per Qdrant (`localhost:6333`). In produzione Qdrant è un servizio separato raggiungibile via HTTPS + API key.

## 3. Concetti da imparare

- **Cloud Run**: esegue container Docker su GCP senza gestire server. Paghi per richieste e tempo CPU.
- **Qdrant Cloud vs Docker locale**: in locale Qdrant non ha autenticazione; in cloud ogni richiesta richiede `QDRANT_API_KEY`.
- **Variabili d'ambiente**: su Cloud Run non esiste il file `.env` nel container — le variabili le inietti al deploy (`--env-vars-file` o Secret Manager).
- **Secret Manager**: alternativa sicura per API key (non passarle in chiaro nel terminale se puoi evitarlo).
- **CORS**: il browser blocca le richieste cross-origin se il backend non autorizza l'origin del frontend. Aggiungi l'URL Vercel in `allow_origins` in `main.py` (senza slash finale).

## 4. Prerequisiti

- Backend RAG completo (step 1–10)
- Account [Google Cloud](https://console.cloud.google.com) con billing attivo
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installato
- Account [Qdrant Cloud](https://cloud.qdrant.io)
- `Dockerfile` in `backend/` (già presente)
- `QdrantClient` con `api_key` in `qdrant_service.py` (già presente)

## 5. Parte A — Qdrant Cloud

### 5.1 Crea il cluster

1. Vai su [https://cloud.qdrant.io](https://cloud.qdrant.io)
2. Crea un cluster (free tier disponibile)
3. Scegli una regione vicina (es. `europe-west3`)

### 5.2 Recupera credenziali

Dalla dashboard del cluster annota:

| Variabile | Esempio | Dove trovarla |
|---|---|---|
| `QDRANT_URL` | `https://xxx-xxx.gcp.cloud.qdrant.io` | Cluster URL |
| `QDRANT_API_KEY` | `eyJhbG...` | API Keys / Access |

### 5.3 Verifica connessione (opzionale, da locale)

```bash
curl -H "api-key: LA-TUA-QDRANT-API-KEY" \
  "https://TUO-CLUSTER.gcp.cloud.qdrant.io/collections"
```

Deve rispondere con JSON (lista collection, anche vuota).

## 6. Parte B — Prepara il backend

### 6.1 Dockerfile

Già presente in `backend/Dockerfile`. Deve includere la cartella `uploads/` (Cloud Run non la crea da solo):

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p uploads

ENV PORT=8080
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

In alternativa (o in aggiunta), `document_service.py` crea la cartella all'avvio con `os.makedirs(UPLOAD_DIR, exist_ok=True)`.

Cloud Run imposta `PORT=8080` automaticamente.

### 6.2 Client Qdrant con API key

In `backend/app/services/qdrant_service.py`:

```python
client = QdrantClient(
    url=QDRANT_URL,
    api_key=os.getenv("QDRANT_API_KEY"),
)

```

In locale con Docker, `QDRANT_API_KEY` può restare vuota. In cloud è obbligatoria.

### 6.3 Env locali vs produzione

Tieni due file separati (entrambi **mai committati**):

**`backend/.env.local`** (sviluppo, Docker Qdrant):

```
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=askdocs_chunks
OPENAI_API_KEY=sk-...
```

**`backend/env.yaml`** (deploy Cloud Run):

```yaml
QDRANT_URL: "https://TUO-CLUSTER.gcp.cloud.qdrant.io"
QDRANT_API_KEY: "eyJhbG..."
QDRANT_COLLECTION: "askdocs_chunks"
OPENAI_API_KEY: "sk-..."
```

Aggiungi a `.gitignore`:

```
backend/env.yaml
backend/.env.local
```

## 7. Parte C — Deploy su Google Cloud Run

### 7.1 Setup gcloud (una volta)

```bash
gcloud auth login
gcloud config set project IL-TUO-PROJECT-ID

gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

### 7.2 Deploy con env file (consigliato)

```bash
cd backend

gcloud run deploy askdocs-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml
```

`--source .` fa build del Dockerfile via Cloud Build e deploy automatico.

### 7.3 Deploy con variabili inline (alternativa)

Tutte le variabili devono stare **su una sola riga**, senza a capo dentro le virgolette:

```bash
gcloud run deploy askdocs-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "QDRANT_URL=https://xxx.gcp.cloud.qdrant.io,QDRANT_API_KEY=eyJ...,QDRANT_COLLECTION=askdocs_chunks,OPENAI_API_KEY=sk-..."
```

Errori comuni:
- a capo nel mezzo della stringa → deploy fallisce o tronca i valori
- virgoletta curva `"` invece di `"` → errore di parsing shell

### 7.4 Deploy con Secret Manager (produzione)

```bash
echo -n "sk-..." | gcloud secrets create openai-api-key --data-file=-
echo -n "eyJ..." | gcloud secrets create qdrant-api-key --data-file=-

gcloud run deploy askdocs-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "QDRANT_URL=https://xxx.gcp.cloud.qdrant.io,QDRANT_COLLECTION=askdocs_chunks" \
  --set-secrets "OPENAI_API_KEY=openai-api-key:latest,QDRANT_API_KEY=qdrant-api-key:latest"
```

## 8. Verifica

### 8.1 Health check

Al termine del deploy, gcloud stampa l'URL del servizio:

```bash
curl https://askdocs-api-111757801670.europe-west1.run.app/health
```

Risposta attesa: `{"status":"ok"}`

### 8.2 Swagger

Apri nel browser:

```
https://askdocs-api-111757801670.europe-west1.run.app/docs
```

### 8.3 Test pipeline completa

1. **POST /documents/upload** — carica un `.txt`
2. **GET /documents** — verifica che compaia il `document_id`
3. **POST /ask** — domanda con quel `document_id`

Se `/health` ok ma `/ask` fallisce, controlla le env vars su Cloud Run:

```bash
gcloud run services describe askdocs-api --region europe-west1 --format="yaml(spec.template.spec.containers[0].env)"
```

### 8.4 Verifica Qdrant Cloud

Dopo un upload, nella dashboard Qdrant Cloud la collection `askdocs_chunks` deve avere `points_count > 0`.

## 9. CORS — collegare frontend Vercel al backend

Il frontend su Vercel chiama il backend su Cloud Run da un dominio diverso. Senza CORS il browser blocca upload e `/ask`.

### 9.1 Backend — `backend/app/main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ask-ai-doc.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Regole:
- L'origin è **solo il dominio del frontend**, non l'URL del backend
- **Niente slash finale**: `https://ask-ai-doc.vercel.app` (non `.../`)
- Dopo ogni modifica CORS serve un **redeploy** del backend

```bash
cd backend
gcloud run deploy askdocs-api --source . --region europe-west1
```

### 9.2 Frontend — variabile su Vercel

In Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://askdocs-api-111757801670.europe-west1.run.app
```

In locale, stesso valore in `front/nextjs/.env.local`:

```
NEXT_PUBLIC_API_URL=https://askdocs-api-111757801670.europe-west1.run.app
```

Dopo aver aggiunto o cambiato la variabile su Vercel, fai **Redeploy**.

### 9.3 Verifica CORS

1. Apri [https://ask-ai-doc.vercel.app](https://ask-ai-doc.vercel.app)
2. Carica un documento
3. Se vedi errore CORS in DevTools → controlla che l'origin nel messaggio di errore sia in `allow_origins` e che il backend sia stato ridistribuito

## 10. Limitazioni MVP da conoscere

- **uploads/ effimero**: i file caricati su Cloud Run non persistono tra riavvii. Dopo un redeploy devi ricaricare i documenti (i chunk in Qdrant Cloud invece restano).
- **Cold start**: la prima richiesta dopo inattività può essere lenta (~2–5 sec).
- **Costi**: Cloud Run free tier generoso; Qdrant Cloud free tier limitato; OpenAI a consumo per ogni upload e domanda.
- **Regione**: allinea Cloud Run (`europe-west1`) e Qdrant Cloud (es. `europe-west3`) per latenza accettabile.

## 11. Comandi utili

```bash
# Logs in tempo reale
gcloud run services logs tail askdocs-api --region europe-west1

# Aggiorna solo env vars (senza rebuild)
gcloud run services update askdocs-api \
  --region europe-west1 \
  --env-vars-file env.yaml

# Elimina il servizio
gcloud run services delete askdocs-api --region europe-west1
```

## 12. Cosa hai imparato / CV

Sai deployare un backend RAG su infrastruttura cloud: API containerizzata su Cloud Run, vector database managed (Qdrant Cloud), configurazione via env vars/Secret Manager, e i trade-off di un MVP senza object storage per gli upload.
