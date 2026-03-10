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
import '../../workshop/workshop.css';

// ─── Level 4 Data (Sight Words) ────────────────────────────────────
const LEVEL_TASKS = [
    { id: 'the', word: 'THE', distractors: ['AND', 'THAT', 'THEY'] },
    { id: 'is', word: 'IS', distractors: ['IT', 'IN', 'ON'] },
    { id: 'you', word: 'YOU', distractors: ['YOUR', 'YET', 'YES'] },
    { id: 'was', word: 'WAS', distractors: ['SAW', 'HAS', 'HAD'] },
];

export default function WordFactoryLevel4() {
    const navigate = useNavigate();
    const { adaptiveState, sendAdaptive, addStars, setCurrentLevel } = useReading();
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

    // Belt items
    const beltItems = useMemo(() => {
        let choices = [task.word, ...task.distractors];

        if (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) {
            choices = [task.word]; // Only the correct word
        } else if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            choices = [task.word, task.distractors[0]]; // One distractor
        }

        return choices.sort().map(w => {
            const isCorrect = w === task.word;
            const shouldHighlight = isCorrect && (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST);
            return {
                id: w,
                label: w,
                color: shouldHighlight ? '#FDE68A' : '#E5E7EB' // Adaptive differences
            };
        });
    }, [task, adaptiveState]);

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
    }, [monitor]);

    const handleDragEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                    showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
                }
            } else {
                monitor.recordIncorrectAction();
            }
        },
        [task, currentTaskIdx, monitor, sendAdaptive, showFeedback, addStars]
    );

    const maxAssistControls = useAnimation();
    useEffect(() => {
        if (adaptiveState === AdaptiveState.MAX_ASSIST) {
            maxAssistControls.start({
                y: [0, -25, 0],
                scale: [1, 1.05, 1],
                transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [adaptiveState, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden font-sans">
            <WordFactoryHUD title="Sight Words" icon="visibility" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">

                {/* Visual Target Area */}
                <div className="relative w-full max-w-2xl bg-amber-900 rounded-[3rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_4px_0_rgba(255,255,255,0.1)] border-[#334155] mb-12 flex flex-col items-center justify-center h-72">

                    <div className="absolute top-4 w-48 h-10 bg-black/40 rounded-full flex items-center justify-center border-t border-white/10">
                        <span className="text-amber-200/80 font-bold uppercase tracking-widest text-sm">Find this word</span>
                    </div>

                    {/* The Prompt */}
                    <div className="mb-4 mt-8 flex items-center justify-center">
                        <span className="font-black text-6xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-wide">
                            "{task.word}"
                        </span>
                    </div>

                    {/* The Drop Zone */}
                    <div
                        ref={dropZoneRef}
                        className={`w-64 h-32 mt-4 rounded-3xl border-4 bg-black/40 flex items-center justify-center relative transition-colors duration-300 ${(adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) && !placedWord
                            ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_40px_rgba(251,191,36,0.5)]'
                            : 'border-amber-700 border-dashed'
                            }`}
                    >
                        {placedWord && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 rounded-[1.25rem] flex items-center justify-center font-black text-6xl text-amber-950 shadow-[inset_0_4px_0_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.4)] tracking-wide"
                            >
                                {placedWord}
                            </motion.div>
                        )}
                        {!placedWord && <span className="text-amber-700/50 text-4xl font-black tracking-widest block">Drop Here</span>}
                    </div>
                </div>

                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            if (placedWord === item.id) return null;
                            const isCorrect = item.id === task.word;
                            const shouldAssist = isCorrect && adaptiveState === AdaptiveState.MAX_ASSIST;

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
                                        width: 'clamp(120px, 20vw, 160px)', // Wider for full words
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-3xl sm:text-4xl lg:text-5xl text-slate-800 shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.7)] border-b-6 border-black/20 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing tracking-tight ${shouldAssist ? 'ring-8 ring-amber-400 ring-opacity-60' : ''
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
                        activeDragId={draggedWord}
                        placedIds={placedWord ? [placedWord] : []}
                    />
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {adaptiveState === AdaptiveState.GUIDED && !placedWord && (
                <HintOverlay adaptiveState={adaptiveState} hintText="Match the word from the belt to the glowing box!" />
            )}

            {adaptiveState === AdaptiveState.MAX_ASSIST && !placedWord && (
                <HintOverlay adaptiveState={adaptiveState} hintText="Grab the bouncing word and drop it in the box!" />
            )}

            {showVictory && (
                <VictoryModal
                    title="Sight Word Star!"
                    isOpen={true} starsEarned={1}
                    onNext={() => {
                        navigate('/reading/level5');
                    }}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}

