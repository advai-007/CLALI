import { useRef, useCallback } from 'react';
import type { InteractionSignals } from '../workshop/workshopTypes';

export function useReadingMonitor() {
    const signals = useRef<InteractionSignals>({
        timeToFirstAction: 0,
        incorrectAttemptCount: 0,
        idleTime: 0,
        misplacedDropCount: 0,
    });

    const timers = useRef({
        taskStart: 0,
        lastAction: 0,
        idleInterval: null as ReturnType<typeof setInterval> | null,
    });

    // Start tracking when a task is presented
    const startTrackingTask = useCallback(() => {
        const now = Date.now();
        signals.current = {
            timeToFirstAction: 0,
            incorrectAttemptCount: 0,
            idleTime: 0,
            misplacedDropCount: 0,
        };
        timers.current.taskStart = now;
        timers.current.lastAction = now;

        if (timers.current.idleInterval) clearInterval(timers.current.idleInterval);
        timers.current.idleInterval = setInterval(() => {
            signals.current.idleTime = Date.now() - timers.current.lastAction;
        }, 1000);
    }, []);

    const stopTracking = useCallback(() => {
        if (timers.current.idleInterval) {
            clearInterval(timers.current.idleInterval);
            timers.current.idleInterval = null;
        }
    }, []);

    const recordInteraction = useCallback(() => {
        const now = Date.now();
        if (signals.current.timeToFirstAction === 0) {
            signals.current.timeToFirstAction = now - timers.current.taskStart;
        }
        signals.current.idleTime = 0;
        timers.current.lastAction = now;
    }, []);

    const recordIncorrectAction = useCallback(() => {
        recordInteraction();
        signals.current.incorrectAttemptCount++;
    }, [recordInteraction]);

    const recordCorrectAction = useCallback(() => {
        recordInteraction();
        signals.current.incorrectAttemptCount = 0; // reset streak
    }, [recordInteraction]);

    const getSignals = useCallback(() => ({ ...signals.current }), []);

    return {
        startTrackingTask,
        stopTracking,
        recordInteraction,
        recordIncorrectAction,
        recordCorrectAction,
        getSignals,
        signalsRef: signals,
    };
}
