import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { email } from '@/lib/email';
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
  payment_method: z.enum(['online', 'cod']).default('online'),
});

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const { items, shipping_address, coupon_code, razorpay_order_id, idempotency_key, payment_method } = result.data;

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

    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      let price = 0;
      let name = '';

      if (item.variant_id) {
        const { rows: vLock } = await client.query('SELECT id FROM variants WHERE id=$1 AND stock >= $2 FOR UPDATE', [item.variant_id, item.quantity]);
        if (!vLock.length) throw new Error(`Insufficient stock for variant`);

        const { rows: vRows } = await client.query(
          `UPDATE variants SET stock = stock - $1 WHERE id = $2 RETURNING value, price_modifier`,
          [item.quantity, item.variant_id]
        );
        
        const { rows: pRows } = await client.query('SELECT name, price FROM products WHERE id=$1', [item.product_id]);
        price = parseFloat(pRows[0].price) + parseFloat(vRows[0].price_modifier || 0);
        name = `${pRows[0].name} - ${vRows[0].value}`;
      } else {
        const { rows: pLock } = await client.query('SELECT id FROM products WHERE id=$1 AND is_active=true AND stock >= $2 FOR UPDATE', [item.product_id, item.quantity]);
        if (!pLock.length) throw new Error(`Insufficient stock for product`);

        const { rows } = await client.query(
          `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING name, price`,
          [item.quantity, item.product_id]
        );
        price = parseFloat(rows[0].price);
        name = rows[0].name;
      }

      total += price * item.quantity;
      enrichedItems.push({ ...item, price, name });
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
    
    if (payment_method === 'cod' && final_price > 2999) {
      throw new Error('COD is only available for orders up to ₹2,999');
    }

    const initialStatus = payment_method === 'cod' ? 'confirmed' : 'pending';
    
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders(user_id,total_price,discount,final_price,status,razorpay_order_id,coupon_code,shipping_address,idempotency_key,payment_method)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [user.id, total, discount, final_price, initialStatus, razorpay_order_id || null, coupon_code || null, JSON.stringify(shipping_address), idempotency_key || null, payment_method]
    );

    if (orderRows.length === 0) {
      throw new Error('Duplicate order creation detected');
    }
    const order = orderRows[0];

    for (const item of enrichedItems) {
      await client.query(
        'INSERT INTO order_items(order_id,product_id,variant_id,name,price,quantity) VALUES($1,$2,$3,$4,$5,$6)',
        [order.id, item.product_id, item.variant_id || null, item.name, item.price, item.quantity]
      );
    }

    if (payment_method === 'cod') {
      email.sendOrderConfirmation({ 
        to: user.email, 
        name: user.name, 
        orderId: order.id, 
        items: enrichedItems, 
        total: order.final_price, 
        discount: order.discount 
      }).catch(console.error);
      email.sendAdminNewOrder({
        orderId: order.id,
        customerName: user.name,
        customerEmail: user.email,
        total: order.final_price,
        itemCount: enrichedItems.length
      }).catch(console.error);
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
