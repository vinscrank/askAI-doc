import { AskResponse, DocumentItem, UploadResponse } from "@/types";
import { addLocalDocument, getLocalDocuments, updateLocalDocumentFilename } from "@/lib/localDocuments";

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

    const data = await handleResponse<UploadResponse>(res);
    addLocalDocument({
        document_id: data.document_id,
        filename: data.filename,
        num_chunks: data.num_chunks,
    });
    return data;
}

export function listDocuments(): DocumentItem[] {
    return getLocalDocuments();
}

export async function renameDocument(documentId: string, filename: string): Promise<void> {
    const res = await fetch(`${API_URL}/documents/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
    });

    await handleResponse<{ document_id: string; filename: string }>(res);
    updateLocalDocumentFilename(documentId, filename);
}

export async function askQuestion(documentId: string, question: string): Promise<AskResponse> {
    const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question }),
    });

    return handleResponse<AskResponse>(res);
}
