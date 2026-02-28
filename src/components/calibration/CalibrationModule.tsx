import { useEffect, useRef, useState } from 'react';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { useTrackingContext } from '../../context/TrackingContext';
import { FaceMeshOverlay } from './FaceMeshOverlay';
import { DebugOverlay } from './DebugOverlay';

export function CalibrationModule({ onCalibrationComplete }: { onCalibrationComplete?: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { initializeTracker, stopTracking, isInitializing, isTracking, metrics, landmarks, error } = useFaceTracking(videoRef);
    const { setBaseline } = useTrackingContext();

    const [calibrationState, setCalibrationState] = useState<'idle' | 'calibrating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);

    // Metrics collection
    const collectedMetrics = useRef<{ ear: number[], pitch: number[], yaw: number[] }>({
        ear: [], pitch: [], yaw: []
    });

    useEffect(() => {
        // Start camera right away when mounted
        initializeTracker();
        return () => {
            stopTracking();
        };
    }, [initializeTracker, stopTracking]);

    const startCalibration = () => {
        setCalibrationState('calibrating');
        collectedMetrics.current = { ear: [], pitch: [], yaw: [] };
        setProgress(0);

        let msPassed = 0;
        const totalMs = 5000; // 5 seconds calibration

        const interval = setInterval(() => {
            msPassed += 100;
            setProgress((msPassed / totalMs) * 100);

            if (msPassed >= totalMs) {
                clearInterval(interval);
                finishCalibration();
            }
        }, 100);
    };

    // Collect metrics while calibrating
    useEffect(() => {
        if (calibrationState === 'calibrating' && metrics) {
            collectedMetrics.current.ear.push(metrics.ear);
            collectedMetrics.current.pitch.push(metrics.headPitch);
            collectedMetrics.current.yaw.push(metrics.headYaw);
        }
    }, [calibrationState, metrics]);

    const finishCalibration = () => {
        setCalibrationState('done');
        const { ear, pitch, yaw } = collectedMetrics.current;

        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

        const baseline = {
            avgEar: avg(ear),
            avgPitch: avg(pitch),
            avgYaw: avg(yaw),
        };

        setBaseline(baseline);
        if (onCalibrationComplete) {
            onCalibrationComplete();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F2EF] px-4 font-sans text-stone-800">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-stone-200">
                <h2 className="text-2xl font-bold mb-4 text-center text-stone-900">Face Calibration</h2>

                {error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                ) : (
                    <div className="mb-8 text-center text-stone-600 text-sm">
                        Please look at the screen and blink naturally to establish your baseline.
                    </div>
                )}

                <div className="relative w-full aspect-video bg-stone-100 rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
                    {isInitializing && <p className="text-stone-500 z-10">Initializing Camera...</p>}
                    <video
                        ref={videoRef}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 scale-x-[-1] ${isTracking ? 'opacity-100' : 'opacity-0'}`}
                        autoPlay
                        playsInline
                        muted
                    />

                    {/* Face mesh overlay */}
                    {isTracking && (
                        <FaceMeshOverlay
                            landmarks={landmarks}
                            videoWidth={640}
                            videoHeight={480}
                        />
                    )}
                </div>

                {/* Debug metrics overlay */}
                <DebugOverlay metrics={metrics} isTracking={isTracking} />

                {calibrationState === 'calibrating' && (
                    <div className="w-full bg-stone-100 rounded-full h-3 mb-6 overflow-hidden">
                        <div
                            className="bg-teal-500 h-3 rounded-full transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {calibrationState === 'done' && (
                    <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-800 text-sm text-center">
                        Calibration complete! Baseline established.
                    </div>
                )}

                <div className="flex justify-center">
                    <button
                        onClick={startCalibration}
                        disabled={!isTracking || calibrationState === 'calibrating'}
                        className="px-6 py-3 bg-stone-900 text-white rounded-xl font-medium shadow-sm hover:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {calibrationState === 'idle' ? 'Start Calibration' :
                            calibrationState === 'calibrating' ? 'Calibrating...' : 'Recalibrate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
