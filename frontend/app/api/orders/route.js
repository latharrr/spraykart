import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { email } from '@/lib/email';
import logger from '@/lib/logger';
import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(100),
});

const shippingSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  line1: z.string().min(5).max(255).trim(),
  line2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/),
  phone: z.string().regex(/^\d{10}$/),
  email: z.string().email().max(255).trim().optional(),
});

const schema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  shipping_address: shippingSchema,
  coupon_code: z.string().max(50).trim().optional(),
  razorpay_order_id: z.string().optional().nullable(),
  paytm_order_id: z.string().optional().nullable(),
  idempotency_key: z.string().optional(),
  payment_method: z.enum(['online', 'cod']).default('online'),
});

function aggregateItems(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.product_id}:${item.variant_id || 'base'}`;
    const current = map.get(key);
    if (current) current.quantity += item.quantity;
    else map.set(key, { ...item, variant_id: item.variant_id || null });
  }
  return [...map.values()];
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { shipping_address, coupon_code, razorpay_order_id, paytm_order_id, idempotency_key, payment_method } = result.data;
  const items = aggregateItems(result.data.items);
  const overLimit = items.find((item) => item.quantity > 100);
  if (overLimit) {
    return NextResponse.json({ error: 'Quantity cannot exceed 100 for a single item' }, { status: 400 });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (idempotency_key) {
      const { rows: existing } = await client.query(
        'SELECT * FROM orders WHERE idempotency_key=$1 AND user_id=$2',
        [idempotency_key, user.id]
      );
      if (existing.length) {
        await client.query('ROLLBACK');
        return NextResponse.json(existing[0]);
      }
    }

    const variantItems = items.filter((item) => item.variant_id);
    const productItems = items.filter((item) => !item.variant_id);
    const variantRows = variantItems.length
      ? await client.query(
          `SELECT v.id as variant_id, v.product_id, v.value, v.price_modifier, v.stock as available_qty,
                  p.name, p.price, p.hsn_code, p.gst_rate
           FROM variants v
           JOIN products p ON p.id=v.product_id
           WHERE v.id = ANY($1::uuid[]) AND p.is_active=true
           FOR UPDATE OF v`,
          [variantItems.map((item) => item.variant_id)]
        )
      : { rows: [] };
    const productRows = productItems.length
      ? await client.query(
          `SELECT p.id as product_id, p.stock as available_qty, p.name, p.price, p.hsn_code, p.gst_rate
           FROM products p
           WHERE p.id = ANY($1::uuid[]) AND p.is_active=true
           FOR UPDATE`,
          [productItems.map((item) => item.product_id)]
        )
      : { rows: [] };

    const variantMap = new Map(variantRows.rows.map((row) => [row.variant_id, row]));
    const productMap = new Map(productRows.rows.map((row) => [row.product_id, row]));

    const availability = items.map((item) => {
      const stockRow = item.variant_id ? variantMap.get(item.variant_id) : productMap.get(item.product_id);
      const productMismatch = item.variant_id && stockRow && stockRow.product_id !== item.product_id;
      return {
        id: item.variant_id || item.product_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        requested_qty: item.quantity,
        available_qty: stockRow && !productMismatch ? Number(stockRow.available_qty) : 0,
      };
    });

    const insufficient = availability.filter((row) => row.available_qty < row.requested_qty);
    if (insufficient.length) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Insufficient stock for one or more items', insufficient_items: insufficient },
        { status: 409 }
      );
    }

    let total = 0;
    const enrichedItems = [];
    for (const item of items) {
      const row = item.variant_id ? variantMap.get(item.variant_id) : productMap.get(item.product_id);
      if (item.variant_id) {
        await client.query('UPDATE variants SET stock = stock - $1 WHERE id=$2', [item.quantity, item.variant_id]);
      } else {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [item.quantity, item.product_id]);
      }

      const price = item.variant_id
        ? Number(row.price) + Number(row.price_modifier || 0)
        : Number(row.price);
      const name = item.variant_id ? `${row.name} - ${row.value}` : row.name;
      total += price * item.quantity;
      enrichedItems.push({
        ...item,
        price,
        name,
        hsn_code: row.hsn_code,
        gst_rate: row.gst_rate || 18,
      });
    }

    let discount = 0;
    let hasFreeShippingCoupon = false;

    if (coupon_code) {
      const { rows: c } = await client.query(
        `SELECT * FROM coupons WHERE code=$1 AND is_active=true
         AND (expiry_date IS NULL OR expiry_date >= NOW()) AND used_count < max_uses`,
        [coupon_code.toUpperCase()]
      );
      if (c.length && total >= c[0].min_order) {
        discount = c[0].type === 'percentage' ? (total * c[0].value) / 100 : Number(c[0].value);
        discount = Math.min(discount, total);
        hasFreeShippingCoupon = c[0].free_shipping === true;
        const { rows: updated } = await client.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id=$1 AND used_count < max_uses RETURNING *',
          [c[0].id]
        );
        if (!updated.length) throw new Error('Coupon usage limit reached');
      }
    }

    const subtotalAfterDiscount = Math.max(0, total - discount);
    const shipping = (subtotalAfterDiscount >= 999 || hasFreeShippingCoupon) ? 0 : 49;
    const final_price = subtotalAfterDiscount + shipping;

    if (payment_method === 'cod' && final_price > 2999) {
      throw new Error('COD is only available for orders up to Rs. 2,999');
    }

    const initialStatus = payment_method === 'cod' ? 'confirmed' : 'pending';
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders(user_id,total_price,discount,final_price,status,razorpay_order_id,paytm_order_id,coupon_code,shipping_address,idempotency_key,payment_method)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [user.id, total, discount, final_price, initialStatus, razorpay_order_id || null, paytm_order_id || null, coupon_code || null, JSON.stringify(shipping_address), idempotency_key || null, payment_method]
    );

    if (!orderRows.length) {
      if (idempotency_key) {
        const { rows: existing } = await client.query(
          'SELECT * FROM orders WHERE idempotency_key=$1 AND user_id=$2',
          [idempotency_key, user.id]
        );
        if (existing.length) {
          await client.query('COMMIT');
          return NextResponse.json(existing[0], { status: 200 });
        }
      }
      throw new Error('Duplicate order creation detected but could not retrieve existing order');
    }

    const order = orderRows[0];
    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items(order_id,product_id,variant_id,name,price,quantity,hsn_code,gst_rate,reserved_until)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $9='pending' THEN NOW() + INTERVAL '10 minutes' ELSE NULL END)`,
        [order.id, item.product_id, item.variant_id || null, item.name, item.price, item.quantity, item.hsn_code || null, item.gst_rate || 18, initialStatus]
      );
    }

    if (payment_method === 'cod') {
      email.sendOrderConfirmation({
        to: user.email,
        name: user.name,
        orderId: order.id,
        items: enrichedItems,
        total: order.final_price,
        discount: order.discount,
      }).catch((err) => logger.error('Order confirmation email failed:', err));
      email.sendAdminNewOrder({
        orderId: order.id,
        customerName: user.name,
        customerEmail: user.email,
        total: order.final_price,
        itemCount: enrichedItems.length,
      }).catch((err) => logger.error('Admin new order email failed:', err));
    }

    await client.query('COMMIT');
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Order creation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
}
