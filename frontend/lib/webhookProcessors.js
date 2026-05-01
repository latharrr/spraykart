import db from './db';
import { enqueueEmailJob } from './emailJobs';
import { markWebhookProcessed } from './webhookEvents';
import logger from './logger';

async function enqueueWebhookEmailJob(job) {
  try {
    await enqueueEmailJob(job);
  } catch (err) {
    logger.error('Failed to enqueue webhook email job:', err);
  }
}

export async function processRazorpayWebhookEvent(event, eventRecordId) {
  const payment = event?.payload?.payment?.entity;

  if (event.event === 'payment.captured') {
    const { order_id: razorpay_order_id, id: razorpay_payment_id, amount, currency } = payment || {};
    const { rows } = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.razorpay_order_id = $1`,
      [razorpay_order_id]
    );

    if (!rows.length) {
      await markWebhookProcessed(eventRecordId);
      return;
    }

    const order = rows[0];
    const expectedAmount = Math.round(parseFloat(order.final_price) * 100);
    if (amount !== expectedAmount || currency !== 'INR') {
      logger.error('Webhook amount mismatch', { orderId: order.id, amount, currency });
      await db.query("UPDATE orders SET status='disputed' WHERE id=$1", [order.id]);
      await enqueueWebhookEmailJob({
        type: 'admin_dispute',
        args: {
          orderId: order.id,
          expected: order.final_price,
          received: amount / 100,
          paymentId: razorpay_payment_id,
          gateway: 'Razorpay',
          details: event,
        },
      });
      await markWebhookProcessed(eventRecordId);
      return;
    }

    const { rows: updated } = await db.query(
      `UPDATE orders SET status='confirmed', razorpay_payment_id=$1
       WHERE razorpay_order_id=$2 AND status='pending' RETURNING *`,
      [razorpay_payment_id, razorpay_order_id]
    );

    if (updated.length) {
      const { rows: items } = await db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
      await Promise.all([
        enqueueWebhookEmailJob({ type: 'order_confirmation', args: { to: order.customer_email, name: order.customer_name, orderId: order.id, items, total: order.final_price, discount: order.discount } }),
        enqueueWebhookEmailJob({ type: 'admin_new_order', args: { orderId: order.id, customerName: order.customer_name, customerEmail: order.customer_email, total: order.final_price, itemCount: items.length } }),
      ]);
    }
  } else if (event.event === 'payment.failed') {
    const { order_id: razorpay_order_id } = payment || {};
    const { rows } = await db.query(
      `SELECT * FROM orders WHERE razorpay_order_id = $1 AND status = 'pending'`,
      [razorpay_order_id]
    );

    if (rows.length) {
      const order = rows[0];
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
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
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }

  await markWebhookProcessed(eventRecordId);
}

export async function processPaytmWebhookEvent(json, eventRecordId) {
  if (json?.event === 'payment.succeeded' || json?.eventType === 'PAYMENT.SUCCESS') {
    const payment = json?.payload?.payment?.entity || json;
    const orderId = payment?.orderId || payment?.order_id;

    if (orderId) {
      const { rows } = await db.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email
         FROM orders o JOIN users u ON u.id=o.user_id
         WHERE o.paytm_order_id = $1 OR o.id = $1 LIMIT 1`,
        [orderId]
      );
      if (!rows.length) {
        const { rows: fallbackRows } = await db.query(
          `SELECT o.*, u.name as customer_name, u.email as customer_email
           FROM orders o JOIN users u ON u.id=o.user_id
           WHERE o.razorpay_order_id = $1 LIMIT 1`,
          [orderId]
        );
        if (fallbackRows.length) rows.push(fallbackRows[0]);
      }
      if (!rows.length) {
        await markWebhookProcessed(eventRecordId);
        return;
      }

      const order = rows[0];
      const expected = parseFloat(order.final_price || 0);
      const receivedRaw = payment?.txnAmount?.value ?? payment?.amount ?? payment?.amountPaid ?? payment?.orderAmount ?? null;
      const received = receivedRaw ? parseFloat(receivedRaw) : null;
      const paymentId = payment?.id || payment?.txnId;

      if (received !== null && Math.abs(expected - received) > 1.0) {
        await db.query("UPDATE orders SET status='disputed', paytm_txn_id=$1 WHERE id=$2", [paymentId, order.id]);
        await enqueueWebhookEmailJob({ type: 'admin_dispute', args: { orderId: order.id, expected, received, paymentId, gateway: 'Paytm', details: json } });
        await markWebhookProcessed(eventRecordId);
        return;
      }

      const { rows: updated } = await db.query(
        "UPDATE orders SET status='confirmed', paytm_txn_id=$1 WHERE id=$2 AND status='pending' RETURNING *",
        [paymentId, order.id]
      );
      if (updated.length) {
        const { rows: items } = await db.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
        await Promise.all([
          enqueueWebhookEmailJob({ type: 'order_confirmation', args: { to: order.customer_email, name: order.customer_name, orderId: order.id, items, total: order.final_price, discount: order.discount } }),
          enqueueWebhookEmailJob({ type: 'admin_new_order', args: { orderId: order.id, customerName: order.customer_name, customerEmail: order.customer_email, total: order.final_price, itemCount: items.length } }),
        ]);
      }
    }
  }

  await markWebhookProcessed(eventRecordId);
}
