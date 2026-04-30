import { NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureContactTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
      ON contact_submissions(created_at DESC)
  `);
}

export async function POST(request) {
  try {
    await ensureContactTable();

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
    console.error('Contact submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}