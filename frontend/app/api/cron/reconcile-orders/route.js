import { NextResponse } from 'next/server';
import db from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// This should be called by a cron job every 10 minutes.
export async function GET(request) {
  // Check CRON_SECRET env var and compare with Authorization header
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.warn('[cron] CRON_SECRET not configured; cron endpoint is disabled');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const headerSecret = request.headers.get('x-cron-secret');
  if (token !== secret && headerSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Short-term reservation model: unpaid online orders hold stock for 10 minutes.
    // This reduces abandoned-checkout stock lockups while preserving the current
    // decrement-at-order-creation contract until a full reservation ledger exists.
    const { rows: pendingOrders } = await client.query(
      `SELECT o.id, o.coupon_code
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.status = 'pending'
       GROUP BY o.id, o.coupon_code, o.created_at
       HAVING COALESCE(MIN(oi.reserved_until), o.created_at + INTERVAL '10 minutes') <= NOW()`
    );

    let cancelledCount = 0;

    for (const order of pendingOrders) {
      await client.query("UPDATE orders SET status='cancelled' WHERE id=$1", [order.id]);

      const itemsRes = await client.query('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id=$1', [order.id]);
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
      cancelledCount++;
    }

    // Cleanup expired password resets
    const { rowCount: deletedTokens } = await client.query("DELETE FROM password_resets WHERE expires_at < NOW()");

    await client.query('COMMIT');
    return NextResponse.json({ success: true, reconciled: cancelledCount, deletedTokens });
  } finally {
    client.release();
  }
}
