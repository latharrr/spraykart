const router = require('express').Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// POST /api/apply-coupon
// Body: { code, cart_total, cart_items: [{ id, price, quantity }] }
router.post('/', protect, async (req, res) => {
  const { code, cart_total, cart_items = [] } = req.body;
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

    // Determine the subtotal that the coupon applies to
    const applicableProducts = coupon.applicable_products || [];
    let applicableTotal = cart_total;
    let isProductSpecific = applicableProducts.length > 0;

    if (isProductSpecific && cart_items.length > 0) {
      // Sum only items whose product id is in the applicable list
      applicableTotal = cart_items.reduce((sum, item) => {
        if (applicableProducts.includes(item.id)) {
          return sum + parseFloat(item.price) * (item.quantity || 1);
        }
        return sum;
      }, 0);

      if (applicableTotal === 0) {
        return res.status(400).json({
          error: 'This coupon is not valid for any product in your cart',
        });
      }
    }

    if (cart_total < parseFloat(coupon.min_order)) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${parseFloat(coupon.min_order).toLocaleString('en-IN')} required`,
      });
    }

    let discount = coupon.type === 'percentage'
      ? (applicableTotal * coupon.value) / 100
      : parseFloat(coupon.value);

    discount = Math.min(discount, applicableTotal); // Discount cannot exceed applicable total

    res.json({
      valid: true,
      discount: parseFloat(discount.toFixed(2)),
      applicable_total: parseFloat(applicableTotal.toFixed(2)),
      is_product_specific: isProductSpecific,
      applicable_product_ids: applicableProducts,
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
