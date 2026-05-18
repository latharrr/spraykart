import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

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
        `SELECT r.*, u.name as user_name, u.email as user_email,
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
