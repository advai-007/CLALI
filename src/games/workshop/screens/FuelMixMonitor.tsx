import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, POSITIVE_MESSAGES } from '../workshopTypes';
import '../workshop.css';

interface FuelCan {
    id: string;
    value: number;
    color: string;
    label: string;
    size: string;
}

const CANS: FuelCan[] = [
    { id: 'small', value: 1, color: 'var(--ws-green)', label: 'Small', size: 'w-20 h-28 sm:w-24 sm:h-32' },
    { id: 'medium', value: 2, color: '#FB923C', label: 'Medium', size: 'w-24 h-32 sm:w-28 sm:h-36' },
    { id: 'large', value: 3, color: 'var(--ws-purple)', label: 'Large', size: 'w-28 h-36 sm:w-32 sm:h-40' },
];

const MAX_LEVEL = 10;

export default function FuelMixMonitor() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const [targetLevel] = useState(() => {
        const targets = [5, 6, 7, 8];
         
        return targets[Math.floor(Math.random() * targets.length)];
    });

    const [currentLevel, setCurrentLevel] = useState(0);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [pouringCan, setPouringCan] = useState<string | null>(null);
    const [taskStartTime] = useState(() => Date.now());

    const isComplete = currentLevel === targetLevel;
    const isOverfilled = currentLevel > targetLevel;

    const visibleCans = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED) {
            const remaining = targetLevel - currentLevel;
            if (remaining <= 0) return [];
            return CANS.filter((c) => c.value <= remaining);
        }
        return CANS;
    }, [adaptiveState, currentLevel, targetLevel]);

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) return undefined;
        const remaining = targetLevel - currentLevel;
        if (remaining <= 0) return undefined;
        if (adaptiveState === AdaptiveState.GUIDED) {
            const bestCan = CANS.filter((c) => c.value <= remaining).sort((a, b) => b.value - a.value)[0];
            return bestCan ? `Try the ${bestCan.label} can (+${bestCan.value})!` : undefined;
        }
        return `Fill to ${targetLevel}. Need ${remaining} more!`;
    }, [adaptiveState, currentLevel, targetLevel]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((p) => p + 1);
    }, []);

    const handlePour = useCallback((can: FuelCan) => {
        if (isComplete || pouringCan) return;

        monitor.recordInteraction();
        setPouringCan(can.id);

        const newLevel = currentLevel + can.value;

        setTimeout(() => {
            setPouringCan(null);

            if (newLevel > targetLevel) {
                // Overflow! Drain back
                monitor.recordIncorrectAction();
                sendAdaptive({ type: 'INCORRECT_ACTION' });
                setErrorCount((p) => p + 1);
                showFeedback("Oops! Too much fuel. Let's drain it.", 'incorrect');

                // Set to overfilled momentarily, then drain
                setCurrentLevel(newLevel);
                setTimeout(() => {
                    setCurrentLevel(0);
                    if (monitor.shouldEscalate()) sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                }, 1000);
            } else {
                // Good pour
                setCurrentLevel(newLevel);
                monitor.recordCorrectAction();
                sendAdaptive({ type: 'CORRECT_ACTION' });
                 
                showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                if (newLevel === targetLevel) {
                    setTimeout(() => setShowVictory(true), 1200);
                }
            }
        }, 600);
    }, [currentLevel, targetLevel, isComplete, pouringCan, monitor, sendAdaptive, showFeedback]);

    const handleDrain = useCallback(() => {
        setCurrentLevel(0);
        showFeedback('Tank drained!', 'hint');
    }, [showFeedback]);

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;
        completeStation('fuel', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount: adaptiveState !== AdaptiveState.NORMAL ? 1 : 0,
            starsEarned: stars,
        });
    }, [errorCount, adaptiveState, completeStation, taskStartTime]);

    const liquidPercent = Math.min((currentLevel / MAX_LEVEL) * 100, 100);

    return (
        <div className="workshop-screen flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#f5f7f8' }}>
            <WorkshopHUD title="Fuel Mix Monitor" icon="local_gas_station" />

            <main className="flex-1 relative flex flex-col items-center justify-center p-4 pt-20">
                {/* Background dots */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none pattern-dots" />

                <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-8">
                    {/* LCD Target Display */}
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-2xl border-4 border-gray-400 relative z-10 transform -rotate-1 w-56 sm:w-72 text-center"
                        style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)' }}>
                        <div className="bg-[#2f3d30] rounded-lg p-2 sm:p-3" style={{ boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3)' }}>
                            <p className="font-mono text-xs sm:text-lg uppercase tracking-widest opacity-80 mb-1" style={{ color: 'var(--ws-green)' }}>Target Volume</p>
                            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-tighter" style={{ color: 'var(--ws-green)', filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.6))' }}>
                                {String(targetLevel).padStart(2, '0')} <span className="text-xl sm:text-2xl">Liters</span>
                            </div>
                        </div>
                        {/* Screws */}
                        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                            <div key={i} className={`absolute ${pos} w-3 h-3 rounded-full bg-gray-400`} style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }} />
                        ))}
                    </div>

                    {/* Tank Assembly */}
                    <div className="relative flex items-end justify-center w-full max-w-md h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                        {/* Overflow Pipe */}
                        <div className="absolute -right-8 sm:-right-16 top-12 sm:top-16 w-16 sm:w-24 h-24 sm:h-32 z-0">
                            <div className="w-full h-full border-[12px] sm:border-[16px] border-gray-300 rounded-tr-3xl border-l-0 border-b-0 absolute top-0 left-0" />
                            {isOverfilled && (
                                <motion.div
                                    className="absolute -bottom-2 -right-4 w-6 sm:w-8 h-3 sm:h-4 rounded-full"
                                    style={{ backgroundColor: 'var(--ws-blue)' }}
                                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                />
                            )}
                        </div>

                        {/* Main Tank */}
                        <div className="relative w-48 sm:w-56 md:w-64 h-full bg-blue-50/30 backdrop-blur-sm rounded-3xl border-[5px] sm:border-[6px] border-white/80 overflow-hidden z-10"
                            style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.05)' }}>
                            {/* Measurement Ticks */}
                            <div className="absolute inset-y-0 right-0 w-12 sm:w-16 flex flex-col justify-between py-4 sm:py-6 pr-2 sm:pr-3 select-none pointer-events-none z-20">
                                {Array.from({ length: 10 }, (_, i) => {
                                    const val = 10 - i;
                                    const isTarget = val === targetLevel;
                                    return (
                                        <div key={val} className="flex items-center justify-end gap-1 sm:gap-2 h-[8%] border-b-2 w-full" style={{ borderColor: isTarget && adaptiveState !== AdaptiveState.NORMAL ? 'var(--ws-yellow)' : 'rgba(148,163,184,0.3)' }}>
                                            <span className={`text-[10px] sm:text-xs font-bold ${isTarget ? 'text-[var(--ws-yellow)]' : 'text-gray-500'}`}>{val}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Liquid */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0"
                                style={{ backgroundColor: isOverfilled ? 'rgba(255,92,92,0.8)' : 'rgba(77,166,255,0.8)' }}
                                animate={{ height: `${liquidPercent}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 ws-liquid-surface" />
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="ws-bubble" />
                                    <div className="ws-bubble" />
                                    <div className="ws-bubble" />
                                    <div className="ws-bubble" />
                                </div>
                            </motion.div>

                            {/* Target line */}
                            <div
                                className="absolute left-0 right-0 h-0.5 z-30 pointer-events-none"
                                style={{
                                    bottom: `${(targetLevel / MAX_LEVEL) * 100}%`,
                                    backgroundColor: 'var(--ws-yellow)',
                                    boxShadow: adaptiveState !== AdaptiveState.NORMAL ? '0 0 8px rgba(255,217,61,0.8)' : 'none',
                                }}
                            />
                        </div>

                        {/* Tank Base */}
                        <div className="absolute -bottom-3 sm:-bottom-4 w-60 sm:w-72 md:w-80 h-6 sm:h-8 bg-gray-300 rounded-full z-0"
                            style={{ boxShadow: '0 6px 0 rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.2)' }} />
                    </div>

                    {/* Current Level */}
                    <div className="min-h-[2.5rem] flex items-center justify-center">
                        <p className="text-[var(--ws-dark)] font-bold text-base sm:text-lg bg-white/50 px-4 py-1 rounded-lg">
                            Current Level: <span className="workshop-math text-lg sm:text-xl font-extrabold" style={{ color: isOverfilled ? 'var(--ws-red)' : 'var(--ws-blue)' }}>{currentLevel}</span> Liters
                        </p>
                    </div>

                    {/* Control Deck */}
                    <div className="w-full max-w-3xl bg-white rounded-t-[2rem] sm:rounded-t-[3rem] p-6 sm:p-8 pb-8 sm:pb-12 relative z-20 border-t-4 border-white/20" style={{ boxShadow: 'var(--ws-shadow-plastic-card)' }}>
                        <div className="absolute inset-0 opacity-5 rounded-t-[3rem] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
                        <div className="flex flex-wrap justify-center items-end gap-6 sm:gap-8 md:gap-16 relative z-10">
                            {visibleCans.map((can) => (
                                <div key={can.id} className="group relative flex flex-col items-center gap-2 sm:gap-3">
                                    <motion.button
                                        className={`relative ${can.size} rounded-2xl flex items-center justify-center ws-touch-target`}
                                        style={{
                                            backgroundColor: can.color,
                                            boxShadow: '0 6px 0 rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)',
                                        }}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ y: 6, boxShadow: '0 0 0 rgba(0,0,0,0.15), inset 0 4px 8px rgba(0,0,0,0.2)' }}
                                        animate={pouringCan === can.id ? { rotate: 45, y: 10 } : { rotate: 0, y: 0 }}
                                        onClick={() => handlePour(can)}
                                        disabled={isComplete || !!pouringCan}
                                    >
                                        {/* Cap */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 sm:w-8 h-6 sm:h-8 bg-black/20 rounded-full border-4" style={{ borderColor: can.color }} />
                                        {/* Handle */}
                                        <div className="absolute top-3 sm:top-4 right-[-8px] sm:right-[-10px] w-3 sm:w-4 h-12 sm:h-16 rounded-r-lg border-l border-black/10" style={{ backgroundColor: can.color }} />
                                        {/* Label */}
                                        <div className="absolute inset-2 border-2 border-white/20 rounded-xl flex items-center justify-center">
                                            <span className="font-black text-white text-2xl sm:text-3xl md:text-4xl drop-shadow-md select-none">+{can.value}</span>
                                        </div>
                                    </motion.button>
                                    <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider workshop-heading">{can.label}</span>
                                </div>
                            ))}

                            {/* Drain Button */}
                            <div className="ml-2 sm:ml-4 md:ml-12 border-l-2 border-gray-100 pl-4 sm:pl-6 md:pl-8 flex flex-col items-center gap-2">
                                <motion.button
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center group ws-touch-target"
                                    style={{ backgroundColor: 'var(--ws-red)', boxShadow: '0 6px 0 rgba(0,0,0,0.15), 0 8px 10px rgba(0,0,0,0.2)' }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDrain}
                                >
                                    <span className="material-symbols-outlined text-white text-2xl sm:text-3xl group-hover:rotate-180 transition-transform duration-500">refresh</span>
                                </motion.button>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 sm:mt-2" style={{ color: 'var(--ws-red)' }}>Drain</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} />
            <VictoryModal isOpen={showVictory} starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1} title="Tank Filled!" subtitle="Fuel mix is perfect." nextRoute="/workshop" onNext={handleComplete} />
        </div>
    );
}
