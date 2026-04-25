import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  type: z.enum(['percentage', 'flat']),
  value: z.coerce.number().min(0),
  min_order: z.coerce.number().min(0).default(0),
  max_uses: z.coerce.number().int().min(1).default(100),
  expiry_date: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
  free_shipping: z.boolean().default(false),
  applicable_products: z.array(z.string().uuid()).default([]),
});

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query(
      `SELECT *, COALESCE(applicable_products, '{}') as applicable_products
       FROM coupons ORDER BY created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });

    const { code, type, value, min_order, max_uses, expiry_date, is_active, free_shipping, applicable_products } = result.data;
    const { rows } = await db.query(
      `INSERT INTO coupons(code,type,value,min_order,max_uses,expiry_date,is_active,free_shipping,applicable_products)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code, type, value, min_order, max_uses, expiry_date || null, is_active, free_shipping, applicable_products.length ? applicable_products : null]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err.code === '23505') return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
