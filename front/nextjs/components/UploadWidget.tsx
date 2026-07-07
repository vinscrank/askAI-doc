'use client'
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Loader2Icon, UploadCloudIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/api";

export default function UploadWidget({ onUploaded }: { onUploaded?: () => void }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File | undefined) {
        if (!file) return;
        setIsUploading(true);
        setError(null);
        try {
            const res = await uploadDocument(file);
            onUploaded?.();
            router.push(`/app/${encodeURIComponent(res.document_id)}`);
        } catch {
            setError("Could not read this file. Try another document.");
            setIsUploading(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    return (
        <div className="w-full">
            <motion.label
                htmlFor="file-upload"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl py-14 px-6 cursor-pointer transition
                    ${isUploading ? "border-pink-800 bg-pink-950/20" : isDragging ? "border-pink-600 bg-pink-950/30" : "border-slate-800 hover:border-pink-800 hover:bg-slate-950/60"}`}
            >
                {isUploading ? (
                    <Loader2Icon className="size-8 text-pink-600 animate-spin" />
                ) : (
                    <UploadCloudIcon className="size-8 text-pink-600" />
                )}
                <div className="text-center">
                    <p className="font-medium">
                        {isUploading ? "Reading your document..." : "Drop your document here, or click to browse"}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">Supported formats: .txt, .pdf, .docx</p>
                </div>
                <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.docx"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </motion.label>

            {error && (
                <p className="mt-4 text-sm text-pink-500 bg-pink-950/30 border border-pink-900 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}
        </div>
    );
}
