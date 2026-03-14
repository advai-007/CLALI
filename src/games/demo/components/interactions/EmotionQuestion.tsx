import type { InteractionData, AssistLevel } from '../../demoTypes';
import { MultipleChoice } from './MultipleChoice';

interface Props {
    data: InteractionData;
    assistLevel: AssistLevel;
    onCorrect: () => void;
    onError: () => void;
    onInteract: () => void;
}

// Emotion Question is identical to Multiple choice in layout, but typically uses rows
// and can easily be expanded to Use SVG Icons above the text choices later.
export function EmotionQuestion(props: Props) {
    return (
        <MultipleChoice {...props} />
    );
}
