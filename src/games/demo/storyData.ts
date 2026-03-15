import type { Scene } from './demoTypes';

export const storyData: Record<string, Scene> = {
    // ----------------------------------------------------------------------
    // CHAPTER 1 : Leo and the Whispering River
    // ----------------------------------------------------------------------
    c1_s1: {
        id: 'c1_s1',
        storyText: "Leo the fox woke up early in the quiet forest. The morning sun shone through the tall trees. Suddenly Leo heard a strange sound coming from the river.",
        interactionType: 'multipleChoice',
        interactionData: {
            question: "Where did Leo hear the sound?",
            choices: ["Near the river", "Inside a cave", "In the sky"],
            correctAnswer: "Near the river"
        },
        nextScene: 'c1_s2'
    },
    c1_s2: {
        id: 'c1_s2',
        storyText: "Leo walked toward the river. Near the water he saw a small bird trapped in a net.",
        interactionType: 'sceneBuilder',
        interactionData: {
            question: "Build the scene Leo found.",
            sceneTargets: ['Bird', 'River', 'Net'],
            sceneOptions: ['Bird', 'River', 'Net', 'Rock', 'Fish'],
        },
        nextScene: 'c1_s3'
    },
    c1_s3: {
        id: 'c1_s3',
        storyText: "Leo carefully pulled the net away from the bird.",
        interactionType: 'sentenceBuilder',
        interactionData: {
            question: "Assemble the sentence:",
            scrambledSentence: ["helped", "bird", "the", "Leo"],
            correctOrder: ["Leo", "helped", "the", "bird"]
        },
        nextScene: 'c1_s4'
    },
    c1_s4: {
        id: 'c1_s4',
        storyText: "The bird chirped happily and flew into the sky.",
        interactionType: 'emotionQuestion',
        interactionData: {
            question: "How does the bird feel?",
            choices: ["Happy", "Sad", "Angry"],
            correctAnswer: "Happy",
            layout: 'row'
        },
        nextScene: 'c1_s5'
    },
    c1_s5: {
        id: 'c1_s5',
        storyText: "Leo walked home feeling proud because he helped someone.",
        interactionType: 'multipleChoice',
        interactionData: {
            question: "What did Leo do today?",
            choices: ["Helped a bird", "Climbed a mountain", "Found treasure"],
            correctAnswer: "Helped a bird",
            layout: 'column'
        },
        nextScene: 'c2_s1' // Bridges into Chapter 2
    },

    // ----------------------------------------------------------------------
    // CHAPTER 2: Leo and the Lost Path
    // ----------------------------------------------------------------------
    c2_s1: {
        id: 'c2_s1',
        storyText: "The next morning Leo walked through the forest looking for berries. Suddenly he heard someone calling for help.",
        interactionType: 'multipleChoice',
        interactionData: {
            question: "What did Leo hear?",
            choices: ["Someone calling for help", "A thunderstorm", "Birds singing"],
            correctAnswer: "Someone calling for help",
            layout: 'column'
        },
        nextScene: 'c2_s2'
    },
    c2_s2: {
        id: 'c2_s2',
        storyText: "Leo followed the sound and found a small rabbit near a bush. The rabbit looked worried.",
        interactionType: 'sceneBuilder',
        interactionData: {
            question: "Build the scene Leo found.",
            sceneTargets: ['Rabbit', 'Bush', 'Trees'],
            sceneOptions: ['Rabbit', 'Bush', 'Trees', 'Bird', 'River'],
        },
        nextScene: 'c2_s3'
    },
    c2_s3: {
        id: 'c2_s3',
        storyText: "The rabbit explained she was searching for carrots and lost the path home.",
        interactionType: 'sentenceBuilder',
        interactionData: {
            question: "What happened to the rabbit?",
            scrambledSentence: ["lost", "rabbit", "The", "path", "the"],
            correctOrder: ["The", "rabbit", "lost", "the", "path"]
        },
        nextScene: 'c2_s4'
    },
    c2_s4: {
        id: 'c2_s4',
        storyText: "Leo climbed a rock and looked across the forest. He saw a path leading toward a carrot field.",
        interactionType: 'multipleChoice',
        interactionData: {
            question: "Why did Leo climb the rock?",
            choices: ["To see the forest better", "To sleep", "To catch a bird"],
            correctAnswer: "To see the forest better",
            layout: 'column'
        },
        nextScene: 'c2_s5'
    },
    c2_s5: {
        id: 'c2_s5',
        storyText: "Leo showed the rabbit the path home. The rabbit hopped happily along the trail.",
        interactionType: 'multipleChoice',
        interactionData: {
            question: "Why was the rabbit lost?",
            choices: ["She wandered too far while looking for carrots", "She forgot how to hop", "She was chasing butterflies"],
            correctAnswer: "She wandered too far while looking for carrots",
            layout: 'column'
        },
        nextScene: null // End of Demo
    }
};
