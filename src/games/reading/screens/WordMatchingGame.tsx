import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WordFactoryHUD from '../components/WordFactoryHUD';
import VictoryModal from '../../workshop/components/VictoryModal';
import FeedbackToast from '../../workshop/components/FeedbackToast';
import { useReading } from '../ReadingContext';
import { useReadingMonitor } from '../useReadingMonitor';
import { POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../../workshop/workshopTypes';
import { CharacterGuide } from '../../../components/shared/CharacterGuide';
import '../../workshop/workshop.css';

// ─── Word Matching Tasks ───────────────────────────────────────────────────
const MATCHING_TASKS = [
    { id: 't1', icon: 'pets', answer: 'DOG', choices: ['DOG', 'CAT', 'PIG', 'HEN'] },
    { id: 't2', icon: 'directions_car', answer: 'CAR', choices: ['BUS', 'CAR', 'VAN', 'JET'] },
    { id: 't3', icon: 'wb_sunny', answer: 'SUN', choices: ['SUN', 'SKY', 'FOG', 'DEW'] },
    { id: 't4', icon: 'home', answer: 'HOUSE', choices: ['HOUSE', 'FLAT', 'BARN', 'HUT'] },
    { id: 't5', icon: 'local_florist', answer: 'FLOWER', choices: ['TREE', 'LEAF', 'FLOWER', 'SEED'] },
    { id: 't6', icon: 'water_drop', answer: 'DROP', choices: ['DROP', 'RAIN', 'POOL', 'WAVE'] },
    { id: 't7', icon: 'star', answer: 'STAR', choices: ['MOON', 'STAR', 'COMET', 'RING'] },
    { id: 't8', icon: 'sports_basketball', answer: 'BALL', choices: ['BAT', 'NET', 'BALL', 'CUP'] },
    { id: 't9', icon: 'lunch_dining', answer: 'FOOD', choices: ['FOOD', 'DISH', 'FORK', 'JUG'] },
    { id: 't10', icon: 'forest', answer: 'TREE', choices: ['BUSH', 'LOG', 'TREE', 'LEAF'] },
    { id: 't11', icon: 'face', answer: 'FACE', choices: ['NOSE', 'FACE', 'HAIR', 'CHIN'] },
    { id: 't12', icon: 'airplanemode_active', answer: 'PLANE', choices: ['PLANE', 'BOAT', 'TRAIN', 'CAR'] },
];


export default function WordMatchingGame() {
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

    const [taskIdx, setTaskIdx] = useState(0);
    const [answered, setAnswered] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);

    const task = MATCHING_TASKS[taskIdx];

    // Reset adaptation metrics when task changes
    useEffect(() => {
        resetAdaptation(`matching-${taskIdx}`);
    }, [taskIdx]);

    // Track mouse movement
    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    // 4-stage assist flags
    const isReduced = assistLevel >= 2;
    const isGlowing = assistLevel >= 3;
    const isReveal = assistLevel >= 4;

    // Compute displayed choices based on assist stage
    const displayChoices = (() => {
        if (isReveal) {
            // Stage 4: Only correct + 1 distractor
            const dist = task.choices.find(c => c !== task.answer)!;
            return [task.answer, dist].sort((a, b) => a.localeCompare(b));
        } else if (isReduced) {
            // Stage 2: Show correct + 2 distractors
            const distractors = task.choices.filter(c => c !== task.answer).slice(0, 2);
            return [task.answer, ...distractors].sort((a, b) => a.localeCompare(b));
        }
        return task.choices; // Full set
    })();

    useEffect(() => {
        monitor.startTrackingTask();
        setAnswered(null);
        return () => monitor.stopTracking();
    }, [taskIdx, monitor]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId(p => p + 1);
    }, []);

    const handleChoice = useCallback((choice: string) => {
        if (answered) return;
        trackClick();
        setAnswered(choice);

        if (choice === task.answer) {
            monitor.recordCorrectAction();
            sendAdaptive({ type: 'CORRECT_ACTION' });
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

            setTimeout(() => {
                if (taskIdx < MATCHING_TASKS.length - 1) {
                    setTaskIdx(p => p + 1);
                    setAnswered(null);
                } else {
                    addStars(2);
                    setShowVictory(true);
                }
            }, 1200);
        } else {
            monitor.recordIncorrectAction();
            sendAdaptive({ type: 'INCORRECT_ACTION' });
            trackError();
            showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
            setTimeout(() => setAnswered(null), 1000);
        }
    }, [answered, task, taskIdx, monitor, sendAdaptive, showFeedback, addStars, trackClick, trackError]);

    return (
    <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden" onClick={trackClick}>
            <WordFactoryHUD title="Word Matching" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full min-h-screen flex flex-col items-center justify-center relative z-10 gap-8">

                {/* Progress indicator */}
                <div className="flex gap-2">
                    {MATCHING_TASKS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-colors ${i < taskIdx ? 'bg-green-400' : i === taskIdx ? 'bg-yellow-400' : 'bg-slate-600'}`}
                        />
                    ))}
                </div>

                {/* Icon display card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                        className={`relative w-56 h-56 bg-[#334155] rounded-[2rem] border-8 border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.15)] flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isReveal ? 'ring-8 ring-yellow-400/40 ring-offset-4 ring-offset-[#334155]' : isGlowing ? 'ring-4 ring-amber-300/30 ring-offset-2 ring-offset-[#334155]' : ''}`}
                    >
                        <span
                            className="material-symbols-outlined text-white drop-shadow-lg"
                            style={{ fontSize: '6rem', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                        >
                            {task.icon}
                        </span>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">What is this?</p>
                    </motion.div>
                </AnimatePresence>

                {/* Word choice buttons */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {displayChoices.map((choice) => {
                        const isCorrect = choice === task.answer;
                        const isAnswered = answered !== null;
                        const wasChosen = answered === choice;

                        const isMaxAssist = isCorrect && isReveal && !isAnswered;

                        let bg = 'bg-slate-700 border-slate-600 text-white';
                        if (isAnswered && wasChosen) {
                            bg = isCorrect ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white';
                        } else if (isAnswered && isCorrect) {
                            bg = 'bg-green-500/50 border-green-400 text-white';
                        } else if (!isAnswered && isGlowing && isCorrect) {
                            // Stage 3: soft amber glow on correct choice
                            bg = 'bg-slate-700 border-amber-300 text-white shadow-[0_0_25px_rgba(251,191,36,0.5)] ring-2 ring-amber-300/60';
                        } else if (isMaxAssist) {
                            bg = 'bg-yellow-500 border-yellow-400 text-white shadow-[0_0_30px_rgba(234,179,8,0.6)]';
                        }

                        return (
                            <motion.button
                                key={choice}
                                whileHover={!isAnswered ? { scale: 1.05, y: -2 } : {}}
                                whileTap={!isAnswered ? { scale: 0.95 } : {}}
                                animate={isMaxAssist ? {
                                    scale: [1, 1.1, 1],
                                    rotateZ: [0, 2, -2, 0],
                                } : {}}
                                transition={isMaxAssist ? { repeat: Infinity, duration: 1.4 } : {}}
                                onClick={() => handleChoice(choice)}
                                className={`py-5 px-4 rounded-2xl border-4 font-black text-2xl shadow-[0_6px_0_rgba(0,0,0,0.3)] transition-colors cursor-pointer ws-touch-target ${bg}`}
                            >
                                {choice}
                            </motion.button>
                        );
                    })}
                </div>
            </main>

            {/* Character Guide at the bottom */}
            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="Word Matching Complete!"
                    isOpen={true}
                    starsEarned={2}
                    onNext={() => navigate('/word-factory/level5')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
