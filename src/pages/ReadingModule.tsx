import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdaptation } from '../hooks/useAdaptation';
import { useFaceTracking } from '../hooks/useFaceTracking';
import { useTrackingContext } from '../context/TrackingContext';
import { useAuth } from '../context/AuthContext';
import { SensorDebugPanel } from '../components/adaptive/SensorDebugPanel';

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

    // Face tracking
    const videoRef = useRef<HTMLVideoElement>(null);
    const { baseline } = useTrackingContext();
    const faceTracking = useFaceTracking(videoRef);

    // Auto-start face tracking if baseline exists (user already calibrated)
    useEffect(() => {
        if (baseline && !faceTracking.isTracking && !faceTracking.isInitializing) {
            faceTracking.initializeTracker();
        }
    }, [baseline]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pass face metrics + baseline into the adaptation system
    const { studentUser } = useAuth();
    const adaptation = useAdaptation({
        faceMetrics: faceTracking.metrics,
        baseline,
        studentId: studentUser?.id
    });
    const { adaptations, state, scores, blinkRate, timeOnTask, rawFeatures, faceMetrics, override } = adaptation;
    const [currentParagraph, setCurrentParagraph] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speakParagraph = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (isSpeaking) {
                setIsSpeaking(false);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.85;
            utterance.pitch = 1.1;
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

    // Derive CSS from adaptations
    const fontFamily = adaptations.fontFamily === 'opendyslexic' ? 'font-opendyslexic' : 'font-lexend';
    const headerOpacityClass = adaptations.headerOpacity === 'faded' ? 'opacity-20 hover:opacity-100' : 'opacity-100';
    const navOpacityClass = adaptations.headerOpacity === 'faded' ? 'opacity-30 hover:opacity-100' : 'opacity-100';

    return (
        <>
            {/* Hidden video for face tracking camera feed */}
            <video ref={videoRef} className="hidden" autoPlay playsInline muted />
            <div className={`min-h-screen ${adaptations.bgColorClass} ${fontFamily} flex flex-col transition-all duration-700`}>
                {/* Header */}
                <header className={`p-6 flex items-center justify-between relative z-10 transition-opacity duration-1000 ${headerOpacityClass}`}>
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
                        {/* Read Aloud Button - Appears when adaptation enables it */}
                        <AnimatePresence>
                            {adaptations.enableReadAloud && (
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

                    {/* Calming Widget */}
                    <AnimatePresence>
                        {adaptations.showCalmingWidget && (
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
                    <div className={`w-full flex flex-col my-12 transition-all duration-700 ${adaptations.showCalmingWidget || adaptations.fontSizeClass.includes('4xl') ? 'gap-10' : 'gap-6'}`}>
                        {storyParagraphs.map((para, idx) => {
                            let paraClasses = "opacity-100";
                            if (adaptations.dimInactiveParagraphs) {
                                paraClasses = idx === currentParagraph
                                    ? "opacity-100 scale-[1.02] transform transition-all duration-700 bg-white p-8 rounded-3xl shadow-sm border border-amber-100 ring-4 ring-amber-50"
                                    : "opacity-10 blur-[2px] transition-all duration-700 grayscale";
                            }

                            // Apply bionic reading when enabled and on current paragraph
                            const displayContent = (adaptations.useBionicReading && idx === currentParagraph)
                                ? formatBionicText(para)
                                : para;

                            return (
                                <p
                                    key={idx}
                                    className={`${adaptations.fontSizeClass} text-slate-800 ${paraClasses} font-medium text-center transition-all duration-700 cursor-pointer`}
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

                    {/* Navigation Controls */}
                    <div className={`flex gap-4 mt-auto transition-opacity duration-1000 ${navOpacityClass}`}>
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
                <SensorDebugPanel
                    state={state}
                    scores={scores}
                    blinkRate={blinkRate}
                    timeOnTask={timeOnTask}
                    rawFeatures={rawFeatures}
                    faceMetrics={faceMetrics}
                    override={override}
                />
            </div>
        </>
    );
};

export default ReadingModule;
