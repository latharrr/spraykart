import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import cache from '@/lib/cache';

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const { rows } = await db.query(
      'UPDATE reviews SET is_approved=true WHERE id=$1 RETURNING *, (SELECT slug FROM products WHERE id=reviews.product_id) as product_slug',
      [params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (rows[0].product_slug) await cache.del(`product:${rows[0].product_slug}`);
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
