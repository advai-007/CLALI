import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReading } from '../ReadingContext';
import { useReadingMonitor } from '../useReadingMonitor';
import { AdaptiveState } from '../../workshop/workshopTypes';

interface WordFactoryHUDProps {
    title: string;
    icon?: string;
    monitor?: ReturnType<typeof useReadingMonitor>;
}

export default function WordFactoryHUD({
    title,
    icon = 'sort_by_alpha',
    monitor,
}: WordFactoryHUDProps) {
    const navigate = useNavigate();
    const { totalStars, currentLevel, adaptiveState, showDebugPanel, setShowDebugPanel } = useReading();

    // Poll signals for debug panel
    const [debugSignals, setDebugSignals] = React.useState(monitor?.getSignals());
    React.useEffect(() => {
        if (!showDebugPanel || !monitor) return;
        const interval = setInterval(() => {
            setDebugSignals(monitor.getSignals());
        }, 500);
        return () => clearInterval(interval);
    }, [showDebugPanel, monitor]);

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 px-4 pt-4 pointer-events-none">
                <div className="max-w-6xl mx-auto flex justify-between items-start">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-white rounded-full plastic-up active:translate-y-1 active:shadow-none transition-all border-4 border-white hover:border-[var(--ws-blue)]/20 ws-touch-target"
                    >
                        <span className="material-symbols-outlined text-[var(--ws-dark)] text-3xl font-bold">
                            arrow_back
                        </span>
                    </button>

                    {/* Title Pill */}
                    <div className="pointer-events-auto bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl plastic-card border-b-4 border-black/5 flex items-center gap-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-white text-xs font-bold uppercase tracking-wider">
                            Level {currentLevel}
                        </span>
                        <h1 className="workshop-heading text-[var(--ws-dark)] text-xl sm:text-2xl font-bold tracking-tight uppercase">
                            {title}
                        </h1>
                        <span
                            className="material-symbols-outlined text-3xl font-bold"
                            style={{ color: 'var(--ws-blue)' }}
                        >
                            {icon}
                        </span>
                    </div>

                    {/* Star Counter & Debug Toggle */}
                    <div className="pointer-events-auto flex gap-3">
                        <button
                            onClick={() => setShowDebugPanel(!showDebugPanel)}
                            className={`flex items-center justify-center w-14 h-14 rounded-full transition-all ws-touch-target ${showDebugPanel ? 'bg-indigo-600 text-white shadow-inner border-2 border-indigo-800' : 'bg-white plastic-up text-gray-400 border-4 border-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                bug_report
                            </span>
                        </button>

                        <div className="flex items-center justify-center min-w-[5rem] bg-white px-4 py-2 rounded-full plastic-up border-4 border-white h-14">
                            <span className="material-symbols-outlined text-3xl drop-shadow-sm mr-1" style={{ color: 'var(--ws-yellow)', fontVariationSettings: "'FILL' 1" }}>
                                star
                            </span>
                            <span className="workshop-math text-[var(--ws-dark)] text-2xl">
                                {totalStars}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Debug Panel Overlay */}
            {showDebugPanel && (
                <div className="fixed top-24 right-4 z-[60] w-72 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-4 shadow-2xl border border-indigo-500/30 font-mono text-sm pointer-events-auto text-indigo-100 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-500/30">
                        <h3 className="font-bold flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-indigo-400">terminal</span>
                            ADAPTIVE_DEBUG
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${adaptiveState === AdaptiveState.NORMAL ? 'bg-green-400' :
                                    adaptiveState === AdaptiveState.REDUCED_COMPLEXITY ? 'bg-yellow-400' :
                                        adaptiveState === AdaptiveState.GUIDED ? 'bg-orange-400' :
                                            'bg-red-400'
                                }`} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center rounded bg-indigo-950/50 p-2">
                            <span className="text-indigo-300">state:</span>
                            <span className={`font-bold ${adaptiveState === AdaptiveState.NORMAL ? 'text-green-400' :
                                    adaptiveState === AdaptiveState.REDUCED_COMPLEXITY ? 'text-yellow-400' :
                                        adaptiveState === AdaptiveState.GUIDED ? 'text-orange-400' :
                                            'text-red-400 animate-pulse'
                                }`}>{adaptiveState}</span>
                        </div>

                        {debugSignals && (
                            <>
                                <div className="flex justify-between items-center rounded bg-indigo-950/50 p-2">
                                    <span className="text-indigo-300">errors:</span>
                                    <span className={`font-bold ${debugSignals.incorrectAttemptCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {debugSignals.incorrectAttemptCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center rounded bg-indigo-950/50 p-2">
                                    <span className="text-indigo-300">idle_time:</span>
                                    <span className={`font-bold ${(debugSignals.idleTime / 1000) > 5 ? 'text-yellow-400' : 'text-indigo-100'}`}>
                                        {(debugSignals.idleTime / 1000).toFixed(1)}s
                                    </span>
                                </div>
                                <div className="flex justify-between items-center rounded bg-indigo-950/50 p-2">
                                    <span className="text-indigo-300">t_first_action:</span>
                                    <span className="font-bold text-indigo-100">
                                        {debugSignals.timeToFirstAction > 0 ? `${(debugSignals.timeToFirstAction / 1000).toFixed(1)}s` : 'WAITING'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
