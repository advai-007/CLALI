import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import WorkshopHUD from '../components/WorkshopHUD';
import VictoryModal from '../components/VictoryModal';
import FeedbackToast from '../components/FeedbackToast';
import HintOverlay from '../components/HintOverlay';
import { useWorkshop } from '../WorkshopContext';
import { useInteractionMonitor } from '../useInteractionMonitor';
import { AdaptiveState, POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../workshopTypes';
import '../workshop.css';

// ─── Generate bolt sequence ────────────────────────────────────────
function generateSequence(count: number): number[] {
    const arr = Array.from({ length: count }, (_, i) => i + 1);
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const BOLT_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

export default function BoltTightening() {
    const { adaptiveState, sendAdaptive, completeStation } = useWorkshop();
    const monitor = useInteractionMonitor();

    const boltCount = useMemo(() => {
        if (adaptiveState === AdaptiveState.GUIDED) return 3;
        if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) return 3;
        return 4;
    }, [adaptiveState]);

    const [sequence] = useState(() => generateSequence(boltCount));
    const [currentStep, setCurrentStep] = useState(0);
    const [showNumbers, setShowNumbers] = useState(true);
    const [shakeBolt, setShakeBolt] = useState<number | null>(null);
    const [completedBolts, setCompletedBolts] = useState<Set<number>>(new Set());
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [taskStartTime] = useState(() => Date.now());

    // Show numbers initially then hide
    useState(() => {
        const showDuration = adaptiveState === AdaptiveState.GUIDED ? 6000 : adaptiveState === AdaptiveState.REDUCED_COMPLEXITY ? 5000 : 3000;
        const timer = setTimeout(() => setShowNumbers(false), showDuration);
        return () => clearTimeout(timer);
    });

    const hintText = useMemo(() => {
        if (adaptiveState === AdaptiveState.NORMAL) return undefined;
        const nextBoltNumber = sequence[currentStep];
        if (nextBoltNumber === undefined) return undefined;
        if (adaptiveState === AdaptiveState.GUIDED) return `Tap bolt number ${nextBoltNumber} next!`;
        return `Tighten bolts in the correct order!`;
    }, [adaptiveState, sequence, currentStep]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((p) => p + 1);
    }, []);

    const handleBoltTap = useCallback((boltNumber: number) => {
        if (completedBolts.has(boltNumber)) return;
        monitor.recordInteraction();

        const expectedBolt = sequence[currentStep];

        if (boltNumber === expectedBolt) {
            // Correct bolt
            monitor.recordCorrectAction();
            sendAdaptive({ type: 'CORRECT_ACTION' });
            setCompletedBolts((prev) => new Set(prev).add(boltNumber));
            setCurrentStep((prev) => prev + 1);
             
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

            if (currentStep + 1 >= sequence.length) {
                setTimeout(() => setShowVictory(true), 800);
            }
        } else {
            // Wrong bolt
            monitor.recordIncorrectAction();
            sendAdaptive({ type: 'INCORRECT_ACTION' });
            setErrorCount((p) => p + 1);
            setShakeBolt(boltNumber);
            setTimeout(() => setShakeBolt(null), 500);
             
            showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');

            // Reset sequence progress
            setCurrentStep(0);
            setCompletedBolts(new Set());

            if (monitor.shouldEscalate()) {
                sendAdaptive({ type: 'DIFFICULTY_DETECTED' });
                setShowNumbers(true);
                setTimeout(() => {
                    if (adaptiveState !== AdaptiveState.GUIDED) setShowNumbers(false);
                }, 4000);
            }
        }
    }, [sequence, currentStep, completedBolts, monitor, sendAdaptive, showFeedback, adaptiveState]);

    const handleComplete = useCallback(() => {
        const duration = Date.now() - taskStartTime;
        const stars = errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1;
        completeStation('bolts', {
            taskDuration: duration,
            errorCount,
            adaptationStateUsed: adaptiveState,
            hintCount: adaptiveState !== AdaptiveState.NORMAL ? 1 : 0,
            starsEarned: stars,
        });
    }, [errorCount, adaptiveState, completeStation, taskStartTime]);

    // Bolt positions arranged in a circle/pattern on the "engine block"
    const boltPositions = useMemo(() => {
        const positions: { x: number; y: number }[] = [];
        const radius = 35; // percentage
        const cx = 50;
        const cy = 50;
        for (let i = 0; i < sequence.length; i++) {
            const angle = (i / sequence.length) * Math.PI * 2 - Math.PI / 2;
            positions.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle),
            });
        }
        return positions;
    }, [sequence.length]);

    return (
        <div className="workshop-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ws-base-grey)', height: '100dvh' }}>
            <WorkshopHUD title="Bolt Tightening" icon="build" currentStars={completedBolts.size} maxStars={sequence.length} />

            <main className="flex-grow flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none pattern-grid" />

                {/* Instruction */}
                <div className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center gap-3"
                    style={{ boxShadow: 'var(--ws-shadow-plastic-card)', borderBottom: '4px solid rgba(0,0,0,0.05)' }}>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl" style={{ color: 'var(--ws-yellow)' }}>info</span>
                    <p className="workshop-heading text-[var(--ws-dark)] text-sm sm:text-lg">
                        {showNumbers ? 'Remember the order! Numbers will hide soon...' : 'Tap bolts in the correct order!'}
                    </p>
                </div>

                {/* Engine Block */}
                <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px] lg:w-[500px] lg:h-[500px] rounded-3xl z-10"
                    style={{
                        backgroundColor: '#374151',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.1)',
                        border: '8px solid #4B5563',
                    }}
                >
                    {/* Metal texture overlay */}
                    <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none metal-texture" />

                    {/* Engine detail: center cylinder */}
                    <div className="absolute inset-0 m-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gray-600 border-4 border-gray-500 flex items-center justify-center"
                        style={{ boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)' }}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"
                            style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)' }}>
                            <span className="material-symbols-outlined text-gray-500 text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {completedBolts.size >= sequence.length ? 'check_circle' : 'settings'}
                            </span>
                        </div>
                    </div>

                    {/* Bolts */}
                    {sequence.map((boltNumber, idx) => {
                        const pos = boltPositions[idx];
                        const isCompleted = completedBolts.has(boltNumber);
                        const isShaking = shakeBolt === boltNumber;
                        const isNextBolt = sequence[currentStep] === boltNumber;
                        const shouldHighlight = adaptiveState !== AdaptiveState.NORMAL && isNextBolt && !isCompleted;
                        const boltColor = BOLT_COLORS[idx % BOLT_COLORS.length];

                        return (
                            <motion.button
                                key={boltNumber}
                                className="absolute w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center ws-touch-target"
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    backgroundColor: isCompleted ? 'var(--ws-green)' : '#9CA3AF',
                                    boxShadow: isCompleted
                                        ? 'inset 0 4px 8px rgba(0,0,0,0.2)'
                                        : shouldHighlight
                                            ? `0 0 20px 6px ${boltColor}88, var(--ws-shadow-plastic-up)`
                                            : 'var(--ws-shadow-plastic-up)',
                                    border: `4px solid ${isCompleted ? '#16a34a' : shouldHighlight ? boltColor : '#6B7280'}`,
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
                                onClick={() => handleBoltTap(boltNumber)}
                                disabled={isCompleted}
                            >
                                {/* Bolt head detail */}
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: isCompleted ? '#16a34a' : '#6B7280',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                                    }}>
                                    {(showNumbers || adaptiveState === AdaptiveState.GUIDED || isCompleted) ? (
                                        <span className="workshop-math text-white text-lg sm:text-xl md:text-2xl font-black select-none">
                                            {isCompleted ? '✓' : boltNumber}
                                        </span>
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400 text-xl sm:text-2xl">add</span>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}

                    {/* Gasket lines (decoration) */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute top-4 bottom-4 left-4 w-1 bg-gray-600 rounded-full opacity-50" />
                    <div className="absolute top-4 bottom-4 right-4 w-1 bg-gray-600 rounded-full opacity-50" />
                </div>

                {/* Progress indicator */}
                <div className="mt-4 sm:mt-6 flex items-center gap-2">
                    {sequence.map((boltNumber, i) => (
                        <motion.div
                            key={i}
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                            style={{
                                backgroundColor: completedBolts.has(boltNumber)
                                    ? 'var(--ws-green)'
                                    : i === currentStep
                                        ? 'var(--ws-yellow)'
                                        : '#D1D5DB',
                            }}
                            animate={i === currentStep && !completedBolts.has(boltNumber) ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    ))}
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />
            <HintOverlay adaptiveState={adaptiveState} hintText={hintText} />
            <VictoryModal isOpen={showVictory} starsEarned={errorCount === 0 ? 3 : errorCount <= 2 ? 2 : 1} title="Bolts Tightened!" subtitle="Engine secured perfectly." nextRoute="/workshop/wiring" onNext={handleComplete} />
        </div>
    );
}
