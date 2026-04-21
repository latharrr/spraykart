import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { rows } = await db.query(
      `SELECT o.*, json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [user.id]
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
