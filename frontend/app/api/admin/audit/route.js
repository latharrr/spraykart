import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const targetType = searchParams.get('target_type');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  const where = [];
  const values = [];
  let i = 1;
  if (action) {
    where.push(`aal.action ILIKE $${i++}`);
    values.push(`%${action}%`);
  }
  if (targetType) {
    where.push(`aal.target_type=$${i++}`);
    values.push(targetType);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  values.push(limit, offset);
  const limitIndex = i++;
  const offsetIndex = i;
  const countValues = values.slice(0, values.length - 2);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    db.query(
      `SELECT aal.*, u.email as admin_email, u.name as admin_name
       FROM admin_audit_log aal
       LEFT JOIN users u ON u.id=aal.admin_id
       ${whereSql}
       ORDER BY aal.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values
    ),
    db.query(`SELECT COUNT(*) FROM admin_audit_log aal ${whereSql}`, countValues),
  ]);

  return NextResponse.json({
    events: rows,
    total: Number(countRows[0].count),
    page,
    pages: Math.ceil(Number(countRows[0].count) / limit),
  });
}
