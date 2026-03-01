import { useState, useEffect, useRef, useCallback } from 'react';
import type { FaceMetrics } from '../utils/tracking/FaceFeatureExtractor';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface FaceTrackingState {
    isInitializing: boolean;
    isTracking: boolean;
    error: string | null;
    metrics: FaceMetrics | null;
    landmarks: NormalizedLandmark[] | null;
}

export function useFaceTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [state, setState] = useState<FaceTrackingState>({
        isInitializing: false,
        isTracking: false,
        error: null,
        metrics: null,
        landmarks: null
    });

    const workerRef = useRef<Worker | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRef = useRef<number | null>(null);
    const isWorkerBusy = useRef(false);

    // Initialize the worker
    const initializeTracker = useCallback(async () => {
        setState(s => ({ ...s, isInitializing: true, error: null }));

        try {
            // Check if mediaDevices is supported (required HTTPS unless localhost)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API is not supported in this browser. Please ensure you are using HTTPS or localhost.");
            }

            // Start webcam
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: false
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Safely handle the play promise to prevent React StrictMode remount 
                // race conditions throwing "play() request was interrupted by a new load request"
                try {
                    await videoRef.current.play();
                } catch (playErr: any) {
                    if (playErr.name !== 'AbortError' && playErr.name !== 'NotAllowedError') {
                        console.warn("Video play error:", playErr);
                    }
                }
            }

            // Use a classic (non-module) worker from public/ to completely bypass
            // Vite's module transforms that break MediaPipe's internal import() calls.
            const worker = new Worker('/faceTracking.worker.js');

            worker.onmessage = (e: MessageEvent) => {
                const { type, error, metrics, landmarks } = e.data;

                if (type === 'INIT_SUCCESS') {
                    setState(s => ({ ...s, isInitializing: false, isTracking: true }));
                    startLoop(); // start sending frames
                } else if (type === 'INIT_ERROR') {
                    setState(s => ({ ...s, isInitializing: false, error: 'Worker Init Error: ' + error }));
                } else if (type === 'RESULTS') {
                    setState(s => ({ ...s, metrics: metrics || null, landmarks: landmarks || null }));
                    isWorkerBusy.current = false; // Worker finished processing the frame
                }
            };

            // Tell worker to initialize
            worker.postMessage({ type: 'INIT' });
            workerRef.current = worker;

        } catch (err: any) {
            console.error("Camera access error:", err);
            setState(s => ({ ...s, isInitializing: false, error: 'Camera error: ' + (err.message || String(err)) }));
        }
    }, [videoRef]);

    const stopTracking = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setState(s => ({ ...s, isTracking: false, metrics: null, landmarks: null }));
    }, []);

    const startLoop = () => {
        const tick = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2 || !workerRef.current) {
                frameRef.current = requestAnimationFrame(tick);
                return;
            }

            if (!isWorkerBusy.current) {
                isWorkerBusy.current = true;
                try {
                    const bitmap = await createImageBitmap(videoRef.current);
                    workerRef.current.postMessage({
                        type: 'PROCESS_FRAME',
                        data: {
                            frame: bitmap,
                            timestamp: performance.now()
                        }
                    }, [bitmap]); // Transferable object
                } catch (e) {
                    // Bitmap creation failed (e.g. video not ready)
                    isWorkerBusy.current = false;
                }
            }

            frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        ...state,
        initializeTracker,
        stopTracking
    };
}
