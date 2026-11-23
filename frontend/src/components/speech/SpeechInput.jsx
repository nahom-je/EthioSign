import React, { useState } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export default function SpeechInput({
  onSendMessage,
  placeholder = "Speak into microphone or type message..."
}) {
  const [lang, setLang] = useState('am-ET');
  const [typedText, setTypedText] = useState('');
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({ lang });

  const activeText = transcript || interimTranscript || typedText;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const messageToSend = (typedText || transcript).trim();
    if (!messageToSend) return;

    onSendMessage(messageToSend);
    setTypedText('');
    resetTranscript();
    stopListening();
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      setTypedText('');
      startListening();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header & Language selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hearing User Input
          </span>
          {isListening && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Listening...
            </span>
          )}
        </div>

        {/* Input Language Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Spoken Language:</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="am-ET">Amharic (አማርኛ)</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={isListening ? (transcript ? `${transcript} ${interimTranscript}` : interimTranscript) : typedText}
            onChange={(e) => setTypedText(e.target.value)}
            disabled={isListening}
            rows={3}
            placeholder={isListening ? "Listening to your voice now..." : placeholder}
            className={`w-full p-4 rounded-xl border text-sm transition-all resize-none focus:outline-hidden ${
              isListening
                ? 'bg-rose-50/50 border-rose-300 text-slate-900 ring-2 ring-rose-200'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
          />
        </div>

        {/* Microphones Notice / Speech Recognition Fallback */}
        {speechError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={!isSupported}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isSupported ? "Click to speak" : "Speech recognition not supported in this browser"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
              <span>{isListening ? 'Stop Mic' : 'Speak Message'}</span>
            </button>

            <span className="text-xs text-slate-400 hidden sm:inline">
              {isSupported ? 'Click microphone to talk or type above' : 'Speech recognition unavailable, please type'}
            </span>
          </div>

          <button
            type="submit"
            disabled={!typedText.trim() && !transcript.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Convert to EthSL Sign</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
