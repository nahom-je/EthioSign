/**
 * routes/signs.js — EthSL vocabulary REST API
 *
 * GET  /api/signs            — paginated list with optional filters
 * GET  /api/signs/:id        — single sign entry
 * GET  /api/signs/gloss/:gloss — lookup by Amharic gloss string
 * GET  /api/categories       — list all sign categories with counts
 */

import { Router } from 'express';
import Sign from '../models/Sign.js';

const router = Router();

// ── GET /api/signs ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      page     = 1,
      limit    = 50,
      sort     = 'gloss'
    } = req.query;

    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && search.trim()) {
      // Use MongoDB text search if text index is available
      filter.$text = { $search: search.trim() };
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * pageSize;

    // Allowed sort fields
    const allowedSorts = { gloss: 1, english: 1, frequency: -1, createdAt: -1 };
    const sortField    = allowedSorts[sort] !== undefined ? sort : 'gloss';
    const sortOrder    = allowedSorts[sortField];

    const [signs, total] = await Promise.all([
      Sign.find(filter)
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(pageSize)
          .select('-__v')
          .lean(),
      Sign.countDocuments(filter)
    ]);

    res.json({
      success:    true,
      data:       signs,
      pagination: {
        total,
        page:     pageNum,
        limit:    pageSize,
        pages:    Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('[signs] GET / error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch signs.' });
  }
});

// ── GET /api/signs/gloss/:gloss ────────────────────────────────────────────
router.get('/gloss/:gloss', async (req, res) => {
  try {
    const sign = await Sign.findOne({
      gloss: { $regex: `^${req.params.gloss.trim()}$`, $options: 'i' }
    }).select('-__v').lean();

    if (!sign) {
      return res.status(404).json({ success: false, error: 'Sign gloss not found.' });
    }
    res.json({ success: true, data: sign });
  } catch (err) {
    console.error('[signs] GET /gloss/:gloss error:', err);
    res.status(500).json({ success: false, error: 'Lookup failed.' });
  }
});

// ── GET /api/signs/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const sign = await Sign.findById(req.params.id).select('-__v').lean();
    if (!sign) {
      return res.status(404).json({ success: false, error: 'Sign not found.' });
    }
    res.json({ success: true, data: sign });
  } catch (err) {
    console.error('[signs] GET /:id error:', err);
    res.status(500).json({ success: false, error: 'Lookup failed.' });
  }
});

// ── PUT /api/signs/:id — update videoUrl, thumbnailUrl, description, isValidated
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['videoUrl', 'thumbnailUrl', 'description', 'isValidated', 'tags', 'frequency'];
    const update  = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, error: 'No updatable fields provided.' });
    }
    const sign = await Sign.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-__v').lean();
    if (!sign) {
      return res.status(404).json({ success: false, error: 'Sign not found.' });
    }
    res.json({ success: true, data: sign });
  } catch (err) {
    console.error('[signs] PUT /:id error:', err);
    res.status(500).json({ success: false, error: 'Update failed.' });
  }
});

export default router;
