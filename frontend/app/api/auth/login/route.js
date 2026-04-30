import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

import cache from '@/lib/cache';
import rateLimit from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    try {
      await rateLimit({ prefix: 'login', id: ip, limit: 5, windowSec: 900 });
    } catch (rlErr) {
      if (rlErr && rlErr.code === 'RATE_LIMIT_EXCEEDED') return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 });
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }
    const { email, password } = result.data;

    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const user = rows[0];
    if (user.is_blocked) return NextResponse.json({ error: 'Account blocked' }, { status: 403 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const { password: _, ...userWithoutPass } = user;
    const response = NextResponse.json({ user: userWithoutPass });
    response.cookies.set('token', signToken(user.id), COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
