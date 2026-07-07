import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import React from "react";

export const metadata = {
    title: "AskDocs AI - Ask questions about your documents",
    description: "Upload your documents and get precise answers with cited sources, powered by semantic search and AI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}