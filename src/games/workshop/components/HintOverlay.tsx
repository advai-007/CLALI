import { motion, AnimatePresence } from 'framer-motion';
import { AdaptiveState } from '../workshopTypes';

interface HintOverlayProps {
    adaptiveState: AdaptiveState;
    hintText?: string;
    showGhostHand?: boolean;
    /** Position relative to the viewport where the ghost hand should point (optional) */
    targetPosition?: { x: number; y: number };
}

/**
 * Overlay that shows hints during REDUCED_COMPLEXITY and GUIDED modes.
 * In REDUCED it shows a subtle text hint.
 * In GUIDED it adds a ghost-hand animation pointing to the correct target.
 */
export default function HintOverlay({
    adaptiveState,
    hintText,
    showGhostHand = false,
    targetPosition,
}: HintOverlayProps) {
    const isVisible =
        adaptiveState !== AdaptiveState.NORMAL && !!hintText;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed bottom-24 left-1/2 z-[80] pointer-events-none"
                    initial={{ x: '-50%', y: 20, opacity: 0 }}
                    animate={{ x: '-50%', y: 0, opacity: 1 }}
                    exit={{ x: '-50%', y: 20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Hint Bubble */}
                    <div
                        className="bg-white px-6 py-3 rounded-2xl flex items-center gap-3 workshop-heading"
                        style={{
                            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                            borderBottom: '4px solid var(--ws-base-grey)',
                        }}
                    >
                        <span
                            className="material-symbols-outlined text-3xl"
                            style={{ color: 'var(--ws-yellow)' }}
                        >
                            lightbulb
                        </span>
                        <p className="text-[var(--ws-dark)] font-bold text-base sm:text-lg">
                            {hintText}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Ghost Hand (GUIDED mode only) */}
            {adaptiveState === AdaptiveState.GUIDED && showGhostHand && targetPosition && (
                <motion.div
                    className="fixed z-[85] pointer-events-none"
                    style={{ left: targetPosition.x, top: targetPosition.y }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <span
                        className="material-symbols-outlined text-5xl drop-shadow-lg"
                        style={{
                            color: 'var(--ws-yellow)',
                            fontVariationSettings: "'FILL' 1",
                        }}
                    >
                        back_hand
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
