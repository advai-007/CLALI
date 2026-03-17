import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
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
import type { WordTask } from '../readingTypes';
import '../../workshop/workshop.css';

// ─── Level 1 Data (CVC Words — Missing Vowel) ─────────────────────────
const LEVEL_TASKS: WordTask[] = [
    { id: 'cat', word: 'CAT', missingIndices: [1], distractors: ['E', 'I', 'O', 'U'] },
    { id: 'dog', word: 'DOG', missingIndices: [1], distractors: ['A', 'E', 'I', 'U'] },
    { id: 'pig', word: 'PIG', missingIndices: [1], distractors: ['A', 'E', 'O', 'U'] },
    { id: 'sun', word: 'SUN', missingIndices: [1], distractors: ['A', 'E', 'I', 'O'] },
    { id: 'hen', word: 'HEN', missingIndices: [1], distractors: ['A', 'I', 'O', 'U'] },
    { id: 'pan', word: 'PAN', missingIndices: [1], distractors: ['E', 'I', 'O', 'U'] },
    { id: 'mop', word: 'MOP', missingIndices: [1], distractors: ['A', 'E', 'I', 'U'] },
    { id: 'rug', word: 'RUG', missingIndices: [1], distractors: ['A', 'E', 'I', 'O'] },
    { id: 'wet', word: 'WET', missingIndices: [1], distractors: ['A', 'I', 'O', 'U'] },
    { id: 'fig', word: 'FIG', missingIndices: [1], distractors: ['A', 'E', 'O', 'U'] },
    { id: 'cot', word: 'COT', missingIndices: [1], distractors: ['A', 'E', 'I', 'U'] },
    { id: 'bud', word: 'BUD', missingIndices: [1], distractors: ['A', 'E', 'I', 'O'] },
];

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

import { CharacterGuide } from '../../../components/shared/CharacterGuide';

