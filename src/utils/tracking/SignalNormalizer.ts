import type { ExtractedFeatures } from './FeatureExtractor';
import type { FaceMetrics } from './FaceFeatureExtractor';
import type { TrackingBaseline } from '../../context/TrackingContext';

export type NormalizedScores = {
    stressScore: number;   // 0-1
    focusScore: number;    // 0-1
    blinkRate: number;     // blinks per minute (estimated)
    timeOnTask: number;    // seconds
};

// Weights for stress score components
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

// EMA smoothing factor (0-1, higher = less smoothing, faster reaction)
const EMA_ALPHA = 0.6;

// --- Absolute fallback thresholds (used when NO baseline exists) ---
// These represent "neutral face looking straight at screen" guidelines.
// EAR of a normal open eye ≈ 0.25–0.35; below 0.22 = drowsy
const ABSOLUTE = {
    earOpen: 0.28,         // expected open-eye EAR for a child
    earDropThreshold: 0.05, // deviation below earOpen = drowsy
    yawDistracted: 0.20,   // |yaw| > this = looking sideways (absolute)
    pitchDistracted: 0.18, // |pitch| > this = looking up/down (absolute)
};

// Self-calibration: collect face samples for the first CALIBRATION_WINDOW_MS
const CALIBRATION_WINDOW_MS = 5000; // 5 seconds of neutral face data
const MIN_CALIBRATION_SAMPLES = 8;  // need at least N samples before trusting it

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

    // Game Event tracking
    private recentErrors = 0;
    private lastErrorDecay = Date.now();

    // ──────────────────────────────────────────────────────────────────────────
    // Self-calibration: automatically build an internal baseline from the
    // first CALIBRATION_WINDOW_MS of face data so face tracking works even
    // when the user hasn't gone through the manual calibration flow.
    // ──────────────────────────────────────────────────────────────────────────
    private calibStartTime: number = Date.now();
    private calibSamples: { ear: number; yaw: number; pitch: number }[] = [];
    private internalBaseline: TrackingBaseline | null = null;
    private calibrationDone: boolean = false;

    /** Expose whether self-calibration is complete (for debug panel) */
    public get isCalibrated(): boolean {
        return this.calibrationDone;
    }

    /** Expose internal baseline (for debug) */
    public get baseline(): TrackingBaseline | null {
        return this.internalBaseline;
    }

    private tryCalibrate(faceMetrics: FaceMetrics, now: number): void {
        if (this.calibrationDone) return;

        const elapsed = now - this.calibStartTime;
        if (elapsed <= CALIBRATION_WINDOW_MS) {
            // Still in calibration window — collect samples
            this.calibSamples.push({
                ear: faceMetrics.ear,
                yaw: faceMetrics.headYaw,
                pitch: faceMetrics.headPitch,
            });
        } else if (this.calibSamples.length >= MIN_CALIBRATION_SAMPLES) {
            // Compute mean of collected samples as the baseline
            const n = this.calibSamples.length;
            const avgEar = this.calibSamples.reduce((s, v) => s + v.ear, 0) / n;
            const avgYaw = this.calibSamples.reduce((s, v) => s + v.yaw, 0) / n;
            const avgPitch = this.calibSamples.reduce((s, v) => s + v.pitch, 0) / n;

            this.internalBaseline = { avgEar, avgYaw, avgPitch };
            this.calibrationDone = true;
            console.info('[SignalNormalizer] Self-calibration complete:', this.internalBaseline);
        } else {
            // Not enough samples — extend window and keep collecting
            this.calibStartTime = now;
        }
    }

    /** Register game-level interactions directly */
    public registerGameEvent(eventType: 'correct' | 'incorrect') {
        if (eventType === 'incorrect') {
            this.recentErrors += 1;
        } else if (eventType === 'correct') {
            this.recentErrors = 0;
            this.smoothedFocus = Math.min(1.0, this.smoothedFocus + 0.2);
            this.smoothedStress = Math.max(0.0, this.smoothedStress - 0.2);
        }
    }

    /** Reset session timer (call when student starts a new reading session) */
    public resetSession() {
        this.sessionStartTime = Date.now();
        this.smoothedStress = 0;
        this.smoothedFocus = 1;
        this.earHistory = [];
        this.blinkTimestamps = [];
        this.wasBelow = false;
        this.recentErrors = 0;
        this.lastErrorDecay = Date.now();
        // DON'T reset calibration — it carries over between tasks
    }

    /**
     * Normalize raw features + face metrics into composite scores.
     * Now works in three tiers:
     *   1. External baseline (from manual TrackingContext calibration) — most accurate
     *   2. Internal self-calibrated baseline (auto-computed from first 5s) — good
     *   3. Absolute fallback thresholds — always works, no calibration needed
     */
    public normalize(
        features: ExtractedFeatures,
        faceMetrics: FaceMetrics | null,
        externalBaseline: TrackingBaseline | null
    ): NormalizedScores {
        const now = Date.now();

        // Run self-calibration if we have face data and no external baseline
        if (faceMetrics && !externalBaseline && !this.calibrationDone) {
            this.tryCalibrate(faceMetrics, now);
        }

        // Determine active baseline: prefer external (manual), then internal (auto)
        const baseline: TrackingBaseline | null = externalBaseline ?? this.internalBaseline;

        // --- Compute raw stress components (each 0-1) ---

        const franticTapScore = clamp(features.franticTaps / 8, 0, 1);
        const scrollYoYoScore = clamp(features.scrollYoYoCount / 6, 0, 1);
        const adjustedMotion = Math.max(0, features.motionMagnitude - 9.8);
        const motionScore = clamp(adjustedMotion / 10, 0, 1);
        const touchHoldScore = clamp(features.touchHoldDuration / 3000, 0, 1);
        const pressureScore = clamp(features.avgTouchPressure, 0, 1);
        const gripScore = clamp((features.gripTouchCount - 2) / 3, 0, 1);
        const tiltScore = clamp(features.tiltVariance / 50, 0, 1);

        let headRollScore = 0;
        if (faceMetrics) {
            headRollScore = clamp(Math.abs(faceMetrics.headRoll) / 0.3, 0, 1);
        }

        let rawStress =
            STRESS_WEIGHTS.franticTaps * franticTapScore +
            STRESS_WEIGHTS.scrollYoYo * scrollYoYoScore +
            STRESS_WEIGHTS.motionMagnitude * motionScore +
            STRESS_WEIGHTS.touchHold * touchHoldScore +
            STRESS_WEIGHTS.touchPressure * pressureScore +
            STRESS_WEIGHTS.gripTouch * gripScore +
            STRESS_WEIGHTS.tiltVariance * tiltScore +
            STRESS_WEIGHTS.headRoll * headRollScore;

        // Game error penalty (decays every 5s)
        if (now - this.lastErrorDecay > 15000) {
            this.recentErrors = Math.max(0, this.recentErrors - 1);
            this.lastErrorDecay = now;
        }
        const errorStress = Math.min(1.0, this.recentErrors * 0.3);
        rawStress = Math.min(1.0, rawStress + errorStress);

        // --- Compute raw focus components (each 0-1, where 1 = focused) ---

        let earScore = 1;
        let yawScore = 1;
        let pitchScore = 1;

        if (faceMetrics) {
            if (baseline) {
                // ── Tier 1 & 2: Baseline-deviation scoring (accurate) ──────────────────

                // EAR: deviation > 0.08 = drowsy (tighter than before for self-calib)
                const earDev = Math.abs(faceMetrics.ear - baseline.avgEar);
                earScore = 1 - clamp(earDev / 0.08, 0, 1);

                // Yaw: deviation > 0.25 = clearly looking sideways
                const yawDev = Math.abs(faceMetrics.headYaw - baseline.avgYaw);
                yawScore = 1 - clamp(yawDev / 0.25, 0, 1);

                // Pitch: deviation > 0.25 = clearly looking away
                const pitchDev = Math.abs(faceMetrics.headPitch - baseline.avgPitch);
                pitchScore = 1 - clamp(pitchDev / 0.25, 0, 1);

            } else {
                // ── Tier 3: Absolute fallback — no calibration at all ─────────────────
                // Use universally sensible thresholds for a child sitting at a device.

                // EAR: below (earOpen - earDropThreshold) = drowsy/closed eyes
                const ear = faceMetrics.ear;
                const earExpected = ABSOLUTE.earOpen;
                const earDrop = Math.max(0, earExpected - ear); // only penalise low EAR
                earScore = 1 - clamp(earDrop / ABSOLUTE.earDropThreshold, 0, 1);

                // Yaw: absolute magnitude > 0.20 = looking sideways
                yawScore = 1 - clamp(Math.abs(faceMetrics.headYaw) / ABSOLUTE.yawDistracted, 0, 1);

                // Pitch: absolute magnitude > 0.18 = looking away (head tilt up/down)
                pitchScore = 1 - clamp(Math.abs(faceMetrics.headPitch) / ABSOLUTE.pitchDistracted, 0, 1);
            }
        }

        const idleScore = features.isIdle ? 0 : 1;
        const visibilityScore = features.isVisible ? 1 : 0;
        const orientationScore = 1 - clamp(features.orientationChangeRate / 4, 0, 1);

        let rawFocus =
            FOCUS_WEIGHTS.earDeviation * earScore +
            FOCUS_WEIGHTS.yawDeviation * yawScore +
            FOCUS_WEIGHTS.pitchDeviation * pitchScore +
            FOCUS_WEIGHTS.idle * idleScore +
            FOCUS_WEIGHTS.visibility * visibilityScore +
            FOCUS_WEIGHTS.orientationChange * orientationScore;

        // Sustained idle = instant heavy focus drop (forces state change)
        if (features.isIdle) {
            rawFocus = 0.1;
        }

        // --- EMA smoothing ---
        this.smoothedStress = ema(this.smoothedStress, rawStress, EMA_ALPHA);
        this.smoothedFocus = ema(this.smoothedFocus, rawFocus, EMA_ALPHA);

        // --- Blink detection ---
        if (faceMetrics) {
            this.earHistory.push({ value: faceMetrics.ear, time: now });
            this.earHistory = this.earHistory.filter(e => now - e.time <= this.BLINK_WINDOW);

            const isBelowThreshold = faceMetrics.ear < this.EAR_BLINK_THRESHOLD;
            if (this.wasBelow && !isBelowThreshold) {
                this.blinkTimestamps.push(now);
            }
            this.wasBelow = isBelowThreshold;
            this.blinkTimestamps = this.blinkTimestamps.filter(t => now - t <= this.BLINK_WINDOW);
        }

        const blinkRate = this.blinkTimestamps.length;
        const timeOnTask = (now - this.sessionStartTime) / 1000;

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
