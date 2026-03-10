import { useRef, useCallback, useEffect, useState } from 'react';
import { DIFFICULTY_THRESHOLDS, type InteractionSignals } from './workshopTypes';

interface UseInteractionMonitorReturn {
    /** Record a correct user action – resets error counters */
    recordCorrectAction: () => void;
    /** Record an incorrect user action */
    recordIncorrectAction: () => void;
    /** Record any user interaction (resets idle timer) */
    recordInteraction: () => void;
    /** Check if difficulty should be detected right now */
    shouldEscalate: () => boolean;
    /** Get current signal snapshot */
    getSignals: () => InteractionSignals;
    /** Reset all signals (e.g., on new task) */
    resetSignals: () => void;
}

/**
 * Hook that continuously tracks interaction signals during gameplay.
 * Call `shouldEscalate()` after incorrect actions to decide
 * whether to send DIFFICULTY_DETECTED to the adaptive machine.
 */
export function useInteractionMonitor(): UseInteractionMonitorReturn {
    const [initTime] = useState(() => Date.now());
    const taskStartTime = useRef(initTime);
    const firstActionRecorded = useRef(false);
    const timeToFirstAction = useRef(0);
    const incorrectAttemptCount = useRef(0);
    const misplacedDropCount = useRef(0);
    const lastInteractionTime = useRef(initTime);

    // Reset on mount
    useEffect(() => {
        taskStartTime.current = Date.now();
        firstActionRecorded.current = false;
        lastInteractionTime.current = Date.now();
    }, []);

    const recordInteraction = useCallback(() => {
        lastInteractionTime.current = Date.now();
        if (!firstActionRecorded.current) {
            firstActionRecorded.current = true;
            timeToFirstAction.current = Date.now() - taskStartTime.current;
        }
    }, []);

    const recordCorrectAction = useCallback(() => {
        recordInteraction();
        incorrectAttemptCount.current = 0;
        misplacedDropCount.current = 0;
    }, [recordInteraction]);

    const recordIncorrectAction = useCallback(() => {
        recordInteraction();
        incorrectAttemptCount.current += 1;
        misplacedDropCount.current += 1;
    }, [recordInteraction]);

    const getSignals = useCallback((): InteractionSignals => {
        const now = Date.now();
        return {
            timeToFirstAction: firstActionRecorded.current
                ? timeToFirstAction.current
                : now - taskStartTime.current,
            incorrectAttemptCount: incorrectAttemptCount.current,
            idleTime: now - lastInteractionTime.current,
            misplacedDropCount: misplacedDropCount.current,
        };
    }, []);

    const shouldEscalate = useCallback((): boolean => {
        const signals = getSignals();
        return (
            signals.incorrectAttemptCount >= DIFFICULTY_THRESHOLDS.MAX_INCORRECT_ATTEMPTS ||
            signals.idleTime > DIFFICULTY_THRESHOLDS.MAX_IDLE_TIME_MS ||
            signals.timeToFirstAction > DIFFICULTY_THRESHOLDS.MAX_FIRST_ACTION_TIME_MS
        );
    }, [getSignals]);

    const resetSignals = useCallback(() => {
        taskStartTime.current = Date.now();
        firstActionRecorded.current = false;
        timeToFirstAction.current = 0;
        incorrectAttemptCount.current = 0;
        misplacedDropCount.current = 0;
        lastInteractionTime.current = Date.now();
    }, []);

    return {
        recordCorrectAction,
        recordIncorrectAction,
        recordInteraction,
        shouldEscalate,
        getSignals,
        resetSignals,
    };
}
