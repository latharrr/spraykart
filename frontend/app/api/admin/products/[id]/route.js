import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import slugify from 'slugify';
import { logAdminAction } from '@/lib/audit';

const stripTags = (str) => str ? str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 5000) : null;

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
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const { rows } = await db.query(
      `UPDATE products SET
        name=COALESCE($1,name), slug=COALESCE($2,slug),
        description=COALESCE($3,description), price=COALESCE($4,price),
        compare_price=$5, stock=COALESCE($6,stock),
        category=COALESCE($7,category),
        is_featured=COALESCE($8,is_featured),
        is_active=COALESCE($9,is_active),
        hsn_code=COALESCE($10,hsn_code),
        gst_rate=COALESCE($11,gst_rate)
       WHERE id=$12 RETURNING *`,
      [name, slug,
       description !== null ? stripTags(description) : undefined,
       price ? parseFloat(price) : undefined,
       compare_price ? parseFloat(compare_price) : null,
       stock ? parseInt(stock) : undefined, category || undefined,
       is_featured !== null ? is_featured === 'true' : undefined,
       is_active !== null ? is_active === 'true' : undefined,
       hsn || undefined,
       gst ? parseFloat(gst) : undefined,
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

    const imageFiles = formData.getAll('images');
    if (imageFiles.length > 0) {
      // Check if product already has any images (to determine if first new one should be primary)
      const { rows: existingImages } = await db.query('SELECT id FROM product_images WHERE product_id = $1 AND is_primary = true', [params.id]);
      let hasPrimary = existingImages.length > 0;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (!(file instanceof File) || file.size === 0) continue;

        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, public_id } = await uploadImage(buffer);
        
        await db.query(
          'INSERT INTO product_images(product_id,url,public_id,is_primary,sort_order) VALUES($1,$2,$3,$4,$5)',
          [params.id, url, public_id, !hasPrimary, i]
        );
        hasPrimary = true; // Only the first one added becomes primary if none existed
      }
    }

    const variantsRaw = formData.get('variants');
    if (variantsRaw) {
      const variants = (() => { try { return JSON.parse(variantsRaw); } catch { return []; } })();
      if (variants.length > 0) {
        await db.query('DELETE FROM variants WHERE product_id=$1', [params.id]);
        const basePrice = price ? parseFloat(price) : parseFloat(rows[0].price);
        for (const v of variants) {
          const modifier = v.price !== null ? v.price - basePrice : 0;
          await db.query('INSERT INTO variants(product_id,type,value,price_modifier,stock) VALUES($1,$2,$3,$4,$5)', [params.id, v.type, v.value, modifier, v.stock || 0]);
        }
      } else {
        await db.query('DELETE FROM variants WHERE product_id=$1', [params.id]);
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
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
