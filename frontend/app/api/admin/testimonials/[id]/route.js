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

// PATCH update testimonial
export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = params;

  try {
    const { name, location, rating, review, is_active, sort_order } = await request.json();

    if (!name?.trim() || !review?.trim() || rating === undefined) {
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
      `UPDATE testimonials 
       SET name=$1, location=$2, rating=$3, review=$4, is_active=$5, sort_order=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [
        name.trim(),
        location?.trim() || null,
        rating,
        review.trim(),
        is_active ?? true,
        sort_order ?? 0,
        id
      ]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ testimonial: rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Testimonial update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE testimonial
export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = params;

  try {
    const { rows } = await db.query(
      'DELETE FROM testimonials WHERE id=$1 RETURNING id',
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Testimonial delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
