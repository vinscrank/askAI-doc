# Step 16 — Autenticazione (registrazione + login)

⬅️ Precedente: [Step 15 — Deploy frontend su Vercel](15-deploy-frontend-vercel.md)

## 1. Obiettivo dello step

Aggiungere **registrazione e login** con email + password. Dopo la registrazione l'utente è già loggato e vede **solo i propri documenti**. Nessun OAuth, nessun email verification — il minimo indispensabile per un portfolio con multi-utente reale.

## 2. Architettura

```
Frontend (Next.js)
    │  Authorization: Bearer <JWT>
    ▼
FastAPI
    ├── SQLite (users.db)     → email, password hash, user_id
    └── Qdrant (payload)      → ogni chunk ha user_id + document_id
```

| Dove | Cosa salvi |
|---|---|
| **SQLite** | Utenti (email, password hash) |
| **Qdrant payload** | `user_id` su ogni chunk (per filtrare list/ask) |
| **uploads/** | File (verifica ownership via Qdrant prima di servire) |

Non serve PostgreSQL: per un portfolio **SQLite** basta ed è zero-config.

## 3. Concetti da imparare

- **JWT (JSON Web Token)**: dopo login il backend restituisce un token firmato. Il frontend lo invia in ogni richiesta (`Authorization: Bearer ...`). Il backend legge `user_id` dal token senza sessioni server-side.
- **Password hash**: mai salvare la password in chiaro. Usi `bcrypt` via `passlib`.
- **Dependency injection FastAPI**: `get_current_user` legge il token e restituisce l'utente — lo riusi su tutti gli endpoint protetti.
- **Filtro multi-tenant in Qdrant**: come `document_id`, aggiungi `user_id` nel payload e filtri `list_documents`, `search_similar`, `rename`.

## 4. Backend

### 4.1 Dipendenze

Aggiungi a `requirements.txt`:

```
python-jose[cryptography]
passlib[bcrypt]
```

Installa:

```bash
pip install "python-jose[cryptography]" "passlib[bcrypt]"
```

In `.env`:

```
JWT_SECRET=una-stringa-lunga-random-minimo-32-caratteri
JWT_EXPIRE_MINUTES=10080
```

(`10080` = 7 giorni)

### 4.2 Database utenti — `backend/app/services/user_service.py`

```python
import os
import sqlite3
import uuid
from pathlib import Path

from passlib.context import CryptContext

DB_PATH = Path(__file__).resolve().parent.parent.parent / "users.db"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)


def create_user(email: str, password: str) -> dict:
    user_id = str(uuid.uuid4())
    password_hash = pwd_context.hash(password)
    with sqlite3.connect(DB_PATH) as conn:
        try:
            conn.execute(
                "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
                (user_id, email.lower().strip(), password_hash),
            )
        except sqlite3.IntegrityError:
            raise ValueError("Email already registered")
    return {"id": user_id, "email": email.lower().strip()}


def authenticate_user(email: str, password: str) -> dict | None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            (email.lower().strip(),),
        ).fetchone()
    if row is None or not pwd_context.verify(password, row["password_hash"]):
        return None
    return {"id": row["id"], "email": row["email"]}


def get_user_by_id(user_id: str) -> dict | None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if row is None:
        return None
    return {"id": row["id"], "email": row["email"]}
```

Chiama `init_db()` nel `lifespan` di `main.py` (insieme a `ensure_collection()`).

### 4.3 JWT — `backend/app/services/auth_service.py`

```python
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
```

### 4.4 Dependency — `backend/app/dependencies.py`

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import auth_service, user_service

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    user_id = auth_service.decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = user_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### 4.5 Router auth — `backend/app/api/auth.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services import auth_service, user_service

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    try:
        user = user_service.create_user(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    token = auth_service.create_access_token(user["id"])
    return AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    user = user_service.authenticate_user(body.email, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth_service.create_access_token(user["id"])
    return AuthResponse(access_token=token, user=user)
```

Dopo **register** restituisci già il token → l'utente è loggato senza un secondo step.

### 4.6 Qdrant — aggiungi `user_id`

In `ensure_collection()`:

```python
client.create_payload_index(
    collection_name=COLLECTION_NAME,
    field_name="user_id",
    field_schema=PayloadSchemaType.KEYWORD,
)
```

In `upsert_chunks`, aggiungi `user_id` al payload:

```python
payload={
    "user_id": chunk["user_id"],
    "document_id": chunk["document_id"],
    ...
}
```

`chunk_text` deve ricevere `user_id` — passalo da `documents.py` upload.

`list_documents(user_id: str)` — filtra con scroll + `Filter(must=[FieldCondition(key="user_id", ...)])`.

`search_similar(..., user_id: str, document_id: str)` — filtro con **due** condizioni in `must`: `user_id` e `document_id`.

`document_belongs_to_user(document_id: str, user_id: str) -> bool` — scroll con filtro combinato, ritorna True se esiste almeno un point.

### 4.7 Proteggi gli endpoint

**`documents.py`** — esempio upload:

```python
from app.dependencies import get_current_user
from fastapi import Depends

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ...
    chunks = chunking_service.chunk_text(text, document_id, filename=file.filename, user_id=current_user["id"])
    ...
```

Stesso `Depends(get_current_user)` su: `list_documents`, `get_document_file`, `rename_document`, e `/ask`.

Prima di servire un file o rinominare, chiama `document_belongs_to_user` — se False → `404`.

### 4.8 Registra router in `main.py`

```python
from app.api import ask, auth, documents
from app.services.user_service import init_db

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_collection()
    yield

app.include_router(auth.router)
```

Aggiungi `users.db` al `.gitignore`.

## 5. Frontend

### 5.1 Token — `front/nextjs/lib/auth.ts`

```typescript
const TOKEN_KEY = "askdocs_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
    return !!getToken();
}
```

### 5.2 API con token — aggiorna `lib/api.ts`

```typescript
import { getToken, clearToken } from "./auth";

function authHeaders(): HeadersInit {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
        clearToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Unauthorized");
    }
    ...
}

export async function register(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ access_token: string; user: { id: string; email: string } }>(res);
}

export async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ access_token: string; user: { id: string; email: string } }>(res);
}
```

Aggiungi `...authHeaders()` a **tutte** le fetch di `uploadDocument`, `listDocuments`, `renameDocument`, `askQuestion`.

### 5.3 Pagine `/login` e `/register`

Crea `app/(auth)/login/page.tsx` e `app/(auth)/register/page.tsx` con form semplici (email, password, submit).

Dopo register/login:

```typescript
const res = await register(email, password);
setToken(res.access_token);
router.push("/app");
```

Stile: stesso dark + pink del resto del sito.

### 5.4 Proteggi `/app`

Crea `app/app/layout.tsx` come client wrapper o usa un componente `AuthGuard`:

```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    useEffect(() => {
        if (!isLoggedIn()) router.replace("/login");
    }, [router]);
    if (!isLoggedIn()) return null;
    return <>{children}</>;
}
```

Avvolgi `{children}` in `app/app/layout.tsx` con `<AuthGuard>`.

### 5.5 Navbar

In `AppNavbar`: se loggato mostra email (troncata) + **Log out** (`clearToken()` + redirect `/login`). Se non loggato su landing: link **Sign in**.

### 5.6 Landing upload

L'upload dalla homepage richiede login: al click su upload, redirect a `/register` se non loggato, oppure mostra messaggio "Sign in to upload".

## 6. Verifica

1. **Register** con email nuova → redirect `/app`, token salvato
2. **Upload** documento → visibile in lista
3. **Logout** → `/login`
4. **Secondo utente** (altra email) → lista vuota, non vede i doc del primo
5. **Ask** su proprio documento → funziona
6. **Ask** con `document_id` di un altro utente (da Swagger con token diverso) → chunk vuoti o 404
7. Su Cloud Run: aggiungi `JWT_SECRET` alle env vars; `users.db` su Cloud Run è **effimero** — per produzione servirebbe volume persistente o DB esterno (accettabile per portfolio con nota in README)

## 7. Deploy note

| Env var | Dove |
|---|---|
| `JWT_SECRET` | Cloud Run + `.env` locale |
| `users.db` | Locale ok; Cloud Run si resetta al redeploy |

Per portfolio pubblico: va bene SQLite effimero + nota "demo accounts reset on deploy". Per qualcosa di più stabile: passa a [Turso](https://turso.tech) o PostgreSQL su Neon (free tier) — stesso codice SQL con minori adattamenti.

## 8. Cosa hai imparato / CV

Sai implementare autenticazione JWT end-to-end con isolamento multi-tenant su vector database (filtro `user_id` in Qdrant), senza over-engineering: SQLite per utenti, Bearer token, dependency FastAPI, route protette su Next.js.
