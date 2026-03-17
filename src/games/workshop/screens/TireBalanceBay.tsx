import { useState, useCallback, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, ENCOURAGE_MESSAGES, POSITIVE_MESSAGES } from '../workshopTypes';
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

interface TireLevel {
    target: number;
    title: string;
    subtitle: string;
}

const ALL_WEIGHTS: WeightBlock[] = [
    { id: 'w1', value: 1, color: '#E2E8F0', borderColor: '#94A3B8', textColor: '#4B5563', label: 'Unit', size: 'w-16 h-16 sm:w-20 sm:h-20' },
    { id: 'w2', value: 2, color: '#93C5FD', borderColor: '#3B82F6', textColor: '#1E3A8A', label: 'Duo', size: 'w-20 h-20 sm:w-24 sm:h-24' },
    { id: 'w3', value: 3, color: '#C4B5FD', borderColor: '#8B5CF6', textColor: '#4C1D95', label: 'Triple', size: 'w-22 h-22 sm:w-24 sm:h-24' },
    { id: 'w5', value: 5, color: '#FCD34D', borderColor: '#D97706', textColor: '#78350F', label: 'Heavy', size: 'w-24 h-24 sm:w-28 sm:h-28' },
];

const TIRE_LEVELS: TireLevel[] = [
    { target: 6, title: 'Level 1', subtitle: 'Warm up with a simple balance.' },
    { target: 9, title: 'Level 2', subtitle: 'Use a smarter weight mix.' },
    { target: 14, title: 'Level 3', subtitle: 'Finish with the heaviest wheel.' },
];

const SLOT_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

function createEmptySlots() {
    return {
        top: null,
        bottom: null,
        left: null,
        right: null,
    } as Record<(typeof SLOT_POSITIONS)[number], number | null>;
}

