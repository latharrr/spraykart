import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { CSRF_COOKIE_NAME, generateCsrfToken, getCsrfCookieOptions } from '@/lib/csrf';
import logger from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

// A precomputed bcrypt hash so we always run a hash comparison even when
// the user does not exist. Without this, response timing leaks which
// emails are registered.
const DUMMY_BCRYPT_HASH = '$2a$10$abcdefghijklmnopqrstuv1234567890ABCDEFGHIJKLMNOPQRSTUV';

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
  };
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    try {
      await rateLimit({ prefix: 'login', id: ip, limit: 15, windowSec: 900 });
    } catch (rlErr) {
      if (rlErr && rlErr.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again in 15 minutes.' },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }
    const { email, password } = result.data;

    const { rows } = await db.query(
      'SELECT id, name, email, role, phone, password, is_blocked FROM users WHERE email=$1',
      [email]
    );
    const user = rows[0];

    // Always compute a bcrypt to defeat user-enumeration timing attacks.
    const passwordHash = user?.password || DUMMY_BCRYPT_HASH;
    const valid = await bcrypt.compare(password, passwordHash);

    if (!user || !valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (user.is_blocked) {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const response = NextResponse.json({ user: publicUser(user) });
    response.cookies.set('token', signToken(user.id), COOKIE_OPTIONS);
    response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), getCsrfCookieOptions());
    return response;
  } catch (err) {
    logger.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
