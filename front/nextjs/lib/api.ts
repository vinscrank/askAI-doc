import { AskResponse, DocumentItem, UploadResponse } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getDocumentFileUrl(documentId: string): string {
    return `${API_URL}/documents/${encodeURIComponent(documentId)}/file`;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed with status ${res.status}`);
    }
    return res.json();
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        body: formData,
    });

    return handleResponse<UploadResponse>(res);
}

export async function listDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_URL}/documents`, { cache: "no-store" });
    return handleResponse<DocumentItem[]>(res);
}

export async function renameDocument(documentId: string, filename: string): Promise<void> {
    const res = await fetch(`${API_URL}/documents/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
    });

    await handleResponse<{ document_id: string; filename: string }>(res);
}

export async function askQuestion(documentId: string, question: string): Promise<AskResponse> {
    const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question }),
    });

    return handleResponse<AskResponse>(res);
}
