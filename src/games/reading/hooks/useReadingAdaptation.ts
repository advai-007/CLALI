import { useState, useRef, useCallback, useEffect } from 'react';
import type { UseAdaptationReturn } from '../../../hooks/useAdaptation';

export type AssistLevel = 0 | 1 | 2 | 3 | 4;

const THRESHOLDS: Record<AssistLevel, number> = {
    0: 0,
    1: 2.4,
    2: 4.6,
    3: 6.8,
    4: 8.6,
};

const CHANGE_COOLDOWN_MS = 3000;
const RECOVERY_STREAK_FOR_STEP_DOWN = 2;

export function useReadingAdaptation(
    id: string,
    adaptationData: UseAdaptationReturn | null
) {
    const [assistLevel, setAssistLevel] = useState<AssistLevel>(0);
    const [difficultyScore, setDifficultyScore] = useState(0);

    const startTimeRef = useRef(0);
    const lastInteractionRef = useRef(0);
    const firstActionAtRef = useRef<number | null>(null);
    const clicksRef = useRef(0);
    const errorsRef = useRef(0);
    const mouseDistanceRef = useRef(0);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

    // Persists between tasks so the game adapts to the student, not just one question.
    const studentSupportBaselineRef = useRef(0);
    const taskPressureRef = useRef(0);
    const quickSuccessStreakRef = useRef(0);
    const recentSuccessRef = useRef(false);
    const lastAssistChangeRef = useRef(0);
    const assistLevelRef = useRef<AssistLevel>(0);

    const adaptationDataRef = useRef<UseAdaptationReturn | null>(adaptationData);
    useEffect(() => {
        adaptationDataRef.current = adaptationData;
    }, [adaptationData]);

    useEffect(() => {
        const now = Date.now();
        startTimeRef.current = now;
        lastInteractionRef.current = now;
        firstActionAtRef.current = null;
        clicksRef.current = 0;
        errorsRef.current = 0;
        mouseDistanceRef.current = 0;
        lastMousePosRef.current = null;
        recentSuccessRef.current = false;

        taskPressureRef.current = clampScore(studentSupportBaselineRef.current * 0.75);
        const nextLevel = scoreToAssistLevel(taskPressureRef.current);
        assistLevelRef.current = nextLevel;
        lastAssistChangeRef.current = now;
        setAssistLevel(nextLevel);
        setDifficultyScore(roundScore(taskPressureRef.current));
    }, [id]);

    const trackClick = useCallback(() => {
        const now = Date.now();
        clicksRef.current += 1;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
    }, []);

    const trackError = useCallback(() => {
        const now = Date.now();
        errorsRef.current += 1;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
        taskPressureRef.current = clampScore(
            taskPressureRef.current + (errorsRef.current >= 2 ? 1.6 : 1.25)
        );
        studentSupportBaselineRef.current = clampScore(studentSupportBaselineRef.current + 0.45);
        quickSuccessStreakRef.current = 0;
        recentSuccessRef.current = false;
    }, []);

    const trackSuccess = useCallback(() => {
        const now = Date.now();
        const timeOnTaskSec = startTimeRef.current > 0 ? (now - startTimeRef.current) / 1000 : 0;
        const efficientSuccess = errorsRef.current === 0 && timeOnTaskSec > 0 && timeOnTaskSec <= 8;

        quickSuccessStreakRef.current = efficientSuccess
            ? quickSuccessStreakRef.current + 1
            : Math.max(0, quickSuccessStreakRef.current - 1);

        taskPressureRef.current = clampScore(taskPressureRef.current - (efficientSuccess ? 1.35 : 0.8));
        studentSupportBaselineRef.current = clampScore(
            studentSupportBaselineRef.current - (quickSuccessStreakRef.current >= 2 ? 0.65 : 0.3)
        );
        recentSuccessRef.current = true;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
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

    useEffect(() => {
        const interval = window.setInterval(() => {
            const now = Date.now();
            if (startTimeRef.current === 0) {
                startTimeRef.current = now;
                lastInteractionRef.current = now;
            }

            const timeOnTaskSec = (now - startTimeRef.current) / 1000;
            const idleTimeSec = (now - lastInteractionRef.current) / 1000;
            const timeToFirstActionSec = firstActionAtRef.current === null
                ? timeOnTaskSec
                : (firstActionAtRef.current - startTimeRef.current) / 1000;

            const data = adaptationDataRef.current;
            const stressScore = data?.scores.stress ?? 0;
            const focusScore = data?.scores.focus ?? 1;
            const franticTaps = data?.rawFeatures?.franticTaps ?? 0;
            const hasFaceData = data?.faceMetrics != null;

            const hesitationPenalty = firstActionAtRef.current === null
                ? Math.min(2.4, Math.max(0, timeOnTaskSec - 5) * 0.3)
                : timeToFirstActionSec > 6
                    ? 0.45
                    : 0;

            const idlePenalty = firstActionAtRef.current !== null && idleTimeSec > 4
                ? Math.min(2.3, 0.7 + (idleTimeSec - 4) * 0.22)
                : 0;

            const repeatedErrorsPenalty = Math.min(3.4, errorsRef.current * 1.2);

            const clickRate = timeOnTaskSec > 1 ? clicksRef.current / timeOnTaskSec : 0;
            const franticPenalty = clickRate > 2.3
                ? Math.min(1.2, (clickRate - 2.3) * 0.45)
                : 0;

            const pointerVelocity = timeOnTaskSec > 0 ? mouseDistanceRef.current / timeOnTaskSec : 0;
            const jitterPenalty = pointerVelocity > 1300
                ? Math.min(0.8, (pointerVelocity - 1300) / 2500)
                : 0;

            const sensorPenalty = Math.min(0.8, franticTaps / 6);

            const faceModifier = !hasFaceData
                ? 0
                : (
                    (stressScore >= 0.62 ? 0.75 : 0) +
                    (focusScore <= 0.45 ? 0.9 : 0) -
                    (stressScore < 0.28 && focusScore > 0.7 ? 0.35 : 0)
                );

            const recoveryModifier = recentSuccessRef.current && idleTimeSec < 3 && errorsRef.current === 0
                ? -0.5
                : 0;

            const currentBehaviorScore = clampScore(
                hesitationPenalty +
                idlePenalty +
                repeatedErrorsPenalty +
                franticPenalty +
                jitterPenalty +
                sensorPenalty +
                faceModifier +
                recoveryModifier
            );

            const targetPressure = clampScore(
                (studentSupportBaselineRef.current * 0.35) + currentBehaviorScore
            );

            taskPressureRef.current = clampScore(
                taskPressureRef.current + ((targetPressure - taskPressureRef.current) * 0.35)
            );

            const blendedScore = clampScore(
                studentSupportBaselineRef.current + taskPressureRef.current
            );

            setDifficultyScore(roundScore(blendedScore));

            const desiredLevel = scoreToAssistLevel(blendedScore);
            const canChange = now - lastAssistChangeRef.current >= CHANGE_COOLDOWN_MS;
            let nextLevel = assistLevelRef.current;

            if (desiredLevel > assistLevelRef.current && canChange) {
                nextLevel = desiredLevel;
            } else if (
                desiredLevel < assistLevelRef.current &&
                canChange &&
                quickSuccessStreakRef.current >= RECOVERY_STREAK_FOR_STEP_DOWN
            ) {
                nextLevel = Math.max(desiredLevel, (assistLevelRef.current - 1) as AssistLevel) as AssistLevel;
            }

            if (nextLevel !== assistLevelRef.current) {
                assistLevelRef.current = nextLevel;
                lastAssistChangeRef.current = now;
                setAssistLevel(nextLevel);
            }
        }, 1500);

        return () => window.clearInterval(interval);
    }, []);

    return {
        assistLevel,
        difficultyScore,
        trackClick,
        trackError,
        trackSuccess,
        trackMouseMove,
    };
}

function scoreToAssistLevel(score: number): AssistLevel {
    if (score >= THRESHOLDS[4]) return 4;
    if (score >= THRESHOLDS[3]) return 3;
    if (score >= THRESHOLDS[2]) return 2;
    if (score >= THRESHOLDS[1]) return 1;
    return 0;
}

function clampScore(score: number) {
    return Math.min(10, Math.max(0, score));
}

function roundScore(score: number) {
    return Number(score.toFixed(2));
}
