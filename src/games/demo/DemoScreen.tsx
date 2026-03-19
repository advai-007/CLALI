import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout, StoryPanel } from './components/GameLayout';
import { InteractionPanel } from './components/InteractionPanel';
import { CharacterGuide } from './components/CharacterGuide';
import { ProgressBar } from './components/ProgressBar';
import { useDemoAdaptation } from './useDemoAdaptation';
import { storyData } from './storyData';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { useTrackingContext } from '../../context/TrackingContext';
import { useAdaptation } from '../../hooks/useAdaptation';
import { useAuth } from '../../context/AuthContext';
import type { InteractionLog } from './demoTypes';

export default function DemoScreen() {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentSceneId, setCurrentSceneId] = useState<string>('c1_s1');
    const [storyLogs, setStoryLogs] = useState<InteractionLog[]>([]);

    const scene = storyData[currentSceneId];
    const totalScenes = Object.keys(storyData).length;
    const currentIndex = Object.keys(storyData).indexOf(currentSceneId) + 1;

    const { baseline, isTrackingEnabled } = useTrackingContext();
    const { studentUser } = useAuth();
    const faceTracking = useFaceTracking(videoRef);

    useEffect(() => {
        if (isTrackingEnabled) {
            faceTracking.initializeTracker();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTrackingEnabled]);

    const adaptationSignals = useAdaptation({
        faceMetrics: faceTracking.metrics,
        baseline,
        autoStart: true,
        studentId: studentUser?.id
    });

    const {
        assistLevel,
        stressScore,
        difficultyScore,
        trackClick,
        trackError,
        trackSuccess,
        trackMouseMove,
        logCompletion
    } = useDemoAdaptation(scene?.id || 'end', adaptationSignals);

    const handleCorrect = () => {
        const log = logCompletion();
        setStoryLogs(prev => [...prev, log]);
        trackSuccess();

        if (scene.nextScene) {
            setCurrentSceneId(scene.nextScene);
        } else {
            setCurrentSceneId('end');
        }
    };

    const handleError = () => {
        trackError();
    };

    const handleInteract = () => {
        trackClick();
    };

    if (currentSceneId === 'end') {
        return (
            <GameLayout>
                <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                <div className="relative z-30 flex justify-start">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-white"
                    >
                        <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
                        Dashboard
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center h-full gap-8 z-20 relative">
                    <h1 className="text-5xl font-bold text-green-700 bg-white/80 px-12 py-8 rounded-full shadow-xl text-center leading-tight">
                        The Storybook is Repaired!
                    </h1>
                    <p className="text-2xl text-gray-700 font-medium">Thank you for helping Leo the Fox repair the magic pages.</p>

                    <div className="mt-8 max-w-2xl bg-white/60 p-6 rounded-3xl w-full max-h-64 overflow-y-auto">
                        <h3 className="font-bold text-gray-800 text-xl border-b pb-2 mb-4">Teacher Session Logs:</h3>
                        {storyLogs.map((log, index) => (
                            <div key={`${log.sceneId}-${index}`} className="flex justify-between text-sm text-gray-600 mb-2 font-mono bg-white p-2 rounded">
                                <span>{log.sceneId}</span>
                                <span>Assist: lvl {log.assistLevelUsed}</span>
                                <span>Resp: {(log.responseTime / 1000).toFixed(1)}s</span>
                                <span>Err: {log.errorCount}</span>
                                <span className={log.difficultyScore > 5 ? 'text-red-500 font-bold' : ''}>
                                    Diff: {log.difficultyScore.toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <CharacterGuide assistLevel={0} />

                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="rounded-full bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-green-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </GameLayout>
        );
    }

    if (!scene) return <div>Scene not found</div>;

    return (
        <GameLayout>
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <div className="relative z-30 flex justify-start mb-4">
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-white"
                >
                    <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
                    Dashboard
                </button>
            </div>
            <StoryPanel text={scene.storyText} assistLevel={assistLevel} />

            <InteractionPanel
                scene={scene}
                assistLevel={assistLevel}
                onCorrect={handleCorrect}
                onError={handleError}
                onInteract={handleInteract}
                onMouseMove={trackMouseMove}
            />

            <div className="flex justify-between items-end w-full relative z-20">
                <CharacterGuide assistLevel={assistLevel} />
                <div className="absolute bottom-16 left-0 text-xs font-mono text-gray-400 opacity-50">
                    D: {difficultyScore.toFixed(1)} | A: {assistLevel} | F: {adaptationSignals.scores.focus.toFixed(2)} | S: {stressScore.toFixed(1)}
                </div>
            </div>

            <ProgressBar current={currentIndex} total={totalScenes} />
        </GameLayout>
    );
}
