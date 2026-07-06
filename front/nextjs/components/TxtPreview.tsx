'use client'
import { useEffect, useState } from "react";

export default function TxtPreview({ fileUrl }: { fileUrl: string }) {
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setText(null);
        setError(false);

        fetch(fileUrl)
            .then((res) => res.text())
            .then((body) => {
                if (!cancelled) setText(body);
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
        <div data-lenis-prevent className="h-full overflow-auto overscroll-contain bg-white">
            <pre className="p-6 text-sm text-slate-800 whitespace-pre-wrap break-words font-sans">
                {text}
            </pre>
        </div>
    );
}
