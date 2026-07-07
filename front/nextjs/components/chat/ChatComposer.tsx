"use client";

import { FormEvent, KeyboardEvent, useRef } from "react";
import { Loader2Icon, SendIcon } from "lucide-react";

type ChatComposerProps = {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    placeholder?: string;
};

export default function ChatComposer({
    value,
    onChange,
    onSubmit,
    disabled = false,
    placeholder = "Ask a question about this document...",
}: ChatComposerProps) {
    const inputRef = useRef<HTMLTextAreaElement>(null);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!value.trim() || disabled) return;
        onSubmit();
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!value.trim() || disabled) return;
            onSubmit();
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-4"
        >
            <div className="flex items-end gap-2 sm:gap-3 max-w-3xl mx-auto w-full">
                <div className="flex-1 rounded-2xl border border-slate-700/80 bg-slate-900/80 focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/15 transition-shadow">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="chat-composer-input w-full resize-none bg-transparent px-4 py-3.5 text-[15px] sm:text-base leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
                    />
                </div>
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    aria-label="Send message"
                    className="size-11 sm:size-12 shrink-0 flex items-center justify-center rounded-2xl bg-pink-600 text-white hover:bg-pink-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-pink-600 disabled:active:scale-100 transition-all shadow-lg shadow-pink-950/40"
                >
                    {disabled ? (
                        <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                        <SendIcon className="size-5" />
                    )}
                </button>
            </div>
            <p className="hidden sm:block text-center text-[11px] text-slate-600 mt-2">
                Press Enter to send · Shift+Enter for a new line
            </p>
        </form>
    );
}
