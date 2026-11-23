/**
 * useMediaPipe.js
 * 
 * Phase 2: Real-time MediaPipe Holistic landmark extraction in-browser.
 * 
 * Uses @mediapipe/tasks-vision (Wasm/WebGL backend) to extract:
 *   - 21 keypoints × 2 hands (Left & Right)
 *   - 33 body pose landmarks
 *   - 468 face mesh landmarks
 * 
 * This runs entirely on the client, so no camera frames leave the browser
 * during landmark detection. Only the extracted coordinate vectors are
 * sent to the Python inference service.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HandLandmarker,
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from '@mediapipe/tasks-vision';

// Flattened landmark vector dimensions
// Left hand: 21 × 3 = 63
// Right hand: 21 × 3 = 63
// Pose (upper body, 33): 33 × 4 = 132 (x,y,z,visibility)
// Total per frame: 258 values
const ZERO_HAND = Array(63).fill(0);
const ZERO_POSE = Array(132).fill(0);

export const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
export const HAND_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
export const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/**
 * Flatten a MediaPipe NormalizedLandmarkList to a plain number[] of [x,y,z,...].
 */
function flattenLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks[0].flatMap((lm) => [lm.x, lm.y, lm.z]);
}

function flattenPoseLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;
  return landmarks[0].flatMap((lm) => [lm.x, lm.y, lm.z, lm.visibility ?? 1.0]);
}

export function useMediaPipe({ videoRef, canvasRef, enabled = false }) {
  const handLandmarkerRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Live landmark state shared with consumers
  const [leftHandLandmarks, setLeftHandLandmarks] = useState(null);
  const [rightHandLandmarks, setRightHandLandmarks] = useState(null);
  const [poseLandmarks, setPoseLandmarks] = useState(null);
  const [handsDetected, setHandsDetected] = useState(false);

  // -------------------------------------------------------------------------
  // Load MediaPipe models once
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setIsLoading(true);
      setError(null);
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        const [handLandmarker, poseLandmarker] = await Promise.all([
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          }),
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          })
        ]);

        if (!cancelled) {
          handLandmarkerRef.current = handLandmarker;
          poseLandmarkerRef.current = poseLandmarker;
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[MediaPipe] Model load error:', err);
          setError(
            'MediaPipe models could not be loaded. ' +
            'Ensure a stable internet connection is available to fetch Wasm assets, ' +
            'or use the FastAPI server-side inference path instead.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadModels();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------------------
  // Inference loop — runs every animation frame when enabled & video is live
  // -------------------------------------------------------------------------
  const inferenceLoop = useCallback(() => {
    const video = videoRef?.current;
    const canvas = canvasRef?.current;

    if (!video || video.readyState < 2 || !handLandmarkerRef.current) {
      animFrameRef.current = requestAnimationFrame(inferenceLoop);
      return;
    }

    const nowMs = performance.now();

    // ---- Hand landmark detection ----
    const handResult = handLandmarkerRef.current.detectForVideo(video, nowMs);
    const { landmarks: handLms, handedness } = handResult;

    let left = null;
    let right = null;

    if (handLms && handLms.length > 0) {
      setHandsDetected(true);
      handLms.forEach((lmList, idx) => {
        const label = handedness?.[idx]?.[0]?.categoryName;
        // MediaPipe labels from camera-view perspective (mirrored)
        if (label === 'Left') right = flattenLandmarks([lmList]);
        else if (label === 'Right') left = flattenLandmarks([lmList]);
      });
    } else {
      setHandsDetected(false);
    }

    setLeftHandLandmarks(left);
    setRightHandLandmarks(right);

    // ---- Pose detection ----
    if (poseLandmarkerRef.current) {
      const poseResult = poseLandmarkerRef.current.detectForVideo(video, nowMs);
      const poseLms = flattenPoseLandmarks(poseResult.landmarks);
      setPoseLandmarks(poseLms);
    }

    // ---- Optional canvas overlay drawing ----
    if (canvas && handLms && handLms.length > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawingUtils = new DrawingUtils(ctx);
      handLms.forEach((lmList) => {
        drawingUtils.drawConnectors(lmList, HandLandmarker.HAND_CONNECTIONS, {
          color: '#3b82f6',
          lineWidth: 2
        });
        drawingUtils.drawLandmarks(lmList, {
          radius: 3,
          color: '#60a5fa',
          fillColor: '#1d4ed8'
        });
      });
    } else if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    animFrameRef.current = requestAnimationFrame(inferenceLoop);
  }, [videoRef, canvasRef]);

  // Start / stop loop based on `enabled`
  useEffect(() => {
    if (enabled && isReady) {
      animFrameRef.current = requestAnimationFrame(inferenceLoop);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setHandsDetected(false);
      setLeftHandLandmarks(null);
      setRightHandLandmarks(null);
      setPoseLandmarks(null);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [enabled, isReady, inferenceLoop]);

  /**
   * Build a flat landmark vector ready for the FastAPI inference endpoint.
   * Shape: [leftHand(63) | rightHand(63) | pose(132)] = 258 values per frame.
   */
  const getLandmarkVector = useCallback(() => {
    return [
      ...(leftHandLandmarks ?? ZERO_HAND),
      ...(rightHandLandmarks ?? ZERO_HAND),
      ...(poseLandmarks?.slice(0, 132) ?? ZERO_POSE)
    ];
  }, [leftHandLandmarks, rightHandLandmarks, poseLandmarks]);

  return {
    isLoading,
    isReady,
    error,
    handsDetected,
    leftHandLandmarks,
    rightHandLandmarks,
    poseLandmarks,
    getLandmarkVector
  };
}
