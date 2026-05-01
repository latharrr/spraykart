import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import logger from '@/lib/logger';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

async function ensureContactTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
      ON contact_submissions(created_at DESC)
  `);
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const offset = (page - 1) * limit;

  try {
    await ensureContactTable();

    const [countResult, rowsResult] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM contact_submissions'),
      db.query(
        `SELECT id, name, email, message, created_at
         FROM contact_submissions
         ORDER BY created_at DESC
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
    logger.error('Contact submissions admin fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
