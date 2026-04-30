const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// ── CONFIG ──────────────────────────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL;
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}
if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  throw new Error('Missing Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false
});

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
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

function extractCategory(shopifyCat, gender) {
  const parts = (shopifyCat || '').split('>');
  return parts.pop().trim();
}

function normalizeCategory(raw) {
  const c = (raw || '').toLowerCase();
  if (c.includes('attar')) return 'Attar';
  if (c.includes('gift')) return 'Gift Sets';
  if (c.includes('unisex')) return 'Unisex';
  if (c.includes('women') || c.includes('female')) return 'Women';
  if (c.includes('men') || c.includes('male')) return 'Men';
  return 'Unisex';
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const chunks = [];
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: 'spraykart/products',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }] 
      },
      (err, result) => err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id })
    );
    require('stream').Readable.from(buffer).pipe(stream);
  });
}

async function run(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log(`\n Parsing Shopify CSV: ${csvPath}`);
  console.log(` Total rows: ${rows.length}`);

  // ── STEP 1: Group rows by Handle ──────────────────────────────────────────
  const productMap = new Map();

  for (const row of rows) {
    const handle = row['Handle'];
    if (!handle) continue;

    // First row for this handle = master data
    if (!productMap.has(handle)) {
      const shopifyCat = row['Product Category'] || '';
      const gender     = row['Target gender (product.metafields.shopify.target-gender)'] || '';
      const rawCat     = extractCategory(shopifyCat, gender);

      productMap.set(handle, {
        handle,
        name:        row['Title']             || '',
        description: row['Body (HTML)']       || row['Body(HTML)'] || '',
        seoTitle:    row['SEO Title']         || '',
        seoDesc:     row['SEO Description']   || '',
        status:      row['Status']            || 'active',
        published:   (row['Published'] || '').toLowerCase() !== 'false',
        category:    normalizeCategory(rawCat),
        gender,
        images:      [],   // { src, position }
        variants:    [],   // { size, price, comparePrice, stock }
      });
    }

    const p = productMap.get(handle);

    // Update name/description if this row has them
    if (row['Title'])                p.name        = row['Title'];
    if (row['Body (HTML)'])          p.description = row['Body (HTML)'];
    if (row['Body(HTML)'])           p.description = row['Body(HTML)'];

    // ── Collect images ──────────────────────────────────────────────────────
    const imgSrc = row['Image Src'];
    if (imgSrc && imgSrc.startsWith('http') && !isCertificateImage(imgSrc)) {
      const pos = parseInt(row['Image Position'] || '99');
      if (!p.images.find(i => i.src === imgSrc)) {
        p.images.push({ src: imgSrc, position: pos });
      }
    }

    // ── Collect variants ────────────────────────────────────────────────────
    const variantPrice = parseFloat(row['Variant Price']);
    if (variantPrice > 0) {
      const size         = row['Option1 Value'] || 'Standard';
      const comparePrice = parseFloat(row['Variant Compare At Price']) || 0;
      const stock        = parseInt(row['Variant Inventory Qty'] || '0');

      // Avoid duplicate sizes for same product
      if (!p.variants.find(v => v.size === size)) {
        p.variants.push({ size, price: variantPrice, comparePrice, stock });
      }
    }
  }

  console.log(`️  Unique products: ${productMap.size}\n`);
  console.log('─'.repeat(50));

  // ── STEP 2: Insert each product ───────────────────────────────────────────
  let inserted = 0, skipped = 0, failed = 0;

  for (const [handle, p] of productMap) {

    // Skip products with no name or price
    if (!p.name || !p.variants.length) {
      console.log(`⚠️  Skip (no name/price): ${handle}`);
      skipped++;
      continue;
    }

    // Check if already in DB
    const exists = await pool.query(
      'SELECT id FROM products WHERE slug=$1', [handle]
    );
    if (exists.rows.length) {
      console.log(`⏭️  Already exists: ${p.name}`);
      skipped++;
      continue;
    }

    // Sort images by position
    p.images.sort((a, b) => a.position - b.position);

    // Calculate prices
    const prices        = p.variants.map(v => v.price);
    const comparePrices = p.variants.map(v => v.comparePrice).filter(c => c > 0);
    const basePrice     = Math.min(...prices);
    const comparePrice  = comparePrices.length ? Math.max(...comparePrices) : null;
    const totalStock    = p.variants.reduce((s, v) => s + v.stock, 0);
    const isActive      = p.status === 'active' && p.published;

    const fakeVariant = p.variants.length === 1 && (
      p.variants[0].size.toLowerCase().includes('default') ||
      p.variants[0].size.toLowerCase() === 'variants' ||
      p.variants[0].size.toLowerCase() === 'variant'
    );
    const hasVariants = p.variants.length > 1 || !fakeVariant;

    console.log(`\n ${p.name}`);
    console.log(`   Category: ${p.category} | Price: ₹${basePrice} | Stock: ${totalStock}`);
    console.log(`   Variants: ${p.variants.length} | Images: ${p.images.length}`);

    const client = await pool.connect();
    let productId;

    try {
      await client.query('BEGIN');

      // Insert product
      const { rows: pRows } = await client.query(
        `INSERT INTO products
           (name, slug, description, price, compare_price,
            stock, category, is_active, is_featured,
            meta_title, meta_description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          p.name,
          handle,
          stripHtml(p.description),
          basePrice,
          comparePrice,
          totalStock,
          p.category,
          isActive,
          false,
          p.seoTitle || p.name,
          p.seoDesc  || stripHtml(p.description).slice(0, 160),
        ]
      );
      productId = pRows[0].id;

      // Insert variants
      if (hasVariants) {
        for (const v of p.variants) {
          const modifier = v.price - basePrice;
          await client.query(
            `INSERT INTO variants (product_id, type, value, price_modifier, stock)
             VALUES ($1, $2, $3, $4, $5)`,
            [productId, 'Size', v.size, modifier, v.stock]
          );
          console.log(`   ➕ ${v.size} — ₹${v.price} (stock: ${v.stock})`);
        }
      }

      await client.query('COMMIT');

    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error(`   ❌ DB Error: ${err.message}`);
      failed++;
      continue;
    }

    client.release();

    // Upload images
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      try {
        process.stdout.write(`   ️  Image ${i+1}/${p.images.length} uploading...`);
        const buffer          = await downloadImage(img.src);
        const { url, public_id } = await uploadToCloudinary(buffer);

        await pool.query(
          `INSERT INTO product_images
             (product_id, url, public_id, is_primary, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [productId, url, public_id, i === 0, i]
        );
        process.stdout.write(` ✅\n`);
        await sleep(300);

      } catch (imgErr) {
        process.stdout.write(` ❌ ${imgErr.message}\n`);
      }
    }

    console.log(`   ✅ Done`);
    inserted++;
  }

  console.log(`
${'─'.repeat(50)}
  ✅ Inserted : ${inserted}
  ⏭️  Skipped  : ${skipped}
  ❌ Failed   : ${failed}
${'─'.repeat(50)}
  `);

  await pool.end();
}

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/import-shopify.js path/to/products.csv');
  process.exit(1);
}

run(file).catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
