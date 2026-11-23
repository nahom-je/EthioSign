/**
 * Sign.js — Mongoose model for EthSL vocabulary entries
 *
 * Each document represents one authenticated EthSL sign (gloss).
 * The 62-entry seed data comes from the CESLR gloss_dict.npy corpus.
 */

import mongoose from 'mongoose';

const SignSchema = new mongoose.Schema(
  {
    /** Amharic gloss as it appears in CESLR gloss_dict.npy */
    gloss: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    /** English equivalent / translation */
    english: {
      type: String,
      required: true,
      trim: true
    },

    /** Semantic category */
    category: {
      type: String,
      enum: [
        'greetings', 'family', 'numbers', 'colors', 'daily-life',
        'health', 'education', 'emotions', 'objects', 'other'
      ],
      default: 'other',
      index: true
    },

    /** CESLR gloss_dict index (0-based, matches model output) */
    glossIndex: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
      max: 61
    },

    /**
     * Phonological / handshape description for accessibility.
     * Written by EthSL-validated linguists.
     */
    description: {
      type: String,
      default: ''
    },

    /**
     * URL to a validated EthSL sign demonstration video.
     * null = not yet recorded; placeholder CDN URL = community validation pending.
     */
    videoUrl: {
      type: String,
      default: null
    },

    /** Thumbnail image for dictionary grid view */
    thumbnailUrl: {
      type: String,
      default: null
    },

    /** Whether this entry has been reviewed by a Deaf EthSL signer */
    isValidated: {
      type: Boolean,
      default: false
    },

    /** Community usage frequency (for ranking in search) */
    frequency: {
      type: Number,
      default: 0,
      min: 0
    },

    /** Tags for extended search */
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'signs'
  }
);

// Full-text search index on gloss + english + tags
SignSchema.index(
  { gloss: 'text', english: 'text', tags: 'text' },
  { name: 'sign_text_search', weights: { gloss: 10, english: 5, tags: 2 } }
);

export default mongoose.model('Sign', SignSchema);
