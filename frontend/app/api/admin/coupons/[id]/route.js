import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['percentage', 'flat']).optional(),
  value: z.coerce.number().min(0).optional(),
  min_order: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().min(1).optional(),
  expiry_date: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
  free_shipping: z.boolean().optional(),
  applicable_products: z.array(z.string().uuid()).optional().nullable(),
});

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (result.data.type !== undefined) {
      updates.push(`type = $${idx++}`);
      values.push(result.data.type);
    }
    if (result.data.value !== undefined) {
      updates.push(`value = $${idx++}`);
      values.push(result.data.value);
    }
    if (result.data.min_order !== undefined) {
      updates.push(`min_order = $${idx++}`);
      values.push(result.data.min_order);
    }
    if (result.data.max_uses !== undefined) {
      updates.push(`max_uses = $${idx++}`);
      values.push(result.data.max_uses);
    }
    if ('expiry_date' in result.data) {
      updates.push(`expiry_date = $${idx++}`);
      values.push(result.data.expiry_date || null);
    }
    if (result.data.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(result.data.is_active);
    }
    if (result.data.free_shipping !== undefined) {
      updates.push(`free_shipping = $${idx++}`);
      values.push(result.data.free_shipping);
    }
    if ('applicable_products' in result.data) {
      updates.push(`applicable_products = $${idx++}`);
      if (result.data.applicable_products === null) {
        values.push(null);
      } else {
        values.push(result.data.applicable_products?.length ? result.data.applicable_products : null);
      }
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    values.push(params.id);
    const { rows } = await db.query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id=$${idx} RETURNING *`,
      values
    );
    if (!rows.length) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query('DELETE FROM coupons WHERE id=$1 RETURNING id', [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
