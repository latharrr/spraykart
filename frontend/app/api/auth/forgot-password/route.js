import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { email as emailService } from '@/lib/email';
import logger from '@/lib/logger';

import cache from '@/lib/cache';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request) {
  const startedAt = Date.now();
  const respond = async (payload, status = 200) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 350) {
      await sleep(350 - elapsed);
    }
    return NextResponse.json(payload, { status });
  };

  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (ip !== 'unknown') {
      const rlKey = `rl:forgotpw:${ip}`;
      const attempts = await cache.incr(rlKey);
      if (attempts === 1) await cache.expire(rlKey, 3600); // 1 hour
      if (attempts > 3) return respond({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const { email } = await request.json();
    if (!email) return respond({ error: 'Email is required' }, 400);

    const { rows } = await db.query('SELECT id, name FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (!rows.length) return respond({ success: true, message: 'If that email exists, you will receive an OTP.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);
    await db.query(
      'INSERT INTO password_resets(email, otp, expires_at) VALUES($1,$2,$3)',
      [email.toLowerCase(), otp, expiresAt]
    );

    emailService.sendPasswordReset({ to: email, name: rows[0].name, otp }).catch(() => {});
    return respond({ success: true, message: 'If that email exists, you will receive an OTP.' });
  } catch (err) {
    logger.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
