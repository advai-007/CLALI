import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import WordFactoryHUD from '../components/WordFactoryHUD';
import VictoryModal from '../../workshop/components/VictoryModal';
import FeedbackToast from '../../workshop/components/FeedbackToast';
import { useReading } from '../ReadingContext';
import { useReadingMonitor } from '../useReadingMonitor';
import { useReadAloud } from '../hooks/useReadAloud';
import { POSITIVE_MESSAGES, ENCOURAGE_MESSAGES } from '../../workshop/workshopTypes';
import { CharacterGuide } from '../../../components/shared/CharacterGuide';
import '../../workshop/workshop.css';

// ─── Level 5 Data (Sentence Fill-In) ──────────────────────────────────────
const LEVEL_TASKS = [
    { id: 'cat', before: 'The cat', blank: '___', after: 'on the mat.', answer: 'SAT', choices: ['SAT', 'RAN', 'HID', 'FLY'] },
    { id: 'dog', before: 'My dog', blank: '___', after: 'very fast.', answer: 'RUNS', choices: ['RUNS', 'EATS', 'SWIMS', 'FLIES'] },
    { id: 'sun', before: 'The sun', blank: '___', after: 'in the sky.', answer: 'SHINES', choices: ['SHINES', 'RAINS', 'FALLS', 'ROLLS'] },
    { id: 'bird', before: 'A bird', blank: '___', after: 'over the tree.', answer: 'FLEW', choices: ['FLEW', 'SWAM', 'DUG', 'ATE'] },
    { id: 'fish', before: 'The fish', blank: '___', after: 'in the pond.', answer: 'SWAM', choices: ['SWAM', 'RAN', 'HOP', 'FELL'] },
    { id: 'rain', before: 'The rain', blank: '___', after: 'all day.', answer: 'FELL', choices: ['FELL', 'SANG', 'FLEW', 'SAT'] },
    { id: 'star', before: 'Stars', blank: '___', after: 'in the night.', answer: 'SHINE', choices: ['SHINE', 'SWIM', 'HIDE', 'SLEEP'] },
    { id: 'frog', before: 'The frog', blank: '___', after: 'on a lily pad.', answer: 'SAT', choices: ['SAT', 'FLY', 'DIGS', 'RUNS'] },
    { id: 'wind', before: 'The wind', blank: '___', after: 'the tree.', answer: 'SHOOK', choices: ['SHOOK', 'ATE', 'GREW', 'SANG'] },
    { id: 'child', before: 'The child', blank: '___', after: 'a book.', answer: 'READ', choices: ['READ', 'SAT', 'FLEW', 'SWAM'] },
    { id: 'flower', before: 'The flower', blank: '___', after: 'in spring.', answer: 'BLOOMED', choices: ['BLOOMED', 'RAINED', 'SWAM', 'SANG'] },
    { id: 'rabbit', before: 'A rabbit', blank: '___', after: 'in the grass.', answer: 'HID', choices: ['HID', 'FLEW', 'SANG', 'SWAM'] },
];

