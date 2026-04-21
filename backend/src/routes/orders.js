const router = require('express').Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrderSchema } = require('../schemas/order.schema');
const logger = require('../utils/logger');

// POST /api/orders — Create order (called BEFORE Razorpay opens, as pending)
router.post('/', protect, validate(createOrderSchema), async (req, res) => {
  const { items, shipping_address, coupon_code, razorpay_order_id, idempotency_key } = req.body;

  // ─── Idempotency Check ────────────────────────────────────────────────────
  // If the client sends the same idempotency_key twice (retry/double-click),
  // return the existing order instead of creating a duplicate.
  if (idempotency_key) {
    const { rows: existing } = await db.query(
      'SELECT * FROM orders WHERE idempotency_key=$1 AND user_id=$2',
      [idempotency_key, req.user.id]
    );
    if (existing.length) {
      logger.info(`Idempotent order returned for key ${idempotency_key}`);
      return res.status(200).json(existing[0]);
    }
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      // ─── Inventory Locking ──────────────────────────────────────────────
      // The AND stock >= $1 ensures we only decrement if stock is sufficient.
      // This prevents overselling under concurrent requests.
      const { rows } = await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2 AND is_active = true AND stock >= $1
         RETURNING id, name, price, stock`,
        [item.quantity, item.product_id]
      );

      if (!rows.length) {
        // Either product not found, inactive, or insufficient stock
        const { rows: product } = await client.query(
          'SELECT name, stock FROM products WHERE id=$1',
          [item.product_id]
        );
        if (!product.length) throw new Error(`Product not found: ${item.product_id}`);
        throw new Error(`Insufficient stock for "${product[0].name}" (available: ${product[0].stock})`);
      }

      const product = rows[0];
      const price = parseFloat(product.price);
      total += price * item.quantity;
      enrichedItems.push({ ...item, price, name: product.name });
    }

    // ─── Coupon Validation ────────────────────────────────────────────────
    let discount = 0;
    if (coupon_code) {
      const { rows: c } = await client.query(
        `SELECT * FROM coupons WHERE code=$1 AND is_active=true
         AND (expiry_date IS NULL OR expiry_date >= NOW())
         AND used_count < max_uses`,
        [coupon_code.toUpperCase()]
      );
      if (c.length) {
        const coupon = c[0];
        if (total >= coupon.min_order) {
          discount = coupon.type === 'percentage'
            ? (total * coupon.value) / 100
            : coupon.value;
          discount = Math.min(discount, total); // Discount can't exceed total
          await client.query(
            'UPDATE coupons SET used_count = used_count + 1 WHERE id=$1',
            [coupon.id]
          );
        }
      }
    }

    const final_price = Math.max(0, total - discount);

    // ─── Insert Order ─────────────────────────────────────────────────────
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders(user_id,total_price,discount,final_price,status,razorpay_order_id,coupon_code,shipping_address,idempotency_key)
       VALUES($1,$2,$3,$4,'pending',$5,$6,$7,$8) RETURNING *`,
      [req.user.id, total, discount, final_price, razorpay_order_id, coupon_code, JSON.stringify(shipping_address), idempotency_key || null]
    );
    const order = orderRows[0];

    for (const item of enrichedItems) {
      await client.query(
        'INSERT INTO order_items(order_id,product_id,variant_id,name,price,quantity) VALUES($1,$2,$3,$4,$5,$6)',
        [order.id, item.product_id, item.variant_id || null, item.name, item.price, item.quantity]
      );
    }

    await client.query('COMMIT');
    logger.info(`Order created: ${order.id} by user ${req.user.id}, total ₹${final_price}`);
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Order creation failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/orders/me
router.get('/me', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/me/:id
router.get('/me/:id', protect, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
       WHERE o.id=$1 AND o.user_id=$2 GROUP BY o.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
