import AppNavbar from "@/components/AppNavbar";

export const metadata = {
    title: "Dashboard - AskDocs AI",
    description: "Upload documents and ask questions grounded in your own files.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppNavbar />
            <main className="min-h-screen pt-24 pb-6 px-4 md:px-16 lg:px-24 xl:px-32">
                {children}
            </main>
        </>
    );
}
