const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { verifyPaymentSchema } = require('../schemas/order.schema');
const email = require('../services/email.service');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create — Step 1: create Razorpay order
router.post('/create', protect, paymentLimiter, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ order_id: order.id, currency: order.currency, amount: order.amount });
  } catch (err) {
    logger.error(`Razorpay create order failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/verify — Step 2: verify signature & confirm order (fast path)
router.post('/verify', protect, paymentLimiter, validate(verifyPaymentSchema), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    logger.warn(`Payment signature mismatch for order ${razorpay_order_id}`);
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  try {
    await db.query(
      `UPDATE orders SET status='confirmed', razorpay_payment_id=$1
       WHERE razorpay_order_id=$2 AND user_id=$3 AND status='pending'`,
      [razorpay_payment_id, razorpay_order_id, req.user.id]
    );
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    logger.error(`Payment verify DB update failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// POST /api/payments/webhook — Razorpay server-to-server callback (reliable fallback)
// NOTE: This route receives RAW body (set up in server.js before express.json)
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) return res.status(400).json({ error: 'Missing signature' });

  // ─── Verify HMAC Signature ────────────────────────────────────────────────
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw Buffer
    .digest('hex');

  if (expectedSig !== signature) {
    logger.warn('Razorpay webhook: invalid signature');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  logger.info(`Razorpay webhook event: ${event.event}`);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { order_id: razorpay_order_id, id: razorpay_payment_id, amount, currency } = payment;

    try {
      // ─── Fetch the order from our DB to validate ────────────────────────
      const { rows } = await db.query(
        `SELECT o.*, u.name as customer_name, u.email as customer_email
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE o.razorpay_order_id = $1`,
        [razorpay_order_id]
      );

      if (!rows.length) {
        logger.warn(`Webhook: No DB order found for razorpay_order_id ${razorpay_order_id}`);
        return res.json({ received: true }); // Acknowledge to prevent Razorpay retries
      }

      const order = rows[0];

      // ─── Verify amount and currency match ──────────────────────────────
      const expectedAmountPaise = Math.round(parseFloat(order.final_price) * 100);
      if (amount !== expectedAmountPaise || currency !== 'INR') {
        logger.error(`Webhook amount mismatch: expected ${expectedAmountPaise}, got ${amount} ${currency} for order ${order.id}`);
        return res.status(400).json({ error: 'Amount or currency mismatch' });
      }

      // ─── Idempotent status update ───────────────────────────────────────
      const { rows: updated } = await db.query(
        `UPDATE orders SET status='confirmed', razorpay_payment_id=$1
         WHERE razorpay_order_id=$2 AND status='pending'
         RETURNING *`,
        [razorpay_payment_id, razorpay_order_id]
      );

      if (updated.length) {
        logger.info(`Webhook confirmed order ${order.id} via webhook`);

        // Fetch order items for the email
        const { rows: items } = await db.query(
          'SELECT * FROM order_items WHERE order_id=$1',
          [order.id]
        );

        // Fire emails asynchronously (don't block webhook response)
        Promise.all([
          email.sendOrderConfirmation({
            to: order.customer_email,
            name: order.customer_name,
            orderId: order.id,
            items,
            total: order.final_price,
          }),
          email.sendAdminNewOrder({
            orderId: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            total: order.final_price,
            itemCount: items.length,
          }),
        ]).catch((err) => logger.error(`Webhook email send failed: ${err.message}`));
      } else {
        logger.info(`Webhook: order ${razorpay_order_id} already confirmed — idempotent skip`);
      }
    } catch (err) {
      logger.error(`Webhook processing error: ${err.message}`);
      // Still return 200 to prevent Razorpay from retrying with bad data
    }
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    logger.warn(`Payment failed for razorpay_order_id: ${payment.order_id}`);
    // Optionally update order status to 'payment_failed' here
  }

  res.json({ received: true });
});

module.exports = router;