export default function WordFactoryLevel1() {
    const navigate = useNavigate();
    const {
        assistLevel,
        trackClick,
        trackError,
        trackMouseMove,
        resetAdaptation,
        sendAdaptive,
        addStars
    } = useReading();
    const monitor = useReadingMonitor();

    const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
    const task = LEVEL_TASKS[currentTaskIdx];

    const [placedLetter, setPlacedLetter] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedLetter, setDraggedLetter] = useState<string | null>(null);

    // Refs for drop zone calculation
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const { speak, isSpeaking, enableReadAloud } = useReadAloud();


    // Adaptive Auto-speak
    useEffect(() => {
        if (enableReadAloud && !placedLetter && !isSpeaking) {
            speak(task.word, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enableReadAloud, placedLetter, speak, task.word]);

    // Reset adaptation metrics when task changes
    useEffect(() => {
        resetAdaptation(`level1-${currentTaskIdx}`);
    }, [currentTaskIdx]);

    // Track mouse movement for jitter detection
    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    // Stage flags derived from assistLevel
    const isReduced = assistLevel >= 2;
    const isGlowing = assistLevel >= 3;
    const isReveal = assistLevel >= 4;

    // Filter conveyor items based on assist stage
    const beltItems = useMemo(() => {
        const correctVowel = task.word[task.missingIndices[0]];
        let choices = [...VOWELS];

        if (isReveal) {
            choices = [correctVowel];
        } else if (isReduced) {
            const distractors = task.distractors.filter(d => d !== correctVowel);
            const dist = distractors[Math.floor(Math.random() * distractors.length)];
            choices = [correctVowel, dist].sort();
        }

        return choices.map(v => {
            const isCorrect = v === correctVowel;
            let bgColor = '#93C5FD';
            if (isCorrect && isReveal) bgColor = '#FCD34D';

            return { id: v, label: v, color: bgColor };
        });
    }, [task, assistLevel]);

    useEffect(() => {
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, monitor]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    const handleDragStart = useCallback((id: string) => {
        setDraggedLetter(id);
        monitor.recordInteraction();
        trackClick();
    }, [monitor, trackClick]);

    const handleDragEnd = useCallback(
        (id: string, info: { point: { x: number; y: number } }) => {
            setDraggedLetter(null);
            if (!dropZoneRef.current) return;

            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const cx = dropRect.left + dropRect.width / 2;
            const cy = dropRect.top + dropRect.height / 2;

            const dropPoint = info.point;
            const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

            if (dist < 100) {
                const correctVowel = task.word[task.missingIndices[0]];
                if (id === correctVowel) {
                    setPlacedLetter(id);
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });
                    showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                    setTimeout(() => {
                        if (currentTaskIdx < LEVEL_TASKS.length - 1) {
                            setCurrentTaskIdx(prev => prev + 1);
                            setPlacedLetter(null);
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
                y: [0, -20, 0],
                rotateZ: [0, 5, -5, 0],
                transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [isReveal, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden" onClick={trackClick}>
            <WordFactoryHUD title="Missing Vowels" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">
                {/* 3D Machine Backdrop */}
                <div className="relative w-full max-w-2xl bg-[#475569] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.2)] border-8 border-[#334155] mb-12 flex flex-col items-center justify-center h-80 gap-6">
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gray-900 border-4 border-gray-600 shadow-inner" />
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gray-900 border-4 border-gray-600 shadow-inner" />

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                        onClick={() => speak(task.word)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-blue-500 text-white' : 'bg-slate-700 text-blue-400 hover:bg-slate-600'}`}
                    >
                        <Volume2 className="w-6 h-6" />
                    </motion.button>

                    {/* Word Display Area */}
                    <div className="flex gap-4 items-center justify-center">
                        {task.word.split('').map((char, index) => {
                            const isMissing = task.missingIndices.includes(index);

                            if (isMissing) {
                                return (
                                    <div
                                        key={`slot-${index}`}
                                        ref={dropZoneRef}
                                        className={`w-24 h-28 rounded-2xl border-4 border-dashed bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${isReveal && !placedLetter
                                            ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
                                            : isGlowing && !placedLetter
                                                ? 'border-amber-300 bg-amber-300/10 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                                                : isReduced && !placedLetter
                                                    ? 'border-yellow-200/50 bg-yellow-200/10'
                                                    : 'border-slate-400'
                                            }`}
                                    >
                                        {placedLetter && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-full h-full bg-green-500 rounded-xl flex items-center justify-center font-black text-6xl text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.4)]"
                                            >
                                                {placedLetter}
                                            </motion.div>
                                        )}
                                        {!placedLetter && <span className="text-slate-500 text-4xl">?</span>}
                                    </div>
                                );
                            }

                            return (
                                <div key={`char-${index}`} className="w-24 h-28 bg-[#CBD5E1] rounded-2xl flex items-center justify-center font-black text-6xl text-slate-800 shadow-[0_8px_0_#94A3B8,inset_0_4px_0_rgba(255,255,255,0.8)]">
                                    {char}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Conveyor Belt Tray */}
                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            if (placedLetter === item.id) return null;
                            const isCorrect = item.id === task.word[task.missingIndices[0]];
                            const shouldAssist = isCorrect && isReveal;

                            return (
                                <motion.div
                                    key={`drag-${item.id}`}
                                    drag
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    onDragStart={() => handleDragStart(item.id)}
                                    onDragEnd={(_e, info) => handleDragEnd(item.id, info)}
                                    whileDrag={{ scale: 1.2, zIndex: 9999, transition: { duration: 0.1 } }}
                                    style={{
                                        width: 'clamp(64px, 12vw, 96px)',
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-4xl sm:text-5xl lg:text-6xl text-[#1F2937] shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.4)] border-b-6 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing ${shouldAssist ? 'ring-8 ring-yellow-400 ring-opacity-60' : ''}`}
                                >
                                    {item.label}
                                </motion.div>
                            );
                        })}
                    </div>

                    <ConveyorBelt
                        items={beltItems}
                        onPointerDown={() => { }}
                        activeDragId={draggedLetter}
                        placedIds={placedLetter ? [placedLetter] : []}
                    />
                </div>
            </main>

            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="Level Complete!"
                    isOpen={true} starsEarned={1}
                    onNext={() => navigate('/word-factory/level2')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
