/**
 * dictionaryService.js  —  Phase 4 update
 *
 * Fetches EthSL sign vocabulary from the Express backend REST API when available.
 * Falls back to the local ethslVocabulary.js data if the backend is offline.
 *
 * API endpoints consumed:
 *   GET /api/signs?category=&search=&limit=100   → paginated sign list
 *   GET /api/categories                           → category list with counts
 *   GET /api/signs/gloss/:gloss                   → single sign by gloss
 *
 * Text-to-sign translation (phrase matching / token lookup) always runs
 * client-side against the loaded vocabulary — no network round-trip needed.
 */

import { ETHSL_VOCABULARY, ETHSL_CATEGORIES, ETHSL_COMMON_PHRASES } from '../data/ethslVocabulary';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/** Normalise a backend sign doc to match the shape of ETHSL_VOCABULARY entries */
function normaliseBackendSign(doc) {
  return {
    id:          doc._id || doc.glossIndex?.toString() || doc.gloss,
    gloss:       doc.gloss,
    english:     doc.english,
    meaning:     doc.english,          // alias used by older components
    category:    doc.category || 'other',
    description: doc.description || '',
    videoUrl:    doc.videoUrl    || null,
    isValidated: doc.isValidated || false,
    glossIndex:  doc.glossIndex  ?? null,
  };
}

class DictionaryService {
  constructor() {
    this._cache     = null;   // cached sign array
    this._catCache  = null;   // cached category array
    this._backendOk = null;   // null = unknown, true/false after first check
    this._checkBackend();
  }

  /** Silently probe the backend; set _backendOk flag */
  async _checkBackend() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, {
        signal: AbortSignal.timeout(2000)
      });
      this._backendOk = res.ok;
    } catch {
      this._backendOk = false;
    }
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories() {
    if (this._backendOk === false) return this._localCategories();

    try {
      const res  = await fetch(`${BACKEND_URL}/api/categories`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (data.success && data.data?.length) {
        this._backendOk = true;
        return data.data; // [{ id, label, count }]
      }
    } catch {
      this._backendOk = false;
    }
    return this._localCategories();
  }

  _localCategories() {
    // Build counts from local vocabulary
    const counts = {};
    let total = 0;
    for (const s of ETHSL_VOCABULARY) {
      counts[s.category] = (counts[s.category] || 0) + 1;
      total++;
    }
    const cats = ETHSL_CATEGORIES.map(c => ({
      id:    c.id,
      label: c.label,
      count: counts[c.id] || 0
    }));
    return [{ id: 'all', label: 'All Signs', count: total }, ...cats];
  }

  // ── Sign list ──────────────────────────────────────────────────────────────

  async getSigns({ category = 'all', query = '', limit = 100 } = {}) {
    if (this._backendOk !== false) {
      try {
        const params = new URLSearchParams({ limit });
        if (category && category !== 'all') params.set('category', category);
        if (query?.trim()) params.set('search', query.trim());

        const res  = await fetch(`${BACKEND_URL}/api/signs?${params}`, { signal: AbortSignal.timeout(4000) });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          this._backendOk = true;
          const signs = data.data.map(normaliseBackendSign);
          // Merge with local vocab so video + linguistic data is always present
          return this._mergeWithLocal(signs);
        }
      } catch {
        this._backendOk = false;
      }
    }
    // Fallback: local JS vocab
    return this._localGetSigns({ category, query });
  }

  /** Merge backend docs with matching local entries (preserves videoUrl, description) */
  _mergeWithLocal(backendSigns) {
    return backendSigns.map(bs => {
      const local = ETHSL_VOCABULARY.find(l => l.gloss === bs.gloss);
      return local ? { ...local, ...bs, videoUrl: bs.videoUrl || local.videoUrl } : bs;
    });
  }

  _localGetSigns({ category = 'all', query = '' } = {}) {
    let results = [...ETHSL_VOCABULARY];
    if (category && category !== 'all') {
      results = results.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }
    if (query?.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        s =>
          s.gloss.toLowerCase().includes(q) ||
          s.english.toLowerCase().includes(q) ||
          (s.meaning || '').toLowerCase().includes(q)
      );
    }
    return results;
  }

  // ── Single sign lookups ───────────────────────────────────────────────────

  async getSignById(id) {
    // Check local first (fast)
    const local = ETHSL_VOCABULARY.find(s => s.id === id);
    if (local) return local;
    // Try backend by gloss (id may be a MongoDB _id or gloss string)
    if (this._backendOk !== false) {
      try {
        const res  = await fetch(`${BACKEND_URL}/api/signs/${id}`, { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data.success) return normaliseBackendSign(data.data);
      } catch { /* ignore */ }
    }
    return null;
  }

  async getSignByGloss(gloss) {
    const local = ETHSL_VOCABULARY.find(s => s.gloss === gloss);
    if (local) return local;
    if (this._backendOk !== false) {
      try {
        const res  = await fetch(`${BACKEND_URL}/api/signs/gloss/${encodeURIComponent(gloss)}`, { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        if (data.success) return normaliseBackendSign(data.data);
      } catch { /* ignore */ }
    }
    return null;
  }

  // ── Text-to-sign translation (always client-side) ─────────────────────────

  translateTextToSigns(text) {
    if (!text?.trim()) return { matchedSigns: [], unmatchedWords: [] };

    // Strip Amharic + ASCII punctuation
    const clean  = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?'"፣፤፦]/g, ' ');
    const tokens = clean.split(/\s+/).filter(Boolean);

    const matchedSigns  = [];
    const unmatchedWords = [];

    // 1. Full-phrase match against ETHSL_COMMON_PHRASES
    const phraseMatch = ETHSL_COMMON_PHRASES.find(
      p => p.amharic.trim() === text.trim() ||
           p.english.toLowerCase() === text.toLowerCase().trim()
    );

    if (phraseMatch) {
      for (const gloss of phraseMatch.glossSequence) {
        const sign = ETHSL_VOCABULARY.find(v => v.gloss === gloss);
        if (sign) matchedSigns.push(sign);
      }
      return { matchedSigns, unmatchedWords: [] };
    }

    // 2. Token-by-token lookup (Amharic gloss or English word)
    for (const token of tokens) {
      const lower = token.toLowerCase();
      const match = ETHSL_VOCABULARY.find(
        v => v.gloss === token || v.english.toLowerCase() === lower
      );
      if (match) {
        matchedSigns.push(match);
      } else {
        unmatchedWords.push(token);
      }
    }

    return { matchedSigns, unmatchedWords };
  }

  /** Submit recognition feedback to backend */
  async submitFeedback({ predictedGloss, confidence, isMock, feedbackType, correctGloss, comment, sessionId, provider }) {
    if (this._backendOk === false) return { success: false, error: 'Backend offline' };
    try {
      const res = await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictedGloss, confidence, isMock, feedbackType, correctGloss, comment, sessionId, provider }),
        signal: AbortSignal.timeout(4000)
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Network error' };
    }
  }
}

// Singleton — shared across all pages
export const dictionaryService = new DictionaryService();
