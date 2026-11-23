import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import SignVideoPlayer from '../sign/SignVideoPlayer';

export default function PhraseSequenceViewer({
  message,
  matchedSigns = [],
  unmatchedWords = []
}) {
  const [selectedSignIndex, setSelectedSignIndex] = useState(0);

  if (!message) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">No message translated yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Speak or type a message above to see validated Ethiopian Sign Language video demonstrations.
        </p>
      </div>
    );
  }

  const activeSign = matchedSigns[selectedSignIndex] || matchedSigns[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header and Original Utterance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            EthSL Translation Output
          </span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{matchedSigns.length} Signs Matched</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-600 font-medium uppercase tracking-wider block">Spoken / Typed Input:</span>
            <span className="text-base font-bold text-slate-900 font-ethiopic">"{message}"</span>
          </div>
        </div>
      </div>

      {/* Unmatched Words Warning (Section 6: Feature C - Never invent fake sign translations) */}
      {unmatchedWords.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-900">Vocabulary Notice:</span>{' '}
            The words <strong className="font-mono text-amber-950 font-ethiopic">[{unmatchedWords.join(', ')}]</strong> are not yet validated in the EthSL 62-gloss corpus. 
            EthioSign adheres to authentic linguistic integrity and displays only verified signs.
          </div>
        </div>
      )}

      {/* Sequence of Matched Signs Carousel / Stepper */}
      {matchedSigns.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Sign Language Sequence (Click to inspect each sign)
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {matchedSigns.map((sign, idx) => (
                <button
                  key={`${sign.id}-${idx}`}
                  onClick={() => setSelectedSignIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    selectedSignIndex === idx
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/15 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-ethiopic text-sm">{sign.gloss}</span>
                  <span className="text-[11px] opacity-80">({sign.english})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Sign Video Player */}
          {activeSign && (
            <div className="mt-4">
              <SignVideoPlayer sign={activeSign} autoPlay={true} />
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
          No matching EthSL signs were found for this sentence in the verified dictionary. 
          Try phrases such as <span className="font-ethiopic font-bold text-slate-700">"አመሰግናለሁ"</span>, <span className="font-ethiopic font-bold text-slate-700">"ደህና"</span>, or <span className="font-ethiopic font-bold text-slate-700">"አባቴ ዘመድ ይወዳል"</span>.
        </div>
      )}
    </div>
  );
}
