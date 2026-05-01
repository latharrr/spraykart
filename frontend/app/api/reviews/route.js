import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

const sanitize = (str) => {
  if (!str || typeof str !== 'string') return null;
  return str.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim().slice(0, 2000);
};

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { product_id, rating, comment } = await request.json();
    if (!product_id || !rating) return NextResponse.json({ error: 'product_id and rating are required' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });

    const { rows: product } = await db.query('SELECT id FROM products WHERE id=$1 AND is_active=true', [product_id]);
    if (!product.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const { rows: eligible } = await db.query(
      `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id=$1 AND oi.product_id=$2 AND o.status='delivered' LIMIT 1`,
      [user.id, product_id]
    );
    if (!eligible.length) {
      return NextResponse.json({ error: 'You can only review products from a delivered order' }, { status: 403 });
    }

    const { rows } = await db.query(
      `INSERT INTO reviews(user_id, product_id, rating, comment)
       VALUES($1,$2,$3,$4)
       ON CONFLICT (user_id, product_id) DO UPDATE SET rating=$3, comment=$4, is_approved=false
       RETURNING *`,
      [user.id, product_id, rating, sanitize(comment)]
    );

    return NextResponse.json({ ...rows[0], message: 'Review submitted and pending approval' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
