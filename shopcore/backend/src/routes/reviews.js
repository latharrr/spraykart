const router = require('express').Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  const { product_id, rating, comment } = req.body;

  if (!product_id || !rating)
    return res.status(400).json({ error: 'product_id and rating are required' });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  try {
    // Verify product exists
    const { rows: product } = await db.query(
      'SELECT id FROM products WHERE id=$1 AND is_active=true',
      [product_id]
    );
    if (!product.length) return res.status(404).json({ error: 'Product not found' });

    const { rows } = await db.query(
      `INSERT INTO reviews(user_id, product_id, rating, comment)
       VALUES($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id) DO UPDATE SET rating=$3, comment=$4
       RETURNING *`,
      [req.user.id, product_id, rating, comment?.trim() || null]
    );

    res.status(201).json({
      ...rows[0],
      message: 'Review submitted and pending approval',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:productId — public approved reviews
router.get('/:productId', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
