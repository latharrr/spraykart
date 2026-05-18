import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from './db';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and be at least 32 characters long');
  }
  if (process.env.NODE_ENV === 'production' && /your-super-secret|change-?me|example/i.test(secret)) {
    throw new Error('JWT_SECRET still contains a placeholder value — generate a real secret with `openssl rand -base64 64`');
  }
  return secret;
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export function signToken(id) {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '7d' });
}

export async function getAuthUser(request) {
  // Cookie-only — no Authorization header fallback. The SPA always sends
  // credentials, and accepting bearer tokens widens the attack surface
  // (proxies/log aggregators may persist the header).
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const { rows } = await db.query(
      'SELECT id, name, email, role, phone, is_blocked, password_changed_at FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length || rows[0].is_blocked) return null;

    // Reject tokens issued before the user's last password change so password
    // resets invalidate all existing sessions across devices.
    const pwChangedAt = rows[0].password_changed_at;
    if (pwChangedAt && decoded.iat && decoded.iat * 1000 < new Date(pwChangedAt).getTime()) {
      return null;
    }

    delete rows[0].password_changed_at;
    return rows[0];
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: 'Not authenticated' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: 'Admin access required' }, { status: 403 });
}
