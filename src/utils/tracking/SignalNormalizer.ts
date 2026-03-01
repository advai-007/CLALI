import type { ExtractedFeatures } from './FeatureExtractor';
import type { FaceMetrics } from './FaceFeatureExtractor';
import type { TrackingBaseline } from '../../context/TrackingContext';

export type NormalizedScores = {
    stressScore: number;   // 0-1
    focusScore: number;    // 0-1
    blinkRate: number;     // blinks per minute (estimated)
    timeOnTask: number;    // seconds
};

// Weights for stress score components (sum should be ~1.0)
const STRESS_WEIGHTS = {
    franticTaps: 0.20,
    scrollYoYo: 0.12,
    motionMagnitude: 0.10,
    touchHold: 0.08,
    touchPressure: 0.15,
    gripTouch: 0.15,
    tiltVariance: 0.10,
    headRoll: 0.10,
};

// Weights for focus score components
const FOCUS_WEIGHTS = {
    earDeviation: 0.25,
    yawDeviation: 0.20,
    pitchDeviation: 0.15,
    idle: 0.15,
    visibility: 0.10,
    orientationChange: 0.15,
};

// EMA smoothing factor (0-1, lower = more smoothing)
const EMA_ALPHA = 0.3;

export class SignalNormalizer {
    private smoothedStress: number = 0;
    private smoothedFocus: number = 1; // Start fully focused
    private sessionStartTime: number = Date.now();

    // Blink detection from EAR
    private earHistory: { value: number, time: number }[] = [];
    private EAR_BLINK_THRESHOLD = 0.2;
    private BLINK_WINDOW = 60000; // 1 minute for blink rate
    private blinkTimestamps: number[] = [];
    private wasBelow = false;

    /** Reset session timer (call when student starts a new reading session) */
    public resetSession() {
        this.sessionStartTime = Date.now();
        this.smoothedStress = 0;
        this.smoothedFocus = 1;
        this.earHistory = [];
        this.blinkTimestamps = [];
        this.wasBelow = false;
    }

