import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { email as emailService } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const { rows } = await db.query('SELECT id, name FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (!rows.length) return NextResponse.json({ success: true, message: 'If that email exists, you will receive an OTP.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);
    await db.query(
      'INSERT INTO password_resets(email, otp, expires_at) VALUES($1,$2,$3)',
      [email.toLowerCase(), otp, expiresAt]
    );

    emailService.sendPasswordReset({ to: email, name: rows[0].name, otp }).catch(() => {});
    return NextResponse.json({ success: true, message: 'If that email exists, you will receive an OTP.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
