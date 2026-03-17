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
import { CharacterGuide } from '../../../components/shared/CharacterGuide';
import '../../workshop/workshop.css';

// ─── Level 2 Data (Blends & Digraphs) ──────────────────────────────
const LEVEL_TASKS = [
    { id: 'ship', word: 'SHIP', missingChunk: 'SH', missingIndices: [0, 1], distractors: ['CH', 'TH', 'SL', 'TR'] },
    { id: 'frog', word: 'FROG', missingChunk: 'FR', missingIndices: [0, 1], distractors: ['FL', 'TR', 'CR', 'BR'] },
    { id: 'cash', word: 'CASH', missingChunk: 'SH', missingIndices: [2, 3], distractors: ['CH', 'TH', 'CK', 'NG'] },
    { id: 'play', word: 'PLAY', missingChunk: 'PL', missingIndices: [0, 1], distractors: ['PR', 'SL', 'FL', 'CL'] },
    { id: 'chin', word: 'CHIN', missingChunk: 'CH', missingIndices: [0, 1], distractors: ['SH', 'WH', 'TH', 'PH'] },
    { id: 'clap', word: 'CLAP', missingChunk: 'CL', missingIndices: [0, 1], distractors: ['FL', 'SL', 'PL', 'GL'] },
    { id: 'swim', word: 'SWIM', missingChunk: 'SW', missingIndices: [0, 1], distractors: ['SN', 'SL', 'SC', 'SP'] },
    { id: 'grip', word: 'GRIP', missingChunk: 'GR', missingIndices: [0, 1], distractors: ['CR', 'DR', 'PR', 'FR'] },
    { id: 'that', word: 'THAT', missingChunk: 'TH', missingIndices: [0, 1], distractors: ['CH', 'WH', 'SH', 'PH'] },
    { id: 'slip', word: 'SLIP', missingChunk: 'SL', missingIndices: [0, 1], distractors: ['FL', 'CL', 'PL', 'GL'] },
    { id: 'wrap', word: 'WRAP', missingChunk: 'WR', missingIndices: [0, 1], distractors: ['TR', 'DR', 'GR', 'PR'] },
    { id: 'drop', word: 'DROP', missingChunk: 'DR', missingIndices: [0, 1], distractors: ['TR', 'GR', 'FR', 'CR'] },
];

