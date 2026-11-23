/**
 * SignToTextPage.jsx  —  Direction A: EthSL Sign → Text/Speech
 *
 * Phase 2 update:
 *  - Uses Phase 2 WebcamCapture props:  onSignCaptured + onManualCapture
 *    (removed old onPerformRecognition prop which no longer exists)
 *  - Passes modelStatus derived from recognitionService.isLive
 *  - Passes isProcessing to TranslationCard for loading state
 *  - Auto-detect: onSignCaptured fires from useSignDetector when motion ends
 *  - Manual: "Recognize Now" triggers onManualCapture
 */

import React, { useState, useCallback } from 'react';
import {
  Video, ShieldCheck, HelpCircle, AlertCircle, Cpu
} from 'lucide-react';
import WebcamCapture from '../components/sign/WebcamCapture';
import TranslationCard from '../components/sign/TranslationCard';
import { useWebcam } from '../hooks/useWebcam';
import { recognitionService } from '../services/recognitionService';
import { useSettings } from '../context/SettingsContext';
import { ETHSL_VOCABULARY } from '../data/ethslVocabulary';

export default function SignToTextPage() {
  const [isRecognizing, setIsRecognizing]  = useState(false);
  const [currentPrediction, setPrediction] = useState(null);
  const [isProcessing, setIsProcessing]    = useState(false);
  const [serviceAlert, setServiceAlert]    = useState(null);

  // Dev/demo gloss picker (only shown in mock mode)
  const [selectedGlossIndex, setSelectedGlossIndex] = useState('');

  const { selectedCamera, addHistoryItem } = useSettings();
  const webcam = useWebcam(selectedCamera);

  // ── Core recognition handler ──────────────────────────────────────────────
  const doRecognize = useCallback(async (landmarkSequence = null) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setServiceAlert(null);

    try {
      const idx   = selectedGlossIndex !== '' ? parseInt(selectedGlossIndex, 10) : null;
      const frame = webcam.captureFrame();

      const result = await recognitionService.predictSign({
        frameDataUrl:     frame,
        landmarkSequence: landmarkSequence,
        mockGlossIndex:   idx
      });

      if (result.status === 'service_unavailable') {
        setServiceAlert('AI inference service is offline — using demonstration mock provider.');
      }

      if (result.success && result.prediction) {
        setPrediction(result.prediction);
        addHistoryItem({
          sender:     'deaf',
          amharic:    result.prediction.amharic,
          english:    result.prediction.english,
          confidence: result.prediction.confidence,
          isMock:     result.isMock,
          type:       'sign'
        });
      } else {
        setPrediction({ status: 'unrecognized' });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, selectedGlossIndex, webcam, addHistoryItem]);

  // Auto-detect: fired by useSignDetector via WebcamCapture when a gesture completes
  const handleSignCaptured = useCallback((landmarkSequence) => {
    doRecognize(landmarkSequence);
  }, [doRecognize]);

  // Manual: user pressed "Recognize Now"
  const handleManualCapture = useCallback(() => {
    doRecognize(null);
  }, [doRecognize]);

  // Model status pill
  const modelStatus = recognitionService.isLive ? 'live' : 'mock';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Direction A
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Sign-to-Text Recognition
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Perform Ethiopian Sign Language signs in front of your camera to generate
            Amharic and English translations with optional speech synthesis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-medium text-blue-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Local Video Privacy Guard</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            modelStatus === 'live'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            {modelStatus === 'live' ? 'CESLR Live Model' : 'Demo Mode'}
          </span>
        </div>
      </div>

      {/* ── Service alert ─────────────────────────────────────────────────── */}
      {serviceAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{serviceAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Main Camera + Translation Column ──────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Phase 2 WebcamCapture — MediaPipe overlay, motion detection, auto-detect */}
          <WebcamCapture
            webcam={webcam}
            isRecognizing={isRecognizing}
            onStartRecognizing={() => setIsRecognizing(true)}
            onPauseRecognizing={() => setIsRecognizing(false)}
            onSignCaptured={handleSignCaptured}
            onManualCapture={handleManualCapture}
            modelStatus={modelStatus}
          />

          {/* Demo gloss selector — visible in mock mode only */}
          {modelStatus !== 'live' && (
            <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="font-semibold text-slate-700 block">
                  🧪 Demo: Test Sign Vocabulary
                </span>
                <span className="text-[11px] text-slate-500">
                  Pick any of the 62 documented EthSL glosses to simulate recognition
                </span>
              </div>
              <select
                value={selectedGlossIndex}
                onChange={(e) => setSelectedGlossIndex(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
              >
                <option value="">Random from 62 EthSL Glosses</option>
                {ETHSL_VOCABULARY.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {s.gloss} — {s.english}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Translation Result Card — with isProcessing loading state */}
          <TranslationCard
            prediction={currentPrediction}
            isProcessing={isProcessing}
            onClear={() => setPrediction(null)}
            onRetry={handleManualCapture}
          />
        </div>

        {/* ── Instructions Sidebar ──────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Camera Setup Guidelines</span>
            </h3>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              {[
                ['1', 'Positioning', 'Position yourself so your head, shoulders, and chest are clearly visible within the guide frame.'],
                ['2', 'Lighting', 'Ensure even lighting on your hands and face. Avoid backlighting or dark backgrounds.'],
                ['3', 'Signing Speed', 'Perform signs clearly with natural pauses between gestures. The detector waits 800 ms of stillness before processing.'],
                ['4', 'EthSL Scope', 'The current model supports the 62 core continuous vocabulary words from the CESLR corpus — EthSL only, not ASL.'],
              ].map(([num, title, body]) => (
                <li key={num} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    {num}
                  </span>
                  <span>
                    <strong>{title}:</strong> {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* MediaPipe status note */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-500" />
              AI Recognition Pipeline
            </h4>
            <ol className="space-y-2 text-[11px] text-slate-500 leading-relaxed list-none">
              {[
                'MediaPipe extracts 258-dim hand + pose landmarks per frame',
                'useSignDetector accumulates frames during active signing',
                'On gesture end, landmark sequence is sent to RecognitionService',
                'FastAPI CESLR model (live) or mock provider returns prediction',
                'Translation card displays Amharic + English + confidence',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* EthSL authenticity notice */}
          <div className="bg-gradient-to-tr from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              Linguistic Authenticity
            </span>
            <h4 className="text-base font-bold">Ethiopian Sign Language (EthSL)</h4>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              EthioSign specifically recognizes Ethiopian Sign Language — a distinct language
              from ASL and other sign languages, respecting the linguistic grammar and Deaf
              culture of Ethiopia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
