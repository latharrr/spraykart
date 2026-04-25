import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { email as emailService } from '@/lib/email';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

import cache from '@/lib/cache';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (ip !== 'unknown') {
      const rlKey = `rl:register:${ip}`;
      const attempts = await cache.incr(rlKey);
      if (attempts === 1) await cache.expire(rlKey, 3600); // 1 hour
      if (attempts > 3) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, email, password } = result.data;

    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      'INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email,role',
      [name, email, hash]
    );
    const user = rows[0];

    emailService.sendWelcome({ to: user.email, name: user.name }).catch(() => {});

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('token', signToken(user.id), COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
