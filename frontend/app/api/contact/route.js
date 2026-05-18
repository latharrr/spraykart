import { NextResponse } from 'next/server';
import db from '@/lib/db';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body?.name?.toString().trim();
    const email = body?.email?.toString().trim();
    const message = body?.message?.toString().trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const { rows } = await db.query(
      `INSERT INTO contact_submissions (name, email, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, message]
    );

    return NextResponse.json({ submission: rows[0] }, { status: 201 });
  } catch (err) {
    logger.error('Contact submission error:', err);
    return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
  }
}
