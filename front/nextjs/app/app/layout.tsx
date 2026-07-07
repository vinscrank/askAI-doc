import AppNavbar from "@/components/AppNavbar";

export const metadata = {
    title: "Dashboard - AskDocs AI",
    description: "Upload documents and ask questions grounded in your own files.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppNavbar />
            <main className="min-h-dvh pt-[3.75rem] pb-8 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 has-[[data-doc-chat]]:pt-0 has-[[data-doc-chat]]:pb-0 has-[[data-doc-chat]]:px-0 lg:has-[[data-doc-chat]]:pt-[3.75rem] lg:has-[[data-doc-chat]]:pb-8 lg:has-[[data-doc-chat]]:px-3 lg:has-[[data-doc-chat]]:sm:px-6 lg:has-[[data-doc-chat]]:md:px-10 lg:has-[[data-doc-chat]]:lg:px-16 lg:has-[[data-doc-chat]]:xl:px-20">
                {children}
            </main>
        </>
    );
}
