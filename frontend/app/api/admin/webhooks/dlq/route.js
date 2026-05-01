import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

  const values = ['failed', limit];
  let where = 'WHERE status=$1';
  if (provider) {
    values.push(provider);
    where += ` AND provider=$${values.length}`;
  }

  const { rows } = await db.query(
    `SELECT id, provider, event_id, event_type, status, last_error, retry_count, processed_at, created_at
     FROM webhook_events
     ${where}
     ORDER BY processed_at DESC NULLS LAST, created_at DESC
     LIMIT $2`,
    values
  );

  return NextResponse.json({ events: rows });
}
