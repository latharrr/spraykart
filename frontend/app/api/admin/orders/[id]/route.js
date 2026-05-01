import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { email } from '@/lib/email';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import logger from '@/lib/logger';

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

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
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const { status } = await request.json();
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const client = await db.pool.connect();
    let order;
    try {
      await client.query('BEGIN');

      const currentOrder = await client.query(
        `SELECT status, payment_method, razorpay_payment_id, paytm_txn_id, final_price FROM orders WHERE id=$1 FOR UPDATE`,
        [params.id]
      );
      if (!currentOrder.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const prevStatus = currentOrder.rows[0].status;
      const paymentMethod = currentOrder.rows[0].payment_method;
      const hasOnlinePayment = currentOrder.rows[0].razorpay_payment_id || currentOrder.rows[0].paytm_txn_id;
      const allowedNext = ALLOWED_TRANSITIONS[prevStatus] || [];

      if (status !== prevStatus && !allowedNext.includes(status)) {
        await client.query('ROLLBACK');
        const allowedText = allowedNext.length ? allowedNext.join(', ') : 'no further status changes';
        return NextResponse.json(
          { error: `Cannot change order from ${prevStatus} to ${status}. Allowed next status: ${allowedText}.` },
          { status: 400 }
        );
      }

      // Prevent cancellation of online orders without explicit refund
      if (status === 'cancelled' && prevStatus !== 'cancelled' && paymentMethod === 'online' && hasOnlinePayment) {
        const { rows: refundRows } = await client.query(
          "SELECT COALESCE(SUM(amount),0) as refunded FROM refunds WHERE order_id=$1 AND status <> 'failed'",
          [params.id]
        );
        const refundedPaise = Math.round(Number(refundRows[0].refunded || 0));
        const requiredPaise = Math.round(Number(currentOrder.rows[0].final_price || 0) * 100);
        if (refundedPaise < requiredPaise) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Cannot cancel paid online orders until the full amount has been refunded.', refunded: refundedPaise, required: requiredPaise },
            { status: 409 }
          );
        }
      }

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
      await logAdminAction({
        adminId: user.id,
        action: 'order.status_change',
        targetType: 'order',
        targetId: params.id,
        before: currentOrder.rows[0],
        after: order,
        request,
        client,
      });
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      email.sendOrderStatusUpdate({ to: order.customer_email, name: order.customer_name, orderId: order.id, status })
        .catch((err) => logger.error('Order status email failed:', err));
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
