import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { adaptiveMachine } from './adaptiveMachine';
import {
    AdaptiveState,
    type GameStation,
    StationStatus,
    type StationInfo,
    type TaskProgress,
} from './workshopTypes';

// ─── Station Definitions ────────────────────────────────────────────
const INITIAL_STATIONS: StationInfo[] = [
    { id: 'tires', title: 'Tire Balance Bay', icon: 'tire_repair', route: '/workshop/tires', status: StationStatus.AVAILABLE },
    { id: 'bolts', title: 'Bolt Tightening', icon: 'build', route: '/workshop/bolts', status: StationStatus.AVAILABLE },
    { id: 'wiring', title: 'Wiring Panel', icon: 'cable', route: '/workshop/wiring', status: StationStatus.AVAILABLE },
    { id: 'fuel', title: 'Fuel Mix Monitor', icon: 'local_gas_station', route: '/workshop/fuel', status: StationStatus.AVAILABLE },
];

// ─── Context Type ───────────────────────────────────────────────────
interface WorkshopContextType {
    stations: StationInfo[];
    totalStars: number;
    progressRecords: Map<GameStation, TaskProgress>;
    adaptiveState: AdaptiveState;

    // Adaptive machine controls
    sendAdaptive: (event: { type: 'DIFFICULTY_DETECTED' | 'CORRECT_ACTION' | 'INCORRECT_ACTION' | 'HINT_SHOWN' | 'RESET' }) => void;

    // Actions
    completeStation: (stationId: GameStation, progress: TaskProgress) => void;
    resetWorkshop: () => void;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────
export function WorkshopProvider({ children }: { children: ReactNode }) {
    const [snapshot, send] = useMachine(adaptiveMachine);
    const [stations, setStations] = useState<StationInfo[]>(INITIAL_STATIONS);
    const [progressRecords, setProgressRecords] = useState<Map<GameStation, TaskProgress>>(new Map());

    const adaptiveState = snapshot.context.state;

    const totalStars = useMemo(() => {
        let stars = 0;
        progressRecords.forEach((p) => { stars += p.starsEarned; });
        return stars;
    }, [progressRecords]);

    const completeStation = useCallback((stationId: GameStation, progress: TaskProgress) => {
        setStations((prev) =>
            prev.map((s) =>
                s.id === stationId ? { ...s, status: StationStatus.COMPLETED } : s
            )
        );
        setProgressRecords((prev) => {
            const next = new Map(prev);
            next.set(stationId, progress);
            return next;
        });
        // Reset adaptive state for next task
        send({ type: 'RESET' });
    }, [send]);

    const resetWorkshop = useCallback(() => {
        setStations(INITIAL_STATIONS);
        setProgressRecords(new Map());
        send({ type: 'RESET' });
    }, [send]);

    const value = useMemo<WorkshopContextType>(() => ({
        stations,
        totalStars,
        progressRecords,
        adaptiveState,
        sendAdaptive: send,
        completeStation,
        resetWorkshop,
    }), [stations, totalStars, progressRecords, adaptiveState, send, completeStation, resetWorkshop]);

    return (
        <WorkshopContext.Provider value={value}>
            {children}
        </WorkshopContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useWorkshop() {
    const ctx = useContext(WorkshopContext);
    if (!ctx) throw new Error('useWorkshop must be used within <WorkshopProvider>');
    return ctx;
}
