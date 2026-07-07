'use client'

import { use, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, BookOpenIcon, Loader2Icon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { askQuestion, getDocumentFileUrl, listDocuments } from "@/lib/api";
import { ChatMessage as ChatMessageType } from "@/types";
import DocumentPreview from "@/components/DocumentPreview";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatEmptyState from "@/components/chat/ChatEmptyState";

type MobilePanel = "chat" | "document";

export default function DocumentChatPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params);
    const decodedId = decodeURIComponent(documentId);

    const [displayName, setDisplayName] = useState(decodedId);
    const [hasFilename, setHasFilename] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listDocuments()
            .then((docs) => {
                const match = docs.find((d) => d.document_id === decodedId);
                if (match?.filename) {
                    setDisplayName(match.filename);
                    setHasFilename(true);
                }
            })
            .catch(() => {});
    }, [decodedId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isAsking]);

    async function submitQuestion(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isAsking) return;

        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
        setQuestion("");
        setIsAsking(true);
        setError(null);
        setMobilePanel("chat");

        try {
            const res = await askQuestion(decodedId, trimmed);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: res.answer, sources: res.sources },
            ]);
        } catch {
            setError("Could not get an answer. Please try again.");
        } finally {
            setIsAsking(false);
        }
    }

    return (
        <>
            <header className="shrink-0 flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-900/80">
                <Link
                    href="/app"
                    className="inline-flex items-center justify-center size-9 rounded-xl border border-slate-800 text-slate-400 hover:text-pink-400 hover:border-pink-900/50 transition shrink-0"
                    aria-label="Back to documents"
                >
                    <ArrowLeftIcon className="size-4" />
                </Link>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-slate-600 font-medium mb-0.5">
                        Document chat
                    </p>
                    <h1 className="text-base sm:text-lg font-semibold truncate text-slate-100" title={displayName}>
                        {displayName}
                    </h1>
                </div>

                {hasFilename && (
                    <div className="lg:hidden flex rounded-xl border border-slate-800 p-1 shrink-0 bg-slate-950/80">
                        <button
                            type="button"
                            onClick={() => setMobilePanel("chat")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                                mobilePanel === "chat"
                                    ? "bg-pink-600 text-white shadow-sm"
                                    : "text-slate-400"
                            }`}
                        >
                            <MessageSquareIcon className="size-3.5" />
                            Chat
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobilePanel("document")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                                mobilePanel === "document"
                                    ? "bg-pink-600 text-white shadow-sm"
                                    : "text-slate-400"
                            }`}
                        >
                            <BookOpenIcon className="size-3.5" />
                            Doc
                        </button>
                    </div>
                )}
            </header>

            <div className="flex flex-1 min-h-0 gap-0 lg:gap-5 pt-3 sm:pt-4">
                {hasFilename && (
                    <aside
                        className={`${
                            mobilePanel === "document" ? "flex" : "hidden"
                        } lg:flex flex-col min-h-0 w-full lg:w-[38%] xl:w-[40%] shrink-0`}
                    >
                        <div className="flex items-center gap-2 mb-2 px-0.5 shrink-0">
                            <BookOpenIcon className="size-3.5 text-slate-600" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                Preview
                            </span>
                        </div>
                        <div
                            className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950"
                            data-lenis-prevent
                        >
                            <DocumentPreview fileUrl={getDocumentFileUrl(decodedId)} fileName={displayName} />
                        </div>
                    </aside>
                )}

                <section
                    className={`${
                        mobilePanel === "chat" ? "flex" : "hidden"
                    } lg:flex flex-col flex-1 min-h-0 min-w-0 rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden`}
                >
                    <div
                        ref={scrollRef}
                        data-lenis-prevent
                        className="chat-messages-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                    >
                        <div className="px-3 sm:px-5 py-4 sm:py-5 flex flex-col gap-5 sm:gap-6 max-w-3xl mx-auto w-full">
                            {messages.length === 0 && !isAsking && (
                                <ChatEmptyState onSelect={submitQuestion} />
                            )}

                            {messages.map((msg, index) => (
                                <ChatMessage key={index} message={msg} index={index} />
                            ))}

                            {isAsking && (
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="size-8 sm:size-9 shrink-0 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                                        <Loader2Icon className="size-4 text-pink-500 animate-spin" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-[11px] font-medium text-slate-500 mb-1">AskDocs AI</span>
                                        <p className="text-sm text-slate-500">Reading your document...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-pink-400 bg-pink-950/30 border border-pink-900/40 rounded-xl px-4 py-3">
                                    {error}
                                </p>
                            )}

                            <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
                        </div>
                    </div>

                    <ChatComposer
                        value={question}
                        onChange={setQuestion}
                        onSubmit={() => submitQuestion(question)}
                        disabled={isAsking}
                    />
                </section>
            </div>
        </>
    );
}
