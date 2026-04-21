const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',   // 'strict' breaks cookies through Next.js proxy rewrites
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      'INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email,role',
      [name, email, hash]
    );
    const user = rows[0];
    logger.info(`New user registered: ${email}`);
    res.cookie('token', signToken(user.id), COOKIE_OPTIONS);
    res.status(201).json({ user });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (user.is_blocked) return res.status(403).json({ error: 'Account blocked' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    logger.info(`User logged in: ${email}`);
    res.cookie('token', signToken(user.id), COOKIE_OPTIONS);
    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { rows } = await db.query('SELECT id, name FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    // Always return 200 to prevent email enumeration attacks
    if (!rows.length) return res.json({ success: true, message: 'If that email exists, you will receive an OTP.' });

    const user = rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing OTPs for this email, then insert new one
    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);
    await db.query(
      'INSERT INTO password_resets(email, otp, expires_at) VALUES($1,$2,$3)',
      [email.toLowerCase(), otp, expiresAt]
    );

    // Send OTP email (fire-and-forget)
    const emailService = require('../services/email.service');
    emailService.sendPasswordReset({ to: email, name: user.name, otp }).catch(() => {});

    logger.info(`Password reset OTP sent to ${email}`);
    res.json({ success: true, message: 'If that email exists, you will receive an OTP.' });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM password_resets WHERE email=$1 AND otp=$2 AND expires_at > NOW()',
      [email.toLowerCase().trim(), otp]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email.toLowerCase()]);
    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);

    logger.info(`Password reset successful for ${email}`);
    res.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
