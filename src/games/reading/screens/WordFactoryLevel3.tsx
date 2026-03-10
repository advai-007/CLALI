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

// ─── Level 3 Data (Full Spelling) ──────────────────────────────────
const LEVEL_TASKS = [
    { id: 'dog', word: 'DOG', icon: 'pets', distractors: ['B', 'P', 'C'] },
    { id: 'car', word: 'CAR', icon: 'directions_car', distractors: ['T', 'B', 'M'] },
    { id: 'sun', word: 'SUN', icon: 'wb_sunny', distractors: ['F', 'M', 'P'] },
    { id: 'bug', word: 'BUG', icon: 'bug_report', distractors: ['M', 'H', 'D'] },
];

export default function WordFactoryLevel3() {
    const navigate = useNavigate();
    const { adaptiveState, sendAdaptive, addStars, setCurrentLevel } = useReading();
    const monitor = useReadingMonitor();

    const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
    const task = LEVEL_TASKS[currentTaskIdx];

    // Array of placed letters matching the word length
    const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([]);

    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedLetter, setDraggedLetter] = useState<string | null>(null);

    // Refs for all slots
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setCurrentLevel(3);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPlacedLetters(new Array(task.word.length).fill(null));
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, task.word.length, monitor, setCurrentLevel]);

    // Available letters for the belt
    const beltItems = useMemo(() => {
        const requiredLetters = task.word.split('');

        // Compute which letters are still needed
        const neededLetters = [...requiredLetters];
        placedLetters.forEach(letter => {
            if (letter) {
                const idx = neededLetters.indexOf(letter);
                if (idx > -1) neededLetters.splice(idx, 1);
            }
        });

        let choices = [...neededLetters];

        if (adaptiveState === AdaptiveState.NORMAL) {
            choices = [...neededLetters, ...task.distractors];
        } else if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            // Include just one distractor
            choices = [...neededLetters, task.distractors[0]];
        }
        // GUIDED and MAX_ASSIST only show strictly needed letters.

        // Deduplicate id for belt items by appending index if needed, 
        // but for simplicity, let's assume words don't have repeating letters here, 
        // or we just map them carefully. "DOG", "CAR", "SUN", "BUG" have no repeats.
        return choices.sort().map(letter => ({
            id: letter,
            label: letter,
            color: '#6EE7B7' // Mint green
        }));
    }, [task, adaptiveState, placedLetters]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    const handleDragStart = useCallback((id: string) => {
        setDraggedLetter(id);
        monitor.recordInteraction();
    }, [monitor]);

    const handleDragEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: string, info: any) => {
            setDraggedLetter(null);

            const dropPoint = info.point;
            let closestSlot = -1;
            let minDist = 100; // Drop radius

            slotRefs.current.forEach((el, index) => {
                if (!el || placedLetters[index] !== null) return;
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
                // If guided/max assist, enforce correct letter order or exact match for that slot
                const correctLetterForSlot = task.word[closestSlot];

                if (id === correctLetterForSlot) {
                    // Correct placement
                    const newPlaced = [...placedLetters];
                    newPlaced[closestSlot] = id;
                    setPlacedLetters(newPlaced);

                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });

                    // Check if word is fully assembled
                    if (newPlaced.join('') === task.word) {
                        showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');
                        setTimeout(() => {
                            if (currentTaskIdx < LEVEL_TASKS.length - 1) {
                                setCurrentTaskIdx(prev => prev + 1);
                            } else {
                                addStars(1);
                                setShowVictory(true);
                            }
                        }, 1500);
                    }
                } else {
                    // Wrong letter for this slot
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    showFeedback("Not quite! Try a different letter.", 'incorrect');
                }
            } else {
                // Dropped nowhere
                monitor.recordIncorrectAction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, placedLetters, addStars]
    );

    // Identify the next empty slot for Guided / Max Assist
    const nextEmptySlotIdx = placedLetters.findIndex(l => l === null);
    const nextCorrectLetter = nextEmptySlotIdx !== -1 ? task.word[nextEmptySlotIdx] : null;

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
            <WordFactoryHUD title="Spell the Word" icon="spellcheck" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">

                <div className="relative w-full max-w-3xl bg-indigo-950 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_4px_0_rgba(255,255,255,0.1)] border-8 border-indigo-900 mb-12 flex flex-col items-center justify-center min-h-[300px]">

                    {/* Picture Hint */}
                    <div className="mb-8 w-32 h-32 bg-white/10 rounded-full flex items-center justify-center shadow-inner border-2 border-white/20">
                        <span className="material-symbols-outlined text-white text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {task.icon}
                        </span>
                    </div>

                    {/* Letter Slots */}
                    <div className="flex gap-4 items-center justify-center w-full">
                        {task.word.split('').map((_char, index) => {
                            const isPlaced = placedLetters[index] !== null;
                            const isNextSlot = index === nextEmptySlotIdx;
                            const shouldGlow = isNextSlot && (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST);

                            return (
                                <div
                                    key={`slot-${index}`}
                                    ref={(el) => { slotRefs.current[index] = el; }}
                                    className={`w-28 h-32 rounded-3xl border-4 bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${shouldGlow
                                        ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                                        : 'border-slate-600 border-dashed'
                                        }`}
                                >
                                    {isPlaced && (
                                        <motion.div
                                            initial={{ scale: 0, rotateY: 90 }}
                                            animate={{ scale: 1, rotateY: 0 }}
                                            className="w-full h-full bg-emerald-500 rounded-[1.25rem] flex items-center justify-center font-black text-7xl text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.4)]"
                                        >
                                            {placedLetters[index]}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            const isAssistTarget = item.id === nextCorrectLetter && adaptiveState === AdaptiveState.MAX_ASSIST;

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
                                        width: 'clamp(72px, 14vw, 110px)',
                                        height: 'clamp(72px, 14vw, 110px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={isAssistTarget ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-[1.5rem] font-black text-5xl lg:text-6xl text-[#1F2937] shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_4px_0_rgba(255,255,255,0.6)] border-b-8 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing ${isAssistTarget ? 'ring-8 ring-emerald-400 ring-opacity-60' : ''
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
                        activeDragId={draggedLetter}
                        placedIds={[]} // Belt handles rendering gaps, but since we map needed letters dynamically, we don't pass placedIds here to hide them, they just get removed from beltItems array
                    />
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {adaptiveState === AdaptiveState.GUIDED && nextEmptySlotIdx !== -1 && (
                <HintOverlay adaptiveState={adaptiveState} hintText="What letter comes next? Drag it to the glowing green box!" />
            )}

            {adaptiveState === AdaptiveState.MAX_ASSIST && nextEmptySlotIdx !== -1 && (
                <HintOverlay adaptiveState={adaptiveState} hintText="The bouncing letter goes in the glowing box!" />
            )}

            {showVictory && (
                <VictoryModal
                    title="Spelling Bee!"
                    isOpen={true} starsEarned={1}
                    onNext={() => {
                        navigate('/reading/level4');
                    }}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}

