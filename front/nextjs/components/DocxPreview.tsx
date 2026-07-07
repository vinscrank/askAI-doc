'use client'
import { useEffect, useRef, useState } from "react";

export default function DocxPreview({ fileUrl }: { fileUrl: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setError(false);
        setLoading(true);

        Promise.all([fetch(fileUrl).then((res) => res.blob()), import("docx-preview")])
            .then(([blob, docxPreview]) => {
                if (cancelled || !containerRef.current) return;
                containerRef.current.innerHTML = "";
                return docxPreview.renderAsync(blob, containerRef.current);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [fileUrl]);

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-slate-500">
                Could not preview this document.
            </div>
        );
    }

    return (
        <div data-lenis-prevent className="relative h-full w-full overflow-auto overscroll-contain bg-white">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-sm text-slate-500">
                    Loading preview...
                </div>
            )}
            <div ref={containerRef} className="w-full min-h-full p-6 sm:p-8" />
        </div>
    );
}
