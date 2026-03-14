import { useState, useRef, useCallback, useEffect } from 'react';
import type { AssistLevel, InteractionLog } from './demoTypes';

export function useDemoAdaptation(sceneId: string) {
    // ─── Metrics State ───
    const [assistLevel, setAssistLevel] = useState<AssistLevel>(0);
    const [stressScore, setStressScore] = useState(0);

    // ─── Tracking Refs ───
    const startTimeRef = useRef<number>(Date.now());
    const clicksRef = useRef<number>(0);
    const errorsRef = useRef<number>(0);
    const lastMousePosRef = useRef<{ x: number, y: number } | null>(null);
    const distanceRef = useRef<number>(0);

    // Reset tracking when scene changes
    useEffect(() => {
        startTimeRef.current = Date.now();
        clicksRef.current = 0;
        errorsRef.current = 0;
        lastMousePosRef.current = null;
        distanceRef.current = 0;
        setAssistLevel(0);
        setStressScore(0);
    }, [sceneId]);

    // ─── Interaction Handlers ───
    const trackClick = useCallback(() => {
        clicksRef.current += 1;
        evaluateStress();
    }, []);

    const trackMouseMove = useCallback((e: MouseEvent) => {
        if (lastMousePosRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            distanceRef.current += Math.sqrt(dx * dx + dy * dy);
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    const trackError = useCallback(() => {
        errorsRef.current += 1;
        evaluateStress();
    }, []);

    // ─── Stress & Assist Evaluation ───
    const evaluateStress = () => {
        const timeSpentMs = Date.now() - startTimeRef.current;
        const timeSpentSec = timeSpentMs / 1000;

        // Base metrics
        const errors = errorsRef.current;
        let rapidClicks = 0;
        if (timeSpentSec > 0) {
            const clickRate = clicksRef.current / timeSpentSec;
            rapidClicks = clickRate > 1.5 ? (clickRate - 1.5) * 2 : 0; // Penalize > 1.5 clicks per sec
        }

        // Idle penalty (if no clicks but high time)
        let idlePenalty = 0;
        if (timeSpentSec > 10 && clicksRef.current === 0) {
            idlePenalty = (timeSpentSec - 10) * 0.5;
        }

        // Mouse jitter (high distance / low time)
        let mouseJitter = 0;
        if (timeSpentSec > 0) {
            const velocity = distanceRef.current / timeSpentSec;
            mouseJitter = velocity > 1500 ? (velocity - 1500) / 1000 : 0;
        }

        // Stress formula (0 - 10)
        let rawStress = (errors * 3) + rapidClicks + idlePenalty + mouseJitter;
        rawStress = Math.min(10, Math.max(0, rawStress));

        setStressScore(rawStress);

        // Map Stress to Assist Level
        let newAssist = 0 as AssistLevel;
        if (rawStress > 8) newAssist = 4;
        else if (rawStress > 6) newAssist = 3;
        else if (rawStress > 4) newAssist = 2;
        else if (rawStress > 2) newAssist = 1;

        // Never let assist level go down within a single scene to prevent flickering
        setAssistLevel(prev => Math.max(prev, newAssist) as AssistLevel);
    };

    // Run evaluation periodically to catch idle time even without clicks
    useEffect(() => {
        const interval = setInterval(evaluateStress, 2000);
        return () => clearInterval(interval);
    }, []);

    // ─── Logging ───
    const logCompletion = useCallback((): InteractionLog => {
        const timeSpent = Date.now() - startTimeRef.current;
        const log = {
            sceneId,
            assistLevelUsed: assistLevel,
            responseTime: timeSpent,
            errorCount: errorsRef.current,
            stressScore
        };
        console.log("Demo Interaction Logged:", log);
        return log;
    }, [sceneId, assistLevel, stressScore]);

    return {
        assistLevel,
        stressScore,
        trackClick,
        trackError,
        trackMouseMove,
        logCompletion
    };
}
