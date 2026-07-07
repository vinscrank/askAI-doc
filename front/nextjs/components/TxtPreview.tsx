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
            <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-slate-500">
                Could not preview this document.
            </div>
        );
    }

    if (text === null) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8 text-sm text-slate-500">
                Loading preview...
            </div>
        );
    }

    return (
        <div data-lenis-prevent className="h-full w-full overflow-auto overscroll-contain bg-white">
            <pre className="w-full p-6 sm:p-8 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words font-sans">
                {text}
            </pre>
        </div>
    );
}
