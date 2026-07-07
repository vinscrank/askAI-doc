import AppNavbar from "@/components/AppNavbar";

export const metadata = {
    title: "Dashboard - AskDocs AI",
    description: "Upload documents and ask questions grounded in your own files.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppNavbar />
            <main className="min-h-dvh pt-28 pb-12 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 has-[[data-doc-chat]]:pt-0 has-[[data-doc-chat]]:pb-0 has-[[data-doc-chat]]:px-3 has-[[data-doc-chat]]:sm:px-6 lg:has-[[data-doc-chat]]:pt-28 lg:has-[[data-doc-chat]]:pb-6 lg:has-[[data-doc-chat]]:px-8 lg:has-[[data-doc-chat]]:flex lg:has-[[data-doc-chat]]:flex-col lg:has-[[data-doc-chat]]:h-dvh lg:has-[[data-doc-chat]]:overflow-hidden">
                {children}
            </main>
        </>
    );
}
