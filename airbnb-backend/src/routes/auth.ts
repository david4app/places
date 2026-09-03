import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { hashPassword, verifyPassword } from '../auth-utils.js';
import { createSessionToken, deleteSessionToken } from '../session.js';
import type { AuthUser } from '../types.js';

const router = Router();

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  avatar: string;
  password_hash: string;
};

function publicUser(user: UserRow): AuthUser {
  return { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
}

function createSession(user: UserRow) {
  return { token: createSessionToken(user.id), user: publicUser(user) };
}

router.post('/register', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const [existing] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return res.status(409).json({ message: 'An account with this email already exists.' });

  const user: UserRow = {
    id: randomUUID(),
    name,
    email,
    avatar: `https://i.pravatar.cc/160?u=${encodeURIComponent(email)}`,
    password_hash: hashPassword(password),
  } as UserRow;

  await pool.query(
    'INSERT INTO users (id, name, email, avatar, password_hash) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.name, user.email, user.avatar, user.password_hash],
  );

  res.status(201).json(createSession(user));
});

router.post('/login', async (req, res) => {
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

export default router;