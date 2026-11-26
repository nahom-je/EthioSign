import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = role === 'signer' ? 'signer' : 'user';
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: safeRole
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('[auth] POST /register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('[auth] POST /login error:', err);
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    console.error('[auth] GET /me error:', err);
    res.status(500).json({ success: false, error: 'Failed to load profile.' });
  }
});

export default router;
