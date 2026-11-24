import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Play, ShieldCheck, ChevronRight, X, Loader2, Database } from 'lucide-react';
import { dictionaryService } from '../services/dictionaryService';
import SignVideoPlayer from '../components/sign/SignVideoPlayer';

export default function DictionaryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery]           = useState('');
  const [inspectingSign, setInspectingSign]     = useState(null);

  const [categories, setCategories] = useState([]);
  const [signs, setSigns]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [source, setSource]         = useState('local'); // 'api' | 'local'

  // Load categories once on mount
  useEffect(() => {
    dictionaryService.getCategories().then(cats => setCategories(cats));
  }, []);

  // Reload signs when category or query changes
  const loadSigns = useCallback(async () => {
    setIsLoading(true);
    const result = await dictionaryService.getSigns({
      category: selectedCategory,
      query: searchQuery
    });
    setSigns(result);
    setSource(dictionaryService._backendOk ? 'api' : 'local');
    setIsLoading(false);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadSigns();
  }, [loadSigns]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">EthSL Lexicon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ethiopian Sign Language Dictionary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore verified sign demonstrations, linguistic descriptions, and regional variants across Ethiopian communities.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {isLoading ? '…' : signs.length} Signs
          </span>
          {/* Source badge */}
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            source === 'api'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <Database className="w-3.5 h-3.5" />
            {source === 'api' ? 'Live Backend' : 'Local Cache'}
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Amharic (e.g. እናቴ, ዳቦ) or English (e.g. Mother, Bread, Red)…"
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                  selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                }`}>{cat.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && signs.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Signs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No EthSL vocabulary matches "{searchQuery}". All vocabulary in EthioSign is authentic and verified by the Ethiopian Deaf community.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Sign grid */}
      {!isLoading && signs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {signs.map((sign) => (
            <div
              key={sign.id || sign.gloss}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => setInspectingSign(sign)}
            >
              {/* Video thumbnail / preview */}
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                {sign.videoUrl ? (
                  <video
                    src={sign.videoUrl}
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onMouseEnter={e => e.target.play()}
                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className={`w-12 h-12 rounded-full backdrop-blur-sm text-white flex items-center justify-center group-hover:scale-110 transition-all z-20 ${sign.videoUrl ? 'bg-blue-600/80 group-hover:bg-blue-600' : 'bg-white/20 group-hover:bg-white/30'}`}>
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 ${sign.videoUrl ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
                    <ShieldCheck className="w-3 h-3" />
                    {sign.videoUrl ? 'Video Ready' : sign.isValidated ? 'Validated' : 'CESLR'}
                  </span>
                </div>
                {!sign.videoUrl && (
                  <div className="absolute bottom-2.5 left-3 z-20">
                    <span className="text-[10px] font-medium text-slate-400 italic">Video coming soon</span>
                  </div>
                )}
                <div className="absolute bottom-2.5 right-3 z-20">
                  <span className="text-xs font-medium text-slate-200 capitalize">{sign.category}</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                      style={{ fontFamily: "'Noto Sans Ethiopic', serif" }}>
                    {sign.gloss}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">{sign.english}</p>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sign.description || sign.meaning || '—'}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>EthSL</span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Sign <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign Demonstration Modal */}
      {inspectingSign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={(e) => e.target === e.currentTarget && setInspectingSign(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">EthSL Sign Inspector</span>
                <span className="text-xs font-bold text-slate-900"
                      style={{ fontFamily: "'Noto Sans Ethiopic', serif" }}>
                  • {inspectingSign.gloss}
                </span>
              </div>
              <button
                onClick={() => setInspectingSign(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <SignVideoPlayer sign={inspectingSign} autoPlay showNotes />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
