'use client'
import { useEffect, useRef, useState } from "react";

export default function DocxPreview({ fileUrl }: { fileUrl: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setError(false);

        Promise.all([fetch(fileUrl).then((res) => res.blob()), import("docx-preview")])
            .then(([blob, docxPreview]) => {
                if (cancelled || !containerRef.current) return;
                containerRef.current.innerHTML = "";
                return docxPreview.renderAsync(blob, containerRef.current);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [fileUrl]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm p-6 text-center">
                Non riesco a mostrare l&apos;anteprima di questo documento.
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-white">
            <div ref={containerRef} className="w-max" />
        </div>
    );
}
