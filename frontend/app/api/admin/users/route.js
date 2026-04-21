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
  let where = "WHERE role = 'customer'";
  let i = 1;

  if (search) {
    where += ` AND (name ILIKE $${i++} OR email ILIKE $${i++})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  params.push(limit, offset);

  try {
    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(`
        SELECT id, name, email, role, is_blocked, created_at,
          (SELECT COUNT(*) FROM orders WHERE user_id=users.id) as order_count,
          (SELECT COALESCE(SUM(final_price),0) FROM orders WHERE user_id=users.id AND status!='cancelled') as total_spent
        FROM users ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`, params),
      db.query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2)),
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
