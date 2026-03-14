import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Stage Messages ───────────────────────────────────────────────────────────
const STAGE_MESSAGES: Record<number, string[]> = {
    1: [
        "You've got this! Take your time 🌟",
        "No rush! Think it through 🦉",
        "I believe in you! What do you think?",
    ],
    2: [
        "Let me make this a bit easier...",
        "I'll help narrow it down a little!",
        "Let's look at fewer choices 🤔",
    ],
    3: [
        "I think I spy the right one... look closely! 👀",
        "One of these is glowing — can you see it? ✨",
        "Hint: keep an eye on the shiny one!",
    ],
    4: [
        "Let's do it together! Tap the yellow one! 🎯",
        "That's the one! Go ahead and tap it!",
        "We've got it highlighted just for you!",
    ],
};

function getRandomMessage(stage: number): string {
    const msgs = STAGE_MESSAGES[stage] ?? [];
    return msgs[Math.floor(Math.random() * msgs.length)] ?? '';
}

// ─── Ollie SVG ────────────────────────────────────────────────────────────────
const OllieSVG = ({ isTalking, stage }: { isTalking: boolean; stage: number }) => {
    // Facial expression changes by stage
    const eyeSqueeze = stage >= 3 ? 0.65 : 1;        // Squinting when pointing
    const browLift = stage >= 3 ? -4 : 0;          // Eyebrows raised
    const peakColor = stage >= 3 ? '#f59e0b' : '#fbbf24';

    // Wing positions by stage: 0-2 resting, 3 pointing right, 4 both wings out
    const leftWingEnd = stage === 4 ? 'M 15 45 Q 0 55, 10 70 Z' : 'M 15 45 Q 5 60, 20 70 Z';
    const rightWingEnd = stage >= 3 ? 'M 85 45 Q 105 40, 95 25 Z' : 'M 85 45 Q 95 60, 80 70 Z';
    const rightWingRot = stage >= 3 ? [0, -25, 0] : [0, 10, 0];

    return (
        <motion.svg
            width="120" height="120" viewBox="0 0 100 100"
            className="drop-shadow-md"
            animate={{
                y: isTalking ? [0, -6, 0] : stage === 4 ? [0, -8, 0] : [0, 2, 0],
                rotate: isTalking ? [-3, 3, -3] : stage === 1 ? [0, 3, 0, -3, 0] : 0,
                scale: stage === 4 ? [1, 1.06, 1] : 1,
            }}
            transition={{
                duration: isTalking ? 0.4 : stage === 4 ? 0.6 : 3,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            {/* Body */}
            <path d="M 20 50 Q 20 10, 50 10 Q 80 10, 80 50 Q 80 90, 50 90 Q 20 90, 20 50 Z" fill="#8b5cf6" />
            {/* Belly */}
            <path d="M 30 55 Q 30 35, 50 35 Q 70 35, 70 55 Q 70 85, 50 85 Q 30 85, 30 55 Z" fill="#ddd6fe" />

            {/* Wings */}
            <motion.path d={leftWingEnd} fill="#7c3aed"
                animate={{ rotate: isTalking ? [0, -12, 0] : stage === 4 ? [0, -15, 0] : 0 }}
                transition={{ duration: 0.35, repeat: Infinity }}
                style={{ originX: '20px', originY: '45px' }}
            />
            <motion.path d={rightWingEnd} fill="#7c3aed"
                animate={{ rotate: isTalking ? [0, 12, 0] : rightWingRot }}
                transition={{ duration: 0.35, repeat: Infinity }}
                style={{ originX: '80px', originY: '45px' }}
            />

            {/* Eyes Outer */}
            <circle cx="35" cy="40" r="14" fill="#ffffff" />
            <circle cx="65" cy="40" r="14" fill="#ffffff" />

            {/* Eyebrows (lift when excited) */}
            <motion.line x1="25" y1="26" x2="44" y2="26" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"
                animate={{ y: browLift }} transition={{ duration: 0.4 }} />
            <motion.line x1="56" y1="26" x2="75" y2="26" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"
                animate={{ y: browLift }} transition={{ duration: 0.4 }} />

            {/* Eyes Inner */}
            <motion.circle cx="35" cy="40" r="6" fill="#1e1b4b"
                animate={{ scaleY: eyeSqueeze }}
                transition={{ duration: 0.4 }}
            />
            <motion.circle cx="65" cy="40" r="6" fill="#1e1b4b"
                animate={{ scaleY: eyeSqueeze }}
                transition={{ duration: 0.4 }}
            />

            {/* Beak */}
            <motion.path d="M 45 48 L 55 48 L 50 58 Z" fill={peakColor}
                animate={{ scaleY: isTalking ? [1, 1.5, 1] : 1 }}
                style={{ transformOrigin: '50px 48px' }}
                transition={{ duration: 0.2, repeat: Infinity }}
            />

            {/* Ear tufts */}
            <path d="M 20 25 L 30 15 L 35 25 Z" fill="#7c3aed" />
            <path d="M 80 25 L 70 15 L 65 25 Z" fill="#7c3aed" />

            {/* Stage 4 sparkles */}
            {stage === 4 && (
                <>
                    <motion.circle cx="15" cy="20" r="3" fill="#fbbf24"
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                    <motion.circle cx="85" cy="15" r="2" fill="#fbbf24"
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                    <motion.circle cx="10" cy="60" r="2.5" fill="#a78bfa"
                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }} />
                </>
            )}
        </motion.svg>
    );
};

