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