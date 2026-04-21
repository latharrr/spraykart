import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { email, otp, password } = await request.json();
    if (!email || !otp || !password) return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const { rows } = await db.query(
      'SELECT * FROM password_resets WHERE email=$1 AND otp=$2 AND expires_at > NOW()',
      [email.toLowerCase().trim(), otp]
    );
    if (!rows.length) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email.toLowerCase()]);
    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);

    return NextResponse.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