export default function WordFactoryLevel2() {
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

    const [placedChunk, setPlacedChunk] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);
    const [draggedChunk, setDraggedChunk] = useState<string | null>(null);

    const dropZoneRef = useRef<HTMLDivElement>(null);

    const { speak, isSpeaking, enableReadAloud } = useReadAloud();

    // Auto-speak on new task
    useEffect(() => {
        const timer = setTimeout(() => speak(task.word), 500);
        return () => clearTimeout(timer);
    }, [currentTaskIdx, speak, task.word]);

    // Adaptive Auto-speak
    useEffect(() => {
        if (enableReadAloud && !placedChunk && !isSpeaking) {
            speak(task.word, true);
        }
    }, [enableReadAloud, placedChunk, isSpeaking, speak, task.word]);

    // Reset adaptation metrics when task changes
    useEffect(() => {
        resetAdaptation(`level2-${currentTaskIdx}`);
    }, [currentTaskIdx]);

    // Track mouse movement for jitter detection
    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    // 4-stage assist flags
    const isReduced = assistLevel >= 2;
    const isGlowing = assistLevel >= 3;
    const isReveal = assistLevel >= 4;

    // Filter conveyor items based on assist stage
    const beltItems = useMemo(() => {
        const correctChunk = task.missingChunk;
        let choices = [correctChunk, ...task.distractors];

        if (isReveal) {
            choices = [correctChunk];
        } else if (isReduced) {
            const distractors = task.distractors.filter(d => d !== correctChunk);
            const dist = distractors[Math.floor(Math.random() * distractors.length)];
            choices = [correctChunk, dist];
        }

        return choices.sort().map(chunk => {
            const isCorrect = chunk === correctChunk;
            let bgColor = '#FCA5A5';
            if (isCorrect && isReveal) bgColor = '#A78BFA';
            return { id: chunk, label: chunk, color: bgColor };
        });
    }, [task, assistLevel]);

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

    const handleDragStart = useCallback((id: string, _e: any) => {
        setDraggedChunk(id);
        monitor.recordInteraction();
        trackClick();
    }, [monitor, trackClick]);

    const handleDragEnd = useCallback(
        (id: string, info: any) => {
            setDraggedChunk(null);
            if (!dropZoneRef.current) return;

            const dropRect = dropZoneRef.current.getBoundingClientRect();
            const cx = dropRect.left + dropRect.width / 2;
            const cy = dropRect.top + dropRect.height / 2;

            const dropPoint = info.point;
            const dist = Math.hypot(dropPoint.x - cx, dropPoint.y - cy);

            if (dist < 120) {
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
                rotateZ: [0, 8, -8, 0],
                transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
            });
        } else {
            maxAssistControls.stop();
        }
    }, [isReveal, maxAssistControls]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden" onClick={trackClick}>
            <WordFactoryHUD title="Blends & Digraphs" icon="merge_type" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full h-full flex flex-col items-center justify-center min-h-screen relative z-10">
                {/* 3D Machine Backdrop */}
                <div className="relative w-full max-w-3xl bg-[#0F172A] rounded-[3rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6),inset_0_4px_0_rgba(255,255,255,0.1)] border-[#334155] mb-12 flex flex-col items-center justify-center h-80 gap-8">
                    <div className="absolute top-0 w-32 h-4 bg-cyan-500/50 blur shadow-[0_0_30px_#06b6d4]" />

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                        onClick={() => speak(task.word)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'} border border-slate-700`}
                    >
                        <Volume2 className="w-6 h-6" />
                    </motion.button>

                    {/* Word Display Area */}
                    <div className="flex gap-4 items-center justify-center">
                        {task.word.split('').map((char, index) => {
                            const isMissing = task.missingIndices.includes(index);
                            const isFirstMissing = index === task.missingIndices[0];

                            if (isMissing && !isFirstMissing) return null;

                            if (isMissing && isFirstMissing) {
                                return (
                                    <div
                                        key={`slot-chunk`}
                                        ref={dropZoneRef}
                                        className={`w-40 h-32 rounded-3xl border-4 bg-slate-800/80 flex items-center justify-center relative transition-colors duration-300 ${isReveal && !placedChunk
                                            ? 'border-indigo-400 bg-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.6)]'
                                            : isGlowing && !placedChunk
                                                ? 'border-indigo-300 bg-indigo-300/10 shadow-[0_0_25px_rgba(165,180,252,0.4)]'
                                                : isReduced && !placedChunk
                                                    ? 'border-indigo-300/50 bg-indigo-400/10'
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
                            const shouldAssist = isCorrect && isReveal;

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
                                        width: 'clamp(96px, 18vw, 140px)',
                                        height: 'clamp(64px, 12vw, 96px)',
                                        backgroundColor: item.color,
                                    }}
                                    animate={shouldAssist ? maxAssistControls : { y: 0 }}
                                    className={`relative flex items-center justify-center rounded-2xl font-black text-4xl sm:text-5xl lg:text-6xl text-white shadow-[0_8px_16px_rgba(0,0,0,0.3),inset_0_2px_0_rgba(255,255,255,0.4)] border-b-6 border-black/30 ws-touch-target pointer-events-auto cursor-grab active:cursor-grabbing tracking-tight ${shouldAssist ? 'ring-8 ring-indigo-400 ring-opacity-60' : ''}`}
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

            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="Blends Master!"
                    isOpen={true} starsEarned={1}
                    onNext={() => navigate('/word-factory/level3')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
