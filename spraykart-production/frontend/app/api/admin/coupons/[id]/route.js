import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

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
    const { type, value, min_order, max_uses, expiry_date, is_active, applicable_products } = await request.json();
    const { rows } = await db.query(
      `UPDATE coupons SET
        type=COALESCE($1,type), value=COALESCE($2,value),
        min_order=COALESCE($3,min_order), max_uses=COALESCE($4,max_uses),
        expiry_date=$5, is_active=COALESCE($6,is_active),
        applicable_products=$7
       WHERE id=$8 RETURNING *`,
      [type, value, min_order, max_uses, expiry_date || null, is_active,
       applicable_products?.length ? applicable_products : null, params.id]
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
