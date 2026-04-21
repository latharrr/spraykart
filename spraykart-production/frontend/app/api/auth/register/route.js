import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6).max(100),
});

export async function POST(request) {
  try {
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

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('token', signToken(user.id), COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