export default function TireBalanceBay() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const [levelIndex, setLevelIndex] = useState(0);
    const [slots, setSlots] = useState<Record<(typeof SLOT_POSITIONS)[number], number | null>>(createEmptySlots);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [hintCount, setHintCount] = useState(0);
    const [isAdvancingLevel, setIsAdvancingLevel] = useState(false);
    const [taskStartTime] = useState(() => Date.now());
    const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const currentLevel = TIRE_LEVELS[levelIndex];
    const targetWeight = currentLevel.target;
    const currentWeight = useMemo(
        () => Object.values(slots).reduce<number>((sum, value) => sum + (value || 0), 0),
        [slots]
    );
    const remainingWeight = Math.max(targetWeight - currentWeight, 0);
    const isBalanced = currentWeight === targetWeight;
    const isOverfilled = currentWeight > targetWeight;
    const completedLevels = Math.min(
        levelIndex + (isBalanced || isAdvancingLevel || showVictory ? 1 : 0),
        TIRE_LEVELS.length
    );

    const visibleWeights = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED) {
            if (remainingWeight <= 0) {
                return [];
            }
            return ALL_WEIGHTS.filter((weight) => weight.value <= remainingWeight);
        }

        if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            return ALL_WEIGHTS.filter((weight) => weight.value <= remainingWeight || remainingWeight === 0);
        }

        return ALL_WEIGHTS;
    }, [adaptiveState, remainingWeight]);

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) {
            return undefined;
        }

        if (remainingWeight <= 0) {
            return undefined;
        }

        if (adaptiveState === AdaptiveState.GUIDED) {
            return `Level ${levelIndex + 1}: add ${remainingWeight} more to reach ${targetWeight}.`;
        }

        return `Level ${levelIndex + 1}: target ${targetWeight}, remaining ${remainingWeight}.`;
    }, [adaptiveState, levelIndex, remainingWeight, targetWeight]);

    const showFeedback = useCallback((message: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(message);
        setFeedbackType(type);
        setFeedbackId((previous) => previous + 1);
    }, []);

    const resetSlots = useCallback(() => {
        setSlots(createEmptySlots());
    }, []);

    const findNearestSlot = useCallback((point: { x: number; y: number }): string | null => {
        for (const position of SLOT_POSITIONS) {
            if (slots[position] !== null) {
                continue;
            }

            const element = slotRefs.current[position];
            if (!element) {
                continue;
            }

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            if (Math.hypot(point.x - centerX, point.y - centerY) < 80) {
                return position;
            }
        }

        return null;
    }, [slots]);

    const handleDragEnd = useCallback((weight: WeightBlock, info: { point: { x: number; y: number } }) => {
        if (showVictory || isAdvancingLevel) {
            return;
        }

        const slot = findNearestSlot(info.point);
        if (!slot) {
            return;
        }

        const newTotal = currentWeight + weight.value;

        if (newTotal > targetWeight) {
            monitor.recordIncorrectAction();
            sendAdaptive({ type: 'INCORRECT_ACTION' });
            setErrorCount((previous) => previous + 1);
            showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');

            if (monitor.shouldEscalate()) {
                sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
            }
            return;
        }

        setSlots((previous) => ({ ...previous, [slot]: weight.value }));
        monitor.recordCorrectAction();
        sendAdaptive({ type: 'CORRECT_ACTION' });

        if (newTotal !== targetWeight) {
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');
            return;
        }

        const isFinalLevel = levelIndex === TIRE_LEVELS.length - 1;

        if (isFinalLevel) {
            window.setTimeout(() => setShowVictory(true), 900);
            return;
        }

        setIsAdvancingLevel(true);
        showFeedback(`Wheel balanced. ${TIRE_LEVELS[levelIndex + 1].title} is up next!`, 'hint');
        window.setTimeout(() => {
            setLevelIndex((previous) => previous + 1);
            resetSlots();
            setIsAdvancingLevel(false);
        }, 1100);
    }, [
        currentWeight,
        findNearestSlot,
        isAdvancingLevel,
        levelIndex,
        monitor,
        resetSlots,
        sendAdaptive,
        showFeedback,
        showVictory,
        targetWeight,
    ]);

    const handleResetWheel = useCallback(() => {
        resetSlots();
        setHintCount((previous) => previous + 1);
        sendAdaptive({ type: 'HINT_SHOWN' });
        showFeedback('Wheel reset. Try a new combination.', 'hint');
    }, [resetSlots, sendAdaptive, showFeedback]);

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 3 ? 2 : 1;

        completeStation('tires', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount,
            starsEarned: stars,
        });
    }, [adaptiveState, completeStation, errorCount, hintCount, taskStartTime]);

    return (
        <div className="workshop-screen flex flex-col w-full overflow-hidden" style={{ backgroundColor: 'var(--ws-base-grey)', height: '100dvh' }}>
            <WorkshopHUD title="Tire Balance Bay" icon="tire_repair" currentStars={completedLevels} maxStars={TIRE_LEVELS.length} />

            <main className="flex-1 flex flex-col md:flex-row h-full w-full relative pt-20">
                <section className="relative flex-1 pattern-grid flex flex-col items-center justify-center p-6 sm:p-10">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-[40%] bg-[var(--ws-dark)] rounded-t-3xl border-x-6 sm:border-x-8 border-t-6 sm:border-t-8 border-black/10 z-0" style={{ boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2)' }} />

                    <div className="relative z-10 mb-6 sm:mb-8 w-full max-w-xs sm:max-w-sm">
                        <div className="bg-[var(--ws-dark)] rounded-2xl p-3 sm:p-4 border-b-6 sm:border-b-8 border-black/20" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-white/60 workshop-heading text-xs uppercase tracking-widest">System Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isBalanced ? 'var(--ws-green)' : 'var(--ws-red)' }} />
                                    <span className="text-[10px] uppercase tracking-widest text-white/60">
                                        Level {levelIndex + 1}
                                    </span>
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

                    <div className="mb-4 w-full max-w-xs sm:max-w-sm rounded-2xl bg-white/90 px-4 py-3 border border-white shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="workshop-heading text-sm text-[var(--ws-dark)]">
                                    {currentLevel.title}
                                </p>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    {currentLevel.subtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetWheel}
                                className="rounded-full bg-slate-100 px-3 py-2 workshop-heading text-xs text-[var(--ws-dark)] border border-slate-200 ws-touch-target"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                        {TIRE_LEVELS.map((level, index) => (
                            <div
                                key={level.title}
                                className="h-3 w-14 rounded-full"
                                style={{
                                    background: index < completedLevels
                                        ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                                        : index === levelIndex
                                            ? 'linear-gradient(90deg, #FACC15, #F59E0B)'
                                            : '#CBD5E1',
                                }}
                            />
                        ))}
                    </div>

                    <motion.div
                        className="relative z-10 group"
                        animate={isBalanced ? { rotate: [0, 360] } : { rotate: [-3, 3, -3] }}
                        transition={isBalanced ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0.3, repeat: Infinity }}
                    >
                        <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full flex items-center justify-center relative" style={{ backgroundColor: '#2A2F35', border: '8px solid #1F2329', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
                            <div className="absolute inset-0 rounded-full border-[12px] sm:border-[16px] border-dashed opacity-50" style={{ borderColor: 'rgba(52,57,64,0.5)' }} />
                            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 rounded-full flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4)' }}>
                                <div className="absolute inset-0 m-auto w-10 h-10 sm:w-12 sm:h-12 bg-[var(--ws-dark)] rounded-full z-20 flex items-center justify-center" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {[0, 1, 2, 3].map((index) => (
                                        <div
                                            key={index}
                                            className="w-1.5 h-1.5 bg-gray-300 rounded-full absolute"
                                            style={
                                                index === 0
                                                    ? { top: '6px', left: '50%', transform: 'translateX(-50%)' }
                                                    : index === 1
                                                        ? { bottom: '6px', left: '50%', transform: 'translateX(-50%)' }
                                                        : index === 2
                                                            ? { left: '6px', top: '50%', transform: 'translateY(-50%)' }
                                                            : { right: '6px', top: '50%', transform: 'translateY(-50%)' }
                                            }
                                        />
                                    ))}
                                </div>

                                {SLOT_POSITIONS.map((position) => {
                                    const positionStyle: Record<string, CSSProperties> = {
                                        top: { position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)' },
                                        bottom: { position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)' },
                                        left: { position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)' },
                                        right: { position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' },
                                    };
                                    const isVertical = position === 'left' || position === 'right';
                                    const filled = slots[position];
                                    const shouldGlow = adaptiveState !== AdaptiveState.NORMAL && !filled;

                                    return (
                                        <div
                                            key={position}
                                            ref={(element) => { slotRefs.current[position] = element; }}
                                            className={`${isVertical ? 'h-10 w-6 sm:h-14 sm:w-8 md:h-16 md:w-10' : 'w-10 h-6 sm:w-14 sm:h-8 md:w-16 md:h-10'} rounded-md flex items-center justify-center transition-colors`}
                                            style={{
                                                ...positionStyle[position],
                                                backgroundColor: filled
                                                    ? ALL_WEIGHTS.find((weight) => weight.value === filled)?.color || '#E2E8F0'
                                                    : 'rgba(0,0,0,0.2)',
                                                border: `2px ${filled ? 'solid' : 'dashed'} ${shouldGlow ? 'var(--ws-yellow)' : 'rgba(0,0,0,0.3)'}`,
                                                boxShadow: shouldGlow ? '0 0 12px rgba(255,217,61,0.6)' : filled ? 'var(--ws-shadow-plastic-up)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            {filled && (
                                                <motion.span
                                                    className="workshop-math text-xs sm:text-sm font-black"
                                                    style={{ color: ALL_WEIGHTS.find((weight) => weight.value === filled)?.textColor }}
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

                </section>

                <aside className="relative w-full md:w-[280px] lg:w-[320px] wood-texture flex flex-col border-t-6 md:border-t-0 md:border-l-6" style={{ backgroundColor: 'var(--ws-orange)', borderColor: 'rgba(249,115,22,0.3)', boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' }}>
                    <div className="p-4 sm:p-6 pb-2 text-center md:text-left">
                        <h2 className="text-white ws-text-shadow workshop-heading text-lg sm:text-xl uppercase tracking-wider mb-1">Tool Tray</h2>
                        <div className="h-1 w-full bg-black/10 rounded-full" />
                    </div>
                    <div className="px-4 sm:px-6">
                        <div className="rounded-2xl bg-white/25 px-4 py-3 text-white">
                            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Remaining</p>
                            <p className="workshop-heading text-3xl">{remainingWeight}</p>
                        </div>
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
            <VictoryModal
                isOpen={showVictory}
                starsEarned={errorCount === 0 ? 3 : errorCount <= 3 ? 2 : 1}
                title="All Tires Balanced!"
                subtitle="You cleared every tire level."
                nextRoute="/workshop/bolts"
                onNext={handleComplete}
            />
        </div>
    );
}
