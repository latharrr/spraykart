import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  if (params.id === user.id) {
    return NextResponse.json({ error: 'You cannot block yourself' }, { status: 400 });
  }

  try {
    const { rows } = await db.query(
      `UPDATE users SET is_blocked = NOT is_blocked
       WHERE id=$1 AND role='customer'
       RETURNING id, name, email, is_blocked`,
      [params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
