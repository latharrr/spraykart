import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  const params = [];
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
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  params.push(limit, offset);

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
        FROM users u ${where} ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i}`, params),
      db.query(`SELECT COUNT(*) FROM users u ${where}`, params.slice(0, -2)),
    ]);

    return NextResponse.json({
      users: rows,
      total: parseInt(countRows[0].count),
      page,
      pages: Math.ceil(parseInt(countRows[0].count) / limit),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
