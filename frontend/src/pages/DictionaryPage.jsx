import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, Play, ShieldCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { dictionaryService } from '../services/dictionaryService';
import SignVideoPlayer from '../components/sign/SignVideoPlayer';

export default function DictionaryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingSign, setInspectingSign] = useState(null);

  const categories = useMemo(() => dictionaryService.getCategories(), []);

  const signs = useMemo(() => {
    return dictionaryService.getSigns({
      category: selectedCategory,
      query: searchQuery
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              EthSL Lexicon
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ethiopian Sign Language Dictionary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore verified sign demonstrations, linguistic descriptions, and regional variants across Ethiopian communities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            {signs.length} Signs Available
          </span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Amharic (e.g. እናቴ, ዳቦ, አመሰግናለሁ) or English (e.g. Mother, Bread, Red)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-hidden font-ethiopic"
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

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              <span className="ml-1.5 text-[11px] opacity-75 font-ethiopic">({cat.amharic})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Signs */}
      {signs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Signs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No EthSL vocabulary matches "{searchQuery}". All vocabulary in EthioSign is authentic and verified by the Ethiopian Deaf community.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {signs.map((sign) => (
            <div
              key={sign.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => setInspectingSign(sign)}
            >
              {/* Video Thumbnail / Header */}
              <div className="relative aspect-16/10 bg-slate-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all z-20">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div className="absolute top-2.5 right-2.5 z-20">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/90 text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-3 z-20">
                  <span className="text-xs font-medium text-slate-200 capitalize">
                    {sign.category}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-ethiopic group-hover:text-blue-600 transition-colors">
                    {sign.gloss}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    {sign.english}
                  </p>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {sign.meaning}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{sign.regionalVariant || 'National'}</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">EthSL Sign Inspector</span>
                <span className="text-xs font-bold text-slate-900 font-ethiopic">• {inspectingSign.gloss}</span>
              </div>
              <button
                onClick={() => setInspectingSign(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <SignVideoPlayer sign={inspectingSign} autoPlay={true} showNotes={true} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
