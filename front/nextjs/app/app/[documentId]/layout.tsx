export default function DocumentChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="document-chat-shell flex flex-col min-h-0 w-full max-w-[90rem] mx-auto overflow-hidden">
            {children}
        </div>
    );
}
