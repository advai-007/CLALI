export type InteractionType = 'multipleChoice' | 'sentenceBuilder' | 'sceneBuilder' | 'emotionQuestion';

export type AssistLevel = 0 | 1 | 2 | 3 | 4;

export interface InteractionData {
    question?: string;
    choices?: string[];
    correctAnswer?: string;
    scrambledSentence?: string[];
    correctOrder?: string[];
    sceneTargets?: string[];
    sceneOptions?: string[];
    // Base layout config for the interaction panel
    layout?: 'row' | 'grid' | 'column';
}

export interface Scene {
    id: string;
    storyText: string;
    interactionType: InteractionType;
    interactionData: InteractionData;
    nextScene: string | null;
}

export interface SessionMetrics {
    clickRate: number;
    responseTime: number;
    errorCount: number;
    mouseVelocity: number;
}

export interface InteractionLog {
    sceneId: string;
    assistLevelUsed: AssistLevel;
    responseTime: number;
    errorCount: number;
    stressScore: number;
    difficultyScore: number;
}
