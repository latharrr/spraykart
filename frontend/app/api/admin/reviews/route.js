import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  // Ensure reviewer_name column exists before querying it
  await db.query(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(255)`).catch(() => {});

  const { searchParams } = new URL(request.url);
  const approved = searchParams.get('approved');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const offset = (page - 1) * limit;

  const filterParams = [];
  let where = '';
  let i = 1;

  if (approved === 'true' || approved === 'false') {
    where = `WHERE r.is_approved = $${i++}`;
    filterParams.push(approved === 'true');
  }

  const dataParams = [...filterParams, limit, offset];

  try {
    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(
        `SELECT r.*, COALESCE(r.reviewer_name, u.name) as user_name, u.email as user_email,
                p.name as product_name, p.slug as product_slug
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN products p ON p.id = r.product_id
         ${where} ORDER BY r.created_at DESC
         LIMIT $${i++} OFFSET $${i}`,
        dataParams
      ),
      db.query(
        `SELECT COUNT(*) FROM reviews r ${where}`,
        filterParams
      ),
    ]);

    const total = parseInt(countRows[0].count, 10);
    return NextResponse.json({
      reviews: rows,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    logger.error('Admin reviews GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}


export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const { product_id, reviewer_name, rating, comment } = await request.json();

    if (!product_id) return NextResponse.json({ error: 'Product is required' }, { status: 400 });
    if (!reviewer_name?.trim()) return NextResponse.json({ error: 'Reviewer name is required' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 });

    // Check product exists
    const { rows: prodRows } = await db.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!prodRows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Insert review using admin's user_id, with reviewer_name stored in comment prefix or separately
    // We store reviewer_name as a special admin-created review with override_name column
    // First ensure the override_name column exists (graceful migration)
    await db.query(`
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(255)
    `).catch(() => {}); // ignore if column already exists or table has constraints

    const { rows } = await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, is_approved, reviewer_name)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING *`,
      [product_id, user.id, rating, comment?.trim() || null, reviewer_name.trim()]
    );

    // Invalidate caches
    const cache = (await import('@/lib/cache')).default;
    await Promise.allSettled([
      cache.delPattern('products:*'),
      cache.delPattern('product:*'),
    ]);

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    logger.error('Admin review POST failed:', err);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

