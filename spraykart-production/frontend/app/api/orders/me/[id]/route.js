import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { rows } = await db.query(
      `SELECT o.*, json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.id=$1 AND o.user_id=$2 GROUP BY o.id`,
      [params.id, user.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
