import React, { useState, useCallback } from 'react';
import {
  Video, Mic, ArrowRightLeft, MessageSquare, Trash2,
  Sparkles, ShieldCheck, Cpu, AlertCircle, ChevronRight
} from 'lucide-react';
import WebcamCapture from '../components/sign/WebcamCapture';
import TranslationCard from '../components/sign/TranslationCard';
import SpeechInput from '../components/speech/SpeechInput';
import PhraseSequenceViewer from '../components/speech/PhraseSequenceViewer';
import { useWebcam } from '../hooks/useWebcam';
import { recognitionService } from '../services/recognitionService';
import { dictionaryService } from '../services/dictionaryService';
import { useSettings } from '../context/SettingsContext';
import { ETHSL_VOCABULARY } from '../data/ethslVocabulary';

export default function DashboardPage() {
  const [activeMode, setActiveMode]         = useState('sign-to-text');
  const [isRecognizing, setIsRecognizing]   = useState(false);
  const [currentPrediction, setPrediction]  = useState(null);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [serviceAlert, setServiceAlert]     = useState(null);
  const [conversationHistory, setHistory]   = useState([
    {
      id: 'demo-1', sender: 'hearing',
      text: 'ሰላም! እንዴት ነህ?', english: 'Hello! How are you?',
      timestamp: '10:40 AM', type: 'audio'
    },
    {
      id: 'demo-2', sender: 'deaf',
      amharic: 'ደህና', english: 'Fine / Well',
      confidence: 0.94, timestamp: '10:41 AM', type: 'sign'
    }
  ]);

  // Speech-to-sign
  const [speechMessage, setSpeechMessage]   = useState('');
  const [matchedSigns, setMatchedSigns]     = useState([]);
  const [unmatchedWords, setUnmatchedWords] = useState([]);

  // Dev gloss picker (mock only)
  const [selectedGloss, setSelectedGloss]   = useState('');

  const { selectedCamera, addHistoryItem } = useSettings();
  const webcam = useWebcam(selectedCamera);

  // ── Shared recognize helper ──────────────────────────────────────────────
  const doRecognize = useCallback(async (landmarkSequence = null) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setServiceAlert(null);

    try {
      const idx    = selectedGloss !== '' ? parseInt(selectedGloss, 10) : null;
      const frame  = webcam.captureFrame();

      const result = await recognitionService.predictSign({
        frameDataUrl:     frame,
        landmarkSequence: landmarkSequence,
        mockGlossIndex:   idx
      });

      // Show auto-switched provider alert once
      if (result.status === 'service_unavailable') {
        setServiceAlert('AI service offline — using development mock provider.');
      }

      if (result.success && result.prediction) {
        setPrediction(result.prediction);
        const entry = {
          id:         Date.now().toString(),
          sender:     'deaf',
          amharic:    result.prediction.amharic,
          english:    result.prediction.english,
          confidence: result.prediction.confidence,
          isMock:     result.isMock,
          timestamp:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type:       'sign'
        };
        setHistory(prev => [...prev, entry]);
        addHistoryItem(entry);
      } else {
        setPrediction({ status: 'unrecognized' });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, selectedGloss, webcam, addHistoryItem]);

  // Auto-detect callback — triggered by useSignDetector via WebcamCapture
  const handleSignCaptured = useCallback((landmarkSequence) => {
    doRecognize(landmarkSequence);
  }, [doRecognize]);

  // Manual "Recognize Now" button
  const handleManualCapture = useCallback(() => {
    doRecognize(null);
  }, [doRecognize]);

  // ── Speech → Sign ──────────────────────────────────────────────────────
  const handleSendSpeech = useCallback((message) => {
    setSpeechMessage(message);
    const { matchedSigns: matched, unmatchedWords: unmatched } =
      dictionaryService.translateTextToSigns(message);
    setMatchedSigns(matched);
    setUnmatchedWords(unmatched);

    const entry = {
      id:           Date.now().toString(),
      sender:       'hearing',
      text:         message,
      english:      message,
      timestamp:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type:         'audio',
      matchedCount: matched.length
    };
    setHistory(prev => [...prev, entry]);
    addHistoryItem(entry);
  }, [addHistoryItem]);

  // ── Provider badge ────────────────────────────────────────────────────
  const modelStatus = recognitionService.isLive ? 'live' : 'mock';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Header & Mode Toggle ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Live Communication Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Two-Way Active
            </span>
            {/* Live vs Mock indicator */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              modelStatus === 'live'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              <Cpu className="inline w-3 h-3 mr-1" />
              {modelStatus === 'live' ? 'CESLR Live Model' : 'Demo Mock Provider'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            EthioSign Communication Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Switch between Deaf Signer (camera) and Hearing Responder (voice/text).
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
          {[
            { mode: 'sign-to-text',    icon: Video, label: 'Sign → Text' },
            { mode: 'speech-to-sign',  icon: Mic,   label: 'Speech/Text → Sign' }
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === mode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Service alert */}
      {serviceAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{serviceAlert}</span>
        </div>
      )}

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left: Active Tool Viewport */}
        <div className="lg:col-span-7 space-y-6">
          {activeMode === 'sign-to-text' ? (
            <>
              {/* Phase 2 WebcamCapture — now with MediaPipe overlay + motion detection */}
              <WebcamCapture
                webcam={webcam}
                isRecognizing={isRecognizing}
                onStartRecognizing={() => setIsRecognizing(true)}
                onPauseRecognizing={() => setIsRecognizing(false)}
                onSignCaptured={handleSignCaptured}
                onManualCapture={handleManualCapture}
                modelStatus={modelStatus}
              />

              {/* Dev Gloss Picker (visible only in mock mode) */}
              {modelStatus !== 'live' && (
                <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      🧪 Development: Gloss Simulator
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Simulate recognizing any of the 62 authenticated EthSL signs
                    </span>
                  </div>
                  <select
                    value={selectedGloss}
                    onChange={(e) => setSelectedGloss(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
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

              <TranslationCard
                prediction={currentPrediction}
                isProcessing={isProcessing}
                onClear={() => setPrediction(null)}
                onRetry={handleManualCapture}
              />
            </>
          ) : (
            <>
              <SpeechInput onSendMessage={handleSendSpeech} />
              <PhraseSequenceViewer
                message={speechMessage}
                matchedSigns={matchedSigns}
                unmatchedWords={unmatchedWords}
              />
            </>
          )}
        </div>

        {/* Right: Conversation Log */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[680px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Conversation Session
              </span>
            </div>
            {conversationHistory.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {conversationHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ArrowRightLeft className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Session transcript is empty</p>
              </div>
            ) : (
              conversationHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'deaf' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.sender === 'deaf' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      Sign
                    </div>
                  )}
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1 ${
                    msg.sender === 'deaf'
                      ? 'bg-blue-50 border border-blue-100 rounded-tl-none'
                      : 'bg-slate-100 border border-slate-200 rounded-tr-none'
                  }`}>
                    <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-medium">
                      <span>{msg.sender === 'deaf' ? 'Deaf Signer' : 'Hearing Responder'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    {msg.sender === 'deaf' ? (
                      <div>
                        <div className="text-xl font-bold text-blue-700 font-ethiopic leading-tight">
                          {msg.amharic}
                        </div>
                        <div className="text-slate-600 font-medium">{msg.english}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {msg.confidence && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              {Math.round(msg.confidence * 100)}% confidence
                            </span>
                          )}
                          {msg.isMock && (
                            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                              DEMO
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{msg.text}</div>
                        {msg.matchedCount !== undefined && (
                          <div className="text-[10px] text-indigo-600 font-medium pt-0.5">
                            ✓ {msg.matchedCount} EthSL signs demonstrated
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.sender === 'hearing' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      Mic
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              In-Memory Session Only
            </span>
            <span>62 EthSL Signs Active</span>
          </div>
        </div>

      </div>
    </div>
  );
}
