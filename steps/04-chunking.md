# Step 04 — Chunking del testo

⬅️ Precedente: [Step 03 — Upload .txt ed estrazione testo](03-upload-txt-extract-text.md) · ➡️ Prossimo: [Step 05 — Generare embeddings](05-embeddings.md)

## 1. Obiettivo dello step

Spezzare il testo estratto in Step 03 in **chunk** più piccoli, con un minimo di overlap tra un chunk e l'altro. Alla fine di questo step, dato il testo di un documento, ottieni una lista ordinata di chunk pronti per essere trasformati in embedding — nessuna chiamata a Qdrant o a un LLM ancora.

## 2. Concetti da imparare

- **Perché il chunking esiste**: un LLM per embedding e per generazione ha un limite di contesto, e la retrieval funziona meglio quando ogni vettore rappresenta un'unità di significato piccola e coerente (un paragrafo, non un intero libro). Se indicizzi un documento intero come un solo vettore, la ricerca semantica perde precisione — non riesci a distinguere quale parte del documento è rilevante per la domanda.
- **Dimensione del chunk**: si misura in genere in **token**, non in caratteri, perché è in token che ragionano sia il modello di embedding che l'LLM. Una dimensione comune per RAG è 300-500 token per chunk.
- **Overlap tra chunk**: senza overlap, una frase a cavallo tra due chunk rischia di perdere contesto (metà frase in un chunk, metà nell'altro). Un overlap del 10-20% del chunk size mitiga il problema, al costo di un po' di ridondanza nell'indice.
- **Chunking naive vs semantico**: qui userai uno split a dimensione fissa con overlap (semplice, prevedibile, usato ovunque come baseline). Esistono strategie più sofisticate (split per paragrafi/frasi con `sentence-transformers` o `RecursiveCharacterTextSplitter` di LangChain), ma capire prima la versione semplice ti fa apprezzare perché servono quelle più avanzate.
- **Metadata del chunk**: ogni chunk deve portare con sé `document_id`, un `chunk_index` (la sua posizione nel documento) e il testo stesso — è quello che salverai come `payload` in Qdrant allo step 06, e che ti permetterà allo step 10 di mostrare "quali chunk sono stati usati" per rispondere.

## 3. Istruzioni pratiche

### 3.1 Libreria per contare i token

Installa `tiktoken`, il tokenizer di OpenAI (serve per contare i token in modo coerente con il modello di embedding che userai allo step 05):

```bash
pip install tiktoken
```

Aggiungi `tiktoken` a `requirements.txt`.

### 3.2 Service di chunking

Crea `backend/app/services/chunking_service.py`:

```python
import tiktoken

ENCODING = tiktoken.get_encoding("cl100k_base")

CHUNK_SIZE_TOKENS = 400
CHUNK_OVERLAP_TOKENS = 60


def chunk_text(
    text: str,
    document_id: str,
    chunk_size: int = CHUNK_SIZE_TOKENS,
    overlap: int = CHUNK_OVERLAP_TOKENS,
) -> list[dict]:
    tokens = ENCODING.encode(text)

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_value = ENCODING.decode(chunk_tokens)

        chunks.append({
            "document_id": document_id,
            "chunk_index": chunk_index,
            "text": chunk_text_value,
            "num_tokens": len(chunk_tokens),
        })

        if end == len(tokens):
            break

        start += chunk_size - overlap
        chunk_index += 1

    return chunks
```

`cl100k_base` è l'encoding usato dai modelli OpenAI `text-embedding-3-*` e dalla famiglia GPT-4 — coerente con quello che userai allo step 05. Nota il calcolo di `start`: avanza di `chunk_size - overlap` a ogni iterazione, così l'ultima parte di un chunk si ritrova anche all'inizio del successivo.

### 3.3 Endpoint di prova (temporaneo)

Per verificare il chunking senza aspettare gli step successivi, aggiungi un endpoint di debug in `backend/app/api/documents.py`:

```python
from app.services import chunking_service

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    document_id, stored_path = document_service.save_upload_file(file)
    text = document_service.extract_text(stored_path)
    chunks = chunking_service.chunk_text(text, document_id)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "num_characters": len(text),
        "num_chunks": len(chunks),
        "chunks_preview": [c["text"][:100] for c in chunks],
    }
```

Sostituisce il corpo esistente di `upload_document`: ora, oltre a estrarre il testo, lo spezza subito in chunk e ne mostra un'anteprima. Dallo step 05 in poi userai `chunks` per generare gli embedding, non per la risposta dell'endpoint.

### 3.4 Testa con un file lungo

Usa un `.txt` abbastanza lungo (almeno 1500-2000 parole) per vedere più di un chunk nella risposta. Carica il file da http://localhost:8000/docs come nello step 03.

## 4. Verifica

- Con un file breve (poche righe) ottieni `num_chunks: 1`.
- Con un file lungo ottieni più chunk, e il campo `num_tokens` di ciascuno è vicino a 400 (tranne probabilmente l'ultimo, più corto).
- Stampando (anche solo in un test locale, con `print`) la fine di un chunk e l'inizio del successivo, riconosci a occhio le stesse parole ripetute nell'overlap.

Non proseguire allo step 5 finché non vedi chunk multipli con overlap coerente su un documento lungo.

## 5. Cosa hai imparato / CV

Sai spiegare perché il chunking è necessario in una pipeline RAG e non è un dettaglio implementativo trascurabile: la dimensione e l'overlap dei chunk influenzano direttamente la qualità del retrieval. Sai anche che i modelli di linguaggio ragionano in token (non caratteri o parole), e perché la scelta dell'encoding di tokenizzazione deve essere coerente con il modello di embedding usato più avanti.
