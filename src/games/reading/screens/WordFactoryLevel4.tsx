import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import WordFactoryHUD from '../components/WordFactoryHUD';
import ConveyorBelt from '../components/ConveyorBelt';
import VictoryModal from '../../workshop/components/VictoryModal';
import FeedbackToast from '../../workshop/components/FeedbackToast';
import { useReading } from '../ReadingContext';
import { useReadingMonitor } from '../useReadingMonitor';
import { useReadAloud } from '../hooks/useReadAloud';
import { POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../../workshop/workshopTypes';
import { CharacterGuide } from '../../../components/shared/CharacterGuide';
import '../../workshop/workshop.css';

// ─── Level 4 Data (Concrete Nouns - Distinct Audio) ────────────────
const LEVEL_TASKS = [
    { id: 'apple', word: 'APPLE', distractors: ['DOG', 'SUN', 'BOOK'] },
    { id: 'bird', word: 'BIRD', distractors: ['FISH', 'TREE', 'MILK'] },
    { id: 'cake', word: 'CAKE', distractors: ['LAMP', 'FROG', 'BIKE'] },
    { id: 'drum', word: 'DRUM', distractors: ['CAT', 'BELL', 'STAR'] },
    { id: 'fish', word: 'FISH', distractors: ['BIRD', 'GRASS', 'HAT'] },
    { id: 'goat', word: 'GOAT', distractors: ['SHIP', 'DUCK', 'FIRE'] },
    { id: 'house', word: 'HOUSE', distractors: ['MOUSE', 'PLANE', 'GLOVE'] },
    { id: 'jelly', word: 'JELLY', distractors: ['MOON', 'SOCK', 'BEAR'] },
    { id: 'kite', word: 'KITE', distractors: ['CLOUD', 'LEAF', 'BONE'] },
    { id: 'lion', word: 'LION', distractors: ['WOLF', 'KEY', 'DRUM'] },
    { id: 'moon', word: 'MOON', distractors: ['SUN', 'STAR', 'RAIN'] },
    { id: 'nest', word: 'NEST', distractors: ['EGG', 'TREE', 'WING'] },
];

export default function WordFactoryLevel4() {
    const navigate = useNavigate();
    const {
        assistLevel,
        trackClick,
        trackError,
        trackMouseMove,
        resetAdaptation,
        sendAdaptive,
        addStars,
        setCurrentLevel
    } = useReading();
    const monitor = useReadingMonitor();

    const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
    const task = LEVEL_TASKS[currentTaskIdx];

    const [placedWord, setPlacedWord] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedWord, setDraggedWord] = useState<string | null>(null);

    const dropZoneRef = useRef<HTMLDivElement>(null);

    const { speak, isSpeaking, enableReadAloud } = useReadAloud();

    // Auto-speak on new task
    useEffect(() => {
        const timer = setTimeout(() => speak(task.word), 500);
        return () => clearTimeout(timer);
    }, [currentTaskIdx, speak, task.word]);

    // Adaptive Auto-speak
    useEffect(() => {
        if (enableReadAloud && !placedWord && !isSpeaking) {
            speak(task.word, true);
        }
    }, [enableReadAloud, placedWord, isSpeaking, speak, task.word]);

    // Reset adaptation metrics when task changes
    useEffect(() => {
        resetAdaptation(`level4-${currentTaskIdx}`);
    }, [currentTaskIdx, resetAdaptation]);

    // Track mouse movement for jitter detection
    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    // 4-stage assist flags
    const isReduced = assistLevel >= 2;
    const isGlowing = assistLevel >= 3;
    const isReveal = assistLevel >= 4;

    // Belt items based on assist stage
    const beltItems = useMemo(() => {
        let choices = [task.word, ...task.distractors];
        if (isReveal) {
            choices = [task.word];
        } else if (isReduced) {
            choices = [task.word, task.distractors[0]];
        }

        return choices.sort().map(w => {
            const isCorrect = w === task.word;
            let bgColor = '#E5E7EB';
            if (isCorrect && isReveal) bgColor = '#FDE68A';
            return { id: w, label: w, color: bgColor };
        });
    }, [task, assistLevel, isReveal, isReduced]);

    useEffect(() => {
        setCurrentLevel(4);
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, monitor, setCurrentLevel]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    const handleDragStart = useCallback((id: string) => {
        setDraggedWord(id);
        monitor.recordInteraction();
        trackClick();
    }, [monitor, trackClick]);

    const handleDragEnd = useCallback(
        (id: string, info: any) => {
            setDraggedWord(null);
            if (!dropZoneRef.current) return;

            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const cx = dropRect.left + dropRect.width / 2;
            const cy = dropRect.top + dropRect.height / 2;

            const dropPoint = info.point;
            const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

            if (dist < 150) {
                if (id === task.word) {
                    setPlacedWord(id);
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });
                    showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                    setTimeout(() => {
                        if (currentTaskIdx < LEVEL_TASKS.length - 1) {
                            setCurrentTaskIdx(prev => prev + 1);
                            setPlacedWord(null);
                        } else {
                            addStars(1);
                            setShowVictory(true);
                        }
                    }, 1500);
                } else {
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    trackError();
                    showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
                }
            } else {
                monitor.recordInteraction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, addStars, trackError]
    );

    const maxAssistControls = useAnimation();
    useEffect(() => {
        if (isReveal) {
            maxAssistControls.start({
                y: [0, -25, 0],
                scale: [1, 1.05, 1],
                transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [isReveal, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden" onClick={trackClick}>
            <WordFactoryHUD title="Audio Words" icon="volume_up" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">
                {/* Speaker Area */}
                <div className="relative w-full max-xl bg-[#1E293B] rounded-[3rem] pt-16 pb-6 px-6 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_4px_0_rgba(255,255,255,0.1)] border-8 border-slate-700 mb-12 flex flex-col items-center justify-center gap-6 h-[400px]">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 rounded-full flex items-center justify-center border-t border-white/10">
                        <span className="text-blue-300 font-bold uppercase tracking-widest text-[10px]">
                            Listen & Identify
                        </span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={
                            isSpeaking
                                ? {
                                    scale: [1, 1.2, 1],
                                    boxShadow: [
                                        "0 0 0px rgba(59, 130, 246, 0)",
                                        "0 0 40px rgba(59, 130, 246, 0.5)",
                                        "0 0 0px rgba(59, 130, 246, 0)"
                                    ]
                                }
                                : isGlowing
                                    ? { boxShadow: "0 0 25px rgba(251, 191, 36, 0.4)" }
                                    : {}
                        }
                        transition={isSpeaking ? { repeat: Infinity, duration: 0.8 } : {}}
                        onClick={() => speak(task.word)}
                        className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking
                                ? "bg-blue-500 shadow-blue-500/50"
                                : "bg-slate-800 hover:bg-slate-700 border-4 border-slate-600"
                            } ${isGlowing ? "ring-8 ring-amber-400/40" : ""}`}
                    >
                        <Volume2 className={`w-12 h-12 ${isSpeaking ? "text-white" : "text-blue-400"}`} />
                    </motion.button>

                    <div className="h-10 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {isReveal ? (
                                <motion.span
                                    key="reveal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="font-black text-4xl text-amber-400 tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                                >
                                    {task.word}
                                </motion.span>
                            ) : assistLevel >= 3 ? (
                                <motion.span
                                    key="hint"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="font-bold text-2xl text-slate-400 tracking-widest"
                                >
                                    Starts with:
                                    <span className="text-blue-400 text-4xl ml-2">
                                        {task.word[0]}
                                    </span>
                                </motion.span>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div
                        ref={dropZoneRef}
                        className={`w-56 h-20 rounded-[1.5rem] border-4 bg-black/60 flex items-center justify-center transition-all duration-300 ${isReveal && !placedWord
                                ? "border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.6)]"
                                : isGlowing && !placedWord
                                    ? "border-amber-300/60 shadow-[0_0_20px_rgba(252,211,77,0.3)]"
                                    : "border-slate-600 border-dashed"
                            }`}
                    >
                        {placedWord ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-[1.2rem] flex items-center justify-center font-black text-3xl text-amber-950 shadow-[inset_0_4px_0_rgba(255,255,255,0.4)]"
                            >
                                {placedWord}
                            </motion.div>
                        ) : (
                            <span className="text-slate-600 font-bold uppercase tracking-widest text-xs">
                                Drop Word
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            if (placedWord === item.id) return null;
                            const isCorrect = item.id === task.word;
                            const shouldAssist = isCorrect && isReveal;

                            return (
                                <motion.div
                                    key={`drag-${item.id}`}
                                    drag
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    onDragStart={() => handleDragStart(item.id)}
                                    onDragEnd={(_e, info) => handleDragEnd(item.id, info)}
                                    whileDrag={{ scale: 1.15, zIndex: 9999, transition: { duration: 0.1 } }}
                                    style={{
                                        width: 'clamp(120px, 20vw, 160px)',
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-3xl sm:text-4xl lg:text-5xl text-slate-800 shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.7)] border-b-6 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing tracking-tight ${shouldAssist ? 'ring-8 ring-amber-400 ring-opacity-60' : ''}`}
                                >
                                    {item.label}
                                </motion.div>
                            );
                        })}
                    </div>

                    <ConveyorBelt
                        items={beltItems}
                        onPointerDown={() => { }}
                        activeDragId={draggedWord}
                        placedIds={placedWord ? [placedWord] : []}
                    />
                </div>
            </main>

            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="Audio Master!"
                    isOpen={true} starsEarned={1}
                    onNext={() => navigate('/word-factory/matching')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
