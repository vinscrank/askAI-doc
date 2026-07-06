from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ask, documents
from app.services.qdrant_service import ensure_collection


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_collection()
    yield


app = FastAPI(title="AskDocs AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ask-ai-doc.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(ask.router)


@app.get("/health")
def health():
    return {"status": "ok"}