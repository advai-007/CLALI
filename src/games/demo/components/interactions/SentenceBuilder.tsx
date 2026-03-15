import { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import type { InteractionData, AssistLevel } from '../../demoTypes';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

export function SentenceBuilder({ data, assistLevel, onCorrect, onError, onInteract }: Props) {
    const { scrambledSentence, correctOrder, question } = data;
    const [words, setWords] = useState<string[]>(() => scrambledSentence ?? []);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

    if (!scrambledSentence || !correctOrder) return null;

    const displayedWords = assistLevel === 4 ? correctOrder : words;

    const checkOrder = () => {
        if (feedback === 'correct') return;

        onInteract();
        const current = displayedWords.join(' ');
        const correct = correctOrder.join(' ');

        if (current === correct) {
            setFeedback('correct');
            window.setTimeout(() => {
                onCorrect();
            }, 800);
            return;
        }

        setFeedback('incorrect');
        onError();
        window.setTimeout(() => {
            setFeedback('idle');
        }, 900);
    };

    return (
        <div className="w-full flex flex-col items-center gap-8">
            {question && (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 bg-white/70 px-6 py-3 rounded-full shadow-sm text-center border border-white">
                    {question}
                </h3>
            )}

            <AnimatePresence mode="wait">
                {feedback !== 'idle' && (
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
                        {feedback === 'correct' ? 'Great sentence. You fixed the page.' : 'The order is not right yet.'}
                    </motion.div>
                )}
            </AnimatePresence>

            {assistLevel >= 3 && (
                <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 px-5 py-3 text-amber-900 font-medium shadow-sm">
                    Helper sentence: {correctOrder.join(' ')}
                </div>
            )}

            <Reorder.Group
                axis="x"
                values={displayedWords}
                onReorder={setWords}
                className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-3xl p-4 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300"
            >
                {displayedWords.map((word, index) => {
                    const isRightPlace = word === correctOrder[index];
                    const showHint = assistLevel >= 2 && isRightPlace && feedback === 'idle';

                    let bg = 'bg-white text-gray-700 border-gray-200';
                    if (feedback === 'correct') {
                        bg = 'bg-green-100 border-green-400 text-green-800';
                    } else if (feedback === 'incorrect') {
                        bg = isRightPlace
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800';
                    } else if (showHint) {
                        bg = 'bg-green-50 border-green-300 text-green-700 ring-2 ring-green-200';
                    }

                    return (
                        <Reorder.Item
                            key={`${word}-${index}`}
                            value={word}
                            onDragStart={feedback === 'idle' ? onInteract : undefined}
                            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing font-bold text-xl sm:text-2xl border-b-4 select-none ${bg}`}
                        >
                            {word}
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            <motion.button
                onClick={checkOrder}
                whileHover={feedback === 'idle' ? { scale: 1.05 } : {}}
                whileTap={feedback === 'idle' ? { scale: 0.95 } : {}}
                className="mt-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-full shadow-lg border-b-4 border-blue-700 transition-colors"
            >
                {feedback === 'correct' ? 'Beautifully fixed' : 'Check Sentence'}
            </motion.button>
        </div>
    );
}
