'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

export default function AppNavbar() {
    const pathname = usePathname();

    return (
        <motion.nav className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur bg-black/40 border-b border-slate-900"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <Link href="/" className="text-lg font-semibold tracking-tight">
                AskDocs AI
            </Link>

            <div className="flex items-center gap-6">
                <Link href="/app" className={`hover:text-pink-500 transition ${pathname === "/app" ? "text-pink-500" : "text-slate-300"}`}>
                    I tuoi documenti
                </Link>
                <Link href="/" className="text-slate-300 hover:text-pink-500 transition">
                    Home
                </Link>
            </div>
        </motion.nav>
    );
}
