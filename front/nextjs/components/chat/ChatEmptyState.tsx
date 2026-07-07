"use client";

import { SparklesIcon } from "lucide-react";

const SUGGESTIONS = [
    "What is this document about?",
    "Summarize the key points",
    "What are the main takeaways?",
];

type ChatEmptyStateProps = {
    onSelect: (question: string) => void;
};

export default function ChatEmptyState({ onSelect }: ChatEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 min-h-[min(100%,28rem)]">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-pink-600/20 to-pink-950/40 border border-pink-800/40 flex items-center justify-center mb-6 shadow-lg shadow-pink-950/20">
                <SparklesIcon className="size-6 text-pink-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2 tracking-tight">
                Ask your document anything
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-500 max-w-md mb-8 leading-relaxed">
                Get clear answers grounded in your file, with the exact passages cited.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((q) => (
                    <button
                        key={q}
                        type="button"
                        onClick={() => onSelect(q)}
                        className="text-left sm:text-center text-sm px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 hover:border-pink-700/60 hover:bg-pink-950/20 hover:text-pink-300 transition-colors"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}
