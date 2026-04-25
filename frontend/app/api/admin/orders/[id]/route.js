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

    const currentOrder = await db.query('SELECT status FROM orders WHERE id=$1', [params.id]);
    if (!currentOrder.rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const prevStatus = currentOrder.rows[0].status;

    const client = await db.pool.connect();
    let order;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE orders SET status=$1 WHERE id=$2
         RETURNING *, (SELECT name FROM users WHERE id=orders.user_id) as customer_name,
                      (SELECT email FROM users WHERE id=orders.user_id) as customer_email`,
        [status, params.id]
      );
      order = rows[0];

      if (status === 'cancelled' && prevStatus !== 'cancelled') {
        const itemsRes = await client.query('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1', [params.id]);
        for (const item of itemsRes.rows) {
          if (item.variant_id) {
            await client.query('UPDATE variants SET stock = stock + $1 WHERE id=$2', [item.quantity, item.variant_id]);
          } else {
            await client.query('UPDATE products SET stock = stock + $1 WHERE id=$2', [item.quantity, item.product_id]);
          }
        }
        if (order.coupon_code) {
          await client.query('UPDATE coupons SET used_count = GREATEST(0, used_count - 1) WHERE code=$1', [order.coupon_code]);
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      email.sendOrderStatusUpdate({ to: order.customer_email, name: order.customer_name, orderId: order.id, status })
        .catch(console.error);
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
