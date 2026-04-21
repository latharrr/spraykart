import { NextResponse } from 'next/server';
import db from '@/lib/db';
import cache from '@/lib/cache';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import slugify from 'slugify';

const stripTags = (str) => str ? str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, 5000) : null;

async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  if (user.role !== 'admin') return { error: forbidden() };
  return { user };
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const price = formData.get('price');
    const compare_price = formData.get('compare_price');
    const stock = formData.get('stock');
    const category = formData.get('category');
    const is_featured = formData.get('is_featured');
    const is_active = formData.get('is_active');
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

    const { rows } = await db.query(
      `UPDATE products SET
        name=COALESCE($1,name), slug=COALESCE($2,slug),
        description=COALESCE($3,description), price=COALESCE($4,price),
        compare_price=$5, stock=COALESCE($6,stock),
        category=COALESCE($7,category),
        is_featured=COALESCE($8,is_featured),
        is_active=COALESCE($9,is_active)
       WHERE id=$10 RETURNING *`,
      [name, slug,
       description !== null ? stripTags(description) : undefined,
       price ? parseFloat(price) : undefined,
       compare_price ? parseFloat(compare_price) : null,
       stock ? parseInt(stock) : undefined, category || undefined,
       is_featured !== null ? is_featured === 'true' : undefined,
       is_active !== null ? is_active === 'true' : undefined,
       params.id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const imageFiles = formData.getAll('images');
    for (let i = 0; i < imageFiles.length; i++) {
      if (!(imageFiles[i] instanceof File)) continue;
      const buffer = Buffer.from(await imageFiles[i].arrayBuffer());
      const { url, public_id } = await uploadImage(buffer);
      await db.query('INSERT INTO product_images(product_id,url,public_id,sort_order) VALUES($1,$2,$3,$4)', [params.id, url, public_id, i]);
    }

    await Promise.all([cache.delPattern('products:*'), cache.del(`product:${rows[0].slug}`)]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { rows: product } = await db.query('SELECT slug FROM products WHERE id=$1', [params.id]);
    if (!product.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const { rows: images } = await db.query('SELECT public_id FROM product_images WHERE product_id=$1', [params.id]);
    await Promise.allSettled(images.filter(img => img.public_id).map(img => deleteImage(img.public_id)));
    await db.query('DELETE FROM products WHERE id=$1', [params.id]);
    await Promise.all([cache.delPattern('products:*'), cache.del(`product:${product[0].slug}`)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
