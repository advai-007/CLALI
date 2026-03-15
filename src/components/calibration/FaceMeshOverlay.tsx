import { useEffect, useRef } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// MediaPipe Face Mesh connectivity — key contour connections
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];
const LEFT_EYEBROW = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107, 46];
const RIGHT_EYEBROW = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336, 276];
const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 164, 0];

interface FaceMeshOverlayProps {
    landmarks: NormalizedLandmark[] | null;
    videoWidth: number;
    videoHeight: number;
}

export function FaceMeshOverlay({ landmarks, videoWidth, videoHeight }: FaceMeshOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas resolution to video
        canvas.width = videoWidth || 640;
        canvas.height = videoHeight || 480;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks || landmarks.length === 0) return;

        const w = canvas.width;
        const h = canvas.height;

        // Draw landmark dots
        ctx.fillStyle = 'rgba(0, 255, 180, 0.4)';
        for (const lm of landmarks) {
            ctx.beginPath();
            ctx.arc(lm.x * w, lm.y * h, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw contour lines
        const drawContour = (indices: number[], color: string, lineWidth: number = 1.5) => {
            if (indices.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(landmarks[indices[0]].x * w, landmarks[indices[0]].y * h);
            for (let i = 1; i < indices.length; i++) {
                ctx.lineTo(landmarks[indices[i]].x * w, landmarks[indices[i]].y * h);
            }
            ctx.stroke();
        };

        drawContour(FACE_OVAL, 'rgba(0, 255, 180, 0.6)', 2);
        drawContour(LEFT_EYE, 'rgba(0, 200, 255, 0.8)', 1.5);
        drawContour(RIGHT_EYE, 'rgba(0, 200, 255, 0.8)', 1.5);
        drawContour(LIPS_OUTER, 'rgba(255, 100, 150, 0.7)', 1.5);
        drawContour(LEFT_EYEBROW, 'rgba(180, 140, 255, 0.6)', 1.5);
        drawContour(RIGHT_EYEBROW, 'rgba(180, 140, 255, 0.6)', 1.5);
        drawContour(NOSE_BRIDGE, 'rgba(255, 220, 100, 0.5)', 1);

    }, [landmarks, videoWidth, videoHeight]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
        />
    );
}
