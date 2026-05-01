import { NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import { getAuthUser, unauthorized } from '@/lib/auth';
import logger from '@/lib/logger';

// POST /api/payments/paytm/create
export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { amount, orderId } = await request.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const mid = process.env.PAYTM_MID;
    const merchantKey = process.env.PAYTM_MERCHANT_KEY;
    const website = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
    const host = process.env.PAYTM_HOST || 'https://securegw-stage.paytm.in';
    const callbackUrl = process.env.PAYTM_CALLBACK_URL;

    if (!mid || !merchantKey) return NextResponse.json({ error: 'Paytm not configured' }, { status: 500 });

    const txnOrderId = orderId || `ORDER_${Date.now()}`;

    const body = {
      requestType: 'Payment',
      mid,
      websiteName: website,
      orderId: txnOrderId,
      callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/payments/paytm/callback`,
      txnAmount: { value: amount.toFixed(2), currency: 'INR' },
      userInfo: { custId: String(user.id), email: user.email },
    };

    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(body), merchantKey);
    const params = { body, head: { signature: checksum } };

    const res = await fetch(`${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${txnOrderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!data || !data.body) {
      logger.error('Paytm create returned unexpected response', data);
      return NextResponse.json({ error: 'Failed to initiate Paytm transaction' }, { status: 500 });
    }

    if (data.body.resultInfo?.resultStatus !== 'S') {
      return NextResponse.json({ error: data.body.resultInfo?.resultMsg || 'Paytm initiation failed' }, { status: 400 });
    }

    return NextResponse.json({ txnToken: data.body.txnToken, orderId: txnOrderId, mid, amount });
  } catch (err) {
    logger.error('Paytm create error:', err);
    return NextResponse.json({ error: 'Failed to initiate Paytm transaction' }, { status: 500 });
  }
}
