import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Soft animated background
export function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[100dvh] w-full font-lexend overflow-hidden flex flex-col justify-between relative"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>

            {/* Top decorative elements */}
            <div className="absolute top-0 left-0 w-full h-32 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 120%, #4ade80 0%, transparent 70%)',
                }} />

            {/* Main content container (3 rows) */}
            <div className="relative z-10 w-full max-w-5xl mx-auto min-h-[100dvh] flex flex-col px-4 sm:px-8 py-safe pt-8 pb-4">
                {children}
            </div>

            {/* Bottom decorative ground */}
            <div className="absolute bottom-0 left-0 w-full h-48 opacity-30 pointer-events-none bg-green-200"
                style={{
                    borderRadius: '100% 100% 0 0 / 20px 20px 0 0',
                }} />
        </div>
    );
}

// ─── Top Section ───
export function StoryPanel({ text, assistLevel }: { text: string; assistLevel: number }) {
    // If assist level >= 1, slightly highlight the text
    const highlightClass = assistLevel >= 1 ? 'bg-yellow-100 ring-4 ring-yellow-200' : 'bg-white';

    return (
        <div className="flex-none min-h-[100px] mb-4 flex items-center justify-center p-2 z-20">
            <AnimatePresence mode="wait">
                <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className={`max-w-4xl rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-500 ease-out border-4 border-green-50 ${highlightClass}`}
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl leading-relaxed text-gray-800 text-center font-medium">
                        {text}
                    </h2>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
