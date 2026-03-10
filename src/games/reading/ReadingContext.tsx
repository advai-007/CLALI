import { createContext, useContext, useState, type ReactNode } from 'react';
import { useActor } from '@xstate/react';
import { adaptiveMachine } from '../workshop/adaptiveMachine';
import type { AdaptiveState } from '../workshop/workshopTypes';
import type { ReadingLevel } from './readingTypes';

interface ReadingContextType {
    currentLevel: ReadingLevel;
    setCurrentLevel: (level: ReadingLevel) => void;
    totalStars: number;
    addStars: (stars: number) => void;

    // Adaptive Tracking
    adaptiveState: AdaptiveState;
    sendAdaptive: ReturnType<typeof useActor>[1];

    // Debug Window
    showDebugPanel: boolean;
    setShowDebugPanel: (show: boolean) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export function ReadingProvider({ children }: { children: ReactNode }) {
    const [currentLevel, setCurrentLevel] = useState<ReadingLevel>(1);
    const [totalStars, setTotalStars] = useState(0);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // Reuse the adaptive machine from workshop for consistent behavior
    const [adaptiveSnapshot, sendAdaptive] = useActor(adaptiveMachine);

    // Sync state
    const adaptiveState = adaptiveSnapshot.context.state;

    const addStars = (stars: number) => setTotalStars(prev => prev + stars);

    return (
        <ReadingContext.Provider value={{
            currentLevel,
            setCurrentLevel,
            totalStars,
            addStars,
            adaptiveState,
            sendAdaptive,
            showDebugPanel,
            setShowDebugPanel,
        }}>
            {children}
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
