import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser, unauthorized, forbidden } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim().slice(0, 5000);
}

function isCertificateImage(url) {
  const l = (url || '').toLowerCase();
  return l.includes('certificate') || l.includes('authenticity') || l.includes('cert');
}

function normalizeCategory(raw, gender) {
  const c = (raw || '').toLowerCase();
  const g = (gender || '').toLowerCase();
  if (c.includes('attar'))   return 'Attar';
  if (c.includes('gift'))    return 'Gift Sets';
  if (c.includes('unisex') || g === 'unisex') return 'Unisex';
  if (c.includes('women') || c.includes('female') || g === 'female') return 'Women';
  if (c.includes('men') || c.includes('male') || g === 'male') return 'Men';
  return 'Unisex';
}

async function downloadImage(url) {
  const https = require('https');
  const http  = require('http');
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const chunks = [];
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'spraykart/products',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }] },
      (err, result) => err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id })
    );
    require('stream').Readable.from(buffer).pipe(stream);
  });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)             return unauthorized();
  if (user.role !== 'admin') return forbidden();

  try {
    const formData = await request.formData();
    const file     = formData.get('csv');
    if (!file) return NextResponse.json({ error: 'No CSV file uploaded' }, { status: 400 });

    const text = await file.text();
    const rows = parse(text, {
      columns:          true,
      skip_empty_lines: true,
      trim:             true,
      bom:              true,
    });

    // ── Group by Handle ──────────────────────────────────────────────────────
    const productMap = new Map();

    for (const row of rows) {
      const handle = row['Handle'];
      if (!handle) continue;

      if (!productMap.has(handle)) {
        const shopifyCat = row['Product Category'] || '';
        const gender     = row['Target gender (product.metafields.shopify.target-gender)'] || '';
        const lastCat    = shopifyCat.split('>').pop().trim();

        productMap.set(handle, {
          handle,
          name:        row['Title'] || '',
          description: row['Body (HTML)'] || row['Body(HTML)'] || '',
          seoTitle:    row['SEO Title']       || '',
          seoDesc:     row['SEO Description'] || '',
          status:      row['Status']          || 'active',
          published:   (row['Published'] || '').toLowerCase() !== 'false',
          category:    normalizeCategory(lastCat, gender),
          images:      [],
          variants:    [],
        });
      }

      const p = productMap.get(handle);
      if (row['Title'])         p.name        = row['Title'];
      if (row['Body (HTML)'])   p.description = row['Body (HTML)'];
      if (row['Body(HTML)'])    p.description = row['Body(HTML)'];

      const imgSrc = row['Image Src'];
      if (imgSrc?.startsWith('http') && !isCertificateImage(imgSrc)) {
        const pos = parseInt(row['Image Position'] || '99');
        if (!p.images.find(i => i.src === imgSrc)) {
          p.images.push({ src: imgSrc, position: pos });
        }
      }

      const vPrice = parseFloat(row['Variant Price']);
      if (vPrice > 0) {
        const size = row['Option1 Value'] || 'Standard';
        if (!p.variants.find(v => v.size === size)) {
          p.variants.push({
            size,
            price:        vPrice,
            comparePrice: parseFloat(row['Variant Compare At Price']) || 0,
            stock:        parseInt(row['Variant Inventory Qty'] || '0'),
          });
        }
      }
    }

    // ── Insert products ──────────────────────────────────────────────────────
    const results = { inserted: 0, skipped: 0, failed: 0, errors: [] };

    for (const [handle, p] of productMap) {
      if (!p.name || !p.variants.length) {
        results.skipped++;
        continue;
      }

      const exists = await db.query('SELECT id FROM products WHERE slug=$1', [handle]);
      if (exists.rows.length) { results.skipped++; continue; }

      p.images.sort((a, b) => a.position - b.position);

      const prices       = p.variants.map(v => v.price);
      const comparePrices = p.variants.map(v => v.comparePrice).filter(c => c > 0);
      const basePrice    = Math.min(...prices);
      const comparePrice = comparePrices.length ? Math.max(...comparePrices) : null;
      const totalStock   = p.variants.reduce((s, v) => s + v.stock, 0);

      const fakeVariant = p.variants.length === 1 && (
        p.variants[0].size.toLowerCase().includes('default') ||
        p.variants[0].size.toLowerCase() === 'variants' ||
        p.variants[0].size.toLowerCase() === 'variant'
      );
      const hasVariants = p.variants.length > 1 || !fakeVariant;

      const client = await db.connect();
      let productId;

      try {
        await client.query('BEGIN');

        const { rows: pRows } = await client.query(
          `INSERT INTO products
             (name, slug, description, price, compare_price,
              stock, category, is_active, is_featured, meta_title, meta_description)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [
            p.name, handle, stripHtml(p.description),
            basePrice, comparePrice, totalStock,
            p.category, p.status === 'active' && p.published,
            false,
            p.seoTitle || p.name,
            p.seoDesc  || stripHtml(p.description).slice(0, 160),
          ]
        );
        productId = pRows[0].id;

        if (hasVariants) {
          for (const v of p.variants) {
            await client.query(
              `INSERT INTO variants (product_id, type, value, price_modifier, stock)
               VALUES ($1,'Size',$2,$3,$4)`,
              [productId, v.size, v.price - basePrice, v.stock]
            );
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        results.failed++;
        results.errors.push(`${p.name}: ${err.message}`);
        continue;
      }
      client.release();

      // Upload images
      for (let i = 0; i < p.images.length; i++) {
        try {
          const buffer = await downloadImage(p.images[i].src);
          const { url, public_id } = await uploadToCloudinary(buffer);
          await db.query(
            `INSERT INTO product_images (product_id, url, public_id, is_primary, sort_order)
             VALUES ($1,$2,$3,$4,$5)`,
            [productId, url, public_id, i === 0, i]
          );
          await sleep(300);
        } catch (imgErr) {
          // Don't fail product for one bad image
        }
      }

      results.inserted++;
    }

    return NextResponse.json({
      success: true,
      total:    productMap.size,
      ...results,
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
