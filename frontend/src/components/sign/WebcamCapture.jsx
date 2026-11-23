import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera, CameraOff, Play, Pause, Sparkles, Shield, AlertCircle,
  RefreshCw, User, Hand, Activity, Cpu
} from 'lucide-react';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useSignDetector } from '../../hooks/useSignDetector';

/**
 * WebcamCapture — Phase 2 rebuild
 *
 * Now includes:
 *  - MediaPipe real-time hand & pose landmark detection overlay (canvas)
 *  - Signing motion level indicator (pulsing ring)
 *  - Sign-active detection state from useSignDetector
 *  - Auto-trigger inference when a complete gesture is captured
 *  - Graceful degradation if MediaPipe Wasm fails to load
 */
export default function WebcamCapture({
  webcam,
  onSignCaptured,          // callback(landmarkSequence) → triggers recognition
  onManualCapture,         // callback() → user clicked "Recognize Now"
  isRecognizing,
  onStartRecognizing,
  onPauseRecognizing,
  modelStatus = 'mock',    // 'mock' | 'live' | 'offline'
}) {
  const { videoRef, isActive, isLoading, error, startCamera, stopCamera } = webcam;
  const canvasRef    = useRef(null);
  const [guideOn, setGuideOn] = useState(true);

  // ── MediaPipe landmark extraction ─────────────────────────────────────────
  const {
    isLoading: mpLoading,
    isReady: mpReady,
    error: mpError,
    handsDetected,
    getLandmarkVector
  } = useMediaPipe({
    videoRef,
    canvasRef,
    enabled: isActive && isRecognizing
  });

  // ── Signing motion & buffer ───────────────────────────────────────────────
  const {
    isActive: isSigning,
    motionLevel,
    frameCount,
    processFrame,
    reset: resetDetector
  } = useSignDetector({
    getLandmarkVector,
    handsDetected,
    onSignReady: onSignCaptured
  });

  // Drive the detector from an animation frame while recognizing
  const rafRef = useRef(null);
  useEffect(() => {
    if (!isActive || !isRecognizing || !mpReady) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = () => {
      processFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, isRecognizing, mpReady, processFrame]);

  // Reset detector when recognition is paused / camera stopped
  useEffect(() => {
    if (!isRecognizing) resetDetector();
  }, [isRecognizing, resetDetector]);

  // Motion ring color
  const motionColor =
    motionLevel > 0.7 ? 'ring-emerald-400' :
    motionLevel > 0.3 ? 'ring-amber-400'   :
                        'ring-slate-700';

  // ── Status badge content ──────────────────────────────────────────────────
  const ModelBadge = () => {
    const configs = {
      live:    { label: 'CESLR Live Model',     bg: 'bg-emerald-900/80 border-emerald-500/40 text-emerald-200', dot: 'bg-emerald-400' },
      mock:    { label: 'Demo Mock Provider',   bg: 'bg-amber-900/80 border-amber-500/40 text-amber-200',       dot: 'bg-amber-400' },
      offline: { label: 'AI Service Offline',  bg: 'bg-rose-900/80 border-rose-500/40 text-rose-200',          dot: 'bg-rose-400' },
    };
    const cfg = configs[modelStatus] ?? configs.mock;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${cfg.bg}`}>
        <Sparkles className="w-3 h-3" />
        <span>{cfg.label}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">

      {/* ── Video + Canvas Overlay ──────────────────────────────────────── */}
      <div className="relative aspect-4/3 sm:aspect-video bg-slate-950 overflow-hidden">

        {/* Mirrored live video */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${isActive ? '' : 'hidden'}`}
        />

        {/* MediaPipe landmark overlay canvas (same mirror transform) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none ${isActive ? '' : 'hidden'}`}
        />

        {/* Signing guide overlay */}
        {isActive && guideOn && !isSigning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-56 h-72 sm:w-64 sm:h-80 border-2 border-dashed rounded-3xl flex flex-col items-center justify-between p-4 transition-all duration-500 ${
              handsDetected ? 'border-emerald-400/70' : 'border-blue-400/40'
            }`}>
              <div className="w-20 h-20 rounded-full border border-current opacity-30 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-medium tracking-widest uppercase text-blue-200/60 bg-slate-900/80 px-2.5 py-1 rounded-full border border-blue-500/20">
                {handsDetected ? '✋ Hands detected' : 'Position in frame'}
              </span>
            </div>
          </div>
        )}

        {/* Signing-in-progress pulsing ring */}
        {isActive && isSigning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-56 h-72 sm:w-64 sm:h-80 border-4 rounded-3xl transition-all duration-150 ${motionColor} ring-2`}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-300 border border-emerald-500/30">
                Signing… {frameCount} frames
              </div>
            </div>
          </div>
        )}

        {/* Inactive placeholder */}
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-slate-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Webcam is Off</h3>
            <p className="text-xs text-slate-400 mb-5 max-w-xs leading-relaxed">
              EthioSign processes video frames locally in real-time — no footage is ever stored or uploaded.
            </p>
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all focus:ring-2 focus:ring-blue-400 focus:outline-hidden"
            >
              <Camera className="w-4 h-4" />
              Allow Camera Access
            </button>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-300">Initializing camera…</p>
          </div>
        )}

        {/* Camera permission / hardware error */}
        {error && (
          <div className="absolute inset-x-4 bottom-16 p-4 rounded-xl bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-rose-100 mb-0.5">Camera Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* MediaPipe load error (non-fatal) */}
        {mpError && isActive && (
          <div className="absolute inset-x-4 top-14 p-3 rounded-xl bg-amber-950/90 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span><strong>Landmark overlay unavailable</strong> — {mpError}</span>
          </div>
        )}

        {/* Top overlay badges (only when camera is live) */}
        {isActive && (
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/90 text-white backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Private stream
              </div>
              {/* MediaPipe status */}
              {mpReady && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-900/80 text-blue-200 border border-blue-700/60 backdrop-blur-md">
                  <Hand className="w-3 h-3" />
                  MediaPipe ✓
                </div>
              )}
              {mpLoading && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-slate-900/80 text-slate-400 border border-slate-700/60 backdrop-blur-md">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading landmarks…
                </div>
              )}
            </div>
            <ModelBadge />
          </div>
        )}

        {/* Bottom motion bar */}
        {isActive && isRecognizing && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-800">
            <div
              className={`h-full transition-all duration-100 ${
                motionLevel > 0.7 ? 'bg-emerald-500' :
                motionLevel > 0.3 ? 'bg-amber-500'   :
                                    'bg-slate-600'
              }`}
              style={{ width: `${motionLevel * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Controls toolbar ───────────────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">

        {/* Camera toggle */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <CameraOff className="w-4 h-4 text-rose-400" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
          )}

          {isActive && (
            <button
              onClick={() => setGuideOn(!guideOn)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              {guideOn ? 'Hide Guide' : 'Show Guide'}
            </button>
          )}
        </div>

        {/* Recognition controls */}
        {isActive && (
          <div className="flex items-center gap-2">
            {isRecognizing ? (
              <button
                onClick={onPauseRecognizing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
              >
                <Pause className="w-4 h-4" />
                Pause Auto-Detect
              </button>
            ) : (
              <button
                onClick={onStartRecognizing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                <Activity className="w-4 h-4" />
                Start Auto-Detect
              </button>
            )}

            <button
              onClick={onManualCapture}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
              title="Capture current gesture immediately"
            >
              <Sparkles className="w-4 h-4" />
              Recognize Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
