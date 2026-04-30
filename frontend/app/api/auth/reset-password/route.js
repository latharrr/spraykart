import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { z } from 'zod';
import { COOKIE_OPTIONS } from '@/lib/auth';

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().min(4),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, otp, password } = result.data;

    const { rows: updateRows } = await db.query(
      'UPDATE password_resets SET attempts = attempts + 1 WHERE email=$1 AND expires_at > NOW() RETURNING *',
      [email]
    );
    if (!updateRows.length) return NextResponse.json({ error: 'No valid reset request found for this email' }, { status: 400 });

    if (updateRows.some(r => r.attempts > 5)) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    const resetRequest = updateRows.find(r => r.otp === otp);
    if (!resetRequest) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email]);
    await db.query('DELETE FROM password_resets WHERE email=$1', [email]);

    // Invalidate session cookie by expiring the token cookie immediately
    const response = NextResponse.json({ success: true, message: 'Password updated successfully. Please log in.' });
    response.cookies.set('token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
    return response;
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
