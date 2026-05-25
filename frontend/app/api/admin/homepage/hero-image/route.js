import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERO_KEY = 'hero_desktop';
const MAX_HERO_IMAGE_BYTES = 5 * 1024 * 1024;

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

async function ensureHomepageAssetsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS homepage_assets (
      key TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      public_id TEXT,
      alt TEXT,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function isUploadFile(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.size === 'number'
  );
}

function validateHeroImage(file) {
  if (!isUploadFile(file) || file.size <= 0) {
    return 'Upload a homepage image first.';
  }

  if (file.size > MAX_HERO_IMAGE_BYTES) {
    return 'Homepage image must be 5 MB or smaller.';
  }

  if (file.type && !file.type.startsWith('image/')) {
    return 'Upload a valid image file.';
  }

  return null;
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await ensureHomepageAssetsTable();
    const { rows } = await db.query(
      'SELECT key, url, public_id, alt, updated_at FROM homepage_assets WHERE key = $1 LIMIT 1',
      [HERO_KEY]
    );

    return NextResponse.json({ heroImage: rows[0] || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    logger.error('Homepage hero image GET failed:', err);
    return NextResponse.json({ error: 'Failed to load homepage image' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    await ensureHomepageAssetsTable();

    const formData = await request.formData();
    const file = formData.get('image');
    const alt = String(formData.get('alt') || 'Luxury imported perfumes at Spraykart').trim().slice(0, 180);
    const validationError = validateHeroImage(file);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { rows: previousRows } = await db.query(
      'SELECT public_id FROM homepage_assets WHERE key = $1 LIMIT 1',
      [HERO_KEY]
    );
    const previousPublicId = previousRows[0]?.public_id;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImage(buffer, 'spraykart/homepage');

    const { rows } = await db.query(
      `INSERT INTO homepage_assets (key, url, public_id, alt, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (key)
       DO UPDATE SET
         url = EXCLUDED.url,
         public_id = EXCLUDED.public_id,
         alt = EXCLUDED.alt,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING key, url, public_id, alt, updated_at`,
      [HERO_KEY, uploaded.url, uploaded.public_id, alt, auth.user.id]
    );

    if (previousPublicId && previousPublicId !== uploaded.public_id) {
      await deleteImage(previousPublicId);
    }

    await cache.del('homepage:hero-image');
    revalidatePath('/');

    return NextResponse.json({ heroImage: rows[0] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    logger.error('Homepage hero image POST failed:', err);
    return NextResponse.json({ error: 'Failed to update homepage image' }, { status: 500 });
  }
}