// ─── Speech Bubble ────────────────────────────────────────────────────────────
const STAGE_BUBBLE_COLORS: Record<number, string> = {
    1: 'border-purple-200 bg-white',
    2: 'border-amber-200 bg-amber-50',
    3: 'border-amber-300 bg-amber-50',
    4: 'border-yellow-400 bg-yellow-50',
};

// ─── CharacterGuide Component ─────────────────────────────────────────────────
export function CharacterGuide({ assistLevel }: { assistLevel: number }) {
    const [message, setMessage] = useState<string | null>(null);
    const prevLevelRef = useRef(0);

    // Only trigger a NEW message when the level increases
    useEffect(() => {
        if (assistLevel > 0 && assistLevel > prevLevelRef.current) {
            setMessage(getRandomMessage(assistLevel));
            prevLevelRef.current = assistLevel;

            const t = setTimeout(() => setMessage(null), assistLevel === 4 ? 7000 : 5000);
            return () => clearTimeout(t);
        }
        if (assistLevel === 0) {
            prevLevelRef.current = 0;
            setMessage(null);
        }
    }, [assistLevel]);

    const bubbleColor = STAGE_BUBBLE_COLORS[assistLevel] ?? 'border-purple-100 bg-white';
    const isTalking = !!message;

    return (
        <div className="flex items-end justify-start px-2 relative z-30 select-none pointer-events-none">
            <div className="relative flex items-end pointer-events-auto">
                {/* Speech bubble */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            key={`msg-${assistLevel}`}
                            initial={{ opacity: 0, scale: 0.8, x: -20, y: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.75, x: -10, y: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            className={`absolute bottom-full left-[110px] mb-3 rounded-2xl rounded-bl-none px-5 py-3 shadow-xl border-2 min-w-[220px] max-w-[280px] ${bubbleColor}`}
                        >
                            {/* Stage indicator dot */}
                            <div className="flex items-center gap-2 mb-1">
                                {[1, 2, 3, 4].map(s => (
                                    <div
                                        key={s}
                                        className={`w-2 h-2 rounded-full transition-colors ${s <= assistLevel ? 'bg-amber-400' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-base text-gray-700 font-semibold leading-snug">{message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ollie */}
                <div className="relative cursor-pointer hover:drop-shadow-xl transition-all">
                    <OllieSVG isTalking={isTalking} stage={assistLevel} />
                    {/* Stage glow ring under Ollie */}
                    {assistLevel >= 3 && (
                        <motion.div
                            className="absolute -inset-2 rounded-full bg-amber-400/20 blur-md -z-10"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
