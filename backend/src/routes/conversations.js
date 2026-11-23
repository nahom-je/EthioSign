/**
 * routes/conversations.js — Session conversation history API
 *
 * POST /api/conversations            — start or resume a session
 * GET  /api/conversations/:sessionId — retrieve session history
 * POST /api/conversations/:sessionId/messages — add a message to session
 * DELETE /api/conversations/:sessionId        — delete session (user-initiated)
 *
 * Privacy:
 *   Only created when user has explicitly enabled storeHistory.
 *   Raw video/audio is never stored.
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Conversation from '../models/Conversation.js';

const router = Router();

// ── POST /api/conversations ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { sessionId, label, isStorageConsented } = req.body;

    if (!isStorageConsented) {
      return res.status(400).json({
        success: false,
        error: 'Storage consent is required to persist conversation history.'
      });
    }

    const id = sessionId || uuidv4();

    // Upsert — resume existing session or create new
    const conversation = await Conversation.findOneAndUpdate(
      { sessionId: id },
      { $setOnInsert: { sessionId: id, label: label || null, isStorageConsented: true } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: { sessionId: conversation.sessionId } });
  } catch (err) {
    console.error('[conversations] POST / error:', err);
    res.status(500).json({ success: false, error: 'Failed to create session.' });
  }
});

// ── GET /api/conversations/:sessionId ─────────────────────────────────────
router.get('/:sessionId', async (req, res) => {
  try {
    const convo = await Conversation
      .findOne({ sessionId: req.params.sessionId })
      .select('-__v')
      .lean();

    if (!convo) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    res.json({ success: true, data: convo });
  } catch (err) {
    console.error('[conversations] GET /:sessionId error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
});

// ── POST /api/conversations/:sessionId/messages ───────────────────────────
router.post('/:sessionId/messages', async (req, res) => {
  try {
    const { sender, type, amharic, english, confidence, isMock, glossIndex, matchedSignCount } = req.body;

    if (!sender || !type) {
      return res.status(400).json({ success: false, error: 'sender and type are required.' });
    }

    const convo = await Conversation.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      {
        $push: {
          messages: { sender, type, amharic, english, confidence, isMock, glossIndex, matchedSignCount }
        }
      },
      { new: true, runValidators: true }
    );

    if (!convo) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const added = convo.messages[convo.messages.length - 1];
    res.status(201).json({ success: true, data: added });
  } catch (err) {
    console.error('[conversations] POST /:sessionId/messages error:', err);
    res.status(500).json({ success: false, error: 'Failed to save message.' });
  }
});

// ── DELETE /api/conversations/:sessionId ──────────────────────────────────
router.delete('/:sessionId', async (req, res) => {
  try {
    const result = await Conversation.findOneAndDelete({ sessionId: req.params.sessionId });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    console.error('[conversations] DELETE /:sessionId error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete session.' });
  }
});

export default router;
