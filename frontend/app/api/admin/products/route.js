import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { validateProductImageFiles } from '@/lib/uploadLimits';
import logger from '@/lib/logger';
import slugify from 'slugify';

export const runtime = 'nodejs';

// Allow safe HTML formatting tags; strip dangerous ones
const sanitizeHtml = (str) => {
  if (!str) return null;
  // Strip dangerous tags but keep safe formatting
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 10000);
};

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query(`
      SELECT p.*,
        (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image,
        (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE oi.product_id=p.id AND o.status!='cancelled') as units_sold
      FROM products p ORDER BY p.created_at DESC`);
    return NextResponse.json(rows);
  } catch (err) {
    logger.error('Admin products GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const client = await db.pool.connect();
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const price = formData.get('price');
    const compare_price = formData.get('compare_price');
    const stock = formData.get('stock');
    const category = formData.get('category');
    const is_featured = formData.get('is_featured') === 'true';
    const meta_title = formData.get('meta_title');
    const meta_description = formData.get('meta_description');
    const hsn = formData.get('hsn');
    const gst = formData.get('gst');
    const variantsRaw = formData.get('variants');

    // Fragrance notes
    const top_notes = formData.get('top_notes');
    const heart_notes = formData.get('heart_notes');
    const base_notes = formData.get('base_notes');
    const scent_family = formData.get('scent_family');
    const longevity = formData.get('longevity');
    const sillage = formData.get('sillage');
    const season = formData.get('season');
    const occasion = formData.get('occasion');

    const { files: imageFiles, error: uploadError } = validateProductImageFiles(formData);
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: uploadError.status });
    }

    if (!name || !price) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });

    const slug = slugify(name, { lower: true, strict: true });

    // Gracefully add fragrance note columns if they don't exist
    await db.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS top_notes TEXT,
        ADD COLUMN IF NOT EXISTS heart_notes TEXT,
        ADD COLUMN IF NOT EXISTS base_notes TEXT,
        ADD COLUMN IF NOT EXISTS scent_family VARCHAR(100),
        ADD COLUMN IF NOT EXISTS longevity VARCHAR(100),
        ADD COLUMN IF NOT EXISTS sillage VARCHAR(100),
        ADD COLUMN IF NOT EXISTS season VARCHAR(100),
        ADD COLUMN IF NOT EXISTS occasion VARCHAR(100)
    `).catch(() => {});

    // Add compare_price to variants if not exists
    await db.query(`
      ALTER TABLE variants ADD COLUMN IF NOT EXISTS compare_price NUMERIC(10,2)
    `).catch(() => {});

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO products(name,slug,description,price,compare_price,stock,category,is_featured,meta_title,meta_description,hsn_code,gst_rate,top_notes,heart_notes,base_notes,scent_family,longevity,sillage,season,occasion)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [name, slug, sanitizeHtml(description), parseFloat(price), compare_price ? parseFloat(compare_price) : null,
       parseInt(stock) || 0, category || null, is_featured, meta_title || null, meta_description || null,
       hsn || null, gst ? parseFloat(gst) : 18,
       top_notes || null, heart_notes || null, base_notes || null,
       scent_family || null, longevity || null, sillage || null, season || null, occasion || null]
    );
    const product = rows[0];

    let uploadedCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url, public_id, width, height } = await uploadImage(buffer);
      
      await client.query(
        'INSERT INTO product_images(product_id,url,public_id,is_primary,sort_order,width,height) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [product.id, url, public_id, uploadedCount === 0, uploadedCount, width || null, height || null]
      );
      uploadedCount++;
    }

    const variants = (() => { try { return JSON.parse(variantsRaw || '[]'); } catch { return []; } })();
    for (const v of variants) {
      const basePrice = parseFloat(price);
      const variantPrice = parseFloat(v.price) || basePrice;
      const modifier = variantPrice - basePrice;
      await client.query(
        'INSERT INTO variants(product_id,type,value,price_modifier,stock,compare_price) VALUES($1,$2,$3,$4,$5,$6)',
        [product.id, v.type, v.value, modifier, v.stock || 0, v.compare_price ? parseFloat(v.compare_price) : null]
      );
    }

    await client.query('COMMIT');
    await cache.delPattern('products:*');
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Product creation failed:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 });
  } finally {
    client.release();
  }
}
