// ─── Adaptive Difficulty ────────────────────────────────────────────
export const AdaptiveState = {
    NORMAL: 'NORMAL',
    REDUCED_COMPLEXITY: 'REDUCED_COMPLEXITY',
    GUIDED: 'GUIDED',
    MAX_ASSIST: 'MAX_ASSIST',
} as const;
export type AdaptiveState = typeof AdaptiveState[keyof typeof AdaptiveState];

// ─── Interaction Signals ────────────────────────────────────────────
export interface InteractionSignals {
    /** Milliseconds from task presentation to first user action */
    timeToFirstAction: number;
    /** Number of incorrect attempts since last correct action */
    incorrectAttemptCount: number;
    /** Milliseconds since last user interaction */
    idleTime: number;
    /** Cumulative count of misplaced drops in current task */
    misplacedDropCount: number;
}

// ─── Thresholds (tunable) ───────────────────────────────────────────
export const DIFFICULTY_THRESHOLDS = {
    MAX_INCORRECT_ATTEMPTS: 2,
    MAX_IDLE_TIME_MS: 8_000,
    MAX_FIRST_ACTION_TIME_MS: 10_000,
    CORRECT_TO_RECOVER: 3,
} as const;

// ─── Task Progress ─────────────────────────────────────────────────
export interface TaskProgress {
    taskDuration: number;         // ms
    errorCount: number;
    adaptationStateUsed: AdaptiveState;
    hintCount: number;
    starsEarned: number;          // 1-3
}

// ─── Game Stations ──────────────────────────────────────────────────
export type GameStation =
    | 'tires'
    | 'wiring'
    | 'fuel'
    | 'bolts';

export const StationStatus = {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    COMPLETED: 'COMPLETED',
} as const;
export type StationStatus = typeof StationStatus[keyof typeof StationStatus];

export interface StationInfo {
    id: GameStation;
    title: string;
    icon: string;
    route: string;
    status: StationStatus;
}

// ─── Feedback ───────────────────────────────────────────────────────
export type FeedbackType = 'correct' | 'incorrect' | 'hint';

export interface FeedbackMessage {
    type: FeedbackType;
    text: string;
}

export const POSITIVE_MESSAGES = [
    'Nice repair!',
    'Great work!',
    'Perfect fit!',
    'You got it!',
    'Awesome mechanic!',
] as const;

export const ENCOURAGE_MESSAGES = [
    "Let's try another tool.",
    'Almost there!',
    'Give it another go!',
    'Try a different one!',
] as const;
