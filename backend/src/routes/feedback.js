/**
 * routes/feedback.js — Recognition quality feedback API
 *
 * POST /api/feedback    — submit recognition quality feedback
 * GET  /api/feedback    — admin: list feedback (future auth gate)
 */

import { Router } from 'express';
import Feedback from '../models/Feedback.js';

const router = Router();

// ── POST /api/feedback ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      predictedGloss,
      confidence,
      isMock,
      feedbackType,
      correctGloss,
      comment,
      sessionId,
      provider
    } = req.body;

    if (!predictedGloss || !feedbackType) {
      return res.status(400).json({
        success: false,
        error: 'predictedGloss and feedbackType are required.'
      });
    }

    const feedback = await Feedback.create({
      predictedGloss,
      confidence:   confidence ?? null,
      isMock:       isMock     ?? false,
      feedbackType,
      correctGloss: correctGloss || null,
      comment:      comment      || null,
      sessionId:    sessionId    || null,
      provider:     provider     || 'mock'
    });

    res.status(201).json({ success: true, data: { id: feedback._id } });
  } catch (err) {
    console.error('[feedback] POST / error:', err);
    res.status(500).json({ success: false, error: 'Failed to save feedback.' });
  }
});

// ── GET /api/feedback (simple admin view, no auth yet) ────────────────────
router.get('/', async (req, res) => {
  try {
    const { feedbackType, page = 1, limit = 20 } = req.query;
    const filter  = feedbackType ? { feedbackType } : {};
    const pageNum = Math.max(1, parseInt(page, 10));
    const size    = Math.min(100, parseInt(limit, 10));

    const [items, total] = await Promise.all([
      Feedback.find(filter)
              .sort({ createdAt: -1 })
              .skip((pageNum - 1) * size)
              .limit(size)
              .lean(),
      Feedback.countDocuments(filter)
    ]);

    res.json({ success: true, data: items, total, page: pageNum });
  } catch (err) {
    console.error('[feedback] GET / error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback.' });
  }
});

export default router;
