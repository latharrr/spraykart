import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import slugify from 'slugify';
import { logAdminAction } from '@/lib/audit';
import { validateProductImageFiles } from '@/lib/uploadLimits';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

// Allow safe HTML formatting tags; strip dangerous ones
const sanitizeHtml = (str) => {
  if (!str) return null;
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

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id=$1', [params.id]);
    if (!rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const product = rows[0];

    const [images, variants] = await Promise.all([
      db.query('SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order', [product.id]),
      db.query('SELECT * FROM variants WHERE product_id=$1', [product.id])
    ]);

    return NextResponse.json({ ...product, images: images.rows, variants: variants.rows });
  } catch (err) {
    logger.error('Admin product GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const { rows: beforeRows } = await db.query('SELECT * FROM products WHERE id=$1', [params.id]);
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const price = formData.get('price');
    const compare_price = formData.get('compare_price');
    const stock = formData.get('stock');
    const category = formData.get('category');
    const is_featured = formData.get('is_featured');
    const is_active = formData.get('is_active');
    const hsn = formData.get('hsn');
    const gst = formData.get('gst');
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

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

    // Ensure fragrance/variant columns exist
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

    await db.query(`
      ALTER TABLE variants ADD COLUMN IF NOT EXISTS compare_price NUMERIC(10,2)
    `).catch(() => {});

    // Ensure image dimension columns exist
    await db.query(`
      ALTER TABLE product_images
        ADD COLUMN IF NOT EXISTS width INTEGER,
        ADD COLUMN IF NOT EXISTS height INTEGER
    `).catch(() => {});

    const { rows } = await db.query(
      `UPDATE products SET
        name=COALESCE($1,name), slug=COALESCE($2,slug),
        description=COALESCE($3,description), price=COALESCE($4,price),
        compare_price=$5, stock=COALESCE($6,stock),
        category=COALESCE($7,category),
        is_featured=COALESCE($8,is_featured),
        is_active=COALESCE($9,is_active),
        hsn_code=COALESCE($10,hsn_code),
        gst_rate=COALESCE($11,gst_rate),
        top_notes=COALESCE($12,top_notes),
        heart_notes=COALESCE($13,heart_notes),
        base_notes=COALESCE($14,base_notes),
        scent_family=COALESCE($15,scent_family),
        longevity=COALESCE($16,longevity),
        sillage=COALESCE($17,sillage),
        season=COALESCE($18,season),
        occasion=COALESCE($19,occasion)
       WHERE id=$20 RETURNING *`,
      [name, slug,
       description !== null ? sanitizeHtml(description) : undefined,
       price ? parseFloat(price) : undefined,
       compare_price ? parseFloat(compare_price) : null,
       stock ? parseInt(stock) : undefined, category || undefined,
       is_featured !== null ? is_featured === 'true' : undefined,
       is_active !== null ? is_active === 'true' : undefined,
       hsn || undefined,
       gst ? parseFloat(gst) : undefined,
       top_notes || undefined,
       heart_notes || undefined,
       base_notes || undefined,
       scent_family || undefined,
       longevity || undefined,
       sillage || undefined,
       season || undefined,
       occasion || undefined,
       params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (beforeRows.length && price && Number(beforeRows[0].price) !== Number(rows[0].price)) {
      await logAdminAction({
        adminId: user.id,
        action: 'product.price_change',
        targetType: 'product',
        targetId: params.id,
        before: { price: beforeRows[0].price, compare_price: beforeRows[0].compare_price },
        after: { price: rows[0].price, compare_price: rows[0].compare_price },
        request,
      });
    }

    if (imageFiles.length > 0) {
      const { rows: existingImages } = await db.query('SELECT id FROM product_images WHERE product_id = $1 AND is_primary = true', [params.id]);
      let hasPrimary = existingImages.length > 0;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, public_id, width, height } = await uploadImage(buffer);
        
        await db.query(
          'INSERT INTO product_images(product_id,url,public_id,is_primary,sort_order,width,height) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [params.id, url, public_id, !hasPrimary, i, width || null, height || null]
        );
        hasPrimary = true;
      }
    }

    const variantsRaw = formData.get('variants');
    if (variantsRaw) {
      const variants = (() => { try { return JSON.parse(variantsRaw); } catch { return []; } })();
      await db.query('DELETE FROM variants WHERE product_id=$1', [params.id]);
      if (variants.length > 0) {
        const basePrice = price ? parseFloat(price) : parseFloat(rows[0].price);
        for (const v of variants) {
          const variantPrice = parseFloat(v.price) || basePrice;
          const modifier = variantPrice - basePrice;
          await db.query(
            'INSERT INTO variants(product_id,type,value,price_modifier,stock,compare_price) VALUES($1,$2,$3,$4,$5,$6)',
            [params.id, v.type, v.value, modifier, v.stock || 0, v.compare_price ? parseFloat(v.compare_price) : null]
          );
        }
      }
    }

    const deletedImagesRaw = formData.get('deleted_images');
    if (deletedImagesRaw) {
      const deletedImages = (() => { try { return JSON.parse(deletedImagesRaw); } catch { return []; } })();
      if (deletedImages.length > 0) {
        await Promise.allSettled(deletedImages.map(publicId => deleteImage(publicId)));
        const placeholders = deletedImages.map((_, i) => `$${i + 2}`).join(',');
        await db.query(`DELETE FROM product_images WHERE product_id=$1 AND public_id IN (${placeholders})`, [params.id, ...deletedImages]);
        
        const { rows: rem } = await db.query('SELECT id FROM product_images WHERE product_id=$1 AND is_primary=true', [params.id]);
        if (rem.length === 0) {
          await db.query('UPDATE product_images SET is_primary=true WHERE id IN (SELECT id FROM product_images WHERE product_id=$1 ORDER BY sort_order ASC LIMIT 1)', [params.id]);
        }
      }
    }

    await Promise.all([cache.delPattern('products:*'), cache.del(`product:${rows[0].slug}`), cache.del('products:featured:home')]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error('Admin product PUT failed:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const { rows: product } = await db.query('SELECT * FROM products WHERE id=$1', [params.id]);
    if (!product.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const { rows: orderCheck } = await db.query('SELECT 1 FROM order_items WHERE product_id=$1 LIMIT 1', [params.id]);
    if (orderCheck.length) {
      return NextResponse.json({ error: 'Cannot delete product with existing orders. Deactivate it instead.' }, { status: 409 });
    }

    const { rows: images } = await db.query('SELECT public_id FROM product_images WHERE product_id=$1', [params.id]);
    await Promise.allSettled(images.filter(img => img.public_id).map(img => deleteImage(img.public_id)));
    await db.query('DELETE FROM products WHERE id=$1', [params.id]);
    await logAdminAction({
      adminId: user.id,
      action: 'product.delete',
      targetType: 'product',
      targetId: params.id,
      before: product[0],
      after: null,
      request,
    });
    await Promise.all([cache.delPattern('products:*'), cache.del(`product:${product[0].slug}`)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Admin product DELETE failed:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
