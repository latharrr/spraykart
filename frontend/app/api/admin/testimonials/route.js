import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

async function ensureTestimonialTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      location VARCHAR(150),
      rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
      review TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order
      ON testimonials(sort_order, created_at DESC)
  `);
}

// GET all testimonials (admin)
export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await ensureTestimonialTable();
    const { rows } = await db.query(
      'SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC'
    );
    return NextResponse.json({ testimonials: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create new testimonial
export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await ensureTestimonialTable();
    const { name, location, rating, review } = await request.json();

    if (!name?.trim() || !review?.trim() || !rating) {
      return NextResponse.json(
        { error: 'Name, review, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      `INSERT INTO testimonials (name, location, rating, review)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), location?.trim() || null, rating, review.trim()]
    );

    return NextResponse.json({ testimonial: rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Testimonial create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
