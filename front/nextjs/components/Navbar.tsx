'use client'
import Link from "next/link";
import { motion } from "motion/react";

export default function Navbar() {
    return (
        <motion.nav className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <Link href="/" className="text-lg font-semibold tracking-tight">
                AskDocs AI
            </Link>

            <Link href="/app" className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full">
                Your documents
            </Link>
        </motion.nav>
    );
}
