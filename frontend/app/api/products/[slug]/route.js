import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import logger from '@/lib/logger';

export async function GET(request, { params }) {
  const { slug } = params;
  const cacheKey = `product:${slug}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  }

  try {
    const { rows } = await db.query(`
      SELECT p.*,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      WHERE p.slug = $1 AND p.is_active = true
      GROUP BY p.id
    `, [slug]);

    if (!rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const product = rows[0];
    const [images, variants, reviews] = await Promise.all([
      db.query('SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order', [product.id]),
      db.query('SELECT * FROM variants WHERE product_id=$1', [product.id]),
      db.query(`
        SELECT r.*, u.name as user_name FROM reviews r
        JOIN users u ON u.id=r.user_id
        WHERE r.product_id=$1 AND r.is_approved=true
        ORDER BY r.created_at DESC LIMIT 10
      `, [product.id]),
    ]);

    const result = { ...product, images: images.rows, variants: variants.rows, reviews: reviews.rows };
    await cache.set(cacheKey, result, 300);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (err) {
    logger.error('Product detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
