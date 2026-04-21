#!/usr/bin/env node
// Usage: node importShopify.js --file=products_export.csv
// Exports from Shopify Admin → Products → Export → All products

const fs = require('fs');
const csv = require('csv-parser');
const slugify = require('slugify');
const db = require('../config/db');
require('dotenv').config({ path: '../../.env' });

const filePath = process.argv.find(a => a.startsWith('--file='))?.split('=')[1];
if (!filePath) {
  console.error('Usage: node importShopify.js --file=FILE');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const products = new Map();

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    const handle = row['Handle'];
    if (!handle) return;

    if (!products.has(handle)) {
      products.set(handle, {
        name: row['Title'],
        slug: slugify(row['Title'] || handle, { lower: true, strict: true }),
        description: row['Body (HTML)']?.replace(/<[^>]*>/g, '').trim(),
        price: parseFloat(row['Variant Price']) || 0,
        stock: parseInt(row['Variant Inventory Qty']) || 0,
        category: row['Type'] || 'Uncategorized',
        image: row['Image Src'] || null,
        variants: [],
      });
    }

    if (row['Option1 Name'] && row['Option1 Value'] && row['Option1 Value'] !== 'Default Title') {
      products.get(handle).variants.push({
        type: row['Option1 Name'].toLowerCase(),
        value: row['Option1 Value'],
        stock: parseInt(row['Variant Inventory Qty']) || 0,
      });
    }
  })
  .on('end', async () => {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`\nImporting ${products.size} products...\n`);

    for (const [handle, product] of products) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        const { rows } = await client.query(
          `INSERT INTO products(name,slug,description,price,stock,category)
           VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT (slug) DO NOTHING RETURNING id`,
          [product.name, product.slug, product.description, product.price, product.stock, product.category]
        );

        if (!rows.length) {
          skipped++;
          await client.query('ROLLBACK');
          console.log(`  ⏭️  Skipped (duplicate slug): ${product.slug}`);
          continue;
        }

        const productId = rows[0].id;

        if (product.image) {
          await client.query(
            'INSERT INTO product_images(product_id,url,is_primary,sort_order) VALUES($1,$2,true,0)',
            [productId, product.image]
          );
        }

        for (const v of product.variants) {
          await client.query(
            'INSERT INTO variants(product_id,type,value,stock) VALUES($1,$2,$3,$4)',
            [productId, v.type, v.value, v.stock]
          );
        }

        await client.query('COMMIT');
        imported++;
        console.log(`  ✅ ${product.name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        errors++;
        console.error(`  ❌ ${product.name || handle}: ${err.message}`);
      } finally {
        client.release();
      }
    }

    console.log(`\n─────────────────────────────`);
    console.log(`✅ Imported : ${imported}`);
    console.log(`⏭️  Skipped  : ${skipped}`);
    console.log(`❌ Errors   : ${errors}`);
    process.exit(0);
  });
