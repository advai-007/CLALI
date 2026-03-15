import { useRef, useEffect } from 'react';
import type { Scene, AssistLevel } from '../demoTypes';
import { MultipleChoice } from './interactions/MultipleChoice';
import { SentenceBuilder } from './interactions/SentenceBuilder';
import { SceneBuilder } from './interactions/SceneBuilder';
import { EmotionQuestion } from './interactions/EmotionQuestion';

interface InteractionPanelProps {
    scene: Scene;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
    onMouseMove: (e: MouseEvent) => void;
}

export function InteractionPanel({
    scene, assistLevel, onCorrect, onError, onInteract, onMouseMove
}: InteractionPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Attach native mousemove listener for velocity tracking
    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;

        el.addEventListener('mousemove', onMouseMove);
        return () => el.removeEventListener('mousemove', onMouseMove);
    }, [onMouseMove]);

    // Render the specific interaction component
    const renderInteraction = () => {
        const props = {
            data: scene.interactionData,
            assistLevel,
            onCorrect,
            onError,
            onInteract,
        };

        switch (scene.interactionType) {
            case 'multipleChoice':
                return <MultipleChoice key={scene.id} {...props} />;
            case 'sentenceBuilder':
                return <SentenceBuilder key={scene.id} {...props} />;
            case 'sceneBuilder':
                return <SceneBuilder key={scene.id} {...props} />;
            case 'emotionQuestion':
                return <EmotionQuestion key={scene.id} {...props} />;
            default:
                return <div>Unknown Interaction Type</div>;
        }
    };

    return (
        <div
            ref={panelRef}
            onClick={onInteract}
            className="flex-grow min-h-[40vh] relative z-20 flex flex-col items-center justify-center py-4"
        >
            {renderInteraction()}
        </div>
    );
}
