import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import db from '@/lib/db';
import logger from '@/lib/logger';
import { SITE_URL } from '@/lib/env';

// Paytm posts the user's browser to this endpoint with a form. The redirect
// must therefore be a 303 ("See Other") so the browser follows it with GET —
// the default 307/308 preserves the POST body and lands the user on a 405.
function redirectTo(path, request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const base = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : SITE_URL;
  return NextResponse.redirect(new URL(path, base), 303);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData);
    const receivedChecksum = body.CHECKSUMHASH;
    delete body.CHECKSUMHASH;

    const merchantKey = process.env.PAYTM_MERCHANT_KEY;
    if (!merchantKey) {
      logger.error('PAYTM_MERCHANT_KEY not configured');
      return redirectTo('/checkout?error=invalid', request);
    }

    const isValid = await PaytmChecksum.verifySignature(body, merchantKey, receivedChecksum);
    if (!isValid) return redirectTo('/checkout?error=invalid', request);

    const paytmOrderId = body.ORDERID;
    if (!paytmOrderId) return redirectTo('/checkout?error=invalid', request);

    // Server-to-server status check — never trust the browser POST alone.
    const statusBody = { mid: process.env.PAYTM_MID, orderId: paytmOrderId };
    const sig = await PaytmChecksum.generateSignature(JSON.stringify(statusBody), merchantKey);
    const verifyRes = await fetch(`${process.env.PAYTM_HOST || 'https://securegw-stage.paytm.in'}/v3/order/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: statusBody, head: { signature: sig } }),
    });
    const verify = await verifyRes.json();

    if (verify?.body?.resultInfo?.resultStatus !== 'TXN_SUCCESS') {
      return redirectTo('/checkout?error=failed', request);
    }

    // Pull the order by paytm_order_id (not by primary key) and verify the
    // amount Paytm reports matches what we expect.
    const { rows: orderRows } = await db.query(
      'SELECT id, user_id, final_price, status FROM orders WHERE paytm_order_id=$1',
      [paytmOrderId]
    );
    const order = orderRows[0];
    if (!order) {
      logger.error('Paytm callback: order not found for paytm_order_id', { paytmOrderId });
      return redirectTo('/checkout?error=not_found', request);
    }

    const expectedRupees = Number(order.final_price);
    const receivedRupees = Number(verify.body.txnAmount);
    const amountMatch = Number.isFinite(expectedRupees)
      && Number.isFinite(receivedRupees)
      && Math.abs(expectedRupees - receivedRupees) < 0.01;
    if (!amountMatch) {
      logger.error('Paytm callback: amount mismatch', { expectedRupees, receivedRupees, orderId: order.id });
      return redirectTo(`/orders?orderId=${order.id}&error=amount_mismatch`, request);
    }

    try {
      await db.query(
        `UPDATE orders SET status='confirmed', paytm_txn_id=$1, payment_method='online'
         WHERE paytm_order_id=$2 AND status='pending'`,
        [verify.body.txnId, paytmOrderId]
      );
    } catch (err) {
      logger.error('Failed to update order after Paytm callback', err);
      return redirectTo(`/orders?orderId=${order.id}&error=update_failed`, request);
    }

    return redirectTo(`/order-confirmed?orderId=${order.id}`, request);
  } catch (err) {
    logger.error('Paytm callback error:', err);
    return redirectTo('/checkout?error=failed', request);
  }
}
