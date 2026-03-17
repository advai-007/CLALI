import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, ENCOURAGE_MESSAGES, POSITIVE_MESSAGES } from '../workshopTypes';
import '../workshop.css';

function generateSequence(count: number): number[] {
    const bolts = Array.from({ length: count }, (_, index) => index + 1);
    for (let index = bolts.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [bolts[index], bolts[swapIndex]] = [bolts[swapIndex], bolts[index]];
    }
    return bolts;
}

const BOLT_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export default function BoltTightening() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const boltCount = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            return 3;
        }
        return 4;
    }, [adaptiveState]);

    const [sequence, setSequence] = useState<number[]>(() => generateSequence(boltCount));
    const [currentStep, setCurrentStep] = useState(0);
    const [showSequence, setShowSequence] = useState(true);
    const [shakeBolt, setShakeBolt] = useState<number | null>(null);
    const [completedBolts, setCompletedBolts] = useState<Set<number>>(new Set());
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [hintCount, setHintCount] = useState(0);
    const [taskStartTime] = useState(() => Date.now());
    const revealTimerRef = useRef<number | null>(null);

    const boltIds = useMemo(
        () => Array.from({ length: sequence.length }, (_, index) => index + 1),
        [sequence.length]
    );

    const revealSequence = useCallback((duration: number) => {
        setShowSequence(true);

        if (revealTimerRef.current !== null) {
            window.clearTimeout(revealTimerRef.current);
        }

        if (adaptiveState === AdaptiveState.GUIDED) {
            return;
        }

        revealTimerRef.current = window.setTimeout(() => {
            setShowSequence(false);
        }, duration);
    }, [adaptiveState]);

    useEffect(() => {
        setSequence(generateSequence(boltCount));
        setCurrentStep(0);
        setCompletedBolts(new Set());
        setShowVictory(false);
    }, [boltCount]);

    useEffect(() => {
        const duration =
            adaptiveState === AdaptiveState.GUIDED
                ? 6000
                : adaptiveState === AdaptiveState.REDUCED_COMPLEXITY
                    ? 5000
                    : 3000;

        revealSequence(duration);

        return () => {
            if (revealTimerRef.current !== null) {
                window.clearTimeout(revealTimerRef.current);
            }
        };
    }, [adaptiveState, sequence, revealSequence]);

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) {
            return undefined;
        }

        const nextBolt = sequence[currentStep];
        if (nextBolt === undefined) {
            return undefined;
        }

        if (adaptiveState === AdaptiveState.GUIDED) {
            return `Tap bolt ${nextBolt} next.`;
        }

        return showSequence
            ? 'Memorize the preview row, then match it on the engine.'
            : 'Follow the preview order from left to right.';
    }, [adaptiveState, currentStep, sequence, showSequence]);

    const showFeedback = useCallback((message: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(message);
        setFeedbackType(type);
        setFeedbackId((previous) => previous + 1);
    }, []);

    const handleBoltTap = useCallback((boltId: number) => {
        if (completedBolts.has(boltId) || showVictory) {
            return;
        }

        monitor.recordInteraction();
        const expectedBolt = sequence[currentStep];

        if (boltId === expectedBolt) {
            monitor.recordCorrectAction();
            sendAdaptive({ type: 'CORRECT_ACTION' });
            setCompletedBolts((previous) => {
                const next = new Set(previous);
                next.add(boltId);
                return next;
            });
            setCurrentStep((previous) => previous + 1);
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

            if (currentStep + 1 >= sequence.length) {
                window.setTimeout(() => setShowVictory(true), 800);
            }
            return;
        }

        monitor.recordIncorrectAction();
        sendAdaptive({ type: 'INCORRECT_ACTION' });
        setErrorCount((previous) => previous + 1);
        setShakeBolt(boltId);
        window.setTimeout(() => setShakeBolt(null), 500);
        showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
        setCurrentStep(0);
        setCompletedBolts(new Set());

        if (monitor.shouldEscalate()) {
            sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
        }

        revealSequence(4000);
    }, [completedBolts, currentStep, monitor, revealSequence, sendAdaptive, sequence, showFeedback, showVictory]);

    const handleRevealOrder = useCallback(() => {
        setHintCount((previous) => previous + 1);
        sendAdaptive({ type: 'HINT_SHOWN' });
        showFeedback('Sequence shown again. Watch the preview row.', 'hint');
        revealSequence(4000);
    }, [revealSequence, sendAdaptive, showFeedback]);

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;

        completeStation('bolts', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount,
            starsEarned: stars,
        });
    }, [adaptiveState, completeStation, errorCount, hintCount, taskStartTime]);

    const boltPositions = useMemo(() => {
        const positions: { x: number; y: number }[] = [];
        const radius = 35;
        const centerX = 50;
        const centerY = 50;

        for (let index = 0; index < boltIds.length; index += 1) {
            const angle = (index / boltIds.length) * Math.PI * 2 - Math.PI / 2;
            positions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            });
        }

        return positions;
    }, [boltIds.length]);

    return (
        <div className="workshop-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ws-base-grey)', height: '100dvh' }}>
            <WorkshopHUD title="Bolt Tightening" icon="build" currentStars={completedBolts.size} maxStars={sequence.length} />

            <main className="flex-grow flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none pattern-grid" />

                <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-center gap-3">
                    <div
                        className="bg-white/90 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center gap-3"
                        style={{ boxShadow: 'var(--ws-shadow-plastic-card)', borderBottom: '4px solid rgba(0,0,0,0.05)' }}
                    >
                        <span className="material-symbols-outlined text-2xl sm:text-3xl" style={{ color: 'var(--ws-yellow)' }}>info</span>
                        <p className="workshop-heading text-[var(--ws-dark)] text-sm sm:text-lg">
                            {showSequence ? 'Memorize the preview order, then tap those bolt numbers.' : 'Tap the bolts in the same order as the preview row.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleRevealOrder}
                        className="bg-white px-4 py-3 rounded-2xl workshop-heading text-sm sm:text-base text-[var(--ws-dark)] border-b-4 border-black/10 hover:-translate-y-0.5 transition-transform ws-touch-target"
                    >
                        Show Order
                    </button>
                </div>

                <div className="mb-4 rounded-[24px] bg-slate-900/90 px-4 py-3 text-white shadow-xl">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Preview Order</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Step {Math.min(currentStep + 1, sequence.length)}/{sequence.length}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {sequence.map((boltId, index) => {
                            const isCurrent = index === currentStep;
                            const isPassed = index < currentStep;

                            return (
                                <motion.div
                                    key={`${boltId}-${index}`}
                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center workshop-math text-lg sm:text-xl font-black"
                                    style={{
                                        background: isPassed
                                            ? 'linear-gradient(135deg, #4ADE80, #22C55E)'
                                            : isCurrent
                                                ? 'linear-gradient(135deg, #FACC15, #F59E0B)'
                                                : 'rgba(255,255,255,0.08)',
                                        color: isPassed || isCurrent ? '#111827' : '#E5E7EB',
                                        border: '2px solid rgba(255,255,255,0.08)',
                                    }}
                                    animate={isCurrent && !showVictory ? { scale: [1, 1.08, 1] } : {}}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                >
                                    {showSequence || adaptiveState === AdaptiveState.GUIDED || isPassed ? boltId : '?'}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] rounded-3xl z-10"
                    style={{
                        backgroundColor: '#374151',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
                        border: '8px solid #4B5563',
                    }}
                >
                    <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none metal-texture" />

                    <div
                        className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-600 border-4 border-gray-500 flex items-center justify-center"
                        style={{ boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)' }}
                    >
                        <div
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"
                            style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)' }}
                        >
                            <span className="material-symbols-outlined text-gray-500 text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {completedBolts.size >= sequence.length ? 'check_circle' : 'settings'}
                            </span>
                        </div>
                    </div>

                    {boltIds.map((boltId, index) => {
                        const position = boltPositions[index];
                        const isCompleted = completedBolts.has(boltId);
                        const isShaking = shakeBolt === boltId;
                        const isNextBolt = sequence[currentStep] === boltId;
                        const shouldHighlight = adaptiveState !== AdaptiveState.NORMAL && isNextBolt && !isCompleted;
                        const boltColor = BOLT_COLORS[(boltId - 1) % BOLT_COLORS.length];

                        return (
                            <motion.button
                                key={boltId}
                                type="button"
                                className="absolute w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center ws-touch-target"
                                style={{
                                    left: `${position.x}%`,
                                    top: `${position.y}%`,
                                    backgroundColor: isCompleted ? 'var(--ws-green)' : '#9CA3AF',
                                    boxShadow: isCompleted
                                        ? 'inset 0 4px 8px rgba(0,0,0,0.2)'
                                        : shouldHighlight
                                            ? `0 0 20px 6px ${boltColor}88, var(--ws-shadow-plastic-up)`
                                            : 'var(--ws-shadow-plastic-up)',
                                    border: `4px solid ${isCompleted ? '#16A34A' : shouldHighlight ? boltColor : '#6B7280'}`,
                                }}
                                animate={
                                    isShaking
                                        ? { x: [-4, 4, -4, 4, 0], rotate: [-5, 5, -5, 5, 0] }
                                        : shouldHighlight
                                            ? { scale: [1, 1.1, 1] }
                                            : {}
                                }
                                transition={
                                    isShaking
                                        ? { duration: 0.4 }
                                        : shouldHighlight
                                            ? { duration: 1.5, repeat: Infinity }
                                            : {}
                                }
                                whileHover={isCompleted ? {} : { scale: 1.1 }}
                                whileTap={isCompleted ? {} : { scale: 0.9 }}
                                onClick={() => handleBoltTap(boltId)}
                                disabled={isCompleted}
                            >
                                <div
                                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: isCompleted ? '#16A34A' : '#6B7280',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <span className="workshop-math text-white text-lg sm:text-xl md:text-2xl font-black select-none">
                                        {isCompleted ? 'X' : boltId}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}

                    <div className="absolute top-4 left-4 right-4 h-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute top-4 bottom-4 left-4 w-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute top-4 bottom-4 right-4 w-1 bg-gray-600 rounded-full opacity-50" />
                </div>

                <div className="mt-4 sm:mt-6 flex items-center gap-2">
                    {sequence.map((boltId, index) => (
                        <motion.div
                            key={`${boltId}-${index}`}
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                            style={{
                                backgroundColor: index < currentStep
                                    ? 'var(--ws-green)'
                                    : index === currentStep
                                        ? 'var(--ws-yellow)'
                                        : '#D1D5DB',
                            }}
                            animate={index === currentStep && currentStep < sequence.length ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    ))}
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} />
            <VictoryModal
                isOpen={showVictory}
                starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1}
                title="Bolts Tightened!"
                subtitle="Engine secured perfectly."
                nextRoute="/workshop/wiring"
                onNext={handleComplete}
            />
        </div>
    );
}
