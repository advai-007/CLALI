import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WordFactoryHUD from '../components/WordFactoryHUD';
import ConveyorBelt from '../components/ConveyorBelt';
import VictoryModal from '../../workshop/components/VictoryModal';
import FeedbackToast from '../../workshop/components/FeedbackToast';
import HintOverlay from '../../workshop/components/HintOverlay';
import { useReading } from '../ReadingContext';
import { useReadingMonitor } from '../useReadingMonitor';
import { AdaptiveState, POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../../workshop/workshopTypes';
import type { WordTask } from '../readingTypes';
import '../../workshop/workshop.css';

// ─── Level 1 Data (CVC Words) ────────────────────────────────────────
const LEVEL_TASKS: WordTask[] = [
    { id: 'cat', word: 'CAT', missingIndices: [1], distractors: ['E', 'I', 'O', 'U'] },
    { id: 'dog', word: 'DOG', missingIndices: [1], distractors: ['A', 'E', 'I', 'U'] },
    { id: 'pig', word: 'PIG', missingIndices: [1], distractors: ['A', 'E', 'O', 'U'] },
    { id: 'sun', word: 'SUN', missingIndices: [1], distractors: ['A', 'E', 'I', 'O'] },
];

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

export default function WordFactoryLevel1() {
    const navigate = useNavigate();
    const { adaptiveState, sendAdaptive, addStars } = useReading();
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

    // Filter conveyor items based on adaptive state
    const beltItems = useMemo(() => {
        const correctVowel = task.word[task.missingIndices[0]];
        let choices = [...VOWELS];

        if (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) {
            // Only show the correct vowel
            choices = [correctVowel];
        } else if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            // eslint-disable-next-line react-hooks/purity
            const dist = task.distractors[Math.floor(Math.random() * task.distractors.length)];
            choices = [correctVowel, dist].sort();
        }

        return choices.map(v => {
            const isCorrect = v === correctVowel;
            const shouldHighlight = isCorrect && (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST);
            return {
                id: v,
                label: v,
                color: shouldHighlight ? '#FCD34D' : '#93C5FD' // Adaptive optional coloring
            };
        });
    }, [task, adaptiveState]);

    useEffect(() => {
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, monitor]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const handleDragStart = useCallback((id: string, _e: any) => {
        setDraggedLetter(id);
        monitor.recordInteraction();
    }, [monitor]);

    const handleDragEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: string, info: any) => {
            setDraggedLetter(null);

            if (!dropZoneRef.current) return;

            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const cx = dropRect.left + dropRect.width / 2;
            const cy = dropRect.top + dropRect.height / 2;

            const dropPoint = info.point;
            const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

            if (dist < 100) {
                // Dropped on zone
                const correctVowel = task.word[task.missingIndices[0]];
                if (id === correctVowel) {
                    // Correct!
                    setPlacedLetter(id);
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });
                    showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                    // Transition to next task or victory
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
                    // Wrong!
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
                }
            } else {
                // Dropped outside
                monitor.recordIncorrectAction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, addStars]
    );

    // Max assist rhythmic pulse
    const maxAssistControls = useAnimation();
    useEffect(() => {
        if (adaptiveState === AdaptiveState.MAX_ASSIST) {
            maxAssistControls.start({
                y: [0, -20, 0],
                rotateZ: [0, 5, -5, 0],
                transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [adaptiveState, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden font-sans">
            <WordFactoryHUD title="Missing Vowels" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">

                {/* 3D Machine Backdrop */}
                <div className="relative w-full max-w-2xl bg-[#475569] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.2)] border-8 border-[#334155] mb-12 flex flex-col items-center justify-center h-64">
                    {/* Background mechanical details */}
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gray-900 border-4 border-gray-600 shadow-inner" />
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gray-900 border-4 border-gray-600 shadow-inner" />

                    {/* Word Display Area */}
                    <div className="flex gap-4 items-center justify-center">
                        {task.word.split('').map((char, index) => {
                            const isMissing = task.missingIndices.includes(index);

                            if (isMissing) {
                                return (
                                    <div
                                        key={`slot-${index}`}
                                        ref={dropZoneRef}
                                        className={`w-24 h-28 rounded-2xl border-4 border-dashed bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${(adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) && !placedLetter
                                            ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
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
                                        {/* Drop zone indicator */}
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
                    {/* Draggable blocks render above the belt */}
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            if (placedLetter === item.id) return null;
                            const isCorrect = item.id === task.word[task.missingIndices[0]];
                            const shouldAssist = isCorrect && adaptiveState === AdaptiveState.MAX_ASSIST;

                            return (
                                <motion.div
                                    key={`drag-${item.id}`}
                                    drag
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    onDragStart={(e) => handleDragStart(item.id, e)}
                                    onDragEnd={(_e, info) => handleDragEnd(item.id, info)}
                                    whileDrag={{ scale: 1.2, zIndex: 9999, transition: { duration: 0.1 } }}
                                    style={{
                                        width: 'clamp(64px, 12vw, 96px)',
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-4xl sm:text-5xl lg:text-6xl text-[#1F2937] shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.4)] border-b-6 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing ${shouldAssist ? 'ring-8 ring-yellow-400 ring-opacity-60' : ''
                                        }`}
                                >
                                    {item.label}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* The visual conveyor belt beneath the blocks */}
                    <ConveyorBelt
                        items={beltItems}
                        onPointerDown={() => { }} // Interaction happens on the draggable layer
                        activeDragId={draggedLetter}
                        placedIds={placedLetter ? [placedLetter] : []}
                    />
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {adaptiveState === AdaptiveState.GUIDED && !placedLetter && (
                <HintOverlay adaptiveState={adaptiveState} hintText="Watch for the glowing yellow box! Drag the matching letter from the belt." />
            )}

            {adaptiveState === AdaptiveState.MAX_ASSIST && !placedLetter && (
                <HintOverlay adaptiveState={adaptiveState} hintText="Look! The bouncing letter needs to go into the glowing box." />
            )}

            {showVictory && (
                <VictoryModal
                    title="Level Complete!"
                    isOpen={true} starsEarned={1}
                    onNext={() => {
                        navigate('/reading/level2');
                    }}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}

