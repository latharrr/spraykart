import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import slugify from 'slugify';

const stripTags = (str) => str ? str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 5000) : null;

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
        (SELECT url FROM product_images WHERE product_id=p.id AND is_primary=true LIMIT 1) as image,
        (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id
         WHERE oi.product_id=p.id AND o.status!='cancelled') as units_sold
      FROM products p ORDER BY p.created_at DESC`);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    const variantsRaw = formData.get('variants');

    if (!name || !price) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });

    const slug = slugify(name, { lower: true, strict: true });

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO products(name,slug,description,price,compare_price,stock,category,is_featured,meta_title,meta_description)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, slug, stripTags(description), parseFloat(price), compare_price ? parseFloat(compare_price) : null,
       parseInt(stock) || 0, category || null, is_featured, meta_title || null, meta_description || null]
    );
    const product = rows[0];

    const imageFiles = formData.getAll('images');
    let uploadedCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!(file instanceof File) || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { url, public_id } = await uploadImage(buffer);
      
      await client.query(
        'INSERT INTO product_images(product_id,url,public_id,is_primary,sort_order) VALUES($1,$2,$3,$4,$5)',
        [product.id, url, public_id, uploadedCount === 0, uploadedCount]
      );
      uploadedCount++;
    }

    const variants = (() => { try { return JSON.parse(variantsRaw || '[]'); } catch { return []; } })();
    for (const v of variants) {
      await client.query('INSERT INTO variants(product_id,type,value,stock) VALUES($1,$2,$3,$4)', [product.id, v.type, v.value, v.stock || 0]);
    }

    await client.query('COMMIT');
    await cache.delPattern('products:*');
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Product creation failed:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
}
