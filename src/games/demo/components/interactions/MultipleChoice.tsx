import { motion } from 'framer-motion';
import type { InteractionData, AssistLevel } from '../../demoTypes';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

export function MultipleChoice({ data, assistLevel, onCorrect, onError, onInteract }: Props) {
    if (!data.choices || !data.correctAnswer) return null;

    const handleChoiceClick = (choice: string) => {
        onInteract();
        if (choice === data.correctAnswer) {
            onCorrect();
        } else {
            onError();
        }
    };

    const isColumn = data.layout === 'column';
    const containerClass = isColumn
        ? "flex flex-col gap-4 w-full max-w-md"
        : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl";

    return (
        <div className="w-full flex flex-col items-center">
            {data.question && (
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-8 text-center bg-white/50 px-6 py-2 rounded-full shadow-sm">
                    {data.question}
                </h3>
            )}

            <div className={containerClass}>
                {data.choices.map((choice, i) => {
                    const isCorrect = choice === data.correctAnswer;

                    // Adaptive Hints
                    // Assist Level 3 or 4: Highlight the correct button prominently
                    // Assist Level 2: Dim the incorrect answers slightly
                    const showHint = assistLevel >= 3 && isCorrect;
                    const dimWrong = assistLevel >= 2 && !isCorrect;

                    let btnClass = "relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-semibold text-lg sm:text-xl transition-all duration-300 shadow-md transform hover:-translate-y-1 hover:shadow-lg active:translate-y-0 text-gray-700 bg-white border-b-4 border-gray-200";

                    if (showHint) {
                        btnClass = "relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl transition-all duration-300 shadow-xl transform scale-105 hover:scale-110 active:scale-95 text-green-800 bg-green-100 border-b-4 border-green-300 ring-4 ring-green-400/50";
                    } else if (dimWrong) {
                        btnClass = "relative overflow-hidden w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl font-medium text-lg sm:text-xl transition-all duration-300 shadow-sm text-gray-400 bg-gray-50 border-gray-100 opacity-60";
                    }

                    return (
                        <motion.button
                            key={choice}
                            onClick={() => handleChoiceClick(choice)}
                            className={btnClass}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: dimWrong ? 0.6 : 1, scale: showHint ? 1.05 : 1 }}
                            transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Shine effect on hint */}
                            {showHint && (
                                <motion.div
                                    className="absolute -inset-full bg-white/40 skew-x-12"
                                    animate={{ left: ["-100%", "200%"] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
