import { ETHSL_VOCABULARY, ETHSL_CATEGORIES, ETHSL_COMMON_PHRASES } from '../data/ethslVocabulary';

/**
 * EthSL Dictionary and NLP Translation Service
 */
export const dictionaryService = {
  // Get all categories
  getCategories() {
    return ETHSL_CATEGORIES;
  },

  // Get all signs with optional category and search filters
  getSigns({ category = 'all', query = '' } = {}) {
    let results = [...ETHSL_VOCABULARY];

    if (category && category !== 'all') {
      results = results.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (s) =>
          s.gloss.toLowerCase().includes(q) ||
          s.english.toLowerCase().includes(q) ||
          s.meaning.toLowerCase().includes(q)
      );
    }

    return results;
  },

  // Lookup sign by exact gloss or ID
  getSignById(id) {
    return ETHSL_VOCABULARY.find((s) => s.id === id) || null;
  },

  getSignByGloss(gloss) {
    return ETHSL_VOCABULARY.find((s) => s.gloss === gloss) || null;
  },

  // Match sentence words to validated EthSL signs
  translateTextToSigns(text) {
    if (!text || !text.trim()) {
      return { matchedSigns: [], unmatchedWords: [] };
    }

    // Clean punctuation
    const clean = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'፣፤፦]/g, ' ');
    const tokens = clean.split(/\s+/).filter(Boolean);

    const matchedSigns = [];
    const unmatchedWords = [];

    // Check first if sentence directly matches a validated CESLR phrase
    const phraseMatch = ETHSL_COMMON_PHRASES.find(
      (p) => p.amharic.trim() === text.trim() || p.english.toLowerCase() === text.toLowerCase().trim()
    );

    if (phraseMatch) {
      phraseMatch.glossSequence.forEach((gloss) => {
        const sign = ETHSL_VOCABULARY.find((v) => v.gloss === gloss);
        if (sign) matchedSigns.push(sign);
      });
      return { matchedSigns, unmatchedWords: [] };
    }

    // Token-level lookup
    tokens.forEach((token) => {
      const lower = token.toLowerCase();
      const match = ETHSL_VOCABULARY.find(
        (v) => v.gloss === token || v.english.toLowerCase() === lower
      );
      if (match) {
        matchedSigns.push(match);
      } else {
        unmatchedWords.push(token);
      }
    });

    return { matchedSigns, unmatchedWords };
  }
};
