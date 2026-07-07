"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BotIcon, ChevronDownIcon, UserIcon } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types";

type ChatMessageProps = {
    message: ChatMessageType;
    index: number;
};

export default function ChatMessage({ message, index }: ChatMessageProps) {
    const [sourcesOpen, setSourcesOpen] = useState(false);
    const isUser = message.role === "user";

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            <div
                className={`size-8 sm:size-9 shrink-0 rounded-xl flex items-center justify-center ${
                    isUser
                        ? "bg-pink-600/20 text-pink-400 border border-pink-800/40"
                        : "bg-slate-800 text-slate-300 border border-slate-700/60"
                }`}
            >
                {isUser ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
            </div>

            <div className={`flex flex-col min-w-0 max-w-[min(100%,42rem)] ${isUser ? "items-end" : "items-start"}`}>
                <span className="text-[11px] font-medium text-slate-500 mb-1.5 px-0.5">
                    {isUser ? "You" : "AskDocs AI"}
                </span>

                <div
                    className={`rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 w-full ${
                        isUser
                            ? "bg-pink-600 text-white rounded-tr-md"
                            : "bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-md shadow-sm shadow-black/20"
                    }`}
                >
                    <p
                        className={`whitespace-pre-wrap break-words ${
                            isUser
                                ? "text-[15px] sm:text-base leading-relaxed"
                                : "chat-answer text-[15px] sm:text-[16px] leading-[1.75] sm:leading-[1.8] text-slate-100"
                        }`}
                    >
                        {message.content}
                    </p>
                </div>

                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="w-full mt-2">
                        <button
                            type="button"
                            onClick={() => setSourcesOpen((v) => !v)}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-pink-400 transition px-1 py-1.5"
                        >
                            <ChevronDownIcon
                                className={`size-3.5 transition-transform duration-200 ${
                                    sourcesOpen ? "rotate-180" : ""
                                }`}
                            />
                            {message.sources.length} cited source{message.sources.length > 1 ? "s" : ""}
                        </button>

                        <AnimatePresence initial={false}>
                            {sourcesOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-1 pb-1 flex flex-col gap-2">
                                        {message.sources.map((source, i) => (
                                            <div
                                                key={`${index}-${source.chunk_index}`}
                                                className="rounded-xl border border-slate-800/80 bg-black/30 px-3.5 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-pink-400/90">
                                                        Passage {i + 1}
                                                    </span>
                                                    <span className="text-[10px] tabular-nums text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                                                        {(source.score * 100).toFixed(0)}% match
                                                    </span>
                                                </div>
                                                <p className="text-[13px] leading-relaxed text-slate-400">
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
            </div>
        </motion.article>
    );
}
