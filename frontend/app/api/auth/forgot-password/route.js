import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { email as emailService } from '@/lib/email';
import logger from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request) {
  const startedAt = Date.now();
  // Constant-floor response time hides whether the email is registered.
  const respond = async (payload, status = 200) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 500) {
      await sleep(500 - elapsed);
    }
    return NextResponse.json(payload, { status });
  };

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    try {
      // Rate-limit even the "unknown" bucket so a stripped X-Forwarded-For
      // can't unlock unlimited OTP requests.
      await rateLimit({ prefix: 'forgotpw', id: ip, limit: 3, windowSec: 3600 });
    } catch (rlErr) {
      if (rlErr && rlErr.code === 'RATE_LIMIT_EXCEEDED') {
        return respond({ error: 'Too many requests. Please try again later.' }, 429);
      }
    }

    const { email } = await request.json();
    if (!email) return respond({ error: 'Email is required' }, 400);
    const normalizedEmail = String(email).toLowerCase().trim();

    const { rows } = await db.query('SELECT id, name FROM users WHERE email=$1', [normalizedEmail]);
    if (!rows.length) {
      return respond({ success: true, message: 'If that email exists, you will receive an OTP.' });
    }

    // Cryptographically-secure 6-digit OTP. Math.random is predictable.
    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Single transactional UPSERT so we never have zero rows / two rows for the same email.
    await db.query(
      `INSERT INTO password_resets(email, otp, expires_at, attempts)
       VALUES($1,$2,$3,0)
       ON CONFLICT (email) DO UPDATE
         SET otp=EXCLUDED.otp, expires_at=EXCLUDED.expires_at, attempts=0`,
      [normalizedEmail, otp, expiresAt]
    );

    emailService.sendPasswordReset({ to: email, name: rows[0].name, otp }).catch(() => {});
    return respond({ success: true, message: 'If that email exists, you will receive an OTP.' });
  } catch (err) {
    logger.error('Forgot password error:', err);
    return respond({ error: 'Failed to process request' }, 500);
  }
}
