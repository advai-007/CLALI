import { useState, useRef, useCallback, useEffect } from 'react';
import type { UseAdaptationReturn } from '../../../hooks/useAdaptation';

/**
 * Assist levels — 4-stage graduated help system:
 * 0: Normal          — all choices, no hints
 * 1: Encourage       — Ollie gives a motivational message, no visual change
 * 2: Reduce          — fewer distractors shown (2-3 choices)
 * 3: Glow            — correct answer has a soft pulsing amber ring
 * 4: Reveal          — only correct answer shown, bright yellow glow
 */
export type AssistLevel = 0 | 1 | 2 | 3 | 4;

// Thresholds for the composite difficulty score (0-10)
const THRESHOLDS: Record<AssistLevel, number> = {
    0: 0,
    1: 2.5,   // Stage 1: Ollie encourages
    2: 4.5,   // Stage 2: reduce choices
    3: 6.5,   // Stage 3: soft glow on correct
    4: 8.5,   // Stage 4: full reveal
};

export function useReadingAdaptation(
    id: string,
    adaptationData: UseAdaptationReturn | null
) {
    const [assistLevel, setAssistLevel] = useState<AssistLevel>(0);
    const [difficultyScore, setDifficultyScore] = useState(0);

    // --- Stable refs for all tracked values (so the interval never has stale closures) ---
    const startTimeRef = useRef<number>(Date.now());
    const lastInteractionRef = useRef<number>(Date.now());
    const clicksRef = useRef<number>(0);
    const errorsRef = useRef<number>(0);
    const mouseDistanceRef = useRef<number>(0);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

    // Ref to adaptationData so the interval always reads the latest without re-creating
    const adaptationDataRef = useRef<UseAdaptationReturn | null>(adaptationData);
    useEffect(() => {
        adaptationDataRef.current = adaptationData;
    }, [adaptationData]);

    // Ref to store current assistLevel for the ratchet comparison inside the interval
    const assistLevelRef = useRef<AssistLevel>(0);

    // Reset ALL state when the task (id) changes
    useEffect(() => {
        startTimeRef.current = Date.now();
        lastInteractionRef.current = Date.now();
        clicksRef.current = 0;
        errorsRef.current = 0;
        lastMousePosRef.current = null;
        mouseDistanceRef.current = 0;
        assistLevelRef.current = 0;
        setAssistLevel(0);
        setDifficultyScore(0);
    }, [id]);

    // --- Tracking callbacks (all stable — only update refs) ---
    const trackClick = useCallback(() => {
        clicksRef.current += 1;
        lastInteractionRef.current = Date.now();
    }, []);

    const trackError = useCallback(() => {
        errorsRef.current += 1;
        lastInteractionRef.current = Date.now();
    }, []);

    const trackMouseMove = useCallback((e: { clientX: number; clientY: number }) => {
        if (lastMousePosRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            mouseDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        lastInteractionRef.current = Date.now();
    }, []);

    // --- Core evaluation loop — stable interval that reads everything from refs ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const timeOnTaskSec = (now - startTimeRef.current) / 1000;
            const idleTimeSec = (now - lastInteractionRef.current) / 1000;

            // Read latest sensor values directly from the ref (never stale)
            const data = adaptationDataRef.current;
            const stressScore = data?.scores.stress ?? 0;   // 0-1
            const focusScore = data?.scores.focus ?? 1;   // 0-1

            // Device tap clusters from raw features
            const franticTaps = data?.rawFeatures?.franticTaps ?? 0;

            // --- Interaction signals ---
            // Rapid clicking: > 2 clicks/sec is frantic (up to 1.5 pts)
            const clickRate = timeOnTaskSec > 1 ? clicksRef.current / timeOnTaskSec : 0;
            const clickJitter = Math.min(1.5, clickRate > 2 ? (clickRate - 2) * 0.5 : 0);

            // Mouse jitter: > 1200 px/s (up to 1.0 pt)
            const velocity = timeOnTaskSec > 0 ? mouseDistanceRef.current / timeOnTaskSec : 0;
            const mouseJitter = Math.min(1.0, velocity > 1200 ? (velocity - 1200) / 2000 : 0);

            // Device frantic taps (0-8+ → 0-1.0)
            const franticTapBonus = Math.min(1.0, franticTaps / 8);

            // Idle penalty: starts after 5s, accrues at 0.8 per 10s, capped at 2.0
            const idleBonus = Math.min(2.0, idleTimeSec > 5 ? ((idleTimeSec - 5) / 10) * 0.8 : 0);

            // --- Composite score (0-10) ---
            // Note: errors weighted at 1.5 each so that WITHOUT sensor data,
            // making 2 errors → ~3.0 (enough to trigger Stage 1 at 2.5)
            const raw =
                stressScore * 3.0 +           // face + device stress
                (1 - focusScore) * 2.0 +      // face + device focus-loss
                errorsRef.current * 1.5 +     // each error = 1.5 pts
                idleBonus +                   // idle time (0-2)
                clickJitter +                 // frantic clicks (0-1.5)
                mouseJitter +                 // mouse velocity (0-1)
                franticTapBonus;              // device taps (0-1)

            const clamped = Math.min(10, Math.max(0, raw));
            setDifficultyScore(parseFloat(clamped.toFixed(2)));

            // --- Ratchet: only escalate stage ---
            let newLevel: AssistLevel = 0;
            if (clamped >= THRESHOLDS[4]) newLevel = 4;
            else if (clamped >= THRESHOLDS[3]) newLevel = 3;
            else if (clamped >= THRESHOLDS[2]) newLevel = 2;
            else if (clamped >= THRESHOLDS[1]) newLevel = 1;

            const next = Math.max(assistLevelRef.current, newLevel) as AssistLevel;
            if (next !== assistLevelRef.current) {
                assistLevelRef.current = next;
                setAssistLevel(next);
            }
        }, 2000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty — everything is read from refs

    return {
        assistLevel,
        difficultyScore,
        trackClick,
        trackError,
        trackMouseMove,
    };
}
