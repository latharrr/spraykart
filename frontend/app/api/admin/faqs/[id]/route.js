import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

// ── PATCH update a FAQ ───────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = params;
  try {
    const formData = await request.formData();
    const question = formData.get('question')?.toString().trim();
    const answer = formData.get('answer')?.toString().trim();
    const sort_order = formData.get('sort_order');
    const is_active = formData.get('is_active');
    const image = formData.get('image');
    const remove_image = formData.get('remove_image') === 'true';

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // Handle image
    let image_url_update = null;
    let updateImageUrl = false;

    if (remove_image) {
      image_url_update = null;
      updateImageUrl = true;
    } else if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'spraykart/faqs', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        ).end(buffer);
      });
      image_url_update = uploadResult.secure_url;
      updateImageUrl = true;
    }

    const sets = [
      'question = $1',
      'answer = $2',
      'sort_order = $3',
      'is_active = $4',
      'updated_at = NOW()',
    ];
    const vals = [question, answer, sort_order ?? 0, is_active !== 'false'];

    if (updateImageUrl) {
      sets.push(`image_url = $${vals.length + 1}`);
      vals.push(image_url_update);
    }

    vals.push(id);
    const { rows } = await db.query(
      `UPDATE faqs SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (!rows.length) return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    return NextResponse.json({ faq: rows[0] });
  } catch (err) {
    console.error('FAQ update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE a FAQ ─────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await db.query('DELETE FROM faqs WHERE id = $1', [params.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
