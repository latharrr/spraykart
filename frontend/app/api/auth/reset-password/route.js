import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '@/lib/db';
import { z } from 'zod';
import { COOKIE_OPTIONS } from '@/lib/auth';
import rateLimit from '@/lib/rateLimit';
import logger from '@/lib/logger';

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

function constantTimeEqualString(a, b) {
  // Pad both inputs to a fixed length so the comparison time doesn't leak the
  // length of either side, and use crypto.timingSafeEqual on equal-sized buffers.
  const LEN = 32;
  const ba = Buffer.alloc(LEN);
  const bb = Buffer.alloc(LEN);
  Buffer.from(String(a || ''), 'utf8').copy(ba, 0, 0, LEN);
  Buffer.from(String(b || ''), 'utf8').copy(bb, 0, 0, LEN);
  return crypto.timingSafeEqual(ba, bb) && String(a || '').length === String(b || '').length;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp, password } = result.data;

    // Two rate limits — by IP and by email — to limit brute-forcing.
    try {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
      await rateLimit({ prefix: 'reset-ip', id: ip, limit: 10, windowSec: 900 });
      await rateLimit({ prefix: 'reset-email', id: email, limit: 5, windowSec: 3600 });
    } catch (rlErr) {
      if (rlErr && rlErr.code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
      }
    }

    // Atomic: lock the row, bump attempts, evaluate.
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows: lockedRows } = await client.query(
        `SELECT id, otp, attempts FROM password_resets
         WHERE email=$1 AND expires_at > NOW()
         FOR UPDATE`,
        [email]
      );
      if (!lockedRows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'No valid reset request found. Request a new OTP.' },
          { status: 400 }
        );
      }

      const resetRow = lockedRows[0];
      if (resetRow.attempts >= 5) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Too many failed attempts. Request a new OTP.' },
          { status: 429 }
        );
      }

      await client.query(
        'UPDATE password_resets SET attempts = attempts + 1 WHERE id=$1',
        [resetRow.id]
      );

      if (!constantTimeEqualString(resetRow.otp, otp)) {
        await client.query('COMMIT');
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
      }

      const hash = await bcrypt.hash(password, 12);
      await client.query(
        'UPDATE users SET password=$1, password_changed_at=NOW() WHERE email=$2',
        [hash, email]
      );
      await client.query('DELETE FROM password_resets WHERE email=$1', [email]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully. Please log in.',
    });
    // Force re-login on any device that already has a token cookie set.
    response.cookies.set('token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
  } catch (err) {
    logger.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
