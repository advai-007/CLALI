import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface VictoryModalProps {
    isOpen: boolean;
    starsEarned: number;
    title?: string;
    subtitle?: string;
    nextRoute?: string;
    onNext?: () => void;
    onClose?: () => void;
}

const confettiColors = ['#FF5C5C', '#FFD93D', '#4ADE80', '#4DA6FF', '#F472B6', '#A78BFA'];

export default function VictoryModal({
    isOpen,
    starsEarned,
    title = 'Great Work!',
    subtitle = 'Workshop Fixed',
    nextRoute,
    onNext,
    onClose,
}: VictoryModalProps) {
    const navigate = useNavigate();

    const handleNext = useCallback(() => {
        if (onNext) onNext();
        else if (nextRoute) navigate(nextRoute);
        else navigate('/workshop');
    }, [onNext, nextRoute, navigate]);

    const handleBack = useCallback(() => {
        if (onClose) onClose();
        else navigate('/workshop');
    }, [onClose, navigate]);

    // Memoize confetti pieces
    const confettiPieces = useMemo(
        () =>
            Array.from({ length: 30 }, (_, i) => ({
                id: i,
                // eslint-disable-next-line react-hooks/purity
                x: Math.random() * 100,
                // eslint-disable-next-line react-hooks/purity
                delay: Math.random() * 0.5,
                color: confettiColors[i % confettiColors.length],
                // eslint-disable-next-line react-hooks/purity
                size: 6 + Math.random() * 8,
                // eslint-disable-next-line react-hooks/purity
                rotation: Math.random() * 360,
                // eslint-disable-next-line react-hooks/purity
                duration: 1.5 + Math.random() * 1.5,
            })),
        []
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Confetti */}
                    {confettiPieces.map((c) => (
                        <motion.div
                            key={c.id}
                            className="absolute rounded-sm pointer-events-none"
                            style={{
                                left: `${c.x}%`,
                                top: '-20px',
                                width: c.size,
                                height: c.size,
                                backgroundColor: c.color,
                            }}
                            initial={{ y: -20, rotate: 0, opacity: 1 }}
                            animate={{
                                y: '100vh',
                                rotate: 720,
                                opacity: 0,
                            }}
                            transition={{
                                duration: c.duration,
                                delay: c.delay,
                                ease: 'easeIn',
                            }}
                        />
                    ))}

                    {/* Modal Card */}
                    <motion.div
                        className="bg-white rounded-3xl p-8 max-w-sm w-[90%] text-center border-b-8 border-gray-200 relative"
                        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    >
                        {/* Checkmark */}
                        <motion.div
                            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center plastic-up border-4 border-white"
                            style={{ backgroundColor: 'var(--ws-green)' }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                        >
                            <span className="material-symbols-outlined text-white text-5xl font-bold">
                                check
                            </span>
                        </motion.div>

                        {/* Title */}
                        <h2 className="workshop-heading text-3xl text-[var(--ws-dark)] mb-1">
                            {title}
                        </h2>
                        <p className="text-gray-500 mb-6 text-lg">{subtitle}</p>

                        {/* Stars */}
                        <div className="flex justify-center gap-3 mb-8">
                            {[1, 2, 3].map((i) => (
                                <motion.span
                                    key={i}
                                    className="material-symbols-outlined text-5xl drop-shadow-md"
                                    style={{
                                        color: i <= starsEarned ? 'var(--ws-yellow)' : '#D1D5DB',
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        delay: 0.3 + i * 0.2,
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 12,
                                    }}
                                >
                                    star
                                </motion.span>
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleNext}
                                className="w-full py-4 rounded-xl workshop-heading text-xl text-white plastic-btn flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--ws-green)' }}
                            >
                                <span>Next Repair</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                            <button
                                onClick={handleBack}
                                className="w-full py-3 rounded-xl workshop-heading text-lg text-[var(--ws-dark)] bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">garage</span>
                                <span>Back to Workshop</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
