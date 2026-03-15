import { setup, assign } from 'xstate';
import { AdaptiveState, DIFFICULTY_THRESHOLDS } from './workshopTypes';

// ─── Context ────────────────────────────────────────────────────────
interface AdaptiveContext {
    state: AdaptiveState;
    consecutiveCorrect: number;
    totalErrors: number;
    totalHints: number;
}

// ─── Events ─────────────────────────────────────────────────────────
type AdaptiveEvent =
    | { type: 'DIFFICULTY_DETECTED' }
    | { type: 'CORRECT_ACTION' }
    | { type: 'INCORRECT_ACTION' }
    | { type: 'HINT_SHOWN' }
    | { type: 'RESET' };

// ─── Machine ────────────────────────────────────────────────────────
export const adaptiveMachine = setup({
    types: {
        context: {} as AdaptiveContext,
        events: {} as AdaptiveEvent,
    },
    guards: {
        shouldRecover: ({ context }) =>
            context.consecutiveCorrect >= DIFFICULTY_THRESHOLDS.CORRECT_TO_RECOVER,
    },
    actions: {
        incrementCorrect: assign({
            consecutiveCorrect: ({ context }) => context.consecutiveCorrect + 1,
        }),
        resetCorrectStreak: assign({
            consecutiveCorrect: () => 0,
        }),
        incrementErrors: assign({
            totalErrors: ({ context }) => context.totalErrors + 1,
        }),
        incrementHints: assign({
            totalHints: ({ context }) => context.totalHints + 1,
        }),
        setNormal: assign({
            state: () => AdaptiveState.NORMAL,
            consecutiveCorrect: () => 0,
        }),
        setReduced: assign({
            state: () => AdaptiveState.REDUCED_COMPLEXITY,
            consecutiveCorrect: () => 0,
        }),
        setGuided: assign({
            state: () => AdaptiveState.GUIDED,
            consecutiveCorrect: () => 0,
        }),
        setMaxAssist: assign({
            state: () => AdaptiveState.MAX_ASSIST,
            consecutiveCorrect: () => 0,
        }),
        resetAll: assign({
            state: () => AdaptiveState.NORMAL,
            consecutiveCorrect: () => 0,
            totalErrors: () => 0,
            totalHints: () => 0,
        }),
    },
}).createMachine({
    id: 'adaptive',
    initial: 'normal',
    context: {
        state: AdaptiveState.NORMAL,
        consecutiveCorrect: 0,
        totalErrors: 0,
        totalHints: 0,
    },

    states: {
        normal: {
            entry: 'setNormal',
            on: {
                DIFFICULTY_DETECTED: {
                    target: 'reducedComplexity',
                },
                CORRECT_ACTION: {
                    actions: 'incrementCorrect',
                },
                INCORRECT_ACTION: {
                    actions: ['resetCorrectStreak', 'incrementErrors'],
                },
                RESET: {
                    actions: 'resetAll',
                },
            },
        },

        reducedComplexity: {
            entry: 'setReduced',
            on: {
                DIFFICULTY_DETECTED: {
                    target: 'guided',
                },
                CORRECT_ACTION: [
                    {
                        guard: 'shouldRecover',
                        target: 'normal',
                        actions: 'incrementCorrect',
                    },
                    {
                        actions: 'incrementCorrect',
                    },
                ],
                INCORRECT_ACTION: {
                    actions: ['resetCorrectStreak', 'incrementErrors'],
                },
                HINT_SHOWN: {
                    actions: 'incrementHints',
                },
                RESET: {
                    target: 'normal',
                    actions: 'resetAll',
                },
            },
        },

        guided: {
            entry: 'setGuided',
            on: {
                DIFFICULTY_DETECTED: {
                    target: 'maxAssist',
                },
                CORRECT_ACTION: [
                    {
                        guard: 'shouldRecover',
                        target: 'reducedComplexity',
                        actions: 'incrementCorrect',
                    },
                    {
                        actions: 'incrementCorrect',
                    },
                ],
                INCORRECT_ACTION: {
                    actions: ['resetCorrectStreak', 'incrementErrors'],
                },
                HINT_SHOWN: {
                    actions: 'incrementHints',
                },
                RESET: {
                    target: 'normal',
                    actions: 'resetAll',
                },
            },
        },

        maxAssist: {
            entry: 'setMaxAssist',
            on: {
                CORRECT_ACTION: [
                    {
                        guard: 'shouldRecover',
                        target: 'guided',
                        actions: 'incrementCorrect',
                    },
                    {
                        actions: 'incrementCorrect',
                    },
                ],
                INCORRECT_ACTION: {
                    actions: ['resetCorrectStreak', 'incrementErrors'],
                },
                HINT_SHOWN: {
                    actions: 'incrementHints',
                },
                RESET: {
                    target: 'normal',
                    actions: 'resetAll',
                },
            },
        },
    },
});
