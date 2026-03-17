import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { adaptiveMachine } from './adaptiveMachine';
import { WORKSHOP_FLOW, WORKSHOP_STATIONS } from './workshopData';
import {
    AdaptiveState,
    type GameStation,
    StationStatus,
    type StationInfo,
    type TaskProgress,
} from './workshopTypes';

interface WorkshopContextType {
    stations: StationInfo[];
    totalStars: number;
    progressRecords: Map<GameStation, TaskProgress>;
    adaptiveState: AdaptiveState;
    completedStations: number;
    completionPercent: number;
    isWorkshopComplete: boolean;
    nextStation: StationInfo | null;
    sendAdaptive: (event: { type: 'DIFFICULTY_DETECTED' | 'CORRECT_ACTION' | 'INCORRECT_ACTION' | 'HINT_SHOWN' | 'RESET' }) => void;
    completeStation: (stationId: GameStation, progress: TaskProgress) => void;
    resetWorkshop: () => void;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export function WorkshopProvider({ children }: { children: ReactNode }) {
    const [snapshot, send] = useMachine(adaptiveMachine);
    const [stations, setStations] = useState<StationInfo[]>(WORKSHOP_STATIONS);
    const [progressRecords, setProgressRecords] = useState<Map<GameStation, TaskProgress>>(new Map());

    const adaptiveState = snapshot.context.state;

    const completedStations = useMemo(
        () => stations.filter((station) => station.status === StationStatus.COMPLETED).length,
        [stations]
    );

    const completionPercent = useMemo(
        () => Math.round((completedStations / stations.length) * 100),
        [completedStations, stations.length]
    );

    const totalStars = useMemo(() => {
        let stars = 0;
        progressRecords.forEach((progress) => {
            stars += progress.starsEarned;
        });
        return stars;
    }, [progressRecords]);

    const isWorkshopComplete = completedStations === stations.length;

    const nextStation = useMemo(
        () => stations.find((station) => station.status === StationStatus.AVAILABLE) ?? null,
        [stations]
    );

    const completeStation = useCallback((stationId: GameStation, progress: TaskProgress) => {
        setStations((previousStations) => {
            const stationIndex = WORKSHOP_FLOW.indexOf(stationId);
            const nextStationId = WORKSHOP_FLOW[stationIndex + 1];

            return previousStations.map((station) => {
                if (station.id === stationId) {
                    return { ...station, status: StationStatus.COMPLETED };
                }

                if (station.id === nextStationId && station.status === StationStatus.LOCKED) {
                    return { ...station, status: StationStatus.AVAILABLE };
                }

                return station;
            });
        });

        setProgressRecords((previousRecords) => {
            const nextRecords = new Map(previousRecords);
            nextRecords.set(stationId, progress);
            return nextRecords;
        });

        send({ type: 'RESET' });
    }, [send]);

    const resetWorkshop = useCallback(() => {
        setStations(WORKSHOP_STATIONS);
        setProgressRecords(new Map());
        send({ type: 'RESET' });
    }, [send]);

    const value = useMemo<WorkshopContextType>(() => ({
        stations,
        totalStars,
        progressRecords,
        adaptiveState,
        completedStations,
        completionPercent,
        isWorkshopComplete,
        nextStation,
        sendAdaptive: send,
        completeStation,
        resetWorkshop,
    }), [
        stations,
        totalStars,
        progressRecords,
        adaptiveState,
        completedStations,
        completionPercent,
        isWorkshopComplete,
        nextStation,
        send,
        completeStation,
        resetWorkshop,
    ]);

    return (
        <WorkshopContext.Provider value={value}>
            {children}
        </WorkshopContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkshop() {
    const ctx = useContext(WorkshopContext);
    if (!ctx) {
        throw new Error('useWorkshop must be used within <WorkshopProvider>');
    }
    return ctx;
}
