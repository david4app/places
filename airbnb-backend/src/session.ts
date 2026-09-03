import { randomBytes } from 'node:crypto';
import type { Request } from 'express';

const sessions = new Map<string, string>();

export function createSessionToken(userId: string) {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, userId);
  return token;
}

export function deleteSessionToken(token: string) {
  sessions.delete(token);
}

export function getUserIdFromRequest(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return sessions.get(authorization.slice(7)) ?? null;
}
