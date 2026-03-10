import { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../workshopTypes';
import '../workshop.css';

// ─── Gear & Peg Definitions ────────────────────────────────────────
interface GearDef {
    id: string;
    shape: 'triangle' | 'square' | 'circle';
    color: string;
    borderColor: string;
    innerColor: string;
    isDistractor?: boolean;
}

interface PegDef {
    id: string;
    shape: 'triangle' | 'square' | 'circle';
    label: string;
}

const PEGS: PegDef[] = [
    { id: 'peg-triangle', shape: 'triangle', label: 'Triangle' },
    { id: 'peg-square', shape: 'square', label: 'Square' },
    { id: 'peg-circle', shape: 'circle', label: 'Circle' },
];

const ALL_GEARS: GearDef[] = [
    { id: 'gear-triangle', shape: 'triangle', color: 'var(--ws-pink)', borderColor: '#db2777', innerColor: '#f9a8d4' },
    { id: 'gear-square', shape: 'square', color: 'var(--ws-cyan)', borderColor: '#0891b2', innerColor: '#a5f3fc' },
    { id: 'gear-circle', shape: 'circle', color: 'var(--ws-yellow)', borderColor: '#ca8a04', innerColor: '#fef08a' },
    // Distractors
    { id: 'gear-star', shape: 'circle', color: 'var(--ws-lime)', borderColor: '#65a30d', innerColor: '#d9f99d', isDistractor: true },
    { id: 'gear-hex', shape: 'triangle', color: 'var(--ws-purple)', borderColor: '#7c3aed', innerColor: '#c4b5fd', isDistractor: true },
];

const pegShapeStyles: Record<string, string> = {
    triangle: 'rounded-2xl rotate-45',
    square: 'rounded-xl',
    circle: 'rounded-full',
};

const gearShapeStyles: Record<string, string> = {
    triangle: 'rounded-2xl rotate-45',
    square: 'rounded-xl',
    circle: 'rounded-full',
};

// ─── Component ──────────────────────────────────────────────────────
export default function GearboxStation() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const [placedGears, setPlacedGears] = useState<Record<string, string>>({});
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [flashPeg, setFlashPeg] = useState<string | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [taskStartTime] = useState(() => Date.now());

    // Pegs refs for hit-testing
    const pegRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Filter gears based on adaptive state
    const activeGears = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED) {
            // Only show the next unplaced correct gear
            const unplacedPeg = PEGS.find((p) => !placedGears[p.id]);
            if (!unplacedPeg) return [];
            return ALL_GEARS.filter((g) => g.shape === unplacedPeg.shape && !g.isDistractor);
        }
        if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            // Remove distractors
            return ALL_GEARS.filter((g) => !g.isDistractor);
        }
        return ALL_GEARS;
    }, [adaptiveState, placedGears]);

    // Unplaced gears (not yet matched to a peg)
    const trayGears = useMemo(
        () => activeGears.filter((g) => !Object.values(placedGears).includes(g.id)),
        [activeGears, placedGears]
    );

    // How many pegs are filled
    const completedCount = Object.keys(placedGears).length;
    const totalPegs = PEGS.length;

    // Hint text for adaptive modes
    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) return undefined;
        const nextPeg = PEGS.find((p) => !placedGears[p.id]);
        if (!nextPeg) return undefined;
        if (adaptiveState === AdaptiveState.GUIDED) {
            return `Try placing the ${nextPeg.shape} gear on the ${nextPeg.shape} peg!`;
        }
        return `Match each gear shape to its peg!`;
    }, [adaptiveState, placedGears]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    // Check if a drag end position overlaps a peg
    const findNearestPeg = useCallback(
        (gearId: string, point: { x: number; y: number }): PegDef | null => {
            const gear = ALL_GEARS.find((g) => g.id === gearId);
            if (!gear) return null;

            for (const peg of PEGS) {
                if (placedGears[peg.id]) continue; // already filled
                const el = pegRefs.current[peg.id];
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(point.x - cx, point.y - cy);
                if (dist < 100) {
                    return peg;
                }
            }
            return null;
        },
        [placedGears]
    );

    const handleDragEnd = useCallback(
        (gearId: string, info: { point: { x: number; y: number } }) => {
            const gear = ALL_GEARS.find((g) => g.id === gearId);
            if (!gear) return;

            const targetPeg = findNearestPeg(gearId, info.point);
            if (!targetPeg) {
                // Dropped nowhere
                monitor.recordIncorrectAction();
                return;
            }

            if (gear.shape === targetPeg.shape && !gear.isDistractor) {
                // ✅ Correct
                monitor.recordCorrectAction();
                sendAdaptive({ type: 'CORRECT_ACTION' });
                setPlacedGears((prev) => ({ ...prev, [targetPeg.id]: gearId }));
                 
                showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                // Check win
                const newCount = completedCount + 1;
                if (newCount >= totalPegs) {
                    setTimeout(() => setShowVictory(true), 800);
                }
            } else {
                // ❌ Incorrect
                monitor.recordIncorrectAction();
                sendAdaptive({ type: 'INCORRECT_ACTION' });
                setErrorCount((prev) => prev + 1);
                setFlashPeg(targetPeg.id);
                setTimeout(() => setFlashPeg(null), 600);
                 
                showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');

                // Check if we should escalate difficulty
                if (monitor.shouldEscalate()) {
                    sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                }
            }
        },
        [findNearestPeg, monitor, sendAdaptive, showFeedback, completedCount, totalPegs]
    );

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;
        completeStation('gearbox', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount: adaptiveState !== AdaptiveState.NORMAL ? 1 : 0,
            starsEarned: stars,
        });
    }, [errorCount, adaptiveState, completeStation, taskStartTime]);

    return (
        <div className="workshop-screen flex flex-col overflow-hidden relative" style={{ backgroundColor: 'rgba(77,166,255,0.2)', height: '100dvh' }}>
            {/* Background dots */}
            <div className="absolute inset-0 -z-10 pointer-events-none pattern-dots opacity-20" />

            <WorkshopHUD title="Fix the Gears" icon="settings" currentStars={completedCount} maxStars={totalPegs} />

            {/* Main Game Area */}
            <main className="flex-grow flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 py-4 relative z-10 pt-24">
                {/* Machine Panel (Drop Zone) */}
                <div className="relative w-full max-w-3xl aspect-[4/3] rounded-3xl border-8 border-gray-300 flex flex-col items-center justify-center p-8 overflow-hidden"
                    style={{ backgroundColor: 'var(--ws-metal)', boxShadow: 'var(--ws-shadow-plastic-card)' }}
                >
                    {/* Metal texture */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none metal-texture" />

                    {/* Screws */}
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-400`} style={{ boxShadow: 'var(--ws-shadow-plastic-down)' }}>
                            <span className="material-symbols-outlined text-sm" style={{ transform: `rotate(${i * 33}deg)` }}>add</span>
                        </div>
                    ))}

                    {/* Gear Pegs */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {PEGS.map((peg, i) => {
                            const positions = [
                                'absolute top-4 sm:top-10 left-1/2 -translate-x-1/2',
                                'absolute bottom-8 sm:bottom-16 left-8 sm:left-16 md:left-24',
                                'absolute bottom-8 sm:bottom-16 right-8 sm:right-16 md:right-24',
                            ];
                            const placed = placedGears[peg.id];
                            const placedGear = ALL_GEARS.find((g) => g.id === placed);
                            const isFlashing = flashPeg === peg.id;
                            const shouldGlow = (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY && !placed) ||
                                (adaptiveState === AdaptiveState.GUIDED && !placed);

                            return (
                                <div key={peg.id} className={positions[i]}>
                                    <div
                                        ref={(el) => { pegRefs.current[peg.id] = el; }}
                                        className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 flex items-center justify-center"
                                    >
                                        {/* Glow ring for adaptive */}
                                        {shouldGlow && !placed && (
                                            <motion.div
                                                className="absolute inset-[-12px] rounded-full border-4"
                                                style={{ borderColor: adaptiveState === AdaptiveState.GUIDED ? 'var(--ws-yellow)' : 'rgba(255,217,61,0.5)' }}
                                                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                        )}

                                        {/* Flash on incorrect */}
                                        {isFlashing && (
                                            <motion.div
                                                className="absolute inset-0 rounded-2xl"
                                                style={{ backgroundColor: 'var(--ws-yellow)', opacity: 0.4 }}
                                                animate={{ opacity: [0.4, 0, 0.4, 0] }}
                                                transition={{ duration: 0.6 }}
                                            />
                                        )}

                                        {/* Peg base */}
                                        <div
                                            className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gray-300 ${pegShapeStyles[peg.shape]} flex items-center justify-center border-4 border-gray-400/50`}
                                            style={{ boxShadow: 'var(--ws-shadow-hole-inset)' }}
                                        >
                                            {!placed && (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-full flex items-center justify-center border-t border-white/40" style={{ boxShadow: 'var(--ws-shadow-plastic-up)' }}>
                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500 rounded-full" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Placed gear */}
                                        {placed && placedGear && (
                                            <motion.div
                                                className={`absolute inset-0 m-auto w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 ${gearShapeStyles[placedGear.shape]} flex items-center justify-center border-4 ws-spin-slow z-10`}
                                                style={{ backgroundColor: placedGear.color, borderColor: `${placedGear.borderColor}33`, boxShadow: 'var(--ws-shadow-plastic-up)' }}
                                                initial={{ scale: 0, rotate: -90 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            >
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: placedGear.innerColor, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" style={{ backgroundColor: 'var(--ws-metal)', boxShadow: 'var(--ws-shadow-plastic-down)' }} />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Success glow */}
                                        {placed && (
                                            <>
                                                <motion.div
                                                    className="absolute inset-[-16px] sm:inset-[-20px] rounded-full border-4"
                                                    style={{ borderColor: 'rgba(74,222,128,0.6)' }}
                                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <motion.div
                                                    className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-white font-bold text-xs sm:text-sm"
                                                    style={{ backgroundColor: 'var(--ws-green)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    Perfect Fit!
                                                </motion.div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Conveyor belt */}
                    <div className="absolute bottom-0 w-full h-6 sm:h-8 conveyor-belt opacity-30 border-t-2 border-gray-400" />
                </div>
            </main>

            {/* Bottom Tray (Toolbox) */}
            <footer
                className="relative w-full bg-[var(--ws-orange)] pb-6 sm:pb-8 pt-10 sm:pt-12 -mt-6 sm:-mt-10 rounded-t-[2rem] sm:rounded-t-[3rem] border-t-6 sm:border-t-8 border-orange-200 wood-texture"
                style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.1)' }}
            >
                {/* Tray label */}
                <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 bg-orange-200 px-6 sm:px-8 py-1 sm:py-2 rounded-t-xl border-t-4 border-x-4 border-orange-300">
                    <span className="text-amber-900 font-bold uppercase tracking-widest text-xs sm:text-sm workshop-heading">Parts Tray</span>
                </div>

                <div className="max-w-4xl mx-auto flex justify-center gap-6 sm:gap-8 md:gap-16 items-center px-4 py-2 sm:py-4">
                    {trayGears.map((gear) => (
                        <motion.div
                            key={gear.id}
                            className="relative cursor-grab active:cursor-grabbing ws-touch-target"
                            drag
                            dragSnapToOrigin
                            dragElastic={0.5}
                            whileHover={{ y: -8, scale: 1.05 }}
                            whileDrag={{ scale: 1.15, zIndex: 9999 }}
                            onDragStart={() => {
                                monitor.recordInteraction();
                            }}
                            onDragEnd={(_, info) => handleDragEnd(gear.id, info)}
                        >
                            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 relative">
                                {/* Shadow */}
                                <div className={`absolute inset-0 bg-black/20 ${gearShapeStyles[gear.shape]} translate-y-3 blur-sm`} />
                                {/* Gear shape */}
                                <div
                                    className={`relative w-full h-full ${gearShapeStyles[gear.shape]} border-b-6 sm:border-b-8 flex items-center justify-center`}
                                    style={{
                                        backgroundColor: gear.color,
                                        borderColor: `${gear.borderColor}4D`,
                                        boxShadow: 'var(--ws-shadow-plastic-up)',
                                        opacity: gear.isDistractor && adaptiveState !== AdaptiveState.NORMAL ? 0.4 : 1,
                                    }}
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: gear.innerColor, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black/10 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {trayGears.length === 0 && (
                        <div className="text-amber-900/50 workshop-heading text-xl py-4">
                            All gears placed! 🎉
                        </div>
                    )}
                </div>
            </footer>

            {/* Help Button */}
            <button
                className="fixed bottom-32 sm:bottom-36 right-4 sm:right-6 md:right-12 z-50 bg-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center group hover:scale-110 transition-transform ws-touch-target"
                style={{ boxShadow: 'var(--ws-shadow-plastic-card)', border: '4px solid var(--ws-cyan)' }}
                onClick={() => {
                    sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                    showFeedback('Let me help you!', 'hint');
                }}
            >
                <span className="material-symbols-outlined text-[var(--ws-cyan)] text-3xl sm:text-4xl">smart_toy</span>
                <span className="absolute -top-2 -right-2 bg-[var(--ws-red)] text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">?</span>
            </button>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} />
            <VictoryModal
                isOpen={showVictory}
                starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1}
                title="Gears Fixed!"
                subtitle="The gearbox is running smoothly"
                nextRoute="/workshop/tires"
                onNext={handleComplete}
            />
        </div>
    );
}
