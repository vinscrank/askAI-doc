'use client'
import { useEffect, useState, use } from "react";
import { motion } from "motion/react";
import { ArrowLeftIcon, Loader2Icon, SendIcon } from "lucide-react";
import Link from "next/link";
import { askQuestion, getDocumentFileUrl, listDocuments } from "@/lib/api";
import { ChatMessage } from "@/types";
import DocumentPreview from "@/components/DocumentPreview";

export default function DocumentChatPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params);
    const decodedId = decodeURIComponent(documentId);

    const [displayName, setDisplayName] = useState(decodedId);
    const [hasFilename, setHasFilename] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        listDocuments().then((docs) => {
            const match = docs.find((d) => d.document_id === decodedId);
            if (match?.filename) {
                setDisplayName(match.filename);
                setHasFilename(true);
            }
        }).catch(() => {});
    }, [decodedId]);

    async function handleAsk(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = question.trim();
        if (!trimmed || isAsking) return;

        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
        setQuestion("");
        setIsAsking(true);
        setError(null);

        try {
            const res = await askQuestion(decodedId, trimmed);
            setMessages((prev) => [...prev, { role: "assistant", content: res.answer, sources: res.sources }]);
        } catch {
            setError("Non sono riuscito a ottenere una risposta. Riprova.");
        } finally {
            setIsAsking(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-pink-500 transition mb-6">
                <ArrowLeftIcon className="size-4" />
                Tutti i documenti
            </Link>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                <p className="font-medium text-pink-600 px-4 py-1.5 rounded-full bg-pink-950/70 border border-pink-800 w-max">
                    In conversazione con
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold mt-4 truncate" title={displayName}>{displayName}</h1>
            </motion.div>

            <div className="mt-10 grid lg:grid-cols-2 gap-8 items-start">
                {hasFilename && (
                    <div className="hidden lg:block h-[calc(100vh-14rem)] sticky top-28">
                        <DocumentPreview fileUrl={getDocumentFileUrl(decodedId)} fileName={displayName} />
                    </div>
                )}

                <div className="flex flex-col">
                    <div className="flex flex-col gap-6">
                        {messages.length === 0 && (
                            <p className="text-slate-500">Chiedimi qualsiasi cosa su questo documento: rispondo solo in base al suo contenuto.</p>
                        )}

                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                                className={`rounded-xl p-5 border ${msg.role === "user" ? "border-pink-800 bg-pink-950/20 ml-auto" : "border-slate-800 bg-slate-950"} max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Trovato in questo documento</p>
                                        <div className="flex flex-col gap-2">
                                            {msg.sources.map((source, i) => (
                                                <div key={source.chunk_index} className="rounded-lg border border-slate-800 bg-black/30 p-3">
                                                    <p className="text-xs text-pink-500 mb-1.5">Passaggio {i + 1}</p>
                                                    <p className="text-sm text-slate-300">&ldquo;{source.text_preview}…&rdquo;</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {isAsking && (
                            <div className="flex items-center gap-2 text-slate-500">
                                <Loader2Icon className="size-4 animate-spin" />
                                Sto leggendo il documento...
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="mt-4 text-sm text-pink-500 bg-pink-950/30 border border-pink-900 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleAsk} className="mt-10 flex items-center gap-3">
                        <div className="flex-1 flex items-center pl-4 rounded-full border border-slate-700 bg-black focus-within:border-pink-500 transition">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Es. qual è il punto principale del documento?"
                                disabled={isAsking}
                                className="w-full p-3 outline-none bg-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isAsking || !question.trim()}
                            className="size-12 shrink-0 flex items-center justify-center bg-pink-600 hover:bg-pink-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all rounded-full"
                        >
                            <SendIcon className="size-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
