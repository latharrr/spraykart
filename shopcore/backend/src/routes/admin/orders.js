const router = require('express').Router();
const db = require('../../config/db');
const { protect, adminOnly } = require('../../middleware/auth');
const email = require('../../services/email.service');
const logger = require('../../utils/logger');

router.use(protect, adminOnly);

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders
router.get('/', async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  let i = 1;

  if (status && VALID_STATUSES.includes(status)) {
    where = `WHERE o.status = $${i++}`;
    params.push(status);
  }

  params.push(parseInt(limit), parseInt(offset));
  const limitIdx = i++;
  const offsetIdx = i;

  try {
    const { rows } = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email,
              json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.name, u.email
       ORDER BY o.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(DISTINCT o.id) FROM orders o ${where}`,
      params.slice(0, -2)
    );

    res.json({
      orders: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countRows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email,
              json_agg(oi.* ORDER BY oi.id) as items
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id, u.name, u.email`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/orders/:id — update status + trigger email
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const { rows } = await db.query(
      `UPDATE orders SET status=$1 WHERE id=$2
       RETURNING *, (SELECT name FROM users WHERE id=orders.user_id) as customer_name,
                    (SELECT email FROM users WHERE id=orders.user_id) as customer_email`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const order = rows[0];
    logger.info(`Admin updated order ${order.id} to status: ${status}`);

    // Send status update email asynchronously
    if (['shipped', 'delivered', 'cancelled'].includes(status)) {
      email.sendOrderStatusUpdate({
        to: order.customer_email,
        name: order.customer_name,
        orderId: order.id,
        status,
      }).catch((err) => logger.error(`Status email failed: ${err.message}`));
    }

    res.json(order);
  } catch (err) {
    logger.error(`Order status update failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
