/**
 * useSignDetector.js
 *
 * Phase 2: Signing motion detector & frame buffer accumulator.
 *
 * Tracks hand landmark motion over a rolling window to decide:
 *   1. Whether the signer is actively signing (motion above threshold).
 *   2. When to trigger inference (sustained motion → brief pause = sign complete).
 *
 * This prevents bombarding the AI service with every idle frame and ensures
 * we send meaningful gesture sequences.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Configuration
const MOTION_WINDOW_MS   = 1500;   // Rolling window for motion accumulation
const MOTION_THRESHOLD   = 0.012;  // Euclidean shift (normalized coords) to count as motion
const MIN_SIGN_FRAMES    = 15;     // Minimum frames with hands to trigger inference
const IDLE_PAUSE_MS      = 800;    // ms of stillness after motion = sign complete

/**
 * Compute mean squared displacement between consecutive landmark vectors.
 */
function computeMotion(prev, curr) {
  if (!prev || !curr || prev.length !== curr.length) return 0;
  let sum = 0;
  const n = prev.length;
  for (let i = 0; i < n; i++) {
    const d = curr[i] - prev[i];
    sum += d * d;
  }
  return Math.sqrt(sum / n);
}

export function useSignDetector({
  getLandmarkVector,
  handsDetected,
  onSignReady   // callback(landmarkSequence: number[][]) when a complete sign gesture is captured
}) {
  const [isActive, setIsActive]         = useState(false);  // Currently collecting a sign
  const [motionLevel, setMotionLevel]   = useState(0);      // 0–1 normalized motion indicator
  const [frameCount, setFrameCount]     = useState(0);

  const frameBufferRef   = useRef([]);   // Accumulates landmark vectors for current sign
  const prevVectorRef    = useRef(null);
  const idleTimerRef     = useRef(null);
  const motionHistoryRef = useRef([]);   // Array of { ts, motion } objects

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const flushBuffer = useCallback(() => {
    const frames = frameBufferRef.current;
    if (frames.length >= MIN_SIGN_FRAMES && onSignReady) {
      onSignReady([...frames]);
    }
    frameBufferRef.current = [];
    prevVectorRef.current  = null;
    setIsActive(false);
    setFrameCount(0);
    setMotionLevel(0);
    motionHistoryRef.current = [];
  }, [onSignReady]);

  /**
   * Called by the parent component each frame while landmarks are being extracted.
   */
  const processFrame = useCallback(() => {
    const vec = getLandmarkVector();
    const now = Date.now();

    // Prune old motion history
    motionHistoryRef.current = motionHistoryRef.current.filter(
      (e) => now - e.ts < MOTION_WINDOW_MS
    );

    // Compute motion from previous frame
    const motion = computeMotion(prevVectorRef.current, vec);
    prevVectorRef.current = vec;

    motionHistoryRef.current.push({ ts: now, motion });

    // Rolling average motion level
    const avgMotion =
      motionHistoryRef.current.reduce((s, e) => s + e.motion, 0) /
      Math.max(1, motionHistoryRef.current.length);

    setMotionLevel(Math.min(1, avgMotion / MOTION_THRESHOLD));

    if (handsDetected && motion >= MOTION_THRESHOLD) {
      // Signing motion detected
      clearIdleTimer();
      frameBufferRef.current.push(vec);
      setIsActive(true);
      setFrameCount(frameBufferRef.current.length);

      // Set idle timer — if signer pauses, flush the buffer
      idleTimerRef.current = setTimeout(flushBuffer, IDLE_PAUSE_MS);
    }
  }, [getLandmarkVector, handsDetected, flushBuffer]);

  // Cleanup on unmount
  useEffect(() => () => clearIdleTimer(), []);

  const reset = useCallback(() => {
    clearIdleTimer();
    frameBufferRef.current   = [];
    prevVectorRef.current    = null;
    motionHistoryRef.current = [];
    setIsActive(false);
    setFrameCount(0);
    setMotionLevel(0);
  }, []);

  return { isActive, motionLevel, frameCount, processFrame, reset };
}
