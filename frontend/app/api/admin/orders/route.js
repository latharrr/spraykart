import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const params = [];
  let where = '';
  let i = 1;

  if (status && VALID_STATUSES.includes(status)) {
    where = `WHERE o.status = $${i++}`;
    params.push(status);
  }

  const countParams = [...params];
  params.push(limit, offset);
  const limitIdx = i++;
  const offsetIdx = i;

  try {
    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(`
        SELECT o.*, u.name as customer_name, u.email as customer_email,
               json_agg(oi.* ORDER BY oi.id) as items
        FROM orders o JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        ${where} GROUP BY o.id, u.name, u.email
        ORDER BY o.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`, params),
      // Keep a dedicated param list for count query so future filters don't break argument ordering.
      db.query(`SELECT COUNT(DISTINCT o.id) FROM orders o ${where}`, countParams),
    ]);

    return NextResponse.json({
      orders: rows,
      total: parseInt(countRows[0].count),
      page,
      pages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
