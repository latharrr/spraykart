import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export function signToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
}

export async function getAuthUser(request) {
  const cookieStore = cookies();
  const token =
    cookieStore.get('token')?.value ||
    request.headers.get('authorization')?.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, name, email, role, is_blocked FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length || rows[0].is_blocked) return null;
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
