import React, { useState } from 'react';
import { Mic, Sparkles, MessageSquare } from 'lucide-react';
import SpeechInput from '../components/speech/SpeechInput';
import PhraseSequenceViewer from '../components/speech/PhraseSequenceViewer';
import { dictionaryService } from '../services/dictionaryService';
import { ETHSL_COMMON_PHRASES } from '../data/ethslVocabulary';
import { useSettings } from '../context/SettingsContext';

export default function SpeechToSignPage() {
  const [message, setMessage]           = useState('');
  const [matchedSigns, setMatchedSigns] = useState([]);
  const [unmatchedWords, setUnmatched]  = useState([]);
  const { addHistoryItem } = useSettings();

  // translateTextToSigns is synchronous (always client-side)
  const handleSendMessage = (text) => {
    setMessage(text);
    const { matchedSigns: matched, unmatchedWords: unmatched } =
      dictionaryService.translateTextToSigns(text);
    setMatchedSigns(matched);
    setUnmatched(unmatched);
    addHistoryItem({ sender: 'hearing', text, type: 'audio', matchedCount: matched.length });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Direction B</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Speech &amp; Text → Sign Language
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Speak in Amharic or English, or type your message. EthioSign retrieves validated
          Ethiopian Sign Language video demonstrations for recognised words and phrases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main: input + video output */}
        <div className="lg:col-span-8 space-y-6">
          <SpeechInput onSendMessage={handleSendMessage} />
          <PhraseSequenceViewer
            message={message}
            matchedSigns={matchedSigns}
            unmatchedWords={unmatchedWords}
          />
        </div>

        {/* Sidebar: suggested phrases + notes */}
        <div className="lg:col-span-4 space-y-6">

          {/* Verified EthSL phrases */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Verified EthSL Phrases
            </h3>
            <p className="text-xs text-slate-500">
              Click any everyday phrase to see its exact sign demonstration:
            </p>
            <div className="space-y-2">
              {ETHSL_COMMON_PHRASES.map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handleSendMessage(phrase.amharic)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700"
                       style={{ fontFamily: "'Noto Sans Ethiopic', serif" }}>
                    {phrase.amharic}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{phrase.english}</div>
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              How Translation Works
            </h4>
            <ol className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
              {[
                'Your speech or text is matched against the EthSL phrase library',
                'Full-phrase matches use the validated CESLR gloss sequence',
                'Individual words are looked up token-by-token in the dictionary',
                'Matched signs are shown as video demonstrations in order',
                'Unrecognised words are listed so you can rephrase',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Linguistic integrity notice */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800">Linguistic Integrity Notice</h4>
            <p className="leading-relaxed">
              EthSL has its own distinct syntax, spatial references, and non-manual expressions.
              Translations map to <strong>validated signs and phrases</strong> rather than
              word-for-word substitution from spoken language.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
