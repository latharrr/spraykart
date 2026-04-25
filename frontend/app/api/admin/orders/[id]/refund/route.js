import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import Razorpay from 'razorpay';

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const { rows } = await db.query('SELECT * FROM orders WHERE id=$1', [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const order = rows[0];

    if (!order.razorpay_payment_id) {
      return NextResponse.json({ error: 'No Razorpay payment ID found for this order' }, { status: 400 });
    }

    if (order.status !== 'cancelled') {
      return NextResponse.json({ error: 'Order must be cancelled before issuing a refund' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
      amount: Math.round(parseFloat(order.final_price) * 100), // full refund
      notes: {
        order_id: order.id,
      }
    });

    // Optionally record refund ID in the database if you add a 'razorpay_refund_id' column
    return NextResponse.json({ success: true, refund });
  } catch (err) {
    console.error('Refund error:', err);
    return NextResponse.json({ error: 'Failed to process refund. Check Razorpay dashboard.' }, { status: 500 });
  }
}
