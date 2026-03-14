import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import type { InteractionData, AssistLevel } from '../../demoTypes';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

export function SentenceBuilder({ data, assistLevel, onCorrect, onError, onInteract }: Props) {
    const [words, setWords] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (data.scrambledSentence) {
            // Small hack to ensure we track duplicates if any by wrapping in objects
            // For simple string arrays we can just use the strings if they are unique
            setWords(data.scrambledSentence);
            setIsChecking(false);
        }
    }, [data.scrambledSentence]);

    if (!data.scrambledSentence || !data.correctOrder) return null;

    const checkOrder = () => {
        onInteract();
        setIsChecking(true);
        const current = words.join(' ');
        const correct = data.correctOrder!.join(' ');

        if (current === correct) {
            onCorrect();
        } else {
            onError();
            setTimeout(() => setIsChecking(false), 1000); // Reset check state
        }
    };

    // If assist level is high (>=3), automatically sort half of or the whole sentence to help
    // If assist level is max (4), just solve it
    useEffect(() => {
        if (assistLevel === 4) {
            setWords(data.correctOrder!);
        }
    }, [assistLevel, data.correctOrder]);

    return (
        <div className="w-full flex flex-col items-center gap-8">
            {data.question && (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 bg-white/50 px-6 py-2 rounded-full shadow-sm text-center">
                    {data.question}
                </h3>
            )}

            <Reorder.Group
                axis="x"
                values={words}
                onReorder={setWords}
                className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-3xl p-4 bg-white/40 rounded-3xl border-2 border-dashed border-gray-300"
            >
                {words.map((word, index) => {
                    // Hint 2: Highlight the ones that are in the right place
                    const isRightPlace = word === data.correctOrder![index];
                    const showHint = assistLevel >= 2 && isRightPlace;

                    let bg = "bg-white text-gray-700 border-gray-200";
                    if (isChecking) {
                        bg = isRightPlace ? "bg-green-100 border-green-400 text-green-800" : "bg-red-100 border-red-400 text-red-800";
                    } else if (showHint) {
                        bg = "bg-green-50 border-green-300 text-green-700 ring-2 ring-green-200";
                    }

                    return (
                        <Reorder.Item
                            key={word + index} // simplistic key, assumes words are unique or order-stable
                            value={word}
                            onDragStart={onInteract}
                            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing font-bold text-xl sm:text-2xl border-b-4 select-none ${bg}`}
                        >
                            {word}
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            <motion.button
                onClick={checkOrder}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl rounded-full shadow-lg border-b-4 border-blue-700 transition-colors"
            >
                Check Sentence
            </motion.button>
        </div>
    );
}
