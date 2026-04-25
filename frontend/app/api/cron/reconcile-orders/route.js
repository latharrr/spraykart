import { NextResponse } from 'next/server';
import db from '@/lib/db';

// This should be called by a cron job (e.g. every 15 minutes)
export async function GET(request) {
  // Simple security check to prevent public execution
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Find orders that have been pending for more than 30 minutes
    const { rows: pendingOrders } = await client.query(
      `SELECT id, coupon_code FROM orders 
       WHERE status = 'pending' AND created_at < NOW() - INTERVAL '30 minutes'`
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

    await client.query('COMMIT');
    return NextResponse.json({ success: true, reconciled: cancelledCount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to reconcile orders:', err);
    return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
