import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import Razorpay from 'razorpay';
import PaytmChecksum from 'paytmchecksum';
import { logAdminAction } from '@/lib/audit';
import logger from '@/lib/logger';

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay keys are not configured');
  return new Razorpay({ key_id, key_secret });
}

async function createPaytmRefund(order, amountPaise, admin) {
  const mid = process.env.PAYTM_MID;
  const merchantKey = process.env.PAYTM_MERCHANT_KEY;
  const host = process.env.PAYTM_HOST || 'https://securegw-stage.paytm.in';
  if (!mid || !merchantKey) throw new Error('Paytm refund is not configured');
  if (!order.paytm_txn_id) throw new Error('No Paytm transaction ID found for this order');

  const refId = `REF_${String(order.id).slice(0, 8)}_${Date.now()}`;
  const body = {
    mid,
    txnType: 'REFUND',
    orderId: order.paytm_order_id || order.id,
    txnId: order.paytm_txn_id,
    refId,
    refundAmount: (amountPaise / 100).toFixed(2),
    comments: `Spraykart admin refund by ${admin.email}`,
  };
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), merchantKey);
  const response = await fetch(`${host}/refund/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, head: { signature } }),
  });
  const data = await response.json();
  const resultStatus = data?.body?.resultInfo?.resultStatus;
  return {
    gateway_refund_id: data?.body?.refundId || refId,
    status: resultStatus === 'TXN_FAILURE' ? 'failed' : 'pending',
    gateway_response: data,
  };
}

export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const body = await request.json().catch(() => ({}));
    const { rows } = await db.query('SELECT * FROM orders WHERE id=$1', [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const order = rows[0];

    const paidGateway = order.razorpay_payment_id ? 'razorpay' : order.paytm_txn_id ? 'paytm' : null;
    if (!paidGateway) {
      return NextResponse.json({ error: 'No captured online payment found for this order' }, { status: 400 });
    }

    const { rows: refundRows } = await db.query(
      "SELECT COALESCE(SUM(amount),0) as refunded FROM refunds WHERE order_id=$1 AND status <> 'failed'",
      [order.id]
    );
    const alreadyRefunded = Math.round(Number(refundRows[0].refunded || 0));
    const paidAmount = Math.round(Number(order.final_price) * 100);
    const remaining = paidAmount - alreadyRefunded;
    const requestedAmount = body.amount == null ? remaining : Number(body.amount);

    if (!Number.isInteger(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json({ error: 'Refund amount must be a positive integer in paise' }, { status: 400 });
    }
    if (requestedAmount > remaining) {
      return NextResponse.json(
        { error: 'Refund amount exceeds remaining refundable amount', already_refunded: alreadyRefunded, remaining_refundable: remaining },
        { status: 400 }
      );
    }

    let gatewayRefund;
    if (paidGateway === 'razorpay') {
      const refund = await getRazorpay().payments.refund(order.razorpay_payment_id, {
        amount: requestedAmount,
        notes: { order_id: order.id, admin_id: user.id },
      });
      gatewayRefund = {
        gateway_refund_id: refund.id,
        status: refund.status || 'processed',
        gateway_response: refund,
      };
    } else {
      gatewayRefund = await createPaytmRefund(order, requestedAmount, user);
    }

    const { rows: inserted } = await db.query(
      'INSERT INTO refunds(order_id,gateway_refund_id,amount,status) VALUES($1,$2,$3,$4) RETURNING *',
      [order.id, gatewayRefund.gateway_refund_id, requestedAmount, gatewayRefund.status]
    );
    await logAdminAction({
      adminId: user.id,
      action: 'refund.create',
      targetType: 'refund',
      targetId: inserted[0].id,
      before: { order_id: order.id, already_refunded: alreadyRefunded, remaining_refundable: remaining },
      after: inserted[0],
      request,
    });

    const statusCode = gatewayRefund.status === 'failed' ? 502 : 200;
    return NextResponse.json({ success: gatewayRefund.status !== 'failed', refund: inserted[0], gateway: gatewayRefund.gateway_response }, { status: statusCode });
  } catch (err) {
    logger.error('Refund error:', err);
    return NextResponse.json({ error: 'Failed to process refund. Check payment gateway dashboard.' }, { status: 500 });
  }
}
