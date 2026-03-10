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

// ─── Level 2 Data (Blends & Digraphs) ──────────────────────────────
const LEVEL_TASKS = [
    { id: 'ship', word: 'SHIP', missingChunk: 'SH', missingIndices: [0, 1], distractors: ['CH', 'TH', 'SL', 'TR'] },
    { id: 'frog', word: 'FROG', missingChunk: 'FR', missingIndices: [0, 1], distractors: ['FL', 'TR', 'CR', 'BR'] },
    { id: 'cash', word: 'CASH', missingChunk: 'SH', missingIndices: [2, 3], distractors: ['CH', 'TH', 'CK', 'NG'] },
    { id: 'play', word: 'PLAY', missingChunk: 'PL', missingIndices: [0, 1], distractors: ['PR', 'SL', 'FL', 'CL'] },
];

export default function WordFactoryLevel2() {
    const navigate = useNavigate();
    const { adaptiveState, sendAdaptive, addStars, setCurrentLevel } = useReading();
    const monitor = useReadingMonitor();

    const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
    const task = LEVEL_TASKS[currentTaskIdx];

    const [placedChunk, setPlacedChunk] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedChunk, setDraggedChunk] = useState<string | null>(null);

    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Filter conveyor items based on adaptive state
    const beltItems = useMemo(() => {
        const correctChunk = task.missingChunk;
        let choices = [correctChunk, ...task.distractors];

        if (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) {
            choices = [correctChunk];
        } else if (adaptiveState === AdaptiveState.REDUCED_COMPLEXITY) {
            // eslint-disable-next-line react-hooks/purity
            const dist = task.distractors[Math.floor(Math.random() * task.distractors.length)];
            choices = [correctChunk, dist];
        }

        return choices.sort().map(chunk => {
            const isCorrect = chunk === correctChunk;
            const shouldHighlight = isCorrect && (adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST);
            return {
                id: chunk,
                label: chunk,
                color: shouldHighlight ? '#A78BFA' : '#FCA5A5' // Adaptive hint colors
            };
        });
    }, [task, adaptiveState]);

    useEffect(() => {
        setCurrentLevel(2);
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [currentTaskIdx, monitor, setCurrentLevel]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId((prev) => prev + 1);
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const handleDragStart = useCallback((id: string, _e: any) => {
        setDraggedChunk(id);
        monitor.recordInteraction();
    }, [monitor]);

    const handleDragEnd = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (id: string, info: any) => {
            setDraggedChunk(null);

            if (!dropZoneRef.current) return;

            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const cx = dropRect.left + dropRect.width / 2;
            const cy = dropRect.top + dropRect.height / 2;

            const dropPoint = info.point;
            const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

            if (dist < 120) { // Slightly larger drop zone for 2-letter blocks
                if (id === task.missingChunk) {
                    setPlacedChunk(id);
                    monitor.recordCorrectAction();
                    sendAdaptive({ type: 'CORRECT_ACTION' });

                    showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

                    setTimeout(() => {
                        if (currentTaskIdx < LEVEL_TASKS.length - 1) {
                            setCurrentTaskIdx(prev => prev + 1);
                            setPlacedChunk(null);
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
                rotateZ: [0, 8, -8, 0],
                transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [adaptiveState, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden font-sans">
            <WordFactoryHUD title="Blends & Digraphs" icon="merge_type" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">

                {/* 3D Machine Backdrop (Wider for Level 2) */}
                <div className="relative w-full max-w-3xl bg-[#0F172A] rounded-[3rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_4px_0_rgba(255,255,255,0.1)] border-[#334155] mb-12 flex flex-col items-center justify-center h-72">

                    {/* Glowing tubes decoration */}
                    <div className="absolute top-0 w-32 h-4 bg-cyan-500/50 blur shadow-[0_0_30px_#06b6d4]" />

                    {/* Word Display Area */}
                    <div className="flex gap-4 items-center justify-center">
                        {/* 
                            Instead of mapping every char, we group them. 
                            If index is missingIndices[0], we render the double-slot.
                            Otherwise we render the normal char.
                            Since missing chunks are always length 2 and contiguous, we can slice around it.
                        */}
                        {task.word.split('').map((char, index) => {
                            const isMissing = task.missingIndices.includes(index);
                            const isFirstMissing = index === task.missingIndices[0];

                            // Skip the second missing index because the double drop-zone handles it
                            if (isMissing && !isFirstMissing) return null;

                            if (isMissing && isFirstMissing) {
                                return (
                                    <div
                                        key={`slot-chunk`}
                                        ref={dropZoneRef}
                                        className={`w-40 h-32 rounded-3xl border-4 bg-slate-800/80 flex items-center justify-center relative transition-colors duration-300 ${(adaptiveState === AdaptiveState.GUIDED || adaptiveState === AdaptiveState.MAX_ASSIST) && !placedChunk
                                            ? 'border-indigo-400 bg-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.6)]'
                                            : 'border-slate-500/50 border-dashed'
                                            }`}
                                    >
                                        {placedChunk && (
                                            <motion.div
                                                initial={{ scale: 0, y: -20 }}
                                                animate={{ scale: 1, y: 0 }}
                                                className="w-full h-full bg-gradient-to-b from-purple-500 to-indigo-600 rounded-[1.25rem] flex items-center justify-center font-black text-7xl text-white shadow-[inset_0_4px_0_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.4)] tracking-wider"
                                            >
                                                {placedChunk}
                                            </motion.div>
                                        )}
                                        {!placedChunk && <span className="text-slate-500/50 text-5xl font-black tracking-widest block">_ _</span>}
                                    </div>
                                );
                            }

                            return (
                                <div key={`char-${index}`} className="w-24 h-32 bg-gradient-to-b from-slate-200 to-slate-400 rounded-3xl flex items-center justify-center font-black text-7xl text-slate-800 shadow-[0_10px_0_#94A3B8,inset_0_4px_0_rgba(255,255,255,0.8)] border border-white/50">
                                    {char}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative w-full flex justify-center mt-auto">
                    <div className="absolute bottom-0 w-full flex justify-center items-center gap-6 pb-6 pointer-events-none z-50">
                        {beltItems.map((item) => {
                            if (placedChunk === item.id) return null;
                            const isCorrect = item.id === task.missingChunk;
                            const shouldAssist = isCorrect && adaptiveState === AdaptiveState.MAX_ASSIST;

                            return (
                                <motion.div
                                    key={`drag-${item.id}`}
                                    drag
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    onDragStart={(e) => handleDragStart(item.id, e)}
                                    onDragEnd={(_e, info) => handleDragEnd(item.id, info)}
                                    whileDrag={{ scale: 1.15, zIndex: 9999, transition: { duration: 0.1 } }}
                                    style={{
                                        width: 'clamp(96px, 18vw, 140px)', // Wider for chunks
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-4xl sm:text-5xl lg:text-6xl text-white shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.4)] border-b-6 border-black/30 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing tracking-tight ${shouldAssist ? 'ring-8 ring-indigo-400 ring-opacity-60' : ''
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
                        activeDragId={draggedChunk}
                        placedIds={placedChunk ? [placedChunk] : []}
                    />
                </div>
            </main>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {adaptiveState === AdaptiveState.GUIDED && !placedChunk && (
                <HintOverlay adaptiveState={adaptiveState} hintText="Look for the purple glowing box. Which chunk fits best?" />
            )}

            {adaptiveState === AdaptiveState.MAX_ASSIST && !placedChunk && (
                <HintOverlay adaptiveState={adaptiveState} hintText="The bouncing chunk matches the missing sounds!" />
            )}

            {showVictory && (
                <VictoryModal
                    title="Blends Master!"
                    isOpen={true} starsEarned={1}
                    onNext={() => {
                        navigate('/reading/level3');
                    }}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}

