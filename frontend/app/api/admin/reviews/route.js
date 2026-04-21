import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const approved = searchParams.get('approved');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const params = [];
  let where = '';
  let i = 1;

  if (approved !== undefined && approved !== null && approved !== '') {
    where = `WHERE r.is_approved = $${i++}`;
    params.push(approved === 'true');
  }

  params.push(limit, offset);

  try {
    const { rows } = await db.query(`
      SELECT r.*, u.name as user_name, u.email as user_email,
             p.name as product_name, p.slug as product_slug
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN products p ON p.id = r.product_id
      ${where} ORDER BY r.created_at DESC
      LIMIT $${i++} OFFSET $${i}`, params);

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
