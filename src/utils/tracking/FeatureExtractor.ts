import type { RawSensorData } from './SensorBridge';

export type ExtractedFeatures = {
    franticTaps: number;
    scrollYoYoCount: number;
    motionMagnitude: number;
    isIdle: boolean;
    isVisible: boolean;
    touchHoldDuration: number;
};

export type FeatureCallback = (features: ExtractedFeatures) => void;

class FeatureExtractor {
    private listeners: FeatureCallback[] = [];

    // State for tracking
    private tapHistory: { x: number, y: number, time: number }[] = [];
    private scrollHistory: { y: number, time: number }[] = [];
    private currentMotion: number = 0;
    private isIdleState: boolean = false;
    private isVisibleState: boolean = true;
    private touchMap = new Map<number, { startTime: number, x: number, y: number }>();
    private maxTouchHold: number = 0;

    // Tuning parameters
    private TAP_TIME_WINDOW = 3000; // 3 seconds
    private TAP_DISTANCE_THRESHOLD = 50; // pixels
    private FRANTIC_TAP_THRESHOLD = 4; // 4+ taps in same area in 3s

    private SCROLL_TIME_WINDOW = 5000; // 5s for yo-yo detection

    private emitInterval: number | null = null;

    subscribe(callback: FeatureCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    public processRawData = (event: RawSensorData) => {
        const now = Date.now();

        // Process based on type
        switch (event.type) {
            case 'touch':
                this.processTouch(event.data, now);
                this.isIdleState = false;
                break;
            case 'scroll':
                this.processScroll(event.data.scrollY, now);
                this.isIdleState = false;
                break;
            case 'motion':
                this.processMotion(event.data);
                break;
            case 'visibility':
                this.isVisibleState = event.data.isVisible;
                break;
            case 'idle':
                this.isIdleState = true;
                break;
        }
    };

    private processTouch(data: any, time: number) {
        if (data.action === 'start') {
            this.touchMap.set(data.id, { startTime: time, x: data.x, y: data.y });

            // Add to tap history for frantic checking
            this.tapHistory.push({ x: data.x, y: data.y, time });
            // Cleanup old taps
            this.tapHistory = this.tapHistory.filter(t => time - t.time <= this.TAP_TIME_WINDOW);
        } else if (data.action === 'end') {
            const touch = this.touchMap.get(data.id);
            if (touch) {
                const duration = time - touch.startTime;
                if (duration > this.maxTouchHold) {
                    this.maxTouchHold = duration;
                }
            }
            this.touchMap.delete(data.id);
        }
    }

    private processScroll(y: number, time: number) {
        this.scrollHistory.push({ y, time });
        this.scrollHistory = this.scrollHistory.filter(s => time - s.time <= this.SCROLL_TIME_WINDOW);
    }

    private processMotion(data: { x: number, y: number, z: number }) {
        // Simple magnitude of motion vector (minus 9.8 for gravity is handled by relying on changes or device orientation generally, 
        // but here we just approximate magnitude)
        const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        // smoothing
        this.currentMotion = (this.currentMotion * 0.8) + (magnitude * 0.2);
    }

    private computeFranticTaps(): number {
        // Group taps by location
        let maxCluster = 0;
        for (let i = 0; i < this.tapHistory.length; i++) {
            let clusterCount = 1;
            for (let j = i + 1; j < this.tapHistory.length; j++) {
                const dx = this.tapHistory[i].x - this.tapHistory[j].x;
                const dy = this.tapHistory[i].y - this.tapHistory[j].y;
                if (Math.sqrt(dx * dx + dy * dy) < this.TAP_DISTANCE_THRESHOLD) {
                    clusterCount++;
                }
            }
            if (clusterCount > maxCluster) maxCluster = clusterCount;
        }
        return maxCluster >= this.FRANTIC_TAP_THRESHOLD ? maxCluster : 0;
    }

    private computeScrollYoYo(): number {
        if (this.scrollHistory.length < 3) return 0;

        let directionChanges = 0;
        let lastDirection = 0; // 1 up, -1 down

        for (let i = 1; i < this.scrollHistory.length; i++) {
            const delta = this.scrollHistory[i].y - this.scrollHistory[i - 1].y;
            if (Math.abs(delta) < 10) continue; // Noise filter

            const currentDirection = delta > 0 ? 1 : -1;
            if (lastDirection !== 0 && currentDirection !== lastDirection) {
                directionChanges++;
            }
            lastDirection = currentDirection;
        }

        return directionChanges;
    }

    public start() {
        if (this.emitInterval) return;

        // Emit features every 500ms
        this.emitInterval = window.setInterval(() => {

            // Check current holds
            const now = Date.now();
            let currentHold = 0;
            this.touchMap.forEach(v => {
                const duration = now - v.startTime;
                if (duration > currentHold) currentHold = duration;
            });
            const recordedMaxHold = Math.max(currentHold, this.maxTouchHold);
            this.maxTouchHold = 0; // reset max for next frame

            const features: ExtractedFeatures = {
                franticTaps: this.computeFranticTaps(),
                scrollYoYoCount: this.computeScrollYoYo(),
                motionMagnitude: this.currentMotion,
                isIdle: this.isIdleState,
                isVisible: this.isVisibleState,
                touchHoldDuration: recordedMaxHold
            };

            this.listeners.forEach(cb => cb(features));

        }, 500); // UI update rate
    }

    public stop() {
        if (this.emitInterval) {
            clearInterval(this.emitInterval);
            this.emitInterval = null;
        }
    }
}

export const featureExtractor = new FeatureExtractor();
