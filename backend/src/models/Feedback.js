/**
 * Feedback.js — Mongoose model for recognition quality reports
 *
 * Deaf users can flag incorrect predictions to help improve the model.
 * No webcam frames are attached — only text outputs and flags.
 */

import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    /** The gloss the model predicted */
    predictedGloss: {
      type: String,
      required: true,
      trim: true
    },

    /** Model confidence at time of prediction */
    confidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1
    },

    /** Was this a mock prediction (should not be used for model improvement) */
    isMock: {
      type: Boolean,
      default: false
    },

    /** User feedback type */
    feedbackType: {
      type: String,
      enum: ['correct', 'incorrect', 'uncertain', 'missing_sign'],
      required: true
    },

    /** What the actual sign was (optional — user-provided Amharic or English) */
    correctGloss: {
      type: String,
      default: null,
      trim: true
    },

    /** Free-text comment */
    comment: {
      type: String,
      default: null,
      maxlength: 500
    },

    /** Client-side session identifier (anonymous) */
    sessionId: {
      type: String,
      default: null
    },

    /** Provider that produced this prediction */
    provider: {
      type: String,
      enum: ['fastapi', 'mock'],
      default: 'mock'
    }
  },
  {
    timestamps: true,
    collection: 'feedback'
  }
);

FeedbackSchema.index({ predictedGloss: 1, feedbackType: 1 });
FeedbackSchema.index({ createdAt: -1 });

export default mongoose.model('Feedback', FeedbackSchema);
