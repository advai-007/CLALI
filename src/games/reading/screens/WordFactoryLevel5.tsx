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
import { AdaptiveState, POSITIVE_MESSAGES } from '../../workshop/workshopTypes';
import '../../workshop/workshop.css';

// ─── Level 5 Data (Sentences) ────────────────────────────────────
const LEVEL_TASKS = [
    { id: 'cat', parts: ['The cat', 'sat', 'on the mat'], distractors: ['jumped', 'in the tree'] },
    { id: 'dog', parts: ['My dog', 'can', 'run fast'], distractors: ['fly', 'read books'] },
    { id: 'sun', parts: ['The sun', 'is', 'very hot'], distractors: ['cold', 'sleeping'] },
];

export default function WordFactoryLevel5() {
    const navigate = useNavigate();
    const { adaptiveState, sendAdaptive, addStars, setCurrentLevel } = useReading();
    const monitor = useReadingMonitor();

    const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
    const task = LEVEL_TASKS[currentTaskIdx];

    const [placedParts, setPlacedParts] = useState<(string | null)[]>([]);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedPart, setDraggedPart] = useState<string | null>(null);

    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {

        setCurrentLevel(5);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlacedParts(new Array(task.parts.length).fill(null));
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, task.parts.length, monitor, setCurrentLevel]);

    const beltItems = useMemo(() => {
        // Items needed
        const neededParts = [...task.parts];
        placedParts.forEach(p => {
            if (p) {
                const idx = neededParts.indexOf(p);
                if (idx > -1) neededParts.splice(idx, 1);
            }
        });

        let choices = [...neededParts];

        if (adaptiveState === AdaptiveState.NORMAL) {
            choices = [...neededParts, ...task.distractors];
        } else if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            choices = [...neededParts, task.distractors[0]];
        }

        // Shuffle choices so they don't always appear in correct order
        // Sort alphabetically to randomize visually since these are strings
        choices.sort();

        return choices.map(p => ({
            id: p,
            label: p,
            color: '#A78BFA' // Purple
        }));
    }, [task, adaptiveState, placedParts]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    const handleDragStart = useCallback((id: string) => {
        setDraggedPart(id);
        monitor.recordInteraction();
    }, [monitor]);

    const handleDragEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: string, info: any) => {
            setDraggedPart(null);

            const dropPoint = info.point;
            let closestSlot = -1;
            let minDist = 150; // Larger drop radius for sentence blocks

            slotRefs.current.forEach((el, index) => {
                if (!el || placedParts[index] !== null) return;
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

                if (dist < minDist) {
                    minDist = dist;
                    closestSlot = index;
                }
            });

            if (closestSlot !== -1) {
                const correctPartForSlot = task.parts[closestSlot];

                if (id === correctPartForSlot) {
                    const newPlaced = [...placedParts];
                    newPlaced[closestSlot] = id;
                    setPlacedParts(newPlaced);

                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });

                    if (newPlaced.every(p => p !== null)) {

                        showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');
                        setTimeout(() => {
                            if (currentTaskIdx < LEVEL_TASKS.length - 1) {
                                setCurrentTaskIdx(prev => prev + 1);
                            } else {
                                addStars(1);
                                setShowVictory(true);
                            }
                        }, 2000);
                    }
                } else {
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    showFeedback("Try a different part!", 'incorrect');
                }
            } else {
                monitor.recordIncorrectAction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, placedParts, addStars]
    );

    const nextEmptySlotIdx = placedParts.findIndex(p => p === null);
    const nextCorrectPart = nextEmptySlotIdx !== -1 ? task.parts[nextEmptySlotIdx] : null;

    const maxAssistControls = useAnimation();
    useEffect(() => {
        if (adaptiveState === AdaptiveState.MAX_ASSIST) {
            maxAssistControls.start({
                y: [0, -20, 0],
                rotateZ: [0, 3, -3, 0],
                transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [adaptiveState, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden font-sans">
            <WordFactoryHUD title="Build a Sentence" icon="text_fields" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">

                <div className="relative w-full max-w-5xl bg-indigo-950 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_4px_0_rgba(255,255,255,0.1)] border-8 border-indigo-900 mb-12 flex flex-col items-center justify-center min-h-[300px]">

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
                        {task.parts.map((_part, index) => {
                            const isPlaced = placedParts[index] !== null;
                            const isNextSlot = index === nextEmptySlotIdx;
                            const shouldGlow = isNextSlot && (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST);

                            return (
                                <div
                                    key={`slot-${index}`}
                                    ref={(el) => { slotRefs.current[index] = el; }}
                                    className={`w-full sm:w-1/3 h-24 sm:h-32 rounded-3xl border-4 bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${shouldGlow
                                        ? 'border-purple-400 bg-purple-500/20 shadow-[0_0_30px_rgba(167,139,250,0.5)]'
                                        : 'border-slate-600 border-dashed'
                                        }`}
                                >
                                    {isPlaced && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[1.25rem] flex items-center justify-center font-bold text-2xl sm:text-3xl lg:text-4xl text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.4)] px-4 text-center"
                                        >
                                            {placedParts[index]}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-4 sm:gap-6 pb-6 pointer-events-none z-50 px-4 flex-wrap">
                        {beltItems.map((item) => {
                            const isAssistTarget = item.id === nextCorrectPart && adaptiveState === AdaptiveState.MAX_ASSIST;

                            return (
                                <motion.div
                                    key={`drag-${item.id}`}
                                    drag
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    onDragStart={() => handleDragStart(item.id)}
                                    onDragEnd={(_e, info) => handleDragEnd(item.id, info)}
                                    whileDrag={{ scale: 1.1, zIndex: 9999, transition: { duration: 0.1 } }}
                                    style={{
                                        width: 'clamp(140px, 25vw, 240px)',
                                        height: 'clamp(64px, 10vw, 80px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={isAssistTarget ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-[1rem] font-bold text-xl sm:text-2xl text-white shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_4px_0_rgba(255,255,255,0.4)] border-b-6 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing px-4 text-center ${isAssistTarget ? 'ring-8 ring-purple-400 ring-opacity-60' : ''
                                        }`}
                                >
                                    {item.label}
                                </motion.div>
                            );
                        })}
                    </div>

                    <ConveyorBelt
                        items={beltItems}
                        onPointerDown={() => { }}
                        activeDragId={draggedPart}
                        placedIds={[]}
                    />
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {adaptiveState === AdaptiveState.GUIDED && nextEmptySlotIdx !== -1 && (
                <HintOverlay adaptiveState={adaptiveState} hintText="What part comes next? Drag it to the glowing purple box!" />
            )}

            {adaptiveState === AdaptiveState.MAX_ASSIST && nextEmptySlotIdx !== -1 && (
                <HintOverlay adaptiveState={adaptiveState} hintText="This moving piece goes next!" />
            )}

            {showVictory && (
                <VictoryModal
                    title="Sentence Master!"
                    isOpen={true} starsEarned={3}
                    onNext={() => {
                        // All reading games done, maybe return to dashboard
                        navigate('/dashboard');
                    }}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}

