
export type ReadingLevel = 1 | 2 | 3 | 4 | 5;

export interface WordTask {
    id: string;
    word: string;
    missingIndices: number[]; // indices of missing letters
    image?: string;           // Optional image identifier
    pictureUrl?: string;      // URL or path for Level 3
    distractors: string[];    // Wrong letters/chunks to show on the belt
    sentenceParts?: string[]; // For Level 5: ['The cat', 'sat', 'on the mat']
}

export type BlockType = 'letter' | 'chunk' | 'word' | 'phrase';

// Level definitions and word banks will be loaded directly by the screens,
// but we define the interfaces here for consistency.
