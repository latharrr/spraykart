const router = require('express').Router();
const db = require('../../config/db');
const { protect, adminOnly } = require('../../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/reviews
router.get('/', async (req, res) => {
  const { approved, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';
  let i = 1;

  if (approved !== undefined) {
    where = `WHERE r.is_approved = $${i++}`;
    params.push(approved === 'true');
  }

  params.push(parseInt(limit), parseInt(offset));

  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name, p.slug as product_slug
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reviews/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE reviews SET is_approved=true WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Review not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM reviews WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Review not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
