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

// ── GET all FAQs (admin — includes inactive) ──────────────────────────────────
export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query(
      'SELECT * FROM faqs ORDER BY sort_order ASC, created_at ASC'
    );
    return NextResponse.json({ faqs: rows });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST create new FAQ ───────────────────────────────────────────────────────
export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const question = formData.get('question')?.toString().trim();
    const answer = formData.get('answer')?.toString().trim();
    const sort_order = parseInt(formData.get('sort_order') || '0');
    const image = formData.get('image'); // File | null

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    let image_url = null;
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'spraykart/faqs', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        ).end(buffer);
      });
      image_url = uploadResult.secure_url;
    }

    const { rows } = await db.query(
      `INSERT INTO faqs (question, answer, image_url, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [question, answer, image_url, sort_order]
    );
    return NextResponse.json({ faq: rows[0] }, { status: 201 });
  } catch (err) {
    console.error('FAQ create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
