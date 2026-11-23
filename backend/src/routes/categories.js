/**
 * routes/categories.js — Sign category metadata API
 *
 * GET /api/categories  — list all categories with sign counts
 */

import { Router } from 'express';
import Sign from '../models/Sign.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const counts = await Sign.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categories = counts.map(c => ({
      id:    c._id,
      label: c._id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: c.count
    }));

    // Add 'all' meta-category
    const total = categories.reduce((s, c) => s + c.count, 0);
    res.json({
      success: true,
      data: [{ id: 'all', label: 'All Signs', count: total }, ...categories]
    });
  } catch (err) {
    console.error('[categories] GET / error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
});

export default router;
