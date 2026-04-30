import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

async function ensureFaqTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS faqs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_faqs_sort_order
      ON faqs(sort_order, created_at)
  `);
}

// Public GET — only active FAQs, ordered by sort_order
export async function GET() {
  try {
    await ensureFaqTable();

    const { rows } = await db.query(
      'SELECT id, question, answer, image_url, sort_order FROM faqs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC'
    );
    return NextResponse.json({ faqs: rows }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
