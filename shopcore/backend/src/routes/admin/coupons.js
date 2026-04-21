const router = require('express').Router();
const db = require('../../config/db');
const { protect, adminOnly } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { createCouponSchema } = require('../../schemas/product.schema');
const logger = require('../../utils/logger');

router.use(protect, adminOnly);

// GET /api/admin/coupons
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/coupons
router.post('/', validate(createCouponSchema), async (req, res) => {
  const { code, type, value, min_order, max_uses, expiry_date, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO coupons(code,type,value,min_order,max_uses,expiry_date,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code, type, value, min_order || 0, max_uses || 100, expiry_date || null, is_active ?? true]
    );
    logger.info(`Admin created coupon: ${code}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/coupons/:id
router.put('/:id', async (req, res) => {
  const { type, value, min_order, max_uses, expiry_date, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE coupons SET
        type=COALESCE($1,type), value=COALESCE($2,value),
        min_order=COALESCE($3,min_order), max_uses=COALESCE($4,max_uses),
        expiry_date=$5, is_active=COALESCE($6,is_active)
       WHERE id=$7 RETURNING *`,
      [type, value, min_order, max_uses, expiry_date || null, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Coupon not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM coupons WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
