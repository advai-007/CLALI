import { setup, assign } from 'xstate';

// --- Types ---

export type AdaptationConfig = {
    fontFamily: 'lexend' | 'opendyslexic';
    fontSizeClass: string;
    showCalmingWidget: boolean;
    dimInactiveParagraphs: boolean;
    enableReadAloud: boolean;
    headerOpacity: 'full' | 'faded';
    bgColorClass: string;
    useBionicReading: boolean;
};

export type AdaptationContext = {
    stressScore: number;
    focusScore: number;
    adaptations: AdaptationConfig;
    sustainedStressStart: number | null;
    sustainedFocusStart: number | null;
};

export type AdaptationEvent =
    | { type: 'UPDATE_SIGNALS'; stressScore: number; focusScore: number }
    | { type: 'OVERRIDE'; state: 'calm' | 'mildStress' | 'highStress' | 'distracted' | 'disengaged' };

// --- Adaptation Configs per State ---

const CALM_ADAPTATIONS: AdaptationConfig = {
    fontFamily: 'lexend',
    fontSizeClass: 'text-3xl leading-relaxed tracking-normal',
    showCalmingWidget: false,
    dimInactiveParagraphs: false,
    enableReadAloud: false,
    headerOpacity: 'full',
    bgColorClass: 'bg-slate-50',
    useBionicReading: false,
};

const MILD_STRESS_ADAPTATIONS: AdaptationConfig = {
    fontFamily: 'opendyslexic',
    fontSizeClass: 'text-4xl leading-loose tracking-wide',
    showCalmingWidget: false,
    dimInactiveParagraphs: false,
    enableReadAloud: true,
    headerOpacity: 'full',
    bgColorClass: 'bg-sky-50',
    useBionicReading: false,
};

const HIGH_STRESS_ADAPTATIONS: AdaptationConfig = {
    fontFamily: 'opendyslexic',
    fontSizeClass: 'text-4xl leading-loose tracking-wide',
    showCalmingWidget: true,
    dimInactiveParagraphs: false,
    enableReadAloud: true,
    headerOpacity: 'full',
    bgColorClass: 'bg-sky-50',
    useBionicReading: false,
};

const DISTRACTED_ADAPTATIONS: AdaptationConfig = {
    fontFamily: 'lexend',
    fontSizeClass: 'text-3xl leading-relaxed tracking-normal',
    showCalmingWidget: false,
    dimInactiveParagraphs: true,
    enableReadAloud: false,
    headerOpacity: 'faded',
    bgColorClass: 'bg-slate-50',
    useBionicReading: true,
};

const DISENGAGED_ADAPTATIONS: AdaptationConfig = {
    fontFamily: 'lexend',
    fontSizeClass: 'text-3xl leading-relaxed tracking-normal',
    showCalmingWidget: false,
    dimInactiveParagraphs: true,
    enableReadAloud: true,
    headerOpacity: 'faded',
    bgColorClass: 'bg-amber-50',
    useBionicReading: true,
};

// --- Hysteresis Thresholds ---
// Enter thresholds differ from exit thresholds to prevent flickering

const THRESHOLDS = {
    stress: {
        enterMild: 0.4,
        exitMild: 0.3,
        enterHigh: 0.7,
        exitHigh: 0.5,
    },
    focus: {
        enterDistracted: 0.4,   // focus drops below this → distracted
        exitDistracted: 0.5,    // focus rises above this → calm
        enterDisengaged: 0.2,   // focus drops below this → disengaged
        exitDisengaged: 0.3,    // focus rises above this → back to distracted
    },
    // Sustained duration (ms) before transition fires
    sustainedMs: {
        toMildStress: 3000,
        toHighStress: 5000,
        toCalmFromStress: 4000,
        toDistracted: 3000,
        toDisengaged: 5000,
        toCalmFromDistracted: 4000,
        fromDisengaged: 3000,
    },
};

// --- Helper: check if condition sustained long enough ---

function isSustained(
    score: number,
    threshold: number,
    comparison: 'above' | 'below',
    sustainedStart: number | null,
    requiredMs: number
): boolean {
    if (sustainedStart === null) return false;
    const conditionMet = comparison === 'above'
        ? score > threshold
        : score < threshold;
    if (!conditionMet) return false;
    return (Date.now() - sustainedStart) >= requiredMs;
}

// --- Machine Definition ---

