import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import type { FeedbackType } from '../workshopTypes';

interface FeedbackToastProps {
    message: string;
    type: FeedbackType;
    /** Unique key to trigger re-appearance for same message */
    triggerId?: number;
    duration?: number;
}

const typeConfig: Record<FeedbackType, { bg: string; icon: string; color: string }> = {
    correct: {
        bg: 'var(--ws-green)',
        icon: 'check_circle',
        color: '#fff',
    },
    incorrect: {
        bg: '#fff',
        icon: 'lightbulb',
        color: 'var(--ws-dark)',
    },
    hint: {
        bg: 'var(--ws-yellow)',
        icon: 'smart_toy',
        color: '#78350F',
    },
};

export default function FeedbackToast({
    message,
    type,
    triggerId = 0,
    duration = 2000,
}: FeedbackToastProps) {
    const [visible, setVisible] = useState(false);
    const config = typeConfig[type];

    const show = useCallback(() => {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    useEffect(() => {
        if (!message) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        return show();
    }, [message, triggerId, show]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed bottom-28 left-1/2 z-[90] pointer-events-none"
                    initial={{ x: '-50%', y: 30, opacity: 0, scale: 0.8 }}
                    animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
                    exit={{ x: '-50%', y: -20, opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                    <div
                        className="px-6 py-3 rounded-2xl flex items-center gap-3 workshop-heading text-lg whitespace-nowrap"
                        style={{
                            backgroundColor: config.bg,
                            color: config.color,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        }}
                    >
                        <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                        <span>{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
