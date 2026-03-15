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

const getSVGForObject = (obj: string) => {
    switch (obj.toLowerCase()) {
        case 'bird':
            return <path d="M 10 30 Q 25 10 40 30 Q 25 50 10 30 Z" fill="#3b82f6" />;
        case 'river':
            return <path d="M 0 40 Q 25 30 50 40 T 100 40 L 100 50 L 0 50 Z" fill="#60a5fa" />;
        case 'net':
            return <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />;
        case 'rabbit':
            return <path d="M 20 40 Q 20 20 30 20 Q 40 20 40 40 Z" fill="#d1d5db" />;
        case 'trees':
            return <path d="M 25 50 L 25 30 L 10 30 L 25 10 L 40 30 L 25 30 Z" fill="#22c55e" />;
        case 'bush':
            return <circle cx="25" cy="35" r="15" fill="#166534" />;
        case 'rock':
            return <path d="M 10 35 L 18 20 L 35 18 L 42 30 L 38 40 L 18 42 Z" fill="#94a3b8" />;
        case 'fish':
            return <path d="M 10 25 Q 20 10 34 25 Q 20 40 10 25 Z M 34 25 L 44 18 L 44 32 Z" fill="#0ea5e9" />;
        default:
            return <circle cx="25" cy="25" r="20" fill="#9ca3af" />;
    }
};

const SCENE_POSITIONS: Record<string, { left: string; top: string; width: number }> = {
    bird: { left: '58%', top: '24%', width: 120 },
    river: { left: '18%', top: '62%', width: 180 },
    net: { left: '63%', top: '50%', width: 110 },
    rabbit: { left: '50%', top: '52%', width: 120 },
    bush: { left: '70%', top: '56%', width: 125 },
    trees: { left: '22%', top: '28%', width: 150 },
};

export function SceneBuilder({ data, assistLevel, onCorrect, onError, onInteract }: Props) {
    const [placedTargets, setPlacedTargets] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [lastPicked, setLastPicked] = useState<string | null>(null);

    if (!data.sceneTargets || !data.sceneOptions) return null;

    const sceneTargets = data.sceneTargets;
    const sceneOptions = assistLevel >= 4
        ? sceneTargets
        : assistLevel >= 2
            ? [...sceneTargets, ...data.sceneOptions.filter(option => !sceneTargets.includes(option)).slice(0, 1)]
            : data.sceneOptions;

    const remainingTargets = sceneTargets.filter(target => !placedTargets.includes(target));
    const highlightedTarget = assistLevel >= 3 ? remainingTargets[0] : null;

    const handlePick = (obj: string) => {
        if (placedTargets.includes(obj) || feedback === 'correct') return;

        onInteract();
        setLastPicked(obj);

        if (sceneTargets.includes(obj)) {
            const nextPlaced = [...placedTargets, obj];
            setPlacedTargets(nextPlaced);
            setFeedback('correct');

            if (nextPlaced.length === sceneTargets.length) {
                window.setTimeout(() => {
                    onCorrect();
                }, 900);
            } else {
                window.setTimeout(() => {
                    setFeedback('idle');
                    setLastPicked(null);
                }, 700);
            }
            return;
        }

        setFeedback('incorrect');
        onError();
        window.setTimeout(() => {
            setFeedback('idle');
            setLastPicked(null);
        }, 850);
    };

    const feedbackText = feedback === 'correct'
        ? lastPicked && sceneTargets.includes(lastPicked)
            ? `${lastPicked} belongs in this scene.`
            : null
        : feedback === 'incorrect'
            ? `${lastPicked} does not belong in this scene.`
            : null;

    return (
        <div className="w-full flex md:flex-row flex-col items-stretch gap-8 max-w-5xl">
            <div className="flex flex-col gap-4 bg-white/70 p-6 rounded-3xl shadow-sm border-2 border-white min-w-[260px]">
                <div>
                    <h3 className="font-bold text-gray-800 text-xl text-center">Build The Scene</h3>
                    <p className="text-sm text-gray-500 text-center mt-1">
                        Pick the objects Leo really saw.
                    </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">Still needed</p>
                    <div className="flex flex-wrap gap-2">
                        {remainingTargets.map(target => (
                            <span
                                key={target}
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    target === highlightedTarget
                                        ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                        : 'bg-white text-emerald-700'
                                }`}
                            >
                                {target}
                            </span>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {feedbackText && (
                        <motion.div
                            key={`${feedback}-${lastPicked}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                                feedback === 'correct'
                                    ? 'bg-green-50 text-green-800 border-green-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                            {feedbackText}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-3">
                    {sceneOptions.map((obj) => {
                        const isPlaced = placedTargets.includes(obj);
                        const isHinted = obj === highlightedTarget;
                        const isWrongPick = feedback === 'incorrect' && lastPicked === obj;

                        return (
                            <motion.button
                                key={obj}
                                onClick={() => handlePick(obj)}
                                disabled={isPlaced}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                                    isPlaced
                                        ? 'bg-gray-100 border-gray-200 opacity-50'
                                        : isWrongPick
                                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                                            : isHinted
                                                ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-200'
                                                : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                                }`}
                                animate={{
                                    scale: isHinted ? [1, 1.03, 1] : 1,
                                    x: isWrongPick ? [0, -8, 8, -4, 0] : 0,
                                }}
                                transition={isHinted ? { repeat: Infinity, duration: 1.1 } : { duration: 0.35 }}
                            >
                                <svg width="50" height="50" viewBox="0 0 50 50">
                                    {getSVGForObject(obj)}
                                </svg>
                                <span className="font-semibold text-gray-700">{obj}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-grow w-full min-h-[380px] bg-gradient-to-b from-blue-50 via-emerald-50 to-green-100 rounded-3xl shadow-inner border-4 border-white relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-green-200/80" />
                <div className="absolute left-6 top-6 px-4 py-2 rounded-full bg-white/80 text-sm font-semibold text-gray-700 shadow-sm">
                    Scene progress: {placedTargets.length}/{sceneTargets.length}
                </div>

                {placedTargets.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center px-8">
                        <div className="bg-white/80 rounded-3xl px-8 py-6 shadow-sm text-center max-w-md">
                            <p className="text-xl font-semibold text-gray-700">
                                Choose only the objects that belong in Leo&apos;s scene.
                            </p>
                        </div>
                    </div>
                )}

                <div className="absolute left-10 bottom-20">
                    <svg width="120" height="120" viewBox="0 0 50 50" className="opacity-85 drop-shadow-lg">
                        <path d="M 8 38 Q 10 20 24 18 Q 38 20 40 38 Q 30 45 18 45 Z" fill="#f97316" />
                        <path d="M 16 18 L 22 8 L 26 18 Z" fill="#fb923c" />
                        <path d="M 24 18 L 30 8 L 34 18 Z" fill="#fb923c" />
                    </svg>
                </div>

                {placedTargets.map((obj) => {
                    const position = SCENE_POSITIONS[obj.toLowerCase()] ?? { left: '50%', top: '50%', width: 120 };

                    return (
                        <motion.div
                            key={`placed-${obj}`}
                            initial={{ scale: 0.2, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                            className="absolute drop-shadow-xl"
                            style={{ left: position.left, top: position.top, transform: 'translate(-50%, -50%)' }}
                        >
                            <svg width={position.width} height={position.width} viewBox="0 0 50 50" className="opacity-95">
                                {getSVGForObject(obj)}
                            </svg>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
