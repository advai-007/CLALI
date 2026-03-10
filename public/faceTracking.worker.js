 
// ─── Classic Worker (non-module) for MediaPipe Face Tracking ─────────────────
// This worker intentionally lives in public/ so Vite does NOT transform it.
// Vite's dev server rewrites dynamic import() to self.import() in module workers,
// which breaks MediaPipe. By keeping this in public/ as a classic worker,
// we completely bypass Vite's module pipeline.

// Provide the CommonJS shim that vision_bundle.cjs expects
var exports = {};
var module = { exports: exports };

// Load the CJS bundle - this populates the `exports` object
importScripts('/wasm/vision_bundle.js');

// Now destructure what we need from the populated exports
var FaceLandmarker = exports.FaceLandmarker;
var FilesetResolver = exports.FilesetResolver;

var faceLandmarker = null;
var initialized = false;

// ─── Math Helpers ────────────────────────────────────────────────────────────

function euclidean(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

function computeEAR(landmarks) {
    var l = [33, 160, 158, 133, 153, 144];
    var r = [362, 385, 387, 263, 373, 380];

    function ear(idx) {
        var v1 = euclidean(landmarks[idx[1]], landmarks[idx[5]]);
        var v2 = euclidean(landmarks[idx[2]], landmarks[idx[4]]);
        var h = euclidean(landmarks[idx[0]], landmarks[idx[3]]);
        return (v1 + v2) / (2.0 * h);
    }

    return (ear(l) + ear(r)) / 2.0;
}

function computeHeadPose(landmarks) {
    var nose = landmarks[1];
    var left = landmarks[234];
    var right = landmarks[454];
    var top = landmarks[10];
    var bottom = landmarks[152];

    var fw = right.x - left.x;
    var fh = bottom.y - top.y;

    return {
        headYaw: ((nose.x - left.x) / fw) - 0.5,
        headPitch: ((nose.y - top.y) / fh) - 0.5,
        headRoll: Math.atan2(right.y - left.y, right.x - left.x)
    };
}

// ─── Worker Logic ────────────────────────────────────────────────────────────

async function init() {
    try {
        // Load WASM from our local public/wasm/ folder (offline-compatible for PWA)
        var fileset = await FilesetResolver.forVisionTasks('/wasm');

        faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: '/models/face_landmarker.task',
                delegate: 'GPU'
            },
            outputFaceBlendshapes: false,
            runningMode: 'VIDEO',
            numFaces: 1
        });

        initialized = true;
        self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err) {
        self.postMessage({ type: 'INIT_ERROR', error: String(err) });
    }
}

self.onmessage = async function (e) {
    var type = e.data.type;
    var data = e.data.data;

    if (type === 'INIT') {
        await init();
        return;
    }

    if (type === 'PROCESS_FRAME') {
        if (!initialized || !faceLandmarker) return;

        var frame = data.frame;
        var timestamp = data.timestamp;

        try {
            var results = faceLandmarker.detectForVideo(frame, timestamp);

            // Critical: close the ImageBitmap to free GPU memory
            if (frame && typeof frame.close === 'function') {
                frame.close();
            }

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                var lm = results.faceLandmarks[0];
                var ear = computeEAR(lm);
                var pose = computeHeadPose(lm);

                self.postMessage({
                    type: 'RESULTS',
                    metrics: { ear: ear, headYaw: pose.headYaw, headPitch: pose.headPitch, headRoll: pose.headRoll },
                    landmarks: lm
                });
            } else {
                self.postMessage({ type: 'RESULTS', metrics: null, landmarks: null });
            }
        } catch (err) {
            console.error('[FaceWorker] Prediction error:', err);
            if (frame && typeof frame.close === 'function') frame.close();
            self.postMessage({ type: 'RESULTS', metrics: null, landmarks: null });
        }
    }
};
