export type RawSensorData = {
    type: 'touch' | 'scroll' | 'motion' | 'visibility' | 'idle';
    timestamp: number;
    data: any;
};

export type SensorCallback = (data: RawSensorData) => void;

class SensorBridge {
    private listeners: SensorCallback[] = [];
    private lastInputTimestamp: number = Date.now();
    private idleCheckInterval: number | null = null;
    private isListening = false;

    private boundHandleTouchStart = this.handleTouchStart.bind(this);
    private boundHandleTouchMove = this.handleTouchMove.bind(this);
    private boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    private boundHandleScroll = this.handleScroll.bind(this);
    private boundHandleDeviceMotion = this.handleDeviceMotion.bind(this);
    private boundHandleVisibility = this.handleVisibility.bind(this);

    subscribe(callback: SensorCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private dispatch(data: Omit<RawSensorData, 'timestamp'>) {
        const event = { ...data, timestamp: Date.now() };
        this.listeners.forEach(cb => cb(event));
    }

    public start() {
        if (this.isListening) return;
        this.isListening = true;
        this.lastInputTimestamp = Date.now();

        window.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
        window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
        window.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true });
        window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
        window.addEventListener('devicemotion', this.boundHandleDeviceMotion, { passive: true });
        document.addEventListener('visibilitychange', this.boundHandleVisibility);

        // Check for idle time every second
        this.idleCheckInterval = window.setInterval(() => {
            const idleTime = Date.now() - this.lastInputTimestamp;
            if (idleTime > 5000) { // Report idle after 5 seconds
                this.dispatch({ type: 'idle', data: { idleTimeMs: idleTime } });
            }
        }, 1000);
    }

    public stop() {
        if (!this.isListening) return;
        this.isListening = false;

        window.removeEventListener('touchstart', this.boundHandleTouchStart);
        window.removeEventListener('touchmove', this.boundHandleTouchMove);
        window.removeEventListener('touchend', this.boundHandleTouchEnd);
        window.removeEventListener('scroll', this.boundHandleScroll);
        window.removeEventListener('devicemotion', this.boundHandleDeviceMotion);
        document.removeEventListener('visibilitychange', this.boundHandleVisibility);

        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }
    }

    private updateActivity() {
        this.lastInputTimestamp = Date.now();
    }

    // --- Handlers ---

    private handleTouchStart(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.dispatch({
                type: 'touch',
                data: { action: 'start', id: touch.identifier, x: touch.clientX, y: touch.clientY }
            });
        }
    }

    private handleTouchMove(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.dispatch({
                type: 'touch',
                data: { action: 'move', id: touch.identifier, x: touch.clientX, y: touch.clientY }
            });
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.dispatch({
                type: 'touch',
                data: { action: 'end', id: touch.identifier, x: touch.clientX, y: touch.clientY }
            });
        }
    }

    private handleScroll() {
        this.updateActivity();
        this.dispatch({
            type: 'scroll',
            data: { scrollY: window.scrollY }
        });
    }

    private handleDeviceMotion(e: DeviceMotionEvent) {
        // Only dispatch meaningful motion, skip if barely moving
        if (e.accelerationIncludingGravity) {
            const { x, y, z } = e.accelerationIncludingGravity;
            if (x !== null && y !== null && z !== null) {
                // Send raw, FeatureExtractor will compute magnitude/fidgeting
                this.dispatch({
                    type: 'motion',
                    data: { x, y, z }
                });
            }
        }
    }

    private handleVisibility() {
        this.updateActivity();
        this.dispatch({
            type: 'visibility',
            data: { isVisible: document.visibilityState === 'visible', state: document.visibilityState }
        });
    }
}

export const sensorBridge = new SensorBridge();
