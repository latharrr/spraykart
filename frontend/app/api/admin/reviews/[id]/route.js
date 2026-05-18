import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import cache from '@/lib/cache';
import logger from '@/lib/logger';

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query(
      `DELETE FROM reviews WHERE id=$1
       RETURNING id, product_id, user_id, rating, comment,
                 (SELECT slug FROM products WHERE id=reviews.product_id) AS product_slug`,
      [params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const deleted = rows[0];
    if (deleted.product_slug) await cache.del(`product:${deleted.product_slug}`);

    await logAdminAction({
      adminId: user.id,
      action: 'review.delete',
      targetType: 'review',
      targetId: deleted.id,
      before: { rating: deleted.rating, comment: deleted.comment, product_id: deleted.product_id, user_id: deleted.user_id },
      request,
    }).catch((err) => logger.error('Audit log failed (review.delete):', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Admin review delete failed:', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
