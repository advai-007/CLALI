import { useState, useRef, useCallback, useEffect } from 'react';
import type { UseAdaptationReturn } from '../../hooks/useAdaptation';
import type { AssistLevel, InteractionLog } from './demoTypes';

const THRESHOLDS: Record<AssistLevel, number> = {
    0: 0,
    1: 2.2,
    2: 4.4,
    3: 6.6,
    4: 8.4,
};

const CHANGE_COOLDOWN_MS = 3000;
const RECOVERY_STREAK_FOR_STEP_DOWN = 2;

export function useDemoAdaptation(
    sceneId: string,
    adaptationData: UseAdaptationReturn | null
) {
    const [assistLevel, setAssistLevel] = useState<AssistLevel>(0);
    const [difficultyScore, setDifficultyScore] = useState(0);

    const sceneStartRef = useRef(0);
    const lastInteractionRef = useRef(0);
    const firstActionAtRef = useRef<number | null>(null);
    const clicksRef = useRef(0);
    const errorsRef = useRef(0);
    const distanceRef = useRef(0);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

    const studentSupportBaselineRef = useRef(0);
    const scenePressureRef = useRef(0);
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
        sceneStartRef.current = now;
        lastInteractionRef.current = now;
        firstActionAtRef.current = null;
        clicksRef.current = 0;
        errorsRef.current = 0;
        distanceRef.current = 0;
        lastMousePosRef.current = null;
        recentSuccessRef.current = false;

        scenePressureRef.current = clampScore(studentSupportBaselineRef.current * 0.75);
        const nextLevel = scoreToAssistLevel(scenePressureRef.current);
        assistLevelRef.current = nextLevel;
        lastAssistChangeRef.current = now;
        setAssistLevel(nextLevel);
        setDifficultyScore(roundScore(scenePressureRef.current));
    }, [sceneId]);

    const trackClick = useCallback(() => {
        const now = Date.now();
        clicksRef.current += 1;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
    }, []);

    const trackMouseMove = useCallback((e: MouseEvent) => {
        if (lastMousePosRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            distanceRef.current += Math.sqrt(dx * dx + dy * dy);
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        lastInteractionRef.current = Date.now();
    }, []);

    const trackError = useCallback(() => {
        const now = Date.now();
        errorsRef.current += 1;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
        scenePressureRef.current = clampScore(
            scenePressureRef.current + (errorsRef.current >= 2 ? 1.6 : 1.25)
        );
        studentSupportBaselineRef.current = clampScore(studentSupportBaselineRef.current + 0.45);
        quickSuccessStreakRef.current = 0;
        recentSuccessRef.current = false;
        adaptationDataRef.current?.registerGameEvent('incorrect');
    }, []);

    const trackSuccess = useCallback(() => {
        const now = Date.now();
        const responseTimeSec = sceneStartRef.current > 0 ? (now - sceneStartRef.current) / 1000 : 0;
        const efficientSuccess = errorsRef.current === 0 && responseTimeSec > 0 && responseTimeSec <= 10;

        quickSuccessStreakRef.current = efficientSuccess
            ? quickSuccessStreakRef.current + 1
            : Math.max(0, quickSuccessStreakRef.current - 1);

        scenePressureRef.current = clampScore(scenePressureRef.current - (efficientSuccess ? 1.3 : 0.8));
        studentSupportBaselineRef.current = clampScore(
            studentSupportBaselineRef.current - (quickSuccessStreakRef.current >= 2 ? 0.6 : 0.25)
        );
        recentSuccessRef.current = true;
        lastInteractionRef.current = now;
        firstActionAtRef.current ??= now;
        adaptationDataRef.current?.registerGameEvent('correct');
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const now = Date.now();
            const sceneTimeSec = sceneStartRef.current > 0 ? (now - sceneStartRef.current) / 1000 : 0;
            const idleTimeSec = lastInteractionRef.current > 0 ? (now - lastInteractionRef.current) / 1000 : 0;
            const timeToFirstActionSec = firstActionAtRef.current === null
                ? sceneTimeSec
                : (firstActionAtRef.current - sceneStartRef.current) / 1000;

            const data = adaptationDataRef.current;
            const stressScore = data?.scores.stress ?? 0;
            const focusScore = data?.scores.focus ?? 1;
            const franticTaps = data?.rawFeatures?.franticTaps ?? 0;
            const hasFaceData = data?.faceMetrics != null;

            const hesitationPenalty = firstActionAtRef.current === null
                ? Math.min(2.5, Math.max(0, sceneTimeSec - 6) * 0.28)
                : timeToFirstActionSec > 8
                    ? 0.45
                    : 0;

            const idlePenalty = firstActionAtRef.current !== null && idleTimeSec > 5
                ? Math.min(2.2, 0.6 + (idleTimeSec - 5) * 0.18)
                : 0;

            const repeatedErrorsPenalty = Math.min(3.6, errorsRef.current * 1.25);

            const clickRate = sceneTimeSec > 1 ? clicksRef.current / sceneTimeSec : 0;
            const franticPenalty = clickRate > 2.1
                ? Math.min(1.1, (clickRate - 2.1) * 0.45)
                : 0;

            const mouseVelocity = sceneTimeSec > 0 ? distanceRef.current / sceneTimeSec : 0;
            const mousePenalty = mouseVelocity > 1450
                ? Math.min(0.8, (mouseVelocity - 1450) / 2200)
                : 0;

            const sensorPenalty = Math.min(0.75, franticTaps / 6);

            const faceModifier = !hasFaceData
                ? 0
                : (
                    (stressScore >= 0.62 ? 0.75 : 0) +
                    (focusScore <= 0.45 ? 0.9 : 0) -
                    (stressScore < 0.28 && focusScore > 0.72 ? 0.35 : 0)
                );

            const recoveryModifier = recentSuccessRef.current && idleTimeSec < 3 && errorsRef.current === 0
                ? -0.45
                : 0;

            const liveBehaviorScore = clampScore(
                hesitationPenalty +
                idlePenalty +
                repeatedErrorsPenalty +
                franticPenalty +
                mousePenalty +
                sensorPenalty +
                faceModifier +
                recoveryModifier
            );

            const targetPressure = clampScore(
                (studentSupportBaselineRef.current * 0.35) + liveBehaviorScore
            );

            scenePressureRef.current = clampScore(
                scenePressureRef.current + ((targetPressure - scenePressureRef.current) * 0.35)
            );

            const nextDifficulty = clampScore(
                studentSupportBaselineRef.current + scenePressureRef.current
            );

            setDifficultyScore(roundScore(nextDifficulty));

            const desiredLevel = scoreToAssistLevel(nextDifficulty);
            const canChange = now - lastAssistChangeRef.current >= CHANGE_COOLDOWN_MS;
            let nextAssist = assistLevelRef.current;

            if (desiredLevel > assistLevelRef.current && canChange) {
                nextAssist = desiredLevel;
            } else if (
                desiredLevel < assistLevelRef.current &&
                canChange &&
                quickSuccessStreakRef.current >= RECOVERY_STREAK_FOR_STEP_DOWN
            ) {
                nextAssist = Math.max(desiredLevel, (assistLevelRef.current - 1) as AssistLevel) as AssistLevel;
            }

            if (nextAssist !== assistLevelRef.current) {
                assistLevelRef.current = nextAssist;
                lastAssistChangeRef.current = now;
                setAssistLevel(nextAssist);
            }
        }, 1500);

        return () => window.clearInterval(interval);
    }, []);

    const logCompletion = useCallback((): InteractionLog => {
        const responseTime = Date.now() - sceneStartRef.current;
        return {
            sceneId,
            assistLevelUsed: assistLevelRef.current,
            responseTime,
            errorCount: errorsRef.current,
            stressScore: difficultyScore,
            difficultyScore,
        };
    }, [difficultyScore, sceneId]);

    return {
        assistLevel,
        stressScore: difficultyScore,
        difficultyScore,
        trackClick,
        trackError,
        trackSuccess,
        trackMouseMove,
        logCompletion,
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
