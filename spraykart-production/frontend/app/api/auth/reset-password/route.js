import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { email, otp, password } = await request.json();
    if (!email || !otp || !password) return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

    const { rows: updateRows } = await db.query(
      'UPDATE password_resets SET attempts = attempts + 1 WHERE email=$1 AND expires_at > NOW() RETURNING *',
      [email.toLowerCase().trim()]
    );
    if (!updateRows.length) return NextResponse.json({ error: 'No valid reset request found for this email' }, { status: 400 });

    if (updateRows.some(r => r.attempts > 5)) {
      return NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 });
    }

    const resetRequest = updateRows.find(r => r.otp === otp);
    if (!resetRequest) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password=$1 WHERE email=$2', [hash, email.toLowerCase()]);
    await db.query('DELETE FROM password_resets WHERE email=$1', [email.toLowerCase()]);

    return NextResponse.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
