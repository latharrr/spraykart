import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { email } from '@/lib/email';

// Must receive raw body - configure in next.config.js
export const dynamic = 'force-dynamic';

const ALLOWED_IPS = ['14.97.75.20', '14.97.75.21', '14.97.75.22', '14.97.75.23', '127.0.0.1']; // localhost for testing

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const cleanIp = ip.split(',')[0].trim();
  if (cleanIp !== 'unknown' && !ALLOWED_IPS.includes(cleanIp) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await request.text();

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (expectedSig !== signature) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { order_id: razorpay_order_id, id: razorpay_payment_id, amount, currency } = payment;

    try {
      const { rows } = await db.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE o.razorpay_order_id = $1`,
        [razorpay_order_id]
      );

      if (!rows.length) return NextResponse.json({ received: true });

      const order = rows[0];
      const expectedAmount = Math.round(parseFloat(order.final_price) * 100);
      if (amount !== expectedAmount || currency !== 'INR') {
        console.error(`Webhook amount mismatch for order ${order.id}`);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      const { rows: updated } = await db.query(
        `UPDATE orders SET status='confirmed', razorpay_payment_id=$1
         WHERE razorpay_order_id=$2 AND status='pending' RETURNING *`,
        [razorpay_payment_id, razorpay_order_id]
      );

      if (updated.length) {
        const { rows: items } = await db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
        Promise.all([
          email.sendOrderConfirmation({ to: order.customer_email, name: order.customer_name, orderId: order.id, items, total: order.final_price, discount: order.discount }),
          email.sendAdminNewOrder({ orderId: order.id, customerName: order.customer_name, customerEmail: order.customer_email, total: order.final_price, itemCount: items.length }),
        ]).catch(console.error);
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }

  return NextResponse.json({ received: true });
}
