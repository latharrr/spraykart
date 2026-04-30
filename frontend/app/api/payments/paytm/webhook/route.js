import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import db from '@/lib/db';

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

    // Example: handle payment success
    if (json?.event === 'payment.succeeded' || json?.eventType === 'PAYMENT.SUCCESS') {
      const payment = json?.payload?.payment?.entity || json;
      const orderId = payment?.orderId || payment?.order_id;
      if (orderId) {
        try {
          await db.query("UPDATE orders SET status='confirmed', paytm_txn_id=$1 WHERE razorpay_order_id=$2 OR id=$2 AND status='pending'", [payment?.id || payment?.txnId, orderId]);
        } catch (e) { console.error('Failed to update order from paytm webhook', e); }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Paytm webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
