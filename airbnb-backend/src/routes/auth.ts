import { Router } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { hashPassword, verifyPassword } from '../auth-utils.js';
import { createSessionToken, deleteSessionToken, getUserIdFromRequest } from '../session.js';
import { toMysqlDatetime } from '../utils.js';
import type { AuthUser } from '../types.js';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const VERIFICATION_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_HOURS = 1;

// Basic brute-force protection: a handful of attempts per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
});

const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  surname: string | null;
  phone: string | null;
  email: string;
  avatar: string;
  password_hash: string;
  email_verified: number;
  verification_token: string | null;
  verification_token_expires: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
};

function publicUser(user: UserRow): AuthUser {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar,
    emailVerified: Boolean(user.email_verified),
  };
}

function createSession(user: UserRow) {
  return { token: createSessionToken(user.id), user: publicUser(user) };
}

function generateToken() {
  return randomBytes(32).toString('hex');
}

router.post('/register', accountActionLimiter, async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return res.status(409).json({ message: 'An account with this email already exists.' });

  const verificationToken = generateToken();
  const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  const user: UserRow = {
    id: randomUUID(),
    name,
    email,
    avatar: `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}`,
    password_hash: hashPassword(password),
    email_verified: 0,
    verification_token: verificationToken,
    verification_token_expires: verificationExpires.toISOString(),
    reset_token: null,
    reset_token_expires: null,
  } as UserRow;

  await pool.query(
    `INSERT INTO users (id, name, email, avatar, password_hash, email_verified, verification_token, verification_token_expires)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [user.id, user.name, user.email, user.avatar, user.password_hash, verificationToken, toMysqlDatetime(verificationExpires.toISOString())],
  );

  // No email provider is configured yet — log the link so it can be used during development.
  console.log(`[auth] Verify ${email} at ${FRONTEND_URL}/verify-email?token=${verificationToken}`);

  res.status(201).json(createSession(user));
});

router.post('/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json(createSession(user));
});

router.post('/logout', (req, res) => {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) deleteSessionToken(authorization.slice(7));
  res.status(204).send();
});

router.post('/verify-email', accountActionLimiter, async (req, res) => {
  const token = String(req.body?.token ?? '');
  if (!token) return res.status(400).json({ message: 'Missing verification token.' });

  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
    [token],
  );
  const user = rows[0];
  if (!user) {
    return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
  }

  await pool.query(
    'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
    [user.id],
  );

  res.json({ message: 'Email verified. Thanks!' });
});

router.post('/resend-verification', accountActionLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  // Always respond the same way so this endpoint can't be used to enumerate accounts.
  if (user && !user.email_verified) {
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, toMysqlDatetime(verificationExpires.toISOString()), user.id],
    );
    console.log(`[auth] Verify ${email} at ${FRONTEND_URL}/verify-email?token=${verificationToken}`);
  }

  res.json({ message: 'If that account needs verifying, a new link has been sent.' });
});

router.post('/forgot-password', accountActionLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (user) {
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, toMysqlDatetime(resetExpires.toISOString()), user.id],
    );
    console.log(`[auth] Reset password for ${email} at ${FRONTEND_URL}/reset-password?token=${resetToken}`);
  }

  // Always respond the same way so this endpoint can't be used to enumerate accounts.
  res.json({ message: 'If that email is registered, a password reset link has been sent.' });
});

router.post('/reset-password', accountActionLimiter, async (req, res) => {
  const token = String(req.body?.token ?? '');
  const password = String(req.body?.password ?? '');

  if (!token) return res.status(400).json({ message: 'Missing reset token.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token],
  );
  const user = rows[0];
  if (!user) {
    return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
  }

  await pool.query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
    [hashPassword(password), user.id],
  );

  res.json({ message: 'Your password has been reset. You can now log in.' });
});

router.put('/profile', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to update your profile.' });
  }

  const name = String(req.body?.name ?? '').trim();
  const surnameInput = String(req.body?.surname ?? '').trim();
  const phoneInput = String(req.body?.phone ?? '').trim();

  if (name.length < 2) {
    return res.status(400).json({ message: 'Please enter your full name.' });
  }
  if (phoneInput && !/^[+\d][\d\s\-()]{5,19}$/.test(phoneInput)) {
    return res.status(400).json({ message: 'Please enter a valid phone number.' });
  }

  const surname = surnameInput || null;
  const phone = phoneInput || null;

  await pool.query('UPDATE users SET name = ?, surname = ?, phone = ? WHERE id = ?', [name, surname, phone, userId]);

  const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
  const user = rows[0];
  if (!user) {
    return res.status(404).json({ message: 'Your account could not be found.' });
  }

  res.json(publicUser(user));
});

export default router;