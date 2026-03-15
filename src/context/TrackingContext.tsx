import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface TrackingBaseline {
    avgEar: number;
    avgPitch: number;
    avgYaw: number;
}

interface TrackingContextType {
    baseline: TrackingBaseline | null;
    setBaseline: (baseline: TrackingBaseline | null) => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
    const [baseline, setBaseline] = useState<TrackingBaseline | null>(null);

    return (
        <TrackingContext.Provider value={{ baseline, setBaseline }}>
            {children}
        </TrackingContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrackingContext() {
    const context = useContext(TrackingContext);
    if (context === undefined) {
        throw new Error('useTrackingContext must be used within a TrackingProvider');
    }
    return context;
}
