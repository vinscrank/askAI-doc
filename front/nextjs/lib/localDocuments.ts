import { DocumentItem } from "@/types";

const STORAGE_KEY = "askdocs_documents";

function readDocuments(): DocumentItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeDocuments(documents: DocumentItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getLocalDocuments(): DocumentItem[] {
    return readDocuments();
}

export function addLocalDocument(doc: DocumentItem): void {
    const documents = readDocuments();
    if (documents.some((item) => item.document_id === doc.document_id)) return;
    writeDocuments([doc, ...documents]);
}

export function updateLocalDocumentFilename(documentId: string, filename: string): void {
    const documents = readDocuments().map((doc) =>
        doc.document_id === documentId ? { ...doc, filename } : doc
    );
    writeDocuments(documents);
}

export function getLocalDocument(documentId: string): DocumentItem | undefined {
    return readDocuments().find((doc) => doc.document_id === documentId);
}
