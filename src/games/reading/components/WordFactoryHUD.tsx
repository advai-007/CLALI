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
    const { totalStars, currentLevel, adaptiveState, showDebugPanel, setShowDebugPanel, adaptationData, assistLevel, difficultyScore } = useReading();

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

            {/* Full Debug Panel Overlay */}
            {showDebugPanel && (
                <div className="fixed inset-y-24 right-4 z-[60] w-96 md:w-[28rem] lg:w-[32rem] bg-slate-900/95 rounded-2xl p-5 shadow-2xl border border-indigo-500/50 font-mono text-xs overflow-y-auto pointer-events-auto text-indigo-100 backdrop-blur-xl custom-scrollbar flex flex-col gap-4">
                    <div className="flex flex-col gap-2 pb-3 border-b border-indigo-500/30 sticky top-0 bg-slate-900/95 z-10 pt-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2 text-white text-sm">
                                <span className="material-symbols-outlined text-indigo-400">terminal</span>
                                FULL_SYSTEM_DEBUG
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="uppercase font-bold tracking-widest text-indigo-300 mr-2">{adaptiveState}</span>
                                <span className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${adaptiveState === AdaptiveState.NORMAL ? 'bg-green-400 text-green-400' :
                                    adaptiveState === AdaptiveState.REDUCED_COMPLEXITY ? 'bg-yellow-400 text-yellow-400' :
                                        adaptiveState === AdaptiveState.GUIDED ? 'bg-orange-400 text-orange-400' :
                                            'bg-red-400 text-red-400'
                                    }`} />
                            </div>
                        </div>
                        {/* State Override Controls */}
                        <div className="flex gap-2 text-[10px] mt-1">
                            <span className="text-slate-400 self-center mr-1">FORCE:</span>
                            <button
                                onClick={() => adaptationData?.override('calm')}
                                className="px-2 py-1 bg-green-900/40 hover:bg-green-800/60 text-green-300 rounded border border-green-700/50 transition-colors"
                            >
                                NORMAL
                            </button>
                            <button
                                onClick={() => adaptationData?.override('mildStress')}
                                className="px-2 py-1 bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-300 rounded border border-yellow-700/50 transition-colors"
                            >
                                REDUCED
                            </button>
                            <button
                                onClick={() => adaptationData?.override('highStress')}
                                className="px-2 py-1 bg-orange-900/40 hover:bg-orange-800/60 text-orange-300 rounded border border-orange-700/50 transition-colors"
                            >
                                GUIDED
                            </button>
                            <button
                                onClick={() => {
                                    // Resume automatic adaptation by restarting the engine
                                    adaptationData?.stop();
                                    setTimeout(() => adaptationData?.start(), 100);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors ml-auto"
                            >
                                AUTO
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                        {/* 0. Live Difficulty Score */}
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-amber-500/50 col-span-1 md:col-span-2">
                            <h4 className="text-amber-400 font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                <span>DIFFICULTY_SCORE (composite)</span>
                                <span className="text-white font-black text-base">{difficultyScore.toFixed(2)} / 10</span>
                            </h4>
                            {/* Progress bar */}
                            <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(difficultyScore / 10) * 100}%`,
                                        background: difficultyScore < 2.5 ? '#4ade80' : difficultyScore < 4.5 ? '#facc15' : difficultyScore < 6.5 ? '#fb923c' : '#f87171',
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                                {[{ l: 1, t: '≥2.5', c: 'Encourage' }, { l: 2, t: '≥4.5', c: 'Reduce' }, { l: 3, t: '≥6.5', c: 'Glow' }, { l: 4, t: '≥8.5', c: 'Reveal' }].map(s => (
                                    <div key={s.l} className={`px-1 py-1 rounded border ${assistLevel >= s.l ? 'border-amber-400 bg-amber-900/40 text-amber-300' : 'border-slate-700 text-slate-500'}`}>
                                        <div className="font-bold">{s.c}</div>
                                        <div>{s.t}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 1. Computed Adaptation Scores */}
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                            <h4 className="text-indigo-400 font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                <span>SENSOR_SCORES</span>
                            </h4>
                            <div className="space-y-1">
                                <div className="flex justify-between"><span>Stress:</span> <span className="text-white font-bold">{adaptationData?.scores.stress.toFixed(2) ?? 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Focus:</span> <span className="text-white font-bold">{adaptationData?.scores.focus.toFixed(2) ?? 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Blink Rate:</span> <span className="text-amber-300 font-bold">{adaptationData?.blinkRate.toFixed(1) ?? 'N/A'} /min</span></div>
                                <div className="flex justify-between"><span>Time Active:</span> <span className="text-emerald-300">{(adaptationData?.timeOnTask ?? 0).toFixed(0)}s</span></div>
                                <div className="flex justify-between mt-1 pt-1 border-t border-slate-700/50 text-[10px] text-slate-400">
                                    <span>Sensors State:</span> <span>{adaptationData?.isActive ? 'RUNNING' : 'STOPPED'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Game Interaction Signals */}
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                            <h4 className="text-indigo-400 font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                <span>GAME_MONITOR</span>
                            </h4>
                            {debugSignals ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Errors:</span> <span className={`font-bold ${debugSignals.incorrectAttemptCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{debugSignals.incorrectAttemptCount}</span></div>
                                    <div className="flex justify-between"><span>Idle Time:</span> <span className={`font-bold ${(debugSignals.idleTime / 1000) > 5 ? 'text-yellow-400' : 'text-white'}`}>{(debugSignals.idleTime / 1000).toFixed(1)}s</span></div>
                                    <div className="flex justify-between"><span>T_First Action:</span> <span className="text-white">{debugSignals.timeToFirstAction > 0 ? `${(debugSignals.timeToFirstAction / 1000).toFixed(1)}s` : 'WAITING'}</span></div>
                                </div>
                            ) : (
                                <div className="text-slate-500 italic">No monitor data</div>
                            )}
                        </div>

                        {/* 3. Face Tracking Metrics + Calibration Status */}
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 col-span-1 md:col-span-2">
                            <h4 className="text-blue-400 font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                <span>CAMERA_FACE_METRICS</span>
                                {adaptationData?.faceMetrics
                                    ? <span className="text-green-400 text-[10px] font-normal">● ONLINE</span>
                                    : <span className="text-red-400 text-[10px] font-normal">○ OFFLINE</span>
                                }
                            </h4>
                            {adaptationData?.faceMetrics ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div className="flex justify-between"><span>pitch (nod):</span> <span className="text-white">{(adaptationData.faceMetrics.headPitch * 180 / Math.PI).toFixed(1)}°</span></div>
                                    <div className="flex justify-between"><span>yaw (shake):</span> <span className="text-white">{(adaptationData.faceMetrics.headYaw * 180 / Math.PI).toFixed(1)}°</span></div>
                                    <div className="flex justify-between"><span>roll (tilt):</span> <span className="text-white">{(adaptationData.faceMetrics.headRoll * 180 / Math.PI).toFixed(1)}°</span></div>
                                    <div className="flex justify-between col-span-2"><span>EAR (eyes):</span> <span className="text-emerald-300">{adaptationData.faceMetrics.ear.toFixed(3)}</span></div>
                                </div>
                            ) : (
                                <div className="text-slate-500 italic">Camera tracking offline or initializing...</div>
                            )}

                            {/* Baseline / Calibration Status */}
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-slate-400">BASELINE_TIER:</span>
                                    {adaptationData?.rawFeatures !== null ? (
                                        // We can't directly read SignalNormalizer state from here, so show based on TrackingContext
                                        <span className="font-bold text-cyan-300">
                                            ACTIVE (auto self-calib or manual)
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">initializing…</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px]">
                                    <div className="px-1 py-1 rounded border border-cyan-700/60 bg-cyan-900/20 text-cyan-300 text-center">
                                        <div className="font-bold">Absolute</div>
                                        <div className="text-slate-400">always on</div>
                                    </div>
                                    <div className={`px-1 py-1 rounded border text-center ${adaptationData?.faceMetrics ? 'border-blue-600/60 bg-blue-900/20 text-blue-300' : 'border-slate-700 text-slate-500'}`}>
                                        <div className="font-bold">Self-Calib</div>
                                        <div className="text-slate-400">{adaptationData?.faceMetrics ? '5s window' : 'awaiting cam'}</div>
                                    </div>
                                    <div className={`px-1 py-1 rounded border text-center border-slate-700 text-slate-500`}>
                                        <div className="font-bold">Manual</div>
                                        <div className="text-slate-400">calib screen</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Sensor/Feature Extractor */}
                        <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 col-span-1 md:col-span-2">
                            <h4 className="text-emerald-400 font-bold mb-2 border-b border-slate-700 pb-1 flex justify-between">
                                <span>DEVICE_SENSORS</span>
                            </h4>
                            {adaptationData?.rawFeatures ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div className="flex justify-between"><span>visible:</span> <span className={adaptationData.rawFeatures.isVisible ? 'text-green-400' : 'text-yellow-400'}>{adaptationData.rawFeatures.isVisible ? 'YES' : 'NO'}</span></div>
                                    <div className="flex justify-between"><span>franticTaps:</span> <span className="text-red-300">{adaptationData.rawFeatures.franticTaps}</span></div>
                                    <div className="flex justify-between"><span>motionMag:</span> <span className="text-white">{adaptationData.rawFeatures.motionMagnitude.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>tiltVariance:</span> <span className="text-white">{adaptationData.rawFeatures.tiltVariance.toFixed(1)}°</span></div>
                                    <div className="flex justify-between"><span>orientChangeRate:</span> <span className="text-white">{adaptationData.rawFeatures.orientationChangeRate} /s</span></div>
                                    <div className="flex justify-between"><span>avgPressure:</span> <span className="text-white">{adaptationData.rawFeatures.avgTouchPressure.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>gripTouches:</span> <span className="text-amber-300">{adaptationData.rawFeatures.gripTouchCount}</span></div>
                                    <div className="flex justify-between"><span>isIdle:</span> <span className={adaptationData.rawFeatures.isIdle ? 'text-yellow-400' : 'text-green-400'}>{adaptationData.rawFeatures.isIdle ? 'YES' : 'NO'}</span></div>
                                </div>
                            ) : (
                                <div className="text-slate-500 italic">No device sensor data available...</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
