import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Eye, Play, Pause, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBiometrics } from '../hooks/useBiometrics';

const storyParagraphs = [
    "Once upon a time, in a lush green forest, lived a little fox named Felix.",
    "Felix loved to explore. Every day, he would run through the tall grass and chase butterflies.",
    "One afternoon, Felix found a mysterious cave hidden behind a waterfall.",
    "He bravely stepped inside and discovered glowing crystals that lit up the dark walls.",
    "It was the most beautiful discovery he had ever made, and he couldn't wait to tell his friends."
];

const ReadingModule = () => {
    const navigate = useNavigate();
    const biometrics = useBiometrics();
    const [currentParagraph, setCurrentParagraph] = useState(0);

    // Adaptive Styles based on state
    const isHighStress = biometrics.stress === 'high';
    const isLowFocus = biometrics.focus === 'low';

    // Base background shifts to calming blue/green if high stress
    const bgColor = isHighStress ? 'bg-sky-50 transition-colors duration-1000' : 'bg-slate-50 transition-colors duration-500';
    const textColor = isHighStress ? 'text-slate-700' : 'text-slate-800';
    const fontSize = isHighStress ? 'text-4xl leading-relaxed' : 'text-3xl leading-normal';

    const nextParagraph = () => {
        if (currentParagraph < storyParagraphs.length - 1) {
            setCurrentParagraph(prev => prev + 1);
        }
    };

    const prevParagraph = () => {
        if (currentParagraph > 0) {
            setCurrentParagraph(prev => prev - 1);
        }
    };

    return (
        <div className={`min-h-screen ${bgColor} font-lexend flex flex-col`}>
            {/* Header */}
            <header className="p-6 flex items-center justify-between relative z-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-primary transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-400">Reading Time</h1>
                <div className="w-12" /> {/* Spacer */}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full relative">

                {/* Calming Widget (Appears on High Stress) */}
                <AnimatePresence>
                    {isHighStress && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 w-full flex justify-center z-20"
                        >
                            <div className="bg-sky-100 text-sky-800 px-6 py-3 rounded-full flex items-center gap-3 shadow-sm border border-sky-200">
                                <RefreshCw size={20} className="animate-spin-slow" />
                                <span className="font-semibold text-sm">Take a deep breath... you're doing great!</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Story Area */}
                <div className="w-full flex flex-col gap-6 my-12">
                    {storyParagraphs.map((para, idx) => {
                        // Adaptive Logic for Low Focus: Dim non-active paragraphs, highlight the current one
                        let paraOpacity = "opacity-100";
                        if (isLowFocus) {
                            paraOpacity = idx === currentParagraph ? "opacity-100 scale-105 transform transition-all duration-500 bg-white p-6 rounded-3xl shadow-sm border border-amber-100" : "opacity-20 blur-[1px] transition-all duration-500";
                        }

                        return (
                            <p
                                key={idx}
                                className={`${fontSize} ${textColor} ${paraOpacity} font-medium text-center transition-all duration-500`}
                                onClick={() => setCurrentParagraph(idx)}
                            >
                                {para}
                            </p>
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                <div className="flex gap-4 mt-auto">
                    <button
                        onClick={prevParagraph}
                        disabled={currentParagraph === 0}
                        className="px-8 py-4 bg-white rounded-full font-bold text-slate-500 shadow-sm disabled:opacity-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={nextParagraph}
                        disabled={currentParagraph === storyParagraphs.length - 1}
                        className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-md hover:bg-primary-dark disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </main>

            {/* Development & Debug Panel */}
            <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 w-80 z-50">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Dev Panel: Biometrics</h3>
                    <button
                        onClick={biometrics.toggleSimulation}
                        className={`p-2 rounded-full flex items-center justify-center ${biometrics.isSimulating ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}
                        title="Toggle Auto Simulation"
                    >
                        {biometrics.isSimulating ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                            <Activity size={16} className="text-rose-500" />
                            Stress Level
                        </div>
                        <div className="flex gap-2">
                            {['low', 'medium', 'high'].map(level => (
                                <button
                                    key={`stress-${level}`}
                                    onClick={() => biometrics.setStress(level as any)}
                                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium border ${biometrics.stress === level ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700">
                            <Eye size={16} className="text-blue-500" />
                            Focus Level
                        </div>
                        <div className="flex gap-2">
                            {['low', 'normal', 'high'].map(level => (
                                <button
                                    key={`focus-${level}`}
                                    onClick={() => biometrics.setFocus(level as any)}
                                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium border ${biometrics.focus === level ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingModule;
