/**
 * TranslationCard.jsx  —  Phase 5 update
 *
 * Changes:
 *  - isProcessing loading spinner state
 *  - DEMO badge on mock predictions
 *  - Feedback buttons: 👍 Correct / 👎 Incorrect — calls dictionaryService.submitFeedback()
 *  - Feedback confirmation state so button doesn't fire twice
 */

import React, { useState } from 'react';
import {
  Volume2, Copy, Check, Trash2, AlertTriangle,
  Sparkles, RefreshCcw, Loader2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { dictionaryService } from '../../services/dictionaryService';

export default function TranslationCard({
  prediction,
  isProcessing = false,
  onClear,
  onRetry,
  status = 'ready'
}) {
  const { speak, isSpeaking } = useSpeechSynthesis();
  const [copied, setCopied]         = useState(false);
  const [feedback, setFeedback]     = useState(null); // 'correct' | 'incorrect' | 'sent'

  const handleCopy = () => {
    if (!prediction) return;
    navigator.clipboard.writeText(`${prediction.amharic} (${prediction.english})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!prediction) return;
    speak(prediction.amharic || prediction.english);
  };

  const handleFeedback = async (type) => {
    if (!prediction || feedback === 'sent') return;
    setFeedback('sent');
    await dictionaryService.submitFeedback({
      predictedGloss: prediction.amharic,
      confidence:     prediction.confidence,
      isMock:         prediction.model?.includes('[DEMO]') || prediction.model?.includes('Mock'),
      feedbackType:   type,
      provider:       prediction.model?.includes('[DEMO]') ? 'mock' : 'fastapi'
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="bg-white rounded-2xl border border-blue-200 p-8 shadow-xs flex flex-col items-center justify-center gap-4 min-h-[160px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Analyzing Sign…</p>
          <p className="text-xs text-slate-400 mt-1">Running landmark sequence through the CESLR recognition model</p>
        </div>
      </div>
    );
  }

  // ── Unrecognized ─────────────────────────────────────────────────────────
  if (status === 'unrecognized' || (prediction && prediction.status === 'unrecognized')) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-900 mb-1">Sign not recognized. Please try again.</h3>
            <p className="text-xs text-amber-700 leading-relaxed mb-4">
              The camera could not clearly isolate the hand gestures, or the sign is outside the current
              62-gloss EthSL vocabulary. Ensure good lighting and keep your hands within the framing guide.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors">
                <RefreshCcw className="w-4 h-4" />
                Retry Sign Recognition
              </button>
              {onClear && (
                <button onClick={onClear}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!prediction) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs min-h-[160px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 mb-1">Ready to Translate</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Perform an Ethiopian Sign Language gesture in front of the camera and press{' '}
          <strong>"Recognize Now"</strong> or enable <strong>"Start Auto-Detect"</strong>.
        </p>
      </div>
    );
  }

  // ── Recognized ───────────────────────────────────────────────────────────
  const confidencePercent = Math.round((prediction.confidence || 0.9) * 100);
  const confidenceColor =
    confidencePercent >= 85 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
    confidencePercent >= 65 ? 'bg-amber-100 text-amber-800 border-amber-300'       :
                              'bg-rose-100 text-rose-800 border-rose-300';

  const isMockResult = prediction.model?.includes('[DEMO]') || prediction.model?.includes('Mock');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recognized EthSL Sign
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${confidenceColor}`}>
            {confidencePercent}% Confidence
          </span>
          {isMockResult && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
              DEMO
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md truncate max-w-[200px]">
          {prediction.model || 'CESLR ResNet18-CTC'}
        </span>
      </div>

      {/* Translation */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight mb-1"
               style={{ fontFamily: "'Noto Sans Ethiopic', serif" }}>
            {prediction.amharic}
          </div>
          <div className="text-base sm:text-lg font-semibold text-slate-700">
            {prediction.english}
          </div>
        </div>
        {prediction.category && (
          <span className="self-start sm:self-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-100/70 text-blue-800 capitalize shrink-0">
            {prediction.category}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* TTS */}
          <button onClick={handleSpeak}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
              isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
            <Volume2 className="w-4 h-4" />
            {isSpeaking ? 'Speaking…' : 'Speak'}
          </button>

          {/* Copy */}
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {/* Feedback */}
          {feedback === 'sent' ? (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
              <Check className="w-3.5 h-3.5" /> Thanks for feedback!
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => handleFeedback('correct')}
                title="This recognition was correct"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button onClick={() => handleFeedback('incorrect')}
                title="This recognition was incorrect"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {onClear && (
          <button onClick={onClear}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear translation">
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
