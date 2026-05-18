import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
  const search = (searchParams.get('search') || '').trim();
  const offset = (page - 1) * limit;

  const filterParams = [];
  let where = "WHERE u.role = 'customer'";
  let i = 1;

  if (search) {
    where += ` AND (
      u.name ILIKE $${i++}
      OR u.email ILIKE $${i++}
      OR EXISTS (
        SELECT 1 FROM orders phone_orders
        WHERE phone_orders.user_id = u.id
          AND phone_orders.shipping_address->>'phone' ILIKE $${i++}
      )
    )`;
    filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Copy filter params before pushing limit/offset so the count query
  // gets exactly the filter args and nothing more.
  const dataParams = [...filterParams, limit, offset];

  try {
    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(`
        SELECT u.id, u.name, u.email, u.role, u.is_blocked, u.created_at,
          (
            SELECT latest_phone.shipping_address->>'phone'
            FROM orders latest_phone
            WHERE latest_phone.user_id = u.id
              AND NULLIF(latest_phone.shipping_address->>'phone', '') IS NOT NULL
            ORDER BY latest_phone.created_at DESC
            LIMIT 1
          ) as phone,
          (SELECT COUNT(*) FROM orders WHERE user_id=u.id) as order_count,
          (SELECT COALESCE(SUM(final_price),0) FROM orders WHERE user_id=u.id AND status!='cancelled') as total_spent
        FROM users u ${where} ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i}`, dataParams),
      db.query(`SELECT COUNT(*) FROM users u ${where}`, filterParams),
    ]);

    const total = parseInt(countRows[0].count, 10);
    return NextResponse.json({
      users: rows,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    logger.error('Admin users GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
