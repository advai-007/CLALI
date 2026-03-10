import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useMachine } from '@xstate/react';
import { adaptationMachine } from '../logic/adaptationMachine';
import type { AdaptationConfig, AdaptationState } from '../logic/adaptationMachine';
import { SignalNormalizer } from '../utils/tracking/SignalNormalizer';
import type { NormalizedScores } from '../utils/tracking/SignalNormalizer';
import { featureExtractor } from '../utils/tracking/FeatureExtractor';
import type { ExtractedFeatures } from '../utils/tracking/FeatureExtractor';
import { sensorBridge } from '../utils/tracking/SensorBridge';
import type { FaceMetrics } from '../utils/tracking/FaceFeatureExtractor';
import type { TrackingBaseline } from '../context/TrackingContext';

export interface UseAdaptationOptions {
    /** Face metrics from useFaceTracking (optional — system works without camera) */
    faceMetrics?: FaceMetrics | null;
    /** Calibration baseline from TrackingContext (optional) */
    baseline?: TrackingBaseline | null;
    /** If true, sensors are started/stopped automatically */
    autoStart?: boolean;
}

export interface UseAdaptationReturn {
    /** Current adaptation UI config driven by XState */
    adaptations: AdaptationConfig;
    /** Current XState state name */
    state: AdaptationState;
    /** Normalized scores (for dev panel display) */
    scores: { stress: number; focus: number };
    /** Blink rate and time on task */
    blinkRate: number;
    timeOnTask: number;
    /** Raw extracted features from sensors (for debug panel) */
    rawFeatures: ExtractedFeatures | null;
    /** Current face metrics (for debug panel) */
    faceMetrics: FaceMetrics | null;
    /** Force the machine into a specific state (for dev panel) */
    override: (state: AdaptationState) => void;
    /** Whether sensors are running */
    isActive: boolean;
    /** Start sensor tracking */
    start: () => void;
    /** Stop sensor tracking */
    stop: () => void;
}

export function useAdaptation(options: UseAdaptationOptions = {}): UseAdaptationReturn {
    const { faceMetrics = null, baseline = null, autoStart = true } = options;

    const [machineState, send] = useMachine(adaptationMachine);

    const normalizer = useMemo(() => new SignalNormalizer(), []);
    const [isActive, setIsActive] = useState(autoStart);
    const [rawFeatures, setRawFeatures] = useState<ExtractedFeatures | null>(null);
    const [latestScores, setLatestScores] = useState<NormalizedScores>({
        stressScore: 0,
        focusScore: 1,
        blinkRate: 0,
        timeOnTask: 0,
    });

    // Store latest face metrics and baseline in refs so the subscription callback
    // always has access to the current values without re-subscribing
    const faceMetricsRef = useRef<FaceMetrics | null>(faceMetrics);
    const baselineRef = useRef<TrackingBaseline | null>(baseline);

    useEffect(() => {
        faceMetricsRef.current = faceMetrics;
    }, [faceMetrics]);

    useEffect(() => {
        baselineRef.current = baseline;
    }, [baseline]);

    // Subscribe to feature extractor and feed into normalizer → XState
    useEffect(() => {
        const unsubscribeSensor = sensorBridge.subscribe(featureExtractor.processRawData);

        const unsubscribeFeatures = featureExtractor.subscribe((features: ExtractedFeatures) => {
            setRawFeatures(features);
            const scores = normalizer.normalize(
                features,
                faceMetricsRef.current,
                baselineRef.current
            );
            setLatestScores(scores);

            send({
                type: 'UPDATE_SIGNALS',
                stressScore: scores.stressScore,
                focusScore: scores.focusScore,
            });
        });

        return () => {
            unsubscribeSensor();
            unsubscribeFeatures();
        };
    }, [normalizer, send]);

    // Auto-start sensors
    useEffect(() => {
        if (autoStart) {
            sensorBridge.start();
            featureExtractor.start();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsActive(true);
        }

        return () => {
            sensorBridge.stop();
            featureExtractor.stop();
            setIsActive(false);
        };
    }, [autoStart]);

    const start = useCallback(() => {
        if (!isActive) {
            normalizer.resetSession();
            sensorBridge.start();
            featureExtractor.start();
            setIsActive(true);
        }
    }, [normalizer, isActive]);

    const stop = useCallback(() => {
        if (isActive) {
            sensorBridge.stop();
            featureExtractor.stop();
            setIsActive(false);
        }
    }, [isActive]);

    const override = useCallback((state: AdaptationState) => {
        send({ type: 'OVERRIDE', state });
    }, [send]);

    // Extract current values from machine state
    const currentStateName = (typeof machineState.value === 'string'
        ? machineState.value
        : 'calm') as AdaptationState;

    const adaptations = machineState.context.adaptations;

    return {
        adaptations,
        state: currentStateName,
        scores: {
            stress: machineState.context.stressScore,
            focus: machineState.context.focusScore,
        },
        blinkRate: latestScores.blinkRate,
        timeOnTask: latestScores.timeOnTask,
        rawFeatures,
        faceMetrics: faceMetrics,
        override,
        isActive: isActive,
        start,
        stop,
    };
}
