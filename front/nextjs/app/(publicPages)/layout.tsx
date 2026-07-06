import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import React from "react";

export const metadata = {
    title: "AskDocs AI - Fai domande ai tuoi documenti",
    description: "Carica i tuoi documenti e ottieni risposte precise, con le fonti citate, grazie alla ricerca semantica e all'intelligenza artificiale.",
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