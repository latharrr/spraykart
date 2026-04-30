import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const body = Object.fromEntries(formData);
    const receivedChecksum = body.CHECKSUMHASH;
    delete body.CHECKSUMHASH;

    const merchantKey = process.env.PAYTM_MERCHANT_KEY;
    if (!merchantKey) {
      console.error('PAYTM_MERCHANT_KEY not configured');
      return NextResponse.redirect('/checkout?error=invalid');
    }

    const isValid = await PaytmChecksum.verifySignature(body, merchantKey, receivedChecksum);
    if (!isValid) return NextResponse.redirect('/checkout?error=invalid');

    // Server-to-server status check
    const statusBody = { mid: process.env.PAYTM_MID, orderId: body.ORDERID };
    const sig = await PaytmChecksum.generateSignature(JSON.stringify(statusBody), merchantKey);
    const verifyRes = await fetch(`${process.env.PAYTM_HOST || 'https://securegw-stage.paytm.in'}/v3/order/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: statusBody, head: { signature: sig } }),
    });
    const verify = await verifyRes.json();

    if (verify?.body?.resultInfo?.resultStatus === 'TXN_SUCCESS') {
      try {
        await db.query(
          `UPDATE orders SET status='confirmed', paytm_txn_id=$1, payment_method='online' WHERE id=$2 AND status='pending'`,
          [verify.body.txnId, body.ORDERID]
        );
      } catch (err) {
        console.error('Failed to update order after Paytm callback', err);
      }
      return NextResponse.redirect('/orders?success=1');
    }

    return NextResponse.redirect('/checkout?error=failed');
  } catch (err) {
    console.error('Paytm callback error:', err);
    return NextResponse.redirect('/checkout?error=failed');
  }
}
