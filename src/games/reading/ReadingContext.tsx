import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { useAdaptation, type UseAdaptationReturn } from '../../hooks/useAdaptation';
import { useReadingAdaptation } from './hooks/useReadingAdaptation';
import { useTrackingContext } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import type { AdaptiveState } from '../workshop/workshopTypes';
import type { ReadingLevel } from './readingTypes';

interface ReadingContextType {
    currentLevel: ReadingLevel;
    setCurrentLevel: (level: ReadingLevel) => void;
    totalStars: number;
    addStars: (stars: number) => void;

    // Graduated Adaptation
    adaptiveState: AdaptiveState;
    assistLevel: number;
    difficultyScore: number;
    trackClick: () => void;
    trackError: () => void;
    trackMouseMove: (e: { clientX: number; clientY: number }) => void;
    resetAdaptation: (taskId: string) => void;

    sendAdaptive: (event: { type: string; state?: AdaptiveState }) => void;
    // Full adaptation metrics for the debug window
    adaptationData: UseAdaptationReturn | null;

    // Debug Window
    showDebugPanel: boolean;
    setShowDebugPanel: (show: boolean) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: ReactNode }) {
    const [currentLevel, setCurrentLevel] = useState<ReadingLevel>(1);
    const [totalStars, setTotalStars] = useState(0);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [taskId, setTaskId] = useState('initial');

    // 1. Initialize Face Tracking
    const videoRef = useRef<HTMLVideoElement>(null);
    const {
        initializeTracker,
        metrics: faceMetrics,
        error: faceError
    } = useFaceTracking(videoRef);

    // Pick up the CalibrationContext baseline (set during the manual calib flow).
    // If no manual baseline exists, SignalNormalizer will self-calibrate automatically.
    const { baseline: trackingBaseline, isTrackingEnabled } = useTrackingContext();

    useEffect(() => {
        if (isTrackingEnabled) {
            initializeTracker();
        }
    }, [initializeTracker, isTrackingEnabled]);

    // 2. Feed face metrics + baseline into Adaptation engine (Face + Device signals)
    const { studentUser } = useAuth();
    const adaptationData = useAdaptation({
        faceMetrics,
        baseline: trackingBaseline,
        autoStart: true,
        studentId: studentUser?.id
    });
    const appAdaptiveState = adaptationData.state;

    // 3. Interaction-based Adaptation — now receives adaptationData to fuse all signals
    const {
        assistLevel,
        difficultyScore,
        trackClick,
        trackError,
        trackSuccess,
        trackMouseMove
    } = useReadingAdaptation(taskId, adaptationData);

    const resetAdaptation = (newId: string) => setTaskId(newId);

    // ─── Debounced Adaptive State (Face-based fallback for legacy UI) ───────────
    const STATE_HOLD_MS = 5000;
    const candidateRef = useRef<{ state: AdaptiveState; since: number }>({
        state: 'NORMAL' as AdaptiveState,
        since: 0,
    });
    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>('NORMAL' as AdaptiveState);

    useEffect(() => {
        let candidate: AdaptiveState = 'NORMAL' as AdaptiveState;
        if (appAdaptiveState === 'mildStress' || appAdaptiveState === 'distracted') {
            candidate = 'REDUCED_COMPLEXITY' as AdaptiveState;
        } else if (appAdaptiveState === 'highStress' || appAdaptiveState === 'disengaged') {
            candidate = 'GUIDED' as AdaptiveState;
        }

        const now = Date.now();
        if (candidateRef.current.since === 0) {
            candidateRef.current = { state: candidate, since: now };
        }
        if (candidate !== candidateRef.current.state) {
            candidateRef.current = { state: candidate, since: now };
            return;
        }

        if (now - candidateRef.current.since < STATE_HOLD_MS || adaptiveState === candidate) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setAdaptiveState(candidate);
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [adaptiveState, appAdaptiveState]);

    const sendAdaptive = (event: { type: string; state?: AdaptiveState }) => {
        if (event.type === 'CORRECT_ACTION') {
            trackSuccess();
            adaptationData?.registerGameEvent('correct');
        } else if (event.type === 'INCORRECT_ACTION') {
            adaptationData?.registerGameEvent('incorrect');
        }
    };

    const addStars = (stars: number) => setTotalStars(prev => prev + stars);

    // Derived flags from adaptation machine config
    const adaptations = adaptationData.adaptations;
    const fontFamily = adaptations.fontFamily === 'opendyslexic' ? 'font-opendyslexic' : 'font-lexend';

    return (
        <ReadingContext.Provider value={{
            currentLevel,
            setCurrentLevel,
            totalStars,
            addStars,
            adaptiveState,
            assistLevel,
            difficultyScore,
            trackClick,
            trackError,
            trackMouseMove,
            resetAdaptation,
            sendAdaptive,
            adaptationData,
            showDebugPanel,
            setShowDebugPanel,
        }}>
            <div className={`min-h-screen transition-all duration-700 ${fontFamily}`}>

                {/* Hidden video element for MediaPipe face tracking */}
                <video
                    ref={videoRef}
                    className="hidden"
                    playsInline
                    muted
                    autoPlay
                />

                {/* Optional debug warning if camera fails */}
                {faceError && showDebugPanel && (
                    <div className="fixed top-20 left-4 z-50 bg-red-500 text-white p-2 rounded text-xs truncate max-w-xs">
                        Camera Warning: {faceError}
                    </div>
                )}

                {children}
            </div>
        </ReadingContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReading() {
    const context = useContext(ReadingContext);
    if (context === undefined) {
        throw new Error('useReading must be used within a ReadingProvider');
    }
    return context;
}
