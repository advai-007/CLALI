import { useState, useEffect, useCallback } from 'react';

export type StressLevel = 'low' | 'medium' | 'high';
export type FocusLevel = 'low' | 'normal' | 'high';

interface BiometricsState {
    stress: StressLevel;
    focus: FocusLevel;
    isSimulating: boolean;
}

export const useBiometrics = () => {
    const [state, setState] = useState<BiometricsState>({
        stress: 'low',
        focus: 'normal',
        isSimulating: false,
    });

    const setStress = useCallback((stress: StressLevel) => {
        setState((prev) => ({ ...prev, stress, isSimulating: false }));
    }, []);

    const setFocus = useCallback((focus: FocusLevel) => {
        setState((prev) => ({ ...prev, focus, isSimulating: false }));
    }, []);

    const toggleSimulation = useCallback(() => {
        setState((prev) => ({ ...prev, isSimulating: !prev.isSimulating }));
    }, []);

    // Simulation effect
    useEffect(() => {
        if (!state.isSimulating) return;

        const interval = setInterval(() => {
            setState((prev) => {
                // Simple random simulation logic for demonstration
                const stressLevels: StressLevel[] = ['low', 'medium', 'high'];
                const focusLevels: FocusLevel[] = ['low', 'normal', 'high'];

                const nextStress = stressLevels[Math.floor(Math.random() * stressLevels.length)];
                const nextFocus = focusLevels[Math.floor(Math.random() * focusLevels.length)];

                return {
                    ...prev,
                    stress: nextStress,
                    focus: nextFocus,
                };
            });
        }, 5000); // Change state every 5 seconds

        return () => clearInterval(interval);
    }, [state.isSimulating]);

    return {
        ...state,
        setStress,
        setFocus,
        toggleSimulation,
    };
};
