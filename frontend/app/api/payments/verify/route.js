import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import logger from '@/lib/logger';

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    await db.query(
      `UPDATE orders SET status='confirmed', razorpay_payment_id=$1
       WHERE razorpay_order_id=$2 AND user_id=$3 AND status='pending'`,
      [razorpay_payment_id, razorpay_order_id, user.id]
    );

    return NextResponse.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    logger.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
