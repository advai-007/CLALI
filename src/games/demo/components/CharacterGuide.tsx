import { motion, AnimatePresence } from 'framer-motion';

const GUIDE_MESSAGES: Record<number, string | null> = {
    0: null,
    1: "Let's look at that part again.",
    2: 'Here are fewer choices to make it easier.',
    3: 'I highlighted the most helpful clue for you.',
    4: 'Follow the guided hint and we can do it together!',
};

const OllieSVG = ({ isTalking, assistLevel }: { isTalking: boolean; assistLevel: number }) => {
    const eyeScaleY = assistLevel > 2 ? 0.7 : 1;
    const beakColor = assistLevel > 1 ? '#d97706' : '#f59e0b';

    return (
        <motion.svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            className="drop-shadow-md"
            animate={{
                y: isTalking ? [0, -5, 0] : [0, 2, 0],
                rotate: isTalking ? [-2, 2, -2] : 0
            }}
            transition={{
                duration: isTalking ? 0.4 : 3,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        >
            <path d="M 20 50 Q 20 10, 50 10 Q 80 10, 80 50 Q 80 90, 50 90 Q 20 90, 20 50 Z" fill="#8b5cf6" />
            <path d="M 30 55 Q 30 35, 50 35 Q 70 35, 70 55 Q 70 85, 50 85 Q 30 85, 30 55 Z" fill="#ddd6fe" />
            <motion.path
                d="M 15 45 Q 5 60, 20 70 Z"
                fill="#7c3aed"
                animate={{ rotate: isTalking ? [0, -10, 0] : 0, originX: '20px', originY: '45px' }}
                transition={{ duration: 0.3, repeat: Infinity }}
            />
            <motion.path
                d="M 85 45 Q 95 60, 80 70 Z"
                fill="#7c3aed"
                animate={{ rotate: isTalking ? [0, 10, 0] : 0, originX: '80px', originY: '45px' }}
                transition={{ duration: 0.3, repeat: Infinity }}
            />
            <circle cx="35" cy="40" r="14" fill="#ffffff" />
            <circle cx="65" cy="40" r="14" fill="#ffffff" />
            <motion.circle cx="35" cy="40" r="6" fill="#1e1b4b" animate={{ scaleY: eyeScaleY }} />
            <motion.circle cx="65" cy="40" r="6" fill="#1e1b4b" animate={{ scaleY: eyeScaleY }} />
            <motion.path
                d="M 45 48 L 55 48 L 50 58 Z"
                fill={beakColor}
                animate={{ scaleY: isTalking ? [1, 1.4, 1] : 1, transformOrigin: '50px 48px' }}
                transition={{ duration: 0.2, repeat: Infinity }}
            />
            <path d="M 20 25 L 30 15 L 35 25 Z" fill="#7c3aed" />
            <path d="M 80 25 L 70 15 L 65 25 Z" fill="#7c3aed" />
        </motion.svg>
    );
};

export function CharacterGuide({ assistLevel }: { assistLevel: number }) {
    const message = GUIDE_MESSAGES[assistLevel] ?? null;

    return (
        <div className="flex-none h-[15vh] min-h-[100px] flex items-end justify-start px-2 relative z-20">
            <div className="relative flex items-end">
                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div
                            key={`message-${assistLevel}`}
                            initial={{ opacity: 0, scale: 0.8, x: -20, y: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
                            className="absolute bottom-full left-[100px] mb-2 bg-white rounded-2xl rounded-bl-none px-6 py-4 shadow-xl border-2 border-purple-100 min-w-[250px]"
                        >
                            <p className="text-xl text-gray-700 font-medium">{message}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative cursor-pointer hover:drop-shadow-xl transition-all">
                    <OllieSVG isTalking={Boolean(message)} assistLevel={assistLevel} />
                </div>
            </div>
        </div>
    );
}
