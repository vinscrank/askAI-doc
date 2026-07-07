'use client'

import { use, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, BookOpenIcon, FileTextIcon, Loader2Icon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import { askQuestion, getDocumentFileUrl } from "@/lib/api";
import { getLocalDocument } from "@/lib/localDocuments";
import { ChatMessage as ChatMessageType } from "@/types";
import DocumentPreview from "@/components/DocumentPreview";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import MobileViewTabs from "@/components/chat/MobileViewTabs";

type MobilePanel = "chat" | "document";

function getExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()!.toUpperCase() : "";
}

function PanelShell({
    icon: Icon,
    label,
    children,
    className = "",
}: {
    icon: typeof BookOpenIcon;
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col min-h-0 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden ${className}`}>
            <div className="shrink-0 flex items-center gap-2.5 px-5 py-4 border-b border-slate-800 bg-slate-950/80">
                <div className="size-8 rounded-lg bg-pink-950/60 border border-pink-900/50 flex items-center justify-center">
                    <Icon className="size-4 text-pink-500" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                </span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        </div>
    );
}

export default function DocumentChatPage({ params }: { params: Promise<{ documentId: string }> }) {
    const { documentId } = use(params);
    const decodedId = decodeURIComponent(documentId);

    const [displayName, setDisplayName] = useState(decodedId);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [question, setQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");

    const bottomRef = useRef<HTMLDivElement>(null);
    const extension = getExtension(displayName);

    useEffect(() => {
        const match = getLocalDocument(decodedId);
        if (match?.filename) {
            setDisplayName(match.filename);
        }
    }, [decodedId]);

    useEffect(() => {
        if (mobilePanel === "chat") {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, isAsking, mobilePanel]);

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

    const chatContent = (
        <>
            <div data-lenis-prevent className="chat-messages-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5 sm:gap-6 max-w-3xl mx-auto w-full">
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

            <div className="hidden lg:block shrink-0">
                <ChatComposer
                    value={question}
                    onChange={setQuestion}
                    onSubmit={() => submitQuestion(question)}
                    disabled={isAsking}
                />
            </div>
        </>
    );

    return (
        <div className="flex flex-col h-full min-h-0 gap-4 lg:gap-5">
            <header className="shrink-0 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 sm:px-5 py-4">
                <Link
                    href="/app"
                    className="inline-flex items-center justify-center size-10 rounded-xl border border-slate-800 text-slate-400 hover:text-pink-400 hover:border-pink-900/50 transition shrink-0"
                    aria-label="Back to documents"
                >
                    <ArrowLeftIcon className="size-4" />
                </Link>

                <div className="size-10 rounded-lg bg-pink-950/60 border border-pink-900/60 flex items-center justify-center shrink-0">
                    <FileTextIcon className="size-5 text-pink-500" />
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-semibold truncate text-slate-100" title={displayName}>
                        {displayName}
                    </h1>
                    {extension && (
                        <span className="inline-block mt-1 text-[11px] font-medium tracking-wide text-pink-500 bg-pink-950/50 border border-pink-900/50 rounded px-1.5 py-0.5">
                            {extension}
                        </span>
                    )}
                </div>
            </header>

            <div className="flex flex-1 min-h-0 flex-col lg:grid lg:grid-cols-2 lg:gap-5">
                <PanelShell
                    icon={BookOpenIcon}
                    label="Preview"
                    className={`${mobilePanel === "document" ? "flex" : "hidden"} lg:flex pb-20 lg:pb-0`}
                >
                    <DocumentPreview fileUrl={getDocumentFileUrl(decodedId)} fileName={displayName} />
                </PanelShell>

                <PanelShell
                    icon={MessageSquareIcon}
                    label="Chat"
                    className={`${mobilePanel === "chat" ? "flex" : "hidden"} lg:flex pb-36 lg:pb-0`}
                >
                    {chatContent}
                </PanelShell>
            </div>

            <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-950 border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
                {mobilePanel === "chat" && (
                    <ChatComposer
                        value={question}
                        onChange={setQuestion}
                        onSubmit={() => submitQuestion(question)}
                        disabled={isAsking}
                        className="border-0"
                    />
                )}
                <MobileViewTabs active={mobilePanel} onChange={setMobilePanel} />
            </div>
        </div>
    );
}
