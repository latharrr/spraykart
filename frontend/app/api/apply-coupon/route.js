import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { code, cart_total, cart_items = [] } = await request.json();
    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    if (!cart_total || cart_total <= 0) return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });

    const { rows } = await db.query(
      `SELECT * FROM coupons WHERE code=$1 AND is_active=true
       AND (expiry_date IS NULL OR expiry_date >= NOW()) AND used_count < max_uses`,
      [code.toUpperCase().trim()]
    );
    if (!rows.length) return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });

    const coupon = rows[0];
    const applicableProducts = coupon.applicable_products || [];
    const isProductSpecific = applicableProducts.length > 0;

    let applicableTotal = cart_total;
    if (isProductSpecific && cart_items.length > 0) {
      applicableTotal = cart_items.reduce((sum, item) => {
        if (applicableProducts.includes(item.id)) return sum + parseFloat(item.price) * (item.quantity || 1);
        return sum;
      }, 0);
      if (applicableTotal === 0) {
        return NextResponse.json({ error: 'This coupon is not valid for any product in your cart' }, { status: 400 });
      }
    }

    if (cart_total < parseFloat(coupon.min_order)) {
      return NextResponse.json({ error: `Minimum order of ₹${parseFloat(coupon.min_order).toLocaleString('en-IN')} required` }, { status: 400 });
    }

    let discount = coupon.type === 'percentage'
      ? (applicableTotal * coupon.value) / 100
      : parseFloat(coupon.value);
    discount = Math.min(discount, applicableTotal);

    return NextResponse.json({
      valid: true,
      discount: parseFloat(discount.toFixed(2)),
      applicable_total: parseFloat(applicableTotal.toFixed(2)),
      is_product_specific: isProductSpecific,
      applicable_product_ids: applicableProducts,
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value, free_shipping: coupon.free_shipping },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
