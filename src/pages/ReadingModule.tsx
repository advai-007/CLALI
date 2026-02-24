import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Eye, Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBiometrics } from '../hooks/useBiometrics';

const storyParagraphs = [
    "Once upon a time, in a lush green forest, lived a little fox named Felix.",
    "Felix loved to explore. Every day, he would run through the tall grass and chase butterflies.",
    "One afternoon, Felix found a mysterious cave hidden behind a waterfall.",
    "He bravely stepped inside and discovered glowing crystals that lit up the dark walls.",
    "It was the most beautiful discovery he had ever made, and he couldn't wait to tell his friends."
];

const formatBionicText = (text: string) => {
    return text.split(' ').map((word, i) => {
        // Strip out non-alphabetic chars for measurement
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length <= 1) return <span key={i}>{word} </span>;

        // Find index to split based on clean word length
        const halfLength = Math.ceil(cleanWord.length / 2);

        // We need to keep original punctuation in the string.
        // A simple approach is just take the first `halfLength` characters of the actual word string.
        const prefix = word.substring(0, halfLength);
        const suffix = word.substring(halfLength);

        return (
            <span key={i}>
                <span className="font-bold">{prefix}</span>
                {suffix}{' '}
            </span>
        );
    });
};

const ReadingModule = () => {
    const navigate = useNavigate();
    const biometrics = useBiometrics();
    const [currentParagraph, setCurrentParagraph] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Adaptive Styles based on state
    const isHighStress = biometrics.stress === 'high' || biometrics.stress === 'medium';
    const isLowFocus = biometrics.focus === 'low';

    // Base background shifts to calming blue/green if high stress
    const bgColor = isHighStress ? 'bg-sky-50 transition-colors duration-1000' : 'bg-slate-50 transition-colors duration-500';
    const textColor = isHighStress ? 'text-slate-700' : 'text-slate-800';
    const fontSize = isHighStress ? 'text-4xl leading-loose tracking-wide' : 'text-3xl leading-relaxed tracking-normal';
    const fontFamily = isHighStress ? 'font-opendyslexic' : 'font-lexend';

    const speakParagraph = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.85; // Slightly slower for less stress
            utterance.pitch = 1.1; // Friendly pitch
            utterance.onend = () => setIsSpeaking(false);
            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const nextParagraph = () => {
        if (currentParagraph < storyParagraphs.length - 1) {
            setCurrentParagraph(prev => prev + 1);
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }
        }
    };

    const prevParagraph = () => {
        if (currentParagraph > 0) {
            setCurrentParagraph(prev => prev - 1);
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }
        }
    };

    return (
        <div className={`min-h-screen ${bgColor} ${fontFamily} flex flex-col transition-all duration-700`}>
            {/* Header - Fades out on low focus to reduce distraction */}
            <header className={`p-6 flex items-center justify-between relative z-10 transition-opacity duration-1000 ${isLowFocus ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
                <button
                    onClick={() => {
                        window.speechSynthesis?.cancel();
                        navigate('/dashboard');
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-primary transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-400">Reading Time</h1>
                <div className="w-12 h-12 flex items-center justify-center">
                    {/* Read Aloud Button - Appears on High/Medium Stress */}
                    <AnimatePresence>
                        {isHighStress && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => speakParagraph(storyParagraphs[currentParagraph])}
                                className={`w-12 h-12 flex items-center justify-center rounded-full shadow-sm transition-colors ${isSpeaking ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-white text-slate-500 hover:text-indigo-500'
                                    }`}
                                title="Read Aloud"
                            >
                                {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full relative">

                {/* Calming Widget (Appears strictly on High Stress) */}
                <AnimatePresence>
                    {(biometrics.stress === 'high') && (
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
                <div className={`w-full flex flex-col my-12 transition-all duration-700 ${isHighStress ? 'gap-10' : 'gap-6'}`}>
                    {storyParagraphs.map((para, idx) => {
                        // Adaptive Logic for Low Focus: Dim non-active paragraphs, highlight the current one
                        let paraOpacity = "opacity-100";
                        if (isLowFocus) {
                            paraOpacity = idx === currentParagraph
                                ? "opacity-100 scale-[1.02] transform transition-all duration-700 bg-white p-8 rounded-3xl shadow-sm border border-amber-100 ring-4 ring-amber-50"
                                : "opacity-10 blur-[2px] transition-all duration-700 grayscale";
                        }

                        // Apply bionic reading when focus is low
                        const displayContent = (isLowFocus && idx === currentParagraph)
                            ? formatBionicText(para)
                            : para;

                        return (
                            <p
                                key={idx}
                                className={`${fontSize} ${textColor} ${paraOpacity} font-medium text-center transition-all duration-700 cursor-pointer`}
                                onClick={() => {
                                    setCurrentParagraph(idx);
                                    if (isSpeaking) {
                                        window.speechSynthesis.cancel();
                                        setIsSpeaking(false);
                                    }
                                }}
                            >
                                {displayContent}
                            </p>
                        );
                    })}
                </div>

                {/* Navigation Controls - Fades on low focus */}
                <div className={`flex gap-4 mt-auto transition-opacity duration-1000 ${isLowFocus ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                    <button
                        onClick={prevParagraph}
                        disabled={currentParagraph === 0}
                        className="px-8 py-4 bg-white rounded-full font-bold text-slate-500 shadow-sm disabled:opacity-50 hover:bg-slate-50"
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
