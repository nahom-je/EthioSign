import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings as SettingsIcon, 
  Camera, 
  Mic, 
  Volume2, 
  Eye, 
  Shield, 
  Trash2, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export default function SettingsPage() {
  const {
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    autoSpeak,
    setAutoSpeak,
    speechRate,
    setSpeechRate,
    signPlaybackSpeed,
    setSignPlaybackSpeed,
    storeHistory,
    setStoreHistory,
    selectedCamera,
    setSelectedCamera,
    selectedMic,
    setSelectedMic,
    history,
    clearHistory
  } = useSettings();

  const { speak, isSpeaking } = useSpeechSynthesis();
  const [clearedNotice, setClearedNotice] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    setDevicesLoading(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter((d) => d.kind === 'videoinput'));
      setMics(devices.filter((d) => d.kind === 'audioinput'));
    } catch (err) {
      console.warn('Could not enumerate media devices:', err);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleClear = () => {
    clearHistory();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
  };

  const handleTestSpeech = () => {
    speak('ሰላም! ይህ የኢትዮ-ሳይን የድምፅ ቅንብር ማረጋገጫ ነው።', { rate: speechRate });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Application & Accessibility Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize camera, microphone, text-to-speech synthesis, display accessibility, and privacy controls.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* 1. Accessibility Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Accessibility & Visual Feedback</span>
          </div>

          <div className="space-y-4">
            {/* High Contrast Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-sm font-semibold text-slate-900 block">High Contrast Mode</span>
                <span className="text-xs text-slate-500">Enhance visual borders and color contrast for low-vision users (WCAG 2.2 AA).</span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                  highContrast ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle High Contrast"
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 left-0.5 ${
                    highContrast ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Large Text Size */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-sm font-semibold text-slate-900 block">Large Text Size</span>
                <span className="text-xs text-slate-500">Increase font scale across translations and dictionaries.</span>
              </div>
              <button
                onClick={() => setLargeText(!largeText)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                  largeText ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle Large Text"
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 left-0.5 ${
                    largeText ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sign Video Playback Speed */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Default Sign Demonstration Speed</span>
                  <span className="text-xs text-slate-500">Slow motion assists hearing users in studying exact finger and hand movements.</span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-md">
                  {signPlaybackSpeed}x
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                {[0.5, 0.75, 1.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSignPlaybackSpeed(rate)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      signPlaybackSpeed === rate
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {rate}x Speed
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Text-to-Speech Audio Settings */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span>Speech Output Settings</span>
          </div>

          <div className="space-y-4">
            {/* Auto-Speak Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-sm font-semibold text-slate-900 block">Auto-Speak Recognized Signs</span>
                <span className="text-xs text-slate-500">Automatically read aloud translated signs for the hearing communication partner.</span>
              </div>
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                  autoSpeak ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle Auto-Speak"
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 left-0.5 ${
                    autoSpeak ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Speech Rate Slider */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Speech Rate</span>
                  <span className="text-xs text-slate-500">Adjust the speaking speed of the synthesizer.</span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                  {speechRate}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <button
                onClick={handleTestSpeech}
                disabled={isSpeaking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Voice Sample</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Camera & Microphone Hardware */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Camera &amp; Microphone Devices</span>
            </div>
            <button
              onClick={loadDevices}
              disabled={devicesLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${devicesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label htmlFor="camera-select" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Preferred Camera</span>
              </label>
              <select
                id="camera-select"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">Default System Camera</option>
                {cameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label htmlFor="mic-select" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-slate-500" />
                <span>Preferred Microphone</span>
              </label>
              <select
                id="mic-select"
                value={selectedMic}
                onChange={(e) => setSelectedMic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">Default System Microphone</option>
                {mics.map((mic, idx) => (
                  <option key={mic.deviceId || idx} value={mic.deviceId}>
                    {mic.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Privacy & Session Storage */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Privacy & Data Management</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-sm font-semibold text-slate-900 block">Save Conversation History in Browser</span>
                <span className="text-xs text-slate-500">Disabled by default. When enabled, history is kept only in your private browser localStorage.</span>
              </div>
              <button
                onClick={() => setStoreHistory(!storeHistory)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                  storeHistory ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle Save History"
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5 left-0.5 ${
                    storeHistory ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div>
                <span className="text-sm font-semibold text-rose-950 block">Clear Saved Local Data</span>
                <span className="text-xs text-rose-700">Wipe all cached communication turns and local preferences immediately.</span>
              </div>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                {clearedNotice ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                <span>{clearedNotice ? 'Cleared!' : 'Clear Data'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
