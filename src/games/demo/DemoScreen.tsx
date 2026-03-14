import { useState } from 'react';
import { GameLayout, StoryPanel } from './components/GameLayout';
import { InteractionPanel } from './components/InteractionPanel';
import { CharacterGuide } from './components/CharacterGuide';
import { ProgressBar } from './components/ProgressBar';
import { useDemoAdaptation } from './useDemoAdaptation';
import { storyData } from './storyData';

export default function DemoScreen() {
    // ─── State ───
    const [currentSceneId, setCurrentSceneId] = useState<string>('c1_s1');
    const [storyLogs, setStoryLogs] = useState<any[]>([]);

    const scene = storyData[currentSceneId];
    const totalScenes = Object.keys(storyData).length;
    const currentIndex = Object.keys(storyData).indexOf(currentSceneId) + 1;

    // ─── Adaptation Hook ───
    const {
        assistLevel,
        stressScore,
        trackClick,
        trackError,
        trackMouseMove,
        logCompletion
    } = useDemoAdaptation(scene?.id || 'end');

    // ─── Handlers ───
    const handleCorrect = () => {
        // Log the interaction metrics
        const log = logCompletion();
        setStoryLogs(prev => [...prev, log]);

        // Move to next scene
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

    // ─── Render ───
    if (currentSceneId === 'end') {
        return (
            <GameLayout>
                <div className="flex flex-col items-center justify-center h-full gap-8 z-20 relative">
                    <h1 className="text-5xl font-bold text-green-700 bg-white/80 px-12 py-8 rounded-full shadow-xl text-center leading-tight">
                        🎉 The Storybook is Repaired! 🎉
                    </h1>
                    <p className="text-2xl text-gray-700 font-medium">Thank you for helping Leo the Fox repair the magic pages.</p>

                    <div className="mt-8 max-w-2xl bg-white/60 p-6 rounded-3xl w-full max-h-64 overflow-y-auto">
                        <h3 className="font-bold text-gray-800 text-xl border-b pb-2 mb-4">Teacher Session Logs:</h3>
                        {storyLogs.map((l, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-600 mb-2 font-mono bg-white p-2 rounded">
                                <span>{l.sceneId}</span>
                                <span>Assist: lvl {l.assistLevelUsed}</span>
                                <span>Resp: {(l.responseTime / 1000).toFixed(1)}s</span>
                                <span>Err: {l.errorCount}</span>
                                <span className={l.stressScore > 5 ? "text-red-500 font-bold" : ""}>Stress: {l.stressScore.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>

                    <CharacterGuide assistLevel={0} />
                </div>
            </GameLayout>
        );
    }

    if (!scene) return <div>Scene not found</div>;

    return (
        <GameLayout>
            <StoryPanel text={scene.storyText} assistLevel={assistLevel} />

            <InteractionPanel
                scene={scene}
                assistLevel={assistLevel}
                onCorrect={handleCorrect}
                onError={handleError}
                onInteract={handleInteract}
                onMouseMove={trackMouseMove as any}
            />

            <div className="flex justify-between items-end w-full relative z-20">
                <CharacterGuide assistLevel={assistLevel} />
                {/* Debug metrics (invisible to child, useful for developer demo) */}
                <div className="absolute bottom-16 left-0 text-xs font-mono text-gray-400 opacity-50">
                    S: {stressScore.toFixed(1)} | A: {assistLevel}
                </div>
            </div>

            <ProgressBar current={currentIndex} total={totalScenes} />
        </GameLayout>
    );
}
