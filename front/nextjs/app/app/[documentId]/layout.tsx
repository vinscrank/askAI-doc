export default function DocumentChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="document-chat-shell w-full max-w-7xl mx-auto" data-doc-chat>
            {children}
        </div>
    );
}
