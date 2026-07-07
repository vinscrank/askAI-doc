'use client'
import { use, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeftIcon,
    BookOpenIcon,
    ChevronDownIcon,
    Loader2Icon,
    MessageSquareIcon,
    SendIcon,
    SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { askQuestion, getDocumentFileUrl, listDocuments } from "@/lib/api";
import { ChatMessage } from "@/types";
import DocumentPreview from "@/components/DocumentPreview";

const SUGGESTED_QUESTIONS = [
    "What is this document about?",
    "Summarize the key points",
    "What are the main takeaways?",
];

type MobilePanel = "chat" | "document";

export default function DocumentChatPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params);
    const decodedId = decodeURIComponent(documentId);

    const [displayName, setDisplayName] = useState(decodedId);
    const [hasFilename, setHasFilename] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");
    const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
            inputRef.current?.focus();
        }
    }

    function handleAsk(e: React.FormEvent) {
        e.preventDefault();
        submitQuestion(question);
    }

    function toggleSources(index: number) {
        setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }));
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-7rem)] max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
                <div className="min-w-0 flex-1">
                    <Link
                        href="/app"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-pink-500 transition mb-2"
                    >
                        <ArrowLeftIcon className="size-3.5" />
                        All documents
                    </Link>
                    <h1 className="text-lg md:text-xl font-semibold truncate" title={displayName}>
                        {displayName}
                    </h1>
                </div>

                {hasFilename && (
                    <div className="lg:hidden flex rounded-lg border border-slate-800 p-0.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setMobilePanel("chat")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                mobilePanel === "chat"
                                    ? "bg-pink-600 text-white"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <MessageSquareIcon className="size-3.5" />
                            Chat
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobilePanel("document")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                                mobilePanel === "document"
                                    ? "bg-pink-600 text-white"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <BookOpenIcon className="size-3.5" />
                            Document
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-1 min-h-0 gap-5">
                {hasFilename && (
                    <div
                        className={`${
                            mobilePanel === "document" ? "flex" : "hidden"
                        } lg:flex flex-col min-h-0 lg:w-[42%] xl:w-[45%] shrink-0`}
                    >
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <BookOpenIcon className="size-3.5 text-slate-500" />
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                Preview
                            </span>
                        </div>
                        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                            <DocumentPreview fileUrl={getDocumentFileUrl(decodedId)} fileName={displayName} />
                        </div>
                    </div>
                )}

                <div
                    className={`${
                        mobilePanel === "chat" ? "flex" : "hidden"
                    } lg:flex flex-col flex-1 min-h-0 min-w-0`}
                >
                    <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50">
                        <div className="p-4 md:p-5 flex flex-col gap-4">
                            {messages.length === 0 && !isAsking && (
                                <div className="flex flex-col items-center justify-center text-center py-10 md:py-16 px-4">
                                    <div className="size-12 rounded-2xl bg-pink-950/60 border border-pink-900/50 flex items-center justify-center mb-5">
                                        <SparklesIcon className="size-5 text-pink-500" />
                                    </div>
                                    <h2 className="text-lg font-medium mb-2">Ask anything about this document</h2>
                                    <p className="text-sm text-slate-500 max-w-sm mb-8">
                                        Answers are grounded in the document content, with cited sources.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 w-full max-w-md">
                                        {SUGGESTED_QUESTIONS.map((q) => (
                                            <button
                                                key={q}
                                                type="button"
                                                onClick={() => submitQuestion(q)}
                                                className="text-sm px-4 py-2 rounded-full border border-slate-700 text-slate-300 hover:border-pink-700 hover:text-pink-400 hover:bg-pink-950/30 transition"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                                >
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600 px-1">
                                        {msg.role === "user" ? "You" : "AI"}
                                    </span>
                                    <div
                                        className={`rounded-2xl px-4 py-3 max-w-[90%] md:max-w-[85%] ${
                                            msg.role === "user"
                                                ? "bg-pink-600 text-white rounded-br-md"
                                                : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-md"
                                        }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="w-full max-w-[90%] md:max-w-[85%] mt-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleSources(index)}
                                                className="flex items-center gap-2 text-xs text-slate-500 hover:text-pink-500 transition px-1 py-1"
                                            >
                                                <ChevronDownIcon
                                                    className={`size-3.5 transition-transform ${
                                                        expandedSources[index] ? "rotate-180" : ""
                                                    }`}
                                                />
                                                {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""} cited
                                            </button>
                                            <AnimatePresence>
                                                {expandedSources[index] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-2 flex flex-col gap-2">
                                                            {msg.sources.map((source, i) => (
                                                                <div
                                                                    key={source.chunk_index}
                                                                    className="rounded-lg border border-slate-800 bg-black/40 p-3"
                                                                >
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="text-[11px] font-medium text-pink-500">
                                                                            Passage {i + 1}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-600 tabular-nums">
                                                                            {(source.score * 100).toFixed(0)}% match
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                                                                        {source.text_preview}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {isAsking && (
                                <div className="flex items-start gap-3">
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600 px-1 pt-3">
                                        AI
                                    </span>
                                    <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-slate-900 border border-slate-800 px-4 py-3">
                                        <Loader2Icon className="size-4 text-pink-500 animate-spin" />
                                        <span className="text-sm text-slate-400">Searching the document...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {error && (
                        <p className="mt-3 text-sm text-pink-400 bg-pink-950/30 border border-pink-900/50 rounded-lg px-4 py-2.5 shrink-0">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleAsk} className="mt-3 flex items-center gap-2 shrink-0">
                        <div className="flex-1 flex items-center rounded-xl border border-slate-700 bg-slate-950 focus-within:border-pink-600 focus-within:ring-1 focus-within:ring-pink-600/30 transition">
                            <input
                                ref={inputRef}
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask a question about this document..."
                                disabled={isAsking}
                                className="w-full px-4 py-3 text-sm outline-none bg-transparent placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAsking || !question.trim()}
                            aria-label="Send question"
                            className="size-11 shrink-0 flex items-center justify-center bg-pink-600 hover:bg-pink-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-pink-600 disabled:active:scale-100 transition-all rounded-xl"
                        >
                            <SendIcon className="size-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