    /**
     * Normalize raw features + face metrics into composite scores.
     * Face metrics and baseline are optional — system works without camera.
     */
    public normalize(
        features: ExtractedFeatures,
        faceMetrics: FaceMetrics | null,
        baseline: TrackingBaseline | null
    ): NormalizedScores {
        const now = Date.now();

        // --- Compute raw stress components (each 0-1) ---

        // Frantic taps: 0 = none, 1 = 8+ taps in cluster
        const franticTapScore = clamp(features.franticTaps / 8, 0, 1);

        // Scroll yo-yo: 0 = none, 1 = 6+ direction changes in window
        const scrollYoYoScore = clamp(features.scrollYoYoCount / 6, 0, 1);

        // Motion magnitude: normalize against ~20 m/s² (heavy shaking)
        // Subtract resting gravity (~9.8) as baseline
        const adjustedMotion = Math.max(0, features.motionMagnitude - 9.8);
        const motionScore = clamp(adjustedMotion / 10, 0, 1);

        // Touch hold: long holds > 3s indicate hesitation
        const touchHoldScore = clamp(features.touchHoldDuration / 3000, 0, 1);

        // Touch pressure (tablet): 0-1 directly from Touch.force
        const pressureScore = clamp(features.avgTouchPressure, 0, 1);

        // Grip touches (tablet): 3 = threshold, 5+ = high stress
        const gripScore = clamp((features.gripTouchCount - 2) / 3, 0, 1);

        // Tilt variance (tablet): higher variance = more fidgeting
        // Typical calm variance < 10, stressed > 50
        const tiltScore = clamp(features.tiltVariance / 50, 0, 1);

        // Head roll from face (if available)
        let headRollScore = 0;
        if (faceMetrics) {
            // Roll in radians, typical range ~-0.3 to 0.3
            headRollScore = clamp(Math.abs(faceMetrics.headRoll) / 0.3, 0, 1);
        }

        // Weighted stress score
        const rawStress =
            STRESS_WEIGHTS.franticTaps * franticTapScore +
            STRESS_WEIGHTS.scrollYoYo * scrollYoYoScore +
            STRESS_WEIGHTS.motionMagnitude * motionScore +
            STRESS_WEIGHTS.touchHold * touchHoldScore +
            STRESS_WEIGHTS.touchPressure * pressureScore +
            STRESS_WEIGHTS.gripTouch * gripScore +
            STRESS_WEIGHTS.tiltVariance * tiltScore +
            STRESS_WEIGHTS.headRoll * headRollScore;

        // --- Compute raw focus components (each 0-1, where 1 = focused) ---

        // EAR deviation from baseline (drowsiness)
        let earScore = 1; // default: focused
        if (faceMetrics && baseline) {
            const earDev = Math.abs(faceMetrics.ear - baseline.avgEar);
            // Deviation > 0.1 from baseline = significant drowsiness
            earScore = 1 - clamp(earDev / 0.1, 0, 1);
        }

        // Head yaw deviation (looking away)
        let yawScore = 1;
        if (faceMetrics && baseline) {
            const yawDev = Math.abs(faceMetrics.headYaw - baseline.avgYaw);
            // Looking 0.3+ sideways = distracted
            yawScore = 1 - clamp(yawDev / 0.3, 0, 1);
        }

        // Head pitch deviation (looking down/up, not at screen)
        let pitchScore = 1;
        if (faceMetrics && baseline) {
            const pitchDev = Math.abs(faceMetrics.headPitch - baseline.avgPitch);
            pitchScore = 1 - clamp(pitchDev / 0.3, 0, 1);
        }

        // Idle: if idle, focus is low
        const idleScore = features.isIdle ? 0 : 1;

        // Visibility: tab hidden means not focused
        const visibilityScore = features.isVisible ? 1 : 0;

        // Orientation change rate (tablet): rotating device = distraction
        // 0 changes = focused, 4+ = very distracted
        const orientationScore = 1 - clamp(features.orientationChangeRate / 4, 0, 1);

        // Weighted focus score
        const rawFocus =
            FOCUS_WEIGHTS.earDeviation * earScore +
            FOCUS_WEIGHTS.yawDeviation * yawScore +
            FOCUS_WEIGHTS.pitchDeviation * pitchScore +
            FOCUS_WEIGHTS.idle * idleScore +
            FOCUS_WEIGHTS.visibility * visibilityScore +
            FOCUS_WEIGHTS.orientationChange * orientationScore;

        // --- EMA smoothing ---
        this.smoothedStress = ema(this.smoothedStress, rawStress, EMA_ALPHA);
        this.smoothedFocus = ema(this.smoothedFocus, rawFocus, EMA_ALPHA);

        // --- Blink detection ---
        if (faceMetrics) {
            this.earHistory.push({ value: faceMetrics.ear, time: now });
            this.earHistory = this.earHistory.filter(e => now - e.time <= this.BLINK_WINDOW);

            // Detect blink: EAR drops below threshold then rises back
            const isBelowThreshold = faceMetrics.ear < this.EAR_BLINK_THRESHOLD;
            if (this.wasBelow && !isBelowThreshold) {
                // Blink completed (rose back up)
                this.blinkTimestamps.push(now);
            }
            this.wasBelow = isBelowThreshold;
            this.blinkTimestamps = this.blinkTimestamps.filter(t => now - t <= this.BLINK_WINDOW);
        }

        const blinkRate = this.blinkTimestamps.length; // blinks in last minute

        const timeOnTask = (now - this.sessionStartTime) / 1000; // seconds

        return {
            stressScore: clamp(this.smoothedStress, 0, 1),
            focusScore: clamp(this.smoothedFocus, 0, 1),
            blinkRate,
            timeOnTask,
        };
    }
}

// --- Utilities ---

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function ema(prev: number, current: number, alpha: number): number {
    return alpha * current + (1 - alpha) * prev;
}
