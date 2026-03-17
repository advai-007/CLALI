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
import { POSITIVE_MESSAGES } from '../../workshop/workshopTypes';
import { CharacterGuide } from '../../../components/shared/CharacterGuide';
import '../../workshop/workshop.css';

// ─── Level 3 Data (Full Spelling) ──────────────────────────────────
const LEVEL_TASKS = [
    { id: 'dog', word: 'DOG', icon: 'pets', distractors: ['B', 'P', 'C'] },
    { id: 'car', word: 'CAR', icon: 'directions_car', distractors: ['T', 'B', 'M'] },
    { id: 'sun', word: 'SUN', icon: 'wb_sunny', distractors: ['F', 'M', 'P'] },
    { id: 'bug', word: 'BUG', icon: 'bug_report', distractors: ['M', 'H', 'D'] },
    { id: 'map', word: 'MAP', icon: 'map', distractors: ['N', 'C', 'T'] },
    { id: 'net', word: 'NET', icon: 'grid_on', distractors: ['B', 'S', 'F'] },
    { id: 'fan', word: 'FAN', icon: 'mode_fan', distractors: ['B', 'T', 'P'] },
    { id: 'cup', word: 'CUP', icon: 'coffee', distractors: ['S', 'R', 'T'] },
    { id: 'hat', word: 'HAT', icon: 'face', distractors: ['B', 'C', 'M'] },
    { id: 'log', word: 'LOG', icon: 'forest', distractors: ['D', 'F', 'P'] },
    { id: 'jam', word: 'JAM', icon: 'breakfast_dining', distractors: ['H', 'R', 'T'] },
    { id: 'rib', word: 'RIB', icon: 'lunch_dining', distractors: ['L', 'D', 'N'] },
];

export default function WordFactoryLevel3() {
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

    const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([]);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedLetter, setDraggedLetter] = useState<string | null>(null);

    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

    const { speak, isSpeaking, enableReadAloud } = useReadAloud();

    // Auto-speak on new task
    useEffect(() => {
        const timer = setTimeout(() => speak(task.word), 500);
        return () => clearTimeout(timer);
    }, [currentTaskIdx, speak, task.word]);

    // Adaptive Auto-speak
    useEffect(() => {
        const hasUnplaced = placedLetters.some(l => l === null);
        if (enableReadAloud && hasUnplaced && !isSpeaking) {
            speak(task.word, true);
        }
    }, [enableReadAloud, placedLetters, isSpeaking, speak, task.word]);

    useEffect(() => {
        setCurrentLevel(3);
        setPlacedLetters(new Array(task.word.length).fill(null));
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, task.word.length, monitor, setCurrentLevel]);

    useEffect(() => {
        resetAdaptation(`level3-${currentTaskIdx}`);
    }, [currentTaskIdx]);

    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    const isReduced = assistLevel >= 2;
    const isReveal = assistLevel >= 4;

    const nextEmptySlotIdx = placedLetters.findIndex(l => l === null);
    const nextCorrectLetter = nextEmptySlotIdx !== -1 ? task.word[nextEmptySlotIdx] : null;

    const beltItems = useMemo(() => {
        const requiredLetters = task.word.split('');
        const neededLetters = [...requiredLetters];
        placedLetters.forEach(letter => {
            if (letter) {
                const idx = neededLetters.indexOf(letter);
                if (idx > -1) neededLetters.splice(idx, 1);
            }
        });

        let choices = [...neededLetters];
        if (isReveal) {
            choices = [...neededLetters];
        } else if (isReduced) {
            choices = [...neededLetters, task.distractors[0]];
        } else {
            choices = [...neededLetters, ...task.distractors];
        }

        return choices.sort().map(letter => {
            const isTarget = letter === nextCorrectLetter;
            let bgColor = '#6EE7B7';
            if (isTarget && isReveal) bgColor = '#34D399';
            return { id: letter, label: letter, color: bgColor };
        });
    }, [task, assistLevel, placedLetters, nextCorrectLetter]);

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
        (id: string, info: any) => {
            setDraggedLetter(null);
            const dropPoint = info.point;
            let closestSlot = -1;
            let minDist = 100;

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
                const correctLetterForSlot = task.word[closestSlot];
                if (id === correctLetterForSlot) {
                    const newPlaced = [...placedLetters];
                    newPlaced[closestSlot] = id;
                    setPlacedLetters(newPlaced);
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });

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
                    monitor.recordIncorrectAction();
                    sendAdaptive({ type: 'INCORRECT_ACTION' });
                    trackError();
                    showFeedback("Not quite! Try a different letter.", 'incorrect');
                }
            } else {
                monitor.recordInteraction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, placedLetters, addStars, trackError]
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
            <WordFactoryHUD title="Spell the Word" icon="spellcheck" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">
                <div className="relative w-full max-w-3xl bg-indigo-950 rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_4px_0_rgba(255,255,255,0.1)] border-8 border-indigo-900 mb-12 flex flex-col items-center justify-center min-h-[400px] gap-6">
                    
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                        onClick={() => speak(task.word)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'} border border-slate-700`}
                    >
                        <Volume2 className="w-6 h-6" />
                    </motion.button>

                    {/* Picture Hint */}
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center shadow-inner border-2 border-white/20">
                        <span className="material-symbols-outlined text-white text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {task.icon}
                        </span>
                    </div>

                    {/* Letter Slots */}
                    <div className="flex gap-4 items-center justify-center w-full">
                        {task.word.split('').map((_char, index) => {
                            const isPlaced = placedLetters[index] !== null;
                            const isNextSlot = index === nextEmptySlotIdx;
                            const shouldGlow = isNextSlot && isReveal;
                            const isSoftGlow = isNextSlot && !isReveal && assistLevel >= 3;

                            return (
                                <div
                                    key={`slot-${index}`}
                                    ref={(el) => { slotRefs.current[index] = el; }}
                                    className={`w-28 h-32 rounded-3xl border-4 bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${shouldGlow
                                        ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                                        : isSoftGlow
                                            ? 'border-emerald-300 bg-emerald-300/10 shadow-[0_0_20px_rgba(110,231,183,0.35)]'
                                            : isNextSlot && isReduced
                                                ? 'border-emerald-300/50 bg-emerald-400/10'
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
                            const isAssistTarget = item.id === nextCorrectLetter && isReveal;
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
                                    className={`relative flex items-center justify-center rounded-[1.5rem] font-black text-5xl lg:text-6xl text-[#1F2937] shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_4px_0_rgba(255,255,255,0.6)] border-b-8 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing ${isAssistTarget ? 'ring-8 ring-emerald-400 ring-opacity-60' : ''}`}
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
                        placedIds={[]}
                    />
                </div>
            </main>

            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="Spelling Bee!"
                    isOpen={true} starsEarned={1}
                    onNext={() => navigate('/word-factory/level4')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
