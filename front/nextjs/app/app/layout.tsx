import AppNavbar from "@/components/AppNavbar";

export const metadata = {
    title: "Dashboard - AskDocs AI",
    description: "Upload documents and ask questions grounded in your own files.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppNavbar />
            <main className="min-h-dvh pt-[3.75rem] pb-8 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20">
                {children}
            </main>
        </>
    );
}
