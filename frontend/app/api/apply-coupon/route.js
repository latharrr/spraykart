import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';

import cache from '@/lib/cache';
import rateLimit from '@/lib/rateLimit';
import logger from '@/lib/logger';

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    try {
      await rateLimit({ prefix: 'coupon', id: ip, limit: 10, windowSec: 3600 });
    } catch (rlErr) {
      if (rlErr && rlErr.code === 'RATE_LIMIT_EXCEEDED') return NextResponse.json({ error: 'Too many coupon attempts. Please try again later.' }, { status: 429 });
    }

    const { code, cart_items = [] } = await request.json();
    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    // Recompute cart total server-side using DB prices (prevent client price manipulation)
    // The cart payload uses `id` for the product id (see lib/store.js spread); accept either.
    const productIds = [...new Set(
      cart_items.map(item => item.product_id || item.id).filter(Boolean)
    )];
    let cart_total = 0;
    const priceMap = new Map();
    if (productIds.length > 0) {
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      const { rows: dbProducts } = await db.query(
        `SELECT id, price FROM products WHERE id IN (${placeholders}) AND is_active = true`,
        productIds
      );
      for (const p of dbProducts) priceMap.set(p.id, parseFloat(p.price));

      for (const item of cart_items) {
        const pid = item.product_id || item.id;
        const dbPrice = priceMap.get(pid);
        if (dbPrice) {
          cart_total += dbPrice * (item.quantity || 1);
        }
      }
    }
    if (cart_total <= 0) return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });

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
      // Use DB-priced subtotal for the coupon-applicable subset (no client-supplied prices)
      applicableTotal = cart_items.reduce((sum, item) => {
        const pid = item.product_id || item.id;
        if (!applicableProducts.includes(pid)) return sum;
        const dbPrice = priceMap.get(pid);
        if (!dbPrice) return sum;
        return sum + dbPrice * (item.quantity || 1);
      }, 0);
      if (applicableTotal === 0) {
        return NextResponse.json({ error: 'This coupon is not valid for any product in your cart' }, { status: 400 });
      }
    }

    const thresholdTotal = isProductSpecific ? applicableTotal : cart_total;
    if (thresholdTotal < parseFloat(coupon.min_order)) {
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
    // Don't leak DB internals to clients
    logger.error('Apply coupon error:', err);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}
