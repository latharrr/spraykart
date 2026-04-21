import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { email } from '@/lib/email';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             json_agg(oi.* ORDER BY oi.id) as items
      FROM orders o JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = $1 GROUP BY o.id, u.name, u.email`, [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { status } = await request.json();
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const { rows } = await db.query(
      `UPDATE orders SET status=$1 WHERE id=$2
       RETURNING *, (SELECT name FROM users WHERE id=orders.user_id) as customer_name,
                    (SELECT email FROM users WHERE id=orders.user_id) as customer_email`,
      [status, params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const order = rows[0];
    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      email.sendOrderStatusUpdate({ to: order.customer_email, name: order.customer_name, orderId: order.id, status })
        .catch(console.error);
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
