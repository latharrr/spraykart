import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query('DELETE FROM reviews WHERE id=$1 RETURNING id', [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
