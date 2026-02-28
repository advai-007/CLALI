import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type FaceMetrics = {
    ear: number;
    headPitch: number;
    headYaw: number;
    headRoll: number;
};

function euclideanDistance(p1: NormalizedLandmark, p2: NormalizedLandmark) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function computeEAR(landmarks: NormalizedLandmark[], left: number[], right: number[]): number {
    const l1 = euclideanDistance(landmarks[left[1]], landmarks[left[5]]);
    const l2 = euclideanDistance(landmarks[left[2]], landmarks[left[4]]);
    const l3 = euclideanDistance(landmarks[left[0]], landmarks[left[3]]);
    const leftEar = (l1 + l2) / (2.0 * l3);

    const r1 = euclideanDistance(landmarks[right[1]], landmarks[right[5]]);
    const r2 = euclideanDistance(landmarks[right[2]], landmarks[right[4]]);
    const r3 = euclideanDistance(landmarks[right[0]], landmarks[right[3]]);
    const rightEar = (r1 + r2) / (2.0 * r3);

    return (leftEar + rightEar) / 2.0;
}

export function extractFaceMetrics(landmarks: NormalizedLandmark[]): FaceMetrics | null {
    if (!landmarks || landmarks.length === 0) return null;

    // Based on standard Mediapipe Face Mesh indices for eyes
    // (p1, p2, p3, p4, p5, p6) -> outer, top-outer, top-inner, inner, bot-inner, bot-outer
    const leftEyeIdx = [33, 160, 158, 133, 153, 144];
    const rightEyeIdx = [362, 385, 387, 263, 373, 380];

    const ear = computeEAR(landmarks, leftEyeIdx, rightEyeIdx);

    // Approximate head pose from nose relative to face bounds
    const noseIdx = 1;
    const leftCheekIdx = 234;
    const rightCheekIdx = 454;
    const topHeadIdx = 10;
    const bottomChinIdx = 152;

    const nose = landmarks[noseIdx];
    const left = landmarks[leftCheekIdx];
    const right = landmarks[rightCheekIdx];
    const top = landmarks[topHeadIdx];
    const bottom = landmarks[bottomChinIdx];

    // Rough approximation for yaw and pitch
    const faceWidth = right.x - left.x;
    const faceHeight = bottom.y - top.y;

    const yaw = ((nose.x - left.x) / faceWidth) - 0.5; // range: ~ -0.5 to 0.5
    const pitch = ((nose.y - top.y) / faceHeight) - 0.5; // range: ~ -0.5 to 0.5

    // Rough approximation for roll
    const dy = right.y - left.y;
    const dx = right.x - left.x;
    const roll = Math.atan2(dy, dx); // radians

    return {
        ear,
        headPitch: pitch,
        headYaw: yaw,
        headRoll: roll
    };
}
