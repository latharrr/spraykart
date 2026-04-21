const router = require('express').Router();
const db = require('../../config/db');
const { protect, adminOnly } = require('../../middleware/auth');
const logger = require('../../utils/logger');

router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = "WHERE role = 'customer'";
  let i = 1;

  if (search) {
    where += ` AND (name ILIKE $${i++} OR email ILIKE $${i++})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  params.push(parseInt(limit), parseInt(offset));

  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, is_blocked, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id=users.id) as order_count,
              (SELECT COALESCE(SUM(final_price),0) FROM orders WHERE user_id=users.id AND status!='cancelled') as total_spent
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM users ${where}`,
      params.slice(0, -2)
    );

    res.json({
      users: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countRows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/toggle-block
router.put('/:id/toggle-block', async (req, res) => {
  try {
    // Prevent blocking yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const { rows } = await db.query(
      `UPDATE users SET is_blocked = NOT is_blocked
       WHERE id=$1 AND role='customer'
       RETURNING id, name, email, is_blocked`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    logger.info(`Admin ${req.params.id === req.user.id ? 'N/A' : 'toggled'} block for user ${rows[0].email}: is_blocked=${rows[0].is_blocked}`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