export const adaptationMachine = setup({
    types: {
        context: {} as AdaptationContext,
        events: {} as AdaptationEvent,
    },
    guards: {
        shouldEnterMildStress: ({ context }) =>
            isSustained(context.stressScore, THRESHOLDS.stress.enterMild, 'above',
                context.sustainedStressStart, THRESHOLDS.sustainedMs.toMildStress),

        shouldEnterHighStress: ({ context }) =>
            isSustained(context.stressScore, THRESHOLDS.stress.enterHigh, 'above',
                context.sustainedStressStart, THRESHOLDS.sustainedMs.toHighStress),

        shouldExitHighStress: ({ context }) =>
            isSustained(context.stressScore, THRESHOLDS.stress.exitHigh, 'below',
                context.sustainedStressStart, THRESHOLDS.sustainedMs.toCalmFromStress),

        shouldExitMildStress: ({ context }) =>
            isSustained(context.stressScore, THRESHOLDS.stress.exitMild, 'below',
                context.sustainedStressStart, THRESHOLDS.sustainedMs.toCalmFromStress),

        shouldEnterDistracted: ({ context }) =>
            isSustained(context.focusScore, THRESHOLDS.focus.enterDistracted, 'below',
                context.sustainedFocusStart, THRESHOLDS.sustainedMs.toDistracted),

        shouldExitDistracted: ({ context }) =>
            isSustained(context.focusScore, THRESHOLDS.focus.exitDistracted, 'above',
                context.sustainedFocusStart, THRESHOLDS.sustainedMs.toCalmFromDistracted),

        shouldEnterDisengaged: ({ context }) =>
            isSustained(context.focusScore, THRESHOLDS.focus.enterDisengaged, 'below',
                context.sustainedFocusStart, THRESHOLDS.sustainedMs.toDisengaged),

        shouldExitDisengaged: ({ context }) =>
            isSustained(context.focusScore, THRESHOLDS.focus.exitDisengaged, 'above',
                context.sustainedFocusStart, THRESHOLDS.sustainedMs.fromDisengaged),
    },
    actions: {
        updateScores: assign({
            stressScore: ({ event }) => {
                if (event.type !== 'UPDATE_SIGNALS') return 0;
                return event.stressScore;
            },
            focusScore: ({ event }) => {
                if (event.type !== 'UPDATE_SIGNALS') return 1;
                return event.focusScore;
            },
            sustainedStressStart: ({ context, event }) => {
                if (event.type !== 'UPDATE_SIGNALS') return context.sustainedStressStart;
                // Track when the current stress condition started
                const prevAboveMild = context.stressScore > THRESHOLDS.stress.enterMild;
                const nowAboveMild = event.stressScore > THRESHOLDS.stress.enterMild;
                const prevBelowExit = context.stressScore < THRESHOLDS.stress.exitMild;
                const nowBelowExit = event.stressScore < THRESHOLDS.stress.exitMild;

                if ((nowAboveMild && !prevAboveMild) || (nowBelowExit && !prevBelowExit)) {
                    return Date.now(); // condition just started
                }
                if (!nowAboveMild && !nowBelowExit) {
                    return null; // in neutral zone
                }
                return context.sustainedStressStart; // condition continues
            },
            sustainedFocusStart: ({ context, event }) => {
                if (event.type !== 'UPDATE_SIGNALS') return context.sustainedFocusStart;
                const prevBelowDistracted = context.focusScore < THRESHOLDS.focus.enterDistracted;
                const nowBelowDistracted = event.focusScore < THRESHOLDS.focus.enterDistracted;
                const prevAboveExit = context.focusScore > THRESHOLDS.focus.exitDistracted;
                const nowAboveExit = event.focusScore > THRESHOLDS.focus.exitDistracted;

                if ((nowBelowDistracted && !prevBelowDistracted) || (nowAboveExit && !prevAboveExit)) {
                    return Date.now();
                }
                if (!nowBelowDistracted && !nowAboveExit) {
                    return null;
                }
                return context.sustainedFocusStart;
            },
        }),
        setAdaptations: assign({
            adaptations: (_, params: { config: AdaptationConfig }) => params.config,
        }),
    },
}).createMachine({
    id: 'adaptation',
    initial: 'calm',
    context: {
        stressScore: 0,
        focusScore: 1,
        adaptations: CALM_ADAPTATIONS,
        sustainedStressStart: null,
        sustainedFocusStart: null,
    },
    states: {
        calm: {
            entry: [{ type: 'setAdaptations', params: { config: CALM_ADAPTATIONS } }],
            on: {
                UPDATE_SIGNALS: [
                    {
                        guard: 'shouldEnterMildStress',
                        target: 'mildStress',
                        actions: 'updateScores',
                    },
                    {
                        guard: 'shouldEnterDistracted',
                        target: 'distracted',
                        actions: 'updateScores',
                    },
                    {
                        actions: 'updateScores',
                    },
                ],
                OVERRIDE: [
                    { guard: ({ event }) => event.state === 'mildStress', target: 'mildStress' },
                    { guard: ({ event }) => event.state === 'highStress', target: 'highStress' },
                    { guard: ({ event }) => event.state === 'distracted', target: 'distracted' },
                    { guard: ({ event }) => event.state === 'disengaged', target: 'disengaged' },
                    { target: 'calm' },
                ],
            },
        },
        mildStress: {
            entry: [{ type: 'setAdaptations', params: { config: MILD_STRESS_ADAPTATIONS } }],
            on: {
                UPDATE_SIGNALS: [
                    {
                        guard: 'shouldEnterHighStress',
                        target: 'highStress',
                        actions: 'updateScores',
                    },
                    {
                        guard: 'shouldExitMildStress',
                        target: 'calm',
                        actions: 'updateScores',
                    },
                    {
                        actions: 'updateScores',
                    },
                ],
                OVERRIDE: [
                    { guard: ({ event }) => event.state === 'calm', target: 'calm' },
                    { guard: ({ event }) => event.state === 'highStress', target: 'highStress' },
                    { guard: ({ event }) => event.state === 'distracted', target: 'distracted' },
                    { guard: ({ event }) => event.state === 'disengaged', target: 'disengaged' },
                    { target: 'mildStress' },
                ],
            },
        },
        highStress: {
            entry: [{ type: 'setAdaptations', params: { config: HIGH_STRESS_ADAPTATIONS } }],
            on: {
                UPDATE_SIGNALS: [
                    {
                        guard: 'shouldExitHighStress',
                        target: 'mildStress',
                        actions: 'updateScores',
                    },
                    {
                        actions: 'updateScores',
                    },
                ],
                OVERRIDE: [
                    { guard: ({ event }) => event.state === 'calm', target: 'calm' },
                    { guard: ({ event }) => event.state === 'mildStress', target: 'mildStress' },
                    { guard: ({ event }) => event.state === 'distracted', target: 'distracted' },
                    { guard: ({ event }) => event.state === 'disengaged', target: 'disengaged' },
                    { target: 'highStress' },
                ],
            },
        },
        distracted: {
            entry: [{ type: 'setAdaptations', params: { config: DISTRACTED_ADAPTATIONS } }],
            on: {
                UPDATE_SIGNALS: [
                    {
                        guard: 'shouldEnterDisengaged',
                        target: 'disengaged',
                        actions: 'updateScores',
                    },
                    {
                        guard: 'shouldExitDistracted',
                        target: 'calm',
                        actions: 'updateScores',
                    },
                    {
                        actions: 'updateScores',
                    },
                ],
                OVERRIDE: [
                    { guard: ({ event }) => event.state === 'calm', target: 'calm' },
                    { guard: ({ event }) => event.state === 'mildStress', target: 'mildStress' },
                    { guard: ({ event }) => event.state === 'highStress', target: 'highStress' },
                    { guard: ({ event }) => event.state === 'disengaged', target: 'disengaged' },
                    { target: 'distracted' },
                ],
            },
        },
        disengaged: {
            entry: [{ type: 'setAdaptations', params: { config: DISENGAGED_ADAPTATIONS } }],
            on: {
                UPDATE_SIGNALS: [
                    {
                        guard: 'shouldExitDisengaged',
                        target: 'distracted',
                        actions: 'updateScores',
                    },
                    {
                        actions: 'updateScores',
                    },
                ],
                OVERRIDE: [
                    { guard: ({ event }) => event.state === 'calm', target: 'calm' },
                    { guard: ({ event }) => event.state === 'mildStress', target: 'mildStress' },
                    { guard: ({ event }) => event.state === 'highStress', target: 'highStress' },
                    { guard: ({ event }) => event.state === 'distracted', target: 'distracted' },
                    { target: 'disengaged' },
                ],
            },
        },
    },
});

export type AdaptationState = 'calm' | 'mildStress' | 'highStress' | 'distracted' | 'disengaged';

export const ALL_STATES: AdaptationState[] = ['calm', 'mildStress', 'highStress', 'distracted', 'disengaged'];
