export type RawSensorData = {
    type: 'touch' | 'scroll' | 'motion' | 'visibility' | 'idle' | 'orientation' | 'grip';
    timestamp: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
};

export type SensorCallback = (data: RawSensorData) => void;

class SensorBridge {
    private listeners: SensorCallback[] = [];
    private lastInputTimestamp: number = Date.now();
    private idleCheckInterval: number | null = null;
    private isListening = false;

    // Track active touches for grip detection
    private activeTouches = new Set<number>();

    private boundHandleTouchStart = this.handleTouchStart.bind(this);
    private boundHandleTouchMove = this.handleTouchMove.bind(this);
    private boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    private boundHandleMouseDown = this.handleMouseDown.bind(this);
    private boundHandleMouseMove = this.handleMouseMove.bind(this);
    private boundHandleMouseUp = this.handleMouseUp.bind(this);
    private boundHandleScroll = this.handleScroll.bind(this);
    private boundHandleDeviceMotion = this.handleDeviceMotion.bind(this);
    private boundHandleDeviceOrientation = this.handleDeviceOrientation.bind(this);
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

    public async requestPermissions(): Promise<boolean> {
        let granted = true;
        // iOS 13+ requires explicit permission for device sensors
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const DevOrientEvent = DeviceOrientationEvent as any;
            if (typeof DevOrientEvent.requestPermission === 'function') {
                const result = await DevOrientEvent.requestPermission();
                if (result !== 'granted') granted = false;
            }
        } catch {
            // Not iOS or permission API not available — that's OK
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const DevMotionEvent = DeviceMotionEvent as any;
            if (typeof DevMotionEvent.requestPermission === 'function') {
                const result = await DevMotionEvent.requestPermission();
                if (result !== 'granted') granted = false;
            }
        } catch {
            // Not iOS or permission API not available — that's OK
        }
        return granted;
    }

    public async start() {
        if (this.isListening) return;
        this.isListening = true;
        this.lastInputTimestamp = Date.now();

        // Request device sensor permissions (iOS 13+)
        await this.requestPermissions();

        window.addEventListener('touchstart', this.boundHandleTouchStart, { passive: true });
        window.addEventListener('touchmove', this.boundHandleTouchMove, { passive: true });
        window.addEventListener('touchend', this.boundHandleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: true });

        // Mouse fallbacks for desktop testing
        window.addEventListener('mousedown', this.boundHandleMouseDown, { passive: true });
        window.addEventListener('mousemove', this.boundHandleMouseMove, { passive: true });
        window.addEventListener('mouseup', this.boundHandleMouseUp, { passive: true });

        window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
        window.addEventListener('devicemotion', this.boundHandleDeviceMotion, { passive: true });
        window.addEventListener('deviceorientation', this.boundHandleDeviceOrientation, { passive: true });
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
        window.removeEventListener('touchcancel', this.boundHandleTouchEnd);

        window.removeEventListener('mousedown', this.boundHandleMouseDown);
        window.removeEventListener('mousemove', this.boundHandleMouseMove);
        window.removeEventListener('mouseup', this.boundHandleMouseUp);

        window.removeEventListener('scroll', this.boundHandleScroll);
        window.removeEventListener('devicemotion', this.boundHandleDeviceMotion);
        window.removeEventListener('deviceorientation', this.boundHandleDeviceOrientation);
        document.removeEventListener('visibilitychange', this.boundHandleVisibility);

        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }
        this.activeTouches.clear();
    }

    private updateActivity() {
        this.lastInputTimestamp = Date.now();
    }

    // --- Handlers ---

    private handleTouchStart(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.activeTouches.add(touch.identifier);
            this.dispatch({
                type: 'touch',
                data: {
                    action: 'start',
                    id: touch.identifier,
                    x: touch.clientX,
                    y: touch.clientY,
                    force: touch.force // 0-1 on supported devices, 0 otherwise
                }
            });
        }
        // Dispatch grip event when multiple simultaneous touches detected
        if (this.activeTouches.size >= 3) {
            this.dispatch({
                type: 'grip',
                data: { touchCount: this.activeTouches.size }
            });
        }
    }

    private handleTouchMove(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.dispatch({
                type: 'touch',
                data: {
                    action: 'move',
                    id: touch.identifier,
                    x: touch.clientX,
                    y: touch.clientY,
                    force: touch.force
                }
            });
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        this.updateActivity();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.activeTouches.delete(touch.identifier);
            this.dispatch({
                type: 'touch',
                data: {
                    action: 'end',
                    id: touch.identifier,
                    x: touch.clientX,
                    y: touch.clientY,
                    force: 0
                }
            });
        }
    }

    // --- Mouse Fallbacks ---

    private isMouseDown = false;

    private handleMouseDown(e: MouseEvent) {
        this.updateActivity();
        this.isMouseDown = true;
        this.dispatch({
            type: 'touch',
            data: {
                action: 'start',
                id: 999, // Fake touch ID for mouse
                x: e.clientX,
                y: e.clientY,
                force: 0.5 // Default fake pressure
            }
        });
    }

    private handleMouseMove(e: MouseEvent) {
        this.updateActivity();
        if (this.isMouseDown) {
            this.dispatch({
                type: 'touch',
                data: {
                    action: 'move',
                    id: 999,
                    x: e.clientX,
                    y: e.clientY,
                    force: 0.5
                }
            });
        }
    }

    private handleMouseUp(e: MouseEvent) {
        this.updateActivity();
        this.isMouseDown = false;
        this.dispatch({
            type: 'touch',
            data: {
                action: 'end',
                id: 999,
                x: e.clientX,
                y: e.clientY,
                force: 0
            }
        });
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

    private handleDeviceOrientation(e: DeviceOrientationEvent) {
        // alpha: compass direction (0-360), beta: front-back tilt (-180 to 180),
        // gamma: left-right tilt (-90 to 90)
        if (e.alpha !== null || e.beta !== null || e.gamma !== null) {
            this.dispatch({
                type: 'orientation',
                data: {
                    alpha: e.alpha ?? 0,
                    beta: e.beta ?? 0,
                    gamma: e.gamma ?? 0
                }
            });
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
