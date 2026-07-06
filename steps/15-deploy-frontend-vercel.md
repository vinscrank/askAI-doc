# Step 15 — Deploy frontend su Vercel

⬅️ Precedente: [Step 14 — Deploy backend su Google Cloud Run](14-deploy-backend-cloud-run.md)

## 1. Obiettivo dello step

Mettere online il frontend Next.js su **Vercel** collegato al backend già deployato su Cloud Run. Alla fine l'app è accessibile pubblicamente e può caricare documenti, fare domande e mostrare le fonti.

**URL produzione (progetto):**
- Frontend: [https://ask-ai-doc.vercel.app](https://ask-ai-doc.vercel.app)
- Backend: `https://askdocs-api-111757801670.europe-west1.run.app`

## 2. Architettura

```
Utente → ask-ai-doc.vercel.app (Next.js)
              │
              └── fetch → askdocs-api-....run.app (FastAPI + Qdrant Cloud)
```

Il frontend legge l'URL del backend da `NEXT_PUBLIC_API_URL`. Il backend deve autorizzare l'origin Vercel via CORS (vedi [Step 14, sezione 9](14-deploy-backend-cloud-run.md#9-cors--collegare-frontend-vercel-al-backend)).

## 3. Prerequisiti

- Backend deployato e funzionante (`GET /health` → ok)
- CORS configurato in `backend/app/main.py` con `https://ask-ai-doc.vercel.app`
- Account [Vercel](https://vercel.com)
- Repo su GitHub (consigliato per deploy automatico)

## 4. Variabile d'ambiente

Il frontend usa `lib/api.ts`:

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
```

### 4.1 Produzione (Vercel)

Vercel → Project → **Settings** → **Environment Variables**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://askdocs-api-111757801670.europe-west1.run.app` |

Applica a **Production**, **Preview** e **Development** se vuoi lo stesso backend ovunque.

### 4.2 Locale

In `front/nextjs/.env.local`:

```
NEXT_PUBLIC_API_URL=https://askdocs-api-111757801670.europe-west1.run.app
```

Per sviluppo con backend locale:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 5. Deploy su Vercel

### 5.1 Primo deploy (da dashboard)

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Seleziona il repo `askDocAI`
3. **Root Directory**: `front/nextjs`
4. Framework Preset: **Next.js** (auto-detect)
5. Aggiungi `NEXT_PUBLIC_API_URL` nelle Environment Variables
6. **Deploy**

### 5.2 Deploy da CLI (alternativa)

```bash
npm i -g vercel
cd front/nextjs
vercel
vercel --prod
```

## 6. Verifica

1. Apri [https://ask-ai-doc.vercel.app](https://ask-ai-doc.vercel.app)
2. Carica un file `.txt`, `.pdf` o `.docx`
3. Fai una domanda sul documento
4. Controlla che compaiano risposta e fonti

Se l'upload fallisce con errore CORS → ridistribuisci il backend con `allow_origins` aggiornato (Step 14).

## 7. Domini e redeploy

- Il dominio `.vercel.app` è automatico; puoi aggiungere un dominio custom in Vercel → Domains
- Se aggiungi un dominio custom, aggiorna anche `allow_origins` nel backend
- Ogni modifica a `NEXT_PUBLIC_API_URL` su Vercel richiede un **Redeploy**

## 8. Cosa hai imparato / CV

Sai deployare un'app full-stack decoupled: frontend statico/SSR su Vercel, backend API su Cloud Run, comunicazione via REST con CORS e env vars — architettura tipica dei progetti AI in produzione.
