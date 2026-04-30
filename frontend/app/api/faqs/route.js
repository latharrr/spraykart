import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Public GET — only active FAQs, ordered by sort_order
export async function GET() {
  try {
    const { rows } = await db.query(
      'SELECT id, question, answer, image_url, sort_order FROM faqs WHERE is_active = true ORDER BY sort_order ASC, created_at ASC'
    );
    return NextResponse.json({ faqs: rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
