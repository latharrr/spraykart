const router = require('express').Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// POST /api/apply-coupon
router.post('/', protect, async (req, res) => {
  const { code, cart_total } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });
  if (!cart_total || cart_total <= 0) return res.status(400).json({ error: 'Invalid cart total' });

  try {
    const { rows } = await db.query(
      `SELECT * FROM coupons WHERE code=$1 AND is_active=true
       AND (expiry_date IS NULL OR expiry_date >= NOW())
       AND used_count < max_uses`,
      [code.toUpperCase().trim()]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invalid or expired coupon' });

    const coupon = rows[0];
    if (cart_total < parseFloat(coupon.min_order)) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${parseFloat(coupon.min_order).toLocaleString('en-IN')} required`,
      });
    }

    let discount = coupon.type === 'percentage'
      ? (cart_total * coupon.value) / 100
      : parseFloat(coupon.value);

    discount = Math.min(discount, cart_total); // Discount cannot exceed cart total

    res.json({
      valid: true,
      discount: parseFloat(discount.toFixed(2)),
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
