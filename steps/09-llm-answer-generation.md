# Step 09 — Generare la risposta con l'LLM

⬅️ Precedente: [Step 08 — Retrieval + metadata filtering](08-retrieve-chunks-metadata-filtering.md) · ➡️ Prossimo: [Step 10 — Sources / Chunks Used](10-sources-panel.md)

## 1. Obiettivo dello step

Completare la pipeline **RAG** aggiungendo la fase di **generation**: i chunk recuperati (Step 08) diventano il *contesto* passato a un LLM, che genera una risposta in linguaggio naturale alla domanda dell'utente. Alla fine di questo step, **POST /ask** restituisce un campo `answer` oltre ai chunk recuperati.

## 2. Concetti da imparare

- **Augmented Generation**: l'LLM non risponde dalla memoria generale — legge i chunk recuperati e risponde **basandosi su quel contesto**. È il "G" di RAG.
- **Prompt con contesto**: concateni i testi dei chunk in un blocco "Context" e chiedi all'LLM di rispondere alla "Question". La qualità della risposta dipende sia dal retrieval (chunk giusti) sia da come strutturi il prompt.
- **System prompt**: istruzioni fisse che definiscono il comportamento — es. "rispondi solo usando il contesto fornito", "se non sai, dillo". Riduce le allucinazioni.
- **Allucinazioni**: l'LLM può inventare informazioni non presenti nei chunk. Un system prompt restrittivo e chunk rilevanti mitigano il problema (non lo eliminano del tutto).
- **Stesso provider, due API**: usi già OpenAI per gli embedding (`embeddings.create`); qui usi `chat.completions.create` per la generazione. Stessa chiave API in `.env`, modelli diversi.

## 3. Istruzioni pratiche

### 3.1 Service LLM

Crea `backend/app/services/llm_service.py`:

```python
import os

from openai import OpenAI

CHAT_MODEL = "gpt-4o-mini"

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a document assistant. Answer the user's question using ONLY the context provided below.
If the context does not contain enough information to answer, say you cannot find the answer in the document.
Do not use outside knowledge. Be concise and accurate."""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for chunk in chunks:
        parts.append(f"[Chunk {chunk['chunk_index']}]\n{chunk['text']}")
    return "\n\n".join(parts)


def generate_answer(question: str, chunks: list[dict]) -> str:
    if not chunks:
        return "Non ho trovato informazioni rilevanti nel documento per rispondere a questa domanda."

    context = _build_context(chunks)

    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content or ""
```

`gpt-4o-mini` è economico e adatto a un portfolio. `temperature=0.2` rende le risposte più stabili e fedeli al contesto.

### 3.2 Aggiorna `/ask`

Modifica `backend/app/api/ask.py`:

```python
from app.services import embedding_service, llm_service, qdrant_service

class AskResponse(BaseModel):
    question: str
    document_id: str
    answer: str
    retrieved_chunks: list[dict]


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
        retrieved_chunks=chunks,
    )
```

### 3.3 Testa

1. Assicurati che `OPENAI_API_KEY` in `.env` abbia accesso anche ai modelli chat (stesso account dello Step 05).
2. Riavvia FastAPI.
3. Da http://localhost:8000/docs, usa **POST /ask**:

```json
{
  "question": "Quali sono i requisiti minimi per questo ruolo?",
  "document_id": "IL-TUO-DOCUMENT-ID-QUI"
}
```

4. Prova anche una domanda la cui risposta **non** è nel documento — l'LLM dovrebbe ammettere di non sapere.

## 4. Verifica

- La risposta contiene un campo `answer` con testo leggibile in linguaggio naturale.
- `answer` risponde alla domanda usando informazioni presenti nei chunk (non inventate a caso).
- Con `document_id` valido e domanda pertinente, `answer` cita o riflette contenuti del documento caricato.
- Con domanda fuori dal documento (es. "Qual è la capitale della Francia?" su un job posting), `answer` indica che non trova l'informazione nel documento.
- `retrieved_chunks` è ancora presente — servirà allo Step 10 per mostrare le fonti.

Non proseguire allo step 10 finché non ottieni risposte coerenti e grounded sul documento.

## 5. Cosa hai imparato / CV

Sai descrivere la pipeline RAG completa end-to-end: ingestion → chunking → embedding → vector store → retrieval con filtro → **answer generation** con LLM. Sai anche spiegare il ruolo del system prompt e del context window nel limitare le allucinazioni — concetti che emergono in ogni colloquio su RAG.
