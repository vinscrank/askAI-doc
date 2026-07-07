'use client'
import { motion } from "motion/react";
import UploadWidget from "@/components/UploadWidget";

export default function UploadSection() {
    return (
        <div id="upload" className="px-4 md:px-16 lg:px-24 xl:px-32 mt-20">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-2xl md:text-3xl font-semibold">Try it now, no sign-up required</h2>
                    <p className="text-slate-400 mt-2">Upload a document and start asking questions in seconds.</p>
                </motion.div>

                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                >
                    <UploadWidget />
                </motion.div>
            </div>
        </div>
    );
}
