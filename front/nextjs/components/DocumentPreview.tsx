'use client'
import dynamic from "next/dynamic";
import "@cyntler/react-doc-viewer/dist/index.css";

const DocViewer = dynamic(() => import("@cyntler/react-doc-viewer"), { ssr: false });
const getRenderers = () => import("@cyntler/react-doc-viewer").then((mod) => mod.DocViewerRenderers);
const DocxPreview = dynamic(() => import("./DocxPreview"), { ssr: false });
const TxtPreview = dynamic(() => import("./TxtPreview"), { ssr: false });

import { memo, useEffect, useState } from "react";
import type { IDocument } from "@cyntler/react-doc-viewer";

function DocumentPreview({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
    const [renderers, setRenderers] = useState<unknown[] | null>(null);
    const lowerName = fileName.toLowerCase();
    const isDocx = lowerName.endsWith(".docx");
    const isTxt = lowerName.endsWith(".txt");
    const usesCustomRenderer = isDocx || isTxt;

    useEffect(() => {
        if (!usesCustomRenderer) getRenderers().then(setRenderers);
    }, [usesCustomRenderer]);

    if (isDocx) {
        return (
            <div className="rounded-xl overflow-hidden border border-slate-800 h-full">
                <DocxPreview fileUrl={fileUrl} />
            </div>
        );
    }

    if (isTxt) {
        return (
            <div className="rounded-xl overflow-hidden border border-slate-800 h-full">
                <TxtPreview fileUrl={fileUrl} />
            </div>
        );
    }

    if (!renderers) return null;

    const documents: IDocument[] = [{ uri: fileUrl, fileName }];

    return (
        <div data-lenis-prevent className="rounded-xl overflow-hidden border border-slate-800 h-full">
            <DocViewer
                documents={documents}
                pluginRenderers={renderers as never}
                config={{
                    header: { disableHeader: true },
                }}
                theme={{
                    primary: "#db2777",
                    secondary: "#0f172a",
                    tertiary: "#1e293b",
                    textPrimary: "#f1f5f9",
                    textSecondary: "#94a3b8",
                    textTertiary: "#f1f5f9",
                }}
                style={{ height: "100%" }}
            />
        </div>
    );
}

export default memo(DocumentPreview);
