'use client'
import { CheckIcon } from "lucide-react";
import { motion } from "motion/react";

export default function HeroSection() {
    const specialFeatures = [
        "No setup required",
        "Answers with cited sources",
        "Ready in seconds",
    ];

    return (
        <div className="relative flex flex-col items-center justify-center px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="absolute top-30 -z-10 left-1/4 size-72 bg-pink-600 blur-[300px]"></div>

            <motion.h1 className="text-5xl/17 md:text-6xl/21 font-medium max-w-2xl text-center mt-44"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
            >
                Ask questions about your{" "}
                <span className="move-gradient px-3 rounded-xl text-nowrap">documents.</span>
            </motion.h1>
            <motion.p className="text-base text-center text-slate-200 max-w-lg mt-6"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
                Upload a file, ask a question, and get a clear answer with the exact passage it came from.
            </motion.p>
            <motion.div className="flex items-center gap-4 mt-8"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
            >
                <a href="#upload" className="flex items-center bg-pink-600 hover:bg-pink-700 text-white rounded-full px-7 h-11">
                    Upload a document
                </a>
            </motion.div>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-14 mt-12 mb-20">
                {specialFeatures.map((feature, index) => (
                    <motion.p className="flex items-center gap-2" key={index}
                        initial={{ y: 30, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2, duration: 0.3 }}
                    >
                        <CheckIcon className="size-5 text-pink-600" />
                        <span className="text-slate-400">{feature}</span>
                    </motion.p>
                ))}
            </div>
        </div>
    );
}
