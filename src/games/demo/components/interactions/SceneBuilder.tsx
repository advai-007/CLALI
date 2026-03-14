import { useState } from 'react';
import { motion } from 'framer-motion';
import type { InteractionData, AssistLevel } from '../../demoTypes';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

// Map strings to simple SVGs for the demo
const getSVGForObject = (obj: string) => {
    switch (obj.toLowerCase()) {
        case 'leo':
            return <text y="40" fontSize="40">🦊</text>; // Using emoji purely inside the SVG tag if no path available, but we will use SVGs!
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
        default:
            return <circle cx="25" cy="25" r="20" fill="#9ca3af" />;
    }
};

export function SceneBuilder({ data, assistLevel, onCorrect, onInteract }: Props) {
    const [placed, setPlaced] = useState<string[]>([]);

    if (!data.sceneObjects) return null;

    const handlePlace = (obj: string) => {
        onInteract();
        if (!placed.includes(obj)) {
            const newPlaced = [...placed, obj];
            setPlaced(newPlaced);
            if (newPlaced.length === data.sceneObjects!.length) {
                // All placed! Wait a sec then trigger correct
                setTimeout(onCorrect, 1000);
            }
        }
    };

    return (
        <div className="w-full flex md:flex-row flex-col items-center gap-8 max-w-5xl">
            {/* Sidebar with items to place */}
            <div className="flex flex-col gap-4 bg-white/60 p-6 rounded-3xl shadow-sm border-2 border-white min-w-[200px]">
                <h3 className="font-bold text-gray-700 text-center mb-2">Place Objects</h3>
                {data.sceneObjects.map((obj, i) => {
                    const isPlaced = placed.includes(obj);
                    // Assist Level 3/4: pulse the next item to click
                    const isNextToPlace = assistLevel >= 3 && !isPlaced && placed.length === i;

                    return (
                        <motion.button
                            key={obj}
                            onClick={() => handlePlace(obj)}
                            disabled={isPlaced}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isPlaced ? 'bg-gray-100 border-gray-200 opacity-50' :
                                isNextToPlace ? 'bg-green-100 border-green-400 ring-4 ring-green-200 scale-105' : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                                }`}
                            animate={isNextToPlace ? { scale: [1, 1.05, 1] } : {}}
                            transition={isNextToPlace ? { repeat: Infinity, duration: 1 } : {}}
                        >
                            <svg width="50" height="50" viewBox="0 0 50 50">
                                {getSVGForObject(obj)}
                            </svg>
                            <span className="font-semibold text-gray-700">{obj}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* The Canvas */}
            <div className="flex-grow w-full h-64 sm:h-96 bg-gradient-to-b from-blue-50 to-green-50 rounded-3xl shadow-inner border-4 border-white relative overflow-hidden flex items-center justify-center">
                {placed.length === 0 && (
                    <span className="text-gray-400 font-medium text-xl">Click objects to build the scene</span>
                )}

                {placed.map((obj, index) => {
                    // Simple deterministic layout based on index for the demo
                    const x = 10 + (index * 20);
                    const y = 20 + (index % 2 * 20);

                    return (
                        <motion.div
                            key={'placed-' + obj}
                            initial={{ scale: 0, opacity: 0, y: -50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="absolute drop-shadow-xl"
                            style={{ left: `${x}%`, top: `${y}%` }}
                        >
                            <svg width="150" height="150" viewBox="0 0 50 50" className="opacity-90">
                                {getSVGForObject(obj)}
                            </svg>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
