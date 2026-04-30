import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { email } from '@/lib/email';

export const dynamic = 'force-dynamic';

// This should be called by a cron job (e.g. every 15 minutes)
export async function GET(request) {
  // Check CRON_SECRET env var and compare with Authorization header
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[cron] CRON_SECRET not configured; cron endpoint is disabled');
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== secret) {
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

    // Cleanup expired password resets
    const { rowCount: deletedTokens } = await client.query("DELETE FROM password_resets WHERE expires_at < NOW()");

    await client.query('COMMIT');
    return NextResponse.json({ success: true, reconciled: cancelledCount, deletedTokens });
  } finally {
    client.release();
  }
}