export default function WordFactoryLevel5() {
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

    const [taskIdx, setTaskIdx] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | 'hint'>('correct');
    const [feedbackId, setFeedbackId] = useState(0);
    const [showVictory, setShowVictory] = useState(false);

    const task = LEVEL_TASKS[taskIdx];

    const { speak, isSpeaking, enableReadAloud } = useReadAloud();

    const getFullSentence = useCallback((overrideAnswer?: string) => {
        const text = `${task.before} ${overrideAnswer || 'blank'} ${task.after}`;
        return text;
    }, [task]);

    // Auto-speak on new task
    useEffect(() => {
        const timer = setTimeout(() => speak(getFullSentence()), 500);
        return () => clearTimeout(timer);
    }, [taskIdx, speak, getFullSentence]);

    // Adaptive Auto-speak
    useEffect(() => {
        if (enableReadAloud && !chosen && !isSpeaking) {
            speak(getFullSentence(), true);
        }
    }, [enableReadAloud, chosen, isSpeaking, speak, getFullSentence]);

    useEffect(() => {
        resetAdaptation(`level5-${taskIdx}`);
    }, [taskIdx]);

    useEffect(() => {
        window.addEventListener('mousemove', trackMouseMove);
        return () => window.removeEventListener('mousemove', trackMouseMove);
    }, [trackMouseMove]);

    const isReduced = assistLevel >= 2;
    const isGlowing = assistLevel >= 3;
    const isReveal = assistLevel >= 4;

    const displayChoices = (() => {
        const all = [...task.choices];
        if (isReveal) {
            const dist = all.find(c => c !== task.answer)!;
            return [task.answer, dist].sort((a, b) => a.localeCompare(b));
        }
        if (isReduced) {
            const distractors = all.filter(c => c !== task.answer).slice(0, 2);
            return [task.answer, ...distractors].sort((a, b) => a.localeCompare(b));
        }
        return all;
    })();

    useEffect(() => {
        setCurrentLevel(5);
        setChosen(null);
        monitor.startTrackingTask();
        return () => monitor.stopTracking();
    }, [taskIdx, monitor, setCurrentLevel]);

    const showFeedback = useCallback((msg: string, type: 'correct' | 'incorrect' | 'hint') => {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setFeedbackId(p => p + 1);
    }, []);

    const handleChoice = useCallback((choice: string) => {
        if (chosen) return;
        trackClick();
        setChosen(choice);

        if (choice === task.answer) {
            speak(getFullSentence(choice)); // Speak correct completion
            monitor.recordCorrectAction();
            sendAdaptive({ type: 'CORRECT_ACTION' });
            showFeedback(POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)], 'correct');

            setTimeout(() => {
                if (taskIdx < LEVEL_TASKS.length - 1) {
                    setTaskIdx(p => p + 1);
                } else {
                    addStars(3);
                    setShowVictory(true);
                }
            }, 2000); // Wait longer for full sentence read
        } else {
            monitor.recordIncorrectAction();
            sendAdaptive({ type: 'INCORRECT_ACTION' });
            trackError();
            showFeedback(ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)], 'incorrect');
            setTimeout(() => setChosen(null), 1000);
        }
    }, [chosen, task, taskIdx, monitor, sendAdaptive, showFeedback, addStars, trackClick, trackError, speak, getFullSentence]);

    return (
        <div className="relative min-h-screen bg-[var(--ws-base-grey)] overflow-hidden" onClick={trackClick}>
            <WordFactoryHUD title="Fill the Sentence" monitor={monitor} />

            <main className="pt-24 pb-8 px-4 w-full min-h-screen flex flex-col items-center justify-center relative z-10 gap-8">

                <div className="flex gap-2">
                    {LEVEL_TASKS.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < taskIdx ? 'bg-green-400' : i === taskIdx ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-2xl bg-[#334155] rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.1)] border-8 border-[#1E293B] flex flex-col items-center gap-6"
                    >
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Complete the sentence</p>
                        
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                            onClick={() => speak(getFullSentence(chosen || undefined))}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaking ? 'bg-yellow-500 text-white' : 'bg-slate-700 text-yellow-500 hover:bg-slate-600'} border border-slate-600`}
                        >
                            <Volume2 className="w-6 h-6" />
                        </motion.button>

                        <div className="flex flex-wrap items-center justify-center gap-3 text-4xl font-black text-white text-center leading-relaxed">
                            <span>{task.before}</span>
                            <AnimatePresence mode="wait">
                                {chosen === task.answer ? (
                                    <motion.span
                                        key="filled"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="px-4 py-1 bg-green-500 rounded-xl text-white shadow-[0_4px_0_#166534]"
                                    >
                                        {chosen}
                                    </motion.span>
                                ) : (
                                    <span
                                        className={`px-6 py-1 rounded-xl border-4 border-dashed min-w-[120px] text-center ${isReveal
                                            ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                                            : isGlowing
                                                ? 'border-amber-300 bg-amber-300/10 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                                                : isReduced
                                                    ? 'border-yellow-200/50 bg-yellow-400/10'
                                                    : 'border-slate-500 bg-black/30 text-slate-500'
                                            }`}
                                    >
                                        {isReveal ? '?' : '___'}
                                    </span>
                                )}
                            </AnimatePresence>
                            <span>{task.after}</span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {displayChoices.map((choice) => {
                        const isCorrect = choice === task.answer;
                        const isAnswered = chosen !== null;
                        const wasChosen = chosen === choice;
                        const shouldPulse = !isAnswered && isCorrect && isReveal;
                        const isMaxAssist = isCorrect && isReveal && !isAnswered;

                        let bg = 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600';
                        if (isAnswered && wasChosen) {
                            bg = isCorrect ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white';
                        } else if (isAnswered && isCorrect) {
                            bg = 'bg-green-500/40 border-green-400 text-white';
                        } else if (!isAnswered && isGlowing && isCorrect) {
                            bg = 'bg-slate-700 border-amber-300 text-white shadow-[0_0_25px_rgba(251,191,36,0.5)] ring-2 ring-amber-300/60';
                        } else if (isMaxAssist) {
                            bg = 'bg-yellow-500 border-yellow-400 text-white shadow-[0_0_30px_rgba(234,179,8,0.6)]';
                        }

                        return (
                            <motion.button
                                key={choice}
                                whileHover={!isAnswered ? { scale: 1.04, y: -2 } : {}}
                                whileTap={!isAnswered ? { scale: 0.95 } : {}}
                                animate={isMaxAssist ? {
                                    scale: [1, 1.1, 1],
                                    rotateZ: [0, 2, -2, 0],
                                } : shouldPulse ? {
                                    scale: [1, 1.07, 1],
                                    boxShadow: ['0 0 0 0 rgba(250,204,21,0)', '0 0 0 10px rgba(250,204,21,0.5)', '0 0 0 0 rgba(250,204,21,0)'],
                                } : {}}
                                transition={(isMaxAssist || shouldPulse) ? { repeat: Infinity, duration: 1.4 } : {}}
                                onClick={() => handleChoice(choice)}
                                className={`py-5 px-4 rounded-2xl border-4 font-black text-2xl shadow-[0_6px_0_rgba(0,0,0,0.3)] transition-colors cursor-pointer ws-touch-target ${bg}`}
                            >
                                {choice}
                            </motion.button>
                        );
                    })}
                </div>
            </main>

            <div className="fixed bottom-4 left-4 z-40">
                <CharacterGuide assistLevel={assistLevel} />
            </div>

            <FeedbackToast message={feedbackMsg} type={feedbackType} triggerId={feedbackId} />

            {showVictory && (
                <VictoryModal
                    title="All Done! 🎉"
                    isOpen={true}
                    starsEarned={3}
                    onNext={() => navigate('/dashboard')}
                    onClose={() => navigate('/dashboard')}
                />
            )}
        </div>
    );
}
