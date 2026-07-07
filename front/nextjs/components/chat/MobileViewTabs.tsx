"use client";

import { BookOpenIcon, MessageSquareIcon } from "lucide-react";

type MobileViewTabsProps = {
    active: "chat" | "document";
    onChange: (panel: "chat" | "document") => void;
};

export default function MobileViewTabs({ active, onChange }: MobileViewTabsProps) {
    return (
        <div className="lg:hidden shrink-0 px-3 py-2 bg-transparent">
            <div className="flex rounded-xl border border-slate-800 bg-black/40 p-1">
                <button
                    type="button"
                    onClick={() => onChange("chat")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                        active === "chat"
                            ? "bg-pink-600 text-white shadow-sm"
                            : "text-slate-400"
                    }`}
                >
                    <MessageSquareIcon className="size-4" />
                    Chat
                </button>
                <button
                    type="button"
                    onClick={() => onChange("document")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                        active === "document"
                            ? "bg-pink-600 text-white shadow-sm"
                            : "text-slate-400"
                    }`}
                >
                    <BookOpenIcon className="size-4" />
                    Document
                </button>
            </div>
        </div>
    );
}
