import { NextResponse } from 'next/server';
import db from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  source: z.string().max(50).default('exit_intent'),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const { email, source } = result.data;

    await db.query(
      `INSERT INTO leads(email, source) VALUES($1,$2) ON CONFLICT (email) DO NOTHING`,
      [email, source]
    );

    return NextResponse.json({ success: true, code: 'FIRST300' });
  } catch (err) {
    logger.error('Lead capture error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
