import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import cache from '@/lib/cache';
import logger from '@/lib/logger';

export async function PUT(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const { rows } = await db.query(
      `UPDATE reviews SET is_approved=true
       WHERE id=$1
       RETURNING id, product_id, rating, is_approved,
                 (SELECT slug FROM products WHERE id=reviews.product_id) AS product_slug`,
      [params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (rows[0].product_slug) await cache.del(`product:${rows[0].product_slug}`);

    await logAdminAction({
      adminId: user.id,
      action: 'review.approve',
      targetType: 'review',
      targetId: rows[0].id,
      after: { is_approved: true, product_id: rows[0].product_id },
      request,
    }).catch((err) => logger.error('Audit log failed (review.approve):', err));

    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error('Admin review approve failed:', err);
    return NextResponse.json({ error: 'Failed to approve review' }, { status: 500 });
  }
}
