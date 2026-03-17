import { useState, useCallback, useEffect, useRef } from 'react';
import { useReading } from '../ReadingContext';
import { studentMetricsApi } from '../../../services/studentMetricsApi';
import { useAuth } from '../../../context/AuthContext';

export function useReadAloud() {
    const { adaptationData } = useReading();
    const { studentUser } = useAuth();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const sessionIdRef = useRef<string>(crypto.randomUUID());

    const speak = useCallback((text: string, isAutoTriggered = false) => {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.toLowerCase());

        // Child-like Indian Accent Tuning
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang === 'en-IN' || v.lang.startsWith('en-IN')
        ) || voices.find(v =>
            (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 0.7; // Slower speed
        utterance.pitch = 1.35; // Higher pitch for child-like feel

        utterance.onstart = () => {
            setIsSpeaking(true);
            if (studentUser?.id) {
                studentMetricsApi.logAdaptationEvent(
                    studentUser.id,
                    isAutoTriggered ? 'ADAPTIVE_READ_ALOUD' : 'MANUAL_READ_ALOUD',
                    `READING_TEXT: ${text.substring(0, 50)}`,
                    sessionIdRef.current
                );
            }
        };
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [studentUser?.id]);

    // Handle voices getting loaded async
    useEffect(() => {
        const handleVoicesChanged = () => {
            // Voices loaded
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    }, []);

    // Exposed trigger that checks enableReadAloud internally if needed, 
    // but usually screens will call this in a useEffect based on their own logic.
    return {
        speak,
        isSpeaking,
        enableReadAloud: adaptationData?.adaptations.enableReadAloud ?? false
    };
}
