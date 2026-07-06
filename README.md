# AskDocs AI — Percorso di apprendimento guidato

Questo repository contiene il piano di progetto (`AskDocs_AI_Project_Document_GoogleCloud (1).pdf`) e una serie di guide passo-passo in `steps/` per costruire **AskDocs AI**, un RAG Document Assistant, imparando bene lungo il percorso i concetti chiave da poter mettere nel CV: **RAG, embeddings, Qdrant, LlamaIndex, FastAPI, Next.js**.

## Obiettivo

Non stai costruendo un SaaS. Stai costruendo un progetto portfolio piccolo (4 schermate) per **capire davvero** come funziona una pipeline RAG end-to-end, dal file caricato alla risposta con fonti citate. Ogni file in `steps/` è pensato per essere eseguito **in ordine**, uno alla volta: non passare allo step successivo finché non hai capito e verificato quello attuale.

## Come usare queste guide

Ogni file di step ha la stessa struttura:

1. **Obiettivo dello step** — cosa costruisci
2. **Concetti da imparare** — la teoria minima indispensabile, spiegata in modo semplice
3. **Istruzioni pratiche** — comandi e codice da scrivere, nell'ordine
4. **Verifica** — come controllare che funzioni davvero prima di andare avanti
5. **Cosa hai imparato / CV** — la frase o il concetto che ora puoi dire di conoscere

Se uno step non funziona, non saltarlo: il progetto è volutamente sequenziale, ogni step dipende dal precedente.

## Percorso (ordine di esecuzione)

### Fase 1 — Backend RAG (il cuore del progetto)
- [ ] [Step 01 — Setup FastAPI](steps/01-setup-backend-fastapi.md)
- [ ] [Step 02 — Qdrant locale con Docker](steps/02-qdrant-docker.md)
- [ ] [Step 03 — Upload .txt ed estrazione testo](steps/03-upload-txt-extract-text.md)
- [ ] [Step 04 — Chunking del testo](steps/04-chunking.md)
- [ ] [Step 05 — Generare embeddings](steps/05-embeddings.md)
- [ ] [Step 06 — Salvare i chunk in Qdrant](steps/06-save-qdrant.md)
- [ ] [Step 07 — Endpoint /ask e pipeline RAG](steps/07-ask-endpoint-rag-pipeline.md)
- [ ] [Step 08 — Retrieval + metadata filtering](steps/08-retrieve-chunks-metadata-filtering.md)
- [ ] [Step 09 — Generare la risposta con l'LLM](steps/09-llm-answer-generation.md)
- [ ] [Step 10 — Sources / Chunks Used](steps/10-sources-panel.md)

### Fase 2 — Frontend
- [ ] [Step 11 — UI Next.js (4 schermate)](steps/11-nextjs-frontend.md)

### Fase 3 — Estensioni
- [ ] [Step 12 — Supporto PDF](steps/12-pdf-support.md)

### Fase 4 — Deploy
- [ ] [Step 13 — Deploy Qdrant Cloud](steps/13-deploy-qdrant-cloud.md)
- [ ] [Step 14 — Deploy backend su Google Cloud Run](steps/14-deploy-backend-cloud-run.md)
- [ ] [Step 15 — Deploy frontend su Vercel](steps/15-deploy-frontend-vercel.md)

## Stack tecnico (riepilogo)

| Area | Tecnologie |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, LlamaIndex |
| AI / Vector Search | OpenAI API o Claude API, embeddings, Qdrant |
| Storage | File locale in `/uploads`, metadata dentro il payload di Qdrant |

**Deliberatamente escluso** in questa versione: PostgreSQL, Supabase, S3, autenticazione, billing, ruoli utente. Il progetto resta focalizzato su RAG e Qdrant.

## Le 4 schermate finali

1. **Upload Document** — carica un documento e avvia l'ingestion
2. **Documents List** — elenco documenti caricati, ricostruito leggendo i payload da Qdrant
3. **Chat with Document** — fai domande su un documento specifico
4. **Sources / Chunks Used** — mostra i chunk realmente usati per generare la risposta

## Cosa scrivere nel CV a fine progetto

**Versione breve:**
> Built AskDocs AI, a lightweight RAG document assistant using Next.js, FastAPI, LlamaIndex and Qdrant. Implemented document ingestion, embeddings generation, semantic retrieval and AI answers with cited sources.

**Versione tecnica:**
> Designed and implemented a full-stack RAG pipeline with Python/FastAPI, Qdrant vector database and LlamaIndex. Built document upload, chunking, vector indexing, metadata filtering, semantic search and context-aware answer generation.

**Versione LinkedIn:**
> I built AskDocs AI to explore RAG workflows and vector databases. The app allows users to upload documents, ask questions and receive AI-generated answers grounded in retrieved sources using FastAPI, Qdrant and LlamaIndex.

## Riferimenti ufficiali

- Qdrant Pricing: https://qdrant.tech/pricing/
- Qdrant Cloud cluster creation: https://qdrant.tech/documentation/cloud/create-cluster/
