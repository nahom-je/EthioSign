/**
 * Conversation.js — Mongoose model for communication sessions
 *
 * Stores optional in-session message history.
 * Raw video frames are NEVER stored — only text, translations, and metadata.
 * Sessions expire after 24 hours by default (TTL index).
 *
 * Privacy:
 *  - storeHistory must be explicitly enabled by the user (opt-in)
 *  - Webcam video and microphone audio are never persisted
 */

import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    /** Direction of communication */
    sender: {
      type: String,
      enum: ['deaf', 'hearing'],
      required: true
    },

    /** Message type */
    type: {
      type: String,
      enum: ['sign', 'speech', 'text'],
      required: true
    },

    /** Amharic text (for sign→text messages) */
    amharic: { type: String, default: null },

    /** English translation or original text */
    english: { type: String, default: null },

    /** Model confidence score (0–1). Never stored for mock predictions. */
    confidence: { type: Number, default: null, min: 0, max: 1 },

    /** Was this prediction from the mock provider? */
    isMock: { type: Boolean, default: false },

    /** CESLR gloss index used (if any) */
    glossIndex: { type: Number, default: null },

    /** Number of EthSL signs demonstrated in Direction B */
    matchedSignCount: { type: Number, default: null }
  },
  { _id: true, timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

const ConversationSchema = new mongoose.Schema(
  {
    /** Anonymous session ID (UUID from client) */
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    messages: {
      type: [MessageSchema],
      default: []
    },

    /** User-provided label for the session */
    label: {
      type: String,
      default: null,
      maxlength: 100
    },

    /** Client IP — never stored. Field intentionally absent. */

    /** Whether the user opted into storing this history */
    isStorageConsented: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'conversations'
  }
);

// Auto-expire sessions after 24 hours (TTL index on createdAt)
ConversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('Conversation', ConversationSchema);
