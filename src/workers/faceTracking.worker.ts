import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let initialized = false;

// Math Helpers
function dist(a: any, b: any) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function computeEAR(lm: any[]): number {
    const eye = (i: number[]) =>
        (dist(lm[i[1]], lm[i[5]]) + dist(lm[i[2]], lm[i[4]])) / (2 * dist(lm[i[0]], lm[i[3]]));
    return (eye([33, 160, 158, 133, 153, 144]) + eye([362, 385, 387, 263, 373, 380])) / 2;
}

function computeHeadPose(lm: any[]) {
    const nose = lm[1], left = lm[234], right = lm[454], top = lm[10], bottom = lm[152];
    const fw = right.x - left.x;
    const fh = bottom.y - top.y;
    return {
        headYaw: ((nose.x - left.x) / fw) - 0.5,
        headPitch: ((nose.y - top.y) / fh) - 0.5,
        headRoll: Math.atan2(right.y - left.y, right.x - left.x)
    };
}

// MediaPipe Initialization
async function init() {
    try {
        // Since @mediapipe/tasks-vision/wasm isn't properly exported in their package.json,
        // Vite fails to bundle it using new URL. Using JSDelivr CDN URL is strictly necessary
        // to bypass the internal bundler lookup and directly stream the WebAssembly binaries.
        const fileset = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: `${self.location.origin}/models/face_landmarker.task`,
                delegate: 'GPU'
            },
            outputFaceBlendshapes: false,
            runningMode: 'VIDEO',
            numFaces: 1
        });

        initialized = true;
        self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err: any) {
        self.postMessage({ type: 'INIT_ERROR', error: String(err) });
    }
}

self.onmessage = async (e: MessageEvent) => {
    const { type, data } = e.data;

    if (type === 'INIT') {
        await init();
        return;
    }

    if (type === 'PROCESS_FRAME') {
        if (!initialized || !faceLandmarker) return;

        const { frame, timestamp } = data;
        try {
            const results = faceLandmarker.detectForVideo(frame, timestamp);

            // Clean up memory
            if (frame && typeof frame.close === 'function') frame.close();

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const lm = results.faceLandmarks[0];
                const ear = computeEAR(lm);
                const pose = computeHeadPose(lm);

                self.postMessage({
                    type: 'RESULTS',
                    metrics: { ear, ...pose },
                    landmarks: lm
                });
            } else {
                self.postMessage({ type: 'RESULTS', metrics: null, landmarks: null });
            }
        } catch (err) {
            console.error('[FaceWorker] Prediction error:', err);
            if (frame && typeof frame.close === 'function') frame.close();
            // Free the worker to try the next frame even on error
            self.postMessage({ type: 'RESULTS', metrics: null, landmarks: null });
        }
    }
};
