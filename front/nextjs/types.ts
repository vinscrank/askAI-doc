export interface DocumentItem {
    document_id: string;
    filename?: string | null;
    num_chunks: number;
}

export interface UploadResponse {
    document_id: string;
    filename: string;
    num_characters: number;
    num_chunks: number;
    num_stored_in_qdrant: number;
    embedding_dimension: number;
}

export interface SourceItem {
    chunk_index: number;
    text_preview: string;
    score: number;
}

export interface AskResponse {
    question: string;
    document_id: string;
    answer: string;
    sources: SourceItem[];
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    sources?: SourceItem[];
}
