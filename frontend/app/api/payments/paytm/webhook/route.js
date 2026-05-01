import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import db from '@/lib/db';
import { enqueueEmailJob } from '@/lib/emailJobs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const json = await request.json();
    // Paytm may sign webhooks differently; try CHECKSUMHASH in body when present
    const receivedChecksum = json?.CHECKSUMHASH || request.headers.get('x-paytm-signature');
    const merchantKey = process.env.PAYTM_MERCHANT_KEY;
    if (!merchantKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

    let isValid = true;
    if (receivedChecksum && json) {
      // remove CHECKSUMHASH for verification
      const payload = { ...json };
      delete payload.CHECKSUMHASH;
      try {
        isValid = await PaytmChecksum.verifySignature(payload, merchantKey, receivedChecksum);
      } catch (e) { isValid = false; }
    }

    if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    // Record webhook for audit and idempotency
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS paytm_webhooks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_id TEXT,
          payload JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const eventId = json?.id || json?.payload?.payment?.entity?.id || null;
      await db.query('INSERT INTO paytm_webhooks(event_id, payload) VALUES($1,$2)', [eventId, json]);
    } catch (err) {
      console.error('Failed to persist paytm webhook:', err);
    }

    // Example: handle payment success with amount verification and dispute handling
    if (json?.event === 'payment.succeeded' || json?.eventType === 'PAYMENT.SUCCESS') {
      const payment = json?.payload?.payment?.entity || json;
      const orderId = payment?.orderId || payment?.order_id;
      if (orderId) {
        try {
          // Find the order (may be stored in paytm_order_id or id)
          const { rows } = await db.query(
            `SELECT o.*, u.name as customer_name, u.email as customer_email
             FROM orders o JOIN users u ON u.id=o.user_id
             WHERE o.paytm_order_id = $1 OR o.id = $1 LIMIT 1`,
            [orderId]
          );
          if (!rows.length) {
            // fallback: try razorpay_order_id match
            const { rows: r2 } = await db.query(
              `SELECT o.*, u.name as customer_name, u.email as customer_email
               FROM orders o JOIN users u ON u.id=o.user_id
               WHERE o.razorpay_order_id = $1 LIMIT 1`,
              [orderId]
            );
            if (r2.length) rows.push(r2[0]);
          }
          if (!rows.length) return NextResponse.json({ received: true });
          const order = rows[0];

          const expected = parseFloat(order.final_price || 0);
          // Try to extract received amount from Paytm payload (txnAmount.value is used during create)
          const receivedRaw = payment?.txnAmount?.value ?? payment?.amount ?? payment?.amountPaid ?? payment?.orderAmount ?? null;
          const received = receivedRaw ? parseFloat(receivedRaw) : null;

          // If received amount is available and differs significantly, mark disputed and alert admin
          if (received !== null && Math.abs(expected - received) > 1.0) {
            try { await db.query("UPDATE orders SET status='disputed', paytm_txn_id=$1 WHERE id=$2", [payment?.id || payment?.txnId, order.id]); } catch (e) { console.error('Failed to mark paytm order disputed', e); }
            try { await enqueueEmailJob({ type: 'admin_dispute', args: { orderId: order.id, expected, received, paymentId: payment?.id || payment?.txnId, gateway: 'Paytm', details: json } }); } catch (e) { console.error('Failed to notify admin of paytm dispute', e); }
            return NextResponse.json({ received: true });
          }

          // otherwise mark confirmed
          const { rows: updated } = await db.query(
            "UPDATE orders SET status='confirmed', paytm_txn_id=$1 WHERE id=$2 AND status='pending' RETURNING *",
            [payment?.id || payment?.txnId, order.id]
          );
          if (updated.length) {
            const { rows: items } = await db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
            await Promise.all([
              enqueueEmailJob({ type: 'order_confirmation', args: { to: order.customer_email, name: order.customer_name, orderId: order.id, items, total: order.final_price, discount: order.discount } }),
              enqueueEmailJob({ type: 'admin_new_order', args: { orderId: order.id, customerName: order.customer_name, customerEmail: order.customer_email, total: order.final_price, itemCount: items.length } }),
            ]);
          }
        } catch (e) { console.error('Failed to update order from paytm webhook', e); }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Paytm webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
