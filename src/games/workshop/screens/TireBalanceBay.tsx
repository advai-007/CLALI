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

interface WeightBlock {
    id: string;
    value: number;
    color: string;
    borderColor: string;
    textColor: string;
    label: string;
    size: string;
}

const ALL_WEIGHTS: WeightBlock[] = [
    { id: 'w1', value: 1, color: '#E2E8F0', borderColor: '#94A3B8', textColor: '#4B5563', label: 'Unit', size: 'w-16 h-16 sm:w-20 sm:h-20' },
    { id: 'w2', value: 2, color: '#93C5FD', borderColor: '#3B82F6', textColor: '#1E3A8A', label: 'Units', size: 'w-20 h-20 sm:w-24 sm:h-24' },
    { id: 'w5', value: 5, color: '#FCD34D', borderColor: '#D97706', textColor: '#78350F', label: 'Heavy', size: 'w-24 h-24 sm:w-28 sm:h-28' },
];

const SLOT_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

export default function TireBalanceBay() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const [targetWeight] = useState(() => {
        const targets = [6, 8, 10];
         
        return targets[Math.floor(Math.random() * targets.length)];
    });

    const [slots, setSlots] = useState<Record<string, number | null>>({
        top: null, bottom: null, left: null, right: null,
    });
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [taskStartTime] = useState(() => Date.now());
    const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const currentWeight = useMemo((): number =>
        Object.values(slots).reduce<number>((sum, v) => sum + (v || 0), 0),
        [slots]
    );

    const isBalanced = currentWeight === targetWeight;
    const isOverfilled = currentWeight > targetWeight;

    const visibleWeights = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED) {
            const remaining = targetWeight - currentWeight;
            if (remaining <= 0) return [];
            return ALL_WEIGHTS.filter((w) => w.value <= remaining);
        }
        if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            return ALL_WEIGHTS.filter((w) => w.value <= targetWeight - currentWeight || targetWeight - currentWeight <= 0);
        }
        return ALL_WEIGHTS;
    }, [adaptiveState, currentWeight, targetWeight]);

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) return undefined;
        const remaining = targetWeight - currentWeight;
        if (remaining <= 0) return undefined;
        if (adaptiveState === AdaptiveState.GUIDED) return `Add ${remaining} more to reach ${targetWeight}!`;
        return `Target: ${targetWeight}. You need ${remaining} more!`;
    }, [adaptiveState, currentWeight, targetWeight]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    const findNearestSlot = useCallback((point: { x: number; y: number }): string | null => {
        for (const pos of SLOT_POSITIONS) {
            if (slots[pos] !== null) continue;
            const el = slotRefs.current[pos];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            if (Math.hypot(point.x - cx, point.y - cy) < 80) return pos;
        }
        return null;
    }, [slots]);

    const handleDragEnd = useCallback(
        (weight: WeightBlock, info: { point: { x: number; y: number } }) => {
            const slot = findNearestSlot(info.point);
            if (!slot) return;

            const newTotal = currentWeight + weight.value;

            if (newTotal > targetWeight) {
                // Overfilled
                monitor.recordIncorrectAction();
                sendAdaptive({ type: 'INCORRECT_ACTION' });
                setErrorCount((p) => p + 1);
                 
                showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
                if (monitor.shouldEscalate()) sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                return;
            }

            // Place the weight
            setSlots((prev) => ({ ...prev, [slot]: weight.value }));
            monitor.recordCorrectAction();
            sendAdaptive({ type: 'CORRECT_ACTION' });
             
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

            if (newTotal === targetWeight) {
                setTimeout(() => setShowVictory(true), 1000);
            }
        },
        [findNearestSlot, currentWeight, targetWeight, monitor, sendAdaptive, showFeedback]
    );

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;
        completeStation('tires', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount: adaptiveState !== AdaptiveState.NORMAL ? 1 : 0,
            starsEarned: stars,
        });
    }, [errorCount, adaptiveState, completeStation, taskStartTime]);

    return (
        <div className="workshop-screen flex flex-col w-full overflow-hidden" style={{ backgroundColor: 'var(--ws-base-grey)', height: '100dvh' }}>
            <WorkshopHUD title="Tire Balance Bay" icon="tire_repair" />

            <main className="flex-1 flex flex-col md:flex-row h-full w-full relative pt-20">
                {/* Work Zone */}
                <section className="relative flex-1 pattern-grid flex flex-col items-center justify-center p-6 sm:p-10">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

                    {/* Lift Arm */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-[40%] bg-[var(--ws-dark)] rounded-t-3xl border-x-6 sm:border-x-8 border-t-6 sm:border-t-8 border-black/10 z-0" style={{ boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2)' }} />

                    {/* Digital Readout */}
                    <div className="relative z-10 mb-6 sm:mb-8 w-full max-w-xs sm:max-w-sm">
                        <div className="bg-[var(--ws-dark)] rounded-2xl p-3 sm:p-4 border-b-6 sm:border-b-8 border-black/20" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-white/60 workshop-heading text-xs uppercase tracking-widest">System Status</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isBalanced ? 'var(--ws-green)' : 'var(--ws-red)' }} />
                                </div>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 sm:p-4 flex justify-between items-center relative overflow-hidden" style={{ boxShadow: 'var(--ws-shadow-plastic-down)' }}>
                                <div className="absolute inset-0 ws-scanlines z-20" />
                                <div className="flex flex-col">
                                    <span className="workshop-math text-xs sm:text-sm uppercase opacity-80" style={{ color: 'var(--ws-green)' }}>Target</span>
                                    <span className="workshop-math text-3xl sm:text-4xl tabular-nums leading-none tracking-tight" style={{ color: 'var(--ws-green)', filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.5))' }}>{targetWeight}</span>
                                </div>
                                <div className="h-10 w-[2px] bg-white/10 mx-3 sm:mx-4" />
                                <div className="flex flex-col items-end">
                                    <span className="workshop-math text-xs sm:text-sm uppercase opacity-80" style={{ color: isOverfilled ? 'var(--ws-red)' : isBalanced ? 'var(--ws-green)' : 'var(--ws-red)' }}>Current</span>
                                    <span className="workshop-math text-3xl sm:text-4xl tabular-nums leading-none tracking-tight" style={{ color: isOverfilled ? 'var(--ws-red)' : isBalanced ? 'var(--ws-green)' : 'var(--ws-red)', filter: `drop-shadow(0 0 8px ${isBalanced ? 'rgba(74,222,128,0.5)' : 'rgba(255,92,92,0.5)'})` }}>{currentWeight}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Wheel */}
                    <motion.div
                        className="relative z-10 group"
                        animate={isBalanced ? { rotate: [0, 360] } : { rotate: [-3, 3, -3] }}
                        transition={isBalanced ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0.3, repeat: Infinity }}
                    >
                        {/* Tire Rubber */}
                        <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full flex items-center justify-center relative"
                            style={{ backgroundColor: '#2a2f35', border: '8px solid #1f2329', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
                            {/* Tread */}
                            <div className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-dashed opacity-50" style={{ borderColor: 'rgba(52,57,64,0.5)' }} />
                            {/* Silver Rim */}
                            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 rounded-full flex items-center justify-center relative"
                                style={{ background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4)' }}>
                                {/* Hub */}
                                <div className="absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 bg-[var(--ws-dark)] rounded-full z-20 flex items-center justify-center"
                                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {['top-1.5', 'bottom-1.5', 'left-1.5', 'right-1.5'].map((p, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 bg-gray-300 rounded-full absolute ${p} ${i >= 2 ? '' : ''}`}
                                            style={i === 0 ? { top: '6px', left: '50%', transform: 'translateX(-50%)' } : i === 1 ? { bottom: '6px', left: '50%', transform: 'translateX(-50%)' } : i === 2 ? { left: '6px', top: '50%', transform: 'translateY(-50%)' } : { right: '6px', top: '50%', transform: 'translateY(-50%)' }} />
                                    ))}
                                </div>
                                {/* Weight Slots */}
                                {SLOT_POSITIONS.map((pos) => {
                                    const posStyle: Record<string, React.CSSProperties> = {
                                        top: { position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)' },
                                        bottom: { position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)' },
                                        left: { position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)' },
                                        right: { position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' },
                                    };
                                    const isVertical = pos === 'left' || pos === 'right';
                                    const filled = slots[pos];
                                    const shouldGlow = adaptiveState !== AdaptiveState.NORMAL && !filled;

                                    return (
                                        <div
                                            key={pos}
                                            ref={(el) => { slotRefs.current[pos] = el; }}
                                            className={`${isVertical ? 'h-10 w-6 sm:h-14 sm:w-8 md:h-16 md:w-10' : 'w-10 h-6 sm:w-14 sm:h-8 md:w-16 md:h-10'} rounded-md flex items-center justify-center transition-colors`}
                                            style={{
                                                ...posStyle[pos],
                                                backgroundColor: filled
                                                    ? ALL_WEIGHTS.find((w) => w.value === filled)?.color || '#E2E8F0'
                                                    : 'rgba(0,0,0,0.2)',
                                                border: `2px ${filled ? 'solid' : 'dashed'} ${shouldGlow ? 'var(--ws-yellow)' : 'rgba(0,0,0,0.3)'}`,
                                                boxShadow: shouldGlow ? '0 0 12px rgba(255,217,61,0.6)' : filled ? 'var(--ws-shadow-plastic-up)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            {filled && (
                                                <motion.span
                                                    className="workshop-math text-xs sm:text-sm font-black"
                                                    style={{ color: ALL_WEIGHTS.find((w) => w.value === filled)?.textColor }}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 400 }}
                                                >
                                                    {filled}
                                                </motion.span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Instruction */}
                    <div className="absolute bottom-4 sm:bottom-6 bg-white/80 px-4 sm:px-6 py-2 rounded-full backdrop-blur text-[var(--ws-dark)] workshop-heading text-xs sm:text-sm border border-white"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        Drag weights to the empty slots!
                    </div>
                </section>

                {/* Tool Tray */}
                <aside className="relative w-full md:w-[280px] lg:w-[320px] wood-texture flex flex-col border-t-6 md:border-t-0 md:border-l-6"
                    style={{ backgroundColor: 'var(--ws-orange)', borderColor: 'rgba(249,115,22,0.3)', boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' }}>
                    <div className="p-4 sm:p-6 pb-2 text-center md:text-left">
                        <h2 className="text-white ws-text-shadow workshop-heading text-lg sm:text-xl uppercase tracking-wider mb-1">Tool Tray</h2>
                        <div className="h-1 w-full bg-black/10 rounded-full" />
                    </div>
                    <div className="flex-1 p-4 sm:p-6 flex flex-row md:flex-col gap-4 sm:gap-6 items-center justify-center md:justify-start">
                        {visibleWeights.map((weight) => (
                            <motion.div
                                key={weight.id}
                                className={`relative cursor-grab active:cursor-grabbing ${weight.size} rounded-xl flex flex-col items-center justify-center ws-touch-target`}
                                style={{
                                    backgroundColor: weight.color,
                                    boxShadow: 'var(--ws-shadow-plastic-up)',
                                    borderBottom: `6px solid ${weight.borderColor}`,
                                }}
                                drag
                                dragSnapToOrigin
                                dragElastic={0.5}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileDrag={{ scale: 1.15, zIndex: 9999 }}
                                onDragStart={() => monitor.recordInteraction()}
                                onDragEnd={(_, info) => handleDragEnd(weight, info)}
                            >
                                <div className="absolute top-2 inset-x-2 h-1/2 bg-white/40 rounded-t-lg pointer-events-none" />
                                <span className="workshop-math text-3xl sm:text-4xl font-black select-none" style={{ color: weight.textColor }}>{weight.value}</span>
                                <span className="workshop-heading text-[10px] uppercase tracking-wider mt-1 select-none" style={{ color: weight.borderColor }}>{weight.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </aside>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} />
            <VictoryModal isOpen={showVictory} starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1} title="Balanced!" subtitle="Great job fixing the tire." nextRoute="/workshop/bolts" onNext={handleComplete} />
        </div>
    );
}
