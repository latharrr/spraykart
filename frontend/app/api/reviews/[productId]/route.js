import { NextResponse } from 'next/server';
import db from '@/lib/db';
import logger from '@/lib/logger';

export async function GET(request, { params }) {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id=$1 AND r.is_approved=true
       ORDER BY r.created_at DESC LIMIT 20`,
      [params.productId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    logger.error('Reviews GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
