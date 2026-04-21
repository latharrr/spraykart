import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(100),
});

const shippingSchema = z.object({
  line1: z.string().min(5).max(255).trim(),
  line2: z.string().max(255).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/),
  phone: z.string().regex(/^\d{10}$/),
});

const schema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  shipping_address: shippingSchema,
  coupon_code: z.string().max(50).trim().optional(),
  razorpay_order_id: z.string().optional(),
  idempotency_key: z.string().optional(),
});

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { items, shipping_address, coupon_code, razorpay_order_id, idempotency_key } = result.data;

  if (idempotency_key) {
    const { rows: existing } = await db.query(
      'SELECT * FROM orders WHERE idempotency_key=$1 AND user_id=$2',
      [idempotency_key, user.id]
    );
    if (existing.length) return NextResponse.json(existing[0]);
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      const { rows } = await client.query(
        `UPDATE products SET stock = stock - $1
         WHERE id = $2 AND is_active = true AND stock >= $1
         RETURNING id, name, price, stock`,
        [item.quantity, item.product_id]
      );
      if (!rows.length) {
        const { rows: p } = await client.query('SELECT name, stock FROM products WHERE id=$1', [item.product_id]);
        throw new Error(p.length ? `Insufficient stock for "${p[0].name}" (available: ${p[0].stock})` : `Product not found: ${item.product_id}`);
      }
      const price = parseFloat(rows[0].price);
      total += price * item.quantity;
      enrichedItems.push({ ...item, price, name: rows[0].name });
    }

    let discount = 0;
    if (coupon_code) {
      const { rows: c } = await client.query(
        `SELECT * FROM coupons WHERE code=$1 AND is_active=true
         AND (expiry_date IS NULL OR expiry_date >= NOW()) AND used_count < max_uses`,
        [coupon_code.toUpperCase()]
      );
      if (c.length && total >= c[0].min_order) {
        discount = c[0].type === 'percentage' ? (total * c[0].value) / 100 : c[0].value;
        discount = Math.min(discount, total);
        await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id=$1', [c[0].id]);
      }
    }

    const final_price = Math.max(0, total - discount);
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders(user_id,total_price,discount,final_price,status,razorpay_order_id,coupon_code,shipping_address,idempotency_key)
       VALUES($1,$2,$3,$4,'pending',$5,$6,$7,$8) RETURNING *`,
      [user.id, total, discount, final_price, razorpay_order_id || null, coupon_code || null, JSON.stringify(shipping_address), idempotency_key || null]
    );
    const order = orderRows[0];

    for (const item of enrichedItems) {
      await client.query(
        'INSERT INTO order_items(order_id,product_id,variant_id,name,price,quantity) VALUES($1,$2,$3,$4,$5,$6)',
        [order.id, item.product_id, item.variant_id || null, item.name, item.price, item.quantity]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
}
