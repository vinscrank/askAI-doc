'use client'
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { listDocuments } from "@/lib/api";
import { DocumentItem } from "@/types";
import UploadWidget from "@/components/UploadWidget";
import DocumentCard from "@/components/DocumentCard";

export default function DashboardPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshDocuments = useCallback(async () => {
        try {
            const docs = await listDocuments();
            setDocuments(docs);
        } catch {
            setError("Could not reach the server. Please try again shortly.");
        } finally {
            setIsLoadingDocs(false);
        }
    }, []);

    useEffect(() => {
        refreshDocuments();
    }, [refreshDocuments]);

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                <h1 className="text-3xl md:text-4xl font-semibold">Your documents</h1>
                <p className="text-slate-400 mt-2 max-w-xl">
                    Upload a new document or continue a previous conversation.
                </p>
            </motion.div>

            <motion.div className="mt-10"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 70, mass: 1 }}
            >
                <UploadWidget onUploaded={refreshDocuments} />
            </motion.div>

            {error && (
                <p className="mt-4 text-sm text-pink-500 bg-pink-950/30 border border-pink-900 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            <div className="mt-14">
                {isLoadingDocs ? (
                    <p className="text-slate-500">Loading...</p>
                ) : documents.length === 0 ? (
                    <p className="text-slate-500">You haven&apos;t uploaded any documents yet.</p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc, index) => (
                            <DocumentCard key={doc.document_id} doc={doc} index={index} onRenamed={refreshDocuments} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
