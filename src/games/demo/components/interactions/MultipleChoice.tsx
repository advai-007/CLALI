import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractionData, AssistLevel } from '../../demoTypes';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

export function MultipleChoice({ data, assistLevel, onCorrect, onError, onInteract }: Props) {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    if (!data.choices || !data.correctAnswer) return null;

    const distractors = data.choices.filter(choice => choice !== data.correctAnswer);
    const reducedWrongCount = data.choices.length <= 3 ? 1 : 2;
    const visibleChoices = assistLevel >= 4
        ? data.choices.filter(choice => choice === data.correctAnswer || choice === distractors[0])
        : assistLevel >= 2
            ? data.choices.filter(choice => choice === data.correctAnswer || distractors.slice(0, reducedWrongCount).includes(choice))
            : data.choices;

    const handleChoiceClick = (choice: string) => {
        if (selectedChoice) return;

        onInteract();
        setSelectedChoice(choice);

        if (choice === data.correctAnswer) {
            setFeedback('correct');
            window.setTimeout(() => {
                onCorrect();
            }, 700);
            return;
        }

        setFeedback('incorrect');
        onError();
        window.setTimeout(() => {
            setSelectedChoice(null);
            setFeedback('idle');
        }, 850);
    };

    const isColumn = data.layout === 'column';
    const containerClass = isColumn
        ? 'flex flex-col gap-4 w-full max-w-md'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl';

    const feedbackText = feedback === 'correct'
        ? 'Nice job. That is the right answer.'
        : feedback === 'incorrect'
            ? 'Almost. Try again.'
            : null;

    return (
        <div className="w-full flex flex-col items-center gap-5">
            {data.question && (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center bg-white/70 px-6 py-3 rounded-full shadow-sm border border-white">
                    {data.question}
                </h3>
            )}

            <AnimatePresence mode="wait">
                {feedbackText && (
                    <motion.div
                        key={feedback}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        className={`rounded-2xl px-5 py-3 font-semibold shadow-sm border ${
                            feedback === 'correct'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                        {feedbackText}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={containerClass}>
                {visibleChoices.map((choice, index) => {
                    const isCorrect = choice === data.correctAnswer;
                    const isChosen = selectedChoice === choice;
                    const showHint = assistLevel >= 3 && isCorrect && feedback === 'idle';
                    const dimWrong = assistLevel >= 2 && !isCorrect && feedback === 'idle';

                    let btnClass = 'relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-semibold text-lg sm:text-xl transition-all duration-300 shadow-md transform hover:-translate-y-1 hover:shadow-lg active:translate-y-0 text-gray-700 bg-white border-b-4 border-gray-200';

                    if (feedback === 'correct' && isChosen) {
                        btnClass = 'relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl shadow-xl text-green-900 bg-green-100 border-b-4 border-green-400 ring-4 ring-green-300';
                    } else if (feedback === 'incorrect' && isChosen) {
                        btnClass = 'relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl shadow-lg text-rose-800 bg-rose-100 border-b-4 border-rose-300 ring-4 ring-rose-200';
                    } else if (showHint) {
                        btnClass = 'relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl transition-all duration-300 shadow-xl transform scale-105 hover:scale-110 active:scale-95 text-green-800 bg-green-100 border-b-4 border-green-300 ring-4 ring-green-400/50';
                    } else if (dimWrong) {
                        btnClass = 'relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-medium text-lg sm:text-xl transition-all duration-300 shadow-sm text-gray-400 bg-gray-50 border-gray-100 opacity-60';
                    }

                    return (
                        <motion.button
                            key={choice}
                            onClick={() => handleChoiceClick(choice)}
                            disabled={feedback === 'correct'}
                            className={btnClass}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: dimWrong ? 0.6 : 1,
                                scale: showHint ? 1.05 : 1,
                                x: feedback === 'incorrect' && isChosen ? [0, -8, 8, -4, 0] : 0,
                            }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                            whileTap={feedback === 'idle' ? { scale: 0.95 } : {}}
                        >
                            {showHint && (
                                <motion.div
                                    className="absolute -inset-full bg-white/40 skew-x-12"
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            )}
                            <span className="relative z-10">{choice}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
