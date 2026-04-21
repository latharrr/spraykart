import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { deleteImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const { rows } = await db.query(
      'SELECT * FROM product_images WHERE id=$1 AND product_id=$2',
      [params.imageId, params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    await deleteImage(rows[0].public_id);
    await db.query('DELETE FROM product_images WHERE id=$1', [params.imageId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
