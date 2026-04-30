import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const offset = (page - 1) * limit;

  try {
    const [countResult, rowsResult] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM fragrance_finder_submissions'),
      db.query(
        `SELECT s.id, s.answers, s.result_url, s.created_at,
                u.name AS user_name, u.email AS user_email
         FROM fragrance_finder_submissions s
         LEFT JOIN users u ON u.id = s.user_id
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total = countResult.rows[0]?.total || 0;

    return NextResponse.json({
      submissions: rowsResult.rows,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (err) {
    console.error('Fragrance finder admin fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}