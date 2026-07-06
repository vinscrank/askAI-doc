'use client'
import { useState } from "react";
import { motion } from "motion/react";
import { CheckIcon, FileTextIcon, MessageSquareIcon, PencilIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { renameDocument } from "@/lib/api";
import { DocumentItem } from "@/types";

function getExtension(filename: string | null | undefined): string {
    if (!filename) return "";
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()!.toUpperCase() : "";
}

export default function DocumentCard({ doc, index, onRenamed }: { doc: DocumentItem; index: number; onRenamed: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(doc.filename ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const extension = getExtension(doc.filename);

    async function handleSave() {
        const trimmed = draftName.trim();
        if (!trimmed || trimmed === doc.filename) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            await renameDocument(doc.document_id, trimmed);
            onRenamed();
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    }

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            whileHover={{ y: -3 }}
            className="group p-5 rounded-xl border border-slate-800 bg-slate-950 hover:border-pink-900 transition-colors flex flex-col gap-5"
        >
            <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-pink-950/60 border border-pink-900/60 flex items-center justify-center shrink-0">
                    <FileTextIcon className="size-5 text-pink-500" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={draftName}
                                onChange={(e) => setDraftName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave();
                                    if (e.key === "Escape") setIsEditing(false);
                                }}
                                disabled={isSaving}
                                className="w-full bg-black border border-slate-700 focus:border-pink-500 outline-none rounded-md px-2 py-1 text-sm"
                            />
                            <button onClick={handleSave} disabled={isSaving} className="text-pink-600 hover:text-pink-500 shrink-0">
                                <CheckIcon className="size-4" />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-300 shrink-0">
                                <XIcon className="size-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-medium leading-snug break-all line-clamp-2" title={doc.filename ?? undefined}>
                                    {doc.filename ?? "Documento senza nome"}
                                </p>
                                <button
                                    onClick={() => { setDraftName(doc.filename ?? ""); setIsEditing(true); }}
                                    className="text-slate-600 hover:text-pink-500 transition shrink-0 opacity-0 group-hover:opacity-100"
                                    aria-label="Rinomina documento"
                                >
                                    <PencilIcon className="size-3.5" />
                                </button>
                            </div>
                            {extension && (
                                <span className="inline-block mt-2 text-[11px] font-medium tracking-wide text-pink-500 bg-pink-950/50 border border-pink-900/50 rounded px-1.5 py-0.5">
                                    {extension}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
            <Link
                href={`/app/${encodeURIComponent(doc.document_id)}`}
                className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full py-2.5 text-sm mt-auto"
            >
                <MessageSquareIcon className="size-4" />
                Fai una domanda
            </Link>
        </motion.div>
    );
}
